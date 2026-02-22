export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TIME_SLOTS = [
  { id: 1,  label: '8:00 - 9:00',    isBreak: false },
  { id: 2,  label: '9:00 - 10:00',   isBreak: false },
  { id: 3,  label: '10:00 - 11:00',  isBreak: false },
  { id: 4,  label: '11:00 - 12:00',  isBreak: false },
  { id: 5,  label: '12:00 - 1:00',   isBreak: true  },
  { id: 6,  label: '1:00 - 2:00',    isBreak: false },
  { id: 7,  label: '2:00 - 3:00',    isBreak: false },
  { id: 8,  label: '3:00 - 4:00',    isBreak: false },
  { id: 9,  label: '4:00 - 5:00',    isBreak: false },
  { id: 10, label: '5:00 - 6:00',    isBreak: false },
];

export const COURSE_TYPE_COLORS = {
  LECTURE:  'session-lecture',
  PRACTICAL:'session-lab',
  TUTORIAL: 'session-tutorial',
};

export const STATUS_BADGE = {
  DRAFT:      'badge-gray',
  GENERATING: 'badge-yellow',
  GENERATED:  'badge-blue',
  PUBLISHED:  'badge-green',
  ARCHIVED:   'badge-gray',
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const getRoleDashboard = (role) => {
  const map = { ADMIN: '/admin', FACULTY: '/faculty', STUDENT: '/student' };
  return map[role] || '/login';
};

export const clsx = (...classes) => classes.filter(Boolean).join(' ');
