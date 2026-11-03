"use client"

/**
 * The console's own navigation renderer.
 *
 * WHY THIS EXISTS RATHER THAN `nav-main.tsx`.
 *
 * `nav-main.tsx` is rendered by BOTH this console and the brand-facing app
 * (`components/brand/EnhancedAppSidebar.tsx`). The console needed to behave differently when
 * the sidebar is collapsed, and changing the shared file to get that would have changed the
 * navigation our paying clients use. So the console gets its own renderer and the brand app
 * keeps the one it has. Same reasoning as the rest of the internal rebuild: if the console
 * needs a different thing, it gets its own, it does not restyle the client's.
 *
 * THE BUG IT FIXES.
 *
 * The sidebar used to be `collapsible="offcanvas"`, which means collapsing it slides the whole
 * thing off the screen and leaves no navigation at all. The owner's words were that the sidebar
 * "kept disappearing". It is now `collapsible="icon"`, which keeps a rail of icons.
 *
 * But icon mode has a trap. shadcn hides `SidebarMenuSub` at icon width
 * (`group-data-[collapsible=icon]:hidden`), so our three collapsible parents (Company, Creator
 * app, Settings) would have become icons that open an invisible submenu: a control that looks
 * live and does nothing. So:
 *
 *   expanded  -> a parent is a Collapsible, exactly as before.
 *   collapsed -> a parent is a DropdownMenu anchored to its icon, listing the same children.
 *
 * Nothing is ever unreachable at either width, and no row is ever a dead control.
 *
 * HUBS ARE PARENTS TOO (2026-11-03).
 *
 * Clients, Creators, Campaigns and Money used to draw a row of tabs across the top of each of
 * their screens. Those screens are listed here now, as the hub's submenu. A hub parent differs
 * from a category parent (Company, Settings) in one way: it is also a PLACE, so its name is a
 * link to the hub's landing screen and the chevron beside it is what opens and closes the list.
 * A category's whole row is the toggle, because there is nowhere for it to go.
 *
 * At icon width a hub is the same dropdown a category is, listing every screen under it, so
 * collapsing the sidebar never costs a screen. The hub's badge rides on the parent (a dot at
 * icon width), and a screen with something waiting on it carries its own number.
 *
 * TWO SMALLER RULES WORTH KEEPING.
 *
 *   A badge is a demand, not a record count. It renders only above zero, and at icon width,
 *   where there is no room for a number, it becomes a dot. The count is still announced to a
 *   screen reader as a sentence, because "Inbox 12" read aloud as "Inbox12" is the kind of
 *   detail that makes people stop trusting the thing.
 *
 *   Every entry carries `tooltip`, which is what makes icon mode legible. Without it the rail
 *   is a column of unlabelled glyphs, and the whole reason the brief says icons carry data and
 *   not names is that a glyph alone is a guess.
 */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface ConsoleNavSubItem {
  title: string
  url: string
  /** Something waiting on this one screen. 0 draws nothing. */
  badge?: number
}

export interface ConsoleNavItem {
  title: string
  url: string
  icon?: LucideIcon
  /** How many things are waiting behind this entry. A demand, not a record count. 0 draws nothing. */
  badge?: number
  items?: ConsoleNavSubItem[]
  /**
   * Set on a HUB parent: the screen its name opens. A category parent (Company, Settings)
   * has none, because it is not a place, and its whole row opens the list instead.
   */
  landing?: string
}

/** Prefix-aware fallback, used only when the sidebar has not pre-resolved the active url. */
function isPathActive(pathname: string, url: string): boolean {
  if (!url || url === "#") return false
  if (url === "/") return pathname === "/"
  return pathname === url || pathname.startsWith(url + "/")
}

