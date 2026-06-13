import api, { getServerUrl } from './api';

export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '';
  }

  return `${getServerUrl()}${imagePath}`;
};

export const analysisService = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/analysis/upload', formData);
  },

  getById: (id) => api.get(`/analysis/${id}`),
};
