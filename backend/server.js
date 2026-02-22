require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

// Route imports
const authRoutes = require('./src/routes/auth');
const timetableRoutes = require('./src/routes/timetable');
const courseRoutes = require('./src/routes/courses');
const roomRoutes = require('./src/routes/rooms');
const facultyRoutes = require('./src/routes/faculty');
const studentRoutes = require('./src/routes/students');
const registrationRoutes = require('./src/routes/registrations');
const activityRoutes    = require('./src/routes/activity');
const chatbotRoutes     = require('./src/routes/chatbot');

const app = express();

// Security middleware
app.use(helmet());

// Support multiple allowed origins via comma-separated CLIENT_ORIGIN env var
const rawOrigins = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Rate limiting — only enforce in production; skip in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 0, // 0 = unlimited in dev
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/activity',      activityRoutes);
app.use('/api/chatbot',       chatbotRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Auto-seed on first run
const autoSeed = async () => {
  const User = require('./src/models/User');
  const count = await User.countDocuments();
  if (count > 0) return;

  logger.info('No users found — seeding demo data...');
  const Course = require('./src/models/Course');
  const Room = require('./src/models/Room');
  const Faculty = require('./src/models/Faculty');

  const admin = await User.create({ name: 'Admin User', email: 'admin@college.edu', password: 'Admin@1234', role: 'ADMIN', department: 'CSE' });

  const rooms = await Room.insertMany([
    { roomNumber: 'A101', building: 'Block A', floor: 1, type: 'CLASSROOM', capacity: 60 },
    { roomNumber: 'A102', building: 'Block A', floor: 1, type: 'CLASSROOM', capacity: 60 },
    { roomNumber: 'B201', building: 'Block B', floor: 2, type: 'CLASSROOM', capacity: 80 },
    { roomNumber: 'LAB-1', building: 'Block C', floor: 0, type: 'LAB', capacity: 30, department: 'CSE', facilities: ['COMPUTERS'] },
    { roomNumber: 'LAB-2', building: 'Block C', floor: 0, type: 'LAB', capacity: 30, department: 'CSE', facilities: ['COMPUTERS'] },
    { roomNumber: 'SH-1', building: 'Block D', floor: 1, type: 'SEMINAR_HALL', capacity: 200 },
  ]);

  const facultyData = [
    { name: 'Dr. Rajesh Kumar', email: 'rajesh@college.edu', empId: 'F001', designation: 'PROFESSOR' },
    { name: 'Dr. Priya Sharma', email: 'priya@college.edu', empId: 'F002', designation: 'ASSOCIATE_PROFESSOR' },
    { name: 'Prof. Amit Singh', email: 'amit@college.edu', empId: 'F003', designation: 'ASSISTANT_PROFESSOR' },
  ];
  const facultyUsers = await Promise.all(facultyData.map(f =>
    User.create({ name: f.name, email: f.email, password: 'Faculty@1234', role: 'FACULTY', department: 'CSE' })
  ));
  await Promise.all(facultyData.map((f, i) =>
    Faculty.create({ user: facultyUsers[i]._id, employeeId: f.empId, name: f.name, email: f.email, designation: f.designation, department: 'CSE', maxHoursPerWeek: 20 })
  ));

  await Course.insertMany([
    { code: 'CS501', name: 'Operating Systems', type: 'THEORY', department: 'CSE', semester: 5, credits: 4, hoursPerWeek: 4, theoryHours: 3, tutorialHours: 1 },
    { code: 'CS502', name: 'Computer Networks', type: 'THEORY', department: 'CSE', semester: 5, credits: 4, hoursPerWeek: 4, theoryHours: 3, tutorialHours: 1 },
    { code: 'CS503', name: 'Database Management Systems', type: 'THEORY', department: 'CSE', semester: 5, credits: 4, hoursPerWeek: 4, theoryHours: 3, practicalHours: 2, requiresLab: true, labDurationHours: 2 },
    { code: 'CS504', name: 'Machine Learning', type: 'THEORY', department: 'CSE', semester: 5, credits: 3, hoursPerWeek: 3, theoryHours: 3 },
    { code: 'CS505', name: 'OS Lab', type: 'PRACTICAL', department: 'CSE', semester: 5, credits: 2, hoursPerWeek: 4, practicalHours: 4, requiresLab: true, labDurationHours: 2 },
    { code: 'CS506', name: 'Open Elective I', type: 'OPEN_ELECTIVE', department: 'CSE', semester: 5, credits: 3, hoursPerWeek: 3, theoryHours: 3, isElective: true, electiveGroup: 'OE-GRP1' },
  ]);

  await User.create({ name: 'Student A', email: 'student@college.edu', password: 'Student@1234', role: 'STUDENT', department: 'CSE', semester: 5, division: 'A' });

  logger.info('Demo data seeded:');
  logger.info('  Admin:   admin@college.edu / Admin@1234');
  logger.info('  Faculty: rajesh@college.edu / Faculty@1234');
  logger.info('  Student: student@college.edu / Student@1234');
};

// Bootstrap: connect DB then start server
const PORT = process.env.PORT || 5000;
let server;

(async () => {
  await connectDB();
  await autoSeed();

  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
})();

module.exports = app;
