import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { loginApi } from '../../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi(email, password);
      login(res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>

      {/* Theme Toggle - top right */}
      <div style={{ position: 'fixed', top: 20, right: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
          {theme === 'professional' ? '🎨 Classy' : '💼 Professional'}
        </button>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-8" style={{ marginBottom: '32px' }}>
        <div style={{
          width: 40, height: 40,
          background: 'var(--color-primary)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <FileText size={22} color="#fff" />
        </div>
        <span style={{
          fontSize: '22px', fontWeight: 700,
          color: 'var(--color-text-primary)'
        }}>
          Document<span style={{ color: 'var(--color-primary)' }}>-IQ</span>
        </span>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <h2 style={{ marginBottom: '6px' }}>Welcome back</h2>
        <p style={{ marginBottom: '28px', fontSize: '14px' }}>
          Sign in to your organization account
        </p>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            color: 'var(--color-error)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%' }}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: '12px',
                  top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center'
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider" />

        <p style={{ fontSize: '14px', textAlign: 'center' }}>
          New organization?{' '}
          <Link to="/signup" style={{
            color: 'var(--color-primary)',
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            Register here
          </Link>
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        © 2025 Document-IQ. All rights reserved.
      </p>
    </div>
  );
}