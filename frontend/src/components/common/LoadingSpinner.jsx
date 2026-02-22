export default function LoadingSpinner({ fullscreen = false, message = 'Loading...' }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-primary-100" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gold-500" />
        </div>
      </div>
      {message && (
        <div className="text-center">
          <p className="text-primary-800 text-sm font-semibold">{message}</p>
          <p className="text-gray-400 text-xs mt-0.5">Please wait…</p>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center z-50 gap-6"
        style={{ background: 'linear-gradient(160deg,#1c0508 0%,#6b1a24 55%,#2a0c12 100%)' }}
      >
        {/* Emblem with spinning ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute rounded-full border-2 border-transparent" style={{ width:'136px', height:'136px', borderTopColor:'rgba(212,153,31,0.6)', animation:'spin 2.5s linear infinite' }} />
          <div className="absolute rounded-full border border-white/10" style={{ width:'120px', height:'120px' }} />
          <div className="emblem-glow w-24 h-24 bg-white rounded-full flex items-center justify-center p-2">
            <img src="/assets/tripura-emblem.png" alt="Government of Tripura" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-0.5" style={{ color: '#f5de92' }}>Government of Tripura</p>
          <p className="text-white font-bold text-xl tracking-wide mt-1">TimetableGen</p>
          <p className="text-xs mt-1 tracking-widest uppercase text-glow-amis">Academic Management Information System</p>
          {message && <p className="text-white/60 text-sm mt-3 animate-pulse">{message}</p>}
        </div>
      </div>
    );
  }
  return <div className="flex items-center justify-center py-12">{content}</div>;
}
