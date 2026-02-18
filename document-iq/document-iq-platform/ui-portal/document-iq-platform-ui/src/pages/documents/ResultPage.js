import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tag, Layout, Brain, Loader, AlertCircle,
  ChevronRight, FileText, CheckCircle,
  MessageSquare, ArrowLeft, Copy, Check
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { getDocResultApi } from '../../services/api';

// ── Tab Bar ────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid var(--color-border)',
      marginBottom: '24px',
      gap: '4px'
    }}>
      {tabs.map(tab => {
        const isActive = tab.key === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 150ms',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '6px 6px 0 0',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <Icon size={15} style={{ flexShrink: 0 }} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Copy Button ────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '4px',
        fontSize: '12px', color: 'var(--color-text-secondary)',
        fontFamily: 'Inter, sans-serif', padding: '4px 8px',
        borderRadius: '6px'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {copied ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── JSON Viewer ────────────────────────────────────────────
function JsonViewer({ data, title }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
        <CopyButton text={text} />
      </div>
      <pre style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '13px',
        lineHeight: '1.6',
        overflowX: 'auto',
        color: 'var(--color-text-primary)',
        fontFamily: "'Fira Code', 'Courier New', monospace",
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 0
      }}>
        {text}
      </pre>
    </div>
  );
}

// ── Key Value Row ──────────────────────────────────────────
function KVRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--color-border)',
      gap: '16px'
    }}>
      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', flexShrink: 0, minWidth: '140px' }}>
        {label}
      </span>
      <span style={{
        fontSize: '14px',
        fontWeight: highlight ? 600 : 400,
        color: highlight ? 'var(--color-primary)' : 'var(--color-text-primary)',
        textAlign: 'right',
        wordBreak: 'break-word'
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ── Classification Tab ─────────────────────────────────────
function ClassificationTab({ data }) {
  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Tag size={32} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
      <p style={{ fontSize: '14px' }}>No classification data available.</p>
    </div>
  );

  // Try to extract common fields gracefully
  const docType    = data.document_type || data.type || data.label || null;
  const confidence = data.confidence    || data.score || null;
  const confPct    = confidence != null ? `${(parseFloat(confidence) * 100).toFixed(1)}%` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Summary Card */}
      {(docType || confidence) && (
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          {docType && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              flex: 1, minWidth: '180px'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '10px',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Tag size={20} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  Document Type
                </p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {docType}
                </p>
              </div>
            </div>
          )}

          {confPct && (
            <div style={{ flex: 1, minWidth: '160px' }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Confidence
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  flex: 1, height: '8px', borderRadius: '999px',
                  background: 'var(--color-border)', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: confPct,
                    background: 'var(--color-success)',
                    borderRadius: '999px'
                  }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>
                  {confPct}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw Data */}
      <div className="card">
        <JsonViewer data={data} title="Raw Classification Data" />
      </div>
    </div>
  );
}

// ── Layout Tab ─────────────────────────────────────────────
function LayoutTab({ data }) {
  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Layout size={32} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
      <p style={{ fontSize: '14px' }}>No layout data available.</p>
    </div>
  );

  const elements = data.elements || data.blocks || data.regions || [];
  const pages    = data.pages    || data.page_count || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {[
          { label: 'Pages',    value: pages ?? '—' },
          { label: 'Elements', value: elements.length || '—' },
          { label: 'Headers',  value: elements.filter(e => (e.type || e.label || '').toLowerCase().includes('header')).length || '—' },
          { label: 'Tables',   value: elements.filter(e => (e.type || e.label || '').toLowerCase().includes('table')).length  || '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '14px 16px'
          }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              {label}
            </p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Element List */}
      {elements.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Detected Elements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {elements.slice(0, 20).map((el, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px',
                background: 'var(--color-bg)',
                borderRadius: '6px',
                border: '1px solid var(--color-border)'
              }}>
                <span className="badge badge-info" style={{ flexShrink: 0, fontSize: '11px' }}>
                  {el.type || el.label || 'Element'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {el.text || el.content || el.bbox ? `BBox: [${el.bbox}]` : `Element ${i + 1}`}
                </span>
              </div>
            ))}
            {elements.length > 20 && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center', paddingTop: '4px' }}>
                +{elements.length - 20} more elements
              </p>
            )}
          </div>
        </div>
      )}

      {/* Raw */}
      <div className="card">
        <JsonViewer data={data} title="Raw Layout Data" />
      </div>
    </div>
  );
}

