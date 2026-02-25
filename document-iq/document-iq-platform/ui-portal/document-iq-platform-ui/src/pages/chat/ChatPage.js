import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send, MessageSquare, FolderOpen, Bot,
  User, Loader, AlertCircle, X, Sparkles, ChevronDown
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import SessionSidebar from './SessionSidebar';
import {
  listGroupsApi,
  queryGroupApi,
  createSessionApi,
  listSessionsApi,
  renameSessionApi,
  getSessionHistoryApi
} from '../../services/api';

// ── Helpers ────────────────────────────────────────────────
function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Group Selector Dropdown ────────────────────────────────
function GroupDropdown({ groups, selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: '200px' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(p => !p)}
        style={{
          width: '100%', height: '36px', padding: '0 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          background: 'var(--color-surface)',
          border: `1px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '13px', fontFamily: 'Inter, sans-serif',
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
          <FolderOpen size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.name : 'Select a group...'}
          </span>
        </div>
        <ChevronDown size={13} style={{ flexShrink: 0, color: 'var(--color-text-secondary)', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 300, overflow: 'hidden', maxHeight: '220px', overflowY: 'auto'
        }}>
          {groups.map(g => {
            const isSel = selected?.id === g.id;
            return (
              <div key={g.id} onClick={() => { onSelect(g); setOpen(false); }}
                style={{
                  padding: '9px 13px', cursor: 'pointer', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '9px',
                  background: isSel ? 'var(--color-bg)' : 'transparent',
                  color: isSel ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: isSel ? 600 : 400
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--color-bg)'; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
              >
                <FolderOpen size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Suggestion Chips ───────────────────────────────────────
const SUGGESTIONS = [
  'What is this document about?', 'Summarize the key points',
  'What are the main findings?', 'List all action items',
  'What dates are mentioned?',   'Who are the key stakeholders?',
];

function SuggestionChips({ onSelect, disabled }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 16px 12px' }}>
      {SUGGESTIONS.map(s => (
        <button key={s} onClick={() => onSelect(s)} disabled={disabled}
          style={{
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: '999px', padding: '5px 13px', fontSize: '12px',
            color: 'var(--color-text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif', opacity: disabled ? 0.5 : 1
          }}
          onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >{s}</button>
      ))}
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser  = msg.role === 'user';
  const isError = msg.isError;

  return (
    <div style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '10px', alignItems: 'flex-start', marginBottom: '18px',
      animation: 'fadeIn 200ms ease'
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser ? 'var(--color-primary)' : isError ? '#FEE2E2' : 'var(--color-bg)',
        border: isUser ? 'none' : '1px solid var(--color-border)'
      }}>
        {isUser ? <User size={14} color="#fff" />
          : isError ? <AlertCircle size={14} style={{ color: 'var(--color-error)' }} />
          : <Bot size={14} style={{ color: 'var(--color-primary)' }} />}
      </div>

      <div style={{ maxWidth: '78%' }}>
        <div style={{
          background: isUser ? 'var(--color-primary)' : isError ? '#FEF2F2' : 'var(--color-surface)',
          color: isUser ? '#fff' : isError ? 'var(--color-error)' : 'var(--color-text-primary)',
          borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
          padding: '10px 14px', fontSize: '14px', lineHeight: 1.6,
          border: isUser ? 'none' : '1px solid var(--color-border)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word'
        }}>
          {msg.isTyping
            ? <span style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '20px' }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--color-text-secondary)',
                    animation: `bounce 1.2s ease infinite`,
                    animationDelay: `${i * 0.2}s`
                  }}/>
                ))}
              </span>
            : msg.content}
        </div>
        {msg.cached && (
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '3px', display: 'block' }}>
            ⚡ Cached response
          </span>
        )}
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '3px', textAlign: isUser ? 'right' : 'left' }}>
          {formatTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────
function EmptyState({ groupSelected, sessionSelected }) {
  if (!groupSelected) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.6 }}>
      <FolderOpen size={40} style={{ color: 'var(--color-text-secondary)' }} />
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Select a group to start chatting</p>
    </div>
  );
  if (!sessionSelected) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.6 }}>
      <MessageSquare size={40} style={{ color: 'var(--color-text-secondary)' }} />
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Select a session or create a new one</p>
    </div>
  );
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.7 }}>
      <div style={{
        width: 52, height: 52, borderRadius: '14px',
        background: 'var(--color-primary)18',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Sparkles size={24} style={{ color: 'var(--color-primary)' }} />
      </div>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Ask anything about your documents.<br/>This session will remember the conversation.
      </p>
    </div>
  );
}

// ── Main ChatPage ──────────────────────────────────────────
export default function ChatPage() {
  const location   = useLocation();
  const preGroupId = location.state?.groupId ?? location.state?.group_id ?? location.state?.id;
  const preGroupName = location.state?.groupName ?? location.state?.name;
  const preGroup   = preGroupId ? { id: preGroupId, name: preGroupName } : null;

  // Group state
  const [groups,    setGroups]    = useState([]);
  const [selected,  setSelected]  = useState(preGroup);
  const [fetching,  setFetching]  = useState(true);

  // Session state
  const [sessions,         setSessions]         = useState([]);
  const [activeSession,    setActiveSession]     = useState(null);   // full session object
  const [loadingSessions,  setLoadingSessions]   = useState(false);
  const [creatingSession,  setCreatingSession]   = useState(false);

  // Chat state
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  const bottomRef  = useRef();
  const inputRef   = useRef();
  const msgIdRef   = useRef(0);

  // ── Fetch groups ────────────────────────────────────────
  useEffect(() => {
    listGroupsApi()
      .then(r => setGroups(r.data))
      .catch(() => setError('Failed to load groups.'))
      .finally(() => setFetching(false));
  }, []);

  // ── Fetch sessions when group changes ───────────────────
  useEffect(() => {
    if (!selected) { setSessions([]); setActiveSession(null); return; }
    setLoadingSessions(true);
    setActiveSession(null);
    setMessages([]);
    listSessionsApi(selected.id)
      .then(r => setSessions(r.data))
      .catch(() => setError('Failed to load sessions.'))
      .finally(() => setLoadingSessions(false));
  }, [selected]);

  // ── Scroll on new message ───────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Helpers ─────────────────────────────────────────────
  const addMessage = useCallback((role, content, extra = {}) => {
    const id = ++msgIdRef.current;
    setMessages(prev => [...prev, { id, role, content, timestamp: new Date(), ...extra }]);
    return id;
  }, []);

  const updateMessage = useCallback((id, updates) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const getApiError = useCallback((err) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    return err?.message || 'Something went wrong. Please try again.';
  }, []);

  // ── Group select ─────────────────────────────────────────
  const handleGroupSelect = (group) => {
    setSelected(group);
    setError('');
    setMessages([]);
  };

  // ── New session ──────────────────────────────────────────
  const handleNewSession = async () => {
    if (!selected) { setError('Select a group first.'); return; }
    setCreatingSession(true);
    try {
      const res = await createSessionApi(selected.id);
      const newSession = res.data;
      setSessions(prev => [newSession, ...prev]);
      setActiveSession(newSession);
      setMessages([]);
      setError('');
      inputRef.current?.focus();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setCreatingSession(false);
    }
  };

  // ── Select session ───────────────────────────────────────
  const handleSelectSession = async (session) => {
    setActiveSession(session);
    setMessages([]);
    setError('');
    setLoadingHistory(true);
    try {
      const res = await getSessionHistoryApi(selected.id, session.session_id);
      const historical = (res.data.messages || []).map((m, i) => ({
        id:        -(i + 1),   // negative IDs to avoid collisions with live messages
        role:      m.role === 'assistant' ? 'ai' : 'user',
        content:   m.content,
        timestamp: m.created_at,
        isHistory: true
      }));
      setMessages(historical);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoadingHistory(false);
      inputRef.current?.focus();
    }
  };

  // ── Rename session ───────────────────────────────────────
  const handleRenameSession = async (sessionId, title) => {
    if (!selected) return;
    try {
      await renameSessionApi(selected.id, sessionId, title);
      setSessions(prev => prev.map(s =>
        s.session_id === sessionId ? { ...s, title } : s
      ));
      if (activeSession?.session_id === sessionId) {
        setActiveSession(prev => ({ ...prev, title }));
      }
    } catch (err) {
      setError(getApiError(err));
    }
  };

  // ── Send message ─────────────────────────────────────────
  const handleSend = useCallback(async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;
    if (!selected) { setError('Select a group first.'); return; }
    if (!activeSession) { setError('Select or create a session first.'); return; }

    setInput('');
    setError('');
    addMessage('user', q);
    const aiId = addMessage('ai', '', { isTyping: true });
    setLoading(true);

    try {
      const res = await queryGroupApi(selected.id, activeSession.session_id, q);
      const { answer, cached } = res.data;
      await new Promise(r => setTimeout(r, 200));
      updateMessage(aiId, { content: answer || 'No answer returned.', isTyping: false, cached: !!cached });
    } catch (err) {
      updateMessage(aiId, { content: getApiError(err), isTyping: false, isError: true });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, selected, activeSession, addMessage, updateMessage, getApiError]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const canChat    = !!selected && !!activeSession;
  const showSuggestions = canChat && messages.length === 0;

  return (
    <AppLayout title="AI Chat">
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>AI Document Chat</h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Session-based RAG chat with memory-aware conversations.
        </p>
      </div>

      {/* ── Main container: sidebar + chat ── */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 220px)',
        minHeight: '500px',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--color-surface)'
      }}>

        {/* ── Left: Session Sidebar ── */}
        <div style={{
          width: '260px', flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--color-bg)'
        }}>
          {/* Group selector inside sidebar header */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
            {fetching ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                Loading groups...
              </div>
            ) : (
              <GroupDropdown
                groups={groups}
                selected={selected}
                onSelect={handleGroupSelect}
                disabled={loading}
              />
            )}
          </div>

          {/* Session list */}
          <SessionSidebar
            sessions={sessions}
            activeSessionId={activeSession?.session_id}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onRenameSession={handleRenameSession}
            loadingSessions={loadingSessions}
            creatingSession={creatingSession}
          />
        </div>

        {/* ── Right: Chat Window ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--color-bg)', minHeight: '48px'
          }}>
            {activeSession ? (
              <>
                <MessageSquare size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {activeSession.title || 'New Chat'}
                </span>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)', marginLeft: '4px', animation: 'pulse 2s infinite' }} />
              </>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {selected ? 'Create or select a session →' : 'Select a group to begin →'}
              </span>
            )}

            <div style={{ flex: 1 }} />

            {messages.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {Math.floor(messages.length / 2)} exchange{messages.length !== 2 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0', display: 'flex', flexDirection: 'column' }}>
            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                color: 'var(--color-error)', borderRadius: '8px',
                padding: '9px 13px', fontSize: '13px', marginBottom: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  {error}
                </div>
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                  <X size={13} />
                </button>
              </div>
            )}

            {loadingHistory ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.6
              }}>
                <Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Loading conversation history...</p>
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <EmptyState groupSelected={!!selected} sessionSelected={!!activeSession} />
                )}
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && <SuggestionChips onSelect={handleSend} disabled={loading} />}

          {/* Input area */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'flex-end',
              background: 'var(--color-bg)',
              border: `1px solid ${loading ? 'var(--color-primary)' : 'var(--color-input-border)'}`,
              borderRadius: '12px', padding: '8px 8px 8px 14px',
              boxShadow: loading ? '0 0 0 3px var(--color-focus-glow)' : 'none',
              transition: 'border-color 150ms, box-shadow 150ms'
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !selected         ? 'Select a group first...'
                  : !activeSession  ? 'Create or select a session...'
                  : 'Ask about your documents... (Enter to send)'
                }
                disabled={!canChat || loading || loadingHistory}
                rows={1}
                style={{
                  flex: 1, border: 'none', outline: 'none', resize: 'none',
                  background: 'transparent', fontSize: '14px',
                  fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)',
                  maxHeight: '120px', lineHeight: 1.5,
                  cursor: !canChat ? 'not-allowed' : 'text'
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || !canChat || loading || loadingHistory}
                style={{
                  width: 36, height: 36, borderRadius: '8px', border: 'none',
                  background: !input.trim() || !canChat || loading ? 'var(--color-border)' : 'var(--color-primary)',
                  color: '#fff', cursor: !input.trim() || !canChat || loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 150ms'
                }}
              >
                {loading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px', paddingLeft: '2px' }}>
              Shift+Enter for new line · Each session maintains its own memory
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce  { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </AppLayout>
  );
}