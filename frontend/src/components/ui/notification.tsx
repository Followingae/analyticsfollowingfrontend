"use client"

import * as React from "react"
import {
  Bell,
  Link2,
  Clock,
  FileText,
  FileCheck,
  BarChart3,
  CreditCard,
  AlertTriangle,
  UserPlus,
  Users,
} from "lucide-react"
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
import { useRouter } from "next/navigation"
import {
  ServerNotification,
  ServerNotificationType,
  UnreadCounts,
  NOTIFICATION_CATEGORIES,
  NotificationCategory,
} from "@/services/notificationApi"

// ── Icon + color map ──────────────────────────────────────────────────

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
    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", entry.bg)}>
      <Icon className={cn("h-4 w-4", entry.color)} />
    </div>
  )
}

// ── Relative time ─────────────────────────────────────────────────────

function getRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m}m ago` }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h}h ago` }
  if (diff < 172800) return 'Yesterday'
  if (diff < 604800) { const d = Math.floor(diff / 86400); return `${d}d ago` }
  return new Date(iso).toLocaleDateString()
}

// ── Bell Component ────────────────────────────────────────────────────

interface NotificationBellProps {
  notifications: ServerNotification[]
  unreadCounts: UnreadCounts
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: (notificationType?: string) => void
  className?: string
}

export function NotificationBell({
  notifications,
  unreadCounts,
  onMarkAsRead,
  onMarkAllAsRead,
  className,
}: NotificationBellProps) {
  const router = useRouter()

  // Bell dropdown shows unread only
  const unreadItems = notifications.filter(n => !n.is_read)
  const displayItems = unreadItems.slice(0, 8)
  const total = unreadCounts.total_unread

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className={cn("relative", className)}>
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {total > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] px-1 text-[10px] flex items-center justify-center"
            >
              {total > 99 ? '99+' : total}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px]" sideOffset={8}>
        {/* Header */}
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {total > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.preventDefault(); onMarkAllAsRead() }}
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* List */}
        {displayItems.length > 0 ? (
          <div className="max-h-[360px] overflow-y-auto">
            {displayItems.map(n => (
              <DropdownMenuItem
                key={n.id}
                className="px-3 py-2.5 cursor-pointer focus:bg-muted gap-3"
                onClick={() => {
                  if (!n.is_read) onMarkAsRead(n.id)
                  if (n.action_url) router.push(n.action_url)
                }}
              >
                <NotifIcon type={n.notification_type} />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm leading-tight truncate", !n.is_read ? "font-semibold" : "font-medium")}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-muted-foreground leading-tight truncate">
                      {n.message}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {getRelativeTime(n.created_at)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="px-3 py-8 text-center text-muted-foreground">
            <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No unread notifications</p>
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center py-2 cursor-pointer"
          onClick={() => router.push('/notifications')}
        >
          <span className="text-sm text-primary font-medium">View all notifications</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Re-export types so existing imports don't break
export type { ServerNotification as Notification, ServerNotificationType as NotificationType }
