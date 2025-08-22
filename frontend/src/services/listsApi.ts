import { getAuthHeaders, API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Enhanced Types for the Lists API - Based on Frontend Implementation Guide
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
  // Enhanced fields
  list_type: 'custom' | 'template' | 'shared' | 'favorites'
  is_public: boolean
  is_template: boolean
  template_category?: string
  profiles_count: number
  collaboration_settings: CollaborationSettings
  export_settings: ExportSettings
  performance_metrics: PerformanceMetrics
  collaborators?: Collaborator[]
  recent_activity?: ActivityLog[]
}

// New Enhanced Types
export interface CollaborationSettings {
  allow_comments: boolean
  allow_sharing: boolean
  require_approval: boolean
  notifications_enabled: boolean
}

export interface ExportSettings {
  default_format: 'csv' | 'xlsx' | 'pdf' | 'json'
  include_fields: string[]
  auto_export_enabled: boolean
}

export interface PerformanceMetrics {
  views_count: number
  shares_count: number
  exports_count: number
  collaboration_requests: number
  engagement_score: number
}

export interface Collaborator {
  id: string
  user_id: string
  email: string
  full_name?: string
  permission_level: 'view' | 'comment' | 'edit' | 'admin'
  collaboration_status: 'pending' | 'accepted' | 'declined'
  invited_at: string
  responded_at?: string
}

export interface ActivityLog {
  id: string
  user_id: string
  user_name: string
  activity_type: string
  activity_description: string
  activity_data: Record<string, any>
  created_at: string
}

export interface ListTemplate {
  id: string
  template_name: string
  template_description: string
  template_category: string
  template_config: TemplateConfig
  is_public: boolean
  usage_count: number
  created_by: string
  created_at: string
}

export interface TemplateConfig {
  default_fields: string[]
  custom_fields: Array<{
    name: string
    type: string
    required: boolean
  }>
  filters: Record<string, any>
}

export interface ExportJob {
  id: string
  list_id: string
  export_format: 'csv' | 'xlsx' | 'pdf' | 'json'
  export_status: 'pending' | 'processing' | 'completed' | 'failed'
  file_url?: string
  created_at: string
  completed_at?: string
  progress_percentage: number
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

  async getListAnalytics(listId: string, period: string = '30d'): Promise<ApiResponse<{
    performance_metrics: PerformanceMetrics
    activity_timeline: ActivityLog[]
    collaboration_stats: {
      total_collaborators: number
      active_collaborators: number
      pending_invites: number
    }
  }>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.lists.analytics(listId)}?period=${period}`, {
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

  // ENHANCED METHODS - Templates
  async getListTemplates(params: { category?: string } = {}): Promise<ApiResponse<{
    templates: ListTemplate[]
    categories: string[]
  }>> {
    return this.getTemplates(params)
  }

  async getTemplates(params: { category?: string } = {}): Promise<ApiResponse<{
    templates: ListTemplate[]
    categories: string[]
  }>> {
    try {
      const queryParams = new URLSearchParams()
      if (params.category) queryParams.append('category', params.category)
      
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/lists/templates?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to fetch templates' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while fetching templates' }
    }
  }

  async createTemplate(listId: string, templateData: {
    template_name: string
    template_description: string
    template_category: string
    is_public: boolean
  }): Promise<ApiResponse<ListTemplate>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/lists/${listId}/create-template`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(templateData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to create template' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while creating template' }
    }
  }

  async createListFromTemplate(templateId: string, listData: {
    list_name: string
    customizations?: Record<string, any>
  }): Promise<ApiResponse<List>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/lists/from-template/${templateId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(listData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to create list from template' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while creating list from template' }
    }
  }

  // ENHANCED METHODS - Collaboration
  async shareList(listId: string, collaborators: Array<{
    email: string
    permission_level: 'view' | 'comment' | 'edit' | 'admin'
  }>, message?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/lists/${listId}/share`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ collaborators, message })
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.detail || 'Failed to share list' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error while sharing list' }
    }
  }

  async respondToCollaboration(collaborationId: string, response: {
    response: 'accepted' | 'declined'
    message?: string
  }): Promise<ApiResponse<void>> {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/lists/collaborations/${collaborationId}/respond`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(response)
      })

      if (!res.ok) {
        const data = await res.json()
        return { success: false, error: data.detail || 'Failed to respond to collaboration' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error while responding to collaboration' }
    }
  }

  async updateCollaborationPermissions(collaborationId: string, permission_level: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/lists/collaborations/${collaborationId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permission_level })
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.detail || 'Failed to update permissions' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error while updating permissions' }
    }
  }

  async getCollaborators(listId: string): Promise<ApiResponse<{
    collaborators: Collaborator[]
    pending_invites: Collaborator[]
  }>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/lists/${listId}/collaborators`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to fetch collaborators' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while fetching collaborators' }
    }
  }

  // ENHANCED METHODS - Export
  async exportList(listId: string, exportOptions: {
    format: 'csv' | 'xlsx' | 'pdf' | 'json'
    include_fields: string[]
    export_options?: Record<string, any>
  }): Promise<ApiResponse<{
    job_id: string
    estimated_completion: string
  }>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/lists/${listId}/export`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(exportOptions)
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to start export' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while starting export' }
    }
  }

  async checkExportStatus(jobId: string): Promise<ApiResponse<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    file_url?: string
    error_message?: string
    progress_percentage: number
  }>> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/lists/export-jobs/${jobId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to check export status' }
      }

      return { success: true, data: data }
    } catch (error) {
      return { success: false, error: 'Network error while checking export status' }
    }
  }
}

// Export singleton instance
export const listsApiService = new ListsApiService()