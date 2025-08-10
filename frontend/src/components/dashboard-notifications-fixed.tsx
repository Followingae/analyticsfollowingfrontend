"use client"

import { useNotifications } from "@/contexts/NotificationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Settings, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export function DashboardNotificationsFixed() {
  const router = useRouter()
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    unreadCount 
  } = useNotifications()

  const recentNotifications = notifications.slice(0, 7)

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    // Navigate if there's an action URL
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  return (
    <Card className="h-fit max-h-96">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Manage</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadCount > 0 && (
                <DropdownMenuItem onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark all read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={clearAllNotifications}
                className="text-destructive focus:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Clear all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-xs">
          Latest 7 notifications • <button 
            onClick={() => router.push('/notifications')}
            className="text-blue-600 hover:underline"
          >
            View all
          </button>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        {recentNotifications.length > 0 ? (
          <ScrollArea className="h-64">
            <div className="space-y-0">
              {recentNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "px-3 py-2 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50",
                    !notification.read && "bg-muted/30"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "text-xs leading-tight break-words",
                          !notification.read ? "font-semibold" : "font-medium"
                        )}>
                          {notification.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground leading-tight break-words">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-muted-foreground opacity-70">
                      {getRelativeTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="px-6 py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs">We'll keep you updated on important events</p>
          </div>
        )}
        
        {notifications.length > 7 && (
          <div className="px-3 py-2 border-t">
            <button 
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => router.push('/notifications')}
            >
              +{notifications.length - 7} more notifications
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}