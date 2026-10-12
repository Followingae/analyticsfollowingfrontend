"use client"

/**
 * The Frame.io sign-in landing back where it started.
 *
 * Adobe sends the superadmin back to /work/campaigns with `?code=`. This picks it up,
 * finishes the handshake on the server, and cleans the URL — so the whole round trip begins
 * and ends inside the campaigns module and there is no integrations page anywhere.
 *
 * ⚠️ THE CODE CAN ARRIVE SECOND-HAND. The Adobe app is registered against
 * `/api/v1/integrations/frameio/callback` on our API, and Adobe posts the code there
 * whatever redirect we ask for, so that route bounces the browser here. When it does, it
 * adds `frameio_redirect` — the URL the code was ISSUED against — because Adobe checks the
 * redirect URI a second time at the token exchange. Quoting this page instead would fail
 * every sign-in that came the long way round with `invalid_grant`.
 *
 * WHY THE URL IS CLEANED IMMEDIATELY. An authorisation code is single-use and short-lived,
 * but it is also sitting in the address bar, in history, and in anything that logs a URL. It
 * is replaced before the exchange is even attempted.
 *
 * Renders nothing at all unless there is a code to handle, so it costs a mounted component
 * and one `useEffect` on a page that will almost never have one.
 */

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { contentAdminApi } from "@/services/contentDeliveryApi"
import { frameioRedirectUri } from "@/components/content/FrameioPanel"

export function FrameioCallback({ onConnected }: { onConnected?: () => void }) {
  const [working, setWorking] = useState(false)
  // Strict mode mounts effects twice in development, and an authorisation code can only be
  // spent once — the second attempt fails and shows the superadmin an error for a sign-in
  // that actually worked.
  const spent = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || spent.current) return
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const error = params.get("error")

    if (!code && !error) return
    spent.current = true

    // Whichever URL Adobe issued the code against is the one the exchange must quote.
    const issuedFor = params.get("frameio_redirect") || frameioRedirectUri()

    const clean = new URL(window.location.href)
    clean.searchParams.delete("code")
    clean.searchParams.delete("error")
    clean.searchParams.delete("error_description")
    clean.searchParams.delete("state")
    clean.searchParams.delete("frameio_redirect")
    window.history.replaceState({}, "", clean.toString())

    if (error) {
      toast.error(params.get("error_description") || "Frame.io sign-in was refused.")
      return
    }

    setWorking(true)
    contentAdminApi.connect(code as string, issuedFor)
      .then((c) => {
        toast.success(`Frame.io connected${c.account_email ? ` as ${c.account_email}` : ""}`)
        onConnected?.()
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "Could not finish the Frame.io sign-in.")
      })
      .finally(() => setWorking(false))
  }, [onConnected])

  if (!working) return null
  return (
    <div className="flex items-center gap-2 rounded-ds-xl border border-black/[0.06] px-4 py-3
                    text-[13.5px] text-muted-foreground dark:border-white/[0.07]">
      <Loader2 className="h-4 w-4 animate-spin" />
      Finishing the Frame.io sign-in…
    </div>
  )
}
