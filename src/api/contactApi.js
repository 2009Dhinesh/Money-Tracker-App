import api from './axios';

const contactApi = {
  getContacts: (params) => api.get('/contacts', { params }),
  createContact: (data) => api.post('/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
};

export default contactApi;
