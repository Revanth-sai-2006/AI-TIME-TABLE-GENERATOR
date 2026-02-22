import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right: header + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          menuOpen={sidebarOpen}
        />
        <main className="aurora-bg flex-1 overflow-y-auto animate-fade-in">
          {/* Living aurora orbs */}
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
          <div className="aurora-orb aurora-orb-4" />
          <div className="aurora-grid" />
          {/* Page content floats above */}
          <div className="aurora-content p-5 md:p-7">
            <Outlet />
          </div>
        </main>

        {/* ── Footer ──────────────────────────────────── */}
        <footer style={{ background: '#1c0508' }} className="text-center py-2.5 px-4 shrink-0">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            © 2025 TimetableGen AMIS &nbsp;·&nbsp; NEP 2020 Compliant
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>
              Developed by <strong style={{ color: '#e8b83a' }}>Vedantam Revanth Sai</strong>
              &nbsp;· Roll No.&nbsp;
              <strong style={{ color: '#e8b83a' }}>2300031900</strong>
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}
