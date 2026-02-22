const Course = require('../models/Course');

const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, message: 'Course created', course });
  } catch (err) { next(err); }
};

const getCourses = async (req, res, next) => {
  try {
    const { department, semester, type, isElective, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (type) filter.type = type;
    if (isElective !== undefined) filter.isElective = isElective === 'true';

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
      .sort({ semester: 1, code: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('eligibleFaculty', 'name employeeId');

    res.json({ success: true, total, courses });
  } catch (err) { next(err); }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('eligibleFaculty').populate('prerequisites');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) { next(err); }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course updated', course });
  } catch (err) { next(err); }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    course.isActive = false;
    await course.save();
    res.json({ success: true, message: 'Course deactivated' });
  } catch (err) { next(err); }
};

module.exports = { createCourse, getCourses, getCourseById, updateCourse, deleteCourse };
