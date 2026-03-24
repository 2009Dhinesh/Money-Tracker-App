import axios from './axios';

const familyApi = {
  createFamily: async (data) => {
    return await axios.post('/api/family', data);
  },
  requestToJoin: async (inviteCode) => {
    return await axios.post('/api/family/join', { inviteCode });
  },
  getJoinRequests: async () => {
    return await axios.get('/api/family/requests');
  },
  handleJoinRequest: async (id, data) => {
    return await axios.put(`/api/family/requests/${id}`, data);
  },
  getFamilyMembers: async () => {
    return await axios.get('/api/family/members');
  },
  getMemberDetails: async (id) => {
    return await axios.get(`/api/family/members/${id}`);
  },
  getFamilyReport: async () => {
    return await axios.get('/api/family/report');
  },
  getMyFamilyCode: async () => {
    return await axios.get('/api/family/code');
  },
  searchUserByCode: async (code) => {
    return await axios.get(`/api/family/search/${code}`);
  },
  connectMember: async (targetUserId) => {
    return await axios.post('/api/family/connect', { targetUserId });
  },
  getConnectionRequests: async () => {
    return await axios.get('/api/family/connect/requests');
  },
  handleConnectionRequest: async (requestId, status) => {
    return await axios.put(`/api/family/connect/requests/${requestId}`, { status });
  },
  updatePermissions: async (targetUserId, accessType, accounts) => {
    return await axios.put(`/api/family/permissions/${targetUserId}`, { accessType, accounts });
  },
  disconnectMember: async (id) => {
    return await axios.delete(`/api/family/member/${id}`);
  },
};

export default familyApi;
