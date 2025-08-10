/**
 * Professional AI Status Management Service
 * 
 * Handles all AI analysis status checking, automatic repairs, and user-friendly notifications
 * Users get smooth, professional experience while frontend handles complexity automatically
 */

import { useNotificationHelpers } from '@/contexts/NotificationContext'
import { instagramApiService } from './instagramApi'

export type AIAnalysisStatus = 'completed' | 'partial_data' | 'not_started' | 'running' | 'failed'

export interface ProfileAnalysisStatus {
  analysis_status: AIAnalysisStatus
  data_completeness?: {
    needs_repair: boolean
    completion_percentage: number
  }
  latest_job?: {
    job_id: string
    status: string
  }
  progress?: {
    percentage: number
  }
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
   * Main entry point - handles profile loading and automatically manages AI status
   */
  async handleProfileLoad(username: string): Promise<void> {
    try {
      const status = await this.checkAnalysisStatus(username)

      switch (status.analysis_status) {
        case 'partial_data':
          this.showPersistentNotification({
            title: 'Updating AI Insights',
            message: 'Updating AI insights for this profile...',
            type: 'info'
          })
          await this.autoRepairPartialData(username, status)
          break

        case 'not_started':
          this.showPersistentNotification({
            title: 'Generating AI Insights',
            message: 'Generating AI insights for this profile...',
            type: 'info'
          })
          await this.startAnalysis(username)
          break

        case 'running':
          const progressMsg = status.progress?.percentage 
            ? `AI analysis in progress (${status.progress.percentage}%)...`
            : 'AI analysis in progress...'
          
          this.showPersistentNotification({
            title: 'AI Analysis Running',
            message: progressMsg,
            type: 'info'
          })
          
          if (status.latest_job?.job_id) {
            this.trackProgress(status.latest_job.job_id, username)
          }
          break

        case 'completed':
          // No notification needed - show insights normally
          this.clearCurrentNotification()
          break

        case 'failed':
          this.showPersistentNotification({
            title: 'Refreshing Analysis',
            message: 'Refreshing AI analysis...',
            type: 'info'
          })
          await this.retryAnalysis(username)
          break

        default:
          // Unknown status - treat as not started
          await this.startAnalysis(username)
          break
      }
    } catch (error) {
      console.error('Error handling profile load:', error)
      this.showTemporaryNotification({
        title: 'AI Insights',
        message: 'AI insights will be available shortly...',
        type: 'info'
      })
    }
  }

