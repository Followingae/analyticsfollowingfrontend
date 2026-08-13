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
  talent_manager: ["proposals", "influencers", "campaigns", "fa"],
  account_manager: ["clients", "campaigns", "proposals", "fa"],
  business_development: ["clients", "proposals"],
  cofounder: null, // null = full-access
  ceo: null,
}

// Full-access operator roles never see destructive/money actions hidden.
export function useAdminAccess() {
  const [role, setRole] = useState<string | null>(null)
  const [staffRole, setStaffRole] = useState<string | null>(null)
  // NOT null: null means unrestricted, and using it as the initial value handed every staff
  // member a superadmin's sidebar for the moment before /auth/me answered — which is what
  // made the nav visibly change under them. Start with no access and widen once we know.
  const [modules, setModules] = useState<string[] | null>([])
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
          setIsStaff(true)
          setStaffRole(u.staff_role)

          // Answer from what we already have, immediately. /auth/me carries this person's
          // own admin_modules and their staff_role, so their navigation can be correct
          // before any further request — and stays correct if that request never returns.
          //
          // It did not return. The nav sat empty for every staff member because this hook
          // awaited /staff/me, that call never reached the network, the promise never
          // settled, `loading` stayed true forever and `can()` therefore answered no to
          // everything. An empty sidebar is what a talent manager saw.
          const fallback: AdminModule[] =
            (Array.isArray(u?.admin_modules) && u.admin_modules.length ? u.admin_modules
              : STAFF_ROLE_DEFAULTS[u.staff_role] ?? []) as AdminModule[]
          setModules(fallback)
          setLoading(false)

          // Refine in the background. /staff/me is authoritative when it answers — it knows
          // about per-member overrides — but it is never allowed to hold the nav hostage.
          try {
            const ctrl = new AbortController()
            const t = setTimeout(() => ctrl.abort(), 6000)
            const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/staff/me`,
                                            { signal: ctrl.signal })
            clearTimeout(t)
            const me = await res.json()
            const mods = me?.data?.modules
            if (!active) return
            // Array => scoped; null => full-access staff; anything else => keep the fallback.
            if (Array.isArray(mods) && mods.length) setModules(mods)
            else if (mods === null) setModules(null)
          } catch {
            /* keep the fallback — it is already correct for this role */
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
  // While we do not yet know who this is, the answer to "can they?" is no. Callers that
  // want to avoid a flash of empty nav should render on `loading` instead of guessing.
  const can = (m: AdminModule) => !loading && (isSuperAdmin || modules === null || modules.includes(m))
  // Bulk extraction — spreadsheets, CSV, client share links — is leadership-only. A file
  // cannot enforce field visibility once it has been emailed, so the team works on screen
  // and shares with clients through a proposal instead. Mirrors app/core/field_policy.py;
  // the server refuses regardless, this only stops us showing a button that always 403s.
  const canExport = isSuperAdmin || role === "admin" || isFullAccessStaff
  // Talent negotiates cost, so they see it; they must never see sell or margin.
  const canSeeSell = canExport || staffRole === "account_manager" || staffRole === "business_development"
  const canSeeCost = canExport || staffRole === "talent_manager"
  const canSeeMargin = canExport

  return { role, staffRole, modules, isSuperAdmin, isStaff, isFullAccessStaff, canDestroy,
           canExport, canSeeSell, canSeeCost, canSeeMargin, can, loading }
}
