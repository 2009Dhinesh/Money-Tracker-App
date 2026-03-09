import api from './axios';

export const budgetApi = {
  getAll: (params) => api.get('/api/budgets', { params }),
  create: (data) => api.post('/api/budgets', data),
  update: (id, data) => api.put(`/api/budgets/${id}`, data),
  delete: (id) => api.delete(`/api/budgets/${id}`),
};

export default budgetApi;
