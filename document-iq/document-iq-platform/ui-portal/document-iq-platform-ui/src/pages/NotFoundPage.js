import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Home, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center'
    }}>

      {/* Theme toggle top right */}
      <div style={{ position: 'fixed', top: 20, right: 24 }}>
        <ThemeToggle />
      </div>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '8px', marginBottom: '48px'
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--color-primary)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <FileText size={19} color="#fff" />
        </div>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Document<span style={{ color: 'var(--color-primary)' }}>-IQ</span>
        </span>
      </div>

      {/* 404 Display */}
      <div style={{
        fontSize: '96px',
        fontWeight: 800,
        color: 'var(--color-primary)',
        lineHeight: 1,
        marginBottom: '16px',
        letterSpacing: '-4px',
        opacity: 0.15
      }}>
        404
      </div>

      <div style={{
        width: 64, height: 64, borderRadius: '16px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
      }}>
        <FileText size={28} style={{ color: 'var(--color-primary)' }} />
      </div>

      <h1 style={{ fontSize: '26px', marginBottom: '10px' }}>
        Page not found
      </h1>
      <p style={{
        fontSize: '15px', maxWidth: '360px',
        lineHeight: '1.6', marginBottom: '36px'
      }}>
        The page you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={15} /> Go Back
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Home size={15} /> Go to Dashboard
        </button>
      </div>

      {/* Decorative grid lines */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        backgroundImage: `
          linear-gradient(var(--color-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--color-border) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        opacity: 0.4,
        pointerEvents: 'none'
      }} />
    </div>
  );
}