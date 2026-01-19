/**
 * API Configuration
 * Central configuration for all API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('accessToken');
}

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

/**
 * API Service - Authentication
 */
export const authAPI = {
  signup: (email, password, name, role) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    }),

  signin: (email, password) =>
    apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getSession: () => apiRequest('/auth/session'),

  signout: () => apiRequest('/auth/signout', { method: 'POST' }),
};

/**
 * API Service - Cases
 */
export const caseAPI = {
  getCases: () => apiRequest('/cases'),

  createCase: (organNeeded, urgencyLevel, notes) =>
    apiRequest('/cases', {
      method: 'POST',
      body: JSON.stringify({ organNeeded, urgencyLevel, notes }),
    }),

  updateCase: (caseId, updates) =>
    apiRequest(`/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

/**
 * API Service - Donor
 */
export const donorAPI = {
  getProfile: () => apiRequest('/donor/profile'),

  updateConsent: (donorType, consentGiven) =>
    apiRequest('/donor/consent', {
      method: 'POST',
      body: JSON.stringify({ donorType, consentGiven }),
    }),
};

/**
 * API Service - Sponsor
 */
export const sponsorAPI = {
  fundCase: (caseId, amount) =>
    apiRequest('/sponsor/fund', {
      method: 'POST',
      body: JSON.stringify({ caseId, amount }),
    }),

  getStats: () => apiRequest('/sponsor/stats'),
};

/**
 * API Service - Admin
 */
export const adminAPI = {
  getPendingApprovals: () => apiRequest('/admin/pending'),

  approveUser: (userId) =>
    apiRequest('/admin/approve', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  getAuditLogs: () => apiRequest('/admin/audit'),

  getSystemStats: () => apiRequest('/admin/stats'),
};

/**
 * Store authentication token
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}
