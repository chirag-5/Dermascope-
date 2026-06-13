import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Consultations from '../pages/Consultations';
import BookingDetail from '../pages/BookingDetail';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['dermatologist']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultations"
        element={
          <ProtectedRoute allowedRoles={['dermatologist']}>
            <Consultations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultations/:bookingId"
        element={
          <ProtectedRoute allowedRoles={['dermatologist']}>
            <Consultations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings/:bookingId"
        element={
          <ProtectedRoute allowedRoles={['dermatologist']}>
            <BookingDetail />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
