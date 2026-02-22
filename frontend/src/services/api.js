import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tt_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('tt_token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (status === 429) {
      toast.error('Too many requests. Please slow down.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject({ message, status, data: error.response?.data });
  }
);

// ===========================
// API helper methods
// ===========================

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
  listUsers: (params) => api.get('/auth/users', { params }),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  toggleUserStatus: (id) => api.patch(`/auth/users/${id}/status`),
};

// Timetables
export const timetableApi = {
  generate: (data) => api.post('/timetables/generate', data),
  list: (params) => api.get('/timetables', { params }),
  getById: (id) => api.get(`/timetables/${id}`),
  publish: (id) => api.patch(`/timetables/${id}/publish`),
  archive: (id) => api.patch(`/timetables/${id}/archive`),
  delete: (id) => api.delete(`/timetables/${id}`),
  getFacultyView: () => api.get('/timetables/faculty-view'),
  simulate: (data) => api.post('/timetables/simulate', data),
};

// Courses
export const courseApi = {
  list: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Rooms
export const roomApi = {
  list: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  checkAvailability: (id, params) => api.get(`/rooms/${id}/availability`, { params }),
};

// Faculty
export const facultyApi = {
  list: (params) => api.get('/faculty', { params }),
  getById: (id) => api.get(`/faculty/${id}`),
  create: (data) => api.post('/faculty', data),
  update: (id, data) => api.put(`/faculty/${id}`, data),
  delete: (id) => api.delete(`/faculty/${id}`),
  getWorkload: (params) => api.get('/faculty/workload', { params }),
  setUnavailable: (id, data) => api.put(`/faculty/${id}/unavailable`, data),
};

// Students
export const studentApi = {
  list: (params) => api.get('/students', { params }),
  getTimetable: (params) => api.get('/students/timetable', { params }),
  submitElectivePreference: (data) => api.post('/students/elective-preference', data),
};

// Course Registrations
export const registrationApi = {
  getAvailableCourses: (params) => api.get('/registrations/courses', { params }),
  getMyRegistrations: (params) => api.get('/registrations/my', { params }),
  register: (data) => api.post('/registrations', data),
  drop: (courseId, params) => api.delete(`/registrations/${courseId}`, { params }),
  getCourseRegistrations: (courseId) => api.get(`/registrations/course/${courseId}`),
};

// Live Activity Feed (admin)
export const activityApi = {
  getRecent: (limit = 30) => api.get('/activity/recent', { params: { limit } }),
  clear: () => api.delete('/activity/clear'),
};

export default api;
