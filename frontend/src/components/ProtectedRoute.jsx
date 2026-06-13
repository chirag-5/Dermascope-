import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: 48 }}>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'dermatologist') {
      window.location.href = `${ADMIN_URL}/dashboard`;
      return null;
    }

    return <Navigate to="/upload" replace />;
  }

  return children;
};

export default ProtectedRoute;
