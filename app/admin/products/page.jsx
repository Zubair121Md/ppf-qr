'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import AdminShell from '@/components/layouts/AdminShell';
import Button from '@/components/ui/Button';
import QRDisplay from '@/components/shared/QRDisplay';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    name_english: '',
    name_tamil: '',
    name_malayalam: '',
    name_hindi: '',
    category: 'BERRY',
    unit: 'kg',
    image_url: '',
  });

  async function loadProducts() {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const incompleteCount = products.filter(
    (p) => !p.name_tamil || !p.name_malayalam || !p.name_hindi
  ).length;

  const displayed = filterIncomplete
    ? products.filter((p) => !p.name_tamil || !p.name_malayalam || !p.name_hindi)
    : products;

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      loadProducts();
      setForm({
        product_id: '',
        name_english: '',
        name_tamil: '',
        name_malayalam: '',
        name_hindi: '',
        category: 'BERRY',
        unit: 'kg',
        image_url: '',
      });
    }
  }

  async function downloadQR(productId) {
    const url = `${window.location.origin}/p/${productId}`;
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
    const link = document.createElement('a');
    link.download = `${productId}-qr.png`;
    link.href = dataUrl;
    link.click();
  }

  function printAllQR() {
    const win = window.open('', '_blank');
    const appUrl = window.location.origin;
    const html = `
      <html><head><title>Print QR Codes</title>
      <style>
        body { font-family: sans-serif; }
        .grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .label { width: 6cm; height: 6cm; border: 1px solid #ccc; padding: 8px; text-align: center; box-sizing: border-box; }
        .label img { width: 4cm; height: 4cm; }
        .label p { margin: 4px 0; font-size: 12px; }
      </style></head><body>
      <div class="grid">
        ${products.map((p) => `
          <div class="label">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${appUrl}/p/${p.product_id}`)}" />
            <p><strong>${p.product_id}</strong></p>
            <p>${p.name_english}</p>
          </div>
        `).join('')}
      </div>
      <script>window.onload = () => window.print()</script>
      </body></html>
    `;
    win.document.write(html);
    win.document.close();
  }

  return (
    <AdminShell
      title="Products"
      actions={
        <>
          <Button size="sm" variant="secondary" onClick={printAllQR}>Print All QR</Button>
          <Button size="sm" onClick={() => setShowModal(true)}>Add Product</Button>
        </>
      }
    >
      <div className="max-w-6xl">

        {incompleteCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterIncomplete(!filterIncomplete)}
            className="mb-4 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg"
          >
            {incompleteCount} products missing translations — {filterIncomplete ? 'Show all' : 'Filter'}
          </button>
        )}

        <div className="bg-surface-card rounded-2xl border border-gray-100 overflow-hidden shadow-card admin-table-wrap">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Product ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">QR</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((p) => (
                <tr key={p.product_id} className="border-t">
                  <td className="p-3 font-mono">{p.product_id}</td>
                  <td className="p-3">{p.name_english}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setQrPreview(p)}
                      className="text-farm-green text-sm font-medium hover:underline"
                    >
                      View QR
                    </button>
                  </td>
                  <td className="p-3">
                    <span className={p.is_active !== false ? 'text-green-600' : 'text-gray-400'}>
                      {p.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => downloadQR(p.product_id)}
                      className="text-gray-600 text-sm hover:underline"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {qrPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 safe-top safe-bottom safe-x p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
            <h3 className="font-bold text-lg mb-1">{qrPreview.name_english}</h3>
            <p className="font-mono text-sm text-gray-400 mb-4">{qrPreview.product_id}</p>
            <QRDisplay productId={qrPreview.product_id} size={240} />
            <div className="flex gap-2 mt-6">
              <Button variant="secondary" fullWidth onClick={() => setQrPreview(null)}>Close</Button>
              <Button fullWidth onClick={() => downloadQR(qrPreview.product_id)}>Download PNG</Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 safe-top safe-bottom safe-x">
          <form onSubmit={handleSubmit} className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-3 max-h-[90dvh] overflow-y-auto">
            <h2 className="text-xl font-bold">Add Product</h2>
            <input
              placeholder="Product ID (e.g. STR-001)"
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value.toUpperCase() })}
              className="w-full p-3 border rounded-lg"
              required
            />
            <p className="text-xs text-gray-500">Use format like STR-001, BLB-001, TOM-001</p>
            <input
              placeholder="English name"
              value={form.name_english}
              onChange={(e) => setForm({ ...form, name_english: e.target.value })}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              placeholder="Tamil name"
              value={form.name_tamil}
              onChange={(e) => setForm({ ...form, name_tamil: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
            <input
              placeholder="Malayalam name"
              value={form.name_malayalam}
              onChange={(e) => setForm({ ...form, name_malayalam: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
            <input
              placeholder="Hindi name"
              value={form.name_hindi}
              onChange={(e) => setForm({ ...form, name_hindi: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full p-3 border rounded-lg"
            >
              {['BERRY', 'VEG', 'FRT', 'GRN', 'HRB'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-lg">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-3 bg-farm-green text-white rounded-lg">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
