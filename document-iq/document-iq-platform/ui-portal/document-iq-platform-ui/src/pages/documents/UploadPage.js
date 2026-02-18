import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Upload, FileText, X, CheckCircle,
  AlertCircle, ChevronDown, Loader, File
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { listGroupsApi, analyzeDocumentApi } from '../../services/api';

// ── File size formatter ────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Convert file to base64 ────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Group Selector ─────────────────────────────────────────
function GroupSelector({ groups, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = groups.find(g => g.id === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(p => !p)}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)',
          border: `1px solid ${open ? 'var(--color-primary)' : 'var(--color-input-border)'}`,
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          color: selected ? 'var(--color-text-primary)' : '#9CA3AF',
          fontFamily: 'Inter, sans-serif',
          boxShadow: open ? `0 0 0 3px var(--color-focus-glow)` : 'none',
          transition: 'all 150ms',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selected && (
            <div style={{
              width: 20, height: 20,
              background: 'var(--color-primary)',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileText size={11} color="#fff" />
            </div>
          )}
          {selected ? selected.name : 'Select a group...'}
        </div>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--color-text-secondary)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 150ms'
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 200,
          overflow: 'hidden',
          maxHeight: '220px',
          overflowY: 'auto'
        }}>
          {groups.length === 0 ? (
            <div style={{
              padding: '16px',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              textAlign: 'center'
            }}>
              No groups available
            </div>
          ) : (
            groups.map(g => (
              <div
                key={g.id}
                onClick={() => { onChange(g.id); setOpen(false); }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: value === g.id ? 'var(--color-bg)' : 'transparent',
                  color: value === g.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: value === g.id ? 600 : 400,
                  transition: 'background 100ms'
                }}
                onMouseEnter={e => {
                  if (value !== g.id) e.currentTarget.style.background = 'var(--color-bg)';
                }}
                onMouseLeave={e => {
                  if (value !== g.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <FileText size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                {g.name}
                {value === g.id && (
                  <CheckCircle size={14} style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Drop Zone ──────────────────────────────────────────────
function DropZone({ file, onFile, onClear, disabled }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
  const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

  const processFile = useCallback((f) => {
    if (!ACCEPTED.includes(f.type)) {
      alert('Unsupported file type. Please upload PDF, PNG, JPG, or TIFF.');
      return;
    }
    if (f.size > MAX_SIZE) {
      alert('File too large. Maximum size is 20 MB.');
      return;
    }
    onFile(f);
  }, [onFile]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleDragOver = (e) => { e.preventDefault(); if (!disabled) setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleInput = (e) => {
    const f = e.target.files[0];
    if (f) processFile(f);
    e.target.value = '';
  };

  // File icon color by type
  const getFileColor = (type) => {
    if (type === 'application/pdf') return '#DC2626';
    if (type?.startsWith('image/')) return '#7C3AED';
    return 'var(--color-primary)';
  };

  if (file) {
    return (
      <div style={{
        border: '2px solid var(--color-success)',
        borderRadius: '12px',
        padding: '24px',
        background: '#F0FDF4',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: 52, height: 52,
          borderRadius: '12px',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--color-border)',
          flexShrink: 0
        }}>
          <File size={24} style={{ color: getFileColor(file.type) }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px', fontWeight: 600,
            color: 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {file.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {formatSize(file.size)} · {file.type || 'Unknown type'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            marginTop: '6px'
          }}>
            <CheckCircle size={13} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 500 }}>
              Ready to upload
            </span>
          </div>
        </div>

        {!disabled && (
          <button
            onClick={onClear}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px', borderRadius: '6px',
              display: 'flex', alignItems: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: '12px',
        padding: '48px 24px',
        background: dragging ? 'var(--color-focus-glow)' : 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease',
        textAlign: 'center'
      }}
    >
      <div style={{
        width: 56, height: 56,
        borderRadius: '14px',
        background: dragging ? 'var(--color-primary)' : 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 150ms'
      }}>
        <Upload
          size={24}
          style={{ color: dragging ? '#fff' : 'var(--color-primary)', transition: 'color 150ms' }}
        />
      </div>

      <div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          {dragging ? 'Drop your file here' : 'Drag & drop your document'}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          or <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>browse to choose a file</span>
        </p>
      </div>

      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
        marginTop: '4px'
      }}>
        {['PDF', 'PNG', 'JPG', 'TIFF'].map(ext => (
          <span key={ext} className="badge badge-neutral">{ext}</span>
        ))}
        <span className="badge badge-neutral">Max 20 MB</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.tiff"
        onChange={handleInput}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// ── Upload Progress Steps ──────────────────────────────────
function UploadSteps({ step }) {
  const steps = [
    { id: 1, label: 'Select file'    },
    { id: 2, label: 'Choose group'   },
    { id: 3, label: 'Submit'         },
    { id: 4, label: 'Processing'     },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '32px' }}>
      {steps.map((s, i) => {
        const done    = step > s.id;
        const current = step === s.id;
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: done ? 'var(--color-success)' : current ? 'var(--color-primary)' : 'var(--color-bg)',
                border: `2px solid ${done ? 'var(--color-success)' : current ? 'var(--color-primary)' : 'var(--color-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 200ms',
                flexShrink: 0
              }}>
                {done
                  ? <CheckCircle size={16} color="#fff" />
                  : <span style={{
                      fontSize: '13px', fontWeight: 600,
                      color: current ? '#fff' : 'var(--color-text-secondary)'
                    }}>{s.id}</span>
                }
              </div>
              <span style={{
                fontSize: '11px', fontWeight: current ? 600 : 400,
                color: current ? 'var(--color-primary)' : done ? 'var(--color-success)' : 'var(--color-text-secondary)',
                whiteSpace: 'nowrap'
              }}>
                {s.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: '2px',
                background: done ? 'var(--color-success)' : 'var(--color-border)',
                margin: '0 8px',
                marginBottom: '20px',
                transition: 'background 200ms'
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function UploadPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Pre-select group if navigated from Groups page
  const preselectedGroupId   = location.state?.groupId   || null;
  const preselectedGroupName = location.state?.groupName || null;

  const [groups,    setGroups]    = useState([]);
  const [groupId,   setGroupId]   = useState(preselectedGroupId);
  const [file,      setFile]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(true);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [docId,     setDocId]     = useState(null);

  // Determine step
  const step = submitted ? 4 : file && groupId ? 3 : file || groupId ? 2 : 1;

  useEffect(() => {
    listGroupsApi()
      .then(r => setGroups(r.data))
      .catch(() => setError('Failed to load groups.'))
      .finally(() => setFetchingGroups(false));
  }, []);

  const handleSubmit = async () => {
    if (!file)    { setError('Please select a file.');  return; }
    if (!groupId) { setError('Please select a group.'); return; }

    setError('');
    setLoading(true);

    try {
      const base64 = await fileToBase64(file);
      const res = await analyzeDocumentApi({
        group_id:       groupId,
        file_name:      file.name,
        content_base64: base64
      });
      setDocId(res.data.document_id);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────
  if (submitted && docId) {
    return (
      <AppLayout title="Upload Document">
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center', padding: '48px 36px' }}>
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: '#D1FAE5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle size={36} style={{ color: 'var(--color-success)' }} />
            </div>

            <h2 style={{ marginBottom: '8px' }}>Document Submitted!</h2>
            <p style={{ fontSize: '14px', marginBottom: '6px' }}>
              <strong>{file?.name}</strong> has been submitted for processing.
            </p>
            <p style={{ fontSize: '13px', marginBottom: '28px' }}>
              Document ID: <span style={{
                fontWeight: 600,
                color: 'var(--color-primary)',
                background: 'var(--color-bg)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)'
              }}>#{docId}</span>
            </p>

            {/* Pipeline stages preview */}
            <div style={{
              background: 'var(--color-bg)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '28px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Processing Pipeline
              </p>
              {['Ingestion', 'OCR', 'Layout Detection', 'Classification', 'RAG Indexing'].map((stage, i) => (
                <div key={stage} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 0',
                  borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none'
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{stage}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '11px', fontWeight: 500,
                    color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                  }}>
                    {i === 0 ? 'In progress...' : 'Queued'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate('/groups')}
              >
                Back to Groups
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate(`/documents/${docId}/status`)}
              >
                Track Status
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Main Upload Form ───────────────────────────────────
  return (
    <AppLayout title="Upload Document">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Upload Document</h1>
          <p style={{ fontSize: '14px' }}>
            Upload a PDF or image document for AI-powered processing and analysis.
          </p>
        </div>

        {/* Steps */}
        <UploadSteps step={step} />

        {/* Error Banner */}
        {error && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FECACA',
            color: 'var(--color-error)', borderRadius: '8px',
            padding: '12px 16px', fontSize: '14px',
            marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-error)', marginLeft: 'auto' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="card">

          {/* Drop Zone */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
              Document File <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <DropZone
              file={file}
              onFile={setFile}
              onClear={() => setFile(null)}
              disabled={loading}
            />
          </div>

          <div className="divider" />

          {/* Group Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
              Destination Group <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>

            {preselectedGroupName && !groupId && (
              <div style={{
                fontSize: '13px', color: 'var(--color-text-secondary)',
                marginBottom: '8px'
              }}>
                Pre-selected: <strong>{preselectedGroupName}</strong>
              </div>
            )}

            {fetchingGroups ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                color: 'var(--color-text-secondary)', fontSize: '14px', padding: '10px 0' }}>
                <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
                Loading groups...
              </div>
            ) : (
              <GroupSelector
                groups={groups}
                value={groupId}
                onChange={setGroupId}
                disabled={loading}
              />
            )}

            {groups.length === 0 && !fetchingGroups && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginTop: '10px', padding: '10px 14px',
                background: '#FEF3C7', borderRadius: '6px',
                border: '1px solid #FDE68A'
              }}>
                <AlertCircle size={15} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--color-warning)' }}>
                  No groups found.{' '}
                  <span
                    style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => navigate('/groups')}
                  >
                    Create a group first.
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Summary Row */}
          <div style={{
            background: 'var(--color-bg)',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                File
              </p>
              <p style={{ fontSize: '13px', fontWeight: 500,
                color: file ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                {file ? file.name : 'Not selected'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                Size
              </p>
              <p style={{ fontSize: '13px', fontWeight: 500,
                color: file ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                {file ? formatSize(file.size) : '—'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                Group
              </p>
              <p style={{ fontSize: '13px', fontWeight: 500,
                color: groupId ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                {groups.find(g => g.id === groupId)?.name || 'Not selected'}
              </p>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'center', minWidth: '100px' }}
              onClick={() => navigate('/groups')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleSubmit}
              disabled={loading || !file || !groupId}
            >
              {loading
                ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</>
                : <><Upload size={15} /> Submit for Processing</>
              }
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}