import api from './api';

export const messageService = {
  getByBookingId: (bookingId) => api.get(`/messages/${bookingId}`),
  send: (payload) => api.post('/messages', payload),
};
