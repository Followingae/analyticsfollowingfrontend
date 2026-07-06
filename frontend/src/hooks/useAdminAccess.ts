"use client"

/**
 * Module-scoped admin access. Reads /api/v1/auth/me for the operator's real role
 * + admin_modules and exposes a `can(module)` check used to gate the superadmin
 * sidebar and routes.
 *
 * - super_admin / superadmin: unrestricted (can() always true).
 * - admin: only the modules in admin_modules.
 * - internal staff (role=user + staff_role): scoped to their effective modules
 *   (admin_modules override, else staff-role defaults). full-access staff (ceo/
 *   cofounder) come back unrestricted from /staff/me.
 */

import { useState, useEffect } from "react"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

export type AdminModule =
  | "dashboard" | "operations" | "clients" | "users"
  | "campaigns" | "proposals" | "influencers" | "fa" | "system" | "billing"

export const ADMIN_MODULES: { key: AdminModule; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "operations", label: "Operations" },
  { key: "clients", label: "Clients" },
  { key: "users", label: "Users & Admins" },
  { key: "campaigns", label: "Campaigns" },
  { key: "proposals", label: "Proposals" },
  { key: "influencers", label: "Influencer Database" },
  { key: "fa", label: "Following App" },
  { key: "system", label: "System" },
  { key: "billing", label: "Billing" },
]

// Client-side fallback mirroring backend STAFF_ROLE_DEFAULT_MODULES — used only when
// the /staff/me fetch fails, so a hiccup never locks a staff member out of their console.
const STAFF_ROLE_DEFAULTS: Record<string, AdminModule[] | null> = {
  talent_manager: ["proposals", "influencers"],
  account_manager: ["clients", "campaigns", "proposals"],
  cofounder: null, // null = full-access
  ceo: null,
}

// Full-access operator roles never see destructive/money actions hidden.
export function useAdminAccess() {
  const [role, setRole] = useState<string | null>(null)
  const [staffRole, setStaffRole] = useState<string | null>(null)
  const [modules, setModules] = useState<string[] | null>(null) // null = unrestricted
  const [loading, setLoading] = useState(true)

  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    let active = true
    fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/auth/me`)
      .then((r) => r.json())
      .then(async (d) => {
        if (!active) return
        const u = d?.data ?? d
        const r = u?.role ?? null
        setRole(r)
        if (r === "admin") {
          setModules(Array.isArray(u?.admin_modules) ? u.admin_modules : [])
        } else if (u?.staff_role) {
          // Internal staff — scope by their effective modules from /staff/me.
          setIsStaff(true)
          setStaffRole(u.staff_role)
          const fallback = u.staff_role in STAFF_ROLE_DEFAULTS ? STAFF_ROLE_DEFAULTS[u.staff_role] : []
          try {
            const me = await (await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/staff/me`)).json()
            const mods = me?.data?.modules
            // Array => scoped; null => full-access staff; anything else => role fallback.
            setModules(Array.isArray(mods) ? mods : (mods === null ? null : fallback))
          } catch {
            // Network hiccup — don't lock them out; use the staff-role default.
            setModules(fallback)
          }
        } else {
          setModules(null)
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const isSuperAdmin = role === "super_admin" || role === "superadmin"
  // Scoped staff (account/talent manager) may operate but NEVER destroy/delete or move
  // money. Only operators (superadmin/admin) and full-access staff (ceo/cofounder) may.
  const isFullAccessStaff = staffRole === "ceo" || staffRole === "cofounder"
  const canDestroy = isSuperAdmin || role === "admin" || isFullAccessStaff
  const can = (m: AdminModule) => isSuperAdmin || modules === null || modules.includes(m)

  return { role, staffRole, modules, isSuperAdmin, isStaff, isFullAccessStaff, canDestroy, can, loading }
}
