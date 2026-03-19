const express = require('express');
const {
  getAvailableCourses,
  registerCourse,
  getMyRegistrations,
  getCourseRegistrations,
  adminDropRegistration,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/courses', roleCheck('STUDENT'), getAvailableCourses);
router.get('/my', roleCheck('STUDENT'), getMyRegistrations);
router.post('/', roleCheck('STUDENT'), registerCourse);
router.get('/course/:courseId', roleCheck('ADMIN'), getCourseRegistrations);
router.delete('/admin/:registrationId', roleCheck('ADMIN'), adminDropRegistration);

module.exports = router;
