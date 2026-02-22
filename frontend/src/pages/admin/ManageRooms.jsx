import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { roomApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, Search, Edit2, Trash2, X, DoorOpen, Monitor, Cpu } from 'lucide-react';

const ROOM_TYPES = ['CLASSROOM', 'LAB', 'SEMINAR_HALL', 'AUDITORIUM'];

const GLabel = ({ children }) => (
  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.48)' }}>{children}</label>
);

function RoomModal({ room, onClose, onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: room || { capacity: 60, floor: 0 } });
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-modal w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-bold text-lg" style={{ color: '#f0e6d3' }}>{room ? 'Edit Room' : 'Add Room'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <GLabel>Room No. *</GLabel>
              <input className="input-field" placeholder="A101" {...register('roomNumber', { required: 'Required' })} />
              {errors.roomNumber && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.roomNumber.message}</p>}
            </div>
            <div>
              <GLabel>Building *</GLabel>
              <input className="input-field" placeholder="Block A" {...register('building', { required: 'Required' })} />
              {errors.building && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.building.message}</p>}
            </div>
            <div>
              <GLabel>Type *</GLabel>
              <select className="input-field" {...register('type', { required: 'Required' })}>
                <option value="">Select type</option>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <GLabel>Capacity *</GLabel>
              <input type="number" className="input-field" min="1" {...register('capacity', { required: 'Required', valueAsNumber: true })} />
            </div>
            <div>
              <GLabel>Floor</GLabel>
              <input type="number" className="input-field" {...register('floor', { valueAsNumber: true })} />
            </div>
            <div>
              <GLabel>Department</GLabel>
              <input className="input-field" placeholder="CSE (blank = shared)" {...register('department')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{room ? 'Update' : 'Add'} Room</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const typeIcon = { CLASSROOM: DoorOpen, LAB: Cpu, SEMINAR_HALL: Monitor, AUDITORIUM: Monitor };
const typeBadge = { CLASSROOM: 'badge-blue', LAB: 'badge-purple', SEMINAR_HALL: 'badge-green', AUDITORIUM: 'badge-yellow' };

export default function ManageRooms() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', filterType],
    queryFn: () => roomApi.list({ type: filterType, limit: 50 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => roomApi.create(d),
    onSuccess: () => { toast.success('Room added!'); qc.invalidateQueries({ queryKey: ['rooms'] }); setShowModal(false); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roomApi.update(id, data),
    onSuccess: () => { toast.success('Room updated!'); qc.invalidateQueries({ queryKey: ['rooms'] }); setShowModal(false); setEditRoom(null); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roomApi.delete(id),
    onSuccess: () => { toast.success('Room deactivated'); qc.invalidateQueries({ queryKey: ['rooms'] }); },
    onError: (err) => toast.error(err.message),
  });

  const filtered = data?.rooms?.filter((r) =>
    r.roomNumber.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: 'linear-gradient(180deg,#34d399,#059669)', minHeight: '40px' }} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(52,211,153,0.80)' }}>Admin Console</p>
            <h1 className="text-2xl font-bold" style={{ color: '#f0e6d3' }}>Rooms &amp; Labs</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>Manage classrooms, laboratories, and halls</p>
          </div>
        </div>
        <button onClick={() => { setEditRoom(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={16} /> Add Room
        </button>
      </div>

      {/* Content card */}
      <div className="card !p-0">
        <div className="flex gap-3 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.28)' }} />
            <input className="input-field pl-9" placeholder="Search rooms…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-44" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="p-4">
          {isLoading ? <div className="py-10"><LoadingSpinner /></div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered?.length === 0 && (
                <p className="col-span-full text-center py-10" style={{ color: 'rgba(255,255,255,0.28)' }}>No rooms found</p>
              )}
              {filtered?.map((r) => {
                const Icon = typeIcon[r.type] || DoorOpen;
                return (
                  <div key={r._id} className="group rounded-xl p-4 transition-all duration-200 cursor-default"
                    style={{ border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(212,153,31,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg" style={{ background: 'rgba(212,153,31,0.12)' }}>
                          <Icon size={16} style={{ color: '#d4991f' }} />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#f0e6d3' }}>{r.roomNumber}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.building} · Floor {r.floor}</p>
                        </div>
                      </div>
                      <span className={`badge ${typeBadge[r.type] || 'badge-gray'}`}>{r.type}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Capacity: <span className="font-semibold" style={{ color: '#f0e6d3' }}>{r.capacity}</span>
                    </p>
                    {r.department && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Dept: {r.department}</p>}
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditRoom(r); setShowModal(true); }} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => { if (window.confirm('Deactivate room?')) deleteMutation.mutate(r._id); }} className="btn-danger text-xs py-1 px-3 flex items-center gap-1"><Trash2 size={12} /> Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <RoomModal
          room={editRoom}
          onClose={() => { setShowModal(false); setEditRoom(null); }}
          onSave={(d) => editRoom ? updateMutation.mutate({ id: editRoom._id, data: d }) : createMutation.mutate(d)}
        />
      )}
    </div>
  );
}
