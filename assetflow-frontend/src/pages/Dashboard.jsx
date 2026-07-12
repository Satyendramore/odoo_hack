import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../api/dashboard';
import { useAuth } from '../AuthContext.jsx';
import { Link } from 'react-router-dom';

const DEFAULT_STATS = {
  assetsAvailable: 0,
  assetsAllocated: 0,
  maintenanceInProgress: 0,
  maintenancePendingApproval: 0,
  activeBookings: 0,
  pendingTransferRequests: 0,
  upcomingReturns: 0,
  overdueReturns: 0,
};

function StatCard({ label, value, icon, color, bg, to }) {
  const card = (
    <div className="af-stat-card" style={{ flex: '1 1 160px' }}>
      <div className="af-stat-icon" style={{ background: bg }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div>
        <div className="af-stat-value" style={{ color }}>{value}</div>
        <div className="af-stat-label">{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none', flex: '1 1 160px' }}>{card}</Link> : card;
}

function QuickAction({ icon, label, to, color }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: 'var(--shadow-sm)',
      }}
        onMouseOver={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseOut={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = ''; }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
      </div>
    </Link>
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
        const res = await dashboardAPI.getSummary();
        setStats({ ...DEFAULT_STATS, ...res.data });
        
        // Generate alerts based on stats
        const generatedAlerts = [];
        if (res.data.maintenancePendingApproval > 0) {
          generatedAlerts.push(`${res.data.maintenancePendingApproval} maintenance request(s) waiting for approval.`);
        }
        if (res.data.overdueReturns > 0) {
          generatedAlerts.push(`${res.data.overdueReturns} asset(s) overdue for return.`);
        }
        if (res.data.pendingTransferRequests > 0) {
          generatedAlerts.push(`${res.data.pendingTransferRequests} transfer request(s) pending.`);
        }
        setAlerts(generatedAlerts);
      } catch (err) {
        console.error('Failed to fetch dashboard summary:', err);
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Good {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginTop: 4, marginBottom: 0 }}>
          Here's what's happening with your assets today.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner-border text-primary" role="status" style={{ width: 28, height: 28 }} />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            <StatCard label="Available"              value={stats.assetsAvailable}              icon="✓" color="#22c55e" bg="rgba(34,197,94,0.1)"   to="/assets" />
            <StatCard label="Allocated"              value={stats.assetsAllocated}              icon="⇄" color="#f59e0b" bg="rgba(245,158,11,0.1)"  to="/allocations" />
            <StatCard label="Maintenance In Progress" value={stats.maintenanceInProgress}       icon="⚙" color="#ef4444" bg="rgba(239,68,68,0.1)"   to="/maintenance" />
            <StatCard label="Pending Approval"       value={stats.maintenancePendingApproval}   icon="⏳" color="#8b5cf6" bg="rgba(139,92,246,0.1)"  to="/maintenance" />
            <StatCard label="Active Bookings"        value={stats.activeBookings}               icon="⊡" color="#06b6d4" bg="rgba(6,182,212,0.1)"   to="/bookings" />
            <StatCard label="Transfer Requests"      value={stats.pendingTransferRequests}      icon="✉" color="#ec4899" bg="rgba(236,72,153,0.1)"  to="/allocations" />
            <StatCard label="Upcoming Returns"       value={stats.upcomingReturns}              icon="📦" color="#14b8a6" bg="rgba(20,184,166,0.1)"  to="/allocations" />
            <StatCard label="Overdue Returns"        value={stats.overdueReturns}               icon="⚠" color="#f97316" bg="rgba(249,115,22,0.1)"  to="/allocations" />
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="alert alert-warning d-flex align-items-start gap-2 mb-4" style={{ fontSize: 13 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <div>{alerts.map((a, i) => <div key={i}>{a}</div>)}</div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <QuickAction icon="⊕" label="Register Asset"    to="/assets"      />
              <QuickAction icon="⊡" label="Book Equipment"    to="/bookings"    />
              <QuickAction icon="⚙" label="Raise Request"     to="/maintenance" />
              <QuickAction icon="⇄" label="New Allocation"    to="/allocations" />
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
              Recent Activity
            </div>
            <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
              {MOCK_ACTIVITY.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 18px',
                  borderBottom: i < MOCK_ACTIVITY.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: ACTIVITY_ICONS[i % ACTIVITY_ICONS.length].bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                  }}>
                    {ACTIVITY_ICONS[i % ACTIVITY_ICONS.length].icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 400 }}>
                      {typeof item === 'string' ? item : item.message || item}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {typeof item === 'object' && item.time ? item.time : 'just now'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const MOCK_ACTIVITY = [
  'Laptop AF-1976 allocated to Priya Shah',
  'Room B2 booking confirmed — 2:30 to 4:00 PM',
  'Projector AF-0023 maintenance request raised',
];

const ACTIVITY_ICONS = [
  { icon: '⇄', bg: 'rgba(99,102,241,0.1)' },
  { icon: '⊡', bg: 'rgba(34,197,94,0.1)' },
  { icon: '⚙', bg: 'rgba(245,158,11,0.1)' },
  { icon: '⬡', bg: 'rgba(6,182,212,0.1)' },
];
