'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/layouts/AdminShell';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import WorkerFormModal from '@/components/admin/WorkerFormModal';
import { ROLE_LABELS } from '@/lib/constants';
import { LANG_LABELS } from '@/lib/speech';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const loadWorkers = useCallback(async () => {
    try {
      const res = await fetch('/api/workers');
      if (res.ok) setWorkers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkers();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setCurrentUser)
      .catch(() => {});
  }, [loadWorkers]);

  function openAdd() {
    setEditingWorker(null);
    setShowForm(true);
  }

  function openEdit(worker) {
    setEditingWorker(worker);
    setShowForm(true);
  }

  async function toggleActive(worker) {
    const activating = !worker.is_active;
    const res = await fetch(`/api/workers/${worker.worker_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: activating }),
    });
    if (res.ok) {
      setConfirmAction(null);
      loadWorkers();
    }
  }

  function langLabel(lang) {
    return LANG_LABELS[lang]?.native || lang;
  }

  return (
    <AdminShell
      title="Workers"
      actions={<Button size="sm" onClick={openAdd}>Add Worker</Button>}
    >
      {loading ? (
        <p className="text-gray-500 text-sm">Loading workers...</p>
      ) : workers.length === 0 ? (
        <div className="bg-surface-card rounded-2xl border border-gray-100 p-8 text-center shadow-card">
          <p className="text-gray-600 mb-4">No workers yet. Add your first packer.</p>
          <Button size="sm" onClick={openAdd}>Add Worker</Button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {workers.map((w) => (
              <div key={w.worker_id} className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{w.full_name}</p>
                    <p className="text-sm text-gray-500">@{w.username}</p>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{w.worker_id}</p>
                  </div>
                  <Badge status={w.is_active ? 'PACKED' : 'ERROR'}>
                    {w.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                  <span>Language: {langLabel(w.preferred_lang)}</span>
                  <span>Role: {ROLE_LABELS[w.role] || w.role}</span>
                  <span className="col-span-2 text-xs text-gray-400">
                    Last login: {w.last_login_at ? new Date(w.last_login_at).toLocaleString() : 'Never'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(w)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={w.is_active ? 'danger' : 'primary'}
                    className="flex-1"
                    onClick={() => setConfirmAction(w)}
                  >
                    {w.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-surface-card rounded-2xl border border-gray-100 overflow-hidden shadow-card admin-table-wrap">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700">ID</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Username</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Language</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Role</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Last Login</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.worker_id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="p-3 font-mono text-xs text-gray-600">{w.worker_id}</td>
                    <td className="p-3">{w.username}</td>
                    <td className="p-3 font-medium">{w.full_name}</td>
                    <td className="p-3">{langLabel(w.preferred_lang)}</td>
                    <td className="p-3">{ROLE_LABELS[w.role] || w.role}</td>
                    <td className="p-3">
                      <Badge status={w.is_active ? 'PACKED' : 'ERROR'}>
                        {w.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {w.last_login_at ? new Date(w.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(w)}
                          className="text-ppf-purple text-sm font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmAction(w)}
                          className={`text-sm font-medium hover:underline ${
                            w.is_active ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {w.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <WorkerFormModal
          worker={editingWorker}
          currentUserRole={currentUser?.role}
          onClose={() => { setShowForm(false); setEditingWorker(null); }}
          onSaved={loadWorkers}
        />
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 safe-top safe-bottom safe-x p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-sheet">
            <h3 className="font-bold text-lg mb-2">
              {confirmAction.is_active ? 'Deactivate worker?' : 'Activate worker?'}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {confirmAction.is_active
                ? `${confirmAction.full_name} will no longer receive orders or be able to log in.`
                : `${confirmAction.full_name} will be able to log in and receive orders again.`}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmAction.is_active ? 'danger' : 'primary'}
                fullWidth
                onClick={() => toggleActive(confirmAction)}
              >
                {confirmAction.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
