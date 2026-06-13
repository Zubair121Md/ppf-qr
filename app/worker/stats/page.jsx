'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorkerHeader from '@/components/layouts/WorkerHeader';
import WorkerShell from '@/components/layouts/WorkerShell';
import Spinner from '@/components/ui/Spinner';
import { fetchWithRetry } from '@/lib/fetch-retry';
import { reasonLabel, RUPEES_PER_POINT } from '@/lib/gamification';
import { STAFF_ROLES } from '@/lib/constants';

function StatTile({ label, value, sub, accent }) {
  const accents = {
    green: 'border-l-green-500',
    purple: 'border-l-ppf-purple',
    red: 'border-l-red-500',
    amber: 'border-l-amber-400',
  };
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm border-l-4 ${accents[accent] || 'border-l-farm-green'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function WorkerStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetchWithRetry('/api/auth/me');
        if (!meRes.ok) {
          router.push('/worker/login');
          return;
        }
        const me = await meRes.json();
        if (STAFF_ROLES.includes(me.role)) {
          router.replace('/admin');
          return;
        }

        const statsRes = await fetchWithRetry('/api/workers/me/stats?days=30');
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <WorkerShell noPadding>
        <div className="flex-1 flex items-center justify-center min-h-[50dvh]">
          <Spinner size="lg" />
        </div>
      </WorkerShell>
    );
  }

  if (!stats) {
    return (
      <WorkerShell>
        <p className="text-center text-gray-500 py-12">Could not load stats.</p>
      </WorkerShell>
    );
  }

  const { level, today, total_points, estimated_earnings, period_earned, period_lost, recent_activity, qc_errors } = stats;

  return (
    <WorkerShell noPadding>
      <WorkerHeader
        title="My Stats & Rewards"
        subtitle={stats.worker ? `${stats.worker.full_name}` : ''}
      />

      <div className="worker-content space-y-6 pb-4">
        <div
          className="rounded-2xl p-5 text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${level.color}, #4B286D)` }}
        >
          <p className="text-sm text-white/80">Your level</p>
          <p className="text-2xl font-bold mt-1">{level.name}</p>
          <p className="text-sm mt-2">{total_points} total points</p>
          {level.nextLevel && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Progress to {level.nextLevel}</span>
                <span>{Math.round(level.progressToNext)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${level.progressToNext}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Est. earnings"
            value={`₹${estimated_earnings}`}
            sub={`₹${RUPEES_PER_POINT} per point`}
            accent="green"
          />
          <StatTile
            label="Today packed"
            value={today.orders_packed}
            sub={`${today.kg_packed} kg`}
            accent="purple"
          />
          <StatTile
            label="Points earned (30d)"
            value={`+${period_earned}`}
            accent="amber"
          />
          <StatTile
            label="QC penalties (30d)"
            value={period_lost}
            sub={`${qc_errors.length} errors`}
            accent="red"
          />
        </div>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
            How you earn points
          </h2>
          <div className="bg-white rounded-2xl border p-4 text-sm space-y-2 text-gray-600">
            <p>+10 points per completed order</p>
            <p>+1 point per kg packed</p>
            <p className="text-red-600">−15 points per QC error on your packed order</p>
          </div>
        </section>

        {recent_activity.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Recent activity
            </h2>
            <div className="space-y-2">
              {recent_activity.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border p-3 flex justify-between items-start gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{reasonLabel(item.reason)}</p>
                    {item.order_id && (
                      <p className="text-xs text-gray-400 font-mono truncate">{item.order_id}</p>
                    )}
                    {item.note && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.note}</p>}
                  </div>
                  <span
                    className={`text-sm font-bold flex-shrink-0 ${
                      item.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {qc_errors.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              QC feedback
            </h2>
            <div className="space-y-2">
              {qc_errors.map((err) => (
                <div key={err.error_id} className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-sm font-medium text-red-800">{err.error_code}</p>
                  <p className="text-xs text-red-600 mt-1">{err.error_note}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{err.order_id}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </WorkerShell>
  );
}
