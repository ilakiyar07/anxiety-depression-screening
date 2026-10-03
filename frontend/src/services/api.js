/**
 * Centralized API Client with JWT Bearer authentication and error handling.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { error: 'Failed to parse server response.' };
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token on 401 session expiry
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    const error = new Error(data.error || 'Network request failed.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  getMe: () => apiRequest('/auth/me'),

  // Screenings
  getQuestions: () => apiRequest('/screenings/questions'),
  submitScreening: (payload) => apiRequest('/screenings', { method: 'POST', body: payload }),
  getScreenings: () => apiRequest('/screenings'),
  getScreeningById: (id) => apiRequest(`/screenings/${id}`),

  // Dashboard & Profile
  getDashboard: () => apiRequest('/dashboard'),
  getProfile: () => apiRequest('/profile'),
  updateProfile: (data) => apiRequest('/profile', { method: 'PUT', body: data }),
  updatePassword: (data) => apiRequest('/profile/password', { method: 'PUT', body: data }),

  // Admin
  getAdminStats: () => apiRequest('/admin/statistics'),
  getAdminUsers: () => apiRequest('/admin/users'),
  updateUserRole: (userId, role) => apiRequest(`/admin/users/${userId}/role`, { method: 'PUT', body: { role } })
};
