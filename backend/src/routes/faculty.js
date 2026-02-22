const express = require('express');
const {
  createFaculty, getAllFaculty, getFacultyById,
  updateFaculty, deleteFaculty, getWorkloadSummary, setUnavailableSlots,
} = require('../controllers/facultyController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/', getAllFaculty);
router.get('/workload', roleCheck('ADMIN'), getWorkloadSummary);
router.get('/:id', getFacultyById);
router.put('/:id/unavailable', roleCheck('ADMIN', 'FACULTY'), setUnavailableSlots);

router.post('/', roleCheck('ADMIN'), createFaculty);
router.put('/:id', roleCheck('ADMIN'), updateFaculty);
router.delete('/:id', roleCheck('ADMIN'), deleteFaculty);

module.exports = router;
