import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { registrationApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  BookOpen, CheckCircle, XCircle, Clock, Award,
  ClipboardList, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Star,
} from 'lucide-react';

// ─── Confetti particle component ─────────────────────────────────────────────
// App palette: maroon + gold + amber
const COLORS = ['#8c2233','#6b1a24','#c04060','#d4991f','#e8b83a','#f5de92','#b45309','#b37c10'];

function Confetti({ count = 60 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.8}s`,
      duration: `${0.9 + Math.random() * 1.2}s`,
      size: `${6 + Math.random() * 8}px`,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
      rotate: `${Math.random() * 720}deg`,
      drift: `${(Math.random() - 0.5) * 160}px`,
    }))
  ).current;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: p.left,
            width: p.size,
            height: p.shape === 'rect' ? `calc(${p.size} * 0.4)` : p.size,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
            '--drift': p.drift,
            '--rotate': p.rotate,
          }}
        />
      ))}
    </div>
  );
}

// ─── Grand success overlay ─────────────────────────────────────────────────
function RegistrationSuccess({ course, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <Confetti count={70} />
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        style={{ background: 'rgba(10,3,5,0.78)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.3s ease' }}
        onClick={onClose}
      >
        {/* Card */}
        <div
          className="relative max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl"
          style={{ animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Maroon + gold gradient header */}
          <div className="relative px-8 pt-10 pb-16 text-center"
            style={{ background: 'linear-gradient(145deg, #2d0a10 0%, #6b1a24 45%, #8c2233 80%, #a0341f 100%)' }}>
            {/* Decorative gold glow ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(212,153,31,0.25)', animation: 'ping 2s ease-in-out infinite' }} />
            </div>
            {/* Gold checkmark circle */}
            <div className="relative mx-auto mb-4 flex items-center justify-center"
              style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'linear-gradient(135deg, #d4991f, #e8b83a)',
                boxShadow: '0 0 0 8px rgba(212,153,31,0.18), 0 0 32px rgba(212,153,31,0.35)',
                animation: 'scaleIn 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
              <CheckCircle size={48} className="drop-shadow-lg" style={{ color: '#2d0a10' }} strokeWidth={2.5} />
            </div>
            <div style={{ animation: 'slideUp 0.4s 0.3s ease both' }}>
              <p style={{ color: 'rgba(212,153,31,0.85)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
                Enrolled Successfully
              </p>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                You're all set! 🎉
              </h2>
            </div>
            {/* Gold star decorations */}
            <Star size={14} style={{ color: '#e8b83a', position: 'absolute', top: 24, left: 28, opacity: 0.9, animation: 'twinkle 1.5s ease infinite' }} fill="#e8b83a" />
            <Star size={10} style={{ color: '#d4991f', position: 'absolute', top: 40, right: 32, opacity: 0.7, animation: 'twinkle 2s 0.5s ease infinite' }} fill="#d4991f" />
            <Star size={12} style={{ color: '#f5de92', position: 'absolute', bottom: 56, left: 40, opacity: 0.6, animation: 'twinkle 1.8s 0.3s ease infinite' }} fill="#f5de92" />
          </div>

          {/* Wave divider — matches card bg */}
          <div className="relative -mt-8 bg-white">
            <svg viewBox="0 0 400 40" className="w-full" style={{ marginTop: -1 }} preserveAspectRatio="none">
              <path d="M0,40 C100,0 300,0 400,40 Z" fill="#6b1a24" />
            </svg>
          </div>

          {/* Course details */}
          <div className="bg-white px-8 pb-8 -mt-1" style={{ animation: 'slideUp 0.4s 0.4s ease both' }}>
            <div className="rounded-2xl p-4 mb-5 border" style={{ background: 'linear-gradient(135deg, #fdf2f3 0%, #fdf9ee 100%)', borderColor: '#edbbC2' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8c2233' }}>{course?.code}</p>
              <p className="font-bold text-base leading-snug" style={{ color: '#2d0a10' }}>{course?.name}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-0.5"
                  style={{ background: 'rgba(212,153,31,0.15)', color: '#8f600c', border: '1px solid rgba(212,153,31,0.35)' }}>
                  <Award size={11} /> {course?.credits} Credits
                </span>
                <span className="flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-0.5"
                  style={{ background: 'rgba(140,34,51,0.08)', color: '#6b1a24', border: '1px solid rgba(140,34,51,0.2)' }}>
                  <Clock size={11} /> {course?.hoursPerWeek}h/week
                </span>
              </div>
            </div>
            <p className="text-center text-xs mb-4" style={{ color: '#a0888c' }}>Check your timetable for scheduled slots</p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-sm transition"
              style={{
                background: 'linear-gradient(135deg, #6b1a24, #8c2233, #c04060)',
                color: '#f5de92',
                boxShadow: '0 4px 20px rgba(107,26,36,0.45)',
                letterSpacing: '0.03em',
              }}
            >
              <Sparkles size={14} className="inline mr-1.5 mb-0.5" />
              Awesome, Thanks!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
// Indian academic year runs July–June.
// Jan–June 2026 → "2025-26", July–Dec 2026 → "2026-27"
const _now = new Date();
const _startYear = _now.getMonth() < 6 ? _now.getFullYear() - 1 : _now.getFullYear();
const CURRENT_YEAR = `${_startYear}-${String(_startYear + 1).slice(2)}`;

const TYPE_BADGE = {
  THEORY: 'badge-blue',
  PRACTICAL: 'badge-purple',
  ELECTIVE: 'badge-yellow',
  OPEN_ELECTIVE: 'badge-green',
  PROJECT: 'badge-gray',
};

const SESSION_DOT = {
  LECTURE: 'bg-blue-400',
  PRACTICAL: 'bg-purple-400',
  TUTORIAL: 'bg-green-400',
};

export default function CourseRegistration() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedSem, setSelectedSem] = useState(user?.semester || 5);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [registeredCourse, setRegisteredCourse] = useState(null);

  // Available courses + registration status
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['reg-courses', user?.id, user?.department, selectedSem],
    queryFn: () =>
      registrationApi.getAvailableCourses({
        department: user?.department,
        semester: selectedSem,
        academicYear: CURRENT_YEAR,
      }).then((r) => r.data),
    enabled: !!user,
  });

  // My registered courses
  const { data: myRegsData, isLoading: myRegsLoading } = useQuery({
    queryKey: ['my-registrations', user?.id],
    queryFn: () => registrationApi.getMyRegistrations({ academicYear: CURRENT_YEAR }).then((r) => r.data),
    enabled: !!user,
  });

  const registerMutation = useMutation({
    mutationFn: (courseId) => registrationApi.register({ courseId, academicYear: CURRENT_YEAR }),
    onSuccess: (_, courseId) => {
      // Find the course object to show in celebration modal
      const course = courses.find((c) => c._id === courseId);
      setRegisteredCourse(course || { _id: courseId });
      qc.invalidateQueries({ queryKey: ['reg-courses', user?.id] });
      qc.invalidateQueries({ queryKey: ['my-registrations', user?.id] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    },
  });

  const dropMutation = useMutation({
    mutationFn: (courseId) => registrationApi.drop(courseId, { academicYear: CURRENT_YEAR }),
    onSuccess: () => {
      toast.success('Course dropped');
      qc.invalidateQueries({ queryKey: ['reg-courses', user?.id] });
      qc.invalidateQueries({ queryKey: ['my-registrations', user?.id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Drop failed'),
  });

  const courses = coursesData?.courses || [];
  const myRegs = myRegsData?.registrations || [];
  const totalCredits = myRegsData?.totalCredits || 0;
  const MAX_CREDITS = 30;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Grand registration success overlay */}
      {registeredCourse && (
        <RegistrationSuccess
          course={registeredCourse}
          onClose={() => setRegisteredCourse(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Course Registration</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {user?.department} · Academic Year {CURRENT_YEAR}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Registered courses summary */}
        <div className="lg:col-span-1 space-y-4">
          {/* Credit meter */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Award size={16} className="text-primary-600" /> Credit Summary
            </h2>
            <div className="flex items-end justify-between mb-1">
              <span className="text-3xl font-bold text-primary-600">{totalCredits}</span>
              <span className="text-sm text-gray-400">/ {MAX_CREDITS} credits</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  totalCredits > MAX_CREDITS ? 'bg-red-500' : totalCredits >= 20 ? 'bg-green-500' : 'bg-primary-500'
                }`}
                style={{ width: `${Math.min((totalCredits / MAX_CREDITS) * 100, 100)}%` }}
              />
            </div>
            {totalCredits < 15 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle size={12} /> Minimum 15 credits recommended (NEP 2020)
              </p>
            )}
          </div>

          {/* Registered list */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ClipboardList size={16} className="text-primary-600" />
              My Courses
              <span className="badge badge-blue ml-auto">{myRegs.length}</span>
            </h2>

            {myRegsLoading ? <LoadingSpinner /> : (
              myRegs.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto text-gray-200 mb-2" size={36} />
                  <p className="text-gray-400 text-sm">No courses registered yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myRegs.map((reg) => (
                    <div key={reg._id} className="flex items-start justify-between p-2.5 rounded-lg bg-green-50 border border-green-100">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{reg.course?.code}</p>
                        <p className="text-xs text-gray-500 truncate">{reg.course?.name}</p>
                        <p className="text-xs text-primary-600 font-medium mt-0.5">{reg.course?.credits} credits</p>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Drop ${reg.course?.name}?`)) dropMutation.mutate(reg.course?._id);
                        }}
                        className="ml-2 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Drop course"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* RIGHT: Available courses */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-gray-800">
                Available Courses
                <span className="text-gray-400 font-normal text-sm ml-2">({courses.length} courses)</span>
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Semester:</label>
                <select
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(Number(e.target.value))}
                  className="input-field !py-1.5 !text-sm w-28"
                >
                  {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>

            {coursesLoading ? <LoadingSpinner /> : (
              courses.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="mx-auto text-gray-200 mb-3" size={48} />
                  <p className="text-gray-400">No courses found for Semester {selectedSem}</p>
                  <p className="text-gray-400 text-sm mt-1">Ask admin to add courses for this semester</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => {
                    const isExpanded = expandedCourse === course._id;
                    const isPending =
                      registerMutation.isPending || dropMutation.isPending;

                    return (
                      <div
                        key={course._id}
                        className={`rounded-xl border transition ${
                          course.isRegistered
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-gray-100 hover:border-primary-200 hover:bg-primary-50/20'
                        }`}
                      >
                        <div className="flex items-start gap-3 p-4">
                          {/* Status icon */}
                          <div className="shrink-0 mt-0.5">
                            {course.isRegistered
                              ? <CheckCircle size={20} className="text-green-500" />
                              : <BookOpen size={20} className="text-gray-300" />}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-800 text-sm">{course.code}</span>
                              <span className={`badge ${TYPE_BADGE[course.type] || 'badge-gray'} text-xs`}>{course.type}</span>
                              {course.isElective && <span className="badge badge-yellow text-xs">Elective</span>}
                            </div>
                            <p className="text-sm text-gray-600">{course.name}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                              <span className="flex items-center gap-1"><Award size={11} /> {course.credits} credits</span>
                              <span className="flex items-center gap-1"><Clock size={11} /> {course.hoursPerWeek}h/week</span>
                              {course.requiresLab && <span className="badge badge-purple text-xs">Lab required</span>}
                              {course.slots.length > 0 && (
                                <button
                                  onClick={() => setExpandedCourse(isExpanded ? null : course._id)}
                                  className="flex items-center gap-0.5 text-primary-600 hover:underline"
                                >
                                  {course.slots.length} slot{course.slots.length > 1 ? 's' : ''}
                                  {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                </button>
                              )}
                            </div>

                            {/* Expanded slot details */}
                            {isExpanded && course.slots.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {course.slots.map((slot, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${SESSION_DOT[slot.sessionType] || 'bg-gray-300'}`} />
                                    <span className="font-medium text-gray-700 w-10">{slot.day}</span>
                                    <span className="text-gray-500">{slot.startTime} – {slot.endTime}</span>
                                    {slot.room && <span className="text-gray-400">· {slot.room}</span>}
                                    {slot.faculty && <span className="text-gray-400 truncate">· {slot.faculty}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action button */}
                          <div className="shrink-0">
                            {course.isRegistered ? (
                              <button
                                onClick={() => { if (window.confirm(`Drop ${course.name}?`)) dropMutation.mutate(course._id); }}
                                disabled={isPending}
                                className="btn-danger text-xs px-3 py-1.5"
                              >
                                Drop
                              </button>
                            ) : (
                              <button
                                onClick={() => registerMutation.mutate(course._id)}
                                disabled={isPending}
                                className="btn-primary text-xs px-3 py-1.5"
                              >
                                Register
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
