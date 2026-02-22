const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * GET /api/activity/recent
 * Returns recent activity logs + 24h summary stats.
 * Admin only.
 */
router.get('/recent', protect, roleCheck('ADMIN'), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const [activities, stats] = await Promise.all([
      ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean(),
      (async () => {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [registrations, drops, logins, creations, updates, deletions] = await Promise.all([
          ActivityLog.countDocuments({ action: 'REGISTERED', createdAt: { $gte: since } }),
          ActivityLog.countDocuments({ action: 'DROPPED',    createdAt: { $gte: since } }),
          ActivityLog.countDocuments({ action: 'LOGIN',      createdAt: { $gte: since } }),
          ActivityLog.countDocuments({ sentiment: 'positive', action: { $in: ['CREATED', 'GENERATED'] }, createdAt: { $gte: since } }),
          ActivityLog.countDocuments({ action: 'UPDATED',   createdAt: { $gte: since } }),
          ActivityLog.countDocuments({ action: 'DELETED',   createdAt: { $gte: since } }),
        ]);
        return { registrations, drops, logins, creations, updates, deletions };
      })(),
    ]);

    res.json({ success: true, activities, stats });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/activity/clear  (admin utility)
 */
router.delete('/clear', protect, roleCheck('ADMIN'), async (req, res, next) => {
  try {
    await ActivityLog.deleteMany({});
    res.json({ success: true, message: 'Activity log cleared' });
  } catch (err) { next(err); }
});

module.exports = router;
