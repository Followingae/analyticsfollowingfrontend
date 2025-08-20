/**
 * Professional AI Status Management Service
 * 
 * Handles all AI analysis status checking, automatic repairs, and user-friendly notifications
 * Users get smooth, professional experience while frontend handles complexity automatically
 */

import { useNotificationHelpers } from '@/contexts/NotificationContext'
import { instagramApiService, AIAnalysisResponse, AICompletionStatus, AIFrontendActions } from './instagramApi'

export type AIAnalysisStatus = 'COMPLETED' | 'FAILED' | 'PROCESSING'

export interface ProfileAnalysisStatus {
  analysis_status: AIAnalysisStatus
  analysis_complete: boolean
  completion_status: AICompletionStatus
  frontend_actions: AIFrontendActions
  message: string
  username?: string
  profile_id?: string
  posts_analyzed?: number
  total_posts_found?: number
  success_rate?: number
  profile_insights_updated?: boolean
}

export interface JobStatus {
  job_status: {
    status: 'running' | 'completed' | 'failed'
    progress: {
      percentage: number
    }
  }
}

export class ProfessionalAINotifications {
  private currentNotificationId: string | null = null
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map()
  private notificationHelpers: any

  constructor(notificationHelpers: any) {
    this.notificationHelpers = notificationHelpers
  }

  /**
   * Main entry point - handles profile analysis with new completion indicators
   */
  async handleProfileAnalysis(username: string): Promise<void> {
    try {
      const response = await this.triggerProfileAnalysis(username)
      
      // Handle frontend actions based on backend response
      this.processFrontendActions(response, username)
      
      // Show appropriate notification based on completion status
      this.handleAnalysisResponse(response, username)
      
    } catch (error) {
      console.error('Error handling profile analysis:', error)
      this.showTemporaryNotification({
        title: 'AI Analysis',
        message: 'AI analysis will be available shortly...',
        type: 'info'
      })
    }
  }

  /**
   * Trigger comprehensive AI analysis using new backend format
   */
  private async triggerProfileAnalysis(username: string): Promise<AIAnalysisResponse> {
    try {
      const response = await instagramApiService.triggerProfileAnalysis(username)
      
      // Ensure response has required structure - add defaults if missing
      return {
        ...response,
        completion_status: response.completion_status || {
          all_steps_completed: false,
          posts_processing_done: false,
          profile_insights_done: false,
          database_updates_done: false,
          ready_for_display: false
        },
        frontend_actions: response.frontend_actions || {
          can_refresh_profile: false,
          can_view_ai_insights: false,
          should_show_error_message: false,
          recommended_next_step: 'view_existing_data'
        }
      }
    } catch (error) {
      console.error('Analysis trigger failed:', error)
      // Return safe default response
      return {
        success: false,
        status: 'FAILED',
        analysis_complete: false,
        message: 'Analysis failed to start',
        completion_status: {
          all_steps_completed: false,
          posts_processing_done: false,
          profile_insights_done: false,
          database_updates_done: false,
          ready_for_display: false
        },
        frontend_actions: {
          can_refresh_profile: false,
          can_view_ai_insights: false,
          should_show_error_message: true,
          recommended_next_step: 'retry_analysis_later'
        }
      }
    }
  }

  /**
   * Process frontend actions based on backend response
   */
  private processFrontendActions(response: AIAnalysisResponse, username: string): void {
    const { frontend_actions } = response
    
    // Safety check - ensure frontend_actions exists
    if (!frontend_actions) {
      console.warn('No frontend_actions in AI analysis response, using defaults')
      return
    }
    
    // Handle success message
    if (frontend_actions.should_show_success_message && response.success) {
      this.showTemporaryNotification({
        title: 'AI Analysis Complete',
        message: response.message || 'AI insights are now available!',
        type: 'success'
      })
    }
    
    // Handle error message
    if (frontend_actions.should_show_error_message && !response.success) {
      this.showTemporaryNotification({
        title: 'AI Analysis',
        message: response.message || 'AI analysis encountered an issue',
        type: 'error'
      })
    }
    
    // Handle recommended actions - with safety check
    if (frontend_actions.recommended_next_step) {
      switch (frontend_actions.recommended_next_step) {
        case 'refresh_profile_data':
          if (frontend_actions.can_refresh_profile) {
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }
          break
          
        case 'retry_analysis_later':
          this.scheduleRetryAnalysis(username)
          break
          
        case 'view_existing_data':
          // User can view existing data - no special action needed
          break
      }
    }
  }

  /**
   * Handle analysis response based on completion status
   */
  private handleAnalysisResponse(response: AIAnalysisResponse, username: string): void {
    const { status, completion_status, frontend_actions, message } = response
    
    // Safety checks for required properties
    if (!completion_status) {
      console.warn('No completion_status in AI analysis response')
      this.showTemporaryNotification({
        title: 'AI Analysis',
        message: message || 'Analysis status unavailable',
        type: 'info'
      })
      return
    }
    
    switch (status) {
      case 'COMPLETED':
        if (completion_status.all_steps_completed && completion_status.ready_for_display) {
          // Analysis fully complete
          if (frontend_actions?.should_show_success_message) {
            this.showTemporaryNotification({
              title: 'AI Insights Ready',
              message: message || 'AI insights are now available!',
              type: 'success'
            })
          }
          
          // Refresh if recommended
          if (frontend_actions?.can_refresh_profile) {
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }
        } else {
          // Partial completion - continue monitoring
          this.showPersistentNotification({
            title: 'Finalizing AI Analysis',
            message: 'Completing final analysis steps...',
            type: 'info'
          })
          this.pollAnalysisCompletion(username)
        }
        break
        
      case 'PROCESSING':
        this.showPersistentNotification({
          title: 'AI Analysis in Progress',
          message: message || 'Analyzing profile content...',
          type: 'info'
        })
        this.pollAnalysisCompletion(username)
        break
        
      case 'FAILED':
        if (frontend_actions?.should_show_error_message) {
          this.showTemporaryNotification({
            title: 'AI Analysis',
            message: message || 'AI analysis will retry shortly',
            type: 'warning'
          })
        }
        
        if (frontend_actions?.recommended_next_step === 'retry_analysis_later') {
          this.scheduleRetryAnalysis(username)
        }
        break
    }
  }

