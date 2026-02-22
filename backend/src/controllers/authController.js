const User = require('../models/User');
const Faculty = require('../models/Faculty');
const { validationResult } = require('express-validator');
const logActivity = require('../utils/activityLogger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, department, employeeId, studentId, semester, division } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name, email, password, role: role || 'STUDENT',
      department, employeeId, studentId, semester, division,
    });

    // If registering as FACULTY, create Faculty profile
    if (user.role === 'FACULTY' && employeeId) {
      await Faculty.create({
        user: user._id,
        employeeId,
        name,
        email,
        designation: req.body.designation || 'ASSISTANT_PROFESSOR',
        department: department || 'General',
      });
    }

    const token = user.generateToken();
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // ▶ Activity log
    logActivity({
      actor:     user.name,
      actorRole: user.role,
      action:    'LOGIN',
      entity:    'User',
      entityName: user.name,
      details:   `${user.name} (${user.role}) logged in`,
      sentiment: 'info',
    });

    const token = user.generateToken();
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        division: user.division,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    const token = user.generateToken();
    res.json({ success: true, message: 'Password updated', token });
  } catch (err) {
    next(err);
  }
};

// @desc    Deactivate/reactivate user (Admin only)
// @route   PATCH /api/auth/users/:id/status
// @access  Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    next(err);
  }
};

// @desc    List all users (Admin only)
// @route   GET /api/auth/users
// @access  Admin
const listUsers = async (req, res, next) => {
  try {
    const { role, department, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), users });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile fields (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Admin
const updateUser = async (req, res, next) => {
  try {
    const allowed = ['name', 'department', 'semester', 'division', 'studentId', 'employeeId', 'role'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User updated', user });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updatePassword, toggleUserStatus, listUsers, updateUser };
