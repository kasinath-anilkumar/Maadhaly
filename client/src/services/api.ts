import axios from 'axios';

const normalizeApiUrl = (url?: string) => {
  const fallback = 'http://localhost:5000/api';
  const base = (url || fallback).replace(/\/+$/, '');
  return /\/api$/i.test(base) ? base : `${base}/api`;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; phone: string }) =>
    api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: Partial<{ name: string; phone: string; addresses: any[] }>) =>
    api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Product APIs
export const productAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getById: (id: string) => api.get(`/products/${id}`),
  getByCategory: (categoryId: string) =>
    api.get('/products', { params: { category: categoryId } }),
  search: (query: string) => api.get('/products', { params: { search: query } }),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
};

// Cart APIs (local storage based)
export const cartAPI = {
  getCart: () => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  },
  saveCart: (cart: any[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
  },
  addToCart: (product: any, quantity: number = 1) => {
    const cart = cartAPI.getCart();
    const existingItem = cart.find((item: any) => item.product._id === product._id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ product, quantity });
    }
    cartAPI.saveCart(cart);
    return cart;
  },
  removeFromCart: (productId: string) => {
    const cart = cartAPI.getCart().filter((item: any) => item.product._id !== productId);
    cartAPI.saveCart(cart);
    return cart;
  },
  updateQuantity: (productId: string, quantity: number) => {
    const cart = cartAPI.getCart();
    const item = cart.find((item: any) => item.product._id === productId);
    if (item) {
      item.quantity = quantity;
    }
    cartAPI.saveCart(cart);
    return cart;
  },
  clearCart: () => {
    localStorage.removeItem('cart');
  },
};

// Order APIs
export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getMyOrders: (params?: any) => api.get('/orders/my-orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string, reason: string) =>
    api.put(`/orders/${id}/cancel`, { reason }),
};

// Payment APIs
export const paymentAPI = {
  createOrder: (orderId: string) =>
    api.post('/payment/create-order', { orderId }),
  verify: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) => api.post('/payment/verify', data),
  getKey: () => api.get('/payment/key'),
};

// Wishlist APIs
export const wishlistAPI = {
  getAll: () => api.get('/users/wishlist'),
  add: (productId: string) => api.post(`/users/wishlist/${productId}`),
  remove: (productId: string) => api.delete(`/users/wishlist/${productId}`),
};

export default api;
