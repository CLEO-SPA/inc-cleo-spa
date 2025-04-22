import axios from 'axios';

export const createApiInstance = (baseURL) => {
  const url = process.env.NODE_ENV === 'production' ? '' : baseURL;

  return axios.create({
    baseURL: url + '/api',
    withCredentials: true,
  });
};

export const setupInterceptors = (apiInstance) => {
  apiInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response && error.response.status === 401) {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }
  );
};

const api = createApiInstance(import.meta.env.VITE_API_URL);

setupInterceptors(api);

export { api };
