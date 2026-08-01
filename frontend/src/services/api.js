import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (username, password) => {
    // Simple mock authentication for developer login
    if (username && password) {
      localStorage.setItem('token', 'mock_jwt_token');
      return { access_token: 'mock_jwt_token', token_type: 'bearer' };
    }
    throw new Error('Invalid username or password');
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  getMe: async () => {
    return { username: 'admin', displayName: 'Administrator', email: 'admin@ecowatt.ai' };
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const householdService = {
  getAll: async () => {
    const response = await api.get('/households');
    return response.data;
  },
  getCurrentConsumption: async (householdId) => {
    const response = await api.get(`/current-consumption/${householdId}`);
    return response.data;
  },
  getPrediction: async (householdId) => {
    const response = await api.get(`/predict/${householdId}`);
    return response.data;
  },
  getModelComparison: async () => {
    const response = await api.get('/model-comparison');
    return response.data;
  },
  getAlerts: async (householdId) => {
    const response = await api.get(`/alerts/${householdId}`);
    return response.data;
  },
  simulateStep: async () => {
    const response = await api.post('/data/simulate-step');
    return response.data;
  }
};

export default api;
