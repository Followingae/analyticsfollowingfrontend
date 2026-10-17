"use client"

/**
 * Keeps somebody off a screen their role cannot open.
 *
 * WHY THIS IS ITS OWN FILE NOW. It lived inside `SuperadminLayout`, which meant only the
 * screens on that shell were guarded. The console actually runs on TWO shells:
 * `SuperadminLayout` and `SuperAdminInterface`, and 29 screens sit on the second one,
 * including the enrolment payments screen and the delivery ladder. Those 29 had no route
 * guard, no command palette and no keyboard layer: three different consoles depending on
 * which file a page happened to import. One of the published rules we are building to is
 * that navigation, shortcuts and buttons must all come from the same permission model, and
 * a guard that only covers two thirds of the screens is not that.
 *
 * This is NOT the security boundary. The backend decides what a role may read and write, and
 * this only stops a person landing on a screen that would then refuse them. A control a role
 * cannot use should never be drawn in the first place.
 */

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAccess, type AdminModule, ADMIN_MODULES } from "@/hooks/useAdminAccess"
import { MODULE_HOME, modulesForPath } from "@/lib/routeModules"

export function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  const router = useRouter()
  const { isSuperAdmin, can, loading, refined } = useAdminAccess()

  const required = modulesForPath(pathname)
  const allowed = isSuperAdmin || required.length === 0 || required.some(m => can(m))

  React.useEffect(() => {
    // Never bounce somebody on a provisional answer. `can()` is usable the moment the hook
    // settles, but until /staff/me has replied it does not know about per-member grants, and
    // redirecting on that half-answer sends people away from screens they may open.
    if (loading || !refined || allowed) return
    const first = ADMIN_MODULES.find(m => MODULE_HOME[m.key] && can(m.key as AdminModule))
    router.replace(first ? MODULE_HOME[first.key] : "/work/today")
  }, [loading, refined, allowed, can, router])

  if (!loading && refined && !allowed) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Redirecting…
      </div>
    )
  }
  return <>{children}</>
}
