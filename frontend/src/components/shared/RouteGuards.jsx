import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Admin only</div>
        <div style={{ color: 'var(--text2)', fontSize: 13 }}>
          Your account doesn't have admin access.
        </div>
        <a href="/" style={{
          padding: '8px 20px', background: 'var(--accent)', color: '#0d0f12',
          borderRadius: 8, textDecoration: 'none', fontWeight: 700,
        }}>
          ← Back to App
        </a>
      </div>
    );
  }
  return children;
}

export function GuestRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Navigate to="/" replace />;
  return children;
}
