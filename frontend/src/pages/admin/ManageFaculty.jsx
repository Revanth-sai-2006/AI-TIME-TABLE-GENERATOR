import { useQuery } from '@tanstack/react-query';
import { facultyApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

const designationColors = {
  PROFESSOR: 'badge-red',
  ASSOCIATE_PROFESSOR: 'badge-blue',
  ASSISTANT_PROFESSOR: 'badge-green',
  LECTURER: 'badge-gray',
  VISITING: 'badge-yellow',
};

export default function ManageFaculty() {
  const { data, isLoading } = useQuery({
    queryKey: ['faculty-list'],
    queryFn: () => facultyApi.list({ limit: 50 }).then((r) => r.data),
  });

  const { data: workloadData } = useQuery({
    queryKey: ['workload-all'],
    queryFn: () => facultyApi.getWorkload().then((r) => r.data),
  });

  const workloadMap = {};
  workloadData?.summary?.forEach((w) => { workloadMap[w.id] = w; });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: 'linear-gradient(180deg,#fb923c,#ea580c)', minHeight: '40px' }} />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(251,146,60,0.80)' }}>Admin Console</p>
          <h1 className="text-2xl font-bold" style={{ color: '#f0e6d3' }}>Faculty Management</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>View faculty profiles and workload balance</p>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.faculty?.length === 0 && (
            <p className="col-span-full text-center py-12" style={{ color: 'rgba(255,255,255,0.28)' }}>No faculty registered yet.</p>
          )}
          {data?.faculty?.map((f) => {
            const wl = workloadMap[f._id];
            const pct = wl ? Math.min(100, parseFloat(wl.utilization)) : 0;
            const barColor = wl?.status === 'OVERLOADED' ? '#ef4444' : wl?.status === 'HIGH' ? '#f97316' : '#22c55e';
            return (
              <div key={f._id} className="card hover-lift transition-all duration-200">
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                    style={{ background: 'rgba(212,153,31,0.18)', color: '#e8b83a', border: '1px solid rgba(212,153,31,0.30)' }}>
                    {f.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: '#f0e6d3' }}>{f.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.employeeId} · {f.department}</p>
                    <span className={`badge mt-1 ${designationColors[f.designation] || 'badge-gray'}`}>
                      {f.designation?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {wl && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <span>Workload</span>
                      <span className="font-semibold" style={{ color: barColor }}>
                        {wl.currentHours}/{wl.maxHours} hrs ({wl.utilization}%)
                      </span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    {wl.status === 'OVERLOADED' && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
                        <AlertTriangle size={11} /> Overloaded
                      </p>
                    )}
                  </div>
                )}

                {f.specializations?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {f.specializations.slice(0, 2).map((s) => (
                      <span key={s} className="badge badge-gray text-xs">{s}</span>
                    ))}
                    {f.specializations.length > 2 && (
                      <span className="badge badge-gray">+{f.specializations.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
