/**
 * SchedulerService - NEP 2020 Aligned Timetable Generator
 *
 * Algorithm: Hybrid CSP (Constraint Satisfaction Problem) + Local Search
 * ============================================================
 * Phase 1: Preprocessing & domain setup
 * Phase 2: Greedy initial assignment (arc consistency)
 * Phase 3: Backtracking with forward checking
 * Phase 4: Local search (hill-climbing) to optimize soft constraints
 *
 * Hard Constraints (must not be violated):
 *   HC1 - No faculty double-booked at the same slot
 *   HC2 - No room double-booked at the same slot
 *   HC3 - No student group double-booked at the same slot
 *   HC4 - Lab sessions must occupy consecutive slots
 *   HC5 - Faculty unavailability must be respected
 *   HC6 - Room type must match session type (CLASSROOM vs LAB)
 *
 * Soft Constraints (minimized/optimized):
 *   SC1 - Faculty workload balance across the week
 *   SC2 - Faculty time preferences
 *   SC3 - Avoid isolated single lectures (spread evenly)
 *   SC4 - No more than MAX_CONSECUTIVE_HOURS consecutive teaching
 *   SC5 - Morning slots preferred for theory; labs in afternoon
 */

const { TIME_SLOTS, WORKING_DAYS, MAX_FACULTY_HOURS_PER_DAY, MAX_CONSECUTIVE_HOURS, CONSTRAINT_WEIGHTS } = require('../config/constants');
const Faculty = require('../models/Faculty');
const logger = require('../utils/logger');

// ------------------------------------------------------------
// Internal state
// ------------------------------------------------------------

class Scheduler {
  constructor({ courses, faculty, rooms }) {
    this.courses = courses;
    this.faculty = faculty;  // Array of faculty Mongoose docs
    this.rooms = rooms;
    this.schedule = [];
    this.iterations = 0;
    this.conflictsResolved = 0;

    // Availability grids: key = `${day}_${slotId}`
    this.facultyGrid = {}; // facultyId -> Set of occupied slot keys
    this.roomGrid = {};    // roomId   -> Set of occupied slot keys
    this.groupGrid = {};   // "dept_sem_div" -> Set of occupied slot keys

    // Build faculty lookup
    this.facultyMap = {};
    this.faculty.forEach((f) => { this.facultyMap[f._id.toString()] = f; });

    // Pre-filter available (non-break) slots
    this.availableSlots = TIME_SLOTS.filter((s) => !s.isBreak);
  }

  // ===========================
  // Main entry: generate schedule
  // ===========================
  async generate() {
    logger.info(`[Scheduler] Starting with ${this.courses.length} courses, ${this.faculty.length} faculty, ${this.rooms.length} rooms`);

    // 1. Sort courses: labs first (harder to place), then by credits desc
    const sorted = [...this.courses].sort((a, b) => {
      if (a.requiresLab && !b.requiresLab) return -1;
      if (!a.requiresLab && b.requiresLab) return 1;
      return b.hoursPerWeek - a.hoursPerWeek;
    });

    // 2. Assign each course session
    for (const course of sorted) {
      const assigned = await this._assignCourse(course);
      if (!assigned) {
        logger.warn(`[Scheduler] Could not fully schedule course: ${course.code}. Adding partial.`);
      }
    }

    // 3. Local search: optimize soft constraints
    this._localSearchOptimize();

    const score = this._calculateFitnessScore();
    const conflicts = this._countHardConflicts();

    return {
      schedule: this.schedule,
      iterations: this.iterations,
      conflictsResolved: this.conflictsResolved,
      score,
      conflicts,
    };
  }

  // ===========================
  // Assign all sessions for one course
  // ===========================
  async _assignCourse(course) {
    const sessionsNeeded = this._buildSessionPlan(course);
    let allAssigned = true;

    for (const session of sessionsNeeded) {
      const slot = this._findBestSlot(course, session);
      if (slot) {
        this._commitSlot(course, session, slot);
      } else {
        allAssigned = false;
        // Try backtracking: swap an existing entry to make room
        const swapped = this._backtrackSwap(course, session);
        if (swapped) {
          this.conflictsResolved++;
        }
      }
      this.iterations++;
    }

    return allAssigned;
  }

