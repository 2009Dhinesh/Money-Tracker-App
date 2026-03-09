import api from './axios';

const goldApi = {
  getPrice: () => api.get('/api/gold/price'),
  getAssets: () => api.get('/api/gold'),
  addAsset: (data) => api.post('/api/gold', data),
  updateAsset: (id, data) => api.put(`/api/gold/${id}`, data),
  deleteAsset: (id) => api.delete(`/api/gold/${id}`),
  calculate: (amount, purity = '22K') => api.get(`/api/gold/calculate?amount=${amount}&purity=${purity}`),
};

export default goldApi;
