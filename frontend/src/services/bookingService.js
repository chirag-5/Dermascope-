import api from './api';

export const bookingService = {
  create: (payload) => api.post('/bookings', payload),
  getById: (id) => api.get(`/bookings/${id}`),
  getUserBookings: () => api.get('/bookings/user'),
  getDoctorBookings: () => api.get('/bookings/doctor'),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
};
