import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { timetableApi, courseApi, roomApi, facultyApi, activityApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LiveTicker from '../../components/common/LiveTicker';
import { Calendar, BookOpen, DoorOpen, GraduationCap, Plus, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, ArrowRight, Clock, Activity, Minus, UserCheck } from 'lucide-react';
import { STATUS_BADGE, formatDate } from '../../utils/helpers';

function KpiCard({ icon: Icon, label, value, accent = '#6b1a24', link, sub }) {
  const card = (
    <div
      className="hover-lift hover-shimmer rounded-xl p-5 flex flex-col gap-3 transition-all group cursor-pointer"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)`,
        border: `1px solid rgba(255,255,255,0.14)`,
        borderTop: `3px solid ${accent}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.1)`,
      }}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold tracking-tight" style={{ color: '#f0e6d3' }}>{value ?? '—'}</p>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.50)' }}>{label}</p>
        </div>
        <div className="icon-pulse p-2.5 rounded-lg shrink-0" style={{ background: `${accent}30`, border: `1px solid ${accent}50` }}>
          <Icon size={20} style={{ color: accent === '#6b1a24' ? '#f47a88' : accent === '#7c3aed' ? '#c084fc' : accent === '#b45309' ? '#fbbf24' : '#34d399' }} />
        </div>
      </div>
      {sub && <p className="text-xs pt-2.5 mt-auto border-t" style={{ color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.08)' }}>{sub}</p>}
    </div>
  );
  return link ? <Link to={link}>{card}</Link> : card;
}

export default function AdminDashboard() {
  const { data: timetables, isLoading: ttLoading } = useQuery({
    queryKey: ['timetables-list'],
    queryFn: () => timetableApi.list({ limit: 5 }).then((r) => r.data),
  });
  const { data: coursesData } = useQuery({
    queryKey: ['courses-count'],
    queryFn: () => courseApi.list({ limit: 1 }).then((r) => r.data),
  });
  const { data: roomsData } = useQuery({
    queryKey: ['rooms-count'],
    queryFn: () => roomApi.list({ limit: 1 }).then((r) => r.data),
  });
  const { data: facultyData } = useQuery({
    queryKey: ['faculty-count'],
    queryFn: () => facultyApi.list({ limit: 1 }).then((r) => r.data),
  });
  const { data: workload } = useQuery({
    queryKey: ['workload'],
    queryFn: () => facultyApi.getWorkload().then((r) => r.data),
  });

  const { data: activityData } = useQuery({
    queryKey: ['activity-feed'],
    queryFn:  () => activityApi.getRecent(25).then(r => r.data),
    refetchInterval: 5000,
    staleTime: 0,
  });

  const activities  = activityData?.activities ?? [];
  const actStats    = activityData?.stats ?? {};
  const overloaded  = workload?.summary?.filter((f) => f.status === 'OVERLOADED') || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">

      {/* ── Premium Page Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-1 rounded-full self-stretch shrink-0" style={{ background: 'linear-gradient(180deg,#6b1a24,#d4991f)', minHeight: '48px' }} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(212,153,31,0.85)' }}>Admin Console</p>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#f0e6d3' }}>Administrator Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>NEP 2020 Academic Timetable Management Information System</p>
          </div>
        </div>
        <Link
          to="/admin/timetable/generate"
          className="hover-wobble hover-shimmer flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shrink-0 transition-all"
          style={{ background: '#6b1a24', color: '#f5de92', boxShadow: '0 2px 8px rgba(107,26,36,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background='#5a1520'}
          onMouseLeave={e => e.currentTarget.style.background='#6b1a24'}
        >
          <Plus size={15} /> Generate Timetable
        </Link>
      </div>
      {/* ── Live Ticker ──────────────────────────────────── */}
      <LiveTicker />
      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Calendar}      label="Total Timetables" value={timetables?.total}  accent="#6b1a24" link="/admin/timetable/generate" sub="Click to manage timetables" />
        <KpiCard icon={BookOpen}      label="Active Courses"   value={coursesData?.total} accent="#7c3aed" link="/admin/courses"             sub="Click to manage courses" />
        <KpiCard icon={DoorOpen}      label="Rooms & Labs"     value={roomsData?.total}   accent="#b45309" link="/admin/rooms"               sub="Click to manage rooms" />
        <KpiCard icon={GraduationCap} label="Faculty Members"  value={facultyData?.total} accent="#059669" link="/admin/faculty"             sub="Click to manage faculty" />
      </div>

      {/* ── Workload Alert ─────────────────────────────────── */}
      {overloaded.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg p-4" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)', backdropFilter: 'blur(8px)' }}>
          <AlertTriangle className="shrink-0 mt-0.5" style={{ color: '#f87171' }} size={16} />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#fca5a5' }}>Faculty Workload Alert</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(252,165,165,0.75)' }}>
              {overloaded.length} member{overloaded.length > 1 ? 's' : ''} overloaded: {overloaded.map((f) => f.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Main content grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Recent Timetables — wider */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          {/* card header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ background: '#d4991f' }} />
              <Calendar size={15} style={{ color: '#e8b83a' }} />
              <h2 className="font-semibold text-sm" style={{ color: '#f0e6d3' }}>Recent Timetables</h2>
            </div>
            <Link to="/admin/timetable/generate"
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: '#e8b83a' }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {/* card body */}
          <div>
            {ttLoading ? <div className="py-8"><LoadingSpinner /></div> : (
              <>
                {timetables?.timetables?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Calendar size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No timetables yet. Generate one!</p>
                  </div>
                )}
                {timetables?.timetables?.map((tt) => (
                  <Link
                    key={tt._id}
                    to={`/admin/timetable/${tt._id}`}
                    className="hover-slide-arrow flex items-center justify-between px-5 py-3.5 transition-all group"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(212,153,31,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="icon-pulse w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(212,153,31,0.15)', border: '1px solid rgba(212,153,31,0.25)' }}>
                        <Calendar size={14} style={{ color: '#e8b83a' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#f0e6d3' }}>{tt.name}</p>
                        <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.40)' }}>
                          <Clock size={10} /> {tt.department} · Sem {tt.semester} · {tt.academicYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_BADGE[tt.status]}>{tt.status}</span>
                      <span className="slide-arrow"><ArrowRight size={13} /></span>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Faculty Workload — narrower */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-1 h-5 rounded-full" style={{ background: '#d4991f' }} />
            <TrendingUp size={15} style={{ color: '#e8b83a' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#f0e6d3' }}>Faculty Workload</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {!workload?.summary && <LoadingSpinner />}
            {workload?.summary?.slice(0, 5).map((f) => (
              <div key={f.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#f0e6d3' }}>{f.name}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.40)' }}>{f.designation}</p>
                  </div>
                  <span className={`ml-2 shrink-0 badge ${f.status === 'OVERLOADED' ? 'badge-red' : f.status === 'HIGH' ? 'badge-yellow' : 'badge-green'}`}>
                    {f.utilization}%
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.10)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, f.utilization)}%`,
                      background: f.status === 'OVERLOADED' ? '#f87171' : f.status === 'HIGH' ? '#fbbf24' : '#34d399',
                      transition: 'width 0.4s ease',
                      boxShadow: f.status === 'OVERLOADED' ? '0 0 6px rgba(248,113,113,0.6)' : f.status === 'HIGH' ? '0 0 6px rgba(251,191,36,0.6)' : '0 0 6px rgba(52,211,153,0.6)',
                    }}
                  />
                </div>
              </div>
            ))}
            {workload?.summary?.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>No faculty data available</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-1 h-5 rounded-full" style={{ background: '#34d399' }} />
          <CheckCircle size={15} style={{ color: '#34d399' }} />
          <h2 className="font-semibold text-sm" style={{ color: '#f0e6d3' }}>Quick Actions</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/admin/timetable/generate', label: 'Generate Timetable', icon: Calendar,      accent: '#f47a88', border: 'rgba(244,122,136,0.35)' },
            { to: '/admin/courses',            label: 'Manage Courses',     icon: BookOpen,      accent: '#c084fc', border: 'rgba(192,132,252,0.35)' },
            { to: '/admin/rooms',              label: 'Manage Rooms',       icon: DoorOpen,      accent: '#fbbf24', border: 'rgba(251,191,36,0.35)'  },
            { to: '/admin/faculty',            label: 'Manage Faculty',     icon: GraduationCap, accent: '#34d399', border: 'rgba(52,211,153,0.35)'  },
          ].map(({ to, label, icon: Icon, accent, border }) => (
            <Link
              key={to}
              to={to}
              className="hover-lift hover-shimmer flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, color: accent }}
              onMouseEnter={e => { e.currentTarget.style.background=`rgba(255,255,255,0.10)`; e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow='none'; }}
            >
              <Icon size={15} />
              <span className="hover-underline-slide">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Live Activity Analytics ──────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ background: '#60a5fa' }} />
            <Activity size={15} style={{ color: '#60a5fa' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#f0e6d3' }}>Live Activity Analytics</h2>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
              <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>Auto-refreshes every 5s</span>
        </div>

        {/* Sensex-style stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', divideColor: 'rgba(255,255,255,0.08)' }}>
          {[
            { label: 'Registrations',  value: actStats.registrations ?? 0,  color: '#4ade80', Icon: TrendingUp   },
            { label: 'Drops',          value: actStats.drops ?? 0,            color: '#f87171', Icon: TrendingDown },
            { label: 'Created',        value: actStats.creations ?? 0,        color: '#a78bfa', Icon: CheckCircle  },
            { label: 'Updates',        value: actStats.updates ?? 0,          color: '#fbbf24', Icon: Minus        },
            { label: 'Deletions',      value: actStats.deletions ?? 0,        color: '#f97316', Icon: TrendingDown },
            { label: 'Logins (24h)',   value: actStats.logins ?? 0,           color: '#60a5fa', Icon: UserCheck    },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} className="flex flex-col items-center justify-center py-3 gap-0.5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-1">
                <Icon size={11} style={{ color }} />
                <span className="text-xl font-bold tracking-tight" style={{ color }}>{value}</span>
              </div>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Activity log list */}
        <div className="divide-y max-h-72 overflow-y-auto" style={{ divideColor: 'rgba(255,255,255,0.06)' }}>
          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Activity size={28} style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>No activity yet. Actions by faculty and students will appear here.</p>
            </div>
          )}
          {activities.map((act) => {
            const isPos = act.sentiment === 'positive';
            const isNeg = act.sentiment === 'negative';
            const isInfo = act.sentiment === 'info';
            const accentColor = isPos ? '#4ade80' : isNeg ? '#f87171' : isInfo ? '#60a5fa' : '#fbbf24';
            const ChangeIcon = isPos ? TrendingUp : isNeg ? TrendingDown : isInfo ? Activity : Minus;
            return (
              <div
                key={act._id}
                className="flex items-center gap-3 px-5 py-2.5 transition-colors"
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                {/* Role avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
                >
                  {act.actor?.[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Tick arrow */}
                <ChangeIcon size={12} style={{ color: accentColor, flexShrink: 0 }} />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: '#f0e6d3' }}>
                    <span className="font-semibold">{act.actor}</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}> · {act.actorRole}</span>
                    {'  '}
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-semibold"
                      style={{ background: `${accentColor}15`, color: accentColor }}
                    >{act.action}</span>
                    {'  '}
                    <span className="font-medium">{act.entityName || act.entity}</span>
                  </p>
                  {act.details && (
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{act.details}</p>
                  )}
                </div>

                {/* Timestamp */}
                <span className="shrink-0 text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

