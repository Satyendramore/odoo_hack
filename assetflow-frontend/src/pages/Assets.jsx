import React, { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_OPTIONS = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'];
const STATUS_BADGE = {
  AVAILABLE: 'bg-success',
  ALLOCATED: 'bg-primary',
  RESERVED: 'bg-warning text-dark',
  UNDER_MAINTENANCE: 'bg-info text-dark',
  LOST: 'bg-danger',
  RETIRED: 'bg-secondary',
  DISPOSED: 'bg-dark',
};

// ─── Registration Form ────────────────────────────────────────────────────────

function RegistrationForm({ categories, onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: '', categoryId: '', serialNumber: '', location: '',
    condition: 'Good', acquisitionCost: '', bookable: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.categoryId) errors.categoryId = 'Category is required.';
    if (!form.serialNumber.trim()) errors.serialNumber = 'Serial number is required.';
    if (!form.location.trim()) errors.location = 'Location is required.';
    if (form.acquisitionCost === '' || Number(form.acquisitionCost) < 0) errors.acquisitionCost = 'Valid cost required.';
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({}); setLoading(true);
    try {
      await api.post('/assets', { ...form, acquisitionCost: Number(form.acquisitionCost) });
      onCreated('Asset registered successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="af-surface border rounded-2 p-3 mb-4" style={{ borderColor: 'var(--border-color)' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-semibold">Register New Asset</h6>
        <button className="btn-close" onClick={onCancel} />
      </div>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-2">
          <div className="col-md-4">
            <label className="form-label form-label-sm">Name *</label>
            <input className={`form-control form-control-sm ${fieldErrors.name ? 'is-invalid' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm">Category *</label>
            <select className={`form-select form-select-sm ${fieldErrors.categoryId ? 'is-invalid' : ''}`} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— Select —</option>
              {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {fieldErrors.categoryId && <div className="invalid-feedback">{fieldErrors.categoryId}</div>}
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm">Serial Number *</label>
            <input className={`form-control form-control-sm ${fieldErrors.serialNumber ? 'is-invalid' : ''}`} value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
            {fieldErrors.serialNumber && <div className="invalid-feedback">{fieldErrors.serialNumber}</div>}
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm">Location *</label>
            <input className={`form-control form-control-sm ${fieldErrors.location ? 'is-invalid' : ''}`} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            {fieldErrors.location && <div className="invalid-feedback">{fieldErrors.location}</div>}
          </div>
          <div className="col-md-2">
            <label className="form-label form-label-sm">Condition</label>
            <select className="form-select form-select-sm" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
              {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label form-label-sm">Acquisition Cost *</label>
            <input type="number" min="0" className={`form-control form-control-sm ${fieldErrors.acquisitionCost ? 'is-invalid' : ''}`} value={form.acquisitionCost} onChange={e => setForm({ ...form, acquisitionCost: e.target.value })} />
            {fieldErrors.acquisitionCost && <div className="invalid-feedback">{fieldErrors.acquisitionCost}</div>}
          </div>
          <div className="col-md-2 d-flex align-items-end pb-1">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="bookable" checked={form.bookable} onChange={e => setForm({ ...form, bookable: e.target.checked })} />
              <label className="form-check-label small" htmlFor="bookable">Bookable</label>
            </div>
          </div>
          <div className="col-12">
            <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-1" />Registering…</> : 'Register Asset'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Asset Detail Modal ───────────────────────────────────────────────────────

function AssetModal({ assetId, onClose }) {
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!assetId) return;
    api.get(`/assets/${assetId}`)
      .then(res => setAsset(res.data))
      .catch(err => setError(err.response?.data?.message || err.message));
  }, [assetId]);

  if (!assetId) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Asset Detail</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {!asset && !error && <div className="text-center py-3"><div className="spinner-border" /></div>}
            {asset && (
              <table className="table table-sm table-bordered">
                <tbody>
                  {[
                    ['Asset Tag', asset.assetTag],
                    ['Name', asset.name],
                    ['Serial Number', asset.serialNumber],
                    ['Category', asset.categoryName || asset.category],
                    ['Location', asset.location],
                    ['Condition', asset.condition],
                    ['Acquisition Cost', asset.acquisitionCost !== undefined ? `₹${asset.acquisitionCost}` : '—'],
                    ['Bookable', asset.bookable ? 'Yes' : 'No'],
                    ['Status', asset.status],
                    ['Assigned To', asset.assignedTo || asset.assignedEmployee || 'Unassigned'],
                  ].map(([k, v]) => (
                    <tr key={k}><th style={{ width: 180 }}>{k}</th><td>{v ?? '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Assets Page ──────────────────────────────────────────────────────────────

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function loadAssets() {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/assets', { params });
      // Backend returns a Page object; extract the content array
      setAssets(res.data.content ?? res.data);
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  async function loadCategories() {
    try { const res = await api.get('/admin/categories'); setCategories(res.data); }
    catch { setCategories([]); }
  }

  useEffect(() => { loadAssets(); }, [statusFilter]);
  useEffect(() => { loadCategories(); }, []);

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchesQ = !q || a.assetTag?.toLowerCase().includes(q) || a.serialNumber?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q);
    const matchesCat = !categoryFilter || a.categoryName === categoryFilter || String(a.categoryId) === categoryFilter;
    return matchesQ && matchesCat;
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-semibold mb-0" style={{ color: 'var(--text-primary)' }}>Asset Registry &amp; Directory</h5>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(f => !f)}>
          + Register asset
        </button>
      </div>

      {error && <div className="alert alert-danger alert-dismissible py-2 small"><span>{error}</span><button className="btn-close btn-sm" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible py-2 small"><span>{success}</span><button className="btn-close btn-sm" onClick={() => setSuccess('')} /></div>}

      {showForm && (
        <RegistrationForm
          categories={categories}
          onCreated={msg => { setSuccess(msg); setShowForm(false); loadAssets(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <input className="form-control form-control-sm" placeholder="Search by tag, serial or name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="col-md-3">
          <select className="form-select form-select-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">Category</option>
            {(categories || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select form-select-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Status</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <table className="table table-sm table-bordered table-hover">
        <thead className="table-light">
          <tr><th>Tag</th><th>Item</th><th>Category</th><th>Department</th><th>Status</th><th>Location</th><th></th></tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="text-center text-muted small py-3">No assets found.</td></tr>
          )}
          {filtered.map(asset => (
            <tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedAssetId(asset.id)}>
              <td><code className="small">{asset.assetTag}</code></td>
              <td className="small">{asset.name}</td>
              <td className="small">{asset.categoryName || asset.category || '—'}</td>
              <td className="small text-muted">{asset.department || '—'}</td>
              <td>
                <span className={`badge ${STATUS_BADGE[asset.status] || 'bg-secondary'}`}>{asset.status}</span>
              </td>
              <td className="small">{asset.location}</td>
              <td>
                <button className="btn btn-outline-secondary btn-sm" onClick={e => { e.stopPropagation(); setSelectedAssetId(asset.id); }}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedAssetId && <AssetModal assetId={selectedAssetId} onClose={() => setSelectedAssetId(null)} />}
    </div>
  );
}
