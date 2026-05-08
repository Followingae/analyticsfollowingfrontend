// DEPRECATED: Prefer @/services/superadminApi (SuperadminApiService) for new code.
// This file is the legacy axios-based API layer. Consumers still using it:
//   - SuperadminDashboard.tsx, EditUserModal.tsx, SuperadminBilling.tsx,
//     SuperadminUserManagement.tsx, SuperadminUserManagementClean.tsx,
//     admin/users/create/page.tsx
// Migration plan: move unique methods to @/services/superadminApi, then
// update all consumers and delete this file.
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { tokenManager } from '@/utils/tokenManager';

// Create axios instance for superadmin API calls
const SuperadminAPI = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
SuperadminAPI.interceptors.request.use(
  async (config) => {
    try {
      // Get valid token (with automatic refresh if needed)
      const tokenResult = await tokenManager.getValidTokenWithRefresh();

      if (tokenResult.isValid && tokenResult.token) {
        config.headers.Authorization = `Bearer ${tokenResult.token}`;
      }
    } catch (error) {
      console.error('Failed to get auth token for superadmin request:', error)
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and retry
SuperadminAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 errors (forbidden - token might be expired)
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const tokenResult = await tokenManager.refreshToken();

        if (tokenResult?.isValid && tokenResult.token) {
          // Update the authorization header with new token
          originalRequest.headers.Authorization = `Bearer ${tokenResult.token}`;
          // Retry the original request
          return SuperadminAPI(originalRequest);
        }
      } catch (refreshError) {
        console.error('Superadmin API token refresh failed (403):', refreshError)
      }
    }

    // Handle 401 errors (unauthorized - need to login)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token first
      try {
        const tokenResult = await tokenManager.refreshToken();

        if (tokenResult?.isValid && tokenResult.token) {
          originalRequest.headers.Authorization = `Bearer ${tokenResult.token}`;
          return SuperadminAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenManager.clearAllTokens();
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

// Superadmin API Services
export const superadminService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    const response = await SuperadminAPI.get('/api/v1/admin/dashboard/stats');
    return response.data;
  },

  // System Health
  getSystemHealth: async () => {
    const response = await SuperadminAPI.get('/api/v1/admin/system/health');
    return response.data;
  },

  // User Management
  getUsers: async (page = 1, pageSize = 50, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (search) params.append('search', search);

    const response = await SuperadminAPI.get(`/api/v1/admin/users?${params.toString()}`);
    return response.data;
  },

  updateUser: async (userId: string, data: any) => {
    const response = await SuperadminAPI.put(`/api/v1/admin/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await SuperadminAPI.delete(`/api/v1/admin/users/${userId}`);
    return response.data;
  },

  setPassword: async (userId: string, password: string) => {
    const response = await SuperadminAPI.post(`/api/v1/admin/users/${userId}/set-password`, {
      password: password
    });
    return response.data;
  },

  // Credit Management - Using CORRECT endpoints
  addCredits: async (userId: string, amount: number, reason: string) => {
    const response = await SuperadminAPI.post('/api/v1/admin/credits/add', {
      user_id: userId,  // Include user_id in body, not in URL
      credits: amount,
      reason: reason
    });
    return response.data;
  },

  removeCredits: async (userId: string, amount: number, reason: string) => {
    const response = await SuperadminAPI.post('/api/v1/admin/credits/remove', {
      user_id: userId,  // Include user_id in body, not in URL
      credits: amount,
      reason: reason
    });
    return response.data;
  },

  getCreditBalance: async (userId: string) => {
    const response = await SuperadminAPI.get(`/api/v1/credits/admin/user/${userId}/balance`);
    return response.data;
  },

  getCreditTransactions: async (userId: string, page = 1, pageSize = 50) => {
    const response = await SuperadminAPI.get(`/api/v1/credits/transactions?user_id=${userId}&page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  getWalletSummary: async (userId: string) => {
    const response = await SuperadminAPI.get(`/api/v1/credits/admin/user/${userId}/wallet-summary`);
    return response.data;
  },

  getMonthlyUsage: async (userId: string) => {
    const response = await SuperadminAPI.get(`/api/v1/credits/admin/user/${userId}/usage`);
    return response.data;
  },

  // Billing & Revenue
  getTransactions: async (page = 1, pageSize = 50, userId?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (userId) params.append('user_id', userId);

    const response = await SuperadminAPI.get(`/api/v1/admin/billing/transactions?${params.toString()}`);
    return response.data;
  },

  getRevenueSummary: async (months = 6) => {
    const response = await SuperadminAPI.get(`/api/v1/admin/billing/revenue?months=${months}`);
    return response.data;
  },

  // Content Management
  getProfiles: async (page = 1, pageSize = 50, search?: string, incompleteOnly?: boolean) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (search) params.append('search', search);
    if (incompleteOnly) params.append('incomplete_only', 'true');

    const response = await SuperadminAPI.get(`/api/v1/admin/content/profiles?${params.toString()}`);
    return response.data;
  },

  getUnlocks: async (page = 1, pageSize = 50, userId?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (userId) params.append('user_id', userId);

    const response = await SuperadminAPI.get(`/api/v1/admin/content/unlocks?${params.toString()}`);
    return response.data;
  },

};

export default SuperadminAPI;