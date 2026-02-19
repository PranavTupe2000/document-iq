import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, FolderOpen, Trash2, Download,
  Eye, Search, Loader, AlertCircle, X,
  ChevronDown, CheckCircle, Clock, RefreshCw,
  ArrowRight, Filter
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import {
  listGroupsApi, getDocsByGroupApi,
  deleteDocumentApi, downloadDocumentApi,
  getDocumentApi
} from '../../services/api';

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    completed:  { cls: 'badge-success', label: 'Completed', icon: <CheckCircle size={11} /> },
    processing: { cls: 'badge-warning', label: 'Processing', icon: <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> },
    failed:     { cls: 'badge-error',   label: 'Failed',     icon: <AlertCircle size={11} /> },
    accepted:   { cls: 'badge-info',    label: 'Queued',     icon: <Clock size={11} /> },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status || 'Unknown', icon: null };
  return (
    <span className={`badge ${s.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {s.icon}{s.label}
    </span>
  );
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const ok = type === 'success';
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      background: ok ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${ok ? '#BBF7D0' : '#FECACA'}`,
      color: ok ? 'var(--color-success)' : 'var(--color-error)',
      borderRadius: '10px', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '14px', fontWeight: 500,
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      zIndex: 9999, animation: 'slideUp 200ms ease', maxWidth: '360px'
    }}>
      {ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────
function DeleteModal({ doc, onClose, onConfirm, loading }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '28px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '12px', background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
        }}>
          <Trash2 size={22} style={{ color: 'var(--color-error)' }} />
        </div>
        <h3 style={{ marginBottom: '8px' }}>Delete Document</h3>
        <p style={{ fontSize: '14px', marginBottom: '6px' }}>
          Are you sure you want to delete <strong>"{doc.file_name || doc.name}"</strong>?
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
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Document Preview Modal ─────────────────────────────────
function PreviewModal({ doc, onClose }) {
  const navigate = useNavigate();

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '560px', padding: '0', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--color-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <FileText size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {doc.file_name || doc.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Document #{doc.id}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', padding: '4px', flexShrink: 0
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Details Grid */}
        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '12px', marginBottom: '20px'
          }}>
            {[
              { label: 'Document ID',  value: `#${doc.id}`                                          },
              { label: 'Status',       value: <StatusBadge status={doc.overall_status || doc.status} /> },
              { label: 'Group',        value: doc.group_name || `Group #${doc.group_id}`             },
              {
                label: 'Uploaded',
                value: (() => {
                  const d = doc.created_at || doc.uploaded_at || doc.timestamp;
                  return d ? new Date(d).toLocaleString() : 'Not available';
                })()
              },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px', padding: '12px 14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Processing Pipeline */}
          <div style={{
            background: 'var(--color-bg)', borderRadius: '8px',
            border: '1px solid var(--color-border)', padding: '14px 16px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Pipeline Stages
            </p>
            {['Ingestion', 'OCR', 'Layout', 'Classification', 'RAG'].map((stage, i) => {
              const docStatus = doc.overall_status || doc.status;
              const done = docStatus === 'completed';
              const isProcessing = docStatus === 'processing' || docStatus === 'accepted';
              return (
                <div key={stage} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none'
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{stage}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: done
                        ? 'var(--color-success)'
                        : isProcessing
                        ? 'var(--color-warning)'
                        : 'var(--color-border)',
                      animation: isProcessing && i === 0 ? 'pulse 1.5s infinite' : 'none'
                    }} />
                    <span style={{
                      fontSize: '11px', fontWeight: 500,
                      color: done
                        ? 'var(--color-success)'
                        : isProcessing
                        ? 'var(--color-warning)'
                        : 'var(--color-text-secondary)'
                    }}>
                      {done ? 'Done' : isProcessing ? 'Running' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {(doc.overall_status === 'completed' || doc.status === 'completed') && (
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { onClose(); navigate(`/documents/${doc.id}/result`); }}
              >
                <Eye size={15} /> View Results
              </button>
            )}
            {(doc.overall_status === 'processing' || doc.status === 'processing') && (
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { onClose(); navigate(`/documents/${doc.id}/status`); }}
              >
                <ArrowRight size={15} /> Track Status
              </button>
            )}
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'center', minWidth: '44px' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Document Card ──────────────────────────────────────────
function DocumentCard({ doc, onDelete, onPreview, onDownload }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    await onDownload(doc);
    setDownloading(false);
  };

  const status = doc.overall_status || doc.status;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${hovered ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: '10px',
        padding: '18px',
        transition: 'all 150ms ease',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {/* Top Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
            background: hovered ? 'var(--color-primary)' : 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 150ms'
          }}>
            <FileText size={19} style={{
              color: hovered ? '#fff' : 'var(--color-primary)',
              transition: 'color 150ms'
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '180px'
            }} title={doc.file_name || doc.name}>
              {doc.file_name || doc.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              #{doc.id} · {doc.group_name || `Group #${doc.group_id}`}
            </div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={12} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {doc.created_at
            ? new Date(doc.created_at).toLocaleString()
            : doc.uploaded_at
            ? new Date(doc.uploaded_at).toLocaleString()
            : doc.timestamp
            ? new Date(doc.timestamp).toLocaleString()
            : 'Just now'}
        </span>
      </div>

      <div className="divider" style={{ margin: 0 }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {/* Preview */}
        <button
          onClick={() => onPreview(doc)}
          className="btn btn-tertiary btn-sm"
          style={{ flex: 1, justifyContent: 'center', gap: '5px' }}
          title="Preview document details"
        >
          <Eye size={13} /> Preview
        </button>

        {/* View Results or Track */}
        {status === 'completed' && (
          <button
            onClick={() => navigate(`/documents/${doc.id}/result`)}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: 'center', gap: '5px' }}
            title="View AI analysis results"
          >
            <ArrowRight size={13} /> Results
          </button>
        )}
        {status === 'processing' && (
          <button
            onClick={() => navigate(`/documents/${doc.id}/status`)}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: 'center', gap: '5px' }}
            title="Track processing status"
          >
            <RefreshCw size={13} /> Status
          </button>
        )}

        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          title="Download document"
          style={{
            width: 32, height: 32,
            borderRadius: '999px',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            cursor: downloading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            transition: 'all 150ms', flexShrink: 0
          }}
          onMouseEnter={e => {
            if (!downloading) {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          {downloading
            ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <Download size={13} />
          }
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(doc)}
          title="Delete document"
          style={{
            width: 32, height: 32,
            borderRadius: '999px',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            transition: 'all 150ms', flexShrink: 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEE2E2';
            e.currentTarget.style.borderColor = '#FECACA';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Group Tab Bar ──────────────────────────────────────────
function GroupTabs({ groups, activeId, onChange, counts }) {
  return (
    <div style={{
      display: 'flex', gap: '4px',
      overflowX: 'auto', paddingBottom: '4px',
      scrollbarWidth: 'none'
    }}>
      <button
        onClick={() => onChange(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', borderRadius: '999px',
          border: '1px solid',
          borderColor: activeId === null ? 'var(--color-primary)' : 'var(--color-border)',
          background: activeId === null ? 'var(--color-primary)' : 'transparent',
          color: activeId === null ? '#fff' : 'var(--color-text-secondary)',
          fontWeight: activeId === null ? 600 : 400,
          fontSize: '13px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 150ms', whiteSpace: 'nowrap', flexShrink: 0
        }}
      >
        All Groups
        <span style={{
          background: activeId === null ? 'rgba(255,255,255,0.25)' : 'var(--color-bg)',
          color: activeId === null ? '#fff' : 'var(--color-text-secondary)',
          borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700
        }}>
          {counts.total}
        </span>
      </button>

      {groups.map(g => {
        const active = activeId === g.id;
        const count  = counts[g.id] || 0;
        return (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '999px',
              border: '1px solid',
              borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
              background: active ? 'var(--color-primary)' : 'transparent',
              color: active ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: active ? 600 : 400,
              fontSize: '13px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 150ms', whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            <FolderOpen size={13} />
            {g.name}
            {count > 0 && (
              <span style={{
                background: active ? 'rgba(255,255,255,0.25)' : 'var(--color-bg)',
                color: active ? '#fff' : 'var(--color-text-secondary)',
                borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function DocumentsPage() {
  const navigate = useNavigate();

  const [groups,        setGroups]        = useState([]);
  const [allDocs,       setAllDocs]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeGroup,   setActiveGroup]   = useState(null);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('ALL');
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewDoc,    setPreviewDoc]    = useState(null);
  const [toast,         setToast]         = useState(null);
  const [viewMode,      setViewMode]      = useState('grid'); // 'grid' | 'list'

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const gRes = await listGroupsApi();
      setGroups(gRes.data);
      const all = await Promise.all(
        gRes.data.map(g =>
          getDocsByGroupApi(g.id)
            .then(r => r.data.map(d => ({ ...d, group_name: g.name })))
            .catch(() => [])
        )
      );
      setAllDocs(all.flat().sort((a, b) => b.id - a.id));
    } catch {
      showToast('Failed to load documents.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered docs ──────────────────────────────────────
  const filtered = allDocs.filter(doc => {
    const matchGroup  = activeGroup === null || doc.group_id === activeGroup;
    const matchSearch = !search || (doc.file_name || doc.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (doc.overall_status || doc.status) === statusFilter;
    return matchGroup && matchSearch && matchStatus;
  });

  // ── Count per group for tab badges ────────────────────
  const counts = {
    total: allDocs.length,
    ...Object.fromEntries(groups.map(g => [g.id, allDocs.filter(d => d.group_id === g.id).length]))
  };

  // ── Download handler ───────────────────────────────────
  const handleDownload = async (doc) => {
    try {
      const res = await downloadDocumentApi(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = doc.file_name || doc.name || `document-${doc.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(`${doc.file_name || 'Document'} downloaded.`);
    } catch {
      showToast('Download failed. Please try again.', 'error');
    }
  };

  // ── Delete handler ─────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteDocumentApi(deleteTarget.id);
      setAllDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
      showToast(`"${deleteTarget.file_name || deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete document.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const completedCount  = allDocs.filter(d => (d.overall_status || d.status) === 'completed').length;
  const processingCount = allDocs.filter(d => (d.overall_status || d.status) === 'processing').length;
  const failedCount     = allDocs.filter(d => (d.overall_status || d.status) === 'failed').length;

  return (
    <AppLayout title="Documents">

      {/* ── Header ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Documents</h1>
          <p style={{ fontSize: '14px' }}>
            Browse, preview, download and manage all your processed documents.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchAll} style={{ gap: '6px' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            + Upload Document
          </button>
        </div>
      </div>

      {/* ── Stat Row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '14px', marginBottom: '24px'
      }}>
        {[
          { label: 'Total',      value: allDocs.length,  color: 'var(--color-primary)', icon: FileText    },
          { label: 'Completed',  value: completedCount,  color: 'var(--color-success)', icon: CheckCircle },
          { label: 'Processing', value: processingCount, color: 'var(--color-warning)', icon: Loader      },
          { label: 'Failed',     value: failedCount,     color: 'var(--color-error)',   icon: AlertCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card" style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '1px' }}>{label}</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Group Tabs ── */}
      <div style={{ marginBottom: '20px' }}>
        <GroupTabs
          groups={groups}
          activeId={activeGroup}
          onChange={setActiveGroup}
          counts={counts}
        />
      </div>

      {/* ── Filters Row ── */}
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
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{
          display: 'flex', gap: '4px',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px', padding: '4px'
        }}>
          {['ALL', 'completed', 'processing', 'failed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 12px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: statusFilter === s ? 600 : 400,
                background: statusFilter === s ? 'var(--color-surface)' : 'transparent',
                color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: statusFilter === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize'
              }}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex', gap: '2px',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px', padding: '4px', marginLeft: 'auto'
        }}>
          {[
            { mode: 'grid', label: '⊞' },
            { mode: 'list', label: '☰' },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '5px 10px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', fontSize: '14px',
                background: viewMode === mode ? 'var(--color-surface)' : 'transparent',
                color: viewMode === mode ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms', fontFamily: 'Inter, sans-serif'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          {filtered.length} of {allDocs.length} docs
        </p>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px', gap: '12px', color: 'var(--color-text-secondary)' }}>
          <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading documents...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <FileText size={36} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
          <h3 style={{ marginBottom: '8px' }}>
            {allDocs.length === 0 ? 'No documents yet' : 'No documents match your filters'}
          </h3>
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>
            {allDocs.length === 0
              ? 'Upload your first document to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
          {allDocs.length === 0 && (
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              Upload Document
            </button>
          )}
          {allDocs.length > 0 && (
            <button className="btn btn-tertiary btn-sm" onClick={() => {
              setSearch(''); setStatusFilter('ALL'); setActiveGroup(null);
            }}>
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filtered.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={setDeleteTarget}
              onPreview={setPreviewDoc}
              onDownload={handleDownload}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                {['Document', 'Group', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 20px', textAlign: 'left',
                    fontSize: '12px', fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => {
                const status = doc.overall_status || doc.status;
                return (
                  <tr key={doc.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                      transition: 'background 150ms'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <span style={{
                          fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)',
                          maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {doc.file_name || doc.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        fontSize: '13px', color: 'var(--color-text-secondary)',
                        background: 'var(--color-bg)', padding: '2px 8px',
                        borderRadius: '999px', border: '1px solid var(--color-border)'
                      }}>
                        {doc.group_name || `Group #${doc.group_id}`}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <StatusBadge status={status} />
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="btn btn-tertiary btn-sm"
                          onClick={() => setPreviewDoc(doc)}>
                          <Eye size={13} /> Preview
                        </button>
                        {status === 'completed' && (
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/documents/${doc.id}/result`)}>
                            Results
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download"
                          style={{
                            width: 28, height: 28, borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-secondary)', transition: 'all 150ms'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--color-primary)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                          }}
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          title="Delete"
                          style={{
                            width: 28, height: 28, borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-secondary)', transition: 'all 150ms'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#FEE2E2';
                            e.currentTarget.style.color = 'var(--color-error)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {deleteTarget && (
        <DeleteModal
          doc={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}
      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppLayout>
  );
}