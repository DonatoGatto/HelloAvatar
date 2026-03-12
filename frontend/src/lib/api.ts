import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ha_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('ha_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (dto: any) => api.post('/auth/register', dto).then((r) => r.data),
  login: (dto: any) => api.post('/auth/login', dto).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// ─── WORKSPACES ───────────────────────────────────────────────────────────────
export const workspacesApi = {
  getCurrent: () => api.get('/workspaces/current').then((r) => r.data),
  getUsage: () => api.get('/workspaces/current/usage').then((r) => r.data),
  getMembers: () => api.get('/workspaces/current/members').then((r) => r.data),
  update: (dto: any) => api.patch('/workspaces/current', dto).then((r) => r.data),
};

// ─── AVATARS ──────────────────────────────────────────────────────────────────
export const avatarsApi = {
  getStock: () => api.get('/avatars/stock').then((r) => r.data),
  addStock: (dto: any) => api.post('/avatars/stock', dto).then((r) => r.data),
  getAll: () => api.get('/avatars').then((r) => r.data),
  getOne: (id: string) => api.get(`/avatars/${id}`).then((r) => r.data),
  getUploadUrl: (fileName: string) => api.get(`/avatars/upload-url?fileName=${fileName}`).then((r) => r.data),
  createCustom: (dto: any) => api.post('/avatars/custom', dto).then((r) => r.data),
  checkStatus: (id: string) => api.get(`/avatars/${id}/status`).then((r) => r.data),
  update: (id: string, dto: any) => api.patch(`/avatars/${id}`, dto).then((r) => r.data),
  delete: (id: string) => api.delete(`/avatars/${id}`).then((r) => r.data),
  getVoices: () => api.get('/avatars/voices').then((r) => r.data),
};

// ─── VIDEOS ───────────────────────────────────────────────────────────────────
export const videosApi = {
  generate: (dto: any) => api.post('/videos/generate', dto).then((r) => r.data),
  getAll: () => api.get('/videos').then((r) => r.data),
  getOne: (id: string) => api.get(`/videos/${id}`).then((r) => r.data),
  getStatus: (id: string) => api.get(`/videos/${id}/status`).then((r) => r.data),
  delete: (id: string) => api.delete(`/videos/${id}`).then((r) => r.data),
};

// ─── STREAMING ────────────────────────────────────────────────────────────────
export const streamingApi = {
  getWidgets: () => api.get('/streaming/widgets').then((r) => r.data),
  createWidget: (dto: any) => api.post('/streaming/widgets', dto).then((r) => r.data),
  updateWidget: (id: string, dto: any) => api.patch(`/streaming/widgets/${id}`, dto).then((r) => r.data),
  deleteWidget: (id: string) => api.delete(`/streaming/widgets/${id}`).then((r) => r.data),
  getSessions: () => api.get('/streaming/sessions').then((r) => r.data),
};

// ─── BILLING ──────────────────────────────────────────────────────────────────
export const billingApi = {
  getPlan: () => api.get('/billing/plan').then((r) => r.data),
  createCheckout: (dto: any) => api.post('/billing/checkout', dto).then((r) => r.data),
  createPortal: (dto: any) => api.post('/billing/portal', dto).then((r) => r.data),
  getInvoices: () => api.get('/billing/invoices').then((r) => r.data),
};

// ─── API KEYS ─────────────────────────────────────────────────────────────────
export const apiKeysApi = {
  getAll: () => api.get('/api-keys').then((r) => r.data),
  create: (name: string) => api.post('/api-keys', { name }).then((r) => r.data),
  revoke: (id: string) => api.patch(`/api-keys/${id}/revoke`).then((r) => r.data),
  delete: (id: string) => api.delete(`/api-keys/${id}`).then((r) => r.data),
};
