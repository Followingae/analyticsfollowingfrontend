'use client'

/**
 * The browser tab names the screen, from the same registry as the sidebar.
 *
 * The /superadmin layout used to stamp every tab "Superadmin | Following", and most of the
 * console is served from that tree through the /work rewrite. So a talent manager on Rates or
 * Lists had a tab telling her she was in Superadmin, and twelve open tabs all read the same.
 * The layouts are server components and cannot see the path, so this small client piece reads
 * it and names the tab from `destinations.ts`. A screen with no entry keeps the plain default.
 */
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { destinationFor } from '@/lib/destinations'

export function DocumentTitle() {
  const pathname = usePathname() || ''

  useEffect(() => {
    // A raw /superadmin URL is the same screen as its /work form; look it up by that name.
    const path = pathname.replace(/^\/superadmin(?=\/|$)/, '/work')
    const d = destinationFor(path)
    if (!d) return
    const title = `${d.full} | Following`
    document.title = title
    // Route metadata can land a frame after this effect on a client navigation; set it once
    // more after paint so the registry name is the one that sticks.
    const raf = requestAnimationFrame(() => { document.title = title })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return null
}
