import type { AdminModule } from "@/hooks/useAdminAccess"

/**
 * Which module a console screen belongs to.
 *
 * This lived inside SuperadminLayout, where only the route guard could reach it. But the
 * same question — "may this person open that screen?" — is asked in at least two other
 * places: the walkthrough list, which must not offer a tour of a screen the viewer cannot
 * enter, and anything that links onward. Keeping one copy is what stops those answers
 * drifting apart.
 *
 * Matched on the screen name rather than the prefix, because every screen is reachable both
 * at /work/... (what people are given) and /superadmin/... (where the file physically is).
 */
export const ROUTE_MODULES: { screen: string; module: AdminModule | AdminModule[] }[] = [
  // Areas are shared ground: the talent team stocks them, and business development sends
  // the client links off them. Either module opens the screen — no cost pricing is on it.
  { screen: "areas", module: ["influencers", "clients"] },
  { screen: "operations", module: "operations" },
  { screen: "clients", module: "clients" },
  { screen: "brands", module: "clients" },
  { screen: "staff", module: "users" },
  { screen: "users", module: "users" },
  { screen: "campaigns", module: "campaigns" },
  // The people waiting on us across every campaign — the talent team's chase list.
  { screen: "chasing", module: ["campaigns", "influencers"] },
  // The team manual is deliberately absent: a screen with no entry here is open to everyone
  // internal, and the manual is the one thing the whole company is walked through.
  { screen: "report-campaigns", module: "campaigns" },
  { screen: "proposals", module: "proposals" },
  { screen: "influencers", module: "influencers" },
  { screen: "coverage", module: "influencers" },
  { screen: "sourcing", module: "influencers" },
  { screen: "payables", module: "influencers" },
  { screen: "goals", module: "influencers" },
  // The team screens say so themselves: "these screens are the whole team's, not the
  // founders'". They were gated to the users module, which only a founder holds, so the
  // people they were written for were redirected off them.
  { screen: "team", module: [] },
  { screen: "team-console", module: [] },
  { screen: "fa", module: "fa" },
  { screen: "notifications", module: "system" },
  { screen: "whatsapp", module: "system" },
  { screen: "system", module: "system" },
  // Asked of a founder, answered by email — leadership's own queue.
  { screen: "approvals", module: "campaigns" },
  { screen: "billing", module: "billing" },
]

/** The screen name, whichever prefix it was reached through. */
export function screenOf(pathname: string): string | null {
  const m = pathname.match(/^\/(?:work|superadmin)\/([^/?#]+)/)
  if (m) return m[1]
  return pathname.startsWith("/ops") ? "operations" : null
}

/** The modules that open a path — any one of them is enough. Empty when open to all internal. */
export function modulesForPath(pathname: string): AdminModule[] {
  const screen = screenOf(pathname)
  const found = ROUTE_MODULES.find(r => r.screen === screen)?.module
  if (!found) return []
  return Array.isArray(found) ? found : [found]
}

/** The module a path needs, or null when the path is open to everyone internal.
 *  Where a screen is opened by more than one module, this reports the first. */
export function moduleForPath(pathname: string): AdminModule | null {
  return modulesForPath(pathname)[0] ?? null
}

// Where to send someone who lands somewhere they cannot go. Always the /work spelling —
// nobody internal should be handed a URL that says superadmin.
export const MODULE_HOME: Record<string, string> = {
  operations: "/ops/campaigns", clients: "/work/clients", users: "/work/users",
  campaigns: "/work/campaigns", proposals: "/work/proposals",
  influencers: "/work/influencers", fa: "/work/fa", system: "/work/system",
  areas: "/work/areas",
  billing: "/work/billing",
}
