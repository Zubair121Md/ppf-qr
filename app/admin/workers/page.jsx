'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/layouts/AdminShell';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetch('/api/workers')
      .then((r) => r.json())
      .then(setWorkers)
      .catch(() => {});
  }, []);

  return (
    <AdminShell title="Workers">
      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {workers.map((w) => (
          <div key={w.worker_id} className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{w.full_name}</p>
                <p className="text-sm text-gray-500">@{w.username}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                w.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {w.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <span>Lang: {w.preferred_lang}</span>
              <span>Role: {w.role}</span>
              <span className="col-span-2 text-xs text-gray-400">
                Last login: {w.last_login_at ? new Date(w.last_login_at).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-surface-card rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Language</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.worker_id} className="border-t border-gray-100">
                <td className="p-3 font-mono text-xs">{w.worker_id}</td>
                <td className="p-3">{w.username}</td>
                <td className="p-3">{w.full_name}</td>
                <td className="p-3 capitalize">{w.preferred_lang}</td>
                <td className="p-3 capitalize">{w.role}</td>
                <td className="p-3">
                  <span className={w.is_active ? 'text-green-600' : 'text-red-600'}>
                    {w.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-gray-500">
                  {w.last_login_at ? new Date(w.last_login_at).toLocaleString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
