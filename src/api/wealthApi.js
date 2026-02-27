import api from './axios';

const wealthApi = {
  getDashboard: () => api.get('/wealth/dashboard'),
};

export default wealthApi;
