import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, AlertCircle, Loader,
  FileText, Cpu, Tag, Layout, Brain,
  ArrowRight, RefreshCw
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { getDocStatusApi } from '../../services/api';

// ── Stage config ───────────────────────────────────────────
const STAGES = [
  {
    key:   'ingestion',
    label: 'Ingestion',
    desc:  'Document received and queued for processing',
    icon:  FileText
  },
  {
    key:   'ocr',
    label: 'OCR',
    desc:  'Extracting text content from document',
    icon:  Cpu
  },
  {
    key:   'classification',
    label: 'Classification',
    desc:  'Identifying document type using ML model',
    icon:  Tag
  },
  {
    key:   'layout',
    label: 'Layout Detection',
    desc:  'Detecting headers, body, tables and bounding boxes',
    icon:  Layout
  },
  {
    key:   'rag',
    label: 'RAG Indexing',
    desc:  'Building vector index for AI querying',
    icon:  Brain
  },
];

// ── Stage status resolver ──────────────────────────────────
function resolveStageStatus(stageKey, currentStage, overallStatus) {
  // If fully completed, all stages are green
  if (overallStatus === 'completed') return 'completed';

  const order      = STAGES.map(s => s.key);
  const currentIdx = order.indexOf(currentStage);
  const stageIdx   = order.indexOf(stageKey);

  // If failed, mark current stage red, prior stages green, rest pending
  if (overallStatus === 'failed') {
    if (stageIdx < currentIdx)  return 'completed';
    if (stageIdx === currentIdx) return 'failed';
    return 'pending';
  }

  // Processing
  if (stageIdx < currentIdx)   return 'completed';
  if (stageIdx === currentIdx) return 'active';
  return 'pending';
}

