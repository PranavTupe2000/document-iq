import React, { useState, useEffect } from 'react';
import {
  Building2, Trash2, Save, AlertCircle,
  CheckCircle, Loader, Shield, X
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { getMyOrgApi, updateMyOrgApi, deleteMyOrgApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const isSuccess = type === 'success';
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      background: isSuccess ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${isSuccess ? '#BBF7D0' : '#FECACA'}`,
      color: isSuccess ? 'var(--color-success)' : 'var(--color-error)',
      borderRadius: '10px', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '14px', fontWeight: 500,
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 9999,
      animation: 'slideUp 200ms ease', maxWidth: '360px'
    }}>
      {isSuccess ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
        color: 'inherit', padding: '2px' }}><X size={14} /></button>
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px',
          background: 'var(--color-bg)', border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={18} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>{title}</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      <div className="divider" style={{ marginTop: 0 }} />
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { logout }   = useAuth();
  const navigate     = useNavigate();

  const [org,         setOrg]         = useState(null);
  const [orgName,     setOrgName]     = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [toast,       setToast]       = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    getMyOrgApi()
      .then(r => { setOrg(r.data); setOrgName(r.data.name); })
      .catch(() => showToast('Failed to load organization.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) { showToast('Organization name cannot be empty.', 'error'); return; }
    setSaving(true);
    try {
      await updateMyOrgApi(orgName.trim());
      setOrg(p => ({ ...p, name: orgName.trim() }));
      showToast('Organization name updated successfully.');
    } catch {
      showToast('Failed to update organization name.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== org?.name) {
      showToast('Organization name does not match.', 'error'); return;
    }
    setDeleting(true);
    try {
      await deleteMyOrgApi();
      logout();
      navigate('/login');
    } catch {
      showToast('Failed to delete organization.', 'error');
      setDeleting(false);
    }
  };

  if (loading) return (
    <AppLayout title="Settings">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <Loader size={28} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Settings">
      <div style={{ maxWidth: '640px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Organization Settings</h1>
          <p style={{ fontSize: '14px' }}>Manage your organization configuration and preferences.</p>
        </div>

        {/* ── Org Info ── */}
        <SectionCard title="Organization Details" subtitle="Update your organization name" icon={Building2}>
          <form onSubmit={handleSave} style={{ marginTop: '16px' }}>
            <div style={{
              display: 'flex', gap: '8px',
              padding: '12px 16px',
              background: 'var(--color-bg)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Organization ID:</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>#{org?.id}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input
                className="form-input"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="Enter organization name"
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || orgName.trim() === org?.name}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {saving
                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                : <><Save size={14} /> Save Changes</>}
            </button>
          </form>
        </SectionCard>

        {/* ── Security Info ── */}
        <SectionCard title="Security & Access" subtitle="Organization security overview" icon={Shield}>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'Authentication',       value: 'JWT Bearer Token'           },
              { label: 'Data Isolation',        value: 'Organization-level strict'  },
              { label: 'Access Control',        value: 'Role-based (RBAC)'          },
              { label: 'Delete Policy',         value: 'Hard delete'                },
              { label: 'Multi-tenant',          value: 'Enabled'                    },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Danger Zone ── */}
        <div style={{
          border: '1px solid #FECACA',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#FEF2F2', padding: '16px 20px',
            borderBottom: '1px solid #FECACA',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <AlertCircle size={18} style={{ color: 'var(--color-error)' }} />
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--color-error)', marginBottom: '2px' }}>Danger Zone</h3>
              <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>
                Irreversible and destructive actions
              </p>
            </div>
          </div>

          <div style={{ padding: '20px', background: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                  Delete Organization
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Permanently delete this organization and all its data
                </div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={14} /> Delete Organization
              </button>
            </div>
          </div>
        </div>

        {/* ── Delete Confirm Modal ── */}
        {showConfirm && (
          <div
            onClick={e => e.target === e.currentTarget && setShowConfirm(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '24px'
            }}
          >
            <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px', background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <Trash2 size={22} style={{ color: 'var(--color-error)' }} />
              </div>
              <h3 style={{ marginBottom: '8px' }}>Delete Organization?</h3>
              <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                This will permanently delete <strong>{org?.name}</strong> and all associated users, groups, and documents. This action cannot be undone.
              </p>
              <div className="form-group">
                <label className="form-label">
                  Type <strong>{org?.name}</strong> to confirm
                </label>
                <input
                  className="form-input"
                  placeholder={org?.name}
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>
              <div className="flex gap-12" style={{ marginTop: '8px' }}>
                <button className="btn btn-secondary" onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                  style={{ flex: 1, justifyContent: 'center' }} disabled={deleting}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={confirmText !== org?.name || deleting}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppLayout>
  );
}