import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ToggleLeft, ToggleRight, Edit2, X } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const roleBadge = { ADMIN: 'badge-red', FACULTY: 'badge-blue', STUDENT: 'badge-green' };
const DEPTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'BCA', 'MCA'];
const SEMS  = [1, 2, 3, 4, 5, 6, 7, 8];

function EditUserModal({ user, onClose, onSave }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user.name || '',
      department: user.department || '',
      semester: user.semester || '',
      division: user.division || '',
      studentId: user.studentId || '',
      employeeId: user.employeeId || '',
    },
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-modal w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-bold text-base" style={{ color: '#f0e6d3' }}>Edit User — {user.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.45)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>Full Name</label>
            <input className="input-field" {...register('name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>Department</label>
              <select className="input-field" {...register('department')}>
                <option value="">— None —</option>
                {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {user.role === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>Semester</label>
                <select className="input-field" {...register('semester', { valueAsNumber: true })}>
                  <option value="">— None —</option>
                  {SEMS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            )}
          </div>
          {user.role === 'STUDENT' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>Division</label>
                <input className="input-field" placeholder="A" {...register('division')} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>Student ID</label>
                <input className="input-field" {...register('studentId')} />
              </div>
            </div>
          )}
          {user.role === 'FACULTY' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>Employee ID</label>
              <input className="input-field" {...register('employeeId')} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageUsers() {
  const qc = useQueryClient();
  const [editingUser, setEditingUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.listUsers({ limit: 50 }).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => authApi.toggleUserStatus(id),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => authApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      setEditingUser(null);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(formData) => updateMutation.mutate({ id: editingUser._id, data: formData })}
        />
      )}
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: 'linear-gradient(180deg,#60a5fa,#2563eb)', minHeight: '40px' }} />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(96,165,250,0.80)' }}>Admin Console</p>
          <h1 className="text-2xl font-bold" style={{ color: '#f0e6d3' }}>User Management</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>Manage all system users and their access</p>
        </div>
      </div>

      <div className="card !p-0">
        {isLoading ? <div className="py-12"><LoadingSpinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Name', 'Email', 'Role', 'Dept / Sem', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.36)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.users?.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12" style={{ color: 'rgba(255,255,255,0.28)' }}>No users found</td></tr>
                )}
                {data?.users?.map((u) => (
                  <tr key={u._id} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: 'rgba(212,153,31,0.15)', color: '#e8b83a', border: '1px solid rgba(212,153,31,0.25)' }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium block" style={{ color: '#f0e6d3' }}>{u.name}</span>
                          {u.lastLogin && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>{formatDate(u.lastLogin)}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4" style={{ color: 'rgba(255,255,255,0.52)' }}>{u.email}</td>
                    <td className="py-3 px-4"><span className={`badge ${roleBadge[u.role]}`}>{u.role}</span></td>
                    <td className="py-3 px-4">
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{u.department || '—'}</span>
                      {u.semester && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>Sem {u.semester}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 rounded-lg transition"
                          style={{ color: '#60a5fa' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          title="Edit user"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(u._id)}
                          disabled={toggleMutation.isPending}
                          className="p-1.5 rounded-lg transition"
                          style={{ color: u.isActive ? '#f87171' : '#34d399' }}
                          onMouseEnter={e => e.currentTarget.style.background = u.isActive ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
