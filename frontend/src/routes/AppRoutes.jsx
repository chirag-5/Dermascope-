import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '../components/ProtectedRoute';
import UserLogin from '../pages/Login';
import UserLanding from '../pages/Landing';
import UserRegister from '../pages/Register';
import Upload from '../pages/Upload';
import Results from '../pages/Results';
import Dermatologists from '../pages/Dermatologists';
import UserBooking from '../pages/Booking';
import UserConsultations from '../pages/Consultations';
import SupportCenter from '../pages/SupportCenter';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<UserLanding />} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />

      <Route
        path="/upload"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Upload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/results/:analysisId"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dermatologists"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Dermatologists />
          </ProtectedRoute>
        }
      />

      <Route
        path="/booking/:bookingId"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserBooking />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultations"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserConsultations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultations/:bookingId"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserConsultations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/support"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <SupportCenter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/support/:ticketId"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <SupportCenter />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
