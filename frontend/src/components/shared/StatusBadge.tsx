"use client"

import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Pause, 
  Play, 
  Settings, 
  Activity,
  Zap,
  StopCircle
} from "lucide-react"

export interface StatusBadgeProps {
  status: string
  type?: 'campaign' | 'proposal' | 'list' | 'user' | 'system' | 'generic'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
}

export function StatusBadge({ 
  status, 
  type = 'generic', 
  size = 'default',
  showIcon = true 
}: StatusBadgeProps) {
  const getStatusConfig = (status: string, type: string) => {
    const normalizedStatus = status.toLowerCase().replace(/[_-]/g, ' ')
    
    // Campaign statuses
    if (type === 'campaign') {
      switch (normalizedStatus) {
        case 'planning':
          return {
            variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
            icon: Settings,
            label: 'Planning'
          }
        case 'active':
          return {
            variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            icon: Play,
            label: 'Active'
          }
        case 'paused':
          return {
            variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            icon: Pause,
            label: 'Paused'
          }
        case 'completed':
          return {
            variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            icon: CheckCircle,
            label: 'Completed'
          }
        case 'cancelled':
          return {
            variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            icon: XCircle,
            label: 'Cancelled'
          }
      }
    }
    
    // Proposal statuses
    if (type === 'proposal') {
      switch (normalizedStatus) {
        case 'draft':
          return {
            variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
            icon: Settings,
            label: 'Draft'
          }
        case 'sent':
          return {
            variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            icon: Activity,
            label: 'Sent'
          }
        case 'under review':
          return {
            variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            icon: Clock,
            label: 'Under Review'
          }
        case 'approved':
          return {
            variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            icon: CheckCircle,
            label: 'Approved'
          }
        case 'rejected':
          return {
            variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            icon: XCircle,
            label: 'Rejected'
          }
        case 'negotiation':
          return {
            variant: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            icon: AlertTriangle,
            label: 'Negotiation'
          }
        case 'closed':
          return {
            variant: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            icon: StopCircle,
            label: 'Closed'
          }
      }
    }
    
    // User statuses
    if (type === 'user') {
      switch (normalizedStatus) {
        case 'active':
          return {
            variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            icon: CheckCircle,
            label: 'Active'
          }
        case 'suspended':
          return {
            variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            icon: Pause,
            label: 'Suspended'
          }
        case 'pending':
          return {
            variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            icon: Clock,
            label: 'Pending'
          }
        case 'deactivated':
          return {
            variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
            icon: XCircle,
            label: 'Deactivated'
          }
      }
    }
    
    // System health statuses
    if (type === 'system') {
      switch (normalizedStatus) {
        case 'healthy':
        case 'operational':
          return {
            variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            icon: CheckCircle,
            label: 'Healthy'
          }
        case 'warning':
        case 'degraded':
          return {
            variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            icon: AlertTriangle,
            label: 'Warning'
          }
        case 'critical':
        case 'outage':
          return {
            variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            icon: XCircle,
            label: 'Critical'
          }
      }
    }
    
    // List statuses
    if (type === 'list') {
      switch (normalizedStatus) {
        case 'private':
          return {
            variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
            icon: Settings,
            label: 'Private'
          }
        case 'shared':
          return {
            variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            icon: Activity,
            label: 'Shared'
          }
        case 'collaborative':
          return {
            variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            icon: CheckCircle,
            label: 'Collaborative'
          }
      }
    }
    
    // Generic statuses - fallback
    switch (normalizedStatus) {
      case 'active':
      case 'success':
      case 'completed':
      case 'approved':
      case 'healthy':
        return {
          variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: CheckCircle,
          label: normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
        }
      case 'pending':
      case 'processing':
      case 'warning':
      case 'review':
        return {
          variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: Clock,
          label: normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
        }
      case 'failed':
      case 'error':
      case 'rejected':
      case 'cancelled':
      case 'critical':
        return {
          variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: XCircle,
          label: normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
        }
      case 'info':
      case 'draft':
      case 'created':
        return {
          variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: Activity,
          label: normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
        }
      default:
        return {
          variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
          icon: AlertTriangle,
          label: normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
        }
    }
  }
  
  const config = getStatusConfig(status, type)
  const IconComponent = config.icon
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  }
  
  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  return (
    <Badge 
      className={`${config.variant} ${sizeClasses[size]} inline-flex items-center gap-1 font-medium rounded-full`}
      variant="secondary"
    >
      {showIcon && IconComponent && (
        <IconComponent className={iconSizes[size]} />
      )}
      {config.label}
    </Badge>
  )
}

// Convenience components for specific types
export const CampaignStatusBadge = (props: Omit<StatusBadgeProps, 'type'>) => 
  <StatusBadge {...props} type="campaign" />

export const ProposalStatusBadge = (props: Omit<StatusBadgeProps, 'type'>) => 
  <StatusBadge {...props} type="proposal" />

export const UserStatusBadge = (props: Omit<StatusBadgeProps, 'type'>) => 
  <StatusBadge {...props} type="user" />

export const SystemStatusBadge = (props: Omit<StatusBadgeProps, 'type'>) => 
  <StatusBadge {...props} type="system" />

export const ListStatusBadge = (props: Omit<StatusBadgeProps, 'type'>) => 
  <StatusBadge {...props} type="list" />