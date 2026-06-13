'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/layouts/AdminShell';
import LiveDashboard from '@/components/admin/LiveDashboard';
import QCErrorForm from '@/components/admin/QCErrorForm';
import Button from '@/components/ui/Button';

export default function AdminDashboard() {
  const [showQC, setShowQC] = useState(false);

  return (
    <AdminShell
      title="Dashboard"
      actions={
        <>
          <Link href="/admin/orders">
            <Button size="sm" variant="primary">Import Orders</Button>
          </Link>
          <Button size="sm" variant="danger" onClick={() => setShowQC(true)}>Log QC Error</Button>
          <Link href="/admin/performance">
            <Button size="sm" variant="secondary">Performance</Button>
          </Link>
          <Link href="/admin/qc">
            <Button size="sm" variant="secondary">Full Report</Button>
          </Link>
        </>
      }
    >
      <LiveDashboard />

      {showQC && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 safe-top safe-bottom safe-x">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto">
            <QCErrorForm onSuccess={() => setShowQC(false)} onClose={() => setShowQC(false)} />
          </div>
        </div>
      )}
    </AdminShell>
  );
}
