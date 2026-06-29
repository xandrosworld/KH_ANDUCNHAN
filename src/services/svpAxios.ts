import axios from 'axios';

export const svpAxios = axios.create({ baseURL: '/api/svp' });

svpAxios.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('svp_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

svpAxios.interceptors.response.use((response) => {
  if (response.data && response.data.ok === true && 'data' in response.data) {
    response.data = response.data.data;
  }
  return response;
});
