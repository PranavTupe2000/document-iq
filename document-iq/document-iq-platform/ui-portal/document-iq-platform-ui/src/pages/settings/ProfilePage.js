import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Building2, Loader, LogOut } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { getMyProfileApi, getMyOrgApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/common/ThemeToggle';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 0',
      borderBottom: '1px solid var(--color-border)'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '8px',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={16} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '1px' }}>{label}</p>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { logout, user }        = useAuth();
  const { theme }         = useTheme();
  const navigate          = useNavigate();
  const [org,     setOrg]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Use user from auth context directly — already fetched on login
  const profile = user;

  useEffect(() => {
    getMyOrgApi()
      .then(r => setOrg(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = profile?.email?.slice(0, 2).toUpperCase() || '??';
  const isAdmin  = profile?.role === 'ORG_ADMIN';

  if (loading) return (
    <AppLayout title="Profile">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <Loader size={28} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Profile">
      <div style={{ maxWidth: '560px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>My Profile</h1>
          <p style={{ fontSize: '14px' }}>Your account information and preferences.</p>
        </div>

        {/* ── Avatar Card ── */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '26px', fontWeight: 700, color: '#fff' }}>{initials}</span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '20px' }}>
                  {profile?.email?.split('@')[0] || profile?.username || 'My Account'}
                </h2>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                  background: isAdmin ? '#EDE9FE' : 'var(--color-bg)',
                  color: isAdmin ? '#6D28D9' : 'var(--color-text-secondary)',
                  border: `1px solid ${isAdmin ? '#DDD6FE' : 'var(--color-border)'}`
                }}>
                  {isAdmin ? <Shield size={11} /> : <User size={11} />}
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
              <p style={{ fontSize: '14px', margin: 0 }}>{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* ── Account Info ── */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>Account Information</h3>
          <InfoRow icon={Mail}      label="Email Address"    value={profile?.email}                          />
          <InfoRow icon={Shield}    label="Role"             value={isAdmin ? 'Organization Admin' : 'Member'} />
          <InfoRow icon={User}      label="User ID"          value={`#${profile?.id}`}                       />
          <InfoRow icon={Building2} label="Organization"     value={org?.name}                               />
        </div>

        {/* ── Preferences ── */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Preferences</h3>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500,
                color: 'var(--color-text-primary)', margin: '0 0 2px' }}>Interface Theme</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Currently: <strong>{theme === 'professional' ? 'Professional' : 'Classy'}</strong>
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0'
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500,
                color: 'var(--color-text-primary)', margin: '0 0 2px' }}>RAG Query Mode</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Hybrid retrieval with metadata filtering
              </p>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Account Actions</h3>
          {isAdmin && (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }}
              onClick={() => navigate('/settings')}
            >
              <Building2 size={15} /> Organization Settings
            </button>
          )}
          <button
            className="btn btn-danger"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}