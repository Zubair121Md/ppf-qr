import { OVERFLOW_THRESHOLD_KG, WEIGHT_SPLIT_THRESHOLD_KG } from './constants';

export function calculateTotalWeightFromItems(items, products) {
  return items.reduce((total, item) => {
    const product = products[item.product_id];
    if (!product) return total;

    if (item.unit === 'kg') {
      return total + Number(item.quantity);
    }

    const weightPerUnit = Number(product.weight_per_unit) || 1;
    return total + Number(item.quantity) * weightPerUnit;
  }, 0);
}

export function distributeOrders(orders, workers) {
  if (!workers.length) {
    return orders.map((order) => ({
      order_id: order.order_id,
      assigned_worker_id: null,
      assignment_type: 'overflow',
      parent_order_id: order.parent_order_id || null,
      total_weight_kg: order.total_weight_kg,
    }));
  }

  const workerLoads = Object.fromEntries(workers.map((w) => [w.worker_id, 0]));
  const results = [];

  const normalOrders = [];
  const splitOrders = [];

  for (const order of orders) {
    const weight = Number(order.total_weight_kg) || 0;
    if (weight > WEIGHT_SPLIT_THRESHOLD_KG) {
      splitOrders.push(order);
    } else {
      normalOrders.push(order);
    }
  }

  normalOrders.sort((a, b) => Number(b.total_weight_kg) - Number(a.total_weight_kg));

  for (const order of normalOrders) {
    const weight = Number(order.total_weight_kg) || 0;

    if (weight < OVERFLOW_THRESHOLD_KG) {
      results.push({
        order_id: order.order_id,
        assigned_worker_id: null,
        assignment_type: 'overflow',
        parent_order_id: order.parent_order_id || null,
        total_weight_kg: weight,
      });
      continue;
    }

    const workerId = Object.entries(workerLoads).sort((a, b) => a[1] - b[1])[0][0];
    workerLoads[workerId] += weight;

    results.push({
      order_id: order.order_id,
      assigned_worker_id: workerId,
      assignment_type: 'batch',
      parent_order_id: order.parent_order_id || null,
      total_weight_kg: weight,
    });
  }

  for (const order of splitOrders) {
    const weight = Number(order.total_weight_kg) || 0;
    const halfWeight = weight / 2;
    const sortedWorkers = Object.entries(workerLoads).sort((a, b) => a[1] - b[1]);
    const workerA = sortedWorkers[0][0];
    const workerB = sortedWorkers[1]?.[0] || sortedWorkers[0][0];

    workerLoads[workerA] += halfWeight;
    if (workerB !== workerA) {
      workerLoads[workerB] += halfWeight;
    }

    results.push({
      order_id: `${order.order_id}-A`,
      assigned_worker_id: workerA,
      assignment_type: 'batch',
      parent_order_id: order.order_id,
      total_weight_kg: halfWeight,
    });

    results.push({
      order_id: `${order.order_id}-B`,
      assigned_worker_id: workerB,
      assignment_type: 'batch',
      parent_order_id: order.order_id,
      total_weight_kg: halfWeight,
    });
  }

  return results;
}
