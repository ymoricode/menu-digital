import axios from 'axios';

// API base URL - uses environment variable in production, /api in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Backend URL for static files (images) - same origin in production
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// Helper to get full image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('blob:')) return path;
  // In production, images are served from Cloudinary or external URL
  // In development, prepend backend URL
  return BACKEND_URL ? `${BACKEND_URL}${path}` : path;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if on admin pages
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========================
// AUTH API
// ========================
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  register: (data) => api.post('/auth/register', data),
};

// ========================
// MENU API (Customer)
// ========================
export const menuAPI = {
  getAll: (params) => api.get('/menus', { params }),
  getById: (id) => api.get(`/menus/${id}`),
  getCategories: () => api.get('/menus/categories'),
};

// ========================
// FOODS API (Admin)
// ========================
export const foodsAPI = {
  getAll: () => api.get('/foods'),
  getById: (id) => api.get(`/foods/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/foods', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/foods/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/foods/${id}`),
};

// ========================
// CATEGORIES API
// ========================
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ========================
// BARCODES API
// ========================
export const barcodesAPI = {
  getAll: () => api.get('/barcodes'),
  getById: (id) => api.get(`/barcodes/${id}`),
  getByTableNumber: (tableNumber) => api.get(`/barcode/table/${tableNumber}`),
  create: (data) => api.post('/barcodes', data),
  regenerate: (id) => api.post(`/barcodes/${id}/regenerate`),
  delete: (id) => api.delete(`/barcodes/${id}`),
};

// ========================
// TRANSACTIONS API
// ========================
export const transactionsAPI = {
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  getByExternalId: (externalId) => api.get(`/transactions/status/${externalId}`),
  syncPaymentStatus: (externalId) => api.post(`/transactions/sync/${externalId}`),
  create: (data) => api.post('/transactions', data),
  export: () => api.get('/transactions/export', { responseType: 'blob' }),

  // ── NEW: Order completion ──
  complete: (id) => api.patch(`/transactions/${id}/complete`),

  // ── NEW: Cancel order ──
  cancel: (id) => api.patch(`/transactions/${id}/cancel`),

  // ── NEW: Check table status before ordering ──
  checkTableStatus: (barcodeId) => api.get(`/transactions/table-status/${barcodeId}`),
};

// ========================
// DASHBOARD API
// ========================
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getTopProducts: (limit) => api.get('/dashboard/top-products', { params: { limit } }),
  getMonthlyIncome: (year) => api.get('/dashboard/monthly-income', { params: { year } }),
  getWeeklyIncome: () => api.get('/dashboard/weekly-income'),
  getRecentTransactions: (limit) => api.get('/dashboard/recent-transactions', { params: { limit } }),
};

export default api;
