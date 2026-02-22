const Room = require('../models/Room');

const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, message: 'Room created', room });
  } catch (err) { next(err); }
};

const getRooms = async (req, res, next) => {
  try {
    const { type, building, minCapacity, department, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (building) filter.building = building;
    if (department) filter.department = department;
    if (minCapacity) filter.capacity = { $gte: Number(minCapacity) };

    const total = await Room.countDocuments(filter);
    const rooms = await Room.find(filter)
      .sort({ building: 1, roomNumber: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, rooms });
  } catch (err) { next(err); }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, room });
  } catch (err) { next(err); }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, message: 'Room updated', room });
  } catch (err) { next(err); }
};

const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    room.isActive = false;
    await room.save();
    res.json({ success: true, message: 'Room deactivated' });
  } catch (err) { next(err); }
};

// Check room availability for a slot
const checkAvailability = async (req, res, next) => {
  try {
    const { day, timeSlotId, excludeTimetableId } = req.query;
    const Timetable = require('../models/Timetable');

    const occupied = await Timetable.find({
      status: { $in: ['GENERATED', 'PUBLISHED'] },
      ...(excludeTimetableId && { _id: { $ne: excludeTimetableId } }),
      schedule: {
        $elemMatch: {
          room: req.params.id,
          day,
          timeSlotId: Number(timeSlotId),
        },
      },
    }).select('name department semester');

    res.json({ success: true, available: occupied.length === 0, occupiedBy: occupied });
  } catch (err) { next(err); }
};

module.exports = { createRoom, getRooms, getRoomById, updateRoom, deleteRoom, checkAvailability };
