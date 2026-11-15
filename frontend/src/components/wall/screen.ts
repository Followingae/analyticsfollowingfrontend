'use client'

/**
 * The TV's memory, its remote, and its live wire.
 *
 * A TV pairs once (see /tv) and keeps a screen id and device key in its browser storage.
 * From then on every wall page holds one open stream to the API (useWallStream) that pushes
 * two things the moment they change: the pulse (what the team did) and what this TV should
 * be showing (useTvFollow). A phone can move the TV to another display, unpair it, or ask it
 * to play a preview, and the TV reacts within about a second. Polling stays underneath as
 * the fallback, slow while the stream is up and quick when it is not, so a TV browser with no
 * EventSource still works. A TV switched off and on lands on /tv, reads its memory, and goes
 * straight back to its screen.
 *
 * Full screen cannot be forced by a page: browsers need a press. So the first press of any
 * remote key (or a click) asks for it, and the hint on the wall says so for a few seconds.
 * The same press arms the sound (see sound.ts) and the wake lock.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { API_CONFIG } from '@/config/api'
import { armSound } from './sound'

const KEY = 'following.tv'
const FOLLOW_MS = 8_000
const FOLLOW_MS_STREAMING = 60_000

export type TvMemory = { id: string; key: string }

export function readTv(): TvMemory | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
export function writeTv(m: TvMemory | null) {
  try { m ? localStorage.setItem(KEY, JSON.stringify(m)) : localStorage.removeItem(KEY) } catch { /* private mode */ }
}

export type TvPreview = { key: string; at: string }
export type TvState = { paired: boolean; path?: string; code?: string; name?: string; preview?: TvPreview | null }

export async function tvState(m: TvMemory): Promise<TvState | null> {
  try {
    const r = await fetch(`${API_CONFIG.BASE_URL}/api/v1/display/tv/${m.id}?key=${encodeURIComponent(m.key)}`, { cache: 'no-store' })
    if (r.status === 404) return { paired: false, code: undefined }
    if (!r.ok) return null
    return (await r.json()).data
  } catch { return null }
}

/** The TV tells the API it played the preview, so the phone's button turns into a tick. */
function reportPlayed(m: TvMemory) {
  fetch(`${API_CONFIG.BASE_URL}/api/v1/display/tv/${m.id}/played?key=${encodeURIComponent(m.key)}`, { method: 'POST' }).catch(() => { /* the phone will time out */ })
}

/**
 * On a wall page: follow whatever the phone decides this TV should show, and play a preview
 * the phone asked for (once per ask; the Play on TV buttons on /work/tv). Returns the handler
 * the stream feeds with `tv` events and a switch that slows the fallback poll while the
 * stream is up.
 */
export function useTvFollow(currentPath: string, onPreview?: (key: string) => void) {
  const cb = useRef(onPreview)
  cb.current = onPreview
  const mem = useRef<TvMemory | null>(null)
  const lastPreview = useRef('')
  const streaming = useRef(false)

  const apply = useCallback((s: TvState | null) => {
    if (!s || !mem.current) return
    if (!s.paired) { window.location.replace('/tv'); return }
    if (s.path && s.path !== currentPath) { window.location.replace(s.path); return }
    if (s.preview && s.preview.at !== lastPreview.current) {
      lastPreview.current = s.preview.at
      cb.current?.(s.preview.key)
      reportPlayed(mem.current)
    }
  }, [currentPath])

  useEffect(() => {
    mem.current = readTv()
    if (!mem.current) return
    let stop = false
    let t: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      if (stop || !mem.current) return
      const s = await tvState(mem.current)
      if (stop) return
      apply(s)
      t = setTimeout(tick, streaming.current ? FOLLOW_MS_STREAMING : FOLLOW_MS)
    }
    tick()
    return () => { stop = true; if (t) clearTimeout(t) }
  }, [apply])

  const setStreaming = useCallback((on: boolean) => { streaming.current = on }, [])
  return { onTv: apply, setStreaming, memory: mem }
}

/**
 * One open connection to the API for this display. `pulse` events carry the live feed,
 * `tv` events what this TV should show. Returns whether the wire is up; the browser retries
 * on its own, and the page's polls speed up while it is down.
 */
