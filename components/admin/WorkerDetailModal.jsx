'use client';

import { useState, useEffect } from 'react';
import Spinner from '@/components/ui/Spinner';
import { reasonLabel, RUPEES_PER_POINT } from '@/lib/gamification';
import { ERROR_CODES } from '@/lib/constants';
import { LANG_LABELS } from '@/lib/speech';

export default function WorkerDetailModal({ workerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!workerId) return;
    setLoading(true);
    fetch(`/api/workers/${workerId}/stats?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [workerId, days]);

  if (!workerId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 safe-top safe-bottom safe-x">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92dvh] overflow-hidden flex flex-col shadow-sheet">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {data?.worker?.full_name || 'Worker profile'}
            </h2>
            {data?.worker && (
              <p className="text-sm text-gray-500">
                @{data.worker.username} · {LANG_LABELS[data.worker.preferred_lang]?.native || data.worker.preferred_lang}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600">
            ✕
          </button>
        </div>

        <div className="px-5 py-3 border-b bg-gray-50 flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                days === d ? 'bg-ppf-purple text-white' : 'bg-white border text-gray-600'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data ? (
            <p className="text-center text-gray-500">Could not load worker data.</p>
          ) : (
            <>
              <div
                className="rounded-2xl p-5 text-white"
                style={{ background: `linear-gradient(135deg, ${data.level?.color || '#4B286D'}, #4B286D)` }}
              >
                <p className="text-sm text-white/80">Gamification level</p>
                <p className="text-2xl font-bold">{data.level?.name}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold">{data.total_points}</p>
                    <p className="text-[10px] text-white/70 uppercase">Total pts</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">₹{data.estimated_earnings}</p>
                    <p className="text-[10px] text-white/70 uppercase">Est. payout</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{data.today?.orders_packed ?? 0}</p>
                    <p className="text-[10px] text-white/70 uppercase">Today orders</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 uppercase">Period earned</p>
                  <p className="text-xl font-bold text-green-600">+{data.period_earned}</p>
                  <p className="text-xs text-gray-400">₹{data.period_earnings} ({days}d)</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 uppercase">Period penalties</p>
                  <p className="text-xl font-bold text-red-600">{data.period_lost}</p>
                  <p className="text-xs text-gray-400">{data.qc_errors?.length || 0} QC errors</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 uppercase">Kg packed today</p>
                  <p className="text-xl font-bold">{data.today?.kg_packed ?? 0}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 uppercase">Rate</p>
                  <p className="text-xl font-bold">₹{RUPEES_PER_POINT}/pt</p>
                </div>
              </div>

              {data.recent_activity?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Points ledger</h3>
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500">
                        <tr>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Event</th>
                          <th className="p-2 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_activity.map((row) => (
                          <tr key={row.id} className="border-t">
                            <td className="p-2 text-xs text-gray-500 whitespace-nowrap">
                              {new Date(row.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-2">
                              <p className="font-medium">{reasonLabel(row.reason)}</p>
                              {row.order_id && (
                                <p className="text-xs text-gray-400 font-mono">{row.order_id}</p>
                              )}
                            </td>
                            <td className={`p-2 text-right font-semibold ${row.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {row.points > 0 ? `+${row.points}` : row.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {data.qc_errors?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">QC errors ({days}d)</h3>
                  <div className="space-y-2">
                    {data.qc_errors.map((err) => (
                      <div key={err.error_id} className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-red-800">
                            {ERROR_CODES[err.error_code]?.label || err.error_code}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(err.logged_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-red-700 mt-1">{err.error_note}</p>
                        <p className="text-xs font-mono text-gray-500 mt-1">{err.order_id}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
