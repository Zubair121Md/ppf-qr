'use client';

import { useState, useEffect, useCallback } from 'react';
import Spinner from '@/components/ui/Spinner';
import RecordPaymentForm from '@/components/admin/RecordPaymentForm';
import { reasonLabel, RUPEES_PER_POINT } from '@/lib/gamification';
import { PAYMENT_TYPES } from '@/lib/worker-payments';
import { ERROR_CODES } from '@/lib/constants';
import { LANG_LABELS } from '@/lib/speech';

export default function WorkerDetailModal({ workerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const loadData = useCallback(() => {
    if (!workerId) return;
    setLoading(true);
    fetch(`/api/workers/${workerId}/stats?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [workerId, days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!workerId) return null;

  const payments = data?.payments || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60]">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92dvh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {data?.worker?.full_name || 'Worker profile'}
            </h2>
            {data?.worker && (
              <p className="text-sm text-gray-500">
                @{data.worker.username} · {LANG_LABELS[data.worker.preferred_lang]?.native || data.worker.preferred_lang}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 text-sm">
            ✕
          </button>
        </div>

        <div className="px-5 py-2.5 border-b bg-gray-50 flex gap-2">
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

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data ? (
            <p className="text-center text-gray-500">Could not load worker data.</p>
          ) : (
            <>
              <div
                className="rounded-2xl p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${data.level?.color || '#4B286D'}, #4B286D)` }}
              >
                <p className="text-xs text-white/80">Gamification level</p>
                <p className="text-xl font-bold">{data.level?.name}</p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold">{data.total_points}</p>
                    <p className="text-[9px] text-white/70 uppercase">Points</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">₹{data.estimated_earnings}</p>
                    <p className="text-[9px] text-white/70 uppercase">Owed</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">₹{payments.total_paid ?? 0}</p>
                    <p className="text-[9px] text-white/70 uppercase">Paid</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">₹{payments.balance_due ?? 0}</p>
                    <p className="text-[9px] text-white/70 uppercase">Balance</p>
                  </div>
                </div>
              </div>

              <RecordPaymentForm
                workerId={workerId}
                workerName={data.worker?.full_name}
                onSuccess={() => loadData()}
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Period earned</p>
                  <p className="text-lg font-bold text-green-600">+{data.period_earned}</p>
                  <p className="text-xs text-gray-400">₹{data.period_earnings}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] text-gray-500 uppercase">QC penalties</p>
                  <p className="text-lg font-bold text-red-600">{data.period_lost}</p>
                  <p className="text-xs text-gray-400">{data.qc_errors?.length || 0} errors</p>
                </div>
              </div>

              {payments.recent?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment history</h3>
                  <div className="space-y-2">
                    {payments.recent.map((pay) => (
                      <div key={pay.id} className="rounded-xl border p-3 text-sm flex justify-between gap-3">
                        <div>
                          <p className="font-semibold text-green-700">₹{Number(pay.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            {PAYMENT_TYPES[pay.payment_type]?.label || pay.payment_type}
                            {pay.bonus_points > 0 && ` · +${pay.bonus_points} pts`}
                          </p>
                          {pay.note && <p className="text-xs text-gray-400 mt-0.5">{pay.note}</p>}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(pay.paid_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.recent_activity?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Points ledger</h3>
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500">
                        <tr>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Event</th>
                          <th className="p-2 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_activity.map((row) => (
                          <tr key={row.id} className="border-t">
                            <td className="p-2 text-xs text-gray-500">
                              {new Date(row.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-2">
                              <p className="font-medium text-xs">{reasonLabel(row.reason)}</p>
                              {row.order_id && (
                                <p className="text-[10px] text-gray-400 font-mono">{row.order_id}</p>
                              )}
                            </td>
                            <td className={`p-2 text-right font-semibold text-xs ${row.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">QC errors</h3>
                  <div className="space-y-2">
                    {data.qc_errors.map((err) => (
                      <div key={err.error_id} className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-red-800 text-xs">
                            {ERROR_CODES[err.error_code]?.label || err.error_code}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(err.logged_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-red-700 mt-1 text-xs">{err.error_note}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <p className="text-[10px] text-gray-400 text-center pb-2">
                Rate: ₹{RUPEES_PER_POINT} per point · {payments.payment_count || 0} payments recorded
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
