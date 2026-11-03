"use client"

/**
 * Global ⌘K / Ctrl+K command palette — one fast way to move anywhere.
 * Role-aware: brands see brand destinations, operators see the operator
 * console (filtered by their allowed modules).
 */

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Banknote, Bell, BookOpen, Building2, ClipboardCheck, Compass, CreditCard, Database, FileText, Hand, Image as ImageIcon, Inbox, LayoutDashboard, Link2, List, ListChecks, Mail, MailCheck, Megaphone, MessageCircle, Plus, Radar, Receipt, Send, Settings, Share2, ShieldCheck, Store, Target, UserPlus, Users, Wallet, Wrench } from "lucide-react"
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
import { fullName, hintFor, shortName } from "@/lib/destinations"

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
  { title: "Creator Contracting", href: "/mor", icon: Banknote, keywords: "mor merchant of record payouts invoicing creators contracting pay" },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "How this works", href: "/guide", icon: FileText, keywords: "guide help walkthrough docs" },
  { title: "Plans & Pricing", href: "/pricing", icon: CreditCard, keywords: "upgrade plan tiers compare" },
]

/**
 * Where an operator can go. NAMES ARE NOT WRITTEN HERE: each title is read from
 * `lib/destinations.ts`, the same registry the sidebar, the hub tabs and the page titles use.
 * This list carried its own hand-typed names, so the palette said "Influencer Database",
 * "Share Center", "Email alerts" and "Who has gone quiet" for screens the sidebar called
 * something else, listed Today, Operations and Analysed twice, and had no entry at all for
 * Pipeline, Decisions, Sales, Rates or Payout runs.
 *
 * What this list owns is only what the registry cannot know: the icon, the gate, and the
 * old names kept as search words so a hand that types "share center" still lands.
 * The gates mirror the sidebar and the hub tabs: a module, plus `who` for the screens that
 * are about cost, margin or the founders.
 */
type Who = "cost" | "margin" | "outreach" | "superadmin"
type NavEntry = {
  href: string
  icon: React.ElementType
  module?: string
  /** Any of these modules is enough. */
  anyOf?: string[]
  who?: Who
  keywords?: string
  /** Use the destination's full name: its short one is ambiguous out of context. */
  full?: boolean
}

const OPERATOR_NAV: NavEntry[] = [
  // Personal
  { href: "/work/today", icon: LayoutDashboard, keywords: "dashboard home" },
  { href: "/work/inbox", icon: Inbox, keywords: "waiting on me queue" },
  { href: "/work/requests", icon: Hand, keywords: "waiting on us asks" },
  { href: "/work/desk", icon: Mail, who: "superadmin", keywords: "inbox contact whatsapp email" },
  { href: "/work/guide", icon: BookOpen, keywords: "manual help roles" },
  { href: "/work/manual", icon: BookOpen, keywords: "team manual how work moves deck induction" },

  // Work
  { href: "/work/pipeline", icon: ClipboardCheck, anyOf: ["campaigns", "influencers"],
    keywords: "ladder delivery owe next" },
  { href: "/work/clients", icon: Building2, module: "clients" },
  { href: "/work/sales", icon: Target, module: "clients", keywords: "pipeline deals business development outreach" },
  { href: "/work/brands", icon: Activity, module: "clients",
    keywords: "who has gone quiet heartbeat silent last contact whose move" },
  { href: "/work/proposals", icon: FileText, module: "proposals", keywords: "proposals" },
  { href: "/work/share", icon: Send, module: "clients", keywords: "share center" },
  { href: "/work/handovers", icon: Send, module: "clients", keywords: "ready to send handover" },
  { href: "/work/partners", icon: Store, module: "clients", keywords: "leads marketing merchants" },
  { href: "/work/scout", icon: Radar, module: "influencers", who: "outreach",
    keywords: "scoutoutreach scout outreach agent" },
  { href: "/work/affiliate-links", icon: Link2, module: "campaigns", keywords: "links clicks sales tracking" },

  // Campaigns
  { href: "/work/campaigns", icon: Megaphone, module: "campaigns" },
  { href: "/work/enrolments", icon: ListChecks, module: "influencers", who: "cost",
    keywords: "agreements paperwork addresses" },
  { href: "/work/enrolments/payments", icon: Banknote, module: "influencers", who: "cost", full: true },
  { href: "/ops/campaigns", icon: ClipboardCheck, module: "operations",
    keywords: "workstreams deliverables concepts ops operations" },
  { href: "/work/report-campaigns", icon: FileText, module: "campaigns", keywords: "report campaigns results" },
  { href: "/work/chasing", icon: List, module: "campaigns", keywords: "late content rate chasing overdue" },
  { href: "/work/fa/campaigns", icon: Megaphone, module: "fa", keywords: "fa barter cashback paid deal" },

  // Creators
  { href: "/work/influencers", icon: Database, module: "influencers",
    keywords: "influencer database master rates" },
  { href: "/work/influencers/review", icon: Users, module: "influencers",
    keywords: "waiting room pending price approve creators cost needing" },
  { href: "/work/influencers/analyzed", icon: Database, module: "influencers", keywords: "analyzed analytics" },
  { href: "/work/lists", icon: List, module: "influencers", keywords: "standing lists category country" },
  { href: "/work/areas", icon: Target, module: "influencers",
    // The old "Sourcing rounds" entry pointed at a screen that no longer exists. Its search
    // words live here, because this is where that work happens now.
    keywords: "brand rosters shortlist samples client round owner due locked dropped turned down sourcing request area" },
  { href: "/work/coverage", icon: Database, module: "influencers",
    keywords: "thin gaps research backlog category market" },
  { href: "/work/fa/members", icon: Users, module: "fa", keywords: "fa members app creators" },
  { href: "/work/fa/reliability", icon: ShieldCheck, module: "fa", keywords: "creator reliability delivers" },

  // Money
  { href: "/work/money", icon: Wallet, anyOf: ["billing", "influencers"], who: "cost", keywords: "money" },
  { href: "/work/billing", icon: CreditCard, module: "billing", keywords: "billing credits plans" },
  { href: "/work/mor", icon: Banknote, module: "billing", who: "cost",
    keywords: "mor merchant of record contracting invoicing payouts" },
  { href: "/work/payables", icon: Banknote, module: "influencers", who: "cost",
    keywords: "creator payments owed paid money book" },
  { href: "/work/payouts", icon: Banknote, module: "influencers", who: "cost",
    keywords: "payout runs bank file transfer" },
  { href: "/work/fa/wallets", icon: Wallet, module: "fa", who: "cost", keywords: "creator wallets balances" },
  { href: "/work/negotiations", icon: Banknote, who: "margin", keywords: "rates to agree negotiate" },
  { href: "/work/approvals", icon: ListChecks, who: "margin", keywords: "sign-offs founder" },

  // Creator app
  { href: "/work/fa", icon: LayoutDashboard, module: "fa", keywords: "fa overview following app" },
  { href: "/work/fa/activity", icon: Activity, module: "fa", keywords: "fa activity" },
  { href: "/work/fa/deliverables", icon: ClipboardCheck, module: "fa", keywords: "deliverables proofs" },
  { href: "/work/fa/withdrawals", icon: Banknote, module: "fa" },
  { href: "/work/fa/receipt-claims", icon: Receipt, module: "fa" },
  { href: "/work/fa/merchants", icon: Store, module: "fa" },
  { href: "/work/fa/ad-banners", icon: ImageIcon, module: "fa", keywords: "ad banners promos" },
  { href: "/work/fa/notifications", icon: Bell, module: "fa", keywords: "app notifications push" },
  { href: "/work/operations", icon: ListChecks, module: "operations", keywords: "operations queues backlog" },

  // Company and settings
  { href: "/work/goals", icon: Target, keywords: "goals daily targets pace monthly rules" },
  { href: "/work/team", icon: Users, keywords: "my team approvals alerts people cofounder" },
  { href: "/work/users", icon: Users, module: "users", keywords: "client accounts logins" },
  { href: "/work/staff", icon: ShieldCheck, module: "users", keywords: "staff access" },
  { href: "/work/notifications", icon: MailCheck, module: "system", keywords: "email alerts notifications" },
  { href: "/work/whatsapp", icon: MessageCircle, module: "system", keywords: "broadcasts templates" },
  { href: "/work/system", icon: Wrench, module: "system", keywords: "settings pricing feature switches" },
  { href: "/work/system/jobs", icon: Wrench, module: "system", keywords: "queue failed background" },
  { href: "/work/system/images", icon: ImageIcon, module: "system", keywords: "cdn avatars thumbnails" },
  { href: "/work/system/displays", icon: List, module: "system", keywords: "office screens tv wall" },
  { href: "/work/approvals/gate", icon: ShieldCheck, who: "superadmin", keywords: "ceo approval gate" },
]

