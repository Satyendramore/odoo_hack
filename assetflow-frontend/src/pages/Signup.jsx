import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email.';
    if (!form.password) errors.password = 'Password is required.';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
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
      await api.post('/auth/signup', { name: form.name, email: form.email, password: form.password });
      sessionStorage.setItem('signupSuccess', 'Account created successfully. Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9', borderRadius: 8, padding: '10px 14px', fontSize: 14,
    width: '100%',
  };
  const labelStyle = { fontSize: 12.5, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 6 };

  return (
    <div className="af-auth-bg">
      <div className="af-auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 14, boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
          }}>⚡</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: -0.5 }}>Create account</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Join your team on AssetFlow</div>
        </div>

        {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {[
            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Jane Smith' },
            { label: 'Email address', name: 'email', type: 'email', placeholder: 'you@company.com' },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{label}</label>
              <input
                type={type}
                name={name}
                className={fieldErrors[name] ? 'is-invalid' : ''}
                style={inputStyle}
                placeholder={placeholder}
                value={form[name]}
                onChange={handleChange}
              />
              {fieldErrors[name] && <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>{fieldErrors[name]}</div>}
            </div>
          ))}

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                className={fieldErrors.password ? 'is-invalid' : ''}
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, padding: 0,
              }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password && <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>{fieldErrors.password}</div>}
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontWeight: 600, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="spinner-border spinner-border-sm" /> Creating account…
            </span> : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Already have an account? </span>
          <Link to="/login" style={{ fontSize: 13, color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
