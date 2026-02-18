import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send, MessageSquare, FolderOpen, Bot,
  User, Loader, AlertCircle, Trash2,
  ChevronDown, X, Sparkles, Clock
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { listGroupsApi, queryGroupApi } from '../../services/api';

// ── Helpers ────────────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Group Selector Dropdown ────────────────────────────────
function GroupDropdown({ groups, selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: '220px' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(p => !p)}
        style={{
          width: '100%',
          height: '38px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'var(--color-surface)',
          border: `1px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 150ms',
          boxShadow: open ? '0 0 0 3px var(--color-focus-glow)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <FolderOpen size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.name : 'Select a group...'}
          </span>
        </div>
        <ChevronDown
          size={15}
          style={{
            flexShrink: 0,
            color: 'var(--color-text-secondary)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 150ms'
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 300,
          overflow: 'hidden',
          maxHeight: '240px',
          overflowY: 'auto'
        }}>
          {groups.map(g => {
            const isSelected = selected?.id === g.id;
            return (
              <div
                key={g.id}
                onClick={() => { onSelect(g); setOpen(false); }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: isSelected ? 'var(--color-bg)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background 100ms'
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <FolderOpen size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.name}
                </span>
                {isSelected && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--color-primary)', flexShrink: 0
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Suggested Questions ────────────────────────────────────
const SUGGESTIONS = [
  'What is this document about?',
  'Summarize the key points',
  'What are the main findings?',
  'List all action items',
  'What dates are mentioned?',
  'Who are the key stakeholders?',
];

function SuggestionChips({ onSelect, disabled }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '8px',
      padding: '0 16px 12px'
    }}>
      {SUGGESTIONS.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          disabled={disabled}
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 150ms',
            opacity: disabled ? 0.5 : 1
          }}
          onMouseEnter={e => {
            if (!disabled) {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.color = 'var(--color-primary)';
              e.currentTarget.style.background = 'var(--color-surface)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.background = 'var(--color-bg)';
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.isError;

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '10px',
      alignItems: 'flex-start',
      marginBottom: '20px',
      animation: 'fadeIn 200ms ease'
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser
          ? 'var(--color-primary)'
          : isError
          ? '#FEE2E2'
          : 'var(--color-bg)',
        border: isUser ? 'none' : '1px solid var(--color-border)'
      }}>
        {isUser
          ? <User size={16} color="#fff" />
          : isError
          ? <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />
          : <Bot size={16} style={{ color: 'var(--color-primary)' }} />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '75%', minWidth: '60px' }}>
        <div style={{
          background: isUser
            ? 'var(--color-primary)'
            : isError
            ? '#FEF2F2'
            : 'var(--color-surface)',
          color: isUser
            ? '#fff'
            : isError
            ? 'var(--color-error)'
            : 'var(--color-text-primary)',
          border: isUser
            ? 'none'
            : isError
            ? '1px solid #FECACA'
            : '1px solid var(--color-border)',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          padding: '12px 16px',
          fontSize: '14px',
          lineHeight: '1.65',
          wordBreak: 'break-word',
          transition: 'all 150ms'
        }}>
          {msg.isTyping ? (
            <TypingIndicator />
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          )}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          marginTop: '4px',
          textAlign: isUser ? 'right' : 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          justifyContent: isUser ? 'flex-end' : 'flex-start'
        }}>
          <Clock size={10} />
          {formatTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ── Typing Indicator ───────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: 'var(--color-text-secondary)',
            animation: `typingBounce 1.2s ease infinite`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </div>
  );
}

// ── Empty Chat State ───────────────────────────────────────
function EmptyChatState({ groupSelected }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center'
    }}>
      <div style={{
        width: 72, height: 72,
        borderRadius: '20px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px'
      }}>
        {groupSelected
          ? <Sparkles size={32} style={{ color: 'var(--color-primary)' }} />
          : <MessageSquare size={32} style={{ color: 'var(--color-text-secondary)' }} />
        }
      </div>

      <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>
        {groupSelected ? 'Ready to answer questions' : 'Select a group to start'}
      </h3>
      <p style={{ fontSize: '14px', maxWidth: '320px', lineHeight: '1.6' }}>
        {groupSelected
          ? 'Ask anything about the documents in this group. The AI will search across all indexed content.'
          : 'Choose a document group from the dropdown above to begin querying with AI.'
        }
      </p>

      {groupSelected && (
        <div style={{
          marginTop: '24px',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '16px 20px',
          textAlign: 'left',
          maxWidth: '340px',
          width: '100%'
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Try asking...
          </p>
          {SUGGESTIONS.slice(0, 3).map(s => (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 0',
              fontSize: '13px', color: 'var(--color-text-secondary)'
            }}>
              <ChevronDown size={12} style={{ transform: 'rotate(-90deg)', color: 'var(--color-primary)', flexShrink: 0 }} />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Chat Page ─────────────────────────────────────────
export default function ChatPage() {
  const location = useLocation();

  // Pre-select group if navigated from Groups page
  const preGroupId = location.state?.groupId ?? location.state?.group_id ?? location.state?.id;
  const preGroupName = location.state?.groupName ?? location.state?.name;
  const preGroup = preGroupId
    ? { id: preGroupId, group_id: preGroupId, name: preGroupName }
    : null;

  const [groups,      setGroups]      = useState([]);
  const [selected,    setSelected]    = useState(preGroup);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);
  const [error,       setError]       = useState('');

  const bottomRef  = useRef();
  const inputRef   = useRef();
  const messagesId = useRef(0);

  // Fetch groups
  useEffect(() => {
    listGroupsApi()
      .then(r => setGroups(r.data))
      .catch(() => setError('Failed to load groups.'))
      .finally(() => setFetching(false));
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear messages when group changes
  const handleGroupSelect = (group) => {
    setSelected(group);
    setMessages([]);
    setError('');
    inputRef.current?.focus();
  };

  const addMessage = useCallback((role, content, extra = {}) => {
    const id = ++messagesId.current;
    const msg = { id, role, content, timestamp: new Date(), ...extra };
    setMessages(prev => [...prev, msg]);
    return id;
  }, []);

  const getApiErrorMessage = useCallback((err) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === 'string') return first;
      if (first?.msg) return first.msg;
    }
    if (typeof err?.message === 'string') return err.message;
    return 'Something went wrong. Please try again.';
  }, []);

  const updateMessage = useCallback((id, updates) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const handleSend = useCallback(async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;
    if (!selected) { setError('Please select a group first.'); return; }
    const selectedGroupId = selected?.id ?? selected?.group_id;
    if (!selectedGroupId) {
      setError('Selected group is invalid. Please re-select a group.');
      return;
    }

    setInput('');
    setError('');

    // Add user message
    addMessage('user', q);

    // Add typing indicator
    const aiId = addMessage('ai', '', { isTyping: true });
    setLoading(true);

    try {
      const res = await queryGroupApi(selectedGroupId, q);
      const answer = res.data.answer || 'No answer returned.';

      // Simulate slight delay for better UX feel
      await new Promise(r => setTimeout(r, 300));
      updateMessage(aiId, { content: answer, isTyping: false });
    } catch (err) {
      updateMessage(aiId, {
        content: getApiErrorMessage(err),
        isTyping: false,
        isError: true
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, selected, addMessage, updateMessage, getApiErrorMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError('');
  };

  const showSuggestions = selected && messages.length === 0;
  const showEmpty       = messages.length === 0;

  return (
    <AppLayout title="AI Chat">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>AI Document Chat</h1>
          <p style={{ fontSize: '14px' }}>
            Ask questions across all documents in a group using RAG-powered AI.
          </p>
        </div>

        {/* ── Chat Container ── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 240px)',
          minHeight: '500px',
          overflow: 'hidden'
        }}>

          {/* ── Top Bar ── */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--color-bg)'
          }}>
            {/* Group selector */}
            {fetching ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
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

            {/* Active group badge */}
            {selected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--color-success)',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 500 }}>
                  Active
                </span>
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Message count */}
            {messages.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {Math.floor(messages.length / 2)} exchange{messages.length !== 2 ? 's' : ''}
              </span>
            )}

            {/* Clear chat */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '13px', fontFamily: 'Inter, sans-serif',
                  padding: '4px 8px', borderRadius: '6px',
                  transition: 'all 150ms'
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
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>

          {/* ── Messages Area ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 20px 0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Error Banner */}
            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: 'var(--color-error)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {error}
                </div>
                <button
                  onClick={() => setError('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Empty state */}
            {showEmpty && <EmptyChatState groupSelected={!!selected} />}

            {/* Messages */}
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            <div ref={bottomRef} />
          </div>

          {/* ── Suggestions ── */}
          {showSuggestions && (
            <SuggestionChips
              onSelect={(s) => handleSend(s)}
              disabled={loading}
            />
          )}

          {/* ── No group warning ── */}
          {!selected && !fetching && groups.length === 0 && (
            <div style={{
              padding: '10px 16px',
              background: '#FEF3C7',
              borderTop: '1px solid var(--color-border)',
              fontSize: '13px',
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              No groups found. Create a group and upload documents before chatting.
            </div>
          )}

          {/* ── Input Area ── */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)'
          }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end',
              background: 'var(--color-bg)',
              border: `1px solid ${loading ? 'var(--color-primary)' : 'var(--color-input-border)'}`,
              borderRadius: '12px',
              padding: '8px 8px 8px 16px',
              transition: 'border-color 150ms',
              boxShadow: loading ? '0 0 0 3px var(--color-focus-glow)' : 'none'
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !selected
                    ? 'Select a group first...'
                    : loading
                    ? 'AI is thinking...'
                    : 'Ask a question about your documents... (Enter to send)'
                }
                disabled={!selected || loading}
                rows={1}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--color-text-primary)',
                  resize: 'none',
                  lineHeight: '1.5',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '4px 0',
                  cursor: !selected ? 'not-allowed' : 'text'
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />

              {/* Send Button */}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || !selected || loading}
                style={{
                  width: 36, height: 36,
                  borderRadius: '8px',
                  background: input.trim() && selected && !loading
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                  border: 'none',
                  cursor: input.trim() && selected && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 150ms'
                }}
                onMouseEnter={e => {
                  if (input.trim() && selected && !loading)
                    e.currentTarget.style.background = 'var(--color-primary-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = input.trim() && selected && !loading
                    ? 'var(--color-primary)'
                    : 'var(--color-border)';
                }}
              >
                {loading
                  ? <Loader size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={16} color={input.trim() && selected ? '#fff' : 'var(--color-text-secondary)'} />
                }
              </button>
            </div>

            {/* Footer hint */}
            <p style={{
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginTop: '6px',
              paddingLeft: '4px'
            }}>
              Press <kbd style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '1px 5px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}>Enter</kbd> to send · <kbd style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '1px 5px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}>Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin         { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse        { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn       { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>
    </AppLayout>
  );
}
