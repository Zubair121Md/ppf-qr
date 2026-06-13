'use client';

const LANG_LABELS = {
  tamil: 'Tamil',
  malayalam: 'Malayalam',
  hindi: 'Hindi',
  english: 'English',
};

export default function WorkerCard({ worker, stats }) {
  const { full_name, username, preferred_lang } = worker;
  const {
    status = 'IDLE',
    activeOrder = null,
    packedToday = 0,
    assignedKg = 0,
    packedKg = 0,
    errorsThisWeek = 0,
    totalPoints = 0,
    levelName = 'Bronze Packer',
    levelColor = '#CD7F32',
    estimatedEarnings = 0,
  } = stats || {};

  const statusConfig = {
    IDLE: { bg: 'bg-gray-100 text-gray-600', label: 'No active order' },
    PACKING: {
      bg: 'bg-amber-50 text-amber-800',
      label: activeOrder ? `Packing ${activeOrder.order_id}` : 'Packing',
    },
    DONE: { bg: 'bg-green-50 text-green-700', label: `${packedToday} packed today` },
  };

  const cfg = statusConfig[status] || statusConfig.IDLE;
  const progress = assignedKg > 0 ? Math.min(100, (packedKg / assignedKg) * 100) : 0;

  return (
    <div className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card relative">
      {errorsThisWeek > 0 && (
        <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
          {errorsThisWeek}
        </span>
      )}

      <div className="flex justify-between items-start gap-2 mb-2">
        <p className="font-bold text-gray-900 truncate">{full_name}</p>
        <span className="text-xs bg-surface-muted px-2 py-0.5 rounded-lg font-mono flex-shrink-0">
          {username}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-2">{LANG_LABELS[preferred_lang] || preferred_lang}</p>

      <div
        className="text-[10px] font-semibold px-2 py-1 rounded-lg mb-2 inline-block"
        style={{ backgroundColor: `${levelColor}22`, color: levelColor }}
      >
        {levelName} · {totalPoints} pts · ₹{estimatedEarnings}
      </div>

      <div className={`text-xs px-2.5 py-1.5 rounded-xl mb-3 font-medium ${cfg.bg}`}>
        {cfg.label}
        {status === 'PACKING' && activeOrder && (
          <span className="opacity-70"> · {activeOrder.kg}kg</span>
        )}
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{packedKg}/{assignedKg} kg</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
          <div className="h-full bg-farm-green rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
