const express = require('express');
const {
  generateTimetable, getTimetables, getTimetableById,
  publishTimetable, archiveTimetable, deleteTimetable,
  getFacultyView, simulateTimetable,
} = require('../controllers/timetableController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getTimetables);
router.get('/faculty-view', roleCheck('FACULTY', 'ADMIN'), getFacultyView);
router.get('/:id', getTimetableById);

router.post('/generate', roleCheck('ADMIN'), generateTimetable);
router.post('/simulate', roleCheck('ADMIN'), simulateTimetable);

router.patch('/:id/publish', roleCheck('ADMIN'), publishTimetable);
router.patch('/:id/archive', roleCheck('ADMIN'), archiveTimetable);
router.delete('/:id', roleCheck('ADMIN'), deleteTimetable);

module.exports = router;
