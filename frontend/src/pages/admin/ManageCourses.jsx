import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { courseApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const DEPTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'BCA', 'MCA'];
const TYPES = ['THEORY', 'PRACTICAL', 'ELECTIVE', 'OPEN_ELECTIVE', 'PROJECT'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const GLabel = ({ children }) => (
  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>{children}</label>
);

function CourseModal({ course, onClose, onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: course || {} });
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-modal w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-bold text-lg" style={{ color: '#f0e6d3' }}>{course ? 'Edit Course' : 'Add New Course'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <GLabel>Course Code *</GLabel>
              <input className="input-field uppercase" placeholder="CS501" {...register('code', { required: 'Required' })} />
              {errors.code && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.code.message}</p>}
            </div>
            <div>
              <GLabel>Credits *</GLabel>
              <input type="number" className="input-field" min="1" max="6" {...register('credits', { required: 'Required', valueAsNumber: true })} />
              {errors.credits && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.credits.message}</p>}
            </div>
            <div className="col-span-2">
              <GLabel>Course Name *</GLabel>
              <input className="input-field" placeholder="Operating Systems" {...register('name', { required: 'Required' })} />
              {errors.name && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.name.message}</p>}
            </div>
            <div>
              <GLabel>Type *</GLabel>
              <select className="input-field" {...register('type', { required: 'Required' })}>
                <option value="">Select type</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <GLabel>Semester *</GLabel>
              <select className="input-field" {...register('semester', { required: 'Required', valueAsNumber: true })}>
                <option value="">Select</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <GLabel>Department *</GLabel>
              <select className="input-field" {...register('department', { required: 'Required' })}>
                <option value="">Select</option>
                {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <GLabel>Hours/Week *</GLabel>
              <input type="number" className="input-field" min="1" {...register('hoursPerWeek', { required: 'Required', valueAsNumber: true })} />
            </div>
            <div>
              <GLabel>Theory Hours</GLabel>
              <input type="number" className="input-field" min="0" defaultValue={0} {...register('theoryHours', { valueAsNumber: true })} />
            </div>
            <div>
              <GLabel>Practical Hours</GLabel>
              <input type="number" className="input-field" min="0" defaultValue={0} {...register('practicalHours', { valueAsNumber: true })} />
            </div>
            <div>
              <GLabel>Lab Duration (hrs)</GLabel>
              <input type="number" className="input-field" min="0" defaultValue={2} {...register('labDurationHours', { valueAsNumber: true })} />
            </div>
            <div>
              <GLabel>Batch Size</GLabel>
              <input type="number" className="input-field" min="1" defaultValue={60} {...register('maxBatchSize', { valueAsNumber: true })} />
            </div>
            <div className="col-span-2 flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                <input type="checkbox" className="rounded accent-amber-400" {...register('requiresLab')} />
                Requires Lab
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                <input type="checkbox" className="rounded accent-amber-400" {...register('isElective')} />
                Is Elective
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{course ? 'Update' : 'Create'} Course</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageCourses() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', filterDept, filterSem],
    queryFn: () => courseApi.list({ department: filterDept, semester: filterSem, limit: 50 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => courseApi.create(data),
    onSuccess: () => { toast.success('Course created!'); qc.invalidateQueries({ queryKey: ['courses'] }); setShowModal(false); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => courseApi.update(id, data),
    onSuccess: () => { toast.success('Course updated!'); qc.invalidateQueries({ queryKey: ['courses'] }); setShowModal(false); setEditCourse(null); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => courseApi.delete(id),
    onSuccess: () => { toast.success('Course deactivated'); qc.invalidateQueries({ queryKey: ['courses'] }); },
    onError: (err) => toast.error(err.message),
  });

  const filtered = data?.courses?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: 'linear-gradient(180deg,#c084fc,#7c3aed)', minHeight: '40px' }} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(192,132,252,0.80)' }}>Admin Console</p>
            <h1 className="text-2xl font-bold" style={{ color: '#f0e6d3' }}>Courses</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>NEP 2020 credit-based course catalog</p>
          </div>
        </div>
        <button onClick={() => { setEditCourse(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* Table card */}
      <div className="card !p-0">
        <div className="flex flex-wrap gap-3 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.28)' }} />
            <input className="input-field pl-9" placeholder="Search by name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-36" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="">All Depts</option>
            {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input-field w-36" value={filterSem} onChange={(e) => setFilterSem(e.target.value)}>
            <option value="">All Sems</option>
            {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>

        {isLoading ? <div className="py-12"><LoadingSpinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Code', 'Name', 'Type', 'Dept', 'Sem', 'Credits', 'Hrs/Wk', 'Lab', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.36)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered?.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12" style={{ color: 'rgba(255,255,255,0.28)' }}>No courses found</td></tr>
                )}
                {filtered?.map((c) => (
                  <tr key={c._id} className="group transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="py-3 px-3 font-mono font-bold text-xs" style={{ color: '#c084fc' }}>{c.code}</td>
                    <td className="py-3 px-3 font-medium max-w-[200px] truncate" style={{ color: '#f0e6d3' }}>{c.name}</td>
                    <td className="py-3 px-3"><span className="badge badge-blue">{c.type}</span></td>
                    <td className="py-3 px-3" style={{ color: 'rgba(255,255,255,0.52)' }}>{c.department}</td>
                    <td className="py-3 px-3" style={{ color: 'rgba(255,255,255,0.52)' }}>{c.semester}</td>
                    <td className="py-3 px-3" style={{ color: 'rgba(255,255,255,0.52)' }}>{c.credits}</td>
                    <td className="py-3 px-3" style={{ color: 'rgba(255,255,255,0.52)' }}>{c.hoursPerWeek}</td>
                    <td className="py-3 px-3">
                      {c.requiresLab ? <span className="badge badge-purple">Yes</span> : <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditCourse(c); setShowModal(true); }} className="p-1.5 rounded transition"
                          style={{ color: '#60a5fa' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Edit2 size={13} /></button>
                        <button onClick={() => { if (window.confirm('Deactivate course?')) deleteMutation.mutate(c._id); }}
                          className="p-1.5 rounded transition" style={{ color: '#f87171' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CourseModal
          course={editCourse}
          onClose={() => { setShowModal(false); setEditCourse(null); }}
          onSave={(data) => editCourse ? updateMutation.mutate({ id: editCourse._id, data }) : createMutation.mutate(data)}
        />
      )}
    </div>
  );
}
