import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { timetableApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { DAYS, TIME_SLOTS, COURSE_TYPE_COLORS, STATUS_BADGE } from '../../utils/helpers';
import { Calendar, Download } from 'lucide-react';

const SESSION_COLORS = {
  LECTURE:  { cls: 'border-l-[3px] border-blue-400',   bg: 'rgba(96,165,250,0.12)',  text: '#93c5fd', accent: '#60a5fa' },
  PRACTICAL:{ cls: 'border-l-[3px] border-purple-400', bg: 'rgba(192,132,252,0.12)', text: '#d8b4fe', accent: '#c084fc' },
  TUTORIAL: { cls: 'border-l-[3px] border-emerald-400',bg: 'rgba(52,211,153,0.12)',  text: '#6ee7b7', accent: '#34d399' },
  PROJECT:  { cls: 'border-l-[3px] border-amber-400',  bg: 'rgba(251,191,36,0.12)',  text: '#fcd34d', accent: '#f59e0b' },
};

export default function TimetableView() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['timetable', id],
    queryFn: () => timetableApi.getById(id).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner message="Loading timetable..." />;
  if (error) return (
    <div className="card text-center py-12">
      <p className="text-red-500 font-medium">{error.message || 'Failed to load timetable'}</p>
    </div>
  );

  const tt = data?.timetable;
  if (!tt) return null;

  // Build grid: day -> timeSlotId -> entry
  const grid = {};
  DAYS.forEach((d) => { grid[d] = {}; });
  tt.schedule?.forEach((entry) => {
    if (!grid[entry.day]) grid[entry.day] = {};
    for (let i = 0; i < (entry.duration || 1); i++) {
      grid[entry.day][entry.timeSlotId + i] = { ...entry, isFirst: i === 0, span: entry.duration };
    }
  });

  const workingSlots = TIME_SLOTS.filter((s) => !s.isBreak);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={20} className="text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">{tt.name}</h1>
            <span className={STATUS_BADGE[tt.status]}>{tt.status}</span>
          </div>
          <p className="text-gray-500 text-sm">
            {tt.department} · Semester {tt.semester} · {tt.academicYear}
            {tt.division && ` · Division ${tt.division}`}
          </p>
          {tt.generationMeta?.score > 0 && (
            <p className="text-xs text-green-600 mt-1">
              Algorithm Score: {tt.generationMeta.score}/100 · Generated in {(tt.generationMeta.duration / 1000).toFixed(2)}s
              · {tt.generationMeta.conflictsResolved} conflicts resolved
            </p>
          )}
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm w-fit" onClick={() => window.print()}>
          <Download size={15} /> Export / Print
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(SESSION_COLORS).map(([type, cfg]) => (
          <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: cfg.bg, border: `1px solid ${cfg.accent}33` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.accent }} />
            <span className="text-xs font-medium capitalize" style={{ color: cfg.text }}>{type.toLowerCase()}</span>
          </div>
        ))}
      </div>

      {/* Timetable grid */}
      <div className="card overflow-x-auto p-0">
        <div className="timetable-grid" style={{ gridTemplateColumns: `110px repeat(${DAYS.length}, 1fr)` }}>
          {/* Time header */}
          <div className="timetable-header">Time / Day</div>
          {DAYS.map((d) => <div key={d} className="timetable-header">{d}</div>)}

          {/* Rows */}
          {workingSlots.map((slot) => (
            <>
              <div key={`time-${slot.id}`} className="timetable-cell flex items-center justify-center text-center leading-tight" style={{ background: 'rgba(212,153,31,0.07)', color: '#d4a843', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em' }}>
                {slot.label}
              </div>
              {DAYS.map((day) => {
                const entry = grid[day][slot.id];
                if (!entry) {
                  return <div key={`${day}-${slot.id}`} className="timetable-cell" />;
                }
                if (!entry.isFirst) return null; // handled by span

                const cfg = SESSION_COLORS[entry.sessionType] || SESSION_COLORS.LECTURE;

                return (
                  <div
                    key={`${day}-${slot.id}`}
                    className={`timetable-cell ${cfg.cls} rounded-lg m-1 p-2 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-default`}
                    style={{ gridRow: `span ${entry.span || 1}`, background: cfg.bg, boxShadow: `inset 0 0 0 1px ${cfg.accent}22` }}
                  >
                    <p className="font-bold text-xs leading-tight truncate" style={{ color: cfg.accent }}>
                      {entry.course?.code || '?'}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }} title={entry.course?.name}>
                      {entry.course?.name?.substring(0, 20)}{entry.course?.name?.length > 20 ? '…' : ''}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      {entry.faculty?.name?.split(' ')[0]}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {entry.room?.roomNumber}
                    </p>
                    {entry.duration > 1 && (
                      <span className="badge badge-purple mt-1">{entry.duration}hr lab</span>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Schedule list view */}
      <div className="card">
        <h3 className="font-semibold mb-4" style={{ color: '#f5de92' }}>All Sessions <span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.45)' }}>({tt.schedule?.length})</span></h3>
        <div className="overflow-x-auto">
          <table className="official-table">
            <thead>
              <tr>
                {['Course', 'Type', 'Day', 'Time', 'Faculty', 'Room', 'Duration'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tt.schedule?.map((entry, i) => {
                const cfg = SESSION_COLORS[entry.sessionType] || SESSION_COLORS.LECTURE;
                return (
                  <tr key={i}>
                    <td>
                      <p className="font-semibold text-xs" style={{ color: '#f5de92' }}>{entry.course?.code}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>{entry.course?.name}</p>
                    </td>
                    <td>
                      <span className="badge text-xs" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.accent}44` }}>
                        {entry.sessionType}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.70)' }}>{entry.day}</td>
                    <td style={{ color: 'rgba(255,255,255,0.60)', fontSize: '0.72rem' }}>{entry.startTime} – {entry.endTime}</td>
                    <td style={{ color: 'rgba(255,255,255,0.70)' }}>{entry.faculty?.name}</td>
                    <td style={{ color: 'rgba(255,255,255,0.70)' }}>{entry.room?.roomNumber}</td>
                    <td style={{ color: 'rgba(255,255,255,0.60)' }}>{entry.duration}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
