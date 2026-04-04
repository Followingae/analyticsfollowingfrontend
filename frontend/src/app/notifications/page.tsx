"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { useNotifications } from "@/contexts/NotificationContext"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Bell,
  Check,
  Link2,
  Clock,
  FileText,
  FileCheck,
  BarChart3,
  CreditCard,
  AlertTriangle,
  UserPlus,
  Users,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import {
  ServerNotification,
  ServerNotificationType,
  UnreadCounts,
  NOTIFICATION_CATEGORIES,
  NotificationCategory,
} from "@/services/notificationApi"

// ── Icon + color map (matches bell dropdown) ─────────────────────────

const ICON_MAP: Record<ServerNotificationType, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}> = {
  share_received:      { icon: Link2,          color: 'text-green-500',  bg: 'bg-green-500/10' },
  share_revoked:       { icon: Link2,          color: 'text-red-500',    bg: 'bg-red-500/10' },
  share_extended:      { icon: Clock,          color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  proposal_received:   { icon: FileText,       color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  proposal_updated:    { icon: FileCheck,      color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  analytics_completed: { icon: BarChart3,      color: 'text-purple-500', bg: 'bg-purple-500/10' },
  credit_purchase:     { icon: CreditCard,     color: 'text-green-500',  bg: 'bg-green-500/10' },
  low_balance:         { icon: AlertTriangle,  color: 'text-orange-500', bg: 'bg-orange-500/10' },
  team_invite:         { icon: UserPlus,       color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  team_update:         { icon: Users,          color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  system:              { icon: Bell,           color: 'text-muted-foreground', bg: 'bg-muted' },
}

function NotifIcon({ type }: { type: ServerNotificationType }) {
  const entry = ICON_MAP[type] || ICON_MAP.system
  const Icon = entry.icon
  return (
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", entry.bg)}>
      <Icon className={cn("h-5 w-5", entry.color)} />
    </div>
  )
}

// ── Relative time ────────────────────────────────────────────────────

function getRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} minute${m > 1 ? 's' : ''} ago` }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hour${h > 1 ? 's' : ''} ago` }
  if (diff < 172800) return 'Yesterday'
  if (diff < 604800) { const d = Math.floor(diff / 86400); return `${d} day${d > 1 ? 's' : ''} ago` }
  return new Date(iso).toLocaleDateString()
}

// ── Category tabs ────────────────────────────────────────────────────

interface CategoryTab {
  key: 'all' | NotificationCategory
  label: string
  countKey?: keyof UnreadCounts
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all',       label: 'All Notifications' },
  { key: 'shares',    label: 'Shares',    countKey: 'unread_shares' },
  { key: 'proposals', label: 'Proposals', countKey: 'unread_proposals' },
  { key: 'analytics', label: 'Analytics', countKey: 'unread_analytics' },
  { key: 'billing',   label: 'Billing',   countKey: 'unread_billing' },
  { key: 'team',      label: 'Team',      countKey: 'unread_team' },
]

// ── Page ─────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter()
  const {
    notifications,
    unreadCounts,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const [activeCategory, setActiveCategory] = useState<'all' | NotificationCategory>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const filtered = useMemo(() => {
    let items = notifications
    if (activeCategory !== 'all') {
      const types = NOTIFICATION_CATEGORIES[activeCategory] as readonly string[]
      items = items.filter(n => types.includes(n.notification_type))
    }
    if (unreadOnly) {
      items = items.filter(n => !n.is_read)
    }
    return items
  }, [notifications, activeCategory, unreadOnly])

  const handleNotificationClick = (notification: ServerNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const handleMarkAllRead = () => {
    if (activeCategory !== 'all') {
      const types = NOTIFICATION_CATEGORIES[activeCategory]
      markAllAsRead(types[0])
    } else {
      markAllAsRead()
    }
  }

  const activeCategoryUnread = activeCategory === 'all'
    ? unreadCounts.total_unread
    : (unreadCounts[CATEGORY_TABS.find(t => t.key === activeCategory)?.countKey || 'total_unread' as keyof UnreadCounts] ?? 0)

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
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
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      <Bell className="h-6 w-6" />
                      Notifications
                      {unreadCounts.total_unread > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {unreadCounts.total_unread}
                        </Badge>
                      )}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Stay updated with shares, proposals, analytics, and more
                    </p>
                  </div>
                </div>
              </div>

              {/* Main layout: sidebar tabs + content */}
              <div className="grid grid-cols-12 gap-6">

                {/* Left sidebar - category tabs */}
                <div className="col-span-3">
                  <Card>
                    <CardContent className="p-2">
                      <nav className="space-y-0.5">
                        {CATEGORY_TABS.map(tab => {
                          const count = tab.countKey ? unreadCounts[tab.countKey] : unreadCounts.total_unread
                          const isActive = activeCategory === tab.key
                          return (
                            <button
                              key={tab.key}
                              onClick={() => setActiveCategory(tab.key)}
                              className={cn(
                                "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <span>{tab.label}</span>
                              {count > 0 && (
                                <Badge
                                  variant={isActive ? "secondary" : "outline"}
                                  className={cn(
                                    "h-5 min-w-[20px] px-1.5 text-[11px]",
                                    isActive && "bg-primary-foreground/20 text-primary-foreground border-0"
                                  )}
                                >
                                  {count}
                                </Badge>
                              )}
                            </button>
                          )
                        })}
                      </nav>
                    </CardContent>
                  </Card>
                </div>

                {/* Main content */}
                <div className="col-span-9">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {CATEGORY_TABS.find(t => t.key === activeCategory)?.label || 'All Notifications'}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                          {/* Unread only toggle */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={unreadOnly}
                              onCheckedChange={(checked) => setUnreadOnly(checked === true)}
                            />
                            <span className="text-sm text-muted-foreground">Unread only</span>
                          </label>
                          {/* Mark all read (scoped) */}
                          {activeCategoryUnread > 0 && (
                            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                              <Check className="h-4 w-4 mr-1.5" />
                              Mark all read
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {filtered.length > 0 ? (
                        <ScrollArea className="h-[600px]">
                          <div className="divide-y">
                            {filtered.map(n => (
                              <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={cn(
                                  "group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/50",
                                  !n.is_read && "bg-muted/30"
                                )}
                              >
                                <NotifIcon type={n.notification_type} />
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className={cn(
                                      "text-sm leading-tight",
                                      !n.is_read ? "font-semibold" : "font-medium"
                                    )}>
                                      {n.title}
                                    </h4>
                                    {!n.is_read && (
                                      <div className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                    )}
                                  </div>
                                  {n.message && (
                                    <p className="text-sm text-muted-foreground leading-snug">
                                      {n.message}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">
                                      {getRelativeTime(n.created_at)}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                      {n.notification_type.replace(/_/g, ' ')}
                                    </Badge>
                                    {n.action_url && (
                                      <span className="text-xs text-primary">
                                        View details →
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="px-6 py-16 text-center text-muted-foreground">
                          <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                          <h3 className="text-base font-medium mb-1">
                            {unreadOnly ? 'No unread notifications' : 'No notifications'}
                          </h3>
                          <p className="text-sm">
                            {unreadOnly
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
            </div>
          </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}
