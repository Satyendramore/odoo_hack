import apiClient from './client';

export const adminAPI = {
  // Departments
  getDepartments: () => apiClient.get('/admin/departments'),
  getDepartmentById: (id) => apiClient.get(`/admin/departments/${id}`),
  createDepartment: (data) => apiClient.post('/admin/departments', data),
  updateDepartment: (id, data) => apiClient.put(`/admin/departments/${id}`, data),
  deactivateDepartment: (id) => apiClient.patch(`/admin/departments/${id}/deactivate`),

  // Employees
  getEmployees: () => apiClient.get('/admin/employees'),
  promoteEmployee: (id, role) => apiClient.patch(`/admin/employees/${id}/role`, { role }),
};
