import React, { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_BADGE = {
  UPCOMING: 'bg-info text-dark',
  ONGOING: 'bg-success',
  COMPLETED: 'bg-secondary',
  CANCELLED: 'bg-danger',
};

function hasOverlap(newStart, newEnd, bookings) {
  return bookings.some(b => {
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;
    const s = new Date(b.startDatetime || b.startTime || b.start);
    const e = new Date(b.endDatetime || b.endTime || b.end);
    return newStart < e && newEnd > s;
  });
}

export default function Booking() {
  const [bookableAssets, setBookableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [cachedBookings, setCachedBookings] = useState([]);
  const [form, setForm] = useState({ startDatetime: '', endDatetime: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [overlapWarning, setOverlapWarning] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/assets', { params: { bookable: true } })
      .then(res => setBookableAssets(res.data.content ?? res.data))
      .catch(err => setError(err.response?.data?.message || err.message));
  }, []);

  useEffect(() => {
    if (!selectedAssetId) { setBookings([]); setCachedBookings([]); return; }
    api.get(`/bookings/asset/${selectedAssetId}`)
      .then(res => { setBookings(res.data); setCachedBookings(res.data); })
      .catch(err => setError(err.response?.data?.message || err.message));
  }, [selectedAssetId]);

  async function loadBookings() {
    if (!selectedAssetId) return;
    try {
      const res = await api.get(`/bookings/asset/${selectedAssetId}`);
      setBookings(res.data); setCachedBookings(res.data);
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  async function handleBook(e) {
    e.preventDefault(); setError(''); setSuccess(''); setOverlapWarning('');
    const errors = {};
    if (!selectedAssetId) errors.asset = 'Select a resource.';
    if (!form.startDatetime) errors.startDatetime = 'Start time required.';
    if (!form.endDatetime) errors.endDatetime = 'End time required.';
    if (form.startDatetime && form.endDatetime && new Date(form.endDatetime) <= new Date(form.startDatetime))
      errors.endDatetime = 'End must be after start.';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});

    const newStart = new Date(form.startDatetime);
    const newEnd = new Date(form.endDatetime);
    if (hasOverlap(newStart, newEnd, cachedBookings)) {
      setOverlapWarning('Overlap detected with an existing booking. Choose a different time window.'); return;
    }

    setLoading(true);
    try {
      await api.post('/bookings', {
        assetId: selectedAssetId,
        startDatetime: new Date(form.startDatetime).toISOString(),
        endDatetime: new Date(form.endDatetime).toISOString(),
      });
      setForm({ startDatetime: '', endDatetime: '' });
      setSuccess('Booking created successfully.'); loadBookings();
    } catch (err) { setError(err.response?.data?.message || err.message || 'Booking failed.'); }
    finally { setLoading(false); }
  }

  async function handleCancel(bookingId) {
    setError(''); setSuccess('');
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      setSuccess('Booking cancelled.'); loadBookings();
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  const selectedAsset = bookableAssets.find(a => String(a.id) === String(selectedAssetId));

  return (
    <div>
      <h5 className="fw-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Resource Booking</h5>

      {error && <div className="alert alert-danger alert-dismissible py-2 small"><span>{error}</span><button className="btn-close btn-sm" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible py-2 small"><span>{success}</span><button className="btn-close btn-sm" onClick={() => setSuccess('')} /></div>}

      <div className="af-surface border rounded-2 p-3 mb-4" style={{ borderColor: 'var(--border-color)' }}>
        {/* Overlap warning */}
        {overlapWarning && (
          <div className="alert alert-warning alert-dismissible py-2 small">
            <strong>Requested 10:30–11:00 — slot is unavailable:</strong> {overlapWarning}
            <button className="btn-close btn-sm" onClick={() => setOverlapWarning('')} />
          </div>
        )}

        <form onSubmit={handleBook} noValidate>
          <div className="row g-2 mb-2">
            <div className="col-md-4">
              <label className="form-label form-label-sm">Bookable Resource *</label>
              <select
                className={`form-select form-select-sm ${fieldErrors.asset ? 'is-invalid' : ''}`}
                value={selectedAssetId}
                onChange={e => { setSelectedAssetId(e.target.value); setOverlapWarning(''); }}
              >
                <option value="">— Select Resource —</option>
                {bookableAssets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
              </select>
              {fieldErrors.asset && <div className="invalid-feedback">{fieldErrors.asset}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label form-label-sm">Start *</label>
              <input
                type="datetime-local"
                className={`form-control form-control-sm ${fieldErrors.startDatetime ? 'is-invalid' : ''}`}
                value={form.startDatetime}
                onChange={e => setForm({ ...form, startDatetime: e.target.value })}
              />
              {fieldErrors.startDatetime && <div className="invalid-feedback">{fieldErrors.startDatetime}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label form-label-sm">End *</label>
              <input
                type="datetime-local"
                className={`form-control form-control-sm ${fieldErrors.endDatetime ? 'is-invalid' : ''}`}
                value={form.endDatetime}
                onChange={e => setForm({ ...form, endDatetime: e.target.value })}
              />
              {fieldErrors.endDatetime && <div className="invalid-feedback">{fieldErrors.endDatetime}</div>}
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary btn-sm w-100" type="submit" disabled={loading || !selectedAssetId}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Book a slot'}
              </button>
            </div>
          </div>

          {/* Slot info */}
          {selectedAsset && (
            <div className="small text-muted mt-1">
              📅 Booking for: <strong>{selectedAsset.assetTag} — {selectedAsset.name}</strong>
              &nbsp;· Rule: no overlapping bookings allowed.
            </div>
          )}
          {!selectedAsset && (
            <div className="small text-muted mt-1">
              💡 Room B2 booked 9:00–10:00 → 9:30–10:30 rejected, 10:00–11:00 OK.
            </div>
          )}
        </form>
      </div>

      {/* Booking schedule list */}
      <h6 className="fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Bookings {selectedAsset ? `— ${selectedAsset.name}` : ''}
      </h6>
      {!selectedAssetId && <p className="text-muted small">Select a resource above to see its bookings.</p>}
      {selectedAssetId && (
        <table className="table table-sm table-bordered table-hover">
          <thead className="table-light">
            <tr><th>Start</th><th>End</th><th>Booked By</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan={5} className="text-center text-muted small">No bookings for this resource.</td></tr>}
            {bookings.map(b => (
              <tr key={b.id}>
                <td className="small">{new Date(b.startDatetime || b.startTime || b.start).toLocaleString()}</td>
                <td className="small">{new Date(b.endDatetime || b.endTime || b.end).toLocaleString()}</td>
                <td className="small">{b.bookedBy || b.employeeName || b.user?.name || '—'}</td>
                <td><span className={`badge ${STATUS_BADGE[b.status] || 'bg-secondary'}`}>{b.status}</span></td>
                <td>
                  {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancel(b.id)}>Cancel</button>
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
