import axios from 'axios';
import { getBrowserTimezone, transformRequestDates, transformResponseDates } from '@/utils/timezoneUtils';

export const createApiInstance = (baseURL) => {
  const url = process.env.NODE_ENV === 'production' ? '' : baseURL;

  return axios.create({
    baseURL: url + '/api',
    withCredentials: true,
  });
};

export const setupInterceptors = (apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const localDateTime = getBrowserTimezone();

      if (config.data) {
        // console.log('Original request data:', config.data);
        config.data = transformRequestDates(config.data, localDateTime);
        // console.log('Transformed request data:', config.data);
      }

      if (config.params) {
        // console.log('Original request params:', config.params);
        config.params = transformRequestDates(config.params, localDateTime);
        // console.log('Transformed request params:', config.params);
      }

      return config;
    },
    (error) => {
      console.error('Request error in interceptor:', error);
      return Promise.reject(error);
    }
  );
  apiInstance.interceptors.response.use(
    (response) => {
      if (response.data) {
        // console.log('Original response data:', response.data);
        response.data = transformResponseDates(response.data);
        // console.log('Transformed response data:', response.data);
      }
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
getBrowserTimezone();

export { api };
