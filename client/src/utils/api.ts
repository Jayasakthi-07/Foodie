import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Get API base URL from environment or use proxy
const getApiBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // If VITE_API_URL is set, use it directly (for network access)
    return `${apiUrl}/api`;
  }
  // Otherwise, use relative path (works with Vite proxy for local development)
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshUrl = getApiBaseURL() + '/auth/refresh';
        const response = await axios.post(refreshUrl, {}, { withCredentials: true });
        const { accessToken } = response.data.data;
        
        useAuthStore.getState().updateUser({ accessToken } as any);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

