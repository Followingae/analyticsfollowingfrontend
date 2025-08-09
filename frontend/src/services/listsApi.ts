import { getAuthHeaders, API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Types for the Lists API
export interface List {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  creator_count: number
  created_at: string
  updated_at: string
  position: number
  is_pinned?: boolean
}

export interface ListItem {
  id: string
  list_id: string
  profile_username: string
  position: number
  notes?: string
  tags?: string[]
  color_label?: string
  is_pinned?: boolean
  added_at: string
}

export interface CreateListRequest {
  name: string
  description?: string
  color: string
  icon?: string
}

export interface UpdateListRequest {
  name?: string
  description?: string
  color?: string
  icon?: string
  position?: number
  is_pinned?: boolean
}

export interface AddProfileToListRequest {
  profile_id: string
  position?: number
  notes?: string
  tags?: string[]
  color_label?: string
  is_pinned?: boolean
}

export interface BulkAddProfilesRequest {
  profile_usernames: string[]
  position?: number
}

export interface ReorderListRequest {
  items: Array<{
    id: string
    position: number
  }>
}

export interface AvailableProfile {
  username: string
  full_name: string
  profile_pic_url: string
  followers_count: number
  engagement_rate: number
  is_verified: boolean
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ListsPaginatedResponse {
  lists: List[]
  pagination: {
    page?: number
    total_pages?: number
    has_next?: boolean
    total?: number
  }
}

export class ListsApiService {
  // Core List Management
  async getAllLists(): Promise<ApiResponse<List[] | ListsPaginatedResponse>> {
    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.lists.getAll}`
    
    try {
      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || data.message || `HTTP ${response.status}: ${response.statusText}` }
      }

      // Handle backend response format: {success: true, data: [...], message: null}
      if (data.success && data.data) {
        return { success: true, data: data.data }
      } else if (data.success) {
        // If successful but no data field, assume the entire response is the data
        return { success: true, data: data }
      } else {
        return { success: false, error: data.message || 'Backend returned unsuccessful response' }
      }
    } catch (error) {
      return { success: false, error: 'Network error while fetching lists' }
    }
  }

  async createList(listData: CreateListRequest): Promise<ApiResponse<List>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.create}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(listData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || data.message || 'Failed to create list' }
      }

      // Handle backend response format
      if (data.success && data.data) {
        return { success: true, data: data.data }
      } else if (data.success) {
        return { success: true, data: data }
      } else {
        return { success: false, error: data.message || 'Backend returned unsuccessful response' }
      }
    } catch (error) {
      return { success: false, error: 'Network error while creating list' }
    }
  }

  async updateList(listId: string, updates: UpdateListRequest): Promise<ApiResponse<List>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.update(listId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || data.message || 'Failed to update list' }
      }

      // Handle backend response format
      if (data.success && data.data) {
        return { success: true, data: data.data }
      } else if (data.success) {
        return { success: true, data: data }
      } else {
        return { success: false, error: data.message || 'Backend returned unsuccessful response' }
      }
    } catch (error) {
      return { success: false, error: 'Network error while updating list' }
    }
  }

  async deleteList(listId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.delete(listId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.detail || 'Failed to delete list' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error while deleting list' }
    }
  }

  // List Items Management
  async addProfileToList(listId: string, profileData: AddProfileToListRequest): Promise<ApiResponse<ListItem>> {
    try {
      const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.lists.addItem(listId)}`
      console.log('Add profile request:', { url, profileData, headers: getAuthHeaders() })
      
      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      })

      const data = await response.json()
      console.log('Add profile response:', { status: response.status, data })
      console.log('Full error details:', JSON.stringify(data, null, 2))
      
      if (!response.ok) {
        return { success: false, error: data.detail || data.error || 'Failed to add profile to list' }
      }

      return { success: true, data: data }
    } catch (error) {
      console.error('Network error in addProfileToList:', error)
      return { success: false, error: 'Network error while adding profile to list' }
    }
  }

  async removeProfileFromList(listId: string, itemId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.removeItem(listId, itemId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.detail || 'Failed to remove profile from list' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error while removing profile from list' }
    }
  }

  async bulkAddProfilesToList(listId: string, profilesData: BulkAddProfilesRequest): Promise<ApiResponse<ListItem[]>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.bulkAdd(listId)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(profilesData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to bulk add profiles to list' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while bulk adding profiles to list' }
    }
  }

  // Advanced Operations
  async reorderList(listId: string, reorderData: ReorderListRequest): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.reorder(listId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(reorderData)
      })
      
      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.detail || 'Failed to reorder list' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error while reordering list' }
    }
  }

  async duplicateList(listId: string): Promise<ApiResponse<List>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.duplicate(listId)}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to duplicate list' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while duplicating list' }
    }
  }

  async getAvailableProfiles(page: number = 1, perPage: number = 20): Promise<ApiResponse<PaginatedResponse<AvailableProfile>>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.profiles.availableForLists}?page=${page}&per_page=${perPage}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to fetch available profiles' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while fetching available profiles' }
    }
  }

  async getListAnalytics(listId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.analytics(listId)}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to fetch list analytics' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while fetching list analytics' }
    }
  }
}

// Export singleton instance
export const listsApiService = new ListsApiService()