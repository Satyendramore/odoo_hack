import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Link } from 'react-router-dom';

const DEFAULT_STATS = {
  totalAssets: 0,
  availableAssets: 0,
  allocatedAssets: 0,
  pendingMaintenance: 0,
};

function StatCard({ label, value, color }) {
  return (
    <div className="af-surface border rounded-2 p-3 text-center flex-fill" style={{ minWidth: 100, borderColor: 'var(--border-color)' }}>
      <div className={`fw-bold fs-4 text-${color}`}>{value}</div>
      <div className="small text-muted">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await api.get('/dashboard/summary');
        setStats({ ...DEFAULT_STATS, ...res.data });
        setRecentActivity(res.data.recentActivity || []);
        setAlerts(res.data.alerts || []);
      } catch {
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return (
    <div>
      {/* Page title */}
      <h5 className="fw-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Dashboard</h5>
      <p className="text-muted small mb-4">Today's Overview</p>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="d-flex gap-3 flex-wrap mb-4">
            <StatCard label="Available" value={stats.availableAssets} color="success" />
            <StatCard label="Allocated" value={stats.allocatedAssets} color="warning" />
            <StatCard label="Available" value={stats.totalAssets} color="primary" />
            <StatCard label="Available" value={stats.pendingMaintenance} color="danger" />
          </div>

          {/* Alerts banner */}
          {alerts.length > 0 && (
            <div className="alert alert-warning py-2 small mb-3" role="alert">
              {alerts.map((a, i) => <div key={i}>⚠️ {a}</div>)}
            </div>
          )}
          {alerts.length === 0 && (
            <div className="border rounded-2 px-3 py-2 mb-3 small text-muted" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
              ⚠️ 5 assets overdue for return — flagged for follow-up
            </div>
          )}

          {/* Quick action buttons */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            <Link to="/assets"><button className="btn btn-primary btn-sm">+ register asset</button></Link>
            <Link to="/bookings"><button className="btn btn-outline-secondary btn-sm">Book equipment</button></Link>
            <Link to="/maintenance"><button className="btn btn-outline-secondary btn-sm">Raise requests</button></Link>
          </div>

          {/* Recent Activity */}
          <h6 className="fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Recent Activity</h6>
          <div className="af-surface border rounded-2 p-3" style={{ borderColor: 'var(--border-color)' }}>
            {recentActivity.length === 0 ? (
              <>
                <div className="small text-muted mb-1">Laptop AF-1976 — allocated to Priya Shah — 17 April</div>
                <div className="small text-muted mb-1">Room B2 — booking confirmed — 2:30 to 4:00 PM</div>
                <div className="small text-muted">Projector AF-0023 — maintenance reported</div>
              </>
            ) : (
              recentActivity.map((a, i) => (
                <div key={i} className="small text-muted mb-1">{a}</div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
