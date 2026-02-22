const { GoogleGenerativeAI } = require('@google/generative-ai');
const Registration = require('../models/Registration');
const Timetable = require('../models/Timetable');
const Faculty = require('../models/Faculty');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are an AI assistant for TimetableGen AMIS (Academic Management Information System), a university timetable management portal built for Government of Tripura institutions under NEP 2020 and AICTE compliance.

Your role:
- Help students, faculty, and admins navigate the system confidently
- Answer questions about app features and workflows
- Provide personalized information using the user context provided below
- Keep answers concise, clear, and friendly

Application Features:
- STUDENT: Register/drop courses, view your personalised timetable
- FACULTY: View your assigned teaching schedule
- ADMIN: Manage courses, rooms, faculty, generate conflict-free timetables, manage users

Navigation Guide:
- Login → /login | Register → /register
- Student Dashboard → /student | Course Registration → /student/courses | Timetable → /timetable
- Faculty Dashboard → /faculty | Faculty Timetable → /timetable
- Admin Dashboard → /admin | Courses → /admin/courses | Faculty → /admin/faculty
- Rooms → /admin/rooms | Users → /admin/users | Generate Timetable → /admin/timetable

How Timetable Generation Works:
- Admin selects department + semester → system uses Hybrid CSP + Hill-Climbing algorithm
- Automatically avoids room conflicts, faculty double-booking, and scheduling constraints
- Generated timetables are published for students and faculty to view

How to Register for a Course:
1. Go to Course Registration (/student/courses)
2. Find your course in the list and click "Register"
3. You'll receive a confirmation

How to Drop a Course:
1. Go to Course Registration (/student/courses)
2. Find the course under "My Registrations" and click "Drop"

If the user asks something completely unrelated to the university portal, politely redirect them to ask about the application instead.`;

const chatbot = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({
        success: false,
        message: 'Chatbot is not configured. Please add GEMINI_API_KEY to your .env file.',
      });
    }

    // ── Build user context ─────────────────────────────────────────
    let userContext = '';

    if (req.user) {
      userContext += `\nLogged-in User: ${req.user.name} | Role: ${req.user.role} | Email: ${req.user.email}`;
      if (req.user.department) userContext += ` | Department: ${req.user.department}`;
      if (req.user.semester) userContext += ` | Semester: ${req.user.semester}`;

      // Student: registered courses + timetable
      if (req.user.role === 'STUDENT') {
        const regs = await Registration.find({
          student: req.user._id,
          status: 'REGISTERED',
        }).populate('course', 'name code credits');

        if (regs.length > 0) {
          userContext += `\nRegistered Courses (${regs.length}): ${regs
            .map((r) => `${r.course?.name} (${r.course?.code})`)
            .join(', ')}`;
        } else {
          userContext += `\nRegistered Courses: None yet`;
        }

        // Fetch published timetables for their dept+semester
        if (req.user.department && req.user.semester) {
          const timetables = await Timetable.find({
            department: req.user.department,
            semester: req.user.semester,
            status: 'PUBLISHED',
          })
            .populate('schedule.course', 'name code')
            .populate('schedule.faculty', 'name')
            .populate('schedule.room', 'name building');

          if (timetables.length > 0) {
            const entries = timetables.flatMap((t) => t.schedule).slice(0, 15);
            userContext += `\nYour Timetable: ${entries
              .map(
                (e) =>
                  `${e.course?.name} on ${e.day} ${e.startTime}–${e.endTime} in ${e.room?.name || 'TBD'} (${e.sessionType})`
              )
              .join('; ')}`;
          } else {
            userContext += `\nYour Timetable: Not published yet`;
          }
        }
      }

      // Faculty: teaching schedule
      if (req.user.role === 'FACULTY') {
        const facultyDoc = await Faculty.findOne({ user: req.user._id });
        if (facultyDoc) {
          const timetables = await Timetable.find({
            'schedule.faculty': facultyDoc._id,
            status: 'PUBLISHED',
          })
            .populate('schedule.course', 'name code')
            .populate('schedule.room', 'name building');

          if (timetables.length > 0) {
            const entries = timetables
              .flatMap((t) => t.schedule.filter((s) => String(s.faculty) === String(facultyDoc._id)))
              .slice(0, 15);
            userContext += `\nTeaching Schedule: ${entries
              .map(
                (e) =>
                  `${e.course?.name} on ${e.day} ${e.startTime}–${e.endTime} in ${e.room?.name || 'TBD'}`
              )
              .join('; ')}`;
          } else {
            userContext += `\nTeaching Schedule: Not published yet`;
          }
        }
      }
    }

    // ── Call Gemini ───────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction:
        SYSTEM_PROMPT + (userContext ? `\n\n--- Current User Context ---${userContext}` : ''),
    });

    // Map prior conversation history (last 10 turns)
    // Gemini requires history to start with a 'user' turn — drop any leading bot messages
    const rawHistory = history.slice(-10).map((h) => ({
      role: h.role === 'bot' ? 'model' : 'user',
      parts: [{ text: h.text }],
    }));
    const firstUserIdx = rawHistory.findIndex((h) => h.role === 'user');
    const safeHistory = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

    const chat = model.startChat({ history: safeHistory });
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    res.json({ success: true, reply });
  } catch (err) {
    logger.error(`Chatbot error: ${err.message}`);

    // Give meaningful error messages based on the error type
    const msg = err.message || '';
    let clientMessage = 'I\'m having trouble connecting right now. Please try again in a moment.';

    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      clientMessage = 'Chatbot is not configured correctly. Please contact the administrator.';
    } else if (msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      clientMessage = 'Chatbot is temporarily unavailable due to quota limits. Please try again later.';
    } else if (msg.includes('404') || msg.includes('not found')) {
      clientMessage = 'Chatbot service is unavailable. Please contact the administrator.';
    }

    // Return 200 with success:false so the frontend can display the message
    // without triggering the global 5xx toast handler
    return res.json({ success: false, message: clientMessage });
  }
};

module.exports = { chatbot };