  /**
   * Schedule retry analysis with exponential backoff
   */
  private scheduleRetryAnalysis(username: string, retryCount: number = 0): void {
    const maxRetries = 3
    const baseDelay = 30000 // 30 seconds
    const delay = baseDelay * Math.pow(2, retryCount)
    
    if (retryCount >= maxRetries) {
      this.showTemporaryNotification({
        title: 'AI Analysis',
        message: 'AI analysis will be available in the next session',
        type: 'info'
      })
      return
    }
    
    setTimeout(async () => {
      try {
        const response = await this.triggerProfileAnalysis(username)
        this.handleAnalysisResponse(response, username)
      } catch (error) {
        console.error(`Retry ${retryCount + 1} failed:`, error)
        this.scheduleRetryAnalysis(username, retryCount + 1)
      }
    }, delay)
  }

  /**
   * Legacy compatibility method - redirects to new analysis handler
   */
  async handleProfileLoad(username: string): Promise<void> {
    return this.handleProfileAnalysis(username)
  }

  /**
   * Poll analysis completion status using new backend format
   */
  private pollAnalysisCompletion(username: string): void {
    // Clear any existing interval for this username
    const existingInterval = this.progressIntervals.get(username)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await this.triggerProfileAnalysis(username)
        
        // Check completion status
        if (response.completion_status.all_steps_completed && response.completion_status.ready_for_display) {
          // Analysis complete
          this.clearProgressInterval(username)
          
          this.updateNotification({
            title: 'AI Insights Complete',
            message: response.message || 'AI insights are now available!',
            type: 'success'
          })
          
          // Refresh if recommended by backend
          if (response.frontend_actions?.can_refresh_profile) {
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }
          
        } else if (response.status === 'PROCESSING') {
          // Still processing - update status message
          let statusMessage = 'AI analysis in progress...'
          
          if (response.completion_status.posts_processing_done) {
            statusMessage = 'Generating profile insights...'
          } else if (response.posts_analyzed && response.total_posts_found) {
            const progress = Math.round((response.posts_analyzed / response.total_posts_found) * 100)
            statusMessage = `Analyzing posts (${progress}%)...`
          }
          
          this.updateNotification({
            title: 'AI Analysis Running',
            message: statusMessage,
            type: 'info'
          })
          
        } else if (response.status === 'FAILED') {
          // Analysis failed
          this.clearProgressInterval(username)
          this.scheduleRetryAnalysis(username)
        }
        
      } catch (error) {
        console.error('Progress tracking error:', error)
        // Continue polling with generic message
        this.updateNotification({
          title: 'AI Processing',
          message: 'AI insights processing...',
          type: 'info'
        })
      }
    }, 10000) // Check every 10 seconds

    this.progressIntervals.set(username, pollInterval)

    // Cleanup after 15 minutes
    setTimeout(() => {
      this.clearProgressInterval(username)
    }, 900000)
  }

  /**
   * Show persistent notification (stays until updated/cleared)
   */
  private showPersistentNotification({ title, message, type }: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }): void {
    this.clearCurrentNotification()
    
    if (this.notificationHelpers) {
      switch (type) {
        case 'success':
          this.notificationHelpers.notifySuccess(title, message)
          break
        case 'error':
          this.notificationHelpers.notifyError(title, message)
          break
        case 'warning':
          this.notificationHelpers.notifyWarning(title, message)
          break
        case 'info':
        default:
          this.notificationHelpers.notifyInfo(title, message)
          break
      }
    }
  }

  /**
   * Show temporary notification (auto-hides after delay)
   */
  private showTemporaryNotification({ title, message, type, delay = 5000 }: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    delay?: number
  }): void {
    this.showPersistentNotification({ title, message, type })
    
    setTimeout(() => {
      this.clearCurrentNotification()
    }, delay)
  }

  /**
   * Update current notification
   */
  private updateNotification({ title, message, type }: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }): void {
    this.showPersistentNotification({ title, message, type })
  }

  /**
   * Clear current notification
   */
  private clearCurrentNotification(): void {
    this.currentNotificationId = null
  }

  /**
   * Clear progress tracking interval
   */
  private clearProgressInterval(identifier: string): void {
    const interval = this.progressIntervals.get(identifier)
    if (interval) {
      clearInterval(interval)
      this.progressIntervals.delete(identifier)
    }
  }

  /**
   * Cleanup method - call when component unmounts
   */
  public cleanup(): void {
    // Clear all progress intervals
    for (const [identifier, interval] of this.progressIntervals) {
      clearInterval(interval)
    }
    this.progressIntervals.clear()
    this.clearCurrentNotification()
  }
}

/**
 * Factory function to create AI notifications service with notification helpers
 */
export function createAINotificationService(): ProfessionalAINotifications {
  const notificationHelpers = useNotificationHelpers()
  return new ProfessionalAINotifications(notificationHelpers)
}

/**
 * React hook for AI notifications
 */
export function useAINotifications(): ProfessionalAINotifications {
  const notificationHelpers = useNotificationHelpers()
  return new ProfessionalAINotifications(notificationHelpers)
}