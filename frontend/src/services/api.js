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
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const consumerService = {
  getAll: async () => {
    const response = await api.get('/consumers/');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/consumers/${id}`);
    return response.data;
  },
  create: async (consumerData) => {
    const response = await api.post('/consumers/', consumerData);
    return response.data;
  }
};

export const dataService = {
  getHistory: async (consumerId, limit = 96) => {
    const response = await api.get(`/data/history/${consumerId}?limit=${limit}`);
    return response.data;
  },
  simulateStep: async () => {
    const response = await api.post('/data/simulate-step');
    return response.data;
  },
  ingestCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/data/ingest', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export const forecastService = {
  getForecast: async (consumerId, model = 'xgboost', horizon = 96) => {
    const response = await api.get(`/forecast/${consumerId}?model=${model}&horizon=${horizon}`);
    return response.data;
  },
  getComparison: async (consumerId) => {
    const response = await api.get(`/forecast/compare/${consumerId}`);
    return response.data;
  },
  getMetrics: async (consumerId) => {
    const response = await api.get(`/forecast/metrics/${consumerId}`);
    return response.data;
  },
  runEvaluation: async (consumerId) => {
    const response = await api.post(`/forecast/run-evaluation/${consumerId}`);
    return response.data;
  }
};

export const anomalyService = {
  getAll: async (consumerId = null, status = null) => {
    let url = '/anomalies/';
    const params = [];
    if (consumerId !== null) params.push(`consumer_id=${consumerId}`);
    if (status !== null) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const response = await api.get(url);
    return response.data;
  },
  triggerDetection: async (consumerId) => {
    const response = await api.post(`/anomalies/detect/${consumerId}`);
    return response.data;
  },
  getMetrics: async (consumerId) => {
    const response = await api.get(`/anomalies/metrics/${consumerId}`);
    return response.data;
  },
  updateStatus: async (anomalyId, status) => {
    const response = await api.put(`/anomalies/${anomalyId}`, { status });
    return response.data;
  }
};

export const carbonService = {
  getSummary: async (consumerId = null, period = 'daily', startDate = null, endDate = null) => {
    let url = `/carbon/summary?period=${period}`;
    if (consumerId !== null) url += `&consumer_id=${consumerId}`;
    if (startDate && endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await api.get(url);
    return response.data;
  }
};

export const optimizeService = {
  getRecommendations: async (consumerId = null, status = null) => {
    let url = '/optimize/recommendations';
    const params = [];
    if (consumerId !== null) params.push(`consumer_id=${consumerId}`);
    if (status !== null) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const response = await api.get(url);
    return response.data;
  },
  triggerRecommendations: async (consumerId) => {
    const response = await api.post(`/optimize/generate/${consumerId}`);
    return response.data;
  },
  updateStatus: async (actionId, status) => {
    const response = await api.put(`/optimize/${actionId}`, { status });
    return response.data;
  },
  getRlTraining: async (episodes = 1000) => {
    const response = await api.get(`/optimize/rl-training?episodes=${episodes}`);
    return response.data;
  }
};

export default api;
