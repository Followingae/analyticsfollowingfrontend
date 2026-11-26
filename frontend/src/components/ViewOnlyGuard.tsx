"use client"

/**
 * Asks the server once per login whether it is view-only (GET /api/v1/auth/view-only),
 * says so whenever the server refuses a change, and keeps a scoped viewer login on the
 * pages shared with it. The server is the guard; this only makes the screen honest.
 */
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { installViewOnlyNotice, setViewOnly, useViewOnly } from "@/lib/viewOnly"

// Where a scoped viewer may go. Any other address, including one that does not exist,
// sends it to the dashboard rather than to an error page.
const SCOPED_ALLOWED = ["/dashboard", "/proposals", "/creator-analytics", "/auth", "/login"]

export function ViewOnlyGuard() {
  const { user, isAuthenticated } = useEnhancedAuth()
  const viewOnly = useViewOnly()
  const pathname = usePathname()
  const router = useRouter()
  const who = user?.email || null

  useEffect(() => { installViewOnlyNotice() }, [])

  useEffect(() => {
    if (!isAuthenticated || !who) {
      if (!isAuthenticated) setViewOnly({ view_only: false, scoped: false })
      return
    }
    let dead = false
    fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/auth/view-only`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (dead || !d) return
        setViewOnly({ view_only: !!d.view_only, scoped: !!d.scoped, message: d.message || undefined })
      })
      .catch(() => { /* the server still refuses; only the menu stays full */ })
    return () => { dead = true }
  }, [isAuthenticated, who])

  useEffect(() => {
    if (!viewOnly.scoped || !pathname) return
    const ok = pathname === "/" || SCOPED_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"))
    if (!ok) router.replace("/dashboard")
  }, [viewOnly.scoped, pathname, router])

  return null
}
