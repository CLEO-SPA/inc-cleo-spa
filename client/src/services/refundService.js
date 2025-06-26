import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

export default {
  // Member Operations
  searchMembers: (query) => 
    api.get(`api/refund/members/search?q=${query}`)
      .then(response => response.data),

  getMemberPackages: (memberId) => 
    api.get(`api/refund/members/get-mcps/${memberId}`)
      .then(response => response.data),

  // Package Operations  
  getPackageDetails: (packageId) => 
    api.get(`api/refund/mcp-status/${packageId}`)
      .then(response => response.data),

  fetchMCPStatus: (packageId) => 
    api.get(`api/refund/mcp-status/${packageId}`)
      .then(response => response.data),

  searchMemberCarePackages: (query, memberId = null) => {
    const url = memberId
      ? `api/refund/mcp/search?q=${query}&memberId=${memberId}`
      : `api/refund/mcp/search?q=${query}`;
    return api.get(url).then(response => response.data);
  },

  processRefund: (packageId, remarks) => {
    return api.post('api/refund/mcp', {
      mcpId: packageId,
      refundRemarks: remarks
      // No need for user ID anymore!
    }, {
      withCredentials: true // Ensures cookies are sent
    }).catch(error => {
      console.error('[REFUND FAILED]', error.response?.data || error.message);
      throw error;
    });
  }
};