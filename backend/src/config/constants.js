// NEP 2020 Credit System Constants
const NEP_CREDIT_SYSTEM = {
  THEORY_CREDITS: { 1: 1, 2: 2, 3: 3, 4: 4 },     // lectures per week = credits
  PRACTICAL_CREDITS: { 1: 0.5, 2: 1 },              // 2hr lab = 1 credit
  MAX_CREDITS_PER_SEMESTER: 26,
  MIN_CREDITS_PER_SEMESTER: 18,
};

// Days of the week for scheduling
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Standard time slots (8:00 AM to 6:00 PM)
const TIME_SLOTS = [
  { id: 1, start: '08:00', end: '09:00', label: '8:00 - 9:00' },
  { id: 2, start: '09:00', end: '10:00', label: '9:00 - 10:00' },
  { id: 3, start: '10:00', end: '11:00', label: '10:00 - 11:00' },
  { id: 4, start: '11:00', end: '12:00', label: '11:00 - 12:00' },
  { id: 5, start: '12:00', end: '13:00', label: '12:00 - 1:00 (Lunch)', isBreak: true },
  { id: 6, start: '13:00', end: '14:00', label: '1:00 - 2:00' },
  { id: 7, start: '14:00', end: '15:00', label: '2:00 - 3:00' },
  { id: 8, start: '15:00', end: '16:00', label: '3:00 - 4:00' },
  { id: 9, start: '16:00', end: '17:00', label: '4:00 - 5:00' },
  { id: 10, start: '17:00', end: '18:00', label: '5:00 - 6:00' },
];

const ROOM_TYPES = ['CLASSROOM', 'LAB', 'SEMINAR_HALL', 'AUDITORIUM'];
const COURSE_TYPES = ['THEORY', 'PRACTICAL', 'ELECTIVE', 'OPEN_ELECTIVE', 'PROJECT'];
const USER_ROLES = ['ADMIN', 'FACULTY', 'STUDENT'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const MAX_FACULTY_HOURS_PER_DAY = 6;
const MAX_FACULTY_HOURS_PER_WEEK = 24;
const MAX_CONSECUTIVE_HOURS = 3;

const CONSTRAINT_WEIGHTS = {
  HARD_CONFLICT_ROOM: 1000,
  HARD_CONFLICT_FACULTY: 1000,
  HARD_CONFLICT_STUDENT: 1000,
  SOFT_FACULTY_WORKLOAD: 10,
  SOFT_PREFERENCE: 5,
  SOFT_DISTRIBUTION: 8,
};

module.exports = {
  NEP_CREDIT_SYSTEM,
  DAYS,
  WORKING_DAYS,
  TIME_SLOTS,
  ROOM_TYPES,
  COURSE_TYPES,
  USER_ROLES,
  SEMESTERS,
  MAX_FACULTY_HOURS_PER_DAY,
  MAX_FACULTY_HOURS_PER_WEEK,
  MAX_CONSECUTIVE_HOURS,
  CONSTRAINT_WEIGHTS,
};
