const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor:      { type: String, required: true },       // display name
    actorRole:  { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT', 'SYSTEM'] },
    action:     { type: String, required: true },        // REGISTERED, DROPPED, CREATED, UPDATED, DELETED, LOGIN, GENERATED
    entity:     { type: String, required: true },        // Course, Faculty, Timetable, Room, User
    entityName: { type: String, default: '' },          // human-readable subject
    details:    { type: String, default: '' },          // short descriptive sentence
    // sentiment drives colour: positive=green, negative=red, neutral=amber, info=blue
    sentiment:  { type: String, enum: ['positive', 'negative', 'neutral', 'info'], default: 'neutral' },
  },
  { timestamps: true }
);

// TTL index — auto-delete logs older than 7 days to keep collection lean
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
