"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Notification, NotificationType } from '@/components/ui/notification'
import { toast } from 'sonner'

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAllNotifications: () => void
  unreadCount: number
  getDropdownNotifications: () => Notification[]
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications')
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications)
        setNotifications(
          parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }))
        )
      } catch (error) {
        console.error('Failed to load notifications from localStorage:', error)
      }
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      ...notificationData
    }

    setNotifications(prev => [newNotification, ...prev])

    // Also show a toast for immediate feedback
    switch (newNotification.type) {
      case 'success':
        toast.success(newNotification.title)
        break
      case 'error':
        toast.error(newNotification.title)
        break
      case 'warning':
        toast.warning(newNotification.title)
        break
      case 'info':
      default:
        toast.info(newNotification.title)
        break
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )

    // Auto-remove from dropdown after 2 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    }, 2000)
  }, [])

  // Get notifications for dropdown (only unread + recent read)
  const getDropdownNotifications = useCallback(() => {
    const unread = notifications.filter(n => !n.read)
    const recentRead = notifications
      .filter(n => n.read)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 2) // Only show 2 most recent read notifications
    
    return [...unread, ...recentRead]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5) // Max 5 notifications in dropdown
  }, [notifications])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
    localStorage.removeItem('notifications')
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length


  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    unreadCount,
    getDropdownNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Helper hooks for common notification types
export function useNotificationHelpers() {
  const { addNotification } = useNotifications()

  const notifySuccess = useCallback((title: string, message: string, actionLabel?: string, actionUrl?: string) => {
    addNotification({ title, message, type: 'success', actionLabel, actionUrl })
  }, [addNotification])

  const notifyError = useCallback((title: string, message: string, actionLabel?: string, actionUrl?: string) => {
    addNotification({ title, message, type: 'error', actionLabel, actionUrl })
  }, [addNotification])

  const notifyWarning = useCallback((title: string, message: string, actionLabel?: string, actionUrl?: string) => {
    addNotification({ title, message, type: 'warning', actionLabel, actionUrl })
  }, [addNotification])

  const notifyInfo = useCallback((title: string, message: string, actionLabel?: string, actionUrl?: string) => {
    addNotification({ title, message, type: 'info', actionLabel, actionUrl })
  }, [addNotification])

  const notifyAnalysisComplete = useCallback((username: string) => {
    notifySuccess(
      'Analysis Complete',
      `@${username} has been successfully analyzed and added to your creators.`,
      'View Analytics',
      `/analytics/${username}`
    )
  }, [notifySuccess])

  const notifyAnalysisFailed = useCallback((username: string, error?: string) => {
    notifyError(
      'Analysis Failed',
      error || `Failed to analyze @${username}. Please try again later.`,
      'Retry',
      `/creators`
    )
  }, [notifyError])

  // AI-specific notification helpers
  const notifyAIAnalysisStarted = useCallback((username: string) => {
    notifyInfo(
      'AI Analysis Started',
      `AI analysis started for @${username}. This may take a few minutes.`,
      'View Progress',
      `/analytics/${username}`
    )
  }, [notifyInfo])

  const notifyAIInsightsReady = useCallback((username: string) => {
    notifySuccess(
      'AI Insights Ready',
      `AI content insights are now available for @${username}!`,
      'View Insights',
      `/analytics/${username}`
    )
  }, [notifySuccess])

  const notifyAIDataRepaired = useCallback((profileCount: number) => {
    notifySuccess(
      'Data Repair Complete',
      `Successfully repaired AI data for ${profileCount} profile${profileCount > 1 ? 's' : ''}.`,
      'View Profiles',
      '/creators'
    )
  }, [notifySuccess])

  const notifyAIProcessingUpdate = useCallback((username: string, progress: number) => {
    notifyInfo(
      'AI Processing Update',
      `AI analysis for @${username} is ${progress}% complete.`,
      'View Status',
      `/analytics/${username}`
    )
  }, [notifyInfo])

  const notifyAISystemHealth = useCallback((status: 'healthy' | 'warning' | 'critical', message: string) => {
    const type = status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : 'error'
    addNotification({
      title: 'AI System Status',
      message: message,
      type,
      actionLabel: 'View Details',
      actionUrl: '/system-health'
    })
  }, [addNotification])

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyAnalysisComplete,
    notifyAnalysisFailed,
    notifyAIAnalysisStarted,
    notifyAIInsightsReady,
    notifyAIDataRepaired,
    notifyAIProcessingUpdate,
    notifyAISystemHealth
  }
}