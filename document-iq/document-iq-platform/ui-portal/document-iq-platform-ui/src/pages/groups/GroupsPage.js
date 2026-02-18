import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Plus, Trash2, MessageSquare,
  Upload, Search, FolderPlus, X, Loader
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { listGroupsApi, createGroupApi, deleteGroupApi } from '../../services/api';

// ── Empty State ────────────────────────────────────────────
function EmptyState({ onCreateClick }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', textAlign: 'center'
    }}>
      <div style={{
        width: 72, height: 72,
        borderRadius: '16px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <FolderPlus size={32} style={{ color: 'var(--color-primary)' }} />
      </div>
      <h3 style={{ marginBottom: '8px' }}>No groups yet</h3>
      <p style={{ fontSize: '14px', maxWidth: '320px', marginBottom: '24px' }}>
        Groups help you organize your documents. Create your first group to get started.
      </p>
      <button className="btn btn-primary" onClick={onCreateClick}>
        <Plus size={16} /> Create First Group
      </button>
    </div>
  );
}

// ── Create Group Modal ─────────────────────────────────────
function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Group name is required.'); return; }
    if (name.trim().length < 2) { setError('Name must be at least 2 characters.'); return; }

    setLoading(true);
    try {
      const res = await createGroupApi(name.trim());
      onCreate(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '24px'
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px' }}>Create New Group</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FECACA',
            color: 'var(--color-error)', borderRadius: '6px',
            padding: '10px 14px', fontSize: '14px', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              className="form-input"
              placeholder="e.g. Finance Documents"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              style={{ width: '100%' }}
              autoFocus
            />
            <small>Give your group a clear, descriptive name.</small>
          </div>

          <div className="flex gap-12" style={{ marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Plus size={14} /> Create Group</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────
function DeleteModal({ group, onClose, onConfirm, loading }) {
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '24px'
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '28px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '12px',
          background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <Trash2 size={22} style={{ color: 'var(--color-error)' }} />
        </div>

        <h3 style={{ marginBottom: '8px' }}>Delete Group</h3>
        <p style={{ fontSize: '14px', marginBottom: '8px' }}>
          Are you sure you want to delete <strong>"{group.name}"</strong>?
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-error)', marginBottom: '24px' }}>
          This action cannot be undone. All documents in this group may be affected.
        </p>

        <div className="flex gap-12">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Group Card ─────────────────────────────────────────────
function GroupCard({ group, onDelete, onUpload, onChat }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${hovered ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: '8px',
        padding: '20px',
        transition: 'all 150ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: '10px',
            background: hovered ? 'var(--color-primary)' : 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 150ms',
            border: '1px solid var(--color-border)'
          }}>
            <FolderOpen
              size={20}
              style={{ color: hovered ? '#fff' : 'var(--color-primary)', transition: 'color 150ms' }}
            />
          </div>
          <div>
            <div style={{
              fontSize: '15px', fontWeight: 600,
              color: 'var(--color-text-primary)'
            }}>
              {group.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Group ID: {group.id}
            </div>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(group)}
          title="Delete group"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            padding: '6px', borderRadius: '6px',
            display: 'flex', alignItems: 'center',
            transition: 'all 150ms',
            opacity: hovered ? 1 : 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEE2E2';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Divider */}
      <div className="divider" style={{ margin: 0 }} />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onUpload(group)}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Upload size={14} /> Upload
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onChat(group)}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <MessageSquare size={14} /> Ask AI
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function GroupsPage() {
  const navigate = useNavigate();

  const [groups,       setGroups]       = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [showCreate,   setShowCreate]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading,setDeleteLoading]= useState(false);
  const [error,        setError]        = useState('');

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listGroupsApi();
      setGroups(res.data);
      setFiltered(res.data);
    } catch {
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(groups.filter(g => g.name.toLowerCase().includes(q)));
  }, [search, groups]);

  const handleCreate = (newGroup) => {
    setGroups(prev => [newGroup, ...prev]);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteGroupApi(deleteTarget.id);
      setGroups(prev => prev.filter(g => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError('Failed to delete group.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpload = (group) => {
    navigate('/upload', { state: { groupId: group.id, groupName: group.name } });
  };

  const handleChat = (group) => {
    navigate('/chat', { state: { groupId: group.id, groupName: group.name } });
  };

  return (
    <AppLayout title="Groups">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Document Groups</h1>
          <p style={{ fontSize: '14px' }}>
            Organize your documents into groups for better management and AI querying.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} /> New Group
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          color: 'var(--color-error)', borderRadius: '8px',
          padding: '12px 16px', fontSize: '14px',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {error}
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Search + Count Bar ── */}
      {groups.length > 0 && (
        <div className="flex items-center justify-between" style={{ marginBottom: '20px', gap: '16px' }}>
          <div style={{ position: 'relative', maxWidth: '320px', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: '12px',
                top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-secondary)'
              }}
            />
            <input
              className="form-input"
              placeholder="Search groups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
            />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {filtered.length} of {groups.length} groups
          </p>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px', gap: '12px', color: 'var(--color-text-secondary)'
        }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading groups...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState onCreateClick={() => setShowCreate(true)} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Search size={32} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
          <h3 style={{ marginBottom: '8px' }}>No groups match "{search}"</h3>
          <p style={{ fontSize: '14px' }}>Try a different search term.</p>
          <button
            className="btn btn-tertiary btn-sm"
            onClick={() => setSearch('')}
            style={{ marginTop: '12px' }}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filtered.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onDelete={setDeleteTarget}
              onUpload={handleUpload}
              onChat={handleChat}
            />
          ))}
        </div>
      )}

      {/* ── Spin keyframe ── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          group={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}

    </AppLayout>
  );
}