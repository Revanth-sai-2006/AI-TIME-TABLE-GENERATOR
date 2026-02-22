const mongoose = require('mongoose');

// A single scheduled entry (one class session)
const scheduleEntrySchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    day: { type: String, required: true },
    timeSlotId: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, default: 1 }, // in hours; labs = 2 or 3
    sessionType: { type: String, enum: ['LECTURE', 'PRACTICAL', 'TUTORIAL', 'PROJECT'], default: 'LECTURE' },
    batchDivision: { type: String }, // A, B, C - for lab batch splits
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true }, // e.g., "2025-26"
    semester: { type: Number, required: true, min: 1, max: 8 },
    department: { type: String, required: true, trim: true },
    division: { type: String }, // A, B, C

    status: {
      type: String,
      enum: ['DRAFT', 'GENERATING', 'GENERATED', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },

    schedule: [scheduleEntrySchema],

    // Elective groups resolved
    electiveSelections: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
      },
    ],

    // Algorithm metadata
    generationMeta: {
      algorithm: { type: String, default: 'CSP_BACKTRACK_LOCAL_SEARCH' },
      iterations: { type: Number, default: 0 },
      conflictsResolved: { type: Number, default: 0 },
      score: { type: Number, default: 0 }, // fitness/quality score
      duration: { type: Number, default: 0 }, // ms taken to generate
      generatedAt: { type: Date },
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    // Publishing
    publishedAt: { type: Date },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timetableSchema.index({ department: 1, semester: 1, academicYear: 1, status: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
