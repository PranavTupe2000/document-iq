import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Trash2, Edit2, X,
  Search, Shield, User, Loader,
  AlertCircle, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import {
  listUsersApi, registerUserApi,
  updateUserApi, deleteUserApi
} from '../../services/api';

// ── Role Badge ─────────────────────────────────────────────
function RoleBadge({ role }) {
  const isAdmin = role === 'ORG_ADMIN';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      background: isAdmin ? '#EDE9FE' : 'var(--color-bg)',
      color: isAdmin ? '#6D28D9' : 'var(--color-text-secondary)',
      border: `1px solid ${isAdmin ? '#DDD6FE' : 'var(--color-border)'}`
    }}>
      {isAdmin ? <Shield size={11} /> : <User size={11} />}
      {isAdmin ? 'Admin' : 'Member'}
    </span>
  );
}

// ── Toast Notification ─────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: 'var(--color-success)', icon: <CheckCircle size={15} /> },
    error:   { bg: '#FEF2F2', border: '#FECACA', color: 'var(--color-error)',   icon: <AlertCircle size={15} /> },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, borderRadius: '10px',
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '14px', fontWeight: 500,
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      zIndex: 9999,
      animation: 'slideUp 200ms ease',
      maxWidth: '360px'
    }}>
      {c.icon}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, padding: '2px' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Add User Modal ─────────────────────────────────────────
function AddUserModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ email: '', password: '', role: 'USER' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('All fields are required.'); return; }
    if (form.password.length < 6)      { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const res = await registerUserApi(form);
      onAdd(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '24px'
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Plus size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '17px' }}>Add New User</h3>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', padding: '4px'
          }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FECACA',
            color: 'var(--color-error)', borderRadius: '6px',
            padding: '10px 14px', fontSize: '14px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              name="email" type="email"
              placeholder="user@company.com"
              value={form.email}
              onChange={handleChange}
              style={{ width: '100%' }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                style={{ width: '100%', paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{
                position: 'absolute', right: '12px',
                top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center'
              }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { value: 'USER',      label: 'Member',  icon: User,   desc: 'Can upload & query' },
                { value: 'ORG_ADMIN', label: 'Admin',   icon: Shield, desc: 'Full access'         },
              ].map(({ value, label, icon: Icon, desc }) => {
                const active = form.role === value;
                return (
                  <div
                    key={value}
                    onClick={() => setForm(p => ({ ...p, role: value }))}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: active ? 'var(--color-focus-glow)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      textAlign: 'center'
                    }}
                  >
                    <Icon size={20} style={{
                      color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      marginBottom: '6px'
                    }} />
                    <div style={{ fontSize: '13px', fontWeight: 600,
                      color: active ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-12" style={{ marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary"
              onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary"
              disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading
                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
                : <><Plus size={14} /> Add User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit User Modal ────────────────────────────────────────
function EditUserModal({ user, onClose, onUpdate }) {
  const [form, setForm] = useState({ email: user.email, password: '', role: user.role });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    try {
      const params = {};
      if (form.email    !== user.email) params.email    = form.email;
      if (form.password)                params.password = form.password;
      await updateUserApi(user.id, params);
      onUpdate({ ...user, ...params });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '24px'
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Edit2 size={17} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px' }}>Edit User</h3>
              <p style={{ fontSize: '12px', margin: 0 }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', padding: '4px'
          }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FECACA',
            color: 'var(--color-error)', borderRadius: '6px',
            padding: '10px 14px', fontSize: '14px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(optional)</span></label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Leave blank to keep current"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ width: '100%', paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{
                position: 'absolute', right: '12px',
                top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center'
              }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px',
              background: 'var(--color-bg)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)'
            }}>
              <RoleBadge role={user.role} />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Role cannot be changed after creation
              </span>
            </div>
          </div>

          <div className="flex gap-12" style={{ marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary"
              onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary"
              disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading
                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete User Modal ──────────────────────────────────────
function DeleteUserModal({ user, onClose, onConfirm, loading }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '24px'
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '28px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '12px', background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
        }}>
          <Trash2 size={22} style={{ color: 'var(--color-error)' }} />
        </div>
        <h3 style={{ marginBottom: '8px' }}>Remove User</h3>
        <p style={{ fontSize: '14px', marginBottom: '6px' }}>
          Are you sure you want to remove <strong>{user.email}</strong>?
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-error)', marginBottom: '24px' }}>
          This action cannot be undone.
        </p>
        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={onClose}
            disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}
            disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? 'Removing...' : 'Remove User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User Row ───────────────────────────────────────────────
function UserRow({ user, currentUserId, onEdit, onDelete, isLast }) {
  const [hovered, setHovered] = useState(false);
  const isSelf = user.id === currentUserId;
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        background: hovered ? 'var(--color-bg)' : 'transparent',
        transition: 'background 150ms'
      }}
    >
      {/* User */}
      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {initials}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {user.email}
              {isSelf && (
                <span style={{
                  marginLeft: '8px', fontSize: '11px',
                  color: 'var(--color-primary)', fontWeight: 600,
                  background: 'var(--color-focus-glow)',
                  padding: '1px 6px', borderRadius: '999px'
                }}>
                  You
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              ID: {user.id}
            </div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td style={{ padding: '14px 20px' }}>
        <RoleBadge role={user.role} />
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 20px' }}>
        <div style={{
          display: 'flex', gap: '8px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 150ms'
        }}>
          <button
            onClick={() => onEdit(user)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Edit2 size={13} /> Edit
          </button>
          {!isSelf && (
            <button
              onClick={() => onDelete(user)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 14px', borderRadius: '999px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-error)',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'all 150ms'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FEE2E2';
                e.currentTarget.style.borderColor = '#FECACA';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function UsersPage() {
  const [users,         setUsers]         = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [roleFilter,    setRoleFilter]    = useState('ALL');
  const [showAdd,       setShowAdd]       = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast,         setToast]         = useState(null);
  const [myProfile,     setMyProfile]     = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        listUsersApi(),
        import('../../services/api').then(m => m.getMyProfileApi())
      ]);
      setUsers(uRes.data);
      setMyProfile(pRes.data);
    } catch {
      showToast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Filter
  useEffect(() => {
    let list = [...users];
    if (search)           list = list.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
    if (roleFilter !== 'ALL') list = list.filter(u => u.role === roleFilter);
    setFiltered(list);
  }, [users, search, roleFilter]);

  const handleAdd = (user) => {
    setUsers(prev => [...prev, user]);
    showToast(`${user.email} added successfully.`);
  };

  const handleUpdate = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    showToast('User updated successfully.');
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteUserApi(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showToast(`${deleteTarget.email} removed.`);
      setDeleteTarget(null);
    } catch {
      showToast('Failed to remove user.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const adminCount  = users.filter(u => u.role === 'ORG_ADMIN').length;
  const memberCount = users.filter(u => u.role === 'USER').length;

  return (
    <AppLayout title="User Management">

      {/* ── Header ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>User Management</h1>
          <p style={{ fontSize: '14px' }}>
            Manage organization members and their access levels.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* ── Stat Row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px', marginBottom: '24px'
      }}>
        {[
          { label: 'Total Members', value: users.length, icon: Users,  color: 'var(--color-primary)' },
          { label: 'Admins',        value: adminCount,   icon: Shield, color: '#6D28D9'              },
          { label: 'Members',       value: memberCount,  icon: User,   color: 'var(--color-success)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{
            display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '20px',
        flexWrap: 'wrap', alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={15} style={{
            position: 'absolute', left: '12px',
            top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-secondary)'
          }} />
          <input
            className="form-input"
            placeholder="Search by email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>

        {/* Role Filter Tabs */}
        <div style={{
          display: 'flex', gap: '4px',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px', padding: '4px'
        }}>
          {[
            { key: 'ALL',      label: 'All'     },
            { key: 'ORG_ADMIN', label: 'Admins' },
            { key: 'USER',     label: 'Members' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              style={{
                padding: '5px 14px', borderRadius: '6px',
                border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: roleFilter === f.key ? 600 : 400,
                background: roleFilter === f.key ? 'var(--color-surface)' : 'transparent',
                color: roleFilter === f.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: roleFilter === f.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms', fontFamily: 'Inter, sans-serif'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
          {filtered.length} of {users.length} users
        </p>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '60px', gap: '12px', color: 'var(--color-text-secondary)' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px' }}>Loading users...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Users size={36} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
            <h3 style={{ marginBottom: '8px' }}>No users found</h3>
            <p style={{ fontSize: '14px' }}>
              {search || roleFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Add your first user to get started.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                {['User', 'Role', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 20px', textAlign: 'left',
                    fontSize: '12px', fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUserId={myProfile?.id}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                  isLast={i === filtered.length - 1}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd      && <AddUserModal    onClose={() => setShowAdd(false)}      onAdd={handleAdd}         />}
      {editTarget   && <EditUserModal   onClose={() => setEditTarget(null)}    user={editTarget} onUpdate={handleUpdate} />}
      {deleteTarget && <DeleteUserModal onClose={() => setDeleteTarget(null)}  user={deleteTarget} onConfirm={handleDeleteConfirm} loading={deleteLoading} />}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppLayout>
  );
}