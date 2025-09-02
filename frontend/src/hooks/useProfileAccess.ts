/**
 * Profile Access Hook for 30-Day System
 * Manages unlock functionality and access state
 */

"use client"

import { useState, useCallback } from "react"
import { instagramApiService, ProfileResponse } from "@/services/instagramApi"
import { toast } from "sonner"
import { handleNotificationsWithFallback, handleErrorNotificationsWithFallback } from "@/utils/notifications"

interface UseProfileAccessResult {
  unlockProfile: (username: string) => Promise<ProfileResponse | null>
  isUnlocking: boolean
  checkAccessStatus: (data: ProfileResponse) => {
    hasAccess: boolean
    isExpiring: boolean
    daysRemaining: number | null
    expirationMessage: string
  }
}

export function useProfileAccess(): UseProfileAccessResult {
  const [isUnlocking, setIsUnlocking] = useState(false)

  const unlockProfile = useCallback(async (username: string): Promise<ProfileResponse | null> => {
    setIsUnlocking(true)
    
    try {

      
      // Call the main profile endpoint which grants 30-day access
      const result = await instagramApiService.getProfile(username)
      
      if (result.success && result.data) {
        const hasAccess = result.data.meta?.user_has_access
        const expiresInDays = result.data.meta?.access_expires_in_days
        
        if (hasAccess) {
          const expirationText = expiresInDays ? 
            `for ${expiresInDays} days` : 
            'for 30 days'
            
          // Handle new notification system from backend
          handleNotificationsWithFallback(
            result.data.notifications,
            `🎉 Profile unlocked! Full access granted ${expirationText}`
          )
          

            username,
            hasAccess,
            expiresInDays
          })
          
          return result.data
        } else {
          // Still no access - might be restricted profile or other issue
          toast.error('Unable to unlock profile', {
            description: 'This profile may be restricted or require special permissions.',
            duration: 4000
          })
          

          return result.data
        }
      } else {
        // API call failed - handle new notification system for errors
        handleErrorNotificationsWithFallback(result.notifications, () => {
          // Fallback to old error handling
          const errorMessage = result.error || 'Failed to unlock profile'
          
          if (errorMessage.includes('Authentication required')) {
            toast.error('Authentication required', {
              description: 'Please log in to unlock profiles.',
              action: {
                label: 'Login',
                onClick: () => window.location.href = '/login'
              }
            })
          } else if (errorMessage.includes('Rate limit')) {
            toast.error('Rate limit exceeded', {
              description: 'Please wait a moment before trying again.',
              duration: 4000
            })
          } else {
            toast.error('Failed to unlock profile', {
              description: errorMessage,
              duration: 4000
            })
          }
        })
        

        return null
      }
    } catch (error) {

      
      toast.error('Network error', {
        description: 'Unable to connect to the server. Please check your connection.',
        duration: 4000
      })
      
      return null
    } finally {
      setIsUnlocking(false)
    }
  }, [])

  const checkAccessStatus = useCallback((data: ProfileResponse) => {
    const hasAccess = data.meta?.user_has_access
    const daysRemaining = data.meta?.access_expires_in_days
    
    if (!hasAccess) {
      return {
        hasAccess: false,
        isExpiring: false,
        daysRemaining: null,
        expirationMessage: 'No access'
      }
    }

    if (!daysRemaining || daysRemaining <= 0) {
      return {
        hasAccess: false,
        isExpiring: false,
        daysRemaining: 0,
        expirationMessage: 'Access expired'
      }
    }
    
    const isExpiring = daysRemaining <= 3 && daysRemaining > 0
    
    let expirationMessage = ''
    if (isExpiring) {
      expirationMessage = `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
    } else {
      expirationMessage = `${daysRemaining} days remaining`
    }

    return {
      hasAccess: true,
      isExpiring,
      daysRemaining,
      expirationMessage
    }
  }, [])

  return {
    unlockProfile,
    isUnlocking,
    checkAccessStatus
  }
}

// Helper hook for access warnings
export function useAccessWarnings() {
  const showExpirationWarning = useCallback((daysRemaining: number, username: string) => {
    if (daysRemaining <= 3 && daysRemaining > 0) {
      toast.warning(`Access expiring soon`, {
        description: `Your access to @${username} expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Search again to renew.`,
        duration: 6000,
        action: {
          label: 'Renew Now',
          onClick: () => {
            // Trigger a new search to renew access
            window.location.reload()
          }
        }
      })
    }
  }, [])

  const showAccessExpiredWarning = useCallback((username: string) => {
    toast.error('Access expired', {
      description: `Your 30-day access to @${username} has expired. Search again to unlock.`,
      duration: 5000,
    })
  }, [])

  return {
    showExpirationWarning,
    showAccessExpiredWarning
  }
}