import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const COLUMNS = ['Pending', 'Approved', 'In Progress', 'Resolved', 'Rejected'];

const COL_BADGE = {
  PENDING: 'bg-warning text-dark',
  APPROVED: 'bg-info text-dark',
  IN_PROGRESS: 'bg-primary',
  RESOLVED: 'bg-success',
  REJECTED: 'bg-danger',
};

const PRIORITY_BADGE = {
  Low: 'bg-secondary',
  Medium: 'bg-warning text-dark',
  High: 'bg-danger',
};

export default function Maintaince() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ assetId: '', issueDescription: '', priority: 'Medium' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  async function loadAssets() {
    try { const r = await api.get('/assets'); setAssets(r.data.content ?? r.data); } catch { /* non-critical */ }
  }
  async function loadRequests() {
    try { const r = await api.get('/maintenance'); setRequests(r.data); }
    catch (err) { setError(err.response?.data?.message || err.message); }
  }
  useEffect(() => { loadAssets(); loadRequests(); }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSuccess('');
    const errors = {};
    if (!form.assetId) errors.assetId = 'Select an asset.';
    if (!form.issueDescription.trim()) errors.issueDescription = 'Description is required.';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({}); setLoading(true);
    try {
      await api.post('/maintenance', form);
      setForm({ assetId: '', issueDescription: '', priority: 'Medium' });
      setSuccess('Maintenance request raised.'); loadRequests();
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  }

  async function handleAction(id, action) {
    setError(''); setSuccess('');
    try {
      await api.patch(`/maintenance/${id}/${action}`);
      setSuccess(`Request ${action}d.`); loadRequests();
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  // Group by column for kanban
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = requests.filter(r => {
      const s = r.status; // e.g. "PENDING", "APPROVED", "IN_PROGRESS", "RESOLVED", "REJECTED"
      if (col === 'Pending') return s === 'PENDING';
      if (col === 'Approved') return s === 'APPROVED';
      if (col === 'In Progress') return s === 'IN_PROGRESS';
      if (col === 'Resolved') return s === 'RESOLVED';
      if (col === 'Rejected') return s === 'REJECTED';
      return false;
    });
    return acc;
  }, {});

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-semibold mb-0" style={{ color: 'var(--text-primary)' }}>Maintenance Management</h5>
        <div className="btn-group btn-group-sm">
          <button className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('kanban')}>Kanban</button>
          <button className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('table')}>Table</button>
        </div>
      </div>

      {error && <div className="alert alert-danger alert-dismissible py-2 small"><span>{error}</span><button className="btn-close btn-sm" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible py-2 small"><span>{success}</span><button className="btn-close btn-sm" onClick={() => setSuccess('')} /></div>}

      {/* Raise request form */}
      <div className="af-surface border rounded-2 p-3 mb-4" style={{ borderColor: 'var(--border-color)' }}>
        <h6 className="fw-semibold mb-3">Raise Maintenance Request</h6>
        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label form-label-sm">Asset *</label>
              <select className={`form-select form-select-sm ${fieldErrors.assetId ? 'is-invalid' : ''}`} value={form.assetId} onChange={e => setForm({ ...form, assetId: e.target.value })}>
                <option value="">— Select Asset —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
              </select>
              {fieldErrors.assetId && <div className="invalid-feedback">{fieldErrors.assetId}</div>}
            </div>
            <div className="col-md-5">
              <label className="form-label form-label-sm">Issue Description *</label>
              <textarea rows={2} className={`form-control form-control-sm ${fieldErrors.issueDescription ? 'is-invalid' : ''}`} value={form.issueDescription} onChange={e => setForm({ ...form, issueDescription: e.target.value })} />
              {fieldErrors.issueDescription && <div className="invalid-feedback">{fieldErrors.issueDescription}</div>}
            </div>
            <div className="col-md-2">
              <label className="form-label form-label-sm">Priority</label>
              <select className="form-select form-select-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary btn-sm w-100" type="submit" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Submit'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Kanban board */}
      {viewMode === 'kanban' && (
        <>
          <p className="text-muted small mb-3">
            Approving a card across the board-to-order continuous, marking return &amp; to visible.
          </p>
          <div className="d-flex gap-2 overflow-auto pb-2">
            {COLUMNS.map(col => (
              <div key={col} className="af-surface border rounded-2 p-2 flex-shrink-0" style={{ minWidth: 170, borderColor: 'var(--border-color)' }}>
                <div className="fw-semibold small mb-2" style={{ color: 'var(--text-primary)' }}>{col}</div>
                {grouped[col].length === 0 && (
                  <div className="text-muted" style={{ fontSize: 11 }}>—</div>
                )}
                {grouped[col].map(req => (
                  <div key={req.id} className="border rounded-2 p-2 mb-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-body)', fontSize: 12 }}>
                    <div className="fw-semibold mb-1">{req.assetTag || req.asset?.assetTag || '—'}</div>
                    <div className="text-muted mb-1" style={{ fontSize: 11 }}>{req.issueDescription?.slice(0, 40)}{req.issueDescription?.length > 40 ? '…' : ''}</div>
                    <span className={`badge ${PRIORITY_BADGE[req.priority] || 'bg-secondary'}`} style={{ fontSize: 10 }}>{req.priority}</span>
                    {canManage && req.status === 'PENDING' && (
                      <div className="mt-2 d-flex gap-1">
                        <button className="btn btn-success btn-sm py-0 px-1" style={{ fontSize: 11 }} onClick={() => handleAction(req.id, 'approve')}>✓</button>
                        <button className="btn btn-danger btn-sm py-0 px-1" style={{ fontSize: 11 }} onClick={() => handleAction(req.id, 'reject')}>✗</button>
                      </div>
                    )}
                    {canManage && (req.status === 'APPROVED' || req.status === 'IN_PROGRESS') && (
                      <div className="mt-2">
                        <button className="btn btn-outline-success btn-sm py-0 px-1" style={{ fontSize: 11 }} onClick={() => handleAction(req.id, 'resolve')}>Resolve</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <table className="table table-sm table-bordered table-hover">
          <thead className="table-light">
            <tr><th>Asset</th><th>Issue</th><th>Priority</th><th>Status</th><th>Requested By</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {requests.length === 0 && <tr><td colSpan={6} className="text-center text-muted small">No maintenance requests.</td></tr>}
            {requests.map(req => (
              <tr key={req.id}>
                <td className="small">{req.assetTag || req.asset?.assetTag || '—'}</td>
                <td className="small text-truncate" style={{ maxWidth: 200 }} title={req.issueDescription}>{req.issueDescription}</td>
                <td><span className={`badge ${PRIORITY_BADGE[req.priority] || 'bg-secondary'}`}>{req.priority}</span></td>
                <td><span className={`badge ${COL_BADGE[req.status] || 'bg-secondary'}`}>{req.status.replace('_', ' ')}</span></td>
                <td className="small">{req.requestedBy || req.employee?.name || '—'}</td>
                <td className="d-flex gap-1">
                  {canManage && req.status === 'PENDING' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(req.id, 'approve')}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(req.id, 'reject')}>Reject</button>
                    </>
                  )}
                  {canManage && (req.status === 'APPROVED' || req.status === 'IN_PROGRESS') && (
                    <button className="btn btn-outline-success btn-sm" onClick={() => handleAction(req.id, 'resolve')}>Resolve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
