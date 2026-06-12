'use client';

import AdminNav from '@/components/admin/AdminNav';

export default function AdminShell({ children, title, actions }) {
  return (
    <div className="min-h-dvh bg-surface">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-6 safe-bottom">
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            {title && <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>}
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
