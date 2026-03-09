import api from './axios';

const debtApi = {
  getDebts: (params) => api.get('/api/debts', { params }),
  getDebt: (id) => api.get(`/api/debts/${id}`),
  createDebt: (data) => api.post('/api/debts', data),
  addRepayment: (id, data) => api.post(`/api/debts/${id}/repay`, data),
  deleteDebt: (id) => api.delete(`/api/debts/${id}`),
  getSummary: () => api.get('/api/debts/summary'),
};

export default debtApi;
