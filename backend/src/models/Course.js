const mongoose = require('mongoose');
const { COURSE_TYPES, SEMESTERS } = require('../config/constants');

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: COURSE_TYPES,
      required: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      enum: SEMESTERS,
      required: true,
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: [1, 'Credits must be at least 1'],
      max: [6, 'Credits cannot exceed 6'],
    },
    hoursPerWeek: {
      type: Number,
      required: true,
      min: 1,
    },
    // NEP 2020: theory + practical split
    theoryHours: { type: Number, default: 0 },
    practicalHours: { type: Number, default: 0 },
    tutorialHours: { type: Number, default: 0 },

    requiresLab: { type: Boolean, default: false },
    labDurationHours: { type: Number, default: 0 }, // e.g., 2-hour or 3-hour lab block

    isElective: { type: Boolean, default: false },
    electiveGroup: { type: String }, // Courses in same group are alternatives

    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    eligibleFaculty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }],

    maxBatchSize: { type: Number, default: 60 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ code: 1 });

module.exports = mongoose.model('Course', courseSchema);
