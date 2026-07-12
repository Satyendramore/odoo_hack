import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-body)' }}>
      <div className="af-surface border rounded-3 shadow-sm p-4 text-center" style={{ width: 380, borderColor: 'var(--border-color)' }}>
        <h5 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Forgot Password</h5>
        <p className="text-muted small mb-4">
          Password reset is not available in this version. Contact your administrator to reset your credentials.
        </p>
        <Link to="/login">
          <button className="btn btn-primary btn-sm">Back to Login</button>
        </Link>
      </div>
    </div>
  );
}
