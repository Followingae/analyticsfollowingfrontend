'use client'

/**
 * The TV's memory and its remote.
 *
 * A TV pairs once (see /tv) and keeps a screen id and device key in its browser storage.
 * From then on every wall page asks the API every few seconds what this TV should show,
 * and follows: a phone can move the TV to the other version, to another display, or
 * unpair it (back to the code), without anyone touching the TV. A TV switched off and on
 * lands on /tv, reads its memory, and goes straight back to its screen.
 *
 * Full screen cannot be forced by a page: browsers need a press. So the first press of any
 * remote key (or a click) asks for it, and the hint on the wall says so for a few seconds.
 */
import { useEffect, useState } from 'react'
import { API_CONFIG } from '@/config/api'

const KEY = 'following.tv'
const FOLLOW_MS = 8_000

export type TvMemory = { id: string; key: string }

export function readTv(): TvMemory | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
export function writeTv(m: TvMemory | null) {
  try { m ? localStorage.setItem(KEY, JSON.stringify(m)) : localStorage.removeItem(KEY) } catch { /* private mode */ }
}

export async function tvState(m: TvMemory): Promise<{ paired: boolean; path?: string; code?: string; name?: string } | null> {
  try {
    const r = await fetch(`${API_CONFIG.BASE_URL}/api/v1/display/tv/${m.id}?key=${encodeURIComponent(m.key)}`, { cache: 'no-store' })
    if (r.status === 404) return { paired: false, code: undefined }
    if (!r.ok) return null
    return (await r.json()).data
  } catch { return null }
}

/** On a wall page: follow whatever the phone decides this TV should show. */
export function useTvFollow(currentPath: string) {
  useEffect(() => {
    const m = readTv()
    if (!m) return
    let stop = false
    const tick = async () => {
      const s = await tvState(m)
      if (stop || !s) return
      if (!s.paired) { window.location.replace('/tv'); return }
      if (s.path && s.path !== currentPath) window.location.replace(s.path)
    }
    const t = setInterval(tick, FOLLOW_MS)
    return () => { stop = true; clearInterval(t) }
  }, [currentPath])
}

/** Full screen on the first press of anything; returns whether we are full screen now. */
export function useFullscreenOnPress() {
  const [full, setFull] = useState(false)
  useEffect(() => {
    const sync = () => setFull(Boolean(document.fullscreenElement))
    sync()
    const go = () => {
      if (document.fullscreenElement) return
      document.documentElement.requestFullscreen?.().catch(() => { /* the TV browser decides */ })
    }
    document.addEventListener('fullscreenchange', sync)
    window.addEventListener('keydown', go)
    window.addEventListener('click', go)
    window.addEventListener('touchend', go)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      window.removeEventListener('keydown', go)
      window.removeEventListener('click', go)
      window.removeEventListener('touchend', go)
    }
  }, [])
  return full
}
