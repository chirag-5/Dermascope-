import api from './api';

export const supportService = {
  getTickets: () => api.get('/support/tickets'),
  createTicket: (payload) => api.post('/support/tickets', payload),
  getTicketMessages: (ticketId) => api.get(`/support/tickets/${ticketId}/messages`),
  sendTicketMessage: (ticketId, text) =>
    api.post(`/support/tickets/${ticketId}/messages`, { text }),
};
