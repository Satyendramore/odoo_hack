import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../ThemeContext.jsx';

const PAGE_TITLES = {
  '/dashboard':     { title: 'Dashboard',        sub: "Today's overview" },
  '/assets':        { title: 'Asset Registry',   sub: 'Browse and manage all assets' },
  '/allocations':   { title: 'Allocations',      sub: 'Assign and transfer assets' },
  '/bookings':      { title: 'Resource Booking', sub: 'Book equipment and rooms' },
  '/maintenance':   { title: 'Maintenance',      sub: 'Track and resolve issues' },
  '/org-setup':     { title: 'Organisation Setup', sub: 'Departments, categories & employees' },
  '/reports':       { title: 'Reports & Analytics', sub: 'Insights and usage data' },
  '/audit':         { title: 'Asset Audit',      sub: 'Verify and reconcile inventory' },
  '/notifications': { title: 'Notifications',    sub: 'Activity log and alerts' },
};

const ROLE_BADGE_CLASS = {
  ADMIN:           'af-badge af-badge-accent',
  ASSET_MANAGER:   'af-badge af-badge-info',
  DEPARTMENT_HEAD: 'af-badge af-badge-warning',
  EMPLOYEE:        'af-badge af-badge-neutral',
};

const ROLE_LABEL = {
  ADMIN:           'Admin',
  ASSET_MANAGER:   'Asset Mgr',
  DEPARTMENT_HEAD: 'Dept Head',
  EMPLOYEE:        'Employee',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const page = PAGE_TITLES[location.pathname] || { title: 'AssetFlow', sub: '' };
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="af-topbar">
      {/* Page title */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {page.title}
        </div>
        {page.sub && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{page.sub}</div>
        )}
      </div>

      {/* Right-side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        {/* User chip */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 10px', borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-body)',
          }}>
            <div className="af-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{initials}</div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </div>
              <span className={ROLE_BADGE_CLASS[user.role] || 'af-badge af-badge-neutral'}
                    style={{ fontSize: 10, padding: '1px 6px' }}>
                {ROLE_LABEL[user.role] || user.role}
              </span>
            </div>
          </div>
        )}

        {/* Logout button — always visible */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            background: 'transparent',
            color: '#ef4444',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ef4444'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; }}
          title="Sign out"
        >
          <span style={{ fontSize: 14 }}>↩</span> Logout
        </button>

      </div>
    </div>
  );
}
