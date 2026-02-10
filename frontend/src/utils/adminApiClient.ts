/**
 * Centralized API Client for Admin Endpoints
 *
 * This client ensures proper token handling for all admin API calls
 * Prevents issues with empty token strings or "Bearer..." literals
 */

import { tokenManager } from '@/utils/tokenManager';
import { toast } from 'sonner';

class AdminAPIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  /**
   * Get valid token or throw error
   */
  private async getToken(): Promise<string> {
    // Try tokenManager first (preferred method)
    try {
      const tokenResult = await tokenManager.getValidTokenWithRefresh();
      if (tokenResult.isValid && tokenResult.token) {
        return tokenResult.token;
      }
    } catch (error) {
      console.warn('TokenManager failed, falling back to localStorage');
    }

    // Fallback to direct localStorage access
    const token = localStorage.getItem('access_token');

    // CRITICAL: Never use empty string as fallback
    if (!token || token === 'null' || token === 'undefined' || token === '') {
      throw new Error('No valid authentication token found');
    }

    // Validate token format (should be JWT with 3 parts)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }

    return token;
  }

  /**
   * Make authenticated API request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Get valid token
      const token = await this.getToken();

      // Make request with proper headers
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        // Try to refresh token
        try {
          const refreshedToken = await tokenManager.refreshToken();
          if (refreshedToken?.isValid && refreshedToken.token) {
            // Retry with new token
            const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
              ...options,
              headers: {
                'Authorization': `Bearer ${refreshedToken.token}`,
                'Content-Type': 'application/json',
                ...options.headers
              }
            });

            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }

        // Auth failed, redirect to login
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_tokens');
        window.location.href = '/auth/login';
        throw new Error('Authentication failed');
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      // Parse and return JSON
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);

      // If it's an auth error, show user-friendly message
      if (error instanceof Error && error.message.includes('authentication')) {
        toast.error('Please log in to continue');
        window.location.href = '/auth/login';
      }

      throw error;
    }
  }

  // User endpoints
  async getUserCredits(userId: string) {
    return this.request(`/api/v1/admin/simple/user/${userId}/credits`);
  }

  async getUser(userId: string) {
    return this.request(`/api/v1/admin/users/${userId}`);
  }

  async updateUser(userId: string, data: any) {
    return this.request(`/api/v1/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async getUsers(page = 1, pageSize = 50, search?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (search) params.append('search', search);

    return this.request(`/api/v1/admin/users?${params.toString()}`);
  }

  // Credit operations
  async adjustCredits(userId: string, amount: number, operation: 'add' | 'remove', reason: string) {
    const endpoint = operation === 'add'
      ? '/api/v1/admin/superadmin/credits/add'
      : '/api/v1/admin/superadmin/credits/remove';

    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        credits: amount,  // Fixed: was 'amount', should be 'credits'
        reason: reason    // Fixed: was 'description', should be 'reason'
      })
    });
  }

  // User creation
  async createManagedUser(userData: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    company?: string;
  }) {
    return this.request('/api/v1/auth/admin/create-managed-user', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Dashboard stats
  async getDashboardStats() {
    return this.request('/api/v1/admin/dashboard/stats');
  }

  // Transaction history
  async getCreditTransactions(userId: string, page = 1, pageSize = 50) {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    return this.request(`/api/v1/admin/billing/transactions?${params.toString()}`);
  }

  // Activity log
  async getUserActivity(userId: string, page = 1, pageSize = 50) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    return this.request(`/api/v1/admin/users/${userId}/activity?${params.toString()}`);
  }
}

// Export singleton instance
export const adminApiClient = new AdminAPIClient();
export default adminApiClient;