// ── RAG / AI Insights Tab ──────────────────────────────────
function RagTab({ data, docId, navigate }) {
  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Brain size={32} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
      <p style={{ fontSize: '14px' }}>No RAG data available.</p>
    </div>
  );

  const summary  = data.summary  || data.insights || data.text  || null;
  const chunks   = data.chunks   || data.segments  || [];
  const metadata = data.metadata || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Summary */}
      {summary && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={16} style={{ color: 'var(--color-primary)' }} />
              AI Summary
            </h3>
            <CopyButton text={summary} />
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-text-primary)' }}>
            {summary}
          </p>
        </div>
      )}

      {/* Metadata */}
      {Object.keys(metadata).length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>Metadata</h3>
          {Object.entries(metadata).map(([k, v]) => (
            <KVRow key={k} label={k} value={String(v)} />
          ))}
        </div>
      )}

      {/* Chunks */}
      {chunks.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>
            Indexed Chunks <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>({chunks.length})</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chunks.slice(0, 5).map((chunk, i) => (
              <div key={i} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600,
                  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Chunk {i + 1}
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text-primary)', margin: 0 }}>
                  {typeof chunk === 'string' ? chunk : chunk.text || chunk.content || JSON.stringify(chunk)}
                </p>
              </div>
            ))}
            {chunks.length > 5 && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                +{chunks.length - 5} more chunks indexed
              </p>
            )}
          </div>
        </div>
      )}

      {/* CTA to chat */}
      <div style={{
        background: 'var(--color-primary)',
        borderRadius: '10px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>
            Ready to ask questions?
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            Use the AI Chat to query this document.
          </p>
        </div>
        <button
          className="btn"
          onClick={() => navigate('/chat')}
          style={{
            background: '#fff',
            color: 'var(--color-primary)',
            borderRadius: '999px',
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MessageSquare size={15} /> Open AI Chat
        </button>
      </div>

      {/* Raw */}
      <div className="card">
        <JsonViewer data={data} title="Raw RAG Data" />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ResultPage() {
  const { documentId } = useParams();
  const navigate       = useNavigate();

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('classification');

  useEffect(() => {
    getDocResultApi(documentId)
      .then(res => {
        if (res.data.status === 'processing') {
          navigate(`/documents/${documentId}/status`);
        } else {
          setResult(res.data);
        }
      })
      .catch(() => setError('Failed to load document results.'))
      .finally(() => setLoading(false));
  }, [documentId, navigate]);

  const TABS = [
    { key: 'classification', label: 'Classification', icon: Tag    },
    { key: 'layout',         label: 'Layout',         icon: Layout },
    { key: 'insights',       label: 'AI Insights',    icon: Brain  },
  ];

  return (
    <AppLayout title="Document Results">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px' }}>Document Results</h1>
              <span style={{
                fontSize: '13px', fontWeight: 600,
                color: 'var(--color-primary)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                padding: '2px 10px', borderRadius: '999px'
              }}>
                #{documentId}
              </span>
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={11} /> Completed
              </span>
            </div>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Full AI analysis results for your document
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <Loader size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <p style={{ fontSize: '14px' }}>Loading analysis results...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <AlertCircle size={40} style={{ color: 'var(--color-error)', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Failed to load results</h3>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Tab bar */}
            <div style={{ padding: '0 24px' }}>
              <TabBar tabs={TABS} active={tab} onChange={setTab} />
            </div>

            {/* Tab content */}
            <div style={{ padding: '0 24px 24px' }}>
              {tab === 'classification' && <ClassificationTab data={result.classification} />}
              {tab === 'layout'         && <LayoutTab         data={result.layout}         />}
              {tab === 'insights'       && <RagTab            data={result.rag} docId={documentId} navigate={navigate} />}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}