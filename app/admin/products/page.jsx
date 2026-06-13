'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import AdminShell from '@/components/layouts/AdminShell';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import QRDisplay from '@/components/shared/QRDisplay';

const EMPTY_FORM = {
  product_id: '',
  name_english: '',
  name_tamil: '',
  name_malayalam: '',
  name_hindi: '',
  category: 'BERRY',
  unit: 'kg',
  image_url: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

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

  function openAdd() {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setForm({
      product_id: product.product_id,
      name_english: product.name_english || '',
      name_tamil: product.name_tamil || '',
      name_malayalam: product.name_malayalam || '',
      name_hindi: product.name_hindi || '',
      category: product.category || 'BERRY',
      unit: product.unit || 'kg',
      image_url: product.image_url || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingProduct) {
      const res = await fetch(`/api/products/${editingProduct.product_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_english: form.name_english,
          name_tamil: form.name_tamil,
          name_malayalam: form.name_malayalam,
          name_hindi: form.name_hindi,
          category: form.category,
          unit: form.unit,
          image_url: form.image_url,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        loadProducts();
      }
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        loadProducts();
        setForm({ ...EMPTY_FORM });
      }
    }
  }

  async function toggleActive(product) {
    const activating = product.is_active === false;
    const res = await fetch(`/api/products/${product.product_id}`, {
      method: activating ? 'PATCH' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: activating ? JSON.stringify({ is_active: true }) : undefined,
    });
    if (res.ok) loadProducts();
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
        ${products.filter((p) => p.is_active !== false).map((p) => `
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
          <Button size="sm" onClick={openAdd}>Add Product</Button>
        </>
      }
    >
      <div className="max-w-6xl space-y-4">
        {incompleteCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterIncomplete(!filterIncomplete)}
            className="text-sm text-amber-800 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl"
          >
            {incompleteCount} products missing translations — {filterIncomplete ? 'Show all' : 'Filter'}
          </button>
        )}

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {displayed.map((p) => (
            <div key={p.product_id} className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-sm font-bold">{p.product_id}</p>
                  <p className="text-gray-900">{p.name_english}</p>
                  <p className="text-xs text-gray-500">{p.category}</p>
                </div>
                <Badge status={p.is_active !== false ? 'PACKED' : 'PENDING'}>
                  {p.is_active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setQrPreview(p)}>
                  View QR
                </Button>
                <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEdit(p)}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-surface-card rounded-2xl border border-gray-100 overflow-hidden shadow-card admin-table-wrap">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-surface-muted sticky top-0">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700">Product ID</th>
                <th className="p-3 text-left font-semibold text-gray-700">Name</th>
                <th className="p-3 text-left font-semibold text-gray-700">Category</th>
                <th className="p-3 text-left font-semibold text-gray-700">QR</th>
                <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((p) => (
                <tr key={p.product_id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="p-3 font-mono text-xs">{p.product_id}</td>
                  <td className="p-3 font-medium">{p.name_english}</td>
                  <td className="p-3 text-gray-600">{p.category}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setQrPreview(p)}
                      className="text-ppf-purple text-sm font-medium hover:underline"
                    >
                      View QR
                    </button>
                  </td>
                  <td className="p-3">
                    <Badge status={p.is_active !== false ? 'PACKED' : 'PENDING'}>
                      {p.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <button
                        type="button"
                        onClick={() => downloadQR(p.product_id)}
                        className="text-gray-600 text-sm font-medium hover:underline"
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="text-ppf-purple text-sm font-medium hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(p)}
                        className={`text-sm font-medium hover:underline ${
                          p.is_active !== false ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {p.is_active !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {qrPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 safe-top safe-bottom safe-x p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-sheet">
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
          <form onSubmit={handleSubmit} className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-3 max-h-[90dvh] overflow-y-auto shadow-sheet">
            <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            {!editingProduct && (
              <Input
                label="Product ID"
                placeholder="STR-001"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value.toUpperCase() })}
                required
              />
            )}
            <Input
              label="English name"
              value={form.name_english}
              onChange={(e) => setForm({ ...form, name_english: e.target.value })}
              required
            />
            <Input
              label="Tamil name"
              value={form.name_tamil}
              onChange={(e) => setForm({ ...form, name_tamil: e.target.value })}
            />
            <Input
              label="Malayalam name"
              value={form.name_malayalam}
              onChange={(e) => setForm({ ...form, name_malayalam: e.target.value })}
            />
            <Input
              label="Hindi name"
              value={form.name_hindi}
              onChange={(e) => setForm({ ...form, name_hindi: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-touch px-4 rounded-2xl border border-gray-200 bg-white"
              >
                {['BERRY', 'VEG', 'FRT', 'GRN', 'HRB'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" fullWidth>
                {editingProduct ? 'Save changes' : 'Create product'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