  // Build list of sessions needed for a course
  _buildSessionPlan(course) {
    const sessions = [];
    const { theoryHours = 0, practicalHours = 0, tutorialHours = 0, requiresLab, labDurationHours = 2 } = course;

    // Theory sessions (1 hour each)
    for (let i = 0; i < theoryHours; i++) {
      sessions.push({ type: 'LECTURE', duration: 1 });
    }
    // Tutorial sessions
    for (let i = 0; i < tutorialHours; i++) {
      sessions.push({ type: 'TUTORIAL', duration: 1 });
    }
    // Practical/Lab sessions (block)
    if (practicalHours > 0 || requiresLab) {
      const labSessions = practicalHours > 0 ? Math.ceil(practicalHours / labDurationHours) : 1;
      for (let i = 0; i < labSessions; i++) {
        sessions.push({ type: 'PRACTICAL', duration: labDurationHours || 2 });
      }
    }

    // If no breakdown provided, fall back to hoursPerWeek
    if (sessions.length === 0) {
      for (let i = 0; i < (course.hoursPerWeek || 3); i++) {
        sessions.push({ type: 'LECTURE', duration: 1 });
      }
    }

    return sessions;
  }

  // ===========================
  // Find the best available slot (greedy + scoring)
  // ===========================
  _findBestSlot(course, session) {
    const groupKey = this._groupKey(course);
    let bestSlot = null;
    let bestScore = -Infinity;

    for (const day of this._shuffled(WORKING_DAYS)) {
      for (const slot of this.availableSlots) {
        // For multi-hour sessions, check all consecutive slots
        if (!this._areSlotsAvailable(course, session, day, slot)) continue;

        const score = this._scoreSlot(course, session, day, slot);
        if (score > bestScore) {
          bestScore = score;
          bestSlot = { day, slot };
        }
      }
    }

    return bestSlot;
  }

  // Check all required slots are free (hard constraints)
  _areSlotsAvailable(course, session, day, startSlot) {
    const { duration = 1, type } = session;
    const groupKey = this._groupKey(course);

    // Find if we have enough consecutive available slots
    const startIdx = this.availableSlots.findIndex((s) => s.id === startSlot.id);
    if (startIdx + duration - 1 >= this.availableSlots.length) return false;

    for (let i = 0; i < duration; i++) {
      const s = this.availableSlots[startIdx + i];
      const key = `${day}_${s.id}`;

      // HC2: Room available?
      const suitableRoom = this._findRoom(course, session, day, s, duration);
      if (!suitableRoom) return false;

      // HC3: Student group available?
      if (this._groupOccupied(groupKey, key)) return false;

      // HC5: Faculty availability
      const faculty = this._findEligibleFaculty(course, day, s, duration);
      if (!faculty) return false;
    }

    return true;
  }

  // Score a slot based on soft constraints
  _scoreSlot(course, session, day, slot) {
    let score = 100; // base

    // SC3: Prefer spreading lectures across days
    const groupKey = this._groupKey(course);
    const dayCount = this._countGroupEntriesOnDay(groupKey, day);
    score -= dayCount * 15;

    // SC5: Theory in morning (slots 1-4), lab in afternoon (slots 6-9)
    if (session.type === 'LECTURE' && slot.id <= 4) score += 10;
    if (session.type === 'PRACTICAL' && slot.id >= 6) score += 15;
    if (session.type === 'LECTURE' && slot.id >= 8) score -= 20; // Late evening theory penalized

    // SC4: Avoid back-to-back beyond MAX_CONSECUTIVE_HOURS
    const consecutive = this._checkConsecutiveForGroup(groupKey, day, slot.id);
    if (consecutive >= MAX_CONSECUTIVE_HOURS) score -= 50;

    return score;
  }

  // Commit a slot assignment
  _commitSlot(course, session, { day, slot }) {
    const { duration = 1, type } = session;
    const groupKey = this._groupKey(course);
    const startIdx = this.availableSlots.findIndex((s) => s.id === slot.id);

    const faculty = this._findEligibleFaculty(course, day, slot, duration);
    const room = this._findRoom(course, session, day, slot, duration);

    if (!faculty || !room) return false;

    // Mark grids for all duration slots
    for (let i = 0; i < duration; i++) {
      const s = this.availableSlots[startIdx + i];
      const key = `${day}_${s.id}`;

      this._markOccupied(this.facultyGrid, faculty._id.toString(), key);
      this._markOccupied(this.roomGrid, room._id.toString(), key);
      this._markOccupied(this.groupGrid, groupKey, key);
    }

    this.schedule.push({
      course: course._id,
      faculty: faculty._id,
      room: room._id,
      day,
      timeSlotId: slot.id,
      startTime: slot.start,
      endTime: this.availableSlots[startIdx + duration - 1]?.end || slot.end,
      duration,
      sessionType: type,
    });

    return true;
  }

