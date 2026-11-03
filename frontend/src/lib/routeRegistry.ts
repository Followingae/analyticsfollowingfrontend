/**
 * Route → title registry for headers + breadcrumbs (brand + operator surfaces).
 * Replaces the hand-rolled getPageTitle if-chain that covered ~10 routes.
 */

import { DESTINATIONS } from "@/lib/destinations"

const ROUTE_TITLES: Record<string, string> = {
  // Brand
  "/dashboard": "Dashboard",
  "/campaigns": "Campaigns",
  "/campaigns/new": "New Campaign",
  "/campaigns/fa": "FA Campaigns",
  "/proposals": "Proposals",
  // Inflink — requests out, quotes back, award creates the campaign.
  "/inflink": "Inflink",
  "/inflink/new": "Post a request",
  "/creators": "Creators",
  "/discover": "Discover",
  "/my-lists": "My Lists",
  "/shared-influencers": "Shared With Me",
  "/creator-analytics": "Creator Analytics",
  "/billing": "Billing",
  "/billing/invoices": "Invoices",
  "/cashback-pool": "Cashback Pool",
  "/cashback-pool/topup": "Top Up Pool",
  "/cashback-pool/transactions": "Pool Transactions",
  "/settings": "Settings",
  "/how": "Show me how",
  "/notifications": "Notifications",
  "/pricing": "Pricing",
  "/checkout": "Checkout",
  "/teams": "Teams",
  // Creator Contracting (the brand's own name for it; "Mor" is only the URL).
  "/mor": "Creator Contracting",
  "/mor/new": "Pay a creator",
  "/mor/payees": "Payees",
  // The operating console — everyone internal, not just the founders.
  "/work/today": "Today",
  "/work/brands": "Brands",
  "/work/coverage": "Coverage",
  "/work/scout": "ScoutOutreach",
  "/work/goals": "Goals",
  "/work/payables": "Creator payments",
  "/work/team": "Creator team",

  // Operator
  "/superadmin": "Dashboard",
  "/superadmin/operations": "Operations",
  "/superadmin/clients": "Clients",
  "/superadmin/users": "Users",
  "/superadmin/users/create": "Create User",
  "/superadmin/campaigns": "Campaigns",
  "/superadmin/campaigns/create": "Create Campaign",
  "/superadmin/proposals": "Proposals",
  "/superadmin/proposals/create": "Create Proposal",
  "/superadmin/influencers": "Influencer Database",
  "/superadmin/influencers/analyzed": "Analyzed Creators",
  "/superadmin/influencers/add": "Add / Import",
  "/superadmin/fa": "Following App",
  "/superadmin/fa/activity": "Activity",
  "/superadmin/fa/members": "Members",
  "/superadmin/fa/merchants": "Merchants",
  "/superadmin/fa/campaigns": "FA Campaigns",
  "/superadmin/fa/deliverables": "Deliverables",
  "/superadmin/fa/withdrawals": "Withdrawals",
  "/superadmin/fa/wallets": "Creator Wallets",
  "/superadmin/fa/receipt-claims": "Receipt Claims",
  "/superadmin/fa/ad-banners": "Ad Banners",
  "/superadmin/billing": "Billing",
  "/superadmin/system": "System",
  "/ops": "Operations",
}

const NO_PAGE = new Set(["/mor/batch"])

const ID_LIKE =/^[0-9a-f]{8}-[0-9a-f-]{20,}$|^\d{4,}$/i

function prettify(segment: string): string {
  const decoded = decodeURIComponent(segment)
  if (ID_LIKE.test(decoded)) return "Details"
  // usernames / slugs: show as typed, dashes → spaces only for multiword slugs
  if (decoded.startsWith("@")) return decoded
  return decoded
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export interface Crumb {
  title: string
  href: string
  isLast: boolean
}

/**
 * Segments that have a real page of their own under /work. Mirrors the exclusion list of the
 * /work rewrite in next.config.ts: for these, /superadmin/<x> and /work/<x> are DIFFERENT
 * screens, so a /superadmin crumb is not translated.
 */
const WORK_OWN = /^(areas|brands|chasing|coverage|creators|enrolments|goals|guide|inbox|manual|money|payables|payouts|pipeline|scout|sourcing|team|today)/

/** The /work form of a console path, so a raw /superadmin URL is named and linked the way
 *  the sidebar names and links it. */
function toWork(path: string): string {
  const m = path.match(/^\/superadmin(\/.*)?$/)
  if (!m) return path
  const rest = m[1] || ""
  if (!rest) return "/work/today"
  return WORK_OWN.test(rest.slice(1)) ? path : `/work${rest}`
}

/** Builds a breadcrumb trail for any pathname using the registry, falling back
 *  to prettified segments for dynamic parts (ids become "Details"). */
export function getRouteTrail(pathname: string): Crumb[] {
  const clean = (pathname || "/").split("?")[0].replace(/\/+$/, "") || "/"
  if (clean === "/") return []
  const segments = clean.split("/").filter(Boolean)
  const crumbs: Crumb[] = []
  let acc = ""
  segments.forEach((seg, i) => {
    acc += `/${seg}`
    // The console's root crumb. /work is only a redirect and /superadmin was the retired
    // founders' dashboard, so the first crumb is the console itself and goes to Today.
    if (i === 0 && (seg === "work" || seg === "superadmin")) {
      crumbs.push({ title: "Console", href: "/work/today", isLast: segments.length === 1 })
      return
    }
    // Grouping segments with no page of their own: a crumb there would be a dead link.
    if (NO_PAGE.has(acc)) return
    const href = toWork(acc)
    crumbs.push({
      // destinations.ts first, because it is where a console screen's ONE name lives. The
      // breadcrumb was prettifying the URL segment instead, so the trail above a page read
      // "Inbox" while the sidebar and the page itself both said "My queue", and
      // "Influencers" above a page titled "Creators". Three names for two screens, all on
      // screen at the same time.
      title: DESTINATIONS[href]?.short ?? ROUTE_TITLES[acc] ?? prettify(seg),
      href,
      isLast: i === segments.length - 1,
    })
  })
  return crumbs
}

/** Single display title for a route (last crumb). */
export function getRouteTitle(pathname: string): string | null {
  const trail = getRouteTrail(pathname)
  return trail.length ? trail[trail.length - 1].title : null
}
