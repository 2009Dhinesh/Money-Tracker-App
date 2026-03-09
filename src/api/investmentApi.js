import api from './axios';

const investmentApi = {
  getAll: async () => {
    const response = await api.get('/api/investments');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/investments', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/investments/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/investments/${id}`);
    return response.data;
  },
};

export default investmentApi;
