const Faculty = require('../models/Faculty');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');

const createFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.create(req.body);
    logActivity({
      actor:      req.user?.name || 'Admin',
      actorRole:  'ADMIN',
      action:     'CREATED',
      entity:     'Faculty',
      entityName: faculty.name,
      details:    `New faculty member ${faculty.name} (${faculty.designation}) added to ${faculty.department}`,
    });
    res.status(201).json({ success: true, message: 'Faculty profile created', faculty });
  } catch (err) { next(err); }
};

const getAllFaculty = async (req, res, next) => {
  try {
    const { department, designation, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (designation) filter.designation = designation;

    const total = await Faculty.countDocuments(filter);
    const faculty = await Faculty.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('eligibleCourses', 'code name type credits')
      .populate('user', 'email');

    res.json({ success: true, total, faculty });
  } catch (err) { next(err); }
};

const getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('eligibleCourses', 'code name semester credits type')
      .populate('assignedCourses', 'code name semester credits')
      .populate('user', 'name email');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, faculty });
  } catch (err) { next(err); }
};

const updateFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    logActivity({
      actor:      req.user?.name || 'Admin',
      actorRole:  'ADMIN',
      action:     'UPDATED',
      entity:     'Faculty',
      entityName: faculty.name,
      details:    `Faculty profile of ${faculty.name} was updated`,
    });
    res.json({ success: true, message: 'Faculty updated', faculty });
  } catch (err) { next(err); }
};

const deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    faculty.isActive = false;
    await faculty.save();
    logActivity({
      actor:      req.user?.name || 'Admin',
      actorRole:  'ADMIN',
      action:     'DELETED',
      entity:     'Faculty',
      entityName: faculty.name,
      details:    `Faculty ${faculty.name} was deactivated`,
    });
    res.json({ success: true, message: 'Faculty deactivated' });
  } catch (err) { next(err); }
};

// @desc    Get workload summary (Admin dashboard)
// @route   GET /api/faculty/workload
// @access  Admin
const getWorkloadSummary = async (req, res, next) => {
  try {
    const { department } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;

    const faculty = await Faculty.find(filter).select('name employeeId designation department maxHoursPerWeek currentHoursPerWeek');

    const summary = faculty.map((f) => ({
      id: f._id,
      name: f.name,
      employeeId: f.employeeId,
      designation: f.designation,
      department: f.department,
      maxHours: f.maxHoursPerWeek,
      currentHours: f.currentHoursPerWeek,
      utilization: f.maxHoursPerWeek > 0 ? ((f.currentHoursPerWeek / f.maxHoursPerWeek) * 100).toFixed(1) : '0',
      status: f.currentHoursPerWeek >= f.maxHoursPerWeek ? 'OVERLOADED' : f.currentHoursPerWeek >= f.maxHoursPerWeek * 0.8 ? 'HIGH' : 'NORMAL',
    }));

    res.json({ success: true, summary });
  } catch (err) { next(err); }
};

// @desc    Set unavailable slots for faculty
// @route   PUT /api/faculty/:id/unavailable
// @access  Faculty (own) / Admin
const setUnavailableSlots = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    // Faculty can only edit their own profile
    if (req.user.role === 'FACULTY') {
      const userFaculty = await Faculty.findOne({ user: req.user._id });
      if (!userFaculty || userFaculty._id.toString() !== faculty._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    faculty.unavailableSlots = req.body.unavailableSlots || [];
    faculty.preferredDays = req.body.preferredDays || faculty.preferredDays;
    await faculty.save();
    res.json({ success: true, message: 'Unavailable slots updated', faculty });
  } catch (err) { next(err); }
};

module.exports = { createFaculty, getAllFaculty, getFacultyById, updateFaculty, deleteFaculty, getWorkloadSummary, setUnavailableSlots };
