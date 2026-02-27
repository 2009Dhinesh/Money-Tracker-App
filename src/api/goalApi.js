import api from './axios';

const goalApi = {
  getGoals: () => api.get('/goals'),
  createGoal: (data) => api.post('/goals', data),
  updateGoal: (id, data) => api.put(`/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  addFunds: (id, amount, accountId, paymentMethodId) => api.patch(`/goals/${id}/add-funds`, { amount, accountId, paymentMethodId }),
  withdrawFunds: (id, amount, accountId, paymentMethodId) => api.patch(`/goals/${id}/withdraw-funds`, { amount, accountId, paymentMethodId }),
};

export default goalApi;
