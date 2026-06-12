export default function ProgressBar({ value = 0, max = 100, label, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-sm text-gray-600 mb-1.5">
          <span>{label}</span>
          <span className="font-medium">{pct}%</span>
        </div>
      )}
      <div className="h-2.5 bg-surface-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-farm-green rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
