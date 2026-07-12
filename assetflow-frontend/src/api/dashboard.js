import apiClient from './client';

export const dashboardAPI = {
  getSummary: () => apiClient.get('/dashboard/summary'),
};
