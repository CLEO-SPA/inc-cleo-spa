import axios from 'axios';
import { getBrowserTimezone, transformRequestDates, transformResponseDates } from '@/utils/timezoneUtils';

const url = process.env.NODE_ENV === 'production' ? '' : import.meta.env.VITE_API_URL + '/api';

console.log(url);

export const apiClient = axios.create({
  baseURL: url,
  withCredentials: true,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

apiClient.interceptors.request.use(
  (config) => {
    const localDateTime = getBrowserTimezone();

    if (config.data instanceof FormData) {
      // console.log(
      //   '[Interceptor] Request data IS FormData. Headers before sending:',
      //   JSON.parse(JSON.stringify(config.headers))
      // );
    } else if (config.data) {
      // console.log('[Interceptor] Request data is NOT FormData. Applying transformations.');
      const localDateTime = getBrowserTimezone();
      config.data = transformRequestDates(config.data, localDateTime);
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
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

apiClient.interceptors.response.use(
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
      window.dispatchEvent(new CustomEvent('auth-error-401'));
    }

    return Promise.reject(error);
  }
);

getBrowserTimezone();

export default apiClient;
