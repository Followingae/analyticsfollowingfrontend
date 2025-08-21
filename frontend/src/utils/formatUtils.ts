/**
 * Shared formatting utilities used across all systems
 */

// Currency formatting
export const formatCurrency = (
  amount: number, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatCurrencyDetailed = (
  amount: number, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Number formatting
export const formatNumber = (num: number, precision: number = 1): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(precision)}B`
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(precision)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(precision)}K`
  }
  return num.toString()
}

export const formatNumberWithCommas = (num: number): string => {
  return num.toLocaleString('en-US')
}

export const formatPercentage = (num: number, decimals: number = 1): string => {
  return `${num.toFixed(decimals)}%`
}

// Date formatting
export const formatDate = (
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
  
  return date.toLocaleDateString('en-US', options || defaultOptions)
}

export const formatDateTime = (
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return date.toLocaleString('en-US', options || defaultOptions)
}

export const formatTimeAgo = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

export const formatRelativeTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffInMs = date.getTime() - now.getTime()
  const diffInSeconds = Math.floor(Math.abs(diffInMs) / 1000)
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  
  if (diffInSeconds < 60) {
    return rtf.format(Math.sign(diffInMs) * diffInSeconds, 'second')
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return rtf.format(Math.sign(diffInMs) * diffInMinutes, 'minute')
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return rtf.format(Math.sign(diffInMs) * diffInHours, 'hour')
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return rtf.format(Math.sign(diffInMs) * diffInDays, 'day')
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return rtf.format(Math.sign(diffInMs) * diffInMonths, 'month')
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return rtf.format(Math.sign(diffInMs) * diffInYears, 'year')
}

// Duration formatting
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

// Text formatting
export const formatTitle = (text: string): string => {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const formatSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Status formatting
export const formatStatusText = (status: string): string => {
  return status
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// API response formatting helpers
export const formatApiError = (error: any): string => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error) return error.error
  if (error?.detail) return error.detail
  return 'An unexpected error occurred'
}

export const formatValidationErrors = (errors: Record<string, string[]>): string[] => {
  const formattedErrors: string[] = []
  
  Object.entries(errors).forEach(([field, fieldErrors]) => {
    fieldErrors.forEach(error => {
      formattedErrors.push(`${formatTitle(field)}: ${error}`)
    })
  })
  
  return formattedErrors
}

// Color utilities for status/priority formatting
export const getStatusColorClass = (status: string): string => {
  const normalizedStatus = status.toLowerCase().replace(/[_-]/g, ' ')
  
  switch (normalizedStatus) {
    case 'active':
    case 'success':
    case 'completed':
    case 'approved':
    case 'healthy':
      return 'text-green-600 dark:text-green-400'
    case 'pending':
    case 'processing':
    case 'warning':
    case 'under review':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'failed':
    case 'error':
    case 'rejected':
    case 'cancelled':
    case 'critical':
      return 'text-red-600 dark:text-red-400'
    case 'info':
    case 'draft':
    case 'created':
    case 'sent':
      return 'text-blue-600 dark:text-blue-400'
    case 'paused':
    case 'suspended':
      return 'text-orange-600 dark:text-orange-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

export const getPriorityColorClass = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'text-red-600 dark:text-red-400'
    case 'high':
      return 'text-orange-600 dark:text-orange-400'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'low':
      return 'text-green-600 dark:text-green-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

// URL and link formatting
export const formatUrl = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

export const extractDomain = (url: string): string => {
  try {
    const domain = new URL(formatUrl(url)).hostname
    return domain.startsWith('www.') ? domain.slice(4) : domain
  } catch {
    return url
  }
}