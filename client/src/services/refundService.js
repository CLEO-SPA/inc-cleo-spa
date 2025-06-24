import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// Enhanced cookie handling with debug logs
const getCookie = (name) => {
  console.log('[DEBUG] All cookies:', document.cookie);
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  const cookie = parts.length === 2 ? parts.pop().split(';').shift() : null;
  console.log(`[DEBUG] Cookie "${name}":`, cookie);
  return cookie;
};

const decodeToken = () => {
  const token = getCookie('rmb-token');
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[DEBUG] Decoded token payload:', payload);
      return payload;
    } catch (error) {
      console.error('Token decoding failed:', error);
    }
  }

  console.warn('⚠️ Using fallback user ID');
  return { user_id: 15 }; // Your test user ID
};

// Request interceptor for logging
api.interceptors.request.use(config => {
  console.log('[REQUEST]', {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers
  });
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => {
    console.log('[RESPONSE]', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('[API ERROR]', {
      config: error.config,
      response: error.response?.data,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);

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
    const user = decodeToken();
    const requestBody = {
      mcpId: packageId,
      refundedBy: user.user_id,
      refundRemarks: remarks
    };

    console.log('[DEBUG] Full refund request body:', requestBody);

    return api.post('api/refund/mcp', requestBody, {
      withCredentials: true
    }).catch(error => {
      console.error('[REFUND FAILED] Detailed error:', {
        request: error.config,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    });
  }
};