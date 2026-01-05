import axios from 'axios';
import { API_URL } from './api';

// Set the base URL for all axios requests
axios.defaults.baseURL = API_URL;

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if the request was to a protected route
      // Skip auto-logout for login/signup attempts
      const url = error.config?.url || '';
      const isAuthRoute = url.includes('/login') || url.includes('/signup') || url.includes('/send-otp') || url.includes('/verify-otp');
      
      if (!isAuthRoute) {
        // Token expired or invalid - clear storage and redirect
        localStorage.clear();
        // Show a message before redirecting
        if (!window.location.pathname.includes('/login')) {
          alert('Your session has expired. Please login again.');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
