import api from './axios';

const wealthApi = {
  getDashboard: () => api.get('/api/wealth/dashboard'),
};

export default wealthApi;
