import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome, ${user.name}`);
      const dashMap = { ADMIN: '/admin', FACULTY: '/faculty', STUDENT: '/student' };
      navigate(dashMap[user.role] || '/');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg,#1c0508 0%,#6b1a24 55%,#2a0c12 100%)' }}
    >
      {/* ── Top gold stripe ───────────────────────── */}
      <div className="gold-stripe" />

      {/* ── Official top bar ──────────────────────── */}
      <div className="bg-primary-900/80 backdrop-blur text-primary-200 text-xs px-6 py-2 flex items-center justify-between">
        <span className="font-medium tracking-wide">Government University Academic Portal</span>
        <span className="text-primary-300">NEP 2020 &nbsp;·&nbsp; AICTE Compliant</span>
      </div>

      {/* ── Main content ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Emblem / Branding */}
          <div className="text-center mb-8">
            {/* Logo with royal rings */}
            <div className="relative inline-flex items-center justify-center mb-5">
              <div className="absolute rounded-full border border-gold-400/20" style={{ width: '132px', height: '132px' }} />
              <div className="absolute rounded-full border-2 border-gold-400/40" style={{ width: '116px', height: '116px' }} />
              <div className="emblem-glow w-24 h-24 bg-white rounded-full flex items-center justify-center p-2">
                <img src="/assets/tripura-emblem.png" alt="Government of Tripura" className="w-full h-full object-contain" />
              </div>
            </div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-0.5" style={{ color: '#f5de92' }}>
              Government of Tripura
            </p>
            <p className="text-[11px] tracking-wider" style={{ color: 'rgba(245,222,146,0.5)' }}>
              त्रिपुरा सरकार
            </p>
            <div className="gold-stripe w-28 mx-auto my-3 rounded-full" />
            <h1 className="text-2xl font-bold text-white tracking-wide">TimetableGen</h1>
            <p className="text-sm font-medium tracking-widest uppercase text-glow-amis mt-1">
              Academic Management Information System
            </p>
            <div className="gold-stripe w-24 mx-auto mt-3 rounded-full" />
          </div>

          {/* ═══════════════ LUXURY LOGIN CARD ═══════════════ */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg,rgba(60,10,18,0.82) 0%,rgba(28,5,8,0.90) 100%)',
              border: '1px solid rgba(212,153,31,0.30)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(212,153,31,0.10) inset, 0 1px 0 rgba(255,255,255,0.06) inset',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Corner ornaments */}
            <svg className="absolute top-0 left-0 w-16 h-16 opacity-25" viewBox="0 0 64 64" fill="none">
              <path d="M0 0 L64 0 L0 64 Z" fill="rgba(212,153,31,0.15)"/>
              <path d="M2 2 L24 2 M2 2 L2 24" stroke="#d4991f" strokeWidth="1.2"/>
            </svg>
            <svg className="absolute top-0 right-0 w-16 h-16 opacity-25" viewBox="0 0 64 64" fill="none">
              <path d="M64 0 L0 0 L64 64 Z" fill="rgba(212,153,31,0.15)"/>
              <path d="M62 2 L40 2 M62 2 L62 24" stroke="#d4991f" strokeWidth="1.2"/>
            </svg>
            <svg className="absolute bottom-0 left-0 w-16 h-16 opacity-25" viewBox="0 0 64 64" fill="none">
              <path d="M0 64 L64 64 L0 0 Z" fill="rgba(212,153,31,0.15)"/>
              <path d="M2 62 L24 62 M2 62 L2 40" stroke="#d4991f" strokeWidth="1.2"/>
            </svg>
            <svg className="absolute bottom-0 right-0 w-16 h-16 opacity-25" viewBox="0 0 64 64" fill="none">
              <path d="M64 64 L0 64 L64 0 Z" fill="rgba(212,153,31,0.15)"/>
              <path d="M62 62 L40 62 M62 62 L62 40" stroke="#d4991f" strokeWidth="1.2"/>
            </svg>

            {/* Gold gradient header band */}
            <div
              className="px-7 py-5 flex items-center gap-4"
              style={{ background: 'linear-gradient(90deg,#4a1019 0%,#8c2233 50%,#4a1019 100%)', borderBottom: '1px solid rgba(212,153,31,0.35)' }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                style={{ background: 'rgba(212,153,31,0.15)', border: '1px solid rgba(212,153,31,0.4)' }}>
                <Lock size={15} style={{ color: '#e8b83a' }} />
              </div>
              <div>
                <p className="font-bold text-sm tracking-widest uppercase" style={{ color: '#f5de92' }}>Authorised Login</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(245,222,146,0.5)' }}>Institutional credentials required</p>
              </div>
            </div>

            {/* Form body */}
            <div className="px-7 py-7">
              {/* Ornamental rule */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,153,31,0.35))' }} />
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase" style={{ color: 'rgba(212,153,31,0.55)' }}>Sign In</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,rgba(212,153,31,0.35),transparent)' }} />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(212,153,31,0.7)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="user@university.edu"
                    className="input-royal"
                    {...register('email', { required: 'Email is required' })}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(212,153,31,0.7)' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="input-royal pr-11"
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'rgba(212,153,31,0.5)' }}
                      onMouseEnter={e => e.currentTarget.style.color='rgba(232,184,58,0.9)'}
                      onMouseLeave={e => e.currentTarget.style.color='rgba(212,153,31,0.5)'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-royal mt-2">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-amber-900/40 border-t-amber-900 rounded-full animate-spin" /> Authenticating...</>
                  ) : (
                    <><span style={{ letterSpacing: '0.18em' }}>Enter Portal</span>&nbsp;<span className="text-base" style={{ marginTop: '-1px' }}>›</span></>
                  )}
                </button>
              </form>

            </div>

            {/* Register link */}
            <div className="px-7 py-4 text-center" style={{ borderTop: '1px solid rgba(212,153,31,0.15)' }}>
              <p className="text-xs" style={{ color: 'rgba(245,222,146,0.45)' }}>
                New user?{' '}
                <Link to="/register" className="font-semibold transition-colors" style={{ color: '#e8b83a' }}
                  onMouseEnter={e => e.currentTarget.style.color='#f5de92'}
                  onMouseLeave={e => e.currentTarget.style.color='#e8b83a'}>
                  Request Access →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────── */}
      <div className="gold-stripe" />
      <div style={{ background: 'rgba(28,5,8,0.92)' }} className="text-center text-xs py-3 px-4 space-y-0.5">
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>
          © 2025 TimetableGen AMIS &nbsp;·&nbsp; NEP 2020 &amp; AICTE Compliant
        </p>
        <p style={{ color: 'rgba(255,255,255,0.55)' }}>
          Developed by&nbsp;
          <strong style={{ color: '#e8b83a' }}>Vedantam Revanth Sai</strong>
          &nbsp;· Roll No.&nbsp;
          <strong style={{ color: '#e8b83a' }}>2300031900</strong>
        </p>
      </div>
    </div>
  );
}
