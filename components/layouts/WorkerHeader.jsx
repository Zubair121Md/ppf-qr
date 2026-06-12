'use client';

export default function WorkerHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  variant = 'green',
}) {
  const bg = variant === 'green' ? 'bg-farm-green text-white' : 'bg-white text-gray-900 border-b border-gray-100';

  return (
    <header className={`safe-top safe-x sticky top-0 z-30 ${bg}`}>
      <div className="px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="touch-target -ml-2 mb-1 text-sm opacity-90 flex items-center gap-1 min-h-0 h-10"
          >
            <span aria-hidden>←</span> Back
          </button>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">{title}</h1>
            {subtitle && (
              <p className={`text-sm truncate ${variant === 'green' ? 'opacity-90' : 'text-gray-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
        </div>
      </div>
    </header>
  );
}
