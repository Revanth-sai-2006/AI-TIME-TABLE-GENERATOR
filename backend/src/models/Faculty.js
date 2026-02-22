const mongoose = require('mongoose');
const { WORKING_DAYS } = require('../config/constants');

const facultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    designation: {
      type: String,
      enum: ['PROFESSOR', 'ASSOCIATE_PROFESSOR', 'ASSISTANT_PROFESSOR', 'LECTURER', 'VISITING'],
      required: true,
    },
    department: { type: String, required: true, trim: true },
    specializations: [{ type: String }],
    qualifications: [{ type: String }],

    // Workload constraints (NEP aligned)
    maxHoursPerWeek: { type: Number, default: 20 },
    maxHoursPerDay: { type: Number, default: 5 },
    currentHoursPerWeek: { type: Number, default: 0 },

    // Time preferences (soft constraints)
    preferredDays: [{ type: String, enum: WORKING_DAYS }],
    unavailableSlots: [
      {
        day: String,
        timeSlotId: Number,
        reason: String,
      },
    ],

    // Courses the faculty is qualified to teach
    eligibleCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

facultySchema.index({ department: 1 });
facultySchema.index({ employeeId: 1 });

// Virtual: workload utilization %
facultySchema.virtual('workloadUtilization').get(function () {
  return ((this.currentHoursPerWeek / this.maxHoursPerWeek) * 100).toFixed(1);
});

module.exports = mongoose.model('Faculty', facultySchema);
