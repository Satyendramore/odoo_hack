import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const DEFAULT_STATS = {
  totalAssets: 0,
  availableAssets: 0,
  allocatedAssets: 0,
  pendingMaintenance: 0,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await api.get('/dashboard/summary');
        setStats({ ...DEFAULT_STATS, ...res.data });
      } catch {
        setStats(DEFAULT_STATS);
        setInfoMsg('Live data is currently unavailable. Showing placeholder values.');
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  const cards = [
    { label: 'Total Assets', value: stats.totalAssets, color: 'primary', icon: '📦' },
    { label: 'Available', value: stats.availableAssets, color: 'success', icon: '✅' },
    { label: 'Allocated', value: stats.allocatedAssets, color: 'warning', icon: '🔁' },
    { label: 'Pending Maintenance', value: stats.pendingMaintenance, color: 'danger', icon: '🔧' },
  ];

  return (
    <div>
      <h4 className="mb-1">Dashboard</h4>
      <p className="text-muted mb-4">Welcome back, <strong>{user?.name}</strong></p>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : (
        <>
          {infoMsg && (
            <div className="alert alert-info alert-dismissible mb-4" role="alert">
              {infoMsg}
              <button type="button" className="btn-close" onClick={() => setInfoMsg('')} />
            </div>
          )}
          <div className="row g-3">
            {cards.map((c) => (
              <div className="col-sm-6 col-lg-3" key={c.label}>
                <div className={`card border-${c.color} h-100`}>
                  <div className="card-body text-center">
                    <div className="fs-2">{c.icon}</div>
                    <div className={`display-6 fw-bold text-${c.color}`}>{c.value}</div>
                    <div className="text-muted small mt-1">{c.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
