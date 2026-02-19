import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, FolderOpen, Users, CheckCircle,
  Clock, AlertCircle, Upload, ArrowRight,
  MessageSquare, TrendingUp, Loader
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/common/StatCard';
import { listGroupsApi, getDocsByGroupApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Helpers ────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    completed:  { cls: 'badge-success', label: 'Completed' },
    processing: { cls: 'badge-warning', label: 'Processing' },
    failed:     { cls: 'badge-error',   label: 'Failed'     },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      {actionLabel && (
        <button
          className="btn btn-tertiary btn-sm"
          onClick={onAction}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {actionLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

// ── Quick Action Card ──────────────────────────────────────
function QuickAction({ icon: Icon, label, desc, onClick, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--color-bg)' : 'var(--color-surface)',
        border: `1px solid ${hovered ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: '8px',
        padding: '20px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 150ms ease',
        fontFamily: 'Inter, sans-serif',
        width: '100%'
      }}
    >
      <div style={{
        width: 40, height: 40,
        borderRadius: '10px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '12px'
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {desc}
      </div>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user: profile } = useAuth();
  const [groups,  setGroups]  = useState([]);
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listGroupsApi()
      .then(async (gRes) => {
        setGroups(gRes.data);
        // Fetch docs from all groups in parallel
        const allDocs = await Promise.all(
          gRes.data.map(g =>
            getDocsByGroupApi(g.id)
              .then(r => r.data.map(d => ({ ...d, group_name: g.name })))
              .catch(() => [])
          )
        );
        // Flatten, sort newest first, take top 5
        const flat = allDocs.flat().sort((a, b) => b.id - a.id).slice(0, 5);
        setDocs(flat);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDocs = docs.length
  const completedDocs  = docs.filter(d => d.overall_status === 'completed').length;
  const processingDocs = docs.filter(d => d.overall_status === 'processing').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout title="Dashboard">

      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'var(--color-primary)',
        borderRadius: '12px',
        padding: '28px 32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '6px' }}>
            {greeting()}, {profile?.email?.split('@')[0] || 'there'} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 }}>
            Here's what's happening in your workspace today.
          </p>
        </div>
        <button
          className="btn"
          onClick={() => navigate('/upload')}
          style={{
            background: '#fff',
            color: 'var(--color-primary)',
            borderRadius: '999px',
            padding: '10px 22px',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
            border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}
        >
          <Upload size={16} /> Upload Document
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={totalDocs}
          sub="Across all groups"
          color="var(--color-primary)"
        />
        <StatCard
          icon={FolderOpen}
          label="Groups"
          value={loading ? '—' : groups.length}
          sub="Active workspaces"
          color="#7C3AED"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedDocs}
          sub="Successfully processed"
          color="var(--color-success)"
        />
        <StatCard
          icon={Clock}
          label="Processing"
          value={processingDocs}
          sub="In pipeline"
          color="var(--color-warning)"
        />
      </div>

      {/* ── Main Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '24px',
        alignItems: 'start'
      }}>

        {/* LEFT: Recent Documents */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 0' }}>
              <SectionHeader
                title="Recent Documents"
                actionLabel="View all"
                onAction={() => navigate('/groups')}
              />
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Document', 'Group', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: 'var(--color-bg)'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Loading documents...
                      </div>
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                      <FileText size={28} style={{ color: 'var(--color-border)', marginBottom: '10px' }} />
                      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        No documents yet. Upload your first document to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  docs.map((doc, i) => (
                    <tr
                      key={doc.id}
                      style={{
                        borderBottom: i < docs.length - 1 ? '1px solid var(--color-border)' : 'none',
                        transition: 'background 150ms'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: 32, height: 32, background: 'var(--color-bg)',
                            borderRadius: '6px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0,
                            border: '1px solid var(--color-border)'
                          }}>
                            <FileText size={15} style={{ color: 'var(--color-primary)' }} />
                          </div>
                          <span style={{
                            fontSize: '14px', fontWeight: 500,
                            color: 'var(--color-text-primary)',
                            maxWidth: '200px', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {doc.file_name || doc.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontSize: '13px', color: 'var(--color-text-secondary)',
                          background: 'var(--color-bg)', padding: '2px 8px',
                          borderRadius: '999px', border: '1px solid var(--color-border)'
                        }}>
                          {doc.group_name || `Group #${doc.group_id}`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <StatusBadge status={doc.overall_status || doc.status} />
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          className="btn btn-tertiary btn-sm"
                          onClick={() => navigate(
                            (doc.overall_status || doc.status) === 'completed'
                              ? `/documents/${doc.id}/result`
                              : `/documents/${doc.id}/status`
                          )}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Quick Actions */}
          <div className="card">
            <SectionHeader title="Quick Actions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <QuickAction
                icon={Upload}
                label="Upload Document"
                desc="Add a new document to a group"
                onClick={() => navigate('/upload')}
                color="var(--color-primary)"
              />
              <QuickAction
                icon={MessageSquare}
                label="Ask AI"
                desc="Query your documents with AI"
                onClick={() => navigate('/chat')}
                color="#7C3AED"
              />
              <QuickAction
                icon={FolderOpen}
                label="Create Group"
                desc="Organize your documents"
                onClick={() => navigate('/groups')}
                color="var(--color-success)"
              />
            </div>
          </div>

          {/* Groups Overview */}
          <div className="card">
            <SectionHeader
              title="Your Groups"
              actionLabel="Manage"
              onAction={() => navigate('/groups')}
            />
            {loading ? (
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Loading groups...
              </p>
            ) : groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <FolderOpen size={32} style={{ color: 'var(--color-border)', marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  No groups yet. Create your first group.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => navigate('/groups')}
                >
                  Create Group
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groups.slice(0, 5).map(g => (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all 150ms'
                    }}
                    onClick={() => navigate('/groups')}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.background = 'var(--color-bg)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <FolderOpen size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {g.name}
                    </span>
                  </div>
                ))}
                {groups.length > 5 && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                    +{groups.length - 5} more groups
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pipeline Status */}
          <div className="card">
            <SectionHeader title="Pipeline Health" />
            {[
              { stage: 'Ingestion',   status: 'ok' },
              { stage: 'OCR',         status: 'ok' },
              { stage: 'Layout',      status: 'ok' },
              { stage: 'Classification', status: 'ok' },
              { stage: 'RAG Engine',  status: 'ok' },
            ].map(({ stage, status }) => (
              <div key={stage} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border)'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {stage}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--color-success)'
                  }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 500 }}>
                    Online
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}