  /**
   * Check current analysis status for a profile using the new API service
   */
  private async checkAnalysisStatus(username: string): Promise<ProfileAnalysisStatus> {
    try {
      const result = await instagramApiService.getProfileAnalysisStatus(username)
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to check analysis status')
      }
    } catch (error) {
      console.error('Status check failed:', error)
      // Return safe default status
      return {
        analysis_status: 'not_started'
      }
    }
  }

  /**
   * Automatically repair partial data - no user action needed
   */
  private async autoRepairPartialData(username: string, status: ProfileAnalysisStatus): Promise<void> {
    try {
      // Attempt repair using the new API service
      const result = await instagramApiService.repairProfileAggregation([username])

      if (result.success) {
        this.updateNotification({
          title: 'AI Insights Updated',
          message: 'AI insights have been updated',
          type: 'success'
        })

        // Refresh after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        throw new Error(result.error || 'Repair request failed')
      }
    } catch (error) {
      console.error('Auto-repair failed:', error)
      // If repair fails, start fresh analysis
      await this.startFreshAnalysis(username)
    }
  }

  /**
   * Start fresh analysis for a profile
   */
  private async startAnalysis(username: string): Promise<void> {
    try {
      const response = await fetch(`/api/v1/ai/fix/profile/${username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`AI analysis failed: ${response.status} ${response.statusText}`)
        return
      }

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('AI analysis response is not JSON:', text.substring(0, 100))
        return
      }

      if (data.success && data.job_id) {
        this.updateNotification({
          title: 'AI Analysis Started',
          message: 'AI analysis started...',
          type: 'info'
        })

        this.trackProgress(data.job_id, username)
      } else {
        throw new Error('Failed to start analysis')
      }
    } catch (error) {
      console.error('Failed to start analysis:', error)
      this.updateNotification({
        title: 'AI Insights',
        message: 'AI insights will be available shortly',
        type: 'info'
      })
    }
  }

  /**
   * Automatically retry failed analysis
   */
  private async retryAnalysis(username: string): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Brief delay before retry

      const response = await fetch(`/api/v1/ai/fix/profile/${username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`AI analysis retry failed: ${response.status} ${response.statusText}`)
        return
      }

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('AI analysis retry response is not JSON:', text.substring(0, 100))
        return
      }

      if (data.success && data.job_id) {
        this.updateNotification({
          title: 'AI Analysis Restarted',
          message: 'AI analysis restarted...',
          type: 'info'
        })

        this.trackProgress(data.job_id, username)
      } else {
        throw new Error('Retry failed')
      }
    } catch (error) {
      console.error('Retry analysis failed:', error)
      this.updateNotification({
        title: 'AI Insights',
        message: 'AI insights will be available shortly',
        type: 'info'
      })
    }
  }

  /**
   * Start completely fresh analysis (used when repair fails)
   */
  private async startFreshAnalysis(username: string): Promise<void> {
    this.updateNotification({
      title: 'Starting Fresh Analysis',
      message: 'Starting fresh AI analysis...',
      type: 'info'
    })

    await this.startAnalysis(username)
  }

  /**
   * Track analysis progress with user-friendly updates using new API service
   */
  private trackProgress(jobId: string, username: string): void {
    // Clear any existing interval for this job
    const existingInterval = this.progressIntervals.get(jobId)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    const pollInterval = setInterval(async () => {
      try {
        const result = await instagramApiService.getAnalysisJobStatus(jobId)
        
        if (!result.success) {
          throw new Error(result.error || 'Status check failed')
        }

        const data = result.data
        const status = data.job_status || data

        switch (status.status) {
          case 'running':
            const percentage = status.progress?.percentage || 0
            this.updateNotification({
              title: 'AI Analysis Running',
              message: `Analyzing content (${percentage}%)...`,
              type: 'info'
            })
            break

          case 'completed':
            this.updateNotification({
              title: 'AI Insights Ready',
              message: 'AI insights are now available!',
              type: 'success'
            })

            this.clearProgressInterval(jobId)

            // Refresh profile data to show new insights
            setTimeout(() => {
              window.location.reload()
            }, 2000)
            break

          case 'failed':
            this.clearProgressInterval(jobId)
            
            this.updateNotification({
              title: 'Optimizing Analysis',
              message: 'Optimizing analysis...',
              type: 'info'
            })

            // Automatically retry after brief delay
            setTimeout(() => {
              this.retryAnalysis(username)
            }, 3000)
            break
        }
      } catch (error) {
        console.error('Progress tracking error:', error)
        // Silent handling - just show generic message
        this.updateNotification({
          title: 'AI Processing',
          message: 'AI insights processing...',
          type: 'info'
        })
      }
    }, 3000)

    this.progressIntervals.set(jobId, pollInterval)

    // Cleanup after 10 minutes
    setTimeout(() => {
      this.clearProgressInterval(jobId)
    }, 600000)
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
  private clearProgressInterval(jobId: string): void {
    const interval = this.progressIntervals.get(jobId)
    if (interval) {
      clearInterval(interval)
      this.progressIntervals.delete(jobId)
    }
  }

  /**
   * Cleanup method - call when component unmounts
   */
  public cleanup(): void {
    // Clear all progress intervals
    for (const [jobId, interval] of this.progressIntervals) {
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