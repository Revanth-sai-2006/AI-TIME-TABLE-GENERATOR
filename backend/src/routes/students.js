const express = require('express');
const { getStudentTimetable, submitElectivePreference, getAllStudents } = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/', roleCheck('ADMIN'), getAllStudents);
router.get('/timetable', roleCheck('STUDENT', 'ADMIN'), getStudentTimetable);
router.post('/elective-preference', roleCheck('STUDENT'), submitElectivePreference);

module.exports = router;
