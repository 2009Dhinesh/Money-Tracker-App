import api from './axios';

const metalApi = {
  getPrices: () => api.get('/metals/prices'),
  getHistory: (days = 7, metalType) =>
    api.get(`/metals/history?days=${days}${metalType ? `&metalType=${metalType}` : ''}`),
  getAssets: (metalType) => api.get(`/metals${metalType ? `?metalType=${metalType}` : ''}`),
  addAsset: (data) => api.post('/metals', data),
  updateAsset: (id, data) => api.put(`/metals/${id}`, data),
  deleteAsset: (id) => api.delete(`/metals/${id}`),
  calculate: (amount, metalType = 'gold', purity) =>
    api.get(`/metals/calculate?amount=${amount}&metalType=${metalType}${purity ? `&purity=${purity}` : ''}`),
};

export default metalApi;
