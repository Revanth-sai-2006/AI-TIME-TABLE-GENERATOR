const express = require('express');
const { createCourse, getCourses, getCourseById, updateCourse, deleteCourse } = require('../controllers/courseController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', roleCheck('ADMIN'), createCourse);
router.put('/:id', roleCheck('ADMIN'), updateCourse);
router.delete('/:id', roleCheck('ADMIN'), deleteCourse);

module.exports = router;
