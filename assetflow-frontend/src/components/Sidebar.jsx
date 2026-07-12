import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  ASSET_MANAGER: 'Asset Manager',
  DEPARTMENT_HEAD: 'Dept. Head',
  EMPLOYEE: 'Employee',
};

const NAV_ITEMS = [
  { to: '/dashboard',     icon: '◈',  label: 'Dashboard',     roles: null },
  { to: '/assets',        icon: '⬡',  label: 'Assets',        roles: ['ADMIN','ASSET_MANAGER','DEPARTMENT_HEAD'] },
  { to: '/allocations',   icon: '⇄',  label: 'Allocations',   roles: ['ADMIN','ASSET_MANAGER','DEPARTMENT_HEAD'] },
  { to: '/bookings',      icon: '⊡',  label: 'Bookings',      roles: null },
  { to: '/maintenance',   icon: '⚙',  label: 'Maintenance',   roles: null },
];

const ADMIN_ITEMS = [
  { to: '/org-setup',     icon: '⊞',  label: 'Org Setup',     roles: ['ADMIN'] },
  { to: '/reports',       icon: '▤',  label: 'Reports',       roles: ['ADMIN','ASSET_MANAGER'] },
  { to: '/audit',         icon: '◉',  label: 'Audit',         roles: ['ADMIN','ASSET_MANAGER'] },
];

const BOTTOM_ITEMS = [
  { to: '/notifications', icon: '⊙',  label: 'Notifications', roles: null },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const linkClass = ({ isActive }) =>
    'af-nav-link ' + (isActive ? 'af-nav-active' : '');

  function visible(item) {
    if (!item.roles) return true;
    return item.roles.includes(role);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="af-sidebar">
      {/* Brand */}
      <div className="af-brand">
        <div className="af-brand-icon">⚡</div>
        <span className="af-brand-text">AssetFlow</span>
      </div>
      <div className="af-brand-sub">{ROLE_LABEL[role] || role || 'Loading…'}</div>

      {/* Main nav */}
      <nav className="af-nav-section flex-grow-1">
        <div className="af-nav-section-label">Main</div>
        {NAV_ITEMS.filter(visible).map(item => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <span className="af-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {ADMIN_ITEMS.some(visible) && (
          <>
            <div className="af-nav-section-label" style={{ marginTop: 12 }}>Manage</div>
            {ADMIN_ITEMS.filter(visible).map(item => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <span className="af-nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}

        <div className="af-nav-section-label" style={{ marginTop: 12 }}>Account</div>
        {BOTTOM_ITEMS.filter(visible).map(item => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <span className="af-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="af-sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="af-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
