import { supabaseAdmin } from './db';

export function isOrderFullyPacked(items = []) {
  return items.length > 0 && items.every((i) => i.is_packed);
}

/**
 * Keeps order.status in sync with order_items.is_packed.
 * Fixes stale PACKED status after manager unpack.
 */
export async function syncOrderStatusFromItems(orderId) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('order_id, status, assigned_worker_id, packed_at, packed_by')
    .eq('order_id', orderId)
    .single();

  if (!order) return null;

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('is_packed')
    .eq('order_id', orderId);

  const allPacked = isOrderFullyPacked(items || []);
  const anyPacked = (items || []).some((i) => i.is_packed);
  let newStatus = order.status;
  const updates = { updated_at: new Date().toISOString() };

  if (allPacked) {
    if (order.status !== 'PACKED') {
      newStatus = 'PACKED';
      updates.status = 'PACKED';
      updates.packed_at = new Date().toISOString();
    }
  } else if (order.status === 'PACKED' || order.status === 'PACKING') {
    newStatus = anyPacked ? 'PACKING' : (order.assigned_worker_id ? 'ASSIGNED' : 'PENDING');
    updates.status = newStatus;
    updates.packed_at = null;
    updates.packed_by = null;
    if (newStatus === 'ASSIGNED' || newStatus === 'PENDING') {
      updates.lock_token = null;
      updates.locked_by = null;
      updates.locked_at = null;
    }
  } else if (order.status === 'ASSIGNED' && anyPacked) {
    newStatus = 'PACKING';
    updates.status = 'PACKING';
  }

  if (updates.status && updates.status !== order.status) {
    await supabaseAdmin.from('orders').update(updates).eq('order_id', orderId);
  }

  return updates.status || order.status;
}

export async function resetOrderItemsForUnpack(orderId) {
  return supabaseAdmin
    .from('order_items')
    .update({
      is_packed: false,
      packed_at: null,
      packed_by: null,
      scan_count: 0,
    })
    .eq('order_id', orderId);
}
