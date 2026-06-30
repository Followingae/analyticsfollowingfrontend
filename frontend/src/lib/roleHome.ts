/**
 * Single source of truth for "where does this user land after login?"
 * Previously /login and /auth/login each had their own (divergent) logic.
 */
export function roleHome(role?: string | null, email?: string | null, staffRole?: string | null): string {
  const r = (role || "").toLowerCase()
  // Operators live in the superadmin console. Module-scoped admins are
  // steered to their first allowed module by ModuleRouteGuard once inside.
  if (r === "super_admin" || r === "superadmin" || r === "admin" || email === "zain@following.ae") {
    return "/superadmin"
  }
  // Internal staff (role=user + staff_role) get their own scoped workspace.
  if (staffRole) {
    return "/staff"
  }
  return "/dashboard"
}
