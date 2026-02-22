const express = require('express');
const { createRoom, getRooms, getRoomById, updateRoom, deleteRoom, checkAvailability } = require('../controllers/roomController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.get('/:id/availability', checkAvailability);
router.post('/', roleCheck('ADMIN'), createRoom);
router.put('/:id', roleCheck('ADMIN'), updateRoom);
router.delete('/:id', roleCheck('ADMIN'), deleteRoom);

module.exports = router;
