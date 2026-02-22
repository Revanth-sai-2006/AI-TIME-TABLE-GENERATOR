import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Calendar, BookOpen, DoorOpen,
  Users, GraduationCap, ClipboardList,
} from 'lucide-react';

const adminLinks = [
  { section: 'Overview', items: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  ]},
  { section: 'Timetable', items: [
    { to: '/admin/timetable/generate', label: 'Generate Timetable', icon: Calendar },
  ]},
  { section: 'Resources', items: [
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/rooms', label: 'Rooms & Labs', icon: DoorOpen },
    { to: '/admin/faculty', label: 'Faculty', icon: GraduationCap },
    { to: '/admin/users', label: 'Users', icon: Users },
  ]},
];

const facultyLinks = [
  { section: 'Schedule', items: [
    { to: '/faculty', label: 'My Schedule', icon: Calendar, exact: true },
  ]},
];

const studentLinks = [
  { section: 'Academic', items: [
    { to: '/student', label: 'My Timetable', icon: Calendar, exact: true },
    { to: '/student/register', label: 'Course Registration', icon: ClipboardList },
  ]},
];

const roleGroups = { ADMIN: adminLinks, FACULTY: facultyLinks, STUDENT: studentLinks };

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const groups = roleGroups[user?.role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — dark navy */}
      <aside
        style={{ background: '#1f0709' }}
        className={`fixed md:sticky top-0 left-0 h-screen w-60
          flex flex-col z-20 transform transition-transform duration-200 shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar brand strip */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="emblem-glow w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 p-1">
              <img src="/assets/tripura-emblem.png" alt="Tripura" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-white font-bold text-sm tracking-wide">TimetableGen</p>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#f5de92' }}>Govt. of Tripura</p>
            </div>
          </div>
        </div>

        {/* Navigation groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {groups.map(({ section, items }) => (
            <div key={section}>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                {section}
              </p>
              <nav className="space-y-0.5">
                {items.map(({ to, label, icon: Icon, exact }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded transition-all
                      ${isActive ? 'sidebar-active' : 'sidebar-link'}`
                    }
                  >
                    <Icon size={16} className="shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-1.5">
            <img
              src="/assets/tripura-emblem.png"
              alt="Tripura"
              className="w-5 h-5 object-contain opacity-25"
            />
            <p className="text-white/30 text-[10px] font-medium">
              TimetableGen v1.0 &nbsp;·&nbsp; NEP 2020
            </p>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(212,153,31,0.45)', letterSpacing: '0.06em' }}>
            Academic Management Information System
          </p>
        </div>
      </aside>
    </>
  );
}
