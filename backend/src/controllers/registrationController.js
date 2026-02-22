const Course = require('../models/Course');
const Registration = require('../models/Registration');
const Timetable = require('../models/Timetable');
const logActivity = require('../utils/activityLogger');
const { sendRegistrationConfirmation } = require('../utils/emailService');

// @desc    Get all courses available for registration (for student's dept/sem)
// @route   GET /api/registrations/courses
// @access  Student
const getAvailableCourses = async (req, res, next) => {
  try {
    const { department, semester, academicYear } = req.query;
    const dept = department || req.user.department;
    const sem  = Number(semester) || req.user.semester;

    if (!dept) {
      return res.status(400).json({ success: false, message: 'Your profile has no department set. Please contact admin.' });
    }

    // Fetch all courses for this dept+sem (case-insensitive department match)
    const courses = await Course.find({
      department: { $regex: new RegExp(`^${dept.trim()}$`, 'i') },
      semester: sem,
      isActive: true,
    }).sort({ code: 1 });

    // Fetch this student's existing registrations (no academicYear filter to avoid year mismatch)
    const myRegs = await Registration.find({
      student: req.user._id,
      status: 'REGISTERED',
      status: 'REGISTERED',
    }).select('course');

    const registeredIds = new Set(myRegs.map((r) => r.course.toString()));

    // Get slot info from latest timetable for this dept+sem
    const timetable = await Timetable.findOne({
      department: dept,
      semester: sem,
      status: { $in: ['PUBLISHED', 'GENERATED'] },
    })
      .sort({ createdAt: -1 })
      .populate('schedule.course', '_id')
      .populate('schedule.faculty', 'name')
      .populate('schedule.room', 'roomNumber');

    // Build slot map: courseId → [{ day, startTime, endTime, room, faculty }]
    const slotMap = {};
    timetable?.schedule?.forEach((entry) => {
      const cid = entry.course?._id?.toString();
      if (!cid) return;
      if (!slotMap[cid]) slotMap[cid] = [];
      slotMap[cid].push({
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        sessionType: entry.sessionType,
        room: entry.room?.roomNumber,
        faculty: entry.faculty?.name,
      });
    });

    const result = courses.map((c) => ({
      ...c.toObject(),
      slots: slotMap[c._id.toString()] || [],
      isRegistered: registeredIds.has(c._id.toString()),
    }));

    res.json({ success: true, courses: result });
  } catch (err) { next(err); }
};

// @desc    Register for a course (with clash detection)
// @route   POST /api/registrations
// @access  Student
const registerCourse = async (req, res, next) => {
  try {
    const { courseId, academicYear } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Indian academic year: July–June. Jan–June 2026 → "2025-26"
    const now = new Date();
    const startYear = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
    const year = academicYear || `${startYear}-${String(startYear + 1).slice(2)}`;

    // Check already registered (no academicYear filter to avoid year mismatch)
    const existing = await Registration.findOne({ student: req.user._id, course: courseId, status: 'REGISTERED' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already registered for this course' });
    }

    // --- Clash detection ---
    // Get slots occupied by this new course in the timetable
    const timetable = await Timetable.findOne({
      department: course.department,
      semester: course.semester,
      status: { $in: ['PUBLISHED', 'GENERATED'] },
    })
      .sort({ createdAt: -1 });

    if (timetable) {
      const newSlots = timetable.schedule
        .filter((e) => e.course?.toString() === courseId)
        .map((e) => `${e.day}_${e.timeSlotId}`);

      // Get all courses the student is already registered for (no year filter)
      const myRegs = await Registration.find({
        student: req.user._id,
        status: 'REGISTERED',
      }).select('course');

      const myRegisteredIds = myRegs.map((r) => r.course.toString());

      // Get timetable slots for registered courses
      const occupiedSlots = new Set(
        timetable.schedule
          .filter((e) => myRegisteredIds.includes(e.course?.toString()))
          .map((e) => `${e.day}_${e.timeSlotId}`)
      );

      const clashes = newSlots.filter((s) => occupiedSlots.has(s));
      if (clashes.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Timetable clash detected! This course conflicts with ${clashes.length} slot(s) you are already registered for.`,
        });
      }
    }

    // Upsert registration
    const reg = await Registration.findOneAndUpdate(
      { student: req.user._id, course: courseId, academicYear: year },
      { student: req.user._id, course: courseId, academicYear: year, semester: course.semester, status: 'REGISTERED', registeredAt: new Date(), droppedAt: null },
      { upsert: true, new: true }
    );

    await reg.populate('course', 'code name credits type semester');

    // ▶ Activity log
    logActivity({
      actor:      req.user.name,
      actorRole:  'STUDENT',
      action:     'REGISTERED',
      entity:     'Course',
      entityName: `${course.code} – ${course.name}`,
      details:    `${req.user.name} registered for ${course.code} (${course.name})`,
    });

    // ▶ Send confirmation email (non-blocking — failure won't affect response)
    sendRegistrationConfirmation({
      studentEmail: req.user.email,
      studentName:  req.user.name,
      courseCode:   course.code,
      courseName:   course.name,
      credits:      course.credits,
      department:   course.department,
      semester:     course.semester,
    });

    res.status(201).json({ success: true, message: `Successfully registered for ${course.name}`, registration: reg });
  } catch (err) { next(err); }
};

// @desc    Drop a registered course
// @route   DELETE /api/registrations/:courseId
// @access  Student
const dropCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // No academicYear filter — match by student+course+status only
    const reg = await Registration.findOneAndUpdate(
      { student: req.user._id, course: courseId, status: 'REGISTERED' },
      { status: 'DROPPED', droppedAt: new Date() },
      { new: true }
    );

    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });

    // ▶ Activity log
    logActivity({
      actor:      req.user.name,
      actorRole:  'STUDENT',
      action:     'DROPPED',
      entity:     'Course',
      entityName: courseId,
      details:    `${req.user.name} dropped course registration`,
    });

    res.json({ success: true, message: 'Course dropped successfully' });
  } catch (err) { next(err); }
};

// @desc    Get my registered courses
// @route   GET /api/registrations/my
// @access  Student
const getMyRegistrations = async (req, res, next) => {
  try {
    // No academicYear filter — return ALL active registrations regardless of stored year
    const regs = await Registration.find({
      student: req.user._id,
      status: 'REGISTERED',
    })
      .populate('course', 'code name credits type semester department hoursPerWeek')
      .sort({ registeredAt: -1 });

    const totalCredits = regs.reduce((sum, r) => sum + (r.course?.credits || 0), 0);

    res.json({ success: true, registrations: regs, totalCredits });
  } catch (err) { next(err); }
};

// @desc    Admin: view all registrations for a course
// @route   GET /api/registrations/course/:courseId
// @access  Admin
const getCourseRegistrations = async (req, res, next) => {
  try {
    const regs = await Registration.find({ course: req.params.courseId, status: 'REGISTERED' })
      .populate('student', 'name email semester division department')
      .sort({ registeredAt: 1 });
    res.json({ success: true, total: regs.length, registrations: regs });
  } catch (err) { next(err); }
};

module.exports = { getAvailableCourses, registerCourse, dropCourse, getMyRegistrations, getCourseRegistrations };
