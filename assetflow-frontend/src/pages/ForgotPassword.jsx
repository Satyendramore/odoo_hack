import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: 400 }}>
        <div className="card-body p-4 text-center">
          <h5 className="mb-3">Forgot Password</h5>
          <p className="text-muted">Password reset is not available in this version. Contact your administrator.</p>
          <Link to="/login" className="btn btn-primary btn-sm">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
