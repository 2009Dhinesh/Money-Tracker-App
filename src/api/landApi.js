import api from './axios';

const landApi = {
  getAssets: () => api.get('/land'),
  addAsset: (data) => api.post('/land', data),
  updateAsset: (id, data) => api.put(`/land/${id}`, data),
  deleteAsset: (id) => api.delete(`/land/${id}`),
};

export default landApi;
