import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Don't attach token to auth endpoints
    if (config.url?.includes('/auth/signup') || config.url?.includes('/auth/login')) {
      return config;
    }

    const authState = localStorage.getItem('authState');
    if (authState) {
      try {
        const { token } = JSON.parse(authState);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Failed to parse auth state:', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      localStorage.removeItem('authState');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
