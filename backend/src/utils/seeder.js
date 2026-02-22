require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Room = require('../models/Room');
const Faculty = require('../models/Faculty');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/timetable_db');
  console.log('MongoDB connected for seeding');
};

const seed = async () => {
  await connectDB();

  // Clear
  await Promise.all([User.deleteMany(), Course.deleteMany(), Room.deleteMany(), Faculty.deleteMany()]);
  console.log('Cleared existing data');

  // Create admin
  const admin = await User.create({
    name: 'Admin User', email: 'admin@college.edu',
    password: 'Admin@1234', role: 'ADMIN', department: 'CSE',
  });

  // Rooms
  const rooms = await Room.insertMany([
    { roomNumber: 'A101', building: 'Block A', floor: 1, type: 'CLASSROOM', capacity: 60 },
    { roomNumber: 'A102', building: 'Block A', floor: 1, type: 'CLASSROOM', capacity: 60 },
    { roomNumber: 'B201', building: 'Block B', floor: 2, type: 'CLASSROOM', capacity: 80 },
    { roomNumber: 'LAB-1', building: 'Block C', floor: 0, type: 'LAB', capacity: 30, department: 'CSE', facilities: ['COMPUTERS'] },
    { roomNumber: 'LAB-2', building: 'Block C', floor: 0, type: 'LAB', capacity: 30, department: 'CSE', facilities: ['COMPUTERS'] },
    { roomNumber: 'SH-1', building: 'Block D', floor: 1, type: 'SEMINAR_HALL', capacity: 200 },
  ]);

  // Faculty users + profiles
  const facultyData = [
    { name: 'Dr. Rajesh Kumar', email: 'rajesh@college.edu', designation: 'PROFESSOR', dept: 'CSE', empId: 'F001' },
    { name: 'Dr. Priya Sharma', email: 'priya@college.edu', designation: 'ASSOCIATE_PROFESSOR', dept: 'CSE', empId: 'F002' },
    { name: 'Prof. Amit Singh', email: 'amit@college.edu', designation: 'ASSISTANT_PROFESSOR', dept: 'CSE', empId: 'F003' },
  ];

  const facultyUsers = await Promise.all(
    facultyData.map((f) => User.create({ name: f.name, email: f.email, password: 'Faculty@1234', role: 'FACULTY', department: f.dept }))
  );

  const facultyProfiles = await Promise.all(
    facultyData.map((f, i) => Faculty.create({
      user: facultyUsers[i]._id,
      employeeId: f.empId,
      name: f.name,
      email: f.email,
      designation: f.designation,
      department: f.dept,
      maxHoursPerWeek: 20,
      specializations: ['Data Structures', 'Algorithms'],
    }))
  );

  // Courses (NEP 2020 aligned) for CSE Sem 5
  await Course.insertMany([
    {
      code: 'CS501', name: 'Operating Systems', type: 'THEORY', department: 'CSE', semester: 5,
      credits: 4, hoursPerWeek: 4, theoryHours: 3, tutorialHours: 1, requiresLab: false,
    },
    {
      code: 'CS502', name: 'Computer Networks', type: 'THEORY', department: 'CSE', semester: 5,
      credits: 4, hoursPerWeek: 4, theoryHours: 3, tutorialHours: 1, requiresLab: false,
    },
    {
      code: 'CS503', name: 'Database Management Systems', type: 'THEORY', department: 'CSE', semester: 5,
      credits: 4, hoursPerWeek: 4, theoryHours: 3, practicalHours: 2, requiresLab: true, labDurationHours: 2,
    },
    {
      code: 'CS504', name: 'Machine Learning', type: 'THEORY', department: 'CSE', semester: 5,
      credits: 3, hoursPerWeek: 3, theoryHours: 3, requiresLab: false,
    },
    {
      code: 'CS505', name: 'OS Lab', type: 'PRACTICAL', department: 'CSE', semester: 5,
      credits: 2, hoursPerWeek: 4, practicalHours: 4, requiresLab: true, labDurationHours: 2,
    },
    {
      code: 'CS506', name: 'Open Elective I', type: 'OPEN_ELECTIVE', department: 'CSE', semester: 5,
      credits: 3, hoursPerWeek: 3, theoryHours: 3, isElective: true, electiveGroup: 'OE-GRP1',
    },
  ]);

  // Student user
  await User.create({
    name: 'Student A', email: 'student@college.edu',
    password: 'Student@1234', role: 'STUDENT', department: 'CSE', semester: 5, division: 'A',
  });

  console.log('\n✅ Seed complete!');
  console.log('Admin:   admin@college.edu / Admin@1234');
  console.log('Faculty: rajesh@college.edu / Faculty@1234');
  console.log('Student: student@college.edu / Student@1234');
  mongoose.connection.close();
};

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
