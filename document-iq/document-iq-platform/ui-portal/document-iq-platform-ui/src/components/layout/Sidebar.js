import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileText, LayoutDashboard, FolderOpen,
  Upload, Users, Settings, LogOut,
  ChevronLeft, ChevronRight,
  MessageSquare, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_MAIN = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/groups',    icon: FolderOpen,      label: 'Groups'    },
  { to: '/documents', icon: FileText,        label: 'Documents' },
  { to: '/upload',    icon: Upload,          label: 'Upload'    },
  { to: '/chat',      icon: MessageSquare,   label: 'AI Chat'   },
];

const NAV_ADMIN = [
  { to: '/admin/users', icon: Users,    label: 'Users'    },
  { to: '/settings',   icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate   = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const w = collapsed ? '64px' : '220px';

  const linkBase = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? 0 : '10px',
    padding: collapsed ? '10px' : '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
    transition: 'all 150ms ease',
    justifyContent: collapsed ? 'center' : 'flex-start',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box'
  });

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      style={({ isActive }) => linkBase(isActive)}
    >
      {({ isActive }) => (
        <>
          <Icon size={18} style={{
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            flexShrink: 0
          }} />
          {!collapsed && (
            <span style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  const SectionLabel = ({ text }) => !collapsed ? (
    <p style={{
      fontSize: '11px', fontWeight: 600,
      color: 'var(--color-text-secondary)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      padding: '4px 8px 8px',
    }}>
      {text}
    </p>
  ) : (
    <div style={{
      height: '1px',
      background: 'var(--color-border)',
      margin: '8px 8px'
    }} />
  );

  return (
    <aside style={{
      width: w,
      minHeight: '100vh',
      height: '100vh',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 200ms ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--color-border)',
        minHeight: '64px',
        gap: '10px'
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--color-primary)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <FileText size={17} color="#fff" />
        </div>
        {!collapsed && (
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Doc<span style={{ color: 'var(--color-primary)' }}>-IQ</span>
          </span>
        )}
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(p => !p)}
        style={{
          position: 'absolute', top: '52px', right: '-12px',
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-secondary)',
          transition: 'all 150ms'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--color-primary)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'var(--color-primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--color-surface)';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* ── Nav ── */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>

        {/* Main */}
        <SectionLabel text="Main" />
        {NAV_MAIN.map(item => <NavItem key={item.to} {...item} />)}

        {/* Admin */}
        {isAdmin && (
          <div style={{ marginTop: '8px' }}>
            <SectionLabel text="Admin" />
            {NAV_ADMIN.map(item => <NavItem key={item.to} {...item} />)}
          </div>
        )}
      </nav>

      {/* ── Bottom ── */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--color-border)'
      }}>
        {/* Profile */}
        <NavLink
          to="/profile"
          title={collapsed ? 'Profile' : undefined}
          style={({ isActive }) => linkBase(isActive)}
        >
          {({ isActive }) => (
            <>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isActive ? 'var(--color-primary)' : 'var(--color-bg)',
                border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 150ms'
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: isActive ? '#fff' : 'var(--color-text-secondary)'
                }}>
                  {user?.email?.slice(0, 2).toUpperCase() || '??'}
                </span>
              </div>
              {!collapsed && (
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 600,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {user?.email?.split('@')[0] || 'My Profile'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {isAdmin ? 'Admin' : 'Member'}
                  </div>
                </div>
              )}
            </>
          )}
        </NavLink>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : '10px',
            padding: collapsed ? '10px' : '10px 14px',
            borderRadius: '8px', width: '100%',
            border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500,
            color: 'var(--color-error)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            marginTop: '4px',
            fontFamily: 'Inter, sans-serif',
            transition: 'background 150ms'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}