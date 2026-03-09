import api from './axios';

const goalApi = {
  getGoals: () => api.get('/api/goals'),
  createGoal: (data) => api.post('/api/goals', data),
  updateGoal: (id, data) => api.put(`/api/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/api/goals/${id}`),
  addFunds: (id, amount, accountId, paymentMethodId) => api.patch(`/api/goals/${id}/add-funds`, { amount, accountId, paymentMethodId }),
  withdrawFunds: (id, amount, accountId, paymentMethodId) => api.patch(`/api/goals/${id}/withdraw-funds`, { amount, accountId, paymentMethodId }),
};

export default goalApi;
