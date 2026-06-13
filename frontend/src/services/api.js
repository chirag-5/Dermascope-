import axios from 'axios';

const TOKEN_KEY = 'dermascope_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

export const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api$/, '');
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const authService = {
  registerUser: (data) => api.post('/auth/register/user', data),
  registerDermatologist: (data) => api.post('/auth/register/dermatologist', data),
  loginUser: (data) => api.post('/auth/login/user', data),
  loginDermatologist: (data) => api.post('/auth/login/dermatologist', data),
  loginWithGoogle: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
};

export default api;
