import api from './api';

export const dermatologistService = {
  list: (params = {}) => api.get('/dermatologists', { params }),
  getRecommended: (analysisId) =>
    api.get('/dermatologists/recommended', { params: { analysisId } }),
  getSlots: (dermatologistId) => api.get(`/dermatologists/${dermatologistId}/slots`),
};
