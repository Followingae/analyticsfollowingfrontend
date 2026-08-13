/**
 * Single source of truth for "where does this user land after login?"
 * Previously /login and /auth/login each had their own (divergent) logic.
 */
export function roleHome(role?: string | null, email?: string | null, staffRole?: string | null): string {
  const r = (role || "").toLowerCase()
  const isOperator =
    r === "super_admin" || r === "superadmin" || r === "admin" || email === "zain@following.ae"

  // Everyone internal lands on Today. It is the same screen for a founder and a talent
  // manager — what it contains comes from the role, not from the URL. Staff used to be sent
  // to a thin /staff page instead, so the console they actually work in was invisible to
  // them, and the founders' console lived at a URL that told everyone else to keep out.
  if (isOperator || staffRole) return "/work/today"

  return "/dashboard"
}
