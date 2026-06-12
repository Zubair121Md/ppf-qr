'use client';

import AdminShell from '@/components/layouts/AdminShell';
import OrderImport from '@/components/admin/OrderImport';

export default function AdminOrdersPage() {
  return (
    <AdminShell title="Orders">
      <div className="bg-surface-card rounded-2xl border border-gray-100 p-4 md:p-6 shadow-card">
        <OrderImport />
      </div>
    </AdminShell>
  );
}
