import React, { useState, useEffect } from 'react';
import api from '../api.js';

export default function Allocation() {
  const [availableAssets, setAvailableAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [form, setForm] = useState({ assetId: '', employeeId: '', expectedReturnDate: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');
  const [conflictAllocationId, setConflictAllocationId] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  async function loadAll() {
    try {
      const [assetsRes, empRes, allocRes] = await Promise.all([
        api.get('/assets', { params: { status: 'Available' } }),
        api.get('/admin/employees'),
        api.get('/allocations'),
      ]);
      setAvailableAssets(assetsRes.data);
      setEmployees(empRes.data);
      setAllocations(allocRes.data);
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }
  useEffect(() => { loadAll(); }, []);

  function handleAssetChange(id) {
    setForm({ ...form, assetId: id });
    const asset = availableAssets.find(a => String(a.id) === String(id));
    setSelectedAsset(asset || null);
  }

  async function handleAllocate(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setConflictMsg(''); setConflictAllocationId(null);
    const errors = {};
    if (!form.assetId) errors.assetId = 'Select an asset.';
    if (!form.employeeId) errors.employeeId = 'Select an employee.';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({}); setLoading(true);
    try {
      await api.post('/allocations', {
        assetId: form.assetId,
        employeeId: form.employeeId,
        expectedReturnDate: form.expectedReturnDate || undefined,
      });
      setForm({ assetId: '', employeeId: '', expectedReturnDate: '' });
      setSelectedAsset(null);
      setSuccess('Asset allocated successfully.');
      loadAll();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || '';
      const allocationId = err.response?.data?.allocationId || null;
      if (status === 409 || (status === 400 && msg.toLowerCase().includes('currently held by'))) {
        setConflictMsg(msg); setConflictAllocationId(allocationId);
      } else { setError(msg || 'Allocation failed.'); }
    } finally { setLoading(false); }
  }

  async function handleTransferRequest() {
    if (!conflictAllocationId) { setError('Cannot determine allocation ID for transfer.'); return; }
    setTransferLoading(true);
    try {
      await api.post(`/allocations/${conflictAllocationId}/transfer-request`);
      setSuccess('Transfer request submitted.'); setConflictMsg(''); setConflictAllocationId(null);
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setTransferLoading(false); }
  }

  async function handleReturn(allocationId) {
    setError(''); setSuccess('');
    try {
      await api.post(`/allocations/${allocationId}/return`);
      setSuccess('Asset marked as returned.'); loadAll();
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  return (
    <div>
      <h5 className="fw-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Asset Allocation &amp; Transfer
      </h5>

      {error && <div className="alert alert-danger alert-dismissible py-2 small"><span>{error}</span><button className="btn-close btn-sm" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible py-2 small"><span>{success}</span><button className="btn-close btn-sm" onClick={() => setSuccess('')} /></div>}

      {/* Conflict banner */}
      {conflictMsg && (
        <div className="alert alert-warning d-flex justify-content-between align-items-start py-2 small">
          <div>
            <strong>Double-allocation block:</strong> {conflictMsg}
          </div>
          <button className="btn btn-warning btn-sm ms-3 flex-shrink-0" onClick={handleTransferRequest} disabled={transferLoading}>
            {transferLoading ? <><span className="spinner-border spinner-border-sm me-1" />Sending…</> : 'Transfer Request'}
          </button>
        </div>
      )}

      {/* Form card */}
      <div className="af-surface border rounded-2 p-3 mb-4" style={{ borderColor: 'var(--border-color)' }}>
        <h6 className="fw-semibold mb-3">Transfer Request</h6>

        {/* Selected asset preview */}
        {selectedAsset && (
          <div className="border rounded-2 p-2 mb-3 small" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
            <strong>{selectedAsset.assetTag}</strong> — {selectedAsset.name}
            <span className="badge bg-success ms-2">{selectedAsset.status}</span>
          </div>
        )}

        <form onSubmit={handleAllocate} noValidate>
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label form-label-sm">From Date</label>
              <select className={`form-select form-select-sm ${fieldErrors.assetId ? 'is-invalid' : ''}`} value={form.assetId} onChange={e => handleAssetChange(e.target.value)}>
                <option value="">— Select Asset —</option>
                {availableAssets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
              </select>
              {fieldErrors.assetId && <div className="invalid-feedback">{fieldErrors.assetId}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label form-label-sm">Select Employee…</label>
              <select className={`form-select form-select-sm ${fieldErrors.employeeId ? 'is-invalid' : ''}`} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">— Select Employee —</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || emp.email})</option>)}
              </select>
              {fieldErrors.employeeId && <div className="invalid-feedback">{fieldErrors.employeeId}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label form-label-sm">Expected Return Date</label>
              <input type="date" className="form-control form-control-sm" value={form.expectedReturnDate} onChange={e => setForm({ ...form, expectedReturnDate: e.target.value })} />
            </div>
          </div>
          <div className="mt-3">
            <textarea className="form-control form-control-sm mb-2" rows={2} placeholder="Notes (optional)" />
            <button className="btn btn-danger btn-sm" type="submit" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-1" />Allocating…</> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Allocation history */}
      <h6 className="fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Allocation History</h6>
      <table className="table table-sm table-bordered table-hover">
        <thead className="table-light">
          <tr><th>Asset Tag</th><th>Asset Name</th><th>Assigned To</th><th>Date</th><th>Expected Return</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {allocations.length === 0 && <tr><td colSpan={6} className="text-center text-muted small">No active allocations.</td></tr>}
          {allocations.map(alloc => (
            <tr key={alloc.id}>
              <td><code className="small">{alloc.assetTag || alloc.asset?.assetTag}</code></td>
              <td className="small">{alloc.assetName || alloc.asset?.name}</td>
              <td className="small">{alloc.employeeName || alloc.employee?.name}</td>
              <td className="small">{alloc.allocationDate ? new Date(alloc.allocationDate).toLocaleDateString() : '—'}</td>
              <td className="small">{alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : '—'}</td>
              <td>
                <button className="btn btn-outline-success btn-sm" onClick={() => handleReturn(alloc.id)}>
                  Return
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
