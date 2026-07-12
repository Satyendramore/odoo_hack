import apiClient from './client';

export const assetsAPI = {
  // Asset endpoints
  getAssets: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.location) params.append('location', filters.location);
    if (filters.department) params.append('department', filters.department);
    return apiClient.get(`/assets?${params.toString()}`);
  },
  getAssetById: (id) => apiClient.get(`/assets/${id}`),
  createAsset: (data) => apiClient.post('/assets', data),
  updateAssetStatus: (id, status) => apiClient.patch(`/assets/${id}/status`, { status }),

  // Categories
  getCategories: () => apiClient.get('/admin/categories'),
  getCategoryById: (id) => apiClient.get(`/admin/categories/${id}`),
  createCategory: (data) => apiClient.post('/admin/categories', data),
  updateCategory: (id, data) => apiClient.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/admin/categories/${id}`),

  // Allocations
  allocateAsset: (data) => apiClient.post('/allocations', data),
  returnAsset: (id, data) => apiClient.post(`/allocations/${id}/return`, data),
  getAllocationHistory: (assetId) => apiClient.get(`/allocations/asset/${assetId}/history`),
  getOverdueReturns: () => apiClient.get('/allocations/overdue'),

  // Transfer requests
  requestTransfer: (data) => apiClient.post('/allocations/transfer-request', data),
  getTransferRequests: (status = 'REQUESTED') => apiClient.get(`/transfer-requests?status=${status}`),
  approveTransfer: (id, data) => apiClient.patch(`/transfer-requests/${id}/approve`, data),
  rejectTransfer: (id, data) => apiClient.patch(`/transfer-requests/${id}/reject`, data),

  // Bookings
  getBookings: (assetId) => apiClient.get(`/bookings/asset/${assetId}`),
  getMyBookings: () => apiClient.get('/bookings/my/upcoming'),
  createBooking: (data) => apiClient.post('/bookings', data),
  cancelBooking: (id) => apiClient.patch(`/bookings/${id}/cancel`),
  rescheduleBooking: (id, data) => apiClient.patch(`/bookings/${id}/reschedule`, data),

  // Maintenance
  raiseMaintenance: (data) => apiClient.post('/maintenance', data),
  getMaintenanceHistory: (assetId) => apiClient.get(`/maintenance/asset/${assetId}`),
  approveMaintenance: (id, data) => apiClient.patch(`/maintenance/${id}/approve`, data),
  rejectMaintenance: (id, data) => apiClient.patch(`/maintenance/${id}/reject`, data),
  resolveMaintenance: (id, data) => apiClient.patch(`/maintenance/${id}/resolve`, data),
};
