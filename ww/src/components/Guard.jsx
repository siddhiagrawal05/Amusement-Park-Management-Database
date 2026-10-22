import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

// Keeps visitor pages and admin pages separate
export default function Guard({ role, children }) {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} state={{ from: loc.pathname }} replace />;
  }
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }
  return children;
}