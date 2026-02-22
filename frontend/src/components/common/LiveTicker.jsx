import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../../services/api';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────── */
const COLORS = {
  positive: { text: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: TrendingUp,   border: 'rgba(74,222,128,0.25)' },
  negative: { text: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: TrendingDown, border: 'rgba(248,113,113,0.25)' },
  neutral:  { text: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: Minus,        border: 'rgba(251,191,36,0.25)' },
  info:     { text: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: Activity,     border: 'rgba(96,165,250,0.25)' },
};

const ACTION_LABEL = {
  REGISTERED: '▲ REGISTERED',
  DROPPED:    '▼ DROPPED',
  CREATED:    '▲ CREATED',
  UPDATED:    '● UPDATED',
  DELETED:    '▼ DELETED',
  LOGIN:      '→ LOGIN',
  GENERATED:  '▲ GENERATED',
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── TickerChip ──────────────────────────────────────────────── */
function TickerChip({ activity }) {
  const c = COLORS[activity.sentiment] || COLORS.neutral;
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <Icon size={10} strokeWidth={2.5} />
      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{ACTION_LABEL[activity.action] ?? activity.action}</span>
      <span className="font-bold">{activity.entityName || activity.entity}</span>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>·</span>
      <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '10px' }}>{activity.actor}</span>
      <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: '10px' }}>{timeAgo(activity.createdAt)}</span>
    </span>
  );
}

/* ── LiveTicker ──────────────────────────────────────────────── */
export default function LiveTicker() {
  const { data } = useQuery({
    queryKey: ['activity-ticker'],
    queryFn:  () => activityApi.getRecent(20).then(r => r.data),
    refetchInterval: 6000,
    staleTime: 0,
  });

  const activities = data?.activities ?? [];

  // Duplicate for seamless loop
  const items = [...activities, ...activities];

  if (activities.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-lg flex items-center gap-0"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        height: '36px',
      }}
    >
      {/* LIVE badge */}
      <div
        className="shrink-0 flex items-center gap-1.5 px-3 h-full border-r z-10"
        style={{ background: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.25)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-xs font-bold tracking-widest" style={{ color: '#f87171' }}>LIVE</span>
      </div>

      {/* Scrolling strip */}
      <div className="flex-1 overflow-hidden relative">
        {/* fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.4), transparent)' }} />

        <div className="flex items-center gap-3 ticker-scroll px-4 h-full">
          {items.map((a, i) => (
            <TickerChip key={`${a._id}-${i}`} activity={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