// ── Stage Row ──────────────────────────────────────────────
function StageRow({ stage, status, isLast }) {
  const Icon = stage.icon;

  const colors = {
    completed: {
      dot:   'var(--color-success)',
      icon:  'var(--color-success)',
      bg:    '#F0FDF4',
      border:'#BBF7D0',
      label: 'var(--color-success)',
      badge: 'Completed'
    },
    active: {
      dot:   'var(--color-primary)',
      icon:  'var(--color-primary)',
      bg:    'var(--color-focus-glow)',
      border:'var(--color-primary)',
      label: 'var(--color-primary)',
      badge: 'In Progress'
    },
    failed: {
      dot:   'var(--color-error)',
      icon:  'var(--color-error)',
      bg:    '#FEF2F2',
      border:'#FECACA',
      label: 'var(--color-error)',
      badge: 'Failed'
    },
    pending: {
      dot:   'var(--color-border)',
      icon:  'var(--color-text-secondary)',
      bg:    'transparent',
      border:'var(--color-border)',
      label: 'var(--color-text-secondary)',
      badge: 'Queued'
    }
  };

  const c = colors[status];

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {/* Timeline column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
        {/* Dot */}
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: status === 'pending' ? 'var(--color-bg)' : c.bg,
          border: `2px solid ${c.dot}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 300ms ease'
        }}>
          {status === 'completed' && <CheckCircle size={16} style={{ color: c.icon }} />}
          {status === 'active'    && <Loader size={16} style={{ color: c.icon, animation: 'spin 1s linear infinite' }} />}
          {status === 'failed'    && <AlertCircle size={16} style={{ color: c.icon }} />}
          {status === 'pending'   && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-border)' }} />}
        </div>

        {/* Connector line */}
        {!isLast && (
          <div style={{
            width: '2px',
            flex: 1,
            minHeight: '32px',
            background: status === 'completed' ? 'var(--color-success)' : 'var(--color-border)',
            marginTop: '4px',
            transition: 'background 300ms ease'
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        paddingBottom: isLast ? 0 : '24px'
      }}>
        <div style={{
          background: status === 'pending' ? 'transparent' : c.bg,
          border: `1px solid ${status === 'pending' ? 'var(--color-border)' : c.border}`,
          borderRadius: '8px',
          padding: '14px 16px',
          transition: 'all 300ms ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon size={16} style={{ color: c.icon, flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {stage.label}
              </span>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 600,
              color: c.label,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {c.badge}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {stage.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Overall Status Banner ──────────────────────────────────
function StatusBanner({ overallStatus, currentStage, docId }) {
  const configs = {
    processing: {
          bg:     'var(--color-primary)',
          icon:   <Loader size={22} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />,
          title:  'Processing your document...',
          sub:    currentStage
            ? `Currently running: ${STAGES.find(s => s.key === currentStage)?.label || currentStage}`
            : 'Pipeline is running...',
    },
    completed: {
      bg:    'var(--color-success)',
      icon:  <CheckCircle size={22} color="#fff" />,
      title: 'Processing Complete!',
      sub:   'Your document is ready. View the full analysis results.',
    },
    failed: {
          bg:    'var(--color-error)',
          icon:  <AlertCircle size={22} color="#fff" />,
          title: 'Processing Failed',
          sub:   currentStage
            ? `Failed at stage: ${STAGES.find(s => s.key === currentStage)?.label || currentStage}`
            : 'Processing could not be completed.',
    }
  };

  const c = configs[overallStatus] || configs.processing;

  return (
    <div style={{
      background: c.bg,
      borderRadius: '12px',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '28px',
      transition: 'background 300ms ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {c.icon}
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
            {c.title}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
            {c.sub}
          </div>
        </div>
      </div>

      {overallStatus === 'completed' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 500
          }}>
            Doc #{docId}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────
function ProgressBar({ currentStage, overallStatus }) {
  const order = STAGES.map(s => s.key);
  const idx   = Math.max(0, order.indexOf(currentStage)); // never -1

  const pct = overallStatus === 'completed'
    ? 100
    : overallStatus === 'failed'
    ? Math.max(5, Math.round((idx / STAGES.length) * 100))
    : Math.round(((idx + 0.5) / STAGES.length) * 100);

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Overall Progress
        </span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
          {pct}%
        </span>
      </div>
      <div style={{
        height: '8px',
        borderRadius: '999px',
        background: 'var(--color-border)',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: '999px',
          background: overallStatus === 'failed'
            ? 'var(--color-error)'
            : overallStatus === 'completed'
            ? 'var(--color-success)'
            : 'var(--color-primary)',
          transition: 'width 600ms ease, background 300ms ease'
        }} />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function StatusPage() {
  const { documentId } = useParams();
  const navigate       = useNavigate();

  const [status,       setStatus]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [pollCount,    setPollCount]    = useState(0);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
      try {
        const res = await getDocStatusApi(documentId);
        const raw = res.data;

        // Normalize: handle both response shapes
        // Shape A (new): { document_id, status }
        // Shape B (old): { document_id, current_stage, overall_status }
        const normalized = {
          document_id:    raw.document_id,
          overall_status: raw.overall_status || raw.status,
          current_stage:  raw.current_stage  || (
            // If no stage info, infer from status
            raw.status === 'completed' ? 'rag' :
            raw.status === 'failed'    ? 'ingestion' :
                                        'ingestion'
          )
        };

        setStatus(normalized);
        setLastUpdated(new Date());
        setError('');

        if (normalized.overall_status === 'completed' || normalized.overall_status === 'failed') {
          clearInterval(intervalRef.current);
        }
      } catch (err) {
        setError('Failed to fetch document status.');
      } finally {
        setLoading(false);
        setPollCount(p => p + 1);
      }
    }, [documentId]);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 4000);
    return () => clearInterval(intervalRef.current);
  }, [fetchStatus]);

  const formatTime = (date) => {
    if (!date) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <AppLayout title="Processing Status">
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Document Processing</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '14px' }}>
              Document ID: <strong style={{ color: 'var(--color-primary)' }}>#{documentId}</strong>
            </p>
            {lastUpdated && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Last updated: {formatTime(lastUpdated)}
              </p>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && !status && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <AlertCircle size={40} style={{ color: 'var(--color-error)', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Failed to load status</h3>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>{error}</p>
            <button className="btn btn-primary" onClick={fetchStatus}>
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !status && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <Loader size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <p style={{ fontSize: '14px' }}>Fetching document status...</p>
          </div>
        )}

        {/* Main content */}
        {status && (
          <>
            {/* Status Banner */}
            <StatusBanner
              overallStatus={status.overall_status}
              currentStage={status.current_stage}
              docId={documentId}
            />

            {/* Progress Bar */}
            <ProgressBar
              currentStage={status.current_stage}
              overallStatus={status.overall_status}
            />

            {/* Pipeline Timeline */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px' }}>Pipeline Stages</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {status.overall_status === 'processing' && (
                    <>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--color-primary)',
                        animation: 'pulse 1.5s infinite'
                      }} />
                      <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500 }}>
                        Live
                      </span>
                    </>
                  )}
                  <button
                    onClick={fetchStatus}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-secondary)',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '12px', fontFamily: 'Inter, sans-serif',
                      padding: '4px 8px', borderRadius: '6px',
                      marginLeft: '8px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              {/* Stage list */}
              <div>
                {STAGES.map((stage, i) => (
                  <StageRow
                    key={stage.key}
                    stage={stage}
                    status={resolveStageStatus(stage.key, status.current_stage, status.overall_status)}
                    isLast={i === STAGES.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Clock size={15} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {status.overall_status === 'processing'
                  ? `Auto-refreshing every 4 seconds · Polled ${pollCount} time${pollCount !== 1 ? 's' : ''}`
                  : status.overall_status === 'completed'
                  ? 'Processing complete. Auto-refresh stopped.'
                  : 'Processing failed. Auto-refresh stopped.'}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/groups')}
              >
                Back to Groups
              </button>

              {status.overall_status === 'completed' && (
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => navigate(`/documents/${documentId}/result`)}
                >
                  View Results <ArrowRight size={15} />
                </button>
              )}

              {status.overall_status === 'failed' && (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/upload')}
                >
                  Try Again
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </AppLayout>
  );
}