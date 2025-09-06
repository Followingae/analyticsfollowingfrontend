"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { useNotifications } from "@/contexts/NotificationContext"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  Check, 
  X, 
  Settings,
  Filter,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}

export default function NotificationsPage() {
  const router = useRouter()
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    unreadCount 
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.back()}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                      <Bell className="h-8 w-8" />
                      Notifications
                    </h1>
                    <p className="text-muted-foreground">
                      Manage your notifications and activity updates
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark all read ({unreadCount})
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllNotifications}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear all
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Total</p>
                        <p className="text-2xl font-bold">{notifications.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-600 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">Unread</p>
                        <p className="text-2xl font-bold">{unreadCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Read</p>
                        <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Today</p>
                        <p className="text-2xl font-bold">
                          {notifications.filter(n => {
                            const today = new Date()
                            const notifDate = new Date(n.timestamp)
                            return notifDate.toDateString() === today.toDateString()
                          }).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notifications List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Notifications</CardTitle>
                    <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
                      <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">
                          Unread
                          {unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredNotifications.length > 0 ? (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-0">
                        {filteredNotifications.map((notification, index) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "px-6 py-4 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50",
                              !notification.read && "bg-muted/30"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className={cn(
                                    "font-medium",
                                    !notification.read && "font-semibold"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {notification.type}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">
                                    {getRelativeTime(notification.timestamp)}
                                  </p>
                                  {notification.actionUrl && (
                                    <span className="text-xs text-blue-600">
                                      Click to view →
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="px-6 py-12 text-center text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">
                        {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                      </h3>
                      <p className="text-sm">
                        {filter === 'unread' 
                          ? 'All caught up! Check back later for new updates.'
                          : 'We\'ll notify you about important updates and activities.'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}