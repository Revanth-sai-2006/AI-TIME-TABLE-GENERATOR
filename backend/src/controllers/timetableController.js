const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Room = require('../models/Room');
const Registration = require('../models/Registration');
const schedulerService = require('../services/schedulerService');
const logger = require('../utils/logger');
const logActivity = require('../utils/activityLogger');

// @desc    Generate a new timetable
// @route   POST /api/timetables/generate
// @access  Admin
const generateTimetable = async (req, res, next) => {
  try {
    const { department, semester, academicYear, division, name } = req.body;
    if (!department || !semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'department, semester, and academicYear are required' });
    }

    // Check for existing active timetable
    const existing = await Timetable.findOne({ department, semester, academicYear, division, status: 'PUBLISHED' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A published timetable already exists for this semester. Archive it first.' });
    }

    // Create a placeholder
    const timetable = await Timetable.create({
      name: name || `${department} Sem-${semester} ${academicYear}`,
      department,
      semester,
      academicYear,
      division,
      status: 'GENERATING',
      'generationMeta.generatedBy': req.user._id,
    });

    // Fetch required data
    const [courses, faculty, rooms] = await Promise.all([
      Course.find({ department, semester, isActive: true }),
      Faculty.find({ department, isActive: true }),
      Room.find({ isActive: true }),
    ]);

    if (!courses.length) {
      await Timetable.findByIdAndDelete(timetable._id);
      return res.status(400).json({ success: false, message: 'No active courses found for this department/semester.' });
    }

    // Attach real enrollment counts so the scheduler can split sections if needed
    const enrollmentCounts = await Registration.aggregate([
      { $match: { academicYear, status: 'APPROVED', course: { $in: courses.map((c) => c._id) } } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]);
    const enrollMap = {};
    enrollmentCounts.forEach(({ _id, count }) => { enrollMap[_id.toString()] = count; });
    const coursesWithEnrollment = courses.map((c) => {
      const obj = c.toObject();
      obj.enrolledCount = enrollMap[c._id.toString()] || c.enrolledCount || 0;
      return obj;
    });

    // Log overflow warnings
    const maxRoomCap = Math.max(...rooms.filter(r => r.type === 'CLASSROOM').map(r => r.capacity), 0);
    coursesWithEnrollment.forEach((c) => {
      if (c.enrolledCount > 0 && c.enrolledCount > maxRoomCap) {
        const sections = Math.ceil(c.enrolledCount / maxRoomCap);
        logger.info(`[OverflowCheck] ${c.code}: ${c.enrolledCount} students, max room=${maxRoomCap} → ${sections} sections needed`);
      }
    });

    // Run the scheduling algorithm (async)
    const startTime = Date.now();
    logger.info(`Starting timetable generation for ${department} Sem-${semester}`);

    const result = await schedulerService.generate({ courses: coursesWithEnrollment, faculty, rooms, department, semester });

    const duration = Date.now() - startTime;

    // Save results
    timetable.schedule = result.schedule;
    timetable.status = result.conflicts === 0 ? 'GENERATED' : 'GENERATED'; // Still saved even with soft conflicts
    timetable.generationMeta = {
      ...timetable.generationMeta,
      algorithm: 'CSP_BACKTRACK_LOCAL_SEARCH',
      iterations: result.iterations,
      conflictsResolved: result.conflictsResolved,
      score: result.score,
      duration,
      generatedAt: new Date(),
      generatedBy: req.user._id,
    };
    await timetable.save();

    // Update faculty workload
    await schedulerService.updateFacultyWorkload(result.schedule);

    logger.info(`Timetable generated in ${duration}ms. Score: ${result.score}, Conflicts: ${result.conflicts}`);

    logActivity({
      actor:      req.user.name,
      actorRole:  'ADMIN',
      action:     'GENERATED',
      entity:     'Timetable',
      entityName: timetable.name,
      details:    `Timetable generated for ${department} Sem-${semester} ${academicYear} (score: ${result.score}, conflicts: ${result.conflicts})`,
    });

    res.status(201).json({
      success: true,
      message: 'Timetable generated successfully',
      timetable: await timetable.populate(['schedule.course', 'schedule.faculty', 'schedule.room']),
      stats: {
        duration,
        score: result.score,
        conflicts: result.conflicts,
        iterations: result.iterations,
        overflowSections: result.schedule.filter((e) => e.isOverflow).length > 0
          ? coursesWithEnrollment
              .filter((c) => c.enrolledCount > maxRoomCap)
              .map((c) => ({ course: c.code, enrolled: c.enrolledCount, sections: Math.ceil(c.enrolledCount / maxRoomCap) }))
          : [],
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all timetables (with filters)
// @route   GET /api/timetables
// @access  Private
const getTimetables = async (req, res, next) => {
  try {
    const { department, semester, academicYear, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (academicYear) filter.academicYear = academicYear;
    if (status) filter.status = status;

    // Students only see their own
    if (req.user.role === 'STUDENT') {
      filter.department = req.user.department;
      filter.semester = req.user.semester;
      filter.status = 'PUBLISHED';
    }
    // Faculty see published timetables
    if (req.user.role === 'FACULTY') {
      filter.status = 'PUBLISHED';
    }

    const total = await Timetable.countDocuments(filter);
    const timetables = await Timetable.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('generationMeta.generatedBy', 'name email')
      .select('-schedule'); // Don't return full schedule in list

    res.json({ success: true, total, page: Number(page), timetables });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single timetable with full schedule
// @route   GET /api/timetables/:id
// @access  Private
const getTimetableById = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('schedule.course', 'code name type credits hoursPerWeek requiresLab')
      .populate('schedule.faculty', 'name employeeId designation department')
      .populate('schedule.room', 'roomNumber building type capacity')
      .populate('generationMeta.generatedBy', 'name email');

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    // Students can only view published timetables
    if (req.user.role === 'STUDENT' && timetable.status !== 'PUBLISHED') {
      return res.status(403).json({ success: false, message: 'This timetable is not yet published' });
    }

    res.json({ success: true, timetable });
  } catch (err) {
    next(err);
  }
};

// @desc    Publish a timetable
// @route   PATCH /api/timetables/:id/publish
// @access  Admin
const publishTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    if (timetable.status !== 'GENERATED') {
      return res.status(400).json({ success: false, message: 'Only GENERATED timetables can be published' });
    }
    timetable.status = 'PUBLISHED';
    timetable.publishedAt = new Date();
    timetable.publishedBy = req.user._id;
    await timetable.save();
    res.json({ success: true, message: 'Timetable published successfully', timetable });
  } catch (err) {
    next(err);
  }
};

// @desc    Archive a timetable
// @route   PATCH /api/timetables/:id/archive
// @access  Admin
const archiveTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    timetable.status = 'ARCHIVED';
    await timetable.save();
    res.json({ success: true, message: 'Timetable archived', timetable });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a draft timetable
// @route   DELETE /api/timetables/:id
// @access  Admin
const deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    if (timetable.status === 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'Cannot delete a published timetable. Archive it first.' });
    }
    await timetable.deleteOne();
    res.json({ success: true, message: 'Timetable deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get faculty-specific view (for logged-in faculty)
// @route   GET /api/timetables/faculty-view
// @access  Faculty
const getFacultyView = async (req, res, next) => {
  try {
    const Faculty = require('../models/Faculty');
    const facultyProfile = await Faculty.findOne({ user: req.user._id });
    if (!facultyProfile) return res.status(404).json({ success: false, message: 'Faculty profile not found' });

    const timetables = await Timetable.find({
      status: { $in: ['PUBLISHED', 'GENERATED'] },
      'schedule.faculty': facultyProfile._id,
    })
      .populate('schedule.course', 'code name type')
      .populate('schedule.room', 'roomNumber building')
      .sort({ status: -1, createdAt: -1 }); // PUBLISHED first

    // Filter only entries assigned to this faculty
    const facultySchedule = timetables.map((tt) => ({
      timetableId: tt._id,
      name: tt.name,
      department: tt.department,
      semester: tt.semester,
      academicYear: tt.academicYear,
      entries: tt.schedule.filter((e) => e.faculty.toString() === facultyProfile._id.toString()),
    }));

    res.json({ success: true, schedule: facultySchedule });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin simulation - get conflict analysis for proposed schedule
// @route   POST /api/timetables/simulate
// @access  Admin
const simulateTimetable = async (req, res, next) => {
  try {
    const { department, semester, academicYear } = req.body;
    const [courses, faculty, rooms] = await Promise.all([
      Course.find({ department, semester, isActive: true }),
      Faculty.find({ department, isActive: true }),
      Room.find({ isActive: true }),
    ]);

    const analysis = await schedulerService.analyzeConstraints({ courses, faculty, rooms });

    res.json({
      success: true,
      analysis: {
        courses: courses.length,
        faculty: faculty.length,
        rooms: rooms.length,
        totalHoursNeeded: analysis.totalHoursNeeded,
        availableSlots: analysis.availableSlots,
        feasible: analysis.feasible,
        warnings: analysis.warnings,
        recommendations: analysis.recommendations,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateTimetable,
  getTimetables,
  getTimetableById,
  publishTimetable,
  archiveTimetable,
  deleteTimetable,
  getFacultyView,
  simulateTimetable,
};
