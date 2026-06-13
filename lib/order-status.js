/** Internal DB statuses */
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  PACKING: 'PACKING',
  PACKED: 'PACKED',
  ERROR: 'ERROR',
};

/** Human-readable labels shown in UI */
export const ORDER_STATUS_LABELS = {
  PENDING: 'Unassigned',
  ASSIGNED: 'Ready to pack',
  PACKING: 'In progress',
  PACKED: 'Complete',
  ERROR: 'QC issue',
};

/** Short labels for compact badges */
export const ORDER_STATUS_SHORT = {
  PENDING: 'Unassigned',
  ASSIGNED: 'Ready',
  PACKING: 'In progress',
  PACKED: 'Complete',
  ERROR: 'QC issue',
};

export const ACTIVE_WORKER_STATUSES = ['ASSIGNED', 'PACKING', 'ERROR'];
export const COMPLETED_WORKER_STATUSES = ['PACKED'];

export function getOrderStatusLabel(status, short = false) {
  const map = short ? ORDER_STATUS_SHORT : ORDER_STATUS_LABELS;
  return map[status] || status;
}

/** Orders this worker should work on today */
export function splitWorkerOrders(orders, workerId) {
  const mine = orders.filter((o) => o.assigned_worker_id === workerId);

  const active = mine.filter((o) => ACTIVE_WORKER_STATUSES.includes(o.status));
  const completed = mine.filter((o) => COMPLETED_WORKER_STATUSES.includes(o.status));

  const available = orders.filter(
    (o) => o.assignment_type === 'overflow' && !o.assigned_worker_id && o.status === 'PENDING'
  );

  return { active, completed, available };
}

export function canWorkerOpenOrder(order, workerId) {
  if (order.assigned_worker_id === workerId) {
    return ACTIVE_WORKER_STATUSES.includes(order.status);
  }
  return false;
}

export function canUnpackOrder(order) {
  return order.status === 'PACKED';
}