/** Not a console destination, so it carries its own name. */
const OPERATOR_EXTRA: (CmdEntry & { module?: string })[] = [
  { title: "Show me how", href: "/how", icon: BookOpen },
]

/** Things to start, not places to go. An action that only opened a screen already listed
 *  above ("Start sourcing for a brand" was Rosters) is not repeated here. */
const OPERATOR_ACTIONS: (CmdEntry & { module?: string })[] = [
  { title: "Create a client account", href: "/work/users/create", icon: UserPlus, module: "users" },
  { title: "Create a campaign", href: "/work/campaigns/create", icon: Plus, module: "campaigns" },
  { title: "Create an app campaign", href: "/work/fa/campaigns/new", icon: Plus, module: "fa" },
  { title: "Create a cashback campaign", href: "/work/fa/campaigns/create", icon: Plus, module: "fa" },
  { title: "Create a barter campaign", href: "/work/fa/campaigns/create-barter", icon: Plus, module: "fa" },
  { title: "Create a paid deal", href: "/work/fa/campaigns/create-paid-deal", icon: Plus, module: "fa" },
  { title: "Add or import creators", href: "/work/influencers/add", icon: Plus, module: "influencers" },
  { title: "Create a quote", href: "/work/proposals/create", icon: Plus, module: "proposals" },
]

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const { can, isSuperAdmin, role, isStaff, isFullAccessStaff, staffRole, canSeeCost, canSeeMargin } =
    useAdminAccess()

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

  const leadership = isSuperAdmin || isFullAccessStaff
  const passes = (who?: Who) =>
    !who ||
    (who === "cost" && canSeeCost) ||
    (who === "margin" && canSeeMargin) ||
    (who === "outreach" && (leadership || staffRole === "talent_manager")) ||
    (who === "superadmin" && isSuperAdmin)

  const operatorNav: CmdEntry[] = [
    ...OPERATOR_NAV
      .filter((e) => (!e.module || can(e.module as never)) &&
                     (!e.anyOf || e.anyOf.some((m) => can(m as never))) &&
                     passes(e.who))
      .map((e) => ({
        title: e.full ? fullName(e.href) : shortName(e.href),
        href: e.href,
        icon: e.icon,
        // The destination's own hint is searchable too, so "bank file" finds Payout runs.
        keywords: [e.keywords, hintFor(e.href)].filter(Boolean).join(" "),
      })),
    ...OPERATOR_EXTRA.filter((e) => !e.module || can(e.module as never)),
  ]
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
