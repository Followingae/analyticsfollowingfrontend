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
      console.warn('Failed to get auth token:', error);
      // Continue without token - let server handle auth
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
        console.error('Token refresh failed:', refreshError);
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
    const response = await SuperadminAPI.get(`/api/v1/credits/balance?user_id=${userId}`);
    return response.data;
  },

  getCreditTransactions: async (userId: string, page = 1, pageSize = 50) => {
    const response = await SuperadminAPI.get(`/api/v1/credits/transactions?user_id=${userId}&page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  getWalletSummary: async (userId: string) => {
    const response = await SuperadminAPI.get(`/api/v1/credits/wallet/summary?user_id=${userId}`);
    return response.data;
  },

  getMonthlyUsage: async (userId: string) => {
    const response = await SuperadminAPI.get(`/api/v1/credits/usage/monthly?user_id=${userId}`);
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

  // HRM System - ALL REAL ENDPOINTS
  hrm: {
    // Employee Management
    // Validation endpoints
    checkEmployeeCode: async (code: string) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/employees/check-code/${code}`);
      return response.data;
    },

    checkEmployeeEmail: async (email: string) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/employees/check-email/${email}`);
      return response.data;
    },

    createEmployee: async (data: any) => {
      const response = await SuperadminAPI.post('/api/v1/hrm/employees', data);
      return response.data;
    },

    getEmployees: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/employees');
      return response.data;
    },

    getEmployee: async (employeeId: string) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/employees/${employeeId}`);
      return response.data;
    },

    updateEmployee: async (employeeId: string, data: any) => {
      const response = await SuperadminAPI.put(`/api/v1/hrm/employees/${employeeId}`, data);
      return response.data;
    },

    deleteEmployee: async (employeeId: string) => {
      const response = await SuperadminAPI.delete(`/api/v1/hrm/employees/${employeeId}`);
      return response.data;
    },

    uploadProfilePicture: async (employeeId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Use fetch instead of axios for file uploads to avoid Content-Type issues
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/hrm/employees/${employeeId}/upload-profile-picture`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type - browser will set it with boundary
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload profile picture');
      }

      return await response.json();
    },

    // Document Management
    uploadDocument: async (employeeId: string, documentData: any) => {
      const response = await SuperadminAPI.post(
        `/api/v1/hrm/employees/${employeeId}/upload-document`,
        documentData
      );
      return response.data;
    },

    getEmployeeDocuments: async (employeeId: string) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/employees/${employeeId}/documents`);
      return response.data;
    },

    getExpiringDocuments: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/documents/expiring-soon');
      return response.data;
    },

    // Salary Management
    recordSalaryIncrement: async (employeeId: string, data: any) => {
      const response = await SuperadminAPI.post(
        `/api/v1/hrm/employees/${employeeId}/salary-increment`,
        data
      );
      return response.data;
    },

    getSalaryHistory: async (employeeId: string) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/employees/${employeeId}/salary-history`);
      return response.data;
    },

    // Attendance Management
    uploadAttendanceCSV: async (file: File, month: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', month);
      const response = await SuperadminAPI.post('/api/v1/hrm/attendance/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },

    getMonthlyAttendance: async (employeeId: string, year: number, month: number) => {
      const response = await SuperadminAPI.get(
        `/api/v1/hrm/attendance/employee/${employeeId}/monthly?year=${year}&month=${month}`
      );
      return response.data;
    },

    getMonthlyReport: async (year: number, month: number) => {
      const response = await SuperadminAPI.get(
        `/api/v1/hrm/attendance/monthly-report?year=${year}&month=${month}`
      );
      return response.data;
    },

    // Timesheet Management
    generateTimesheet: async (employeeId: string) => {
      const response = await SuperadminAPI.post(`/api/v1/hrm/timesheets/generate/${employeeId}`);
      return response.data;
    },

    getCurrentMonthTimesheets: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/timesheets/current-month');
      return response.data;
    },

    getTimesheetsByMonth: async (year: number, month: number) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/timesheets/by-month/${year}/${month}`);
      return response.data;
    },

    approveTimesheet: async (timesheetId: string) => {
      const response = await SuperadminAPI.post(`/api/v1/hrm/timesheets/approve/${timesheetId}`);
      return response.data;
    },

    // Payroll Management
    calculatePayroll: async (employeeId: string) => {
      const response = await SuperadminAPI.post(`/api/v1/hrm/payroll/calculate/${employeeId}`);
      return response.data;
    },

    calculateAllPayroll: async (year: number, month: number) => {
      const response = await SuperadminAPI.post(`/api/v1/hrm/payroll/calculate/${year}/${month}`);
      return response.data;
    },

    getPendingPayroll: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/payroll/pending');
      return response.data;
    },

    processPayment: async (payrollId: string) => {
      const response = await SuperadminAPI.post(`/api/v1/hrm/payroll/process-payment/${payrollId}`);
      return response.data;
    },

    getPayslips: async (employeeId: string) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/payroll/payslips/${employeeId}`);
      return response.data;
    },

    getPayrollSummary: async (year: number, month: number) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/payroll/summary/${year}/${month}`);
      return response.data;
    },

    // Leave Management
    requestLeave: async (data: any) => {
      const response = await SuperadminAPI.post('/api/v1/hrm/leaves/request', data);
      return response.data;
    },

    getPendingLeaves: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/leaves/pending');
      return response.data;
    },

    approveLeave: async (leaveId: string) => {
      const response = await SuperadminAPI.post(`/api/v1/hrm/leaves/approve/${leaveId}`);
      return response.data;
    },

    rejectLeave: async (leaveId: string) => {
      const response = await SuperadminAPI.post(`/api/v1/hrm/leaves/reject/${leaveId}`);
      return response.data;
    },

    getLeaveBalance: async (employeeId: string) => {
      const response = await SuperadminAPI.get(`/api/v1/hrm/leaves/balance/${employeeId}`);
      return response.data;
    },

    getLeaveReport: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/leaves/report');
      return response.data;
    },

    // HRM Dashboard
    getHRMOverview: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/dashboard/overview');
      return response.data;
    },

    getAttendanceSummary: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/dashboard/attendance-summary');
      return response.data;
    },

    getPayrollSummaryDashboard: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/dashboard/payroll-summary');
      return response.data;
    },

    getEmployeeStatistics: async () => {
      const response = await SuperadminAPI.get('/api/v1/hrm/dashboard/employee-statistics');
      return response.data;
    }
  }
};

export default SuperadminAPI;