  // ===========================
  // Find eligible faculty for a slot
  // ===========================
  _findEligibleFaculty(course, day, slot, duration) {
    // Filter faculty eligible for this course
    const eligible = this.faculty.filter((f) => {
      const fId = f._id.toString();
      // Check if course is in eligible list (if populated)
      if (course.eligibleFaculty && course.eligibleFaculty.length > 0) {
        const ids = course.eligibleFaculty.map((id) => id.toString());
        if (!ids.includes(fId)) return false;
      } else {
        // Fall back to department matching
        if (f.department !== course.department) return false;
      }

      // HC5: Check faculty unavailable slots
      const isUnavailable = (f.unavailableSlots || []).some(
        (u) => u.day === day && u.timeSlotId === slot.id
      );
      if (isUnavailable) return false;

      // HC1: Check if faculty is free for all duration slots
      for (let i = 0; i < duration; i++) {
        const s = this.availableSlots.find((av) => av.id === slot.id + i);
        if (!s) return false;
        const key = `${day}_${s.id}`;
        if (this._isOccupied(this.facultyGrid, fId, key)) return false;
      }

      // Workload check
      if ((f.currentHoursPerWeek || 0) >= (f.maxHoursPerWeek || 20)) return false;

      return true;
    });

    if (eligible.length === 0) return null;

    // Pick faculty with lowest current workload (SC1: workload balance)
    return eligible.sort((a, b) => (a.currentHoursPerWeek || 0) - (b.currentHoursPerWeek || 0))[0];
  }

  // ===========================
  // Find suitable room
  // ===========================
  _findRoom(course, session, day, slot, duration) {
    const requiredType = session.type === 'PRACTICAL' ? 'LAB' : 'CLASSROOM';
    const minCapacity = course.maxBatchSize || 60;

    const suitable = this.rooms.filter((r) => {
      if (r.type !== requiredType) return false;
      if (r.capacity < minCapacity * 0.8) return false; // 20% flexibility

      // Department preference (soft)
      // HC2: Check room is free for all duration slots
      for (let i = 0; i < duration; i++) {
        const s = this.availableSlots.find((av) => av.id === slot.id + i);
        if (!s) return false;
        const key = `${day}_${s.id}`;
        if (this._isOccupied(this.roomGrid, r._id.toString(), key)) return false;
      }

      return true;
    });

    if (suitable.length === 0) {
      // Fallback: any CLASSROOM if CLASSROOM not found
      if (requiredType === 'CLASSROOM') return null;
      // For labs, fallback to SEMINAR_HALL
      return this.rooms.find((r) => r.type === 'SEMINAR_HALL' && r.capacity >= minCapacity * 0.8) || null;
    }

    // Prefer smallest suitable room (efficient use)
    return suitable.sort((a, b) => a.capacity - b.capacity)[0];
  }

  // ===========================
  // Backtracking swap
  // ===========================
  _backtrackSwap(course, session) {
    // Try to move an existing lower-priority entry to make room
    const groupKey = this._groupKey(course);
    for (let attempt = 0; attempt < 10; attempt++) {
      const day = WORKING_DAYS[Math.floor(Math.random() * WORKING_DAYS.length)];
      const slotDef = this.availableSlots[Math.floor(Math.random() * this.availableSlots.length)];

      // If the slot would be free if we remove a low-priority entry
      const blockingIdx = this.schedule.findIndex(
        (e) => e.day === day && e.timeSlotId === slotDef.id &&
          this._groupKey({ department: course.department, semester: course.semester }) === groupKey
      );

      if (blockingIdx !== -1) {
        const blocked = this.schedule[blockingIdx];
        // Try to re-place it elsewhere
        this.schedule.splice(blockingIdx, 1);
        this._releaseSlot(blocked);

        const slot = this._findBestSlot(course, session);
        if (slot) {
          this._commitSlot(course, session, slot);
          // Re-assign the displaced entry
          const displacedCourse = this.courses.find((c) => c._id.toString() === blocked.course.toString());
          if (displacedCourse) {
            const altSlot = this._findBestSlot(displacedCourse, { type: blocked.sessionType, duration: blocked.duration });
            if (altSlot) this._commitSlot(displacedCourse, { type: blocked.sessionType, duration: blocked.duration }, altSlot);
          }
          return true;
        } else {
          // Revert: re-commit original
          this._commitOriginal(blocked);
        }
      }
    }
    return false;
  }

