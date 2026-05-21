import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://8gjmtxp2-8080.inc1.devtunnels.ms/api',
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Create a persistent device ID if it doesn't exist
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    config.headers['X-Device-ID'] = deviceId;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
