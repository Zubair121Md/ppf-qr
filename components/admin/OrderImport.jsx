'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { fetchWithRetry } from '@/lib/fetch-retry';

const MAX_IMPORT_ROWS = 500;
const MAX_FILE_MB = 5;

export default function OrderImport({ onSuccess }) {
  const [tab, setTab] = useState('excel');
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [importing, setImporting] = useState(false);
  const [manualForm, setManualForm] = useState({
    customer_name: '',
    customer_phone: '',
    notes: '',
    items: [{ product_id: '', quantity: '', unit: 'kg' }],
  });
  const [products, setProducts] = useState([]);
  const [manualResult, setManualResult] = useState(null);

  async function loadProducts() {
    const res = await fetch('/api/products');
    if (res.ok) setProducts(await res.json());
  }

  async function parseExcel(file) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`File too large. Maximum ${MAX_FILE_MB}MB. Split into smaller files.`);
      return;
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length > MAX_IMPORT_ROWS) {
      alert(`Too many rows (${rows.length}). Maximum ${MAX_IMPORT_ROWS} per import. Split the file.`);
      return;
    }

    const idsRes = await fetch('/api/products?ids=true');
    const validIds = new Set(await idsRes.json());

    const orderMap = {};
    const rowErrors = [];

    for (const row of rows) {
      const orderId = row.order_id;
      if (!orderId) {
        rowErrors.push({ ...row, reason: 'Missing order_id' });
        continue;
      }

      if (!validIds.has(row.product_id)) {
        rowErrors.push({ ...row, reason: `Invalid product_id: ${row.product_id}` });
        continue;
      }

      if (!orderMap[orderId]) {
        orderMap[orderId] = {
          order_id: orderId,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          notes: row.notes,
          items: [],
          status: 'ready',
        };
      }

      orderMap[orderId].items.push({
        product_id: row.product_id,
        quantity: Number(row.quantity),
        unit: row.unit || 'kg',
      });
    }

    const ready = Object.values(orderMap);
    setPreview(ready);
    setErrors(rowErrors);
  }

  async function confirmImport() {
    setImporting(true);
    try {
      const res = await fetchWithRetry('/api/orders/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: `BATCH-${Date.now()}`,
          orders: preview,
        }),
      });
      const data = await res.json();
      setDistribution(data.distribution);
      onSuccess?.(data);
    } finally {
      setImporting(false);
    }
  }

  function downloadErrors() {
    const ws = XLSX.utils.json_to_sheet(errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, 'import-errors.xlsx');
  }

  async function submitManual(e) {
    e.preventDefault();
    await loadProducts();
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: manualForm.customer_name,
        customer_phone: manualForm.customer_phone,
        notes: manualForm.notes,
        items: manualForm.items.filter((i) => i.product_id && i.quantity),
      }),
    });
    if (res.ok) {
      setManualResult(await res.json());
      onSuccess?.();
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {['excel', 'manual'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); if (t === 'manual') loadProducts(); }}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === t ? 'bg-farm-green text-white' : 'bg-gray-200'
            }`}
          >
            {t === 'excel' ? 'Upload Excel' : 'Manual Entry'}
          </button>
        ))}
      </div>

      {tab === 'excel' && (
        <div>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-farm-green"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) parseExcel(file);
            }}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              id="excel-upload"
              onChange={(e) => e.target.files[0] && parseExcel(e.target.files[0])}
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <p className="text-gray-600">Drag & drop Excel file or click to browse</p>
              <p className="text-sm text-gray-400 mt-2">
                Columns: order_id, customer_name, customer_phone, product_id, quantity, unit, notes
              </p>
            </label>
          </div>

          {preview.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 font-medium">
                {preview.length} orders ready to import, {errors.length} errors
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Order ID</th>
                      <th className="p-2 text-left">Customer</th>
                      <th className="p-2 text-left">Items</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((o) => (
                      <tr key={o.order_id} className="border-t">
                        <td className="p-2">{o.order_id}</td>
                        <td className="p-2">{o.customer_name}</td>
                        <td className="p-2">{o.items.length}</td>
                        <td className="p-2 text-green-600">Ready</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-4">
                {errors.length > 0 && (
                  <button type="button" onClick={downloadErrors} className="px-4 py-2 border rounded-lg">
                    Download error rows
                  </button>
                )}
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={importing}
                  className="px-6 py-2 bg-farm-green text-white rounded-lg disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          )}

          {distribution && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Distribution Result</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Worker</th>
                    <th className="p-2 text-left">Orders</th>
                    <th className="p-2 text-left">kg</th>
                  </tr>
                </thead>
                <tbody>
                  {distribution.map((d) => (
                    <tr key={d.worker_id} className="border-t">
                      <td className="p-2">{d.full_name}</td>
                      <td className="p-2">{d.order_count}</td>
                      <td className="p-2">{d.total_kg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'manual' && (
        <form onSubmit={submitManual} className="space-y-4 max-w-lg">
          <input
            type="text"
            placeholder="Customer name *"
            required
            value={manualForm.customer_name}
            onChange={(e) => setManualForm({ ...manualForm, customer_name: e.target.value })}
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={manualForm.customer_phone}
            onChange={(e) => setManualForm({ ...manualForm, customer_phone: e.target.value })}
            className="w-full p-3 border rounded-lg"
          />
          <textarea
            placeholder="Notes (optional)"
            value={manualForm.notes}
            onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
            className="w-full p-3 border rounded-lg"
          />
          {manualForm.items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <select
                value={item.product_id}
                onChange={(e) => {
                  const items = [...manualForm.items];
                  items[idx].product_id = e.target.value;
                  setManualForm({ ...manualForm, items });
                }}
                className="flex-1 p-3 border rounded-lg"
                required
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_id} — {p.name_english}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => {
                  const items = [...manualForm.items];
                  items[idx].quantity = e.target.value;
                  setManualForm({ ...manualForm, items });
                }}
                className="w-24 p-3 border rounded-lg"
                required
              />
              <select
                value={item.unit}
                onChange={(e) => {
                  const items = [...manualForm.items];
                  items[idx].unit = e.target.value;
                  setManualForm({ ...manualForm, items });
                }}
                className="w-24 p-3 border rounded-lg"
              >
                <option value="kg">kg</option>
                <option value="piece">piece</option>
              </select>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setManualForm({
                ...manualForm,
                items: [...manualForm.items, { product_id: '', quantity: '', unit: 'kg' }],
              })
            }
            className="text-farm-green text-sm"
          >
            + Add product line
          </button>
          <button type="submit" className="w-full py-3 bg-farm-green text-white rounded-lg font-medium">
            Create Order
          </button>
          {manualResult && (
            <p className="text-green-600">
              Order {manualResult.order_id} assigned to {manualResult.assigned_worker_name || 'overflow pool'}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
