"use client"

/**
 * View-only logins: the demo account and a client's viewer login (one proposal, nothing
 * else). The server refuses every change they try (app/middleware/view_only.py answers 403
 * with `view_only: true`); this file makes the screen say so, in one place, for every
 * button in the app, instead of each screen showing its own "Failed to save".
 *
 * `scoped` means the login may see only what was shared with it: the menu shrinks to the
 * dashboard and proposals, and other addresses send it back to its proposals.
 */
import { useSyncExternalStore } from "react"
import { toast } from "sonner"

export type ViewOnlyState = { view_only: boolean; scoped: boolean; message?: string }

export const VIEW_ONLY_MESSAGE = "This is a view-only account, so nothing can be changed here."

const NONE: ViewOnlyState = { view_only: false, scoped: false }
const CACHE_KEY = "following.viewOnly"

function readCache(): ViewOnlyState {
  try {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(CACHE_KEY) : null
    return raw ? { ...NONE, ...JSON.parse(raw) } : NONE
  } catch {
    return NONE
  }
}

let state: ViewOnlyState = typeof window !== "undefined" ? readCache() : NONE
const listeners = new Set<() => void>()

export function getViewOnly(): ViewOnlyState {
  return state
}

export function setViewOnly(next: ViewOnlyState) {
  state = next
  try {
    if (next.view_only) window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(next))
    else window.sessionStorage.removeItem(CACHE_KEY)
  } catch { /* the cache only saves a flash of the full menu */ }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export function useViewOnly(): ViewOnlyState {
  return useSyncExternalStore(subscribe, getViewOnly, () => NONE)
}

export function announceViewOnly(message?: string) {
  toast.info(message || state.message || VIEW_ONLY_MESSAGE, { id: "view-only" })
}

/* Writes the app makes on its own, not because somebody pressed something (marking a
 * creator as opened). Refused like every other write, but nobody asked, so nobody is told. */
const QUIET = /\/(opened|seen|heartbeat|presence|track)(\/|\?|$)/

let installed = false

/** One wrapper around window.fetch, so every service in the app is covered, including the
 *  ones that do not go through fetchWithAuth. It only reads a copy of a 403; the response
 *  the caller gets is untouched. */
export function installViewOnlyNotice() {
  if (installed || typeof window === "undefined") return
  installed = true
  const original = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await original(input, init)
    if (res.status === 403) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
      // Only when somebody just pressed or typed something (where the browser can tell):
      // a refusal of something the page did on its own while loading is nobody's news.
      const ua = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation
      if (!QUIET.test(url) && (!ua || ua.isActive)) {
        res.clone().json()
          .then((body) => { if (body && body.view_only) announceViewOnly(body.message || body.detail) })
          .catch(() => { /* not ours */ })
      }
    }
    return res
  }
}
