import api from './axios';

const insightsApi = {
  getInsights: async (params) => {
    const response = await api.get('/api/insights', { params });
    return response;
  },
};

export default insightsApi;
