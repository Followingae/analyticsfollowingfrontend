/**
 * React Hook for Professional AI Status Management
 * 
 * Provides easy integration of AI status checking and automatic recovery
 * Usage: const { handleProfileLoad, cleanup } = useAIStatus()
 */

import React, { useEffect, useRef } from 'react'
import { ProfessionalAINotifications } from '@/services/aiNotificationService'
import { useNotificationHelpers } from '@/contexts/NotificationContext'

export function useAIStatus() {
  const notificationHelpers = useNotificationHelpers()
  const aiServiceRef = useRef<ProfessionalAINotifications | null>(null)

  // Initialize AI notification service
  useEffect(() => {
    aiServiceRef.current = new ProfessionalAINotifications(notificationHelpers)

    // Cleanup on unmount
    return () => {
      if (aiServiceRef.current) {
        aiServiceRef.current.cleanup()
      }
    }
  }, [notificationHelpers])

  /**
   * Handle profile analysis - triggers new comprehensive AI analysis with completion indicators
   * Call this when a profile page loads or when analysis needs to be triggered
   */
  const handleProfileLoad = async (username: string): Promise<void> => {
    if (aiServiceRef.current) {
      await aiServiceRef.current.handleProfileAnalysis(username)
    }
  }

  /**
   * Manual cleanup - call if needed before component unmounts
   */
  const cleanup = (): void => {
    if (aiServiceRef.current) {
      aiServiceRef.current.cleanup()
    }
  }

  return {
    handleProfileLoad,
    cleanup
  }
}

/**
 * Higher-order component for automatic AI status management
 * Wraps components that display profile data
 */
export function withAIStatus<P extends { username?: string }>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  const AIStatusWrapper = (props: P) => {
    const { handleProfileLoad } = useAIStatus()

    useEffect(() => {
      if (props.username) {
        handleProfileLoad(props.username)
      }
    }, [props.username, handleProfileLoad])

    return React.createElement(WrappedComponent, props)
  }

  AIStatusWrapper.displayName = `withAIStatus(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
  
  return AIStatusWrapper
}

/**
 * Hook for components that need to trigger AI analysis manually
 */
export function useAIAnalysisTrigger() {
  const notificationHelpers = useNotificationHelpers()

  const triggerAnalysis = async (username: string): Promise<void> => {
    const aiService = new ProfessionalAINotifications(notificationHelpers)
    await aiService.handleProfileAnalysis(username)
  }

  return { triggerAnalysis }
}