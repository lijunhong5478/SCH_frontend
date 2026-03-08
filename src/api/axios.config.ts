import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8080'),
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      // Let browser set multipart/form-data with boundary automatically.
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Content-Type', undefined);
      } else if (config.headers) {
        delete (config.headers as Record<string, string>)['Content-Type'];
        delete (config.headers as Record<string, string>)['content-type'];
      }
    }

    const authStore = useAuthStore();
    const storeToken = authStore.token;
    const persistedToken = localStorage.getItem('token');
    const token = storeToken || persistedToken;

    // 页面刷新后，优先从localStorage恢复到store，保证状态一致
    if (!storeToken && persistedToken) {
      authStore.setToken(persistedToken);
    }

    if (token) {
      // 根据后端JWT拦截器，使用token头部而不是Authorization
      config.headers.token = token;
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回后端数据，而不是完整的axios响应
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      const authStore = useAuthStore();
      authStore.logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;