import api from './axios';

export const paymentMethodApi = {
  getAll: (params) => api.get('/api/payment-methods', { params }),
  create: (data) => api.post('/api/payment-methods', data),
  update: (id, data) => api.put(`/api/payment-methods/${id}`, data),
  delete: (id) => api.delete(`/api/payment-methods/${id}`),
};

export default paymentMethodApi;
