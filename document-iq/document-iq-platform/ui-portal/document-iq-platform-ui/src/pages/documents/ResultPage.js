import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tag, Layout, Brain, Loader, AlertCircle,
  ChevronRight, FileText, CheckCircle,
  MessageSquare, ArrowLeft, Copy, Check
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { getDocResultApi } from '../../services/api';

// ── Safe JSON parser (handles both JSON and Python-style dicts) ──
function safeParse(str) {
  if (!str) return null;
  if (typeof str !== 'string') return str;

  // Already valid JSON?
  try { return JSON.parse(str); } catch {}

  // Python-style dict — use a smarter conversion
  try {
    const fixed = str
      // Replace Python booleans and None first (before touching quotes)
      .replace(/:\s*True/g,  ': true')
      .replace(/:\s*False/g, ': false')
      .replace(/:\s*None/g,  ': null')
      // Replace single-quoted keys: 'key' -> "key"
      .replace(/'([^']+)'(\s*:)/g, '"$1"$2')
      // Replace single-quoted string values: : 'value'
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      // Replace single-quoted items in arrays: ['a', 'b']
      .replace(/\[\s*'([^']*)'/g, '["$1"')
      .replace(/',\s*'([^']*)'/g, '", "$1"')
      .replace(/',\s*'([^']*)'\s*]/g, '", "$1"]')
      .replace(/'([^']*)'\s*]/g, '"$1"]');

    return JSON.parse(fixed);
  } catch {}

  // Last resort — try eval-style extraction of known fields
  try {
    const result = {};

    const summaryMatch = str.match(/['"]summary['"]\s*:\s*['"](.+?)['"]\s*,\s*['"]key_insights['"]/s);
    if (summaryMatch) result.summary = summaryMatch[1];

    const insightsMatch = str.match(/['"]key_insights['"]\s*:\s*\[(.+?)\]/s);
    if (insightsMatch) {
      const raw = insightsMatch[1];
      const items = raw.match(/"([^"]+)"|'([^']+)'/g);
      if (items) result.key_insights = items.map(s => s.replace(/^['"]|['"]$/g, ''));
    }

    const typeMatch = str.match(/['"]document_type['"]\s*:\s*['"]([^'"]+)['"]/);
    if (typeMatch) result.document_type = typeMatch[1];

    const confMatch = str.match(/['"]confidence['"]\s*:\s*([\d.]+)/);
    if (confMatch) result.confidence = parseFloat(confMatch[1]);

    return Object.keys(result).length > 0 ? result : null;
  } catch {}

  return null;
}

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
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 18px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 150ms',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '6px 6px 0 0', whiteSpace: 'nowrap'
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
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '4px',
      fontSize: '12px', color: 'var(--color-text-secondary)',
      fontFamily: 'Inter, sans-serif', padding: '4px 8px', borderRadius: '6px'
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
    onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {copied ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Classification Tab ─────────────────────────────────────
function ClassificationTab({ data }) {
  // data could be: "RECEIPT" (string) or { document_type, confidence, ... } (object)
  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Tag size={32} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
      <p style={{ fontSize: '14px' }}>No classification data available.</p>
    </div>
  );

  const isString  = typeof data === 'string';
  const docType   = isString ? data : (data.document_type || data.type || data.label || data.class || null);
  const confidence= isString ? null  : (data.confidence || data.score || null);
  const confPct   = confidence != null ? `${(parseFloat(confidence) * 100).toFixed(1)}%` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Summary Card */}
      <div style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px', padding: '20px',
        display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center'
      }}>
        {/* Type pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '180px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '12px',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Tag size={24} color="#fff" />
          </div>
          <div>
            <p style={{
              fontSize: '11px', color: 'var(--color-text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px'
            }}>
              Document Type
            </p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {docType || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        {confPct && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Confidence
              </p>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>
                {confPct}
              </span>
            </div>
            <div style={{ height: '8px', borderRadius: '999px', background: 'var(--color-border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: confPct,
                background: 'var(--color-success)', borderRadius: '999px'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* If it's a string, show a simple clean display — no raw JSON needed */}
      {!isString && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Raw Classification Data
            </span>
            <CopyButton text={data} />
          </div>
          <pre style={{
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '16px', fontSize: '13px', lineHeight: '1.6',
            overflowX: 'auto', color: 'var(--color-text-primary)',
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
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

  const blocks     = data.blocks     || data.elements || data.regions || [];
  const pageWidth  = data.page_width || null;
  const pageCount  = data.pages      || data.page_count || null;

  // Count element types
  const typeCounts = blocks.reduce((acc, b) => {
    const t = (b.type || b.label || 'unknown').toLowerCase();
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px'
      }}>
        {[
          { label: 'Total Blocks', value: blocks.length },
          { label: 'Page Width',   value: pageWidth ? `${pageWidth}px` : '—' },
          { label: 'Pages',        value: pageCount || (blocks.length > 0 ? Math.max(...blocks.map(b => b.page || 1)) : '—') },
          { label: 'Types Found',  value: Object.keys(typeCounts).length },
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
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Element Type Breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '14px', marginBottom: '14px' }}>Element Types</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '999px', padding: '6px 14px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600,
                  color: 'var(--color-primary)', textTransform: 'capitalize' }}>
                  {type}
                </span>
                <span style={{
                  background: 'var(--color-primary)', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700
                }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocks List — rendered properly */}
      {blocks.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '14px', margin: 0 }}>
              Detected Blocks <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>({blocks.length})</span>
            </h3>
            <CopyButton text={blocks} />
          </div>
          <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
            {blocks.map((block, i) => {
              const type = block.type || block.label || 'unknown';
              const text = block.text || block.content || '';
              const bbox = block.bbox || null;
              const page = block.page || 1;

              const typeColors = {
                body:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
                header: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
                table:  { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
                footer: { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
              };
              const tc = typeColors[type.toLowerCase()] || { bg: 'var(--color-bg)', color: 'var(--color-primary)', border: 'var(--color-border)' };

              return (
                <div key={i} style={{
                  padding: '16px 20px',
                  borderBottom: i < blocks.length - 1 ? '1px solid var(--color-border)' : 'none'
                }}>
                  {/* Block header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                      background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                      {type}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Block {i + 1} · Page {page}
                    </span>
                    {bbox && (
                      <span style={{
                        fontSize: '11px', color: 'var(--color-text-secondary)',
                        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        borderRadius: '4px', padding: '2px 8px', fontFamily: 'monospace'
                      }}>
                        bbox: [{Array.isArray(bbox) ? bbox.join(', ') : bbox}]
                      </span>
                    )}
                  </div>

                  {/* Text content */}
                  {text && (
                    <div style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px', padding: '12px 14px'
                    }}>
                      <p style={{
                        fontSize: '13px', lineHeight: '1.7',
                        color: 'var(--color-text-primary)', margin: 0,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        maxHeight: '200px', overflowY: 'auto'
                      }}>
                        {text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RAG / AI Insights Tab ──────────────────────────────────
function RagTab({ data, navigate }) {
  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Brain size={32} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
      <p style={{ fontSize: '14px' }}>No RAG data available.</p>
    </div>
  );

  const summary     = data.summary     || data.text    || data.insights || null;
  const keyInsights = data.key_insights || data.insights || [];
  const docType     = data.document_type || null;
  const confidence  = data.confidence   || null;
  const confPct     = confidence != null ? `${(parseFloat(confidence) * 100).toFixed(1)}%` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Summary Card */}
      {summary && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Brain size={16} style={{ color: 'var(--color-primary)' }} />
              AI Summary
            </h3>
            <CopyButton text={summary} />
          </div>
          <p style={{
            fontSize: '15px', lineHeight: '1.75',
            color: 'var(--color-text-primary)', margin: 0,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '16px'
          }}>
            {summary}
          </p>
        </div>
      )}

      {/* Key Insights */}
      {Array.isArray(keyInsights) && keyInsights.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>
            Key Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {keyInsights.map((insight, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px', padding: '12px 14px'
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6',
                  color: 'var(--color-text-primary)', margin: 0 }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta row: doc type + confidence */}
      {(docType || confPct) && (
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap'
        }}>
          {docType && (
            <div style={{
              flex: 1, minWidth: '150px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px', padding: '14px 16px'
            }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Identified Type
              </p>
              <p style={{ fontSize: '16px', fontWeight: 700,
                color: 'var(--color-primary)', margin: 0 }}>
                {docType}
              </p>
            </div>
          )}
          {confPct && (
            <div style={{
              flex: 1, minWidth: '150px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px', padding: '14px 16px'
            }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Confidence
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '6px', borderRadius: '999px',
                  background: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: confPct,
                    background: 'var(--color-success)', borderRadius: '999px'
                  }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700,
                  color: 'var(--color-success)', flexShrink: 0 }}>
                  {confPct}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA to chat */}
      <div style={{
        background: 'var(--color-primary)', borderRadius: '10px',
        padding: '20px 24px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>
            Want to ask questions about this document?
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
            Use AI Chat to query across all documents in this group.
          </p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          style={{
            background: '#fff', color: 'var(--color-primary)',
            borderRadius: '999px', padding: '10px 20px',
            fontWeight: 600, fontSize: '14px', border: 'none',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <MessageSquare size={15} /> Open AI Chat
        </button>
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
        const raw = res.data;

        // Handle "still processing" response
        if (raw.status === 'processing') {
          navigate(`/documents/${documentId}/status`);
          return;
        }

        // Normalize the result — parse stringified fields
        const normalized = {
          document_id:    raw.document_id,
          // Classification: could be string "RECEIPT" or object
          classification: raw.classification ?? null,
          // Layout: field is layout_result and it's a JSON string
          layout:         safeParse(raw.layout_result) ?? raw.layout ?? null,
          // RAG: field is rag_result and it's a Python-style string
          rag:            safeParse(raw.rag_result)    ?? raw.rag    ?? null,
        };

        setResult(normalized);
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
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px',
          marginBottom: '24px', flexWrap: 'wrap' }}>
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
              <h1 style={{ fontSize: '22px', margin: 0 }}>Document Results</h1>
              <span style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)',
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                padding: '2px 10px', borderRadius: '999px'
              }}>
                #{documentId}
              </span>
              <span className="badge badge-success"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={11} /> Completed
              </span>
            </div>
            <p style={{ fontSize: '13px', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
              Full AI analysis results for your document
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <Loader size={32} style={{ color: 'var(--color-primary)',
              animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
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
            <div style={{ padding: '0 24px' }}>
              <TabBar tabs={TABS} active={tab} onChange={setTab} />
            </div>
            <div style={{ padding: '0 24px 28px' }}>
              {tab === 'classification' && <ClassificationTab data={result.classification} />}
              {tab === 'layout'         && <LayoutTab         data={result.layout}         />}
              {tab === 'insights'       && <RagTab            data={result.rag} navigate={navigate} />}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}