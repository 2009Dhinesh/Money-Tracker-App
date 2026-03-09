import api from './axios';

const metalApi = {
  getPrices: () => api.get('/api/metals/prices'),
  getHistory: (days = 7, metalType) =>
    api.get(`/api/metals/history?days=${days}${metalType ? `&metalType=${metalType}` : ''}`),
  getAssets: (metalType) => api.get(`/api/metals${metalType ? `?metalType=${metalType}` : ''}`),
  addAsset: (data) => api.post('/api/metals', data),
  updateAsset: (id, data) => api.put(`/api/metals/${id}`, data),
  deleteAsset: (id) => api.delete(`/api/metals/${id}`),
  calculate: (amount, metalType = 'gold', purity) =>
    api.get(`/api/metals/calculate?amount=${amount}&metalType=${metalType}${purity ? `&purity=${purity}` : ''}`),
};

export default metalApi;
