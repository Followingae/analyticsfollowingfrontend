"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { useNotifications } from "@/contexts/NotificationContext"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Page, PageHead, ListRow, Nothing } from "@/components/brand/primitives"
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
  Megaphone,
  FileUp,
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

/**
 * Thirteen notification types used to carry thirteen hand-picked hues: green, red, blue,
 * indigo, emerald, cyan, purple, orange. None of them is a token in this theme, six of
 * them are near-indistinguishable from each other, and none of them told the reader
 * anything the icon and the title were not already saying.
 *
 * So colour is now reserved for the three cases where it IS the information: something
 * needs money (warning), something was taken away (danger), something arrived (success).
 * Everything else is the icon, in the muted ink, and the type is a word in the meta line.
 */
const ICON_MAP: Record<ServerNotificationType, {
  icon: React.ComponentType<{ className?: string }>
  tone: 'plain' | 'good' | 'warn' | 'bad'
}> = {
  share_received:      { icon: Link2,         tone: 'good' },
  share_revoked:       { icon: Link2,         tone: 'bad' },
  share_extended:      { icon: Clock,         tone: 'plain' },
  proposal_received:   { icon: FileText,      tone: 'plain' },
  proposal_updated:    { icon: FileCheck,     tone: 'plain' },
  campaign_application:{ icon: Megaphone,     tone: 'plain' },
  campaign_deliverable:{ icon: FileUp,        tone: 'plain' },
  analytics_completed: { icon: BarChart3,     tone: 'plain' },
  credit_purchase:     { icon: CreditCard,    tone: 'good' },
  low_balance:         { icon: AlertTriangle, tone: 'warn' },
  team_invite:         { icon: UserPlus,      tone: 'plain' },
  team_update:         { icon: Users,         tone: 'plain' },
  system:              { icon: Bell,          tone: 'plain' },
}

const TONE_INK = {
  plain: 'text-muted-foreground',
  good: 'text-success',
  warn: 'text-warning',
  bad: 'text-danger',
} as const

function NotifIcon({ type }: { type: ServerNotificationType }) {
  const entry = ICON_MAP[type] || ICON_MAP.system
  const Icon = entry.icon
  // No coloured disc behind it. The disc was a second shape per row for thirteen rows,
  // which is what made this page read as a wall rather than a list.
  return <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', TONE_INK[entry.tone])} />
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
  { key: 'campaigns', label: 'Campaigns', countKey: 'unread_campaigns' },
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
        {/* Density tier: SCANNING. The rows are the page, so the air goes to the page
            margin and the rail, never between the rows. Two nested cards came off: the
            category rail was a card of buttons and the feed was a card of rows, so every
            notification sat inside three borders. Now the rail is a plain column of links
            and the feed is one list on the page ground with a hairline between rows. */}
        <Page tier="scanning">

          <PageHead
            back={
              <button
                type="button"
                onClick={() => router.back()}
                className="-ml-1 inline-flex w-fit items-center gap-1.5 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            }
            title="Notifications"
            sub="Shares, proposals, campaigns, analytics and billing, newest first."
            action={
              activeCategoryUnread > 0 ? (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  <Check className="mr-1.5 h-4 w-4" />
                  Mark all read
                </Button>
              ) : undefined
            }
          />

          <div className="grid grid-cols-1 gap-ds-5 lg:grid-cols-[200px_minmax(0,1fr)]">

            {/* The rail. Horizontal on mobile, a column on large screens, and quiet either
                way: the selected item is the one in the foreground ink, not the one with a
                filled primary background shouting over the page's real action. */}
            <nav className="flex gap-ds-3 overflow-x-auto border-b border-border/70 pb-ds-2 lg:flex-col lg:gap-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-ds-3">
              {CATEGORY_TABS.map(tab => {
                const count = tab.countKey ? unreadCounts[tab.countKey] : unreadCounts.total_unread
                const isActive = activeCategory === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={cn(
                      "flex shrink-0 items-center justify-between gap-ds-2 whitespace-nowrap rounded-ds-md text-ds-label transition-colors lg:w-full lg:px-2 lg:py-2",
                      isActive
                        ? "font-semibold text-foreground lg:bg-muted"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className="text-ds-caption tabular-nums text-muted-foreground">{count}</span>
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="flex min-w-0 flex-col gap-ds-3">
              <label className="flex w-fit cursor-pointer items-center gap-ds-2">
                <Checkbox
                  checked={unreadOnly}
                  onCheckedChange={(checked) => setUnreadOnly(checked === true)}
                />
                <span className="text-ds-body-sm text-muted-foreground">Unread only</span>
              </label>

              {filtered.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-300px)] min-h-[400px]">
                  <div className="flex flex-col border-t border-border/70">
                    {filtered.map(n => (
                      <ListRow key={n.id} onClick={() => handleNotificationClick(n)} className="items-start">
                        <NotifIcon type={n.notification_type} />
                        <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                          <span className="flex items-center gap-ds-2">
                            <span className={cn('min-w-0 text-ds-body leading-snug', !n.is_read && 'font-semibold')}>
                              {n.title}
                            </span>
                            {/* Unread, on the theme's own primary rather than a raw blue. */}
                            {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                          </span>
                          {n.message && (
                            <span className="max-w-[65ch] text-ds-body-sm leading-snug text-muted-foreground">
                              {n.message}
                            </span>
                          )}
                          <span className="text-ds-caption text-muted-foreground">
                            {getRelativeTime(n.created_at)}
                            {' · '}
                            {n.notification_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {n.action_url && (
                          <span className="hidden shrink-0 text-ds-body-sm text-primary sm:block">Open</span>
                        )}
                      </ListRow>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                /* Genuinely nothing. One sentence, no illustration, no pitch. */
                <Nothing>
                  {unreadOnly
                    ? 'Nothing unread here.'
                    : activeCategory === 'all'
                      ? 'Nothing yet.'
                      : 'Nothing in this category yet.'}
                </Nothing>
              )}
            </div>

          </div>
        </Page>
      </BrandUserInterface>
    </AuthGuard>
  )
}
