const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'DROPPED', 'WAITLISTED'],
      default: 'REGISTERED',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    droppedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Each student can register for a course only once per academic year
registrationSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
