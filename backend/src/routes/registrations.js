const express = require('express');
const {
  getAvailableCourses,
  registerCourse,
  dropCourse,
  getMyRegistrations,
  getCourseRegistrations,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/courses', roleCheck('STUDENT'), getAvailableCourses);
router.get('/my', roleCheck('STUDENT'), getMyRegistrations);
router.post('/', roleCheck('STUDENT'), registerCourse);
router.delete('/:courseId', roleCheck('STUDENT'), dropCourse);
router.get('/course/:courseId', roleCheck('ADMIN'), getCourseRegistrations);

module.exports = router;
