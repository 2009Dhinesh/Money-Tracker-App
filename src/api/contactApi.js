import api from './axios';

const contactApi = {
  getContacts: (params) => api.get('/api/contacts', { params }),
  createContact: (data) => api.post('/api/contacts', data),
  updateContact: (id, data) => api.put(`/api/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/api/contacts/${id}`),
};

export default contactApi;
