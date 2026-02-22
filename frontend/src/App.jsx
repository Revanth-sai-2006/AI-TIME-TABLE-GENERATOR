import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import TimetableGenerator from './pages/admin/TimetableGenerator';
import ManageCourses from './pages/admin/ManageCourses';
import ManageRooms from './pages/admin/ManageRooms';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageUsers from './pages/admin/ManageUsers';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseRegistration from './pages/student/CourseRegistration';

// Shared
import TimetableView from './pages/timetable/TimetableView';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import NotFound from './pages/NotFound';

export default function App() {
  const { loading } = useAuth();

  if (loading) return <LoadingSpinner fullscreen message="Initializing..." />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="timetable/generate" element={<TimetableGenerator />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="rooms" element={<ManageRooms />} />
        <Route path="faculty" element={<ManageFaculty />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="timetable/:id" element={<TimetableView />} />
      </Route>

      {/* Faculty routes */}
      <Route path="/faculty" element={<ProtectedRoute roles={['FACULTY']}><Layout /></ProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="timetable/:id" element={<TimetableView />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><Layout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="register" element={<CourseRegistration />} />
        <Route path="timetable/:id" element={<TimetableView />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const dashMap = { ADMIN: '/admin', FACULTY: '/faculty', STUDENT: '/student' };
  return <Navigate to={dashMap[user.role] || '/login'} replace />;
}
