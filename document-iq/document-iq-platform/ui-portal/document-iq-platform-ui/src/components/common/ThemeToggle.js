import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isPro = theme === 'professional';

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${isPro ? 'Classy' : 'Professional'} theme`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '999px',
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        transition: 'all 150ms ease',
        fontFamily: 'Inter, sans-serif'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.color = 'var(--color-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.color = 'var(--color-text-secondary)';
      }}
    >
      {/* Toggle Track */}
      <div style={{
        width: '32px',
        height: '18px',
        borderRadius: '999px',
        background: 'var(--color-primary)',
        position: 'relative',
        transition: 'background 150ms ease',
        flexShrink: 0
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: '3px',
          left: isPro ? '3px' : '17px',
          transition: 'left 150ms ease'
        }} />
      </div>
      {isPro ? '💼 Professional' : '🎨 Classy'}
    </button>
  );
}