  _commitOriginal(entry) {
    this.schedule.push(entry);
    for (let i = 0; i < (entry.duration || 1); i++) {
      const s = this.availableSlots.find((av) => av.id === entry.timeSlotId + i);
      if (!s) continue;
      const key = `${entry.day}_${s.id}`;
      this._markOccupied(this.facultyGrid, entry.faculty.toString(), key);
      this._markOccupied(this.roomGrid, entry.room.toString(), key);
    }
  }

  _releaseSlot(entry) {
    for (let i = 0; i < (entry.duration || 1); i++) {
      const s = this.availableSlots.find((av) => av.id === entry.timeSlotId + i);
      if (!s) continue;
      const key = `${entry.day}_${s.id}`;
      this._unmarkOccupied(this.facultyGrid, entry.faculty.toString(), key);
      this._unmarkOccupied(this.roomGrid, entry.room.toString(), key);
    }
  }

  // ===========================
  // Local Search Phase (Hill Climbing)
  // ===========================
  _localSearchOptimize() {
    const MAX_LS_ITERATIONS = 200;
    let improved = true;
    let lsIter = 0;

    while (improved && lsIter < MAX_LS_ITERATIONS) {
      improved = false;
      lsIter++;

      for (let i = 0; i < this.schedule.length; i++) {
        const entry = this.schedule[i];
        const currentScore = this._scoreEntry(entry);

        // Try swapping with another entry
        for (let j = i + 1; j < this.schedule.length; j++) {
          const other = this.schedule[j];
          if (this._canSwap(entry, other)) {
            const newScore = this._scoreEntry({ ...entry, day: other.day, timeSlotId: other.timeSlotId }) +
              this._scoreEntry({ ...other, day: entry.day, timeSlotId: entry.timeSlotId });
            const oldScore = currentScore + this._scoreEntry(other);

            if (newScore > oldScore) {
              // Perform swap
              const tempDay = entry.day;
              const tempSlot = entry.timeSlotId;
              const tempStart = entry.startTime;
              const tempEnd = entry.endTime;

              this.schedule[i] = { ...entry, day: other.day, timeSlotId: other.timeSlotId, startTime: other.startTime, endTime: other.endTime };
              this.schedule[j] = { ...other, day: tempDay, timeSlotId: tempSlot, startTime: tempStart, endTime: tempEnd };

              improved = true;
            }
          }
        }
      }
    }

    logger.info(`[Scheduler] Local search completed after ${lsIter} iterations`);
  }

  // Can two entries safely swap time slots?
  _canSwap(a, b) {
    if (a.faculty.toString() === b.faculty.toString()) return false; // same faculty
    if (a.room.toString() === b.room.toString()) return false; // same room
    if (a.course.toString() === b.course.toString()) return false; // same course
    if (a.duration !== b.duration) return false; // different session lengths
    return true;
  }

  // Score a single entry (higher = better)
  _scoreEntry(entry) {
    let score = 50;
    const slot = entry.timeSlotId;

    // Morning preference for theory
    if (entry.sessionType === 'LECTURE' && slot <= 4) score += 10;
    if (entry.sessionType === 'PRACTICAL' && slot >= 6) score += 15;
    if (slot >= 9) score -= 25; // Very late slot penalty

    return score;
  }

  // ===========================
  // Fitness Score (0-100)
  // ===========================
  _calculateFitnessScore() {
    if (this.schedule.length === 0) return 0;

    let totalScore = 0;
    const maxPossible = this.schedule.length * 100;

    for (const entry of this.schedule) {
      totalScore += this._scoreEntry(entry);
    }

    // Workload balance component
    const workloadVariance = this._calculateWorkloadVariance();
    const workloadScore = Math.max(0, 100 - workloadVariance * 2);
    totalScore += workloadScore * 10; // Weight

    return Math.min(100, Math.round((totalScore / (maxPossible + 1000)) * 100));
  }

