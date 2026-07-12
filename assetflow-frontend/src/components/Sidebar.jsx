import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const ROLE_LABEL = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'Asset Manager',
  DEPARTMENT_HEAD: 'Department Head',
  EMPLOYEE: 'Employee',
};

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  const managerRoles = ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'];

  const linkClass = ({ isActive }) =>
    'nav-link px-3 py-2 mb-1 af-nav-link ' + (isActive ? 'af-nav-active' : '');

  return (
    <div
      className="d-flex flex-column af-sidebar border-end"
      style={{ width: 220, minHeight: '100vh', paddingTop: 16 }}
    >
      {/* Brand */}
      <div className="px-3 mb-4">
        <span className="fw-bold fs-5 text-primary">⚡ AssetFlow</span>
        <div className="text-muted small mt-1">{ROLE_LABEL[role] || role}</div>
      </div>

      <nav className="nav flex-column px-2">
        {/* All roles */}
        <NavLink to="/dashboard" className={linkClass}>
          🏠 Dashboard
        </NavLink>

        {/* Manager roles */}
        {managerRoles.includes(role) && (
          <NavLink to="/assets" className={linkClass}>
            📦 Assets
          </NavLink>
        )}

        {managerRoles.includes(role) && (
          <NavLink to="/allocations" className={linkClass}>
            🔁 Allocations
          </NavLink>
        )}

        {/* All roles */}
        <NavLink to="/bookings" className={linkClass}>
          📅 Bookings
        </NavLink>

        <NavLink to="/maintenance" className={linkClass}>
          🔧 Maintenance
        </NavLink>

        {/* Admin only */}
        {role === 'ADMIN' && (
          <NavLink to="/org-setup" className={linkClass}>
            🏢 Org Setup
          </NavLink>
        )}

        {/* Admin + Asset Manager */}
        {['ADMIN', 'ASSET_MANAGER'].includes(role) && (
          <NavLink to="/reports" className={linkClass}>
            📊 Reports
          </NavLink>
        )}

        {/* All roles */}
        <NavLink to="/notifications" className={linkClass}>
          🔔 Notifications
        </NavLink>
      </nav>
    </div>
  );
}
