import React, { useState, useEffect } from 'react';
import api from '../api.js';

const TYPE_ICON = {
  allocation: '🔁',
  booking: '📅',
  maintenance: '🔧',
  audit: '🔍',
  approval: '✅',
  alert: '⚠️',
};

const FILTERS = ['All', 'Alerts', 'Approvals', 'Bookings'];

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch(() => {
        // Fallback placeholder data matching the layout
        setNotifications([
          { id: 1, type: 'allocation', message: 'Laptop AF-1076 assigned to Priya Shah', time: '3s ago', read: false },
          { id: 2, type: 'maintenance', message: 'Maintenance record AF-0023 approved', time: '5s ago', read: false },
          { id: 3, type: 'booking', message: 'Booking confirmed — Room B2 — 2:30 to 4:00 PM', time: '9s ago', read: false },
          { id: 4, type: 'approval', message: 'Transfer approval — AF-0023 to facilities dept', time: '9s ago', read: true },
          { id: 5, type: 'alert', message: 'Display return — AF-0027 due in 3 days ago', time: '16 ago', read: true },
          { id: 6, type: 'audit', message: 'Audit discrepancy report — AF-0198 damaged', time: '44 ago', read: true },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Alerts') return n.type === 'alert';
    if (filter === 'Approvals') return n.type === 'approval';
    if (filter === 'Bookings') return n.type === 'booking';
    return true;
  });

  async function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await api.patch(`/notifications/${id}/read`); } catch { /* non-critical */ }
  }

  return (
    <div>
      <h5 className="fw-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Activity Log &amp; Notifications
      </h5>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="af-surface border rounded-2" style={{ borderColor: 'var(--border-color)' }}>
          {filtered.length === 0 && (
            <div className="text-muted text-center py-4 small">No notifications.</div>
          )}
          {filtered.map((n, i) => (
            <div
              key={n.id}
              className={`d-flex align-items-start gap-3 px-3 py-2 ${i < filtered.length - 1 ? 'border-bottom' : ''} ${!n.read ? 'fw-semibold' : ''}`}
              style={{ borderColor: 'var(--border-color)', cursor: 'pointer' }}
              onClick={() => markRead(n.id)}
            >
              <span style={{ fontSize: 16, marginTop: 2 }}>{TYPE_ICON[n.type] || '🔔'}</span>
              <div className="flex-grow-1">
                <div className="small" style={{ color: 'var(--text-primary)' }}>{n.message}</div>
              </div>
              <div className="text-muted flex-shrink-0" style={{ fontSize: 11 }}>{n.time}</div>
              {!n.read && (
                <div className="rounded-circle bg-primary flex-shrink-0" style={{ width: 8, height: 8, marginTop: 6 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
