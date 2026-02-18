import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LoginPage     from './pages/auth/LoginPage';
import SignupPage    from './pages/auth/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import GroupsPage    from './pages/groups/GroupsPage';
import UploadPage    from './pages/documents/UploadPage';
import StatusPage    from './pages/documents/StatusPage';
import ResultPage    from './pages/documents/ResultPage';
import ChatPage      from './pages/chat/ChatPage';
import UsersPage     from './pages/admin/UsersPage';
import SettingsPage  from './pages/settings/SettingsPage';
import ProfilePage   from './pages/settings/ProfilePage';
import NotFoundPage  from './pages/NotFoundPage';

// ── Route Guards ───────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AppLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AppLoader />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (!isAuthenticated) return <Navigate to="/login"    replace />;
  if (!isAdmin)         return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Full screen loader ─────────────────────────────────────
function AppLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: 48, height: 48,
        borderRadius: '12px',
        background: 'var(--color-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1.5s ease infinite'
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: '18px', fontWeight: 700,
          color: 'var(--color-text-primary)', marginBottom: '4px'
        }}>
          Document<span style={{ color: 'var(--color-primary)' }}>-IQ</span>
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Loading your workspace...
        </p>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<PublicRoute><LoginPage  /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Protected - all users */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/groups"    element={<ProtectedRoute><GroupsPage    /></ProtectedRoute>} />
        <Route path="/upload"    element={<ProtectedRoute><UploadPage    /></ProtectedRoute>} />
        <Route path="/chat"      element={<ProtectedRoute><ChatPage      /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><ProfilePage   /></ProtectedRoute>} />
        <Route path="/documents/:documentId/status" element={<ProtectedRoute><StatusPage /></ProtectedRoute>} />
        <Route path="/documents/:documentId/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />

        {/* Admin only */}
        <Route path="/admin/users" element={<AdminRoute><UsersPage    /></AdminRoute>} />
        <Route path="/settings"    element={<AdminRoute><SettingsPage /></AdminRoute>} />

        {/* Fallbacks */}
        <Route path="/"   element={<Navigate to="/login" replace />} />
        <Route path="*"   element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;