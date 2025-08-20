import { toast } from 'sonner'
import { NotificationResponse } from '@/services/instagramApi'

/**
 * Simple notification logic - only 2 notifications per creator, ever!
 * 1. "Initial search completed" when profile is first loaded
 * 2. "Detailed analysis completed" when AI analysis finishes
 */
export function handleBackendNotifications(notifications: NotificationResponse) {
  // Handle initial search notification - when profile first loaded
  if (notifications.initial_search) {
    const message = notifications.initial_search.type === 'success' 
      ? 'Initial search completed' 
      : notifications.initial_search.message

    if (notifications.initial_search.type === 'success') {
      toast.success(message, { duration: 3000 })
    } else {
      toast.error(message, { duration: 4000 })
    }
  }

  // Handle detailed search notification - when AI analysis finishes
  if (notifications.detailed_search) {
    const message = notifications.detailed_search.type === 'success' 
      ? 'Detailed analysis completed' 
      : notifications.detailed_search.message

    if (notifications.detailed_search.type === 'success') {
      toast.success(message, { duration: 5000 })
    } else {
      toast.error(message, { duration: 4000 })
    }
  }
}

/**
 * Handle backend notifications with fallback to custom message
 */
export function handleNotificationsWithFallback(
  notifications: NotificationResponse | undefined,
  fallbackSuccess?: string,
  fallbackError?: string
) {
  if (notifications) {
    handleBackendNotifications(notifications)
  } else {
    // Use fallback notifications
    if (fallbackSuccess) {
      toast.success(fallbackSuccess)
    }
    if (fallbackError) {
      toast.error(fallbackError)
    }
  }
}

/**
 * Handle backend notifications for errors with custom fallback logic
 */
export function handleErrorNotificationsWithFallback(
  notifications: NotificationResponse | undefined,
  fallbackLogic: () => void
) {
  if (notifications) {
    handleBackendNotifications(notifications)
  } else {
    fallbackLogic()
  }
}