const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updatePassword, toggleUserStatus, listUsers, updateUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['ADMIN', 'FACULTY', 'STUDENT']).withMessage('Invalid role'),
];

router.post('/register', registerValidation, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

// Admin routes
router.get('/users', protect, roleCheck('ADMIN'), listUsers);
router.put('/users/:id', protect, roleCheck('ADMIN'), updateUser);
router.patch('/users/:id/status', protect, roleCheck('ADMIN'), toggleUserStatus);

module.exports = router;
