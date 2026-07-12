import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();

  // Read success message passed from signup redirect
  React.useEffect(() => {
    const msg = sessionStorage.getItem('signupSuccess');
    if (msg) {
      setSuccessMsg(msg);
      sessionStorage.removeItem('signupSuccess');
    }
  }, []);

  function validate() {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
    if (!password) errors.password = 'Password is required.';
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      if (!token || !user) {
        setError('Unexpected server response. Please try again.');
        return;
      }
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setError(err.response?.data?.message || 'Invalid credentials.');
      } else {
        setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: 400 }}>
        <div className="card-body p-4">
          <h4 className="card-title mb-4 text-primary fw-bold">⚡ AssetFlow — Sign In</h4>

          {successMsg && (
            <div className="alert alert-success alert-dismissible" role="alert">
              {successMsg}
              <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} />
            </div>
          )}

          {error && (
            <div className="alert alert-danger alert-dismissible" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
            </div>

            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-3 text-center small">
            Don't have an account?{' '}
            <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
