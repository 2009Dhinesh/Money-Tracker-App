import api from './axios';

const accountApi = {
  getAccounts: () => api.get('/accounts'),
  getAccount: (id) => api.get(`/accounts/${id}`),
  createAccount: (data) => api.post('/accounts', data),
  updateAccount: (id, data) => api.put(`/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
};

export default accountApi;
