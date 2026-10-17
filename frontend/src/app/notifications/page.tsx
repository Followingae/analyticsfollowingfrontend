"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { useNotifications } from "@/contexts/NotificationContext"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Page, PageHead, ListRow, Nothing } from "@/components/brand/primitives"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import {
  ServerNotification,
  UnreadCounts,
  NOTIFICATION_CATEGORIES,
  NotificationCategory,
  CATEGORY_DOMAIN,
  CATEGORY_LABEL,
} from "@/services/notificationApi"
import { lookFor, TONE_INK } from "@/components/notifications/notifIcons"

/**
 * The glyph and the tone come from the table shared with the bell, so the same event does
 * not arrive wearing two different icons depending on where you read it.
 *
 * No coloured disc behind it. The disc was a second shape per row, which is what made this
 * page read as a wall rather than a list.
 */
function NotifIcon({ type }: { type: string }) {
  const { icon: Icon, tone } = lookFor(type)
  return <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', TONE_INK[tone])} />
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
  countKey: keyof UnreadCounts
}

/**
 * One tab per catalog group, derived rather than listed.
 *
 * There were seven hand-written tabs covering the brand-facing half of the catalog, so a
 * sourcing alert, an approval, a creator payment and a quiet client landed in the feed and
 * belonged to no tab: visible under "All" and nowhere else, which on a busy day means never
 * seen. The order follows the catalog's own domain order, and a tab with nothing in it is
 * not rendered, so a brand user still sees the five groups that concern them.
 */
const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'Everything', countKey: 'total_unread' },
  ...(Object.keys(NOTIFICATION_CATEGORIES) as NotificationCategory[]).map(key => ({
    key,
    label: CATEGORY_LABEL[key],
    countKey: `unread_${key}` as keyof UnreadCounts,
  })),
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

  /* Fifteen tabs is a wall, and most people only ever receive events from four or five
     groups. A tab is shown when something in it has arrived, or when it is the tab you are
     reading, so selecting the last item in a group does not make the tab vanish underneath
     you as it goes to zero. */
  const tabs = useMemo(() => CATEGORY_TABS.filter(t => {
    if (t.key === 'all' || t.key === activeCategory) return true
    const types = NOTIFICATION_CATEGORIES[t.key] as readonly string[]
    return notifications.some(n => types.includes(n.notification_type))
  }), [notifications, activeCategory])

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
    // By domain. This used to send the FIRST type in the group, so pressing "mark all read"
    // on a tab showing eight alerts cleared one of them and left the tab looking broken.
    if (activeCategory !== 'all') {
      markAllAsRead({ domain: CATEGORY_DOMAIN[activeCategory] })
    } else {
      markAllAsRead()
    }
  }

  const activeCategoryUnread = activeCategory === 'all'
    ? unreadCounts.total_unread
    : (unreadCounts[`unread_${activeCategory}` as keyof UnreadCounts] ?? 0)

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
            sub="Everything the platform has told you, newest first."
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
              {tabs.map(tab => {
                const count = unreadCounts[tab.countKey] ?? 0
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
