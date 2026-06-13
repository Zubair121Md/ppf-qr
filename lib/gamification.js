export const POINTS_ORDER_COMPLETE = 10;
export const POINTS_PER_KG = 1;
export const POINTS_QC_ERROR = -15;
export const RUPEES_PER_POINT = 2;

export const LEVELS = [
  { id: 'bronze', name: 'Bronze Packer', min: 0, color: '#CD7F32' },
  { id: 'silver', name: 'Silver Packer', min: 100, color: '#9CA3AF' },
  { id: 'gold', name: 'Gold Packer', min: 300, color: '#EAB308' },
  { id: 'platinum', name: 'Platinum Packer', min: 600, color: '#7B3F9E' },
];

export function calcOrderPoints(weightKg = 0) {
  return POINTS_ORDER_COMPLETE + Math.floor(Number(weightKg) * POINTS_PER_KG);
}

export function calcEarnings(points) {
  return Math.max(0, points) * RUPEES_PER_POINT;
}

export function getWorkerLevel(totalPoints) {
  const pts = Math.max(0, totalPoints);
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (pts >= l.min) level = l;
  }
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  const progressToNext = next
    ? Math.min(100, ((pts - level.min) / (next.min - level.min)) * 100)
    : 100;
  return { ...level, points: pts, nextLevel: next?.name || null, progressToNext };
}

export function reasonLabel(reason) {
  const map = {
    ORDER_COMPLETE: 'Order completed',
    QC_ERROR: 'QC error penalty',
    ORDER_UNPACKED: 'Order unpacked (reversed)',
    MANUAL_REWARD: 'Reward / bonus points',
  };
  return map[reason] || reason;
}
