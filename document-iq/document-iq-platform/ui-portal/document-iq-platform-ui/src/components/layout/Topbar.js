import React from 'react';
import { Bell } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

export default function Topbar({ title = 'Dashboard' }) {
  return (
    <header style={{
      height: '64px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Page Title */}
      <h2 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--color-text-primary)'
      }}>
        {title}
      </h2>

      {/* Right side */}
      <div className="flex items-center gap-16">
        <ThemeToggle />

        {/* Notification Bell */}
        <button style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          padding: '4px'
        }}>
          <Bell size={20} />
          {/* Dot indicator */}
          <span style={{
            position: 'absolute',
            top: '2px', right: '2px',
            width: '8px', height: '8px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            border: '2px solid var(--color-surface)'
          }} />
        </button>
      </div>
    </header>
  );
}