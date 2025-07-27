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

  getRefundDate: (packageId) => 
    api.get(`api/refund/${packageId}/refund-date`)
      .then(response => response.data)
      .catch(error => {
        console.log("Package ID is " + packageId);
        console.error('[GET REFUND DATE FAILED REFUNDSERVICE.JS]', error.response?.data || error.message);
        throw error;
      }),

  processRefund: (packageId, remarks, refundDate) => {
    return api.post('api/refund/mcp', {
      mcpId: packageId,
      refundRemarks: remarks,
      refundDate: refundDate ? refundDate.toISOString() : null
    }, {
      withCredentials: true
    }).catch(error => {
      console.error('[REFUND FAILED]', error.response?.data || error.message);
      throw error;
    });
  },

  processPartialRefund: (data) => {
  // Prepare the payload exactly as backend expects
  const payload = {
    mcpId: Number(data.mcpId),
    refundedBy: Number(data.refundedBy),
    refundRemarks: data.refundRemarks,
    refundDate: data.refundDate ? formatBackendDate(data.refundDate) : null,
    refundItems: data.refundItems.map(item => ({
      detail_id: Number(item.detail_id),
      quantity: Number(item.quantity)
    })),
    additionalBalanceRefund: Number(data.additionalBalanceRefund) || 0
  };

  console.log('Sending refund payload:', payload); // Debug log

  return api.post('api/refund/mcp/partial', payload, {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }).catch(error => {
    console.error('[PARTIAL REFUND FAILED]', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  });
},

// Add this new method
listMembers: (page = 1, limit = 10) =>
  api.get(`api/refund/members/list?page=${page}&limit=${limit}`)
    .then(response => response.data),

};