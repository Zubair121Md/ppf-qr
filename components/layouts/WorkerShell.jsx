'use client';

export default function WorkerShell({ children, className = '', noPadding = false }) {
  return (
    <div className={`worker-page safe-x ${className}`}>
      <div className={noPadding ? 'flex-1 flex flex-col min-h-0' : 'worker-content safe-bottom'}>
        {children}
      </div>
    </div>
  );
}
