import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../ThemeContext.jsx';

const ROLE_LABEL = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'Asset Manager',
  DEPARTMENT_HEAD: 'Department Head',
  EMPLOYEE: 'Employee',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar af-topbar border-bottom px-4 py-2">
      <span className="navbar-brand fw-semibold text-primary mb-0 h6">
        AssetFlow
      </span>
      <div className="d-flex align-items-center gap-3 ms-auto">
        {user && (
          <span className="text-muted small">
            <strong>{user.name}</strong>
            <span className="badge bg-secondary ms-2">{ROLE_LABEL[user.role] || user.role}</span>
          </span>
        )}

        {/* Dark / Light toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
