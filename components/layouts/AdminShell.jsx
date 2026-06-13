'use client';

import AdminNav from '@/components/admin/AdminNav';

export default function AdminShell({ children, title, actions }) {
  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <AdminNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-3 pb-20 md:pb-8 md:pt-5">
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 md:mb-5">
            {title && (
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
            )}
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
