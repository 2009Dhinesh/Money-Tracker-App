import api from './axios';

const goldApi = {
  getPrice: () => api.get('/gold/price'),
  getAssets: () => api.get('/gold'),
  addAsset: (data) => api.post('/gold', data),
  updateAsset: (id, data) => api.put(`/gold/${id}`, data),
  deleteAsset: (id) => api.delete(`/gold/${id}`),
  calculate: (amount, purity = '22K') => api.get(`/gold/calculate?amount=${amount}&purity=${purity}`),
};

export default goldApi;
