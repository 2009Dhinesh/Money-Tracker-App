import api from './axios';

const accountApi = {
  getAccounts: () => api.get('/api/accounts'),
  getArchivedAccounts: () => api.get('/api/accounts/archived'),
  getAccount: (id) => api.get(`/api/accounts/${id}`),
  createAccount: (data) => api.post('/api/accounts', data),
  updateAccount: (id, data) => api.put(`/api/accounts/${id}`, data),
  archiveAccount: (id) => api.put(`/api/accounts/${id}/archive`),
  unarchiveAccount: (id) => api.put(`/api/accounts/${id}/unarchive`),
  deleteAccount: (id) => api.delete(`/api/accounts/${id}`),
};

export default accountApi;
