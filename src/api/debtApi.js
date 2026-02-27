import api from './axios';

const debtApi = {
  getDebts: (params) => api.get('/debts', { params }),
  getDebt: (id) => api.get(`/debts/${id}`),
  createDebt: (data) => api.post('/debts', data),
  addRepayment: (id, data) => api.post(`/debts/${id}/repay`, data),
  deleteDebt: (id) => api.delete(`/debts/${id}`),
  getSummary: () => api.get('/debts/summary'),
};

export default debtApi;
