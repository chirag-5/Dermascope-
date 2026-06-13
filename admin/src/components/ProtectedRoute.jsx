import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: 48 }}>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'user') {
      window.location.href = `${FRONTEND_URL}/upload`;
      return null;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
