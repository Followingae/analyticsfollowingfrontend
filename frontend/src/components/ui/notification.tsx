"use client"

import * as React from "react"
import { Bell, Check, X, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  timestamp: Date
  read: boolean
  actionLabel?: string
  actionUrl?: string
}

interface NotificationIconProps {
  type: NotificationType
  className?: string
}

function NotificationIcon({ type, className }: NotificationIconProps) {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  }
  
  const Icon = icons[type]
  
  const colorClasses = {
    info: "text-blue-500",
    success: "text-green-500", 
    warning: "text-yellow-500",
    error: "text-red-500",
  }
  
  return <Icon className={cn("h-4 w-4", colorClasses[type], className)} />
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  compact = false 
}: NotificationItemProps) {
  const typeStyles = {
    info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
    success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
    error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  }

  if (compact) {
    return (
      <div className={cn(
        "flex items-start gap-3 p-3 border-l-4 transition-colors",
        typeStyles[notification.type],
        !notification.read && "border-l-current"
      )}>
        <NotificationIcon type={notification.type} />
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium",
            !notification.read && "font-semibold"
          )}>
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getRelativeTime(notification.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!notification.read && onMarkAsRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      "transition-colors",
      typeStyles[notification.type],
      !notification.read && "ring-2 ring-offset-2 ring-current/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <NotificationIcon type={notification.type} />
            <CardTitle className="text-base">{notification.title}</CardTitle>
            {!notification.read && (
              <Badge variant="secondary" className="text-xs">New</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!notification.read && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {notification.message}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {getRelativeTime(notification.timestamp)}
          </p>
          {notification.actionLabel && notification.actionUrl && (
            <Button size="sm" variant="outline">
              {notification.actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface NotificationBellProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (id: string) => void
  className?: string
}

export function NotificationBell({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className
}: NotificationBellProps) {
  const router = useRouter()
  const unreadCount = notifications.filter(n => !n.read).length
  const dropdownNotifications = notifications.filter(n => !n.read).slice(0, 4) // Only show unread in dropdown

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-w-72">
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onMarkAllAsRead}
              className="h-6 px-2 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {dropdownNotifications.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {dropdownNotifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className="p-3 cursor-pointer focus:bg-muted"
                onClick={() => {
                  if (onMarkAsRead) {
                    onMarkAsRead(notification.id)
                  }
                  if (notification.actionUrl) {
                    router.push(notification.actionUrl)
                  }
                }}
              >
                <div className="w-full space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-tight font-semibold">
                      {notification.title}
                    </p>
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRelativeTime(notification.timestamp)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No new notifications</p>
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-center py-2 cursor-pointer"
          onClick={() => router.push('/notifications')}
        >
          <span className="text-sm text-blue-600">
            View all notifications →
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (id: string) => void
  className?: string
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className
}: NotificationListProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm">We'll notify you about important updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}