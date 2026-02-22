import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { UserPlus } from 'lucide-react';

const FIELD_LABEL = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';

const DEPTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'BCA', 'MCA'];
const SEMS  = [1,2,3,4,5,6,7,8];

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { role: 'STUDENT' } });
  const role = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await authRegister(data);
      toast.success('Account created successfully!');
      const dashMap = { ADMIN: '/admin', FACULTY: '/faculty', STUDENT: '/student' };
      navigate(dashMap[user.role] || '/');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg,#1c0508 0%,#6b1a24 55%,#2a0c12 100%)' }}
    >
      {/* ── Gold stripe + official bar ──────────────── */}
      <div className="gold-stripe" />
      <div className="bg-primary-900/80 text-primary-200 text-xs px-6 py-2 flex items-center justify-between">
        <span className="font-medium tracking-wide">Government University Academic Portal</span>
        <span className="text-primary-300">NEP 2020 &nbsp;·&nbsp; AICTE Compliant</span>
      </div>

      {/* ── Main ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Branding */}
          <div className="text-center mb-7">
            {/* Logo with royal rings */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute rounded-full border border-gold-400/20" style={{ width: '114px', height: '114px' }} />
              <div className="absolute rounded-full border-2 border-gold-400/38" style={{ width: '100px', height: '100px' }} />
              <div className="emblem-glow w-20 h-20 bg-white rounded-full flex items-center justify-center p-1.5">
                <img src="/assets/tripura-emblem.png" alt="Government of Tripura" className="w-full h-full object-contain" />
              </div>
            </div>
            <p className="text-xs font-bold tracking-[0.22em] uppercase mb-0.5" style={{ color: '#f5de92' }}>
              Government of Tripura
            </p>
            <p className="text-[11px] tracking-wider" style={{ color: 'rgba(245,222,146,0.48)' }}>
              त्रिपुरा सरकार
            </p>
            <div className="gold-stripe w-24 mx-auto my-3 rounded-full" />
            <h1 className="text-2xl font-bold text-white tracking-wide">TimetableGen</h1>
            <p className="text-xs font-medium tracking-widest uppercase text-glow-amis mt-1">
              Academic Management Information System
            </p>
            <div className="gold-stripe w-20 mx-auto mt-3 rounded-full" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-lg shadow-official overflow-hidden">
            {/* Card header */}
            <div className="bg-primary-800 px-6 py-4 flex items-center gap-3">
              <UserPlus size={16} className="text-gold-400" />
              <div>
                <p className="text-white font-semibold text-sm tracking-wide">User Registration</p>
                <p className="text-primary-300 text-xs mt-0.5">Complete the form to request portal access</p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Full name */}
                  <div className="col-span-2">
                    <label className={FIELD_LABEL}>Full Name</label>
                    <input className="input-field" placeholder="Dr. John Doe"
                      {...register('name', { required: 'Name is required' })} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="col-span-2">
                    <label className={FIELD_LABEL}>Institutional Email</label>
                    <input type="email" className="input-field" placeholder="you@university.edu"
                      {...register('email', { required: 'Email required' })} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  {/* Password */}
                  <div className="col-span-2">
                    <label className={FIELD_LABEL}>Password</label>
                    <input type="password" className="input-field" placeholder="Minimum 8 characters"
                      {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>

                  {/* Role */}
                  <div>
                    <label className={FIELD_LABEL}>Role</label>
                    <select className="input-field" {...register('role', { required: true })}>
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className={FIELD_LABEL}>Department</label>
                    <select className="input-field" {...register('department', { required: 'Department is required' })}>
                      <option value="">Select department</option>
                      {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
                  </div>

                  {/* Student-specific fields */}
                  {role === 'STUDENT' && (
                    <>
                      <div>
                        <label className={FIELD_LABEL}>Semester</label>
                        <select className="input-field" {...register('semester', { required: true, valueAsNumber: true })}>
                          <option value="">Select semester</option>
                          {SEMS.map((s) => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={FIELD_LABEL}>Division</label>
                        <input className="input-field" placeholder="A" {...register('division')} />
                      </div>
                    </>
                  )}

                  {/* Faculty-specific field */}
                  {role === 'FACULTY' && (
                    <div className="col-span-2">
                      <label className={FIELD_LABEL}>Employee ID</label>
                      <input className="input-field" placeholder="F001" {...register('employeeId')} />
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full h-11 flex items-center justify-center gap-2 mt-1">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                  ) : 'Register Account'}
                </button>
              </form>
            </div>

            {/* Footer link */}
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────── */}
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
