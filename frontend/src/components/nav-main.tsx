"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

/**
 * Prefix-aware active state: detail pages highlight their parent nav item
 * (e.g. /campaigns/123/posts keeps "Campaigns" active). Root ("/") only
 * matches exactly so it doesn't light up for every route.
 */
function isPathActive(pathname: string, url: string): boolean {
  if (!url || url === "#") return false
  if (url === "/") return pathname === "/"
  return pathname === url || pathname.startsWith(url + "/")
}

export function NavMain({
  items,
  activeUrl,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    items?: {
      title: string
      url: string
    }[]
  }[]
  /**
   * The single nav URL that should render active, pre-resolved by the sidebar as
   * the longest match across ALL groups. When provided, an item is active only
   * when its url === activeUrl — so section roots (e.g. /superadmin, /superadmin/fa)
   * no longer light up on every nested page. Falls back to per-item prefix matching
   * when omitted (other sidebars that don't pass it).
   */
  activeUrl?: string
}) {
  const pathname = usePathname() || ""
  const activeOf = (url: string) => (activeUrl !== undefined ? url === activeUrl : isPathActive(pathname, url))

  return (
    <SidebarMenu>
      {items.map((item) => {
        const hasSubItems = item.items && item.items.length > 0

        if (hasSubItems) {
          const isSubActive = item.items?.some(subItem => activeOf(subItem.url))

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isSubActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {(() => {
                      // Longest matching prefix wins, so "All Campaigns" (/campaigns)
                      // yields to "Create Campaign" (/campaigns/create) on that page
                      // but stays active on /campaigns/123 detail pages.
                      const best = activeUrl !== undefined
                        ? item.items?.find(s => s.url === activeUrl)
                        : item.items
                            ?.filter(s => isPathActive(pathname, s.url))
                            .sort((a, b) => b.url.length - a.url.length)[0]
                      return item.items?.map((subItem) => {
                      const isSubItemActive = best?.url === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubItemActive}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })
                    })()}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        }

        const isActive = activeOf(item.url)
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              asChild
              className={cn(
                "transition-colors duration-150",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
            >
              <Link href={item.url}>
                {item.icon && <item.icon className="size-4" />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
