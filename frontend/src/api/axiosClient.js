import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aether_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Unwrap standard API response envelope & handle auth expirations
axiosClient.interceptors.response.use(
  (response) => {
    // Backend standard structure: { success, message, data }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';

    if (error.response?.status === 401) {
      // If token expired or session terminated on another device/IP, purge local storage
      const currentToken = localStorage.getItem('aether_token');
      if (currentToken) {
        localStorage.removeItem('aether_token');
        localStorage.removeItem('aether_user');
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
