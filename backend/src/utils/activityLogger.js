const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity event.  Never throws — failures are silent so they
 * never break the main request flow.
 *
 * @param {object} opts
 * @param {string}  opts.actor      - Display name of the person acting
 * @param {string}  opts.actorRole  - ADMIN | FACULTY | STUDENT | SYSTEM
 * @param {string}  opts.action     - REGISTERED | DROPPED | CREATED | UPDATED | DELETED | LOGIN | GENERATED
 * @param {string}  opts.entity     - Course | Faculty | Timetable | Room | User
 * @param {string}  opts.entityName - The subject name (course code, faculty name, etc.)
 * @param {string}  opts.details    - Short human-readable sentence
 * @param {string} [opts.sentiment] - positive | negative | neutral | info
 */
const logActivity = async ({ actor, actorRole, action, entity, entityName = '', details = '', sentiment } = {}) => {
  try {
    // Derive sentiment automatically if not provided
    if (!sentiment) {
      if (['REGISTERED', 'CREATED', 'GENERATED', 'LOGIN'].includes(action))   sentiment = 'positive';
      else if (['DROPPED', 'DELETED'].includes(action))                        sentiment = 'negative';
      else if (action === 'UPDATED')                                           sentiment = 'neutral';
      else                                                                     sentiment = 'info';
    }
    await ActivityLog.create({ actor, actorRole, action, entity, entityName, details, sentiment });
  } catch (err) {
    // intentional no-op
  }
};

module.exports = logActivity;
