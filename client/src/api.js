import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = localStorage.getItem('velora_access_token');
let refreshRequest;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('velora_access_token', token);
  } else {
    localStorage.removeItem('velora_access_token');
  }
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const shouldRefresh = [401, 403].includes(error.response?.status)
      && !originalRequest?._retry
      && !originalRequest?.url?.includes('/auth/refresh-token')
      && !originalRequest?.url?.includes('/auth/login')
      && !originalRequest?.url?.includes('/auth/register');

    if (!shouldRefresh) {
      throw error;
    }

    originalRequest._retry = true;
    refreshRequest ||= api.post('/auth/refresh-token');

    try {
      const { data } = await refreshRequest;
      setAccessToken(data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      throw refreshError;
    } finally {
      refreshRequest = null;
    }
  },
);

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  refresh: () => api.post('/auth/refresh-token'),
  logout: () => api.post('/auth/logout'),
  changePassword: (payload) => api.patch('/auth/change-password', payload),
};

export const userApi = {
  me: () => api.get('/users/me'),
  updateMe: (payload) => api.patch('/users/me', payload),
};

export const catalogApi = {
  products: (params, signal) => api.get('/products', { params, signal }),
  product: (productId) => api.get(`/products/${productId}`),
  categories: () => api.get('/categories'),
};

export const adminProductApi = {
  create: (payload) => api.post('/products', payload),
  update: (productId, payload) => api.patch(`/products/${productId}`, payload),
  remove: (productId) => api.delete(`/products/${productId}`),
};

export const adminCategoryApi = {
  create: (payload) => api.post('/categories', payload),
  update: (categoryId, payload) => api.patch(`/categories/${categoryId}`, payload),
  remove: (categoryId) => api.delete(`/categories/${categoryId}`),
};

export const adminOrderApi = {
  all: (params) => api.get('/orders', { params }),
  updateStatus: (orderId, status) => api.patch(`/orders/${orderId}/status`, { status }),
};

export const analyticsApi = {
  totalSales: () => api.get('/analytics/total-sales'),
  totalOrders: () => api.get('/analytics/total-orders'),
};

export const adminUserApi = {
  all: (params) => api.get('/users', { params }),
  update: (userId, payload) => api.patch(`/users/${userId}`, payload),
  toggleStatus: (userId) => api.patch(`/users/${userId}/status`),
};

export const cartApi = {
  get: () => api.get('/cart'),
  add: (payload) => api.post('/cart/items', payload),
  update: (itemId, payload) => api.patch(`/cart/items/${itemId}`, payload),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`),
  sync: (localItems) => api.post('/cart/sync', { localItems }),
  clear: () => api.delete('/cart'),
};

export const orderApi = {
  create: () => api.post('/orders'),
  mine: () => api.get('/orders/me'),
  get: (orderId) => api.get(`/orders/${orderId}`),
  cancel: (orderId) => api.patch(`/orders/${orderId}`),
};

export default api;
