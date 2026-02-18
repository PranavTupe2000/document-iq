import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{
        width: 44, height: 44,
        borderRadius: '10px',
        background: color ? `${color}18` : 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={20} style={{ color: color || 'var(--color-primary)' }} />
      </div>
      <div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
          {label}
        </p>
        <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}