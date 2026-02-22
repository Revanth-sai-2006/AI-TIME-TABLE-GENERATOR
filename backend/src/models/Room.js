const mongoose = require('mongoose');
const { ROOM_TYPES } = require('../config/constants');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    building: { type: String, required: true, trim: true },
    floor: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ROOM_TYPES,
      required: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    facilities: [{ type: String }], // ['PROJECTOR', 'AC', 'SMART_BOARD', 'COMPUTERS']
    department: { type: String }, // null = shared/common room
    isActive: { type: Boolean, default: true },
    maintenanceSchedule: [
      {
        day: String,
        startTime: String,
        endTime: String,
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

roomSchema.index({ type: 1, capacity: 1 });
roomSchema.index({ department: 1 });

module.exports = mongoose.model('Room', roomSchema);
