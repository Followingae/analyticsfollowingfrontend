"use client"

/**
 * Global ⌘K / Ctrl+K command palette — one fast way to move anywhere.
 * Role-aware: brands see brand destinations, operators see the operator
 * console (filtered by their allowed modules).
 */

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Compass, List, Share2, Target, FileText,
  CreditCard, Settings, Bell, BookOpen, Building2, ListChecks, Megaphone,
  Database, Wrench, Banknote, UserPlus, Plus, Receipt, Activity,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useAdminAccess } from "@/hooks/useAdminAccess"

type CmdEntry = { title: string; href: string; icon: React.ElementType; keywords?: string }

const BRAND_NAV: CmdEntry[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Discover Creators", href: "/discover", icon: Compass, keywords: "discovery search" },
  { title: "My Creators", href: "/creators", icon: Users, keywords: "unlocked portfolio" },
  { title: "Shared With Me", href: "/shared-influencers", icon: Share2 },
  { title: "Lists", href: "/my-lists", icon: List },
  { title: "Campaigns", href: "/campaigns", icon: Target },
  { title: "Proposals", href: "/proposals", icon: FileText },
  { title: "Billing", href: "/billing", icon: CreditCard, keywords: "subscription invoices credits" },
  { title: "Cashback Pool", href: "/billing?tab=cashback-pool", icon: Banknote, keywords: "pool topup" },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Guide", href: "/guide", icon: BookOpen, keywords: "help support" },
]

const OPERATOR_NAV: (CmdEntry & { module?: string })[] = [
  { title: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
  { title: "Operations", href: "/superadmin/operations", icon: ListChecks, module: "operations" },
  { title: "Clients", href: "/superadmin/clients", icon: Building2, module: "clients" },
  { title: "Users", href: "/superadmin/users", icon: Users, module: "users" },
  { title: "Campaigns", href: "/superadmin/campaigns", icon: Megaphone, module: "campaigns" },
  { title: "Proposals", href: "/superadmin/proposals", icon: FileText, module: "proposals" },
  { title: "Influencer Database", href: "/superadmin/influencers", icon: Database, module: "influencers" },
  { title: "Analyzed Creators", href: "/superadmin/influencers/analyzed", icon: Users, module: "influencers" },
  { title: "FA Overview", href: "/superadmin/fa", icon: LayoutDashboard, module: "fa" },
  { title: "FA Activity", href: "/superadmin/fa/activity", icon: Activity, module: "fa" },
  { title: "FA Members", href: "/superadmin/fa/members", icon: Users, module: "fa" },
  { title: "FA Campaigns", href: "/superadmin/fa/campaigns", icon: Megaphone, module: "fa" },
  { title: "Receipt Claims", href: "/superadmin/fa/receipt-claims", icon: Receipt, module: "fa" },
  { title: "Billing", href: "/superadmin/billing", icon: Banknote, module: "billing" },
  { title: "System", href: "/superadmin/system", icon: Wrench, module: "system" },
]

const OPERATOR_ACTIONS: (CmdEntry & { module?: string })[] = [
  { title: "Create User", href: "/superadmin/users/create", icon: UserPlus, module: "users" },
  { title: "Create Campaign", href: "/superadmin/campaigns/create", icon: Plus, module: "campaigns" },
  { title: "Create FA Campaign", href: "/superadmin/fa/campaigns/new", icon: Plus, module: "fa" },
  { title: "Create Proposal", href: "/superadmin/proposals/create", icon: Plus, module: "proposals" },
]

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const { can, isSuperAdmin, role } = useAdminAccess()

  const isOperator =
    isSuperAdmin || role === "admin" ||
    ["admin", "super_admin", "superadmin"].includes((user?.role || "").toLowerCase())

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  const operatorNav = OPERATOR_NAV.filter((e) => !e.module || can(e.module as never))
  const operatorActions = OPERATOR_ACTIONS.filter((e) => !e.module || can(e.module as never))

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Jump anywhere">
      <CommandInput placeholder="Where to? Type a page or action…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {isOperator ? (
          <>
            <CommandGroup heading="Go to">
              {operatorNav.map((e) => (
                <CommandItem key={e.href} keywords={e.keywords?.split(" ")} onSelect={() => go(e.href)}>
                  <e.icon className="h-4 w-4" />
                  {e.title}
                </CommandItem>
              ))}
            </CommandGroup>
            {operatorActions.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  {operatorActions.map((e) => (
                    <CommandItem key={e.href} onSelect={() => go(e.href)}>
                      <e.icon className="h-4 w-4" />
                      {e.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        ) : (
          <CommandGroup heading="Go to">
            {BRAND_NAV.map((e) => (
              <CommandItem key={e.href} keywords={e.keywords?.split(" ")} onSelect={() => go(e.href)}>
                <e.icon className="h-4 w-4" />
                {e.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
