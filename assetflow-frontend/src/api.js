import axios from 'axios';

// Point to the actual backend API
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  // Skip JWT for auth endpoints
  if (config.url?.includes('/auth/signup') || config.url?.includes('/auth/login')) {
    return config;
  }
  
  const authState = localStorage.getItem('authState');
  if (authState) {
    try {
      const { token } = JSON.parse(authState);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to parse auth state:', e);
    }
  }
  return config;
});

// On 401 → clear state and redirect to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Guard against redirect loops
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('authState');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
