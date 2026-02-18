import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { registerOrgApi } from '../../services/api';

export default function SignupPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organization_name: '',
    admin_email: '',
    admin_password: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.organization_name || !form.admin_email || !form.admin_password) {
      setError('All fields are required.');
      return;
    }
    if (form.admin_password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerOrgApi(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
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

      {/* Theme Toggle */}
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
        <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Document<span style={{ color: 'var(--color-primary)' }}>-IQ</span>
        </span>
      </div>

      {/* Success State */}
      {success ? (
        <div className="card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <CheckCircle size={48} color="var(--color-success)" />
          </div>
          <h2 style={{ marginBottom: '8px' }}>Organization Registered!</h2>
          <p style={{ marginBottom: '24px', fontSize: '14px' }}>
            Your organization <strong>{form.organization_name}</strong> has been created successfully.
            You can now sign in with your admin account.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate('/login')}
          >
            Go to Sign In
          </button>
        </div>
      ) : (
        <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{ marginBottom: '6px' }}>Register your organization</h2>
          <p style={{ marginBottom: '28px', fontSize: '14px' }}>
            Create your Document-IQ workspace
          </p>

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
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input
                className="form-input"
                name="organization_name"
                placeholder="Acme Corp"
                value={form.organization_name}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                className="form-input"
                name="admin_email"
                type="email"
                placeholder="admin@company.com"
                value={form.admin_email}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  name="admin_password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.admin_password}
                  onChange={handleChange}
                  style={{ width: '100%', paddingRight: '44px' }}
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
              <small>Password must be at least 6 characters</small>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            >
              {loading ? 'Creating workspace...' : 'Create Organization'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ fontSize: '14px', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none'
            }}>
              Sign in
            </Link>
          </p>
        </div>
      )}

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        © 2025 Document-IQ. All rights reserved.
      </p>
    </div>
  );
}