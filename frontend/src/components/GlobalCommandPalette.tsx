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
  ShieldCheck, ClipboardCheck, Wallet, Store, Image as ImageIcon, MailCheck,
  MessageCircle,
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
]

const OPERATOR_NAV: (CmdEntry & { module?: string })[] = [
  { title: "Dashboard", href: "/work/today", icon: LayoutDashboard },
  { title: "Operations", href: "/work/operations", icon: ListChecks, module: "operations" },
  { title: "Clients", href: "/work/clients", icon: Building2, module: "clients" },
  { title: "Users", href: "/work/users", icon: Users, module: "users" },
  { title: "Campaigns", href: "/work/campaigns", icon: Megaphone, module: "campaigns" },
  { title: "Proposals", href: "/work/proposals", icon: FileText, module: "proposals" },
  { title: "Influencer Database", href: "/work/influencers", icon: Database, module: "influencers" },
  { title: "Analyzed Creators", href: "/work/influencers/analyzed", icon: Users, module: "influencers" },
  { title: "FA Overview", href: "/work/fa", icon: LayoutDashboard, module: "fa" },
  { title: "FA Activity", href: "/work/fa/activity", icon: Activity, module: "fa" },
  { title: "FA Members", href: "/work/fa/members", icon: Users, module: "fa" },
  { title: "FA Campaigns", href: "/work/fa/campaigns", icon: Megaphone, module: "fa" },
  { title: "Receipt Claims", href: "/work/fa/receipt-claims", icon: Receipt, module: "fa" },
  { title: "Billing", href: "/work/billing", icon: Banknote, module: "billing" },
  { title: "System", href: "/work/system", icon: Wrench, module: "system" },

  // The sidebar now shows six surfaces rather than thirty entries. Everything that moved
  // under a parent is registered here, so consolidating the nav never makes a screen
  // unreachable — ⌘K stays the complete index of the platform.
  { title: "Today", href: "/work/today", icon: ListChecks },
  { title: "Waiting room", href: "/work/influencers/review", icon: Users,
    module: "influencers", keywords: "pending price approve creators" },
  { title: "Sourcing rounds", href: "/work/sourcing", icon: Target,
    module: "influencers", keywords: "shortlist samples client round" },
  { title: "Areas", href: "/work/areas", icon: List, module: "influencers" },
  { title: "Office screens", href: "/work/system/displays", icon: List, module: "system" },
  { title: "Approvals", href: "/work/approvals", icon: List, module: "campaigns" },
  { title: "Add / import creators", href: "/work/influencers/add", icon: Plus, module: "influencers" },
  { title: "Brand heartbeat", href: "/work/brands", icon: Activity,
    module: "clients", keywords: "silent quiet last contact whose move" },
  { title: "Creator team console", href: "/work/team", icon: Users,
    keywords: "approvals alerts people cofounder" },
  { title: "Goals", href: "/work/goals", icon: Target, keywords: "targets pace monthly rules daily" },
  { title: "Creators to chase", href: "/work/chasing", icon: List,
    keywords: "late content rate guide chasing overdue" },
  { title: "The team manual", href: "/work/manual", icon: List,
    keywords: "how work moves guide deck induction" },
  { title: "Report campaigns", href: "/work/report-campaigns", icon: FileText, module: "campaigns" },
  { title: "Operations queues", href: "/work/operations", icon: ListChecks, module: "operations" },
  { title: "Staff access", href: "/work/staff", icon: ShieldCheck, module: "users" },
  { title: "Content review", href: "/work/fa/deliverables", icon: ClipboardCheck, module: "fa" },
  { title: "Withdrawals", href: "/work/fa/withdrawals", icon: Banknote, module: "fa" },
  { title: "Creator wallets", href: "/work/fa/wallets", icon: Wallet, module: "fa" },
  { title: "Creator reliability", href: "/work/fa/reliability", icon: ShieldCheck, module: "fa" },
  { title: "Merchants", href: "/work/fa/merchants", icon: Store, module: "fa" },
  { title: "Ad banners", href: "/work/fa/ad-banners", icon: ImageIcon, module: "fa" },
  { title: "App notifications", href: "/work/fa/notifications", icon: Bell, module: "fa" },
  { title: "Email alerts", href: "/work/notifications", icon: MailCheck, module: "system" },
  { title: "WhatsApp", href: "/work/whatsapp", icon: MessageCircle, module: "system" },
  { title: "Job queue", href: "/work/system/jobs", icon: Wrench, module: "system" },
  { title: "Analyzed creators", href: "/work/influencers/analyzed", icon: Database, module: "influencers" },
  { title: "Coverage", href: "/work/coverage", icon: Database,
    module: "influencers", keywords: "gaps research backlog category market" },
  { title: "Creator payments", href: "/work/payables", icon: Banknote,
    keywords: "payables owed paid creators money book" },
  { title: "Production", href: "/ops/campaigns", icon: ClipboardCheck,
    module: "operations", keywords: "workstreams deliverables concepts ops" },
  { title: "Show me how", href: "/how", icon: BookOpen },
]

const OPERATOR_ACTIONS: (CmdEntry & { module?: string })[] = [
  { title: "Create User", href: "/work/users/create", icon: UserPlus, module: "users" },
  { title: "Create Campaign", href: "/work/campaigns/create", icon: Plus, module: "campaigns" },
  { title: "Create FA Campaign", href: "/work/fa/campaigns/new", icon: Plus, module: "fa" },
  { title: "Create cashback campaign", href: "/work/fa/campaigns/create", icon: Plus, module: "fa" },
  { title: "Create barter campaign", href: "/work/fa/campaigns/create-barter", icon: Plus, module: "fa" },
  { title: "Create paid deal campaign", href: "/work/fa/campaigns/create-paid-deal", icon: Plus, module: "fa" },
  { title: "Add creators", href: "/work/influencers/add", icon: Plus, module: "influencers" },
  { title: "New sourcing round", href: "/work/sourcing", icon: Plus, module: "influencers" },
  { title: "Create Proposal", href: "/work/proposals/create", icon: Plus, module: "proposals" },
]

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const { can, isSuperAdmin, role, isStaff } = useAdminAccess()

  // Everyone who works here, not only the founders.
  //
  // This asked the account role alone, and every member of staff — talent, business
  // development, account management, and the co-founder — is role='user' with a staff role.
  // So four of the five people in the company pressed ⌘K and got the *brand customer* menu:
  // Discover Creators, My Creators, Billing. Meanwhile the sidebar's own promise is that
  // anything not surfaced directly stays one keystroke away in here, which made every screen
  // trimmed from a menu genuinely unreachable for them.
  const isOperator =
    isSuperAdmin || isStaff || role === "admin" ||
    ["admin", "super_admin", "superadmin"].includes((user?.role || "").toLowerCase())

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    // Visible entry points (e.g. the topbar "Search ⌘K" chip) open the palette via this event.
    const openViaEvent = () => setOpen(true)
    document.addEventListener("keydown", down)
    window.addEventListener("open-command-palette", openViaEvent)
    return () => {
      document.removeEventListener("keydown", down)
      window.removeEventListener("open-command-palette", openViaEvent)
    }
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
