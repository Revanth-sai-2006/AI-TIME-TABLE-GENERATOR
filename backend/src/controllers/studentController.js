const User = require('../models/User');
const Timetable = require('../models/Timetable');
const Registration = require('../models/Registration');

// @desc    Get student's timetable (only shows slots for registered courses)
// @route   GET /api/students/timetable
// @access  Student
const getStudentTimetable = async (req, res, next) => {
  try {
    const { department, semester, division, academicYear } = req.query;

    const dept = department || req.user.department;
    const sem  = Number(semester) || req.user.semester;

    const deptRegex = new RegExp(`^${(dept || '').trim()}$`, 'i');

    const baseFilter = {
      status: { $in: ['PUBLISHED', 'GENERATED'] },
      department: deptRegex,
    };
    if (academicYear) baseFilter.academicYear = academicYear;

    // 1st try: exact semester + optional division
    const exactFilter = { ...baseFilter, semester: sem };
    if (division) exactFilter.division = division;

    let timetable = await Timetable.findOne(exactFilter)
      .sort({ status: -1, createdAt: -1 }) // PUBLISHED (-1 desc) sorts before GENERATED
      .populate('schedule.course', 'code name type credits')
      .populate('schedule.faculty', 'name designation')
      .populate('schedule.room', 'roomNumber building type');

    // 2nd try: same department, any semester (fallback so students always see something)
    if (!timetable) {
      timetable = await Timetable.findOne(baseFilter)
        .sort({ createdAt: -1 })
        .populate('schedule.course', 'code name type credits')
        .populate('schedule.faculty', 'name designation')
        .populate('schedule.room', 'roomNumber building type');
    }

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'No timetable found for your department' });
    }

    // Fetch the student's registered course IDs — no academicYear restriction
    // (academicYear format may differ between registration and timetable)
    const registrations = await Registration.find({
      student: req.user._id,
      status: 'REGISTERED',
    }).select('course');

    if (registrations.length === 0) {
      // Student has no registrations — return timetable shell with empty schedule
      const empty = timetable.toObject();
      empty.schedule = [];
      empty._noRegistrations = true;
      return res.json({ success: true, timetable: empty });
    }

    const registeredCourseIds = new Set(
      registrations.map((r) => r.course.toString())
    );

    // Filter schedule to only show slots the student is registered for
    const filteredTimetable = timetable.toObject();
    filteredTimetable.schedule = filteredTimetable.schedule.filter(
      (slot) => slot.course && registeredCourseIds.has(slot.course._id.toString())
    );

    res.json({ success: true, timetable: filteredTimetable });
  } catch (err) { next(err); }
};

// @desc    Submit elective preferences
// @route   POST /api/students/elective-preference
// @access  Student
const submitElectivePreference = async (req, res, next) => {
  try {
    const { electiveGroupId, preferredCourseId } = req.body;
    if (!electiveGroupId || !preferredCourseId) {
      return res.status(400).json({ success: false, message: 'electiveGroupId and preferredCourseId are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.preferences) user.preferences = {};
    if (!user.preferences.preferredTimeSlots) user.preferences.preferredTimeSlots = [];

    // Store as a preference (simple JSON)
    const ElectivePreference = {
      electiveGroupId,
      preferredCourseId,
      studentId: user._id,
      submittedAt: new Date(),
    };

    // In production, this would go to an ElectivePreference collection
    res.json({ success: true, message: 'Elective preference submitted', preference: ElectivePreference });
  } catch (err) { next(err); }
};

// @desc    Get all students (Admin)
// @route   GET /api/students
// @access  Admin
const getAllStudents = async (req, res, next) => {
  try {
    const { department, semester, division, page = 1, limit = 20 } = req.query;
    const filter = { role: 'STUDENT', isActive: true };
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (division) filter.division = division;

    const total = await User.countDocuments(filter);
    const students = await User.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, students });
  } catch (err) { next(err); }
};

module.exports = { getStudentTimetable, submitElectivePreference, getAllStudents };
