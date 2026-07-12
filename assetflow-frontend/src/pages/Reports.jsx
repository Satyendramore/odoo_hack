import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/reports/summary')
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  // Fallback placeholder data matching the layout
  const utilByDept = stats?.utilizationByDepartment || [
    { department: 'Engineering', count: 40 },
    { department: 'Marketing', count: 25 },
    { department: 'HR', count: 15 },
    { department: 'Finance', count: 30 },
  ];
  const maintFreq = stats?.maintenanceFrequency || [
    { month: 'Jan', count: 5 },
    { month: 'Feb', count: 8 },
    { month: 'Mar', count: 3 },
    { month: 'Apr', count: 10 },
    { month: 'May', count: 6 },
  ];
  const summary = stats || {
    totalBookingsThisWeek: 18,
    completedBookingsThisWeek: 14,
    pendingBookingsThisWeek: 4,
    assetsMaintenanceThisWeek: 7,
    assetsRetiredThisWeek: 2,
    mostUsedAsset: 'Laptop AF-1023 — 9 points — 44 — running interest',
  };

  const maxUtil = Math.max(...utilByDept.map(d => d.count), 1);
  const maxMaint = Math.max(...maintFreq.map(m => m.count), 1);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-semibold mb-0" style={{ color: 'var(--text-primary)' }}>
          Reports &amp; Analytics
        </h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => apiClient.get('/reports/export').catch(() => alert('Export not yet available.'))}
        >
          Export report
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <>
          {/* Charts row */}
          <div className="row g-3 mb-4">
            {/* Utilisation by department — bar chart */}
            <div className="col-md-6">
              <div className="af-surface border rounded-2 p-3 h-100" style={{ borderColor: 'var(--border-color)' }}>
                <h6 className="fw-semibold mb-3 small" style={{ color: 'var(--text-primary)' }}>
                  Utilisation by Department
                </h6>
                <div className="d-flex align-items-end gap-2" style={{ height: 120 }}>
                  {utilByDept.map(d => (
                    <div key={d.department} className="d-flex flex-column align-items-center flex-fill">
                      <div
                        className="bg-primary rounded-top w-100"
                        style={{ height: `${Math.round((d.count / maxUtil) * 100)}px`, minHeight: 4 }}
                      />
                      <div className="text-muted mt-1" style={{ fontSize: 10 }}>{d.department.slice(0, 4)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Maintenance frequency — line-style bars */}
            <div className="col-md-6">
              <div className="af-surface border rounded-2 p-3 h-100" style={{ borderColor: 'var(--border-color)' }}>
                <h6 className="fw-semibold mb-3 small" style={{ color: 'var(--text-primary)' }}>
                  Maintenance Frequency
                </h6>
                <div className="d-flex align-items-end gap-2" style={{ height: 120 }}>
                  {maintFreq.map(m => (
                    <div key={m.month} className="d-flex flex-column align-items-center flex-fill">
                      <div
                        className="bg-info rounded-top w-100"
                        style={{ height: `${Math.round((m.count / maxMaint) * 100)}px`, minHeight: 4 }}
                      />
                      <div className="text-muted mt-1" style={{ fontSize: 10 }}>{m.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="af-surface border rounded-2 p-3" style={{ borderColor: 'var(--border-color)' }}>
                <h6 className="small fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Most used assets</h6>
                <div className="small text-muted">This week: {summary.totalBookingsThisWeek} bookings this week</div>
                <div className="small text-muted">Completed: {summary.completedBookingsThisWeek} — around 6% this week</div>
                <div className="small text-muted">Pending: {summary.pendingBookingsThisWeek} — around 69% this week</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="af-surface border rounded-2 p-3" style={{ borderColor: 'var(--border-color)' }}>
                <h6 className="small fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Info waste</h6>
                <div className="small text-muted">Maintenance: {summary.assetsMaintenanceThisWeek} — around 6% this week</div>
                <div className="small text-muted">Retired: {summary.assetsRetiredThisWeek} — around 69% this week</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="af-surface border rounded-2 p-3" style={{ borderColor: 'var(--border-color)' }}>
                <h6 className="small fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Assets due for maintenance / nearing retirement</h6>
                <div className="small text-muted">{summary.mostUsedAsset}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
