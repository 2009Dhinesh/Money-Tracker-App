import api from './axios';

const investmentApi = {
  getAll: async () => {
    const response = await api.get('/investments');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/investments', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/investments/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/investments/${id}`);
    return response.data;
  },
};

export default investmentApi;