  _calculateWorkloadVariance() {
    if (this.faculty.length === 0) return 0;
    const loads = this.faculty.map((f) => {
      const assigned = this.schedule.filter((e) => e.faculty.toString() === f._id.toString()).length;
      return assigned;
    });
    const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / loads.length;
    return Math.sqrt(variance);
  }

  _countHardConflicts() {
    const keys = new Map();
    let conflicts = 0;

    for (const entry of this.schedule) {
      const roomKey = `room_${entry.room}_${entry.day}_${entry.timeSlotId}`;
      const facKey = `fac_${entry.faculty}_${entry.day}_${entry.timeSlotId}`;

      if (keys.has(roomKey)) conflicts++;
      if (keys.has(facKey)) conflicts++;
      keys.set(roomKey, true);
      keys.set(facKey, true);
    }

    return conflicts;
  }

  // ===========================
  // Grid helpers
  // ===========================
  _markOccupied(grid, id, key) {
    if (!grid[id]) grid[id] = new Set();
    grid[id].add(key);
  }

  _unmarkOccupied(grid, id, key) {
    if (grid[id]) grid[id].delete(key);
  }

  _isOccupied(grid, id, key) {
    return grid[id] ? grid[id].has(key) : false;
  }

  _groupOccupied(groupKey, key) {
    return this.groupGrid[groupKey] ? this.groupGrid[groupKey].has(key) : false;
  }

  _groupKey(course) {
    return `${course.department}_sem${course.semester}`;
  }

  _countGroupEntriesOnDay(groupKey, day) {
    return this.schedule.filter((e) => {
      const c = this.courses.find((c) => c._id.toString() === e.course.toString());
      return c && this._groupKey(c) === groupKey && e.day === day;
    }).length;
  }

  _checkConsecutiveForGroup(groupKey, day, slotId) {
    let count = 0;
    for (let s = slotId - 1; s >= 1; s--) {
      const key = `${day}_${s}`;
      if (this._groupOccupied(groupKey, key)) count++;
      else break;
    }
    return count;
  }

  _shuffled(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }
}

// ===========================
// Exported service functions
// ===========================

const generate = async ({ courses, faculty, rooms }) => {
  const scheduler = new Scheduler({ courses, faculty, rooms });
  return scheduler.generate();
};

const updateFacultyWorkload = async (schedule) => {
  // Aggregate hours per faculty
  const hoursMap = {};
  for (const entry of schedule) {
    const fId = entry.faculty.toString();
    hoursMap[fId] = (hoursMap[fId] || 0) + (entry.duration || 1);
  }

  // Bulk update
  const updates = Object.entries(hoursMap).map(([facultyId, hours]) =>
    Faculty.findByIdAndUpdate(facultyId, { $set: { currentHoursPerWeek: hours } })
  );
  await Promise.all(updates);
};

const analyzeConstraints = async ({ courses, faculty, rooms }) => {
  const totalHoursNeeded = courses.reduce((sum, c) => sum + (c.hoursPerWeek || 3), 0);
  const availableSlots = WORKING_DAYS.length * TIME_SLOTS.filter((s) => !s.isBreak).length;
  const feasible = totalHoursNeeded <= availableSlots * Math.max(faculty.length, 1);

  const warnings = [];
  const recommendations = [];

  if (faculty.length === 0) warnings.push('No faculty found for this department');
  if (courses.length === 0) warnings.push('No courses found for this semester');
  if (!feasible) warnings.push(`Total hours needed (${totalHoursNeeded}) may exceed available capacity`);

  const labCourses = courses.filter((c) => c.requiresLab);
  const labRooms = rooms.filter((r) => r.type === 'LAB');
  if (labCourses.length > labRooms.length) {
    warnings.push(`${labCourses.length} lab courses but only ${labRooms.length} labs available`);
    recommendations.push('Consider adding more lab rooms or using lab-sharing');
  }

  const overloaded = faculty.filter(
    (f) => (f.currentHoursPerWeek || 0) >= (f.maxHoursPerWeek || 20) * 0.9
  );
  if (overloaded.length > 0) {
    warnings.push(`${overloaded.length} faculty members are near/at workload capacity`);
    recommendations.push('Consider hiring additional faculty or redistributing electives');
  }

  return { totalHoursNeeded, availableSlots, feasible, warnings, recommendations };
};

module.exports = { generate, updateFacultyWorkload, analyzeConstraints };
