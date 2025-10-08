import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
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

// Teams API
export const teamsAPI = {
  getAll: () => api.get('/teams/'),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams/', data),
  initialize: () => api.post('/teams/initialize'),
  getMaxBidLimit: (id) => api.get(`/teams/${id}/max-bid-limit`),
};

// Players API
export const playersAPI = {
  getAll: (params) => api.get('/players/', { params }),
  getById: (id) => api.get(`/players/${id}`),
  create: (data) => api.post('/players/', data),
  update: (id, data) => api.put(`/players/${id}`, data),
  delete: (id) => api.delete(`/players/${id}`),
  getAvailableCount: () => api.get('/players/available/count'),
  markAvailable: (id) => api.post(`/players/${id}/mark-available`),
};

// Auction API
export const auctionAPI = {
  getCurrent: () => api.get('/auction/current'),
  start: () => api.post('/auction/start'),
  placeBid: (data) => api.post('/auction/bid', data),
  markSold: () => api.post('/auction/sold'),
  markUnsold: () => api.post('/auction/unsold'),
  getBidHistory: (playerId) => api.get(`/auction/history/${playerId}`),
  editLastBid: (data) => api.put('/auction/edit-last-bid', null, { params: data }),
  getRandomPlayer: () => api.post('/auction/next-random'),
  resetAuction: () => api.post('/auction/reset'),
};

// Registration API
export const registrationAPI = {
  register: (data) => api.post('/registration/register', data),
  checkEmail: (email) => api.get(`/registration/check-email/${email}`),
  checkCricheroes: (id) => api.get(`/registration/check-cricheroes/${id}`),
  completeRegistration: (playerId) => api.post(`/registration/complete-registration/${playerId}`),
};

// Payments API (Razorpay UPI)
export const paymentsAPI = {
  createOrder: (playerId) => api.post('/payments/create-order', null, {
    params: { player_id: playerId }
  }),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
  getPaymentStatus: (orderId) => api.get(`/payments/status/${orderId}`),
  getPlayerPaymentStatus: (playerId) => api.get(`/payments/${playerId}/player-status`),
};

export default api;
