/**
 * Route → title registry for headers + breadcrumbs (brand + operator surfaces).
 * Replaces the hand-rolled getPageTitle if-chain that covered ~10 routes.
 */

const ROUTE_TITLES: Record<string, string> = {
  // Brand
  "/dashboard": "Dashboard",
  "/campaigns": "Campaigns",
  "/campaigns/new": "New Campaign",
  "/campaigns/fa": "FA Campaigns",
  "/proposals": "Proposals",
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
  "/guide": "Guide",
  "/notifications": "Notifications",
  "/pricing": "Pricing",
  "/checkout": "Checkout",
  "/teams": "Teams",
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
  "/superadmin/guide": "Guide",
  "/ops": "Operations",
}

const ID_LIKE = /^[0-9a-f]{8}-[0-9a-f-]{20,}$|^\d{4,}$/i

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
    crumbs.push({
      title: ROUTE_TITLES[acc] ?? prettify(seg),
      href: acc,
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
