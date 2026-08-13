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
export const ROUTE_MODULES: { screen: string; module: AdminModule }[] = [
  { screen: "operations", module: "operations" },
  { screen: "clients", module: "clients" },
  { screen: "brands", module: "clients" },
  { screen: "staff", module: "users" },
  { screen: "users", module: "users" },
  { screen: "campaigns", module: "campaigns" },
  { screen: "report-campaigns", module: "campaigns" },
  { screen: "proposals", module: "proposals" },
  { screen: "influencers", module: "influencers" },
  { screen: "coverage", module: "influencers" },
  { screen: "sourcing", module: "influencers" },
  { screen: "payables", module: "influencers" },
  { screen: "goals", module: "influencers" },
  { screen: "team", module: "users" },
  { screen: "team-console", module: "users" },
  { screen: "fa", module: "fa" },
  { screen: "notifications", module: "system" },
  { screen: "whatsapp", module: "system" },
  { screen: "system", module: "system" },
  { screen: "billing", module: "billing" },
]

/** The screen name, whichever prefix it was reached through. */
export function screenOf(pathname: string): string | null {
  const m = pathname.match(/^\/(?:work|superadmin)\/([^/?#]+)/)
  if (m) return m[1]
  return pathname.startsWith("/ops") ? "operations" : null
}

/** The module a path needs, or null when the path is open to everyone internal. */
export function moduleForPath(pathname: string): AdminModule | null {
  const screen = screenOf(pathname)
  return ROUTE_MODULES.find(r => r.screen === screen)?.module ?? null
}

// Where to send someone who lands somewhere they cannot go. Always the /work spelling —
// nobody internal should be handed a URL that says superadmin.
export const MODULE_HOME: Record<string, string> = {
  operations: "/ops/campaigns", clients: "/work/clients", users: "/work/users",
  campaigns: "/work/campaigns", proposals: "/work/proposals",
  influencers: "/work/influencers", fa: "/work/fa", system: "/work/system",
  billing: "/work/billing",
}
