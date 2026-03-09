import api from './axios';

const landApi = {
  getAssets: () => api.get('/api/land'),
  addAsset: (data) => api.post('/api/land', data),
  updateAsset: (id, data) => api.put(`/api/land/${id}`, data),
  deleteAsset: (id) => api.delete(`/api/land/${id}`),
};

export default landApi;
