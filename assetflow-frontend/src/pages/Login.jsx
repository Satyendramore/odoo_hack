import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const msg = sessionStorage.getItem('signupSuccess');
    if (msg) { setSuccessMsg(msg); sessionStorage.removeItem('signupSuccess'); }
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
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { token, userId, name, email: userEmail, role } = res.data;
      if (!token) { setError('Unexpected server response.'); return; }
      login(token, { userId, name, email: userEmail, role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.status === 401
        ? (err.response?.data?.message || 'Invalid credentials.')
        : (err.response?.data?.message || err.message || 'Login failed.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="af-auth-bg">
      <div className="af-auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 16,
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}>⚡</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: -0.5 }}>
            AssetFlow
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Sign in to your workspace
          </div>
        </div>

        {successMsg && (
          <div className="alert alert-success py-2 mb-3" style={{ fontSize: 13 }}>
            {successMsg}
          </div>
        )}
        {error && (
          <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9', borderRadius: 8, padding: '10px 14px', fontSize: 14,
              }}
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
            {fieldErrors.email && <div className="invalid-feedback" style={{ fontSize: 12 }}>{fieldErrors.email}</div>}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9', borderRadius: 8, padding: '10px 40px 10px 14px', fontSize: 14,
                }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                  fontSize: 14, padding: 0,
                }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password && <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>{fieldErrors.password}</div>}
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <Link to="/forgot-password" style={{ fontSize: 12.5, color: '#6366f1', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: 8, border: 'none',
              background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner-border spinner-border-sm" /> Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 24, paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Don't have an account? </span>
          <Link to="/signup" style={{ fontSize: 13, color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