export function useWallStream(token: string | undefined, onPulse: (data: any) => void, onTv?: (s: TvState) => void) {
  const [connected, setConnected] = useState(false)
  const pulseCb = useRef(onPulse); pulseCb.current = onPulse
  const tvCb = useRef(onTv); tvCb.current = onTv
  useEffect(() => {
    if (!token || typeof EventSource === 'undefined') return
    const m = readTv()
    const q = m ? `?screen=${encodeURIComponent(m.id)}&key=${encodeURIComponent(m.key)}` : ''
    let es: EventSource | null = null
    let stop = false
    let retry: ReturnType<typeof setTimeout> | undefined
    const open = () => {
      if (stop) return
      es = new EventSource(`${API_CONFIG.BASE_URL}/api/v1/display/${token}/stream${q}`)
      es.onopen = () => setConnected(true)
      es.addEventListener('pulse', (e: MessageEvent) => { try { pulseCb.current(JSON.parse(e.data)) } catch { /* a bad frame */ } })
      es.addEventListener('tv', (e: MessageEvent) => { try { tvCb.current?.(JSON.parse(e.data)) } catch { /* a bad frame */ } })
      es.onerror = () => {
        setConnected(false)
        // EventSource retries by itself while the connection is only hiccuping; when the
        // browser gives up (readyState CLOSED, as on a 4xx), reopen after a while.
        if (es && es.readyState === EventSource.CLOSED) { es.close(); es = null; retry = setTimeout(open, 10_000) }
      }
    }
    open()
    return () => { stop = true; if (retry) clearTimeout(retry); es?.close(); setConnected(false) }
  }, [token])
  return connected
}

/** Inside the Following TV app (the Android TV web view): already full screen, sound allowed. */
export function inTvApp() {
  return typeof navigator !== 'undefined' && /FollowingTV/.test(navigator.userAgent)
}

/** Full screen on the first press of anything; returns whether we are full screen now. */
export function useFullscreenOnPress() {
  const [full, setFull] = useState(false)
  useEffect(() => {
    if (inTvApp()) { setFull(true); armSound(); return }
    const sync = () => setFull(Boolean(document.fullscreenElement))
    sync()
    const go = () => {
      armSound()
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

/** Keep the screen awake where the browser allows it, and ask again whenever the page comes back. */
export function useWakeLock() {
  useEffect(() => {
    let lock: any = null
    const ask = async () => {
      try {
        const wl = (navigator as any).wakeLock
        if (!wl || document.visibilityState !== 'visible') return
        lock = await wl.request('screen')
      } catch { /* not allowed here; the TV's own settings decide */ }
    }
    ask()
    const back = () => { if (document.visibilityState === 'visible') ask() }
    document.addEventListener('visibilitychange', back)
    document.addEventListener('fullscreenchange', back)
    return () => { document.removeEventListener('visibilitychange', back); document.removeEventListener('fullscreenchange', back); lock?.release?.().catch(() => {}) }
  }, [])
}

/**
 * Lite mode for TV browsers and sticks: no blur, no backdrop blur, no particle fields, fewer
 * confetti. Decided from the user agent and the device's own report of itself; `?lite=1`
 * and `?lite=0` override it. Sets a class on <html> that the wall's stylesheet reads.
 */
export function useLite() {
  const [lite, setLite] = useState(false)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('lite')
    const ua = navigator.userAgent
    const tvUa = /SMART-TV|SmartTV|Tizen|Web0S|webOS|BRAVIA|AFT[A-Z0-9]|Android TV|AppleTV|HbbTV|NetCast|Roku|VIDAA|Hisense|GoogleTV|CrKey|Silk|Viera|Freebox|Opera TV|PhilipsTV/i.test(ua)
    const mem = (navigator as any).deviceMemory
    const weak = (typeof mem === 'number' && mem <= 4) || (navigator.hardwareConcurrency || 8) <= 4
    const on = q === '1' ? true : q === '0' ? false : tvUa || weak || inTvApp()
    setLite(on)
    document.documentElement.classList.toggle('wall-lite', on)
    return () => { document.documentElement.classList.remove('wall-lite') }
  }, [])
  return lite
}

/**
 * A TV never reloads by itself, so it would keep the code it loaded on day one. Every ten
 * minutes the wall asks what build is live; when it differs, or at four in the morning after
 * a long day, the page is due a reload. The page takes it at the next slide change, never
 * mid-stage, and never within five minutes of loading (a flapping answer must not loop).
 */
export function useSelfRefresh() {
  const due = useRef(false)
  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_WALL_BUILD || ''
    const loaded = Date.now()
    const check = async () => {
      try {
        const r = await fetch('/tv/version', { cache: 'no-store' })
        if (!r.ok) return
        const { build } = await r.json()
        if (build && mine && build !== mine && Date.now() - loaded > 5 * 60_000) due.current = true
      } catch { /* next time */ }
      const h = new Date().getHours()
      if (h === 4 && Date.now() - loaded > 2 * 3600_000) due.current = true
    }
    check()
    const t = setInterval(check, 10 * 60_000)
    return () => clearInterval(t)
  }, [])
  return due
}

/** True for a few seconds after a lost connection comes back, so the wall can say so. */
export function useBackOnline(stale: boolean, ms = 4000) {
  const [back, setBack] = useState(false)
  const was = useRef(false)
  useEffect(() => {
    if (was.current && !stale) { setBack(true); const t = setTimeout(() => setBack(false), ms); was.current = false; return () => clearTimeout(t) }
    if (stale) was.current = true
  }, [stale, ms])
  return back
}
