import React, { useState } from 'react';
import { Plus, MessageSquare, Pencil, Check, X, Loader } from 'lucide-react';

export default function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  loadingSessions,
  creatingSession,
}) {
  const [editingId, setEditingId]   = useState(null);
  const [editTitle, setEditTitle]   = useState('');

  const startEdit = (session, e) => {
    e.stopPropagation();
    setEditingId(session.session_id);
    setEditTitle(session.title || 'New Chat');
  };

  const confirmEdit = (session, e) => {
    e.stopPropagation();
    if (editTitle.trim()) onRenameSession(session.session_id, editTitle.trim());
    setEditingId(null);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div style={{
      width: '260px',
      flexShrink: 0,
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sessions
        </span>
        <button
          onClick={onNewSession}
          disabled={creatingSession}
          title="New session"
          style={{
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: creatingSession ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
            color: '#fff', fontSize: '12px', fontFamily: 'Inter, sans-serif',
            opacity: creatingSession ? 0.7 : 1
          }}
        >
          {creatingSession
            ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
            : <Plus size={12} />}
          New
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loadingSessions && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div>Loading sessions...</div>
          </div>
        )}

        {!loadingSessions && sessions.length === 0 && (
          <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            No sessions yet. Click <strong>New</strong> to start chatting.
          </div>
        )}

        {sessions.map(session => {
          const isActive = session.session_id === activeSessionId;
          const isEditing = editingId === session.session_id;

          return (
            <div
              key={session.session_id}
              onClick={() => !isEditing && onSelectSession(session)}
              style={{
                padding: '9px 12px',
                margin: '2px 6px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isActive ? 'var(--color-primary)18' : 'transparent',
                border: isActive ? '1px solid var(--color-primary)30' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 120ms'
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <MessageSquare
                size={14}
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)', flexShrink: 0 }}
              />

              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmEdit(session, e);
                      if (e.key === 'Escape') cancelEdit(e);
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1, fontSize: '13px', border: '1px solid var(--color-primary)',
                      borderRadius: '4px', padding: '2px 6px',
                      background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                      fontFamily: 'Inter, sans-serif', outline: 'none'
                    }}
                  />
                  <button onClick={e => confirmEdit(session, e)} style={iconBtnStyle}>
                    <Check size={12} style={{ color: 'var(--color-success)' }} />
                  </button>
                  <button onClick={cancelEdit} style={iconBtnStyle}>
                    <X size={12} style={{ color: 'var(--color-error)' }} />
                  </button>
                </>
              ) : (
                <>
                  <span style={{
                    flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    fontWeight: isActive ? 600 : 400
                  }}>
                    {session.title || 'New Chat'}
                  </span>
                  <button
                    onClick={e => startEdit(session, e)}
                    style={{ ...iconBtnStyle, opacity: 0, }}
                    className="session-edit-btn"
                  >
                    <Pencil size={12} style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        div:hover .session-edit-btn { opacity: 1 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '2px', display: 'flex', alignItems: 'center',
  borderRadius: '4px', flexShrink: 0
};