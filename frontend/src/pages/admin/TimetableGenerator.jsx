import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { timetableApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Play, Eye, Trash2, Globe, Archive, Zap, BarChart3, Calendar } from 'lucide-react';
import { STATUS_BADGE, formatDate } from '../../utils/helpers';

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'BCA', 'MCA'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const YEARS = ['2024-25', '2025-26', '2026-27'];

const GLabel = ({ children }) => (
  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>{children}</label>
);

export default function TimetableGenerator() {
  const qc = useQueryClient();
  const [simulateResult, setSimulateResult] = useState(null);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    defaultValues: { academicYear: '2025-26', division: 'A' },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['timetables-all'],
    queryFn: () => timetableApi.list({ limit: 20 }).then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: (data) => timetableApi.generate(data),
    onSuccess: () => { toast.success('Timetable generated!'); qc.invalidateQueries({ queryKey: ['timetables-all'] }); },
    onError: (err) => toast.error(err.message),
  });

  const simulateMutation = useMutation({
    mutationFn: (data) => timetableApi.simulate(data),
    onSuccess: (res) => { setSimulateResult(res.data.analysis); toast.success('Analysis complete'); },
    onError: (err) => toast.error(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => timetableApi.publish(id),
    onSuccess: () => { toast.success('Timetable published!'); qc.invalidateQueries({ queryKey: ['timetables-all'] }); },
    onError: (err) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => timetableApi.archive(id),
    onSuccess: () => { toast.success('Archived.'); qc.invalidateQueries({ queryKey: ['timetables-all'] }); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => timetableApi.delete(id),
    onSuccess: () => { toast.success('Deleted.'); qc.invalidateQueries({ queryKey: ['timetables-all'] }); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: 'linear-gradient(180deg,#f5de92,#d4991f)', minHeight: '40px' }} />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(245,222,146,0.80)' }}>Admin Console</p>
          <h1 className="text-2xl font-bold" style={{ color: '#f0e6d3' }}>Timetable Generator</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>Configure parameters and generate conflict-free schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#f0e6d3' }}>
              <Zap size={17} style={{ color: '#f5de92' }} /> Generation Config
            </h2>
            <form className="space-y-3">
              <div>
                <GLabel>Department *</GLabel>
                <select className="input-field" {...register('department', { required: 'Required' })}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.department.message}</p>}
              </div>
              <div>
                <GLabel>Semester *</GLabel>
                <select className="input-field" {...register('semester', { required: 'Required', valueAsNumber: true })}>
                  <option value="">Select semester</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
                {errors.semester && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.semester.message}</p>}
              </div>
              <div>
                <GLabel>Academic Year *</GLabel>
                <select className="input-field" {...register('academicYear', { required: 'Required' })}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <GLabel>Division</GLabel>
                <input className="input-field" placeholder="A" {...register('division')} />
              </div>
              <div>
                <GLabel>Timetable Name</GLabel>
                <input className="input-field" placeholder="Auto-generated if empty" {...register('name')} />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => simulateMutation.mutate(getValues())}
                  disabled={simulateMutation.isPending}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm">
                  <BarChart3 size={14} />
                  {simulateMutation.isPending ? 'Analyzing…' : 'Simulate'}
                </button>
                <button type="button" onClick={handleSubmit((d) => generateMutation.mutate(d))}
                  disabled={generateMutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm">
                  <Play size={14} />
                  {generateMutation.isPending ? 'Generating…' : 'Generate'}
                </button>
              </div>
            </form>
          </div>

          {/* Simulation results */}
          {simulateResult && (
            <div className="rounded-xl p-4" style={{
              background: 'rgba(96,165,250,0.07)',
              border: '1px solid rgba(96,165,250,0.25)',
              backdropFilter: 'blur(12px)',
            }}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#93c5fd' }}>
                <BarChart3 size={15} /> Simulation Analysis
              </h3>
              <div className="space-y-1.5 text-xs" style={{ color: 'rgba(147,197,253,0.75)' }}>
                {[
                  ['Courses', simulateResult.courses],
                  ['Faculty', simulateResult.faculty],
                  ['Rooms', simulateResult.rooms],
                  ['Hours needed', simulateResult.totalHoursNeeded],
                  ['Available slots', simulateResult.availableSlots],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span>{label}:</span>
                    <strong style={{ color: '#bfdbfe' }}>{val}</strong>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-1" style={{ color: simulateResult.feasible ? '#34d399' : '#f87171' }}>
                  <span>Feasible:</span><strong>{simulateResult.feasible ? 'YES ✓' : 'NO ✗'}</strong>
                </div>
              </div>
              {simulateResult.warnings?.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(96,165,250,0.18)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>Warnings:</p>
                  {simulateResult.warnings.map((w, i) => (
                    <p key={i} className="text-xs" style={{ color: 'rgba(251,191,36,0.80)' }}>• {w}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {generateMutation.isPending && (
            <div className="card flex items-center gap-3">
              <div className="w-5 h-5 border-2 rounded-full animate-spin shrink-0"
                style={{ borderColor: 'rgba(212,153,31,0.25)', borderTopColor: '#d4991f' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Running CSP algorithm with local search optimization…
              </p>
            </div>
          )}
        </div>

        {/* Timetables list */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-semibold mb-4" style={{ color: '#f0e6d3' }}>
              All Timetables <span style={{ color: 'rgba(255,255,255,0.38)' }}>({data?.total || 0})</span>
            </h2>
            {isLoading ? <LoadingSpinner /> : (
              <div className="space-y-2">
                {data?.timetables?.length === 0 && (
                  <div className="text-center py-14">
                    <Calendar className="mx-auto mb-3" size={40} style={{ color: 'rgba(255,255,255,0.18)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.32)' }}>No timetables yet. Configure and generate one.</p>
                  </div>
                )}
                {data?.timetables?.map((tt) => (
                  <div key={tt._id} className="group flex items-center justify-between p-3 rounded-xl transition-all duration-150"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                    onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(212,153,31,0.30)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: '#f0e6d3' }}>{tt.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        {tt.department} · Sem {tt.semester} · {tt.academicYear}
                        {tt.division && ` · Div ${tt.division}`}
                        {tt.publishedAt && ` · Published ${formatDate(tt.publishedAt)}`}
                      </p>
                      {tt.generationMeta?.score && (
                        <p className="text-xs font-medium" style={{ color: '#34d399' }}>Score: {tt.generationMeta.score}/100</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className={STATUS_BADGE[tt.status]}>{tt.status}</span>
                      <Link to={`/admin/timetable/${tt._id}`} className="p-1.5 rounded-lg transition"
                        style={{ color: 'rgba(255,255,255,0.40)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f5de92'; e.currentTarget.style.background = 'rgba(212,153,31,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; e.currentTarget.style.background = 'transparent'; }}
                        title="View"><Eye size={15} /></Link>
                      {tt.status === 'GENERATED' && (
                        <button onClick={() => publishMutation.mutate(tt._id)} className="p-1.5 rounded-lg transition"
                          style={{ color: '#34d399' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          title="Publish"><Globe size={15} /></button>
                      )}
                      {tt.status === 'PUBLISHED' && (
                        <button onClick={() => archiveMutation.mutate(tt._id)} className="p-1.5 rounded-lg transition"
                          style={{ color: 'rgba(255,255,255,0.40)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          title="Archive"><Archive size={15} /></button>
                      )}
                      {tt.status !== 'PUBLISHED' && (
                        <button onClick={() => { if (window.confirm('Delete this timetable?')) deleteMutation.mutate(tt._id); }}
                          className="p-1.5 rounded-lg transition"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
                          title="Delete"><Trash2 size={15} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
