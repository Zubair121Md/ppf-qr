'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LANGUAGES, ROLE_LABELS } from '@/lib/constants';
import { LANG_LABELS } from '@/lib/speech';

const EMPTY_FORM = {
  worker_id: '',
  username: '',
  password: '',
  full_name: '',
  preferred_lang: 'english',
  role: 'worker',
};

export default function WorkerFormModal({ worker, currentUserRole, onClose, onSaved }) {
  const isEdit = Boolean(worker);
  const canAssignStaffRoles = currentUserRole === 'admin';
  const [form, setForm] = useState(
    worker
      ? {
          worker_id: worker.worker_id,
          username: worker.username,
          password: '',
          full_name: worker.full_name,
          preferred_lang: worker.preferred_lang || 'english',
          role: worker.role || 'worker',
        }
      : { ...EMPTY_FORM }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit) {
        const body = {
          full_name: form.full_name,
          preferred_lang: form.preferred_lang,
          role: form.role,
        };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/workers/${worker.worker_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Update failed');
          return;
        }
      } else {
        if (!form.worker_id || !form.username || !form.password || !form.full_name) {
          setError('All fields are required for new workers');
          return;
        }
        const res = await fetch('/api/workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Create failed');
          return;
        }
      }
      onSaved();
      onClose();
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 safe-top safe-bottom safe-x">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-4 max-h-[90dvh] overflow-y-auto shadow-sheet"
      >
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? 'Edit Worker' : 'Add Worker'}
        </h2>

        {!isEdit && (
          <Input
            label="Worker ID"
            placeholder="WRK-011"
            value={form.worker_id}
            onChange={(e) => update('worker_id', e.target.value.toUpperCase())}
            required
          />
        )}

        <Input
          label="Username"
          placeholder="l11"
          value={form.username}
          onChange={(e) => update('username', e.target.value.toLowerCase())}
          disabled={isEdit}
          required={!isEdit}
        />

        <Input
          label={isEdit ? 'New password (leave blank to keep)' : 'Password'}
          type="password"
          placeholder={isEdit ? '••••••••' : 'farmscan123'}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          required={!isEdit}
        />

        <Input
          label="Full name"
          placeholder="Ravi Kumar"
          value={form.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Preferred language</label>
          <select
            value={form.preferred_lang}
            onChange={(e) => update('preferred_lang', e.target.value)}
            className="w-full h-touch px-4 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-farm-green"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {LANG_LABELS[lang]?.native || lang}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            className="w-full h-touch px-4 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-farm-green"
          >
            <option value="worker">{ROLE_LABELS.worker}</option>
            {canAssignStaffRoles && (
              <>
                <option value="manager">{ROLE_LABELS.manager}</option>
                <option value="admin">{ROLE_LABELS.admin}</option>
              </>
            )}
          </select>
          {!canAssignStaffRoles && (
            <p className="text-xs text-gray-500">Only admins can create manager or admin accounts.</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create worker'}
          </Button>
        </div>
      </form>
    </div>
  );
}