/** The waiting count, drawn as a number when there is room and a dot when there is not. */
function Badge({ n, label, collapsed }: { n: number; label: string; collapsed: boolean }) {
  if (!n || n <= 0) return null
  if (collapsed) {
    return (
      <>
        <span
          aria-hidden
          className="absolute right-1 top-1 size-2 rounded-full bg-[var(--console-lime)]
                     ring-2 ring-sidebar"
        />
        <span className="sr-only">{`${n} waiting in ${label}`}</span>
      </>
    )
  }
  return (
    <>
      <span
        aria-hidden
        className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md
                   bg-[var(--console-lime)] px-1.5 text-[11px] font-semibold tabular-nums
                   text-[color:var(--console-lime-ink,#2C3605)]"
      >
        {n}
      </span>
      <span className="sr-only">{`${n} waiting`}</span>
    </>
  )
}

/** A sub-item's count: quieter than the parent's, because the parent already carries it. */
function SubCount({ n }: { n?: number }) {
  if (!n || n <= 0) return null
  return (
    <>
      <span
        aria-hidden
        className="ml-auto rounded-md bg-sidebar-accent px-1.5 text-[11px] font-medium
                   tabular-nums text-sidebar-accent-foreground"
      >
        {n}
      </span>
      <span className="sr-only">{`${n} waiting`}</span>
    </>
  )
}

/** The list under a parent, shared by hubs and categories. */
function SubList({ items, activeOf }: {
  items: ConsoleNavSubItem[]
  activeOf: (url: string) => boolean
}) {
  return (
    <SidebarMenuSub>
      {items.map((sub) => (
        <SidebarMenuSubItem key={sub.url}>
          <SidebarMenuSubButton asChild isActive={activeOf(sub.url)}>
            <Link href={sub.url}>
              <span className="truncate">{sub.title}</span>
              <SubCount n={sub.badge} />
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  )
}

/**
 * A parent, expanded. Open when the screen you are on is one of its children, so you are
 * never looking at a closed group that contains you; otherwise closed until asked.
 */
function ParentGroup({ item, activeOf }: {
  item: ConsoleNavItem
  activeOf: (url: string) => boolean
}) {
  const children = item.items ?? []
  const isSubActive = children.some((s) => activeOf(s.url))
  const [open, setOpen] = React.useState(isSubActive)

  // Arriving on one of its screens some other way (Command-K, a link inside a page) opens it.
  React.useEffect(() => { if (isSubActive) setOpen(true) }, [isSubActive])

  if (item.landing) {
    const landing = item.landing
    return (
      <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={item.title} asChild className="rounded-xl">
            <Link href={landing} onClick={() => setOpen(true)}>
              {item.icon && <item.icon className="size-4" />}
              <span>{item.title}</span>
              <Badge n={item.badge ?? 0} label={item.title} collapsed={false} />
            </Link>
          </SidebarMenuButton>
          <CollapsibleTrigger asChild>
            <SidebarMenuAction
              aria-label={open ? `Close ${item.title}` : `Open ${item.title}`}
              className="transition-transform duration-200 data-[state=open]:rotate-90"
            >
              <ChevronRight />
            </SidebarMenuAction>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SubList items={children} activeOf={activeOf} />
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} className="rounded-xl">
            {item.icon && <item.icon className="size-4" />}
            <span>{item.title}</span>
            <ChevronRight
              className="ml-auto size-4 transition-transform duration-200
                         group-data-[state=open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SubList items={children} activeOf={activeOf} />
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function ConsoleNav({
  items,
  activeUrl,
}: {
  items: ConsoleNavItem[]
  /**
   * The single nav URL that should render active, pre-resolved by the sidebar as the longest
   * match across every group. Without it, section roots prefix-match and light up on every
   * nested page.
   */
  activeUrl?: string
}) {
  const pathname = usePathname() || ""
  const { state, isMobile } = useSidebar()
  // On mobile the sidebar opens as a full sheet, so it is never the icon rail.
  const collapsed = state === "collapsed" && !isMobile

  const activeOf = (url: string) =>
    activeUrl !== undefined ? url === activeUrl : isPathActive(pathname, url)

  return (
    <SidebarMenu>
      {items.map((item) => {
        const hasSubItems = !!item.items && item.items.length > 0

        /* ── A parent with children ────────────────────────────────────────────────────── */
        if (hasSubItems) {
          const children = item.items!
          const isSubActive = children.some((s) => activeOf(s.url))

          // Collapsed: a dropdown, because the inline submenu is hidden at this width. It
          // lists every child, so collapsing the sidebar never costs a screen.
          if (collapsed) {
            return (
              <SidebarMenuItem key={item.title} className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isSubActive}
                      className="rounded-xl"
                    >
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                      <Badge n={item.badge ?? 0} label={item.title} collapsed />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="min-w-44">
                    <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {children.map((sub) => (
                      <DropdownMenuItem key={sub.url} asChild>
                        <Link href={sub.url} className={cn(activeOf(sub.url) && "font-medium")}>
                          <span>{sub.title}</span>
                          {!!sub.badge && sub.badge > 0 && (
                            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                              {sub.badge}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          }

          // Expanded: the inline collapsible.
          return <ParentGroup key={item.title} item={item} activeOf={activeOf} />
        }

        /* ── A leaf ───────────────────────────────────────────────────────────────────── */
        const isActive = activeOf(item.url)
        return (
          <SidebarMenuItem key={item.url || item.title} className="relative">
            <SidebarMenuButton
              tooltip={item.title}
              asChild
              className={cn(
                "rounded-xl transition-colors duration-150",
                isActive &&
                  "bg-sidebar-primary text-sidebar-primary-foreground font-medium " +
                    "hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
              )}
            >
              <Link href={item.url}>
                {item.icon && <item.icon className="size-4" />}
                <span>{item.title}</span>
                <Badge n={item.badge ?? 0} label={item.title} collapsed={collapsed} />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
