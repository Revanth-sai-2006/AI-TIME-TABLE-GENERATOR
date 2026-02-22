import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, ChevronDown, Menu, X } from 'lucide-react';

const ROLE_LABEL = { ADMIN: 'Administrator', FACULTY: 'Faculty Member', STUDENT: 'Student' };
const ROLE_STYLE = {
  ADMIN:   'bg-red-100 text-red-800 border border-red-200',
  FACULTY: 'text-amber-900 border border-amber-300',
  STUDENT: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};
const ROLE_BG = { FACULTY: 'rgba(212,153,31,0.12)' };

export default function Navbar({ onMenuToggle, menuOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Current date
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex flex-col">
      {/* ── Top institutional band ─────────────────────────── */}
      <div className="text-xs px-4 py-1.5 flex items-center justify-between" style={{ background: '#1c0508', color: 'rgba(245,222,146,0.55)' }}>
        <span className="font-medium tracking-wide hidden sm:block">
          Government University Academic Portal &nbsp;·&nbsp; NEP 2020 Compliant
        </span>
        <span className="ml-auto" style={{ color: 'rgba(245,222,146,0.4)' }}>{today}</span>
      </div>

      {/* ── Gold divider stripe ───────────────────────────── */}
      <div className="gold-stripe" />

      {/* ── Main navigation bar ───────────────────────────── */}
      <nav className="h-14 flex items-center px-4 border-b" style={{ background: '#3d0e16', borderColor: 'rgba(212,153,31,0.2)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden mr-3 p-1.5 rounded transition"
          style={{ color: 'rgba(245,222,146,0.6)' }}
          aria-label="Toggle sidebar"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo + app name */}
        <div className="flex items-center gap-3 mr-6">
          <div className="emblem-glow w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5">
            <img src="/assets/tripura-emblem.png" alt="Tripura" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-bold text-base tracking-wide navbar-title-glow">TimetableGen</p>
            <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(212,153,31,0.55)' }}>
              AMIS — Academic Mgmt. System
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Right: role badge + user dropdown */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span className={`hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded ${ROLE_STYLE[user?.role]}`}
            style={ROLE_BG[user?.role] ? { background: ROLE_BG[user?.role] } : undefined}>
            {ROLE_LABEL[user?.role]}
          </span>

          {/* User dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded transition"
              style={{ color: '#f5de92' }}
            >
              <div className="w-8 h-8 rounded bg-gold-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium">{user?.name?.split(' ')[0]}</span>
              <ChevronDown size={14} style={{ color: 'rgba(212,153,31,0.6)' }} />
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                {/* Dropdown panel */}
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl animate-fade-in z-50 overflow-hidden"
                  style={{ background: 'linear-gradient(145deg,#2d0a10,#1c0508)', border: '1px solid rgba(212,153,31,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  {/* User info header */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(212,153,31,0.2)', background: 'rgba(212,153,31,0.07)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#f5de92' }}>{user?.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(245,222,146,0.45)' }}>{user?.email}</p>
                    {user?.department && (
                      <p className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(232,184,58,0.65)' }}>
                        Dept. of {user.department}
                      </p>
                    )}
                  </div>
                  {/* Menu items */}
                  <div className="p-1">
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded transition"
                      style={{ color: 'rgba(245,222,146,0.7)' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(212,153,31,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={15} style={{ color: '#d4991f' }} />
                      My Profile
                    </button>
                    <div className="my-1" style={{ borderTop: '1px solid rgba(212,153,31,0.15)' }} />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded transition"
                      style={{ color: 'rgba(255,130,130,0.85)' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Bottom gold divider ───────────────────────────── */}
      <div className="gold-stripe" />
    </header>
  );
}
