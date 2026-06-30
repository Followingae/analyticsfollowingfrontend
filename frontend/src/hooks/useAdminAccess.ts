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

export function useAdminAccess() {
  const [role, setRole] = useState<string | null>(null)
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
          try {
            const me = await (await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/staff/me`)).json()
            const mods = me?.data?.modules
            setModules(Array.isArray(mods) ? mods : null) // null = full-access staff
          } catch { setModules([]) }
        } else {
          setModules(null)
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const isSuperAdmin = role === "super_admin" || role === "superadmin"
  const can = (m: AdminModule) => isSuperAdmin || modules === null || modules.includes(m)

  return { role, modules, isSuperAdmin, isStaff, can, loading }
}
