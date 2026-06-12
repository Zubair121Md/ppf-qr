'use client';

import LogoutButton from '@/components/shared/LogoutButton';

export default function WorkerHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  variant = 'green',
}) {
  const bg = variant === 'green' ? 'bg-ppf-purple text-white' : 'bg-white text-gray-900 border-b border-gray-100';

  return (
    <header className={`safe-top safe-x sticky top-0 z-30 ${bg}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="touch-target -ml-2 text-sm opacity-90 flex items-center gap-1 min-h-0 h-10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            {rightAction}
            <LogoutButton variant="worker" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">{title}</h1>
          {subtitle && (
            <p className={`text-sm truncate ${variant === 'green' ? 'opacity-90' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
