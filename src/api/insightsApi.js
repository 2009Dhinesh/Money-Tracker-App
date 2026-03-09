import api from './axios';

const insightsApi = {
  getInsights: async () => {
    const response = await api.get('/api/insights');
    return response.data;
  },
};

export default insightsApi;
