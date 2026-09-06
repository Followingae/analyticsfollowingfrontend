"use client"

/**
 * Out of credits, with a way through.
 *
 * THIS IS THE HIGHEST INTENT MOMENT IN THE PRODUCT and it used to be the least useful screen
 * in it. Somebody is mid task, they want to keep going, and they are willing to pay right
 * now. The modal told them they were short and sent them to /billing to work the rest out
 * themselves, which is a filing cabinet handed to a person holding a credit card.
 *
 * It now sells here. The packs come from the server, one click opens the payment page, and
 * the return URL is the page they were on, so buying credits does not cost them their place.
 *
 * WHAT IT DOES NOT DO. It never invents a price: the packs and their amounts come from
 * `GET /credits/topup/options`, and if that call fails the modal says so and falls back to
 * the billing page rather than showing a number nobody will honour. It also does not push a
 * plan upgrade at somebody who only needs twenty five credits to finish one unlock; the plan
 * is offered underneath, as the answer to running out repeatedly rather than to running out
 * today.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, ArrowRight, Loader2, AlertCircle, Check } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCredits } from "@/utils/creditUtils"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

interface InsufficientCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  creditsRequired?: number
  creditsAvailable?: number
  creditsNeeded?: number
  actionName?: string
  message?: string
}

interface TopupOption {
  type: string
  name?: string
  credits?: number
  price?: number
  currency?: string
  description?: string
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  creditsRequired = 0,
  creditsAvailable = 0,
  creditsNeeded = 0,
  actionName = "this",
  message,
}: InsufficientCreditsModalProps) {
  const router = useRouter()
  const [options, setOptions] = useState<TopupOption[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || options || failed) return
    let alive = true
    void (async () => {
      try {
        const res = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/credits/topup/options`,
          { headers: getAuthHeaders() },
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(String(res.status))
        const list: TopupOption[] = Array.isArray(data?.options)
          ? data.options
          : Array.isArray(data?.data?.options)
            ? data.data.options
            : []
        if (!alive) return
        if (!list.length) throw new Error("empty")
        setOptions(list)
      } catch {
        if (alive) setFailed(true)
      }
    })()
    return () => { alive = false }
  }, [isOpen, options, failed])

  const buy = async (type: string) => {
    setError(null)
    setBuying(type)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/credits/topup/create-payment-link`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ topup_type: type }),
        },
      )
      const data = await res.json().catch(() => ({}))
      const url = data?.payment_url || data?.data?.payment_url
      if (!res.ok || !url) {
        setError(data?.detail || "We could not open the payment page. Try again in a moment.")
        setBuying(null)
        return
      }
      // Straight to payment. Coming back lands on the page they were already using.
      window.location.href = url
    } catch {
      setError("We could not reach our servers. Check your connection and try again.")
      setBuying(null)
    }
  }

  const short = creditsNeeded || Math.max(0, creditsRequired - creditsAvailable)
  const pct = creditsRequired > 0
    ? Math.min(100, Math.round((creditsAvailable / creditsRequired) * 100))
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Zap className="h-5 w-5 text-primary" />
            {short > 0
              ? `You are ${formatCredits(short)} credits short`
              : "You are out of credits"}
          </DialogTitle>
          <DialogDescription>
            {message ||
              `${actionName === "this" ? "This" : actionName} costs ${formatCredits(creditsRequired)} credits and you have ${formatCredits(creditsAvailable)}. Top up and carry on where you left off.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Progress value={pct} />
          <p className="text-xs tabular-nums text-muted-foreground">
            {formatCredits(creditsAvailable)} of {formatCredits(creditsRequired)} needed
          </p>
        </div>

        {failed ? (
          <div className="rounded-xl border p-4 text-sm">
            <p className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                We could not load today&apos;s credit packs, and we would rather show you
                nothing than a price we might not charge.
              </span>
            </p>
            <Button className="mt-3" onClick={() => { router.push("/billing"); onClose() }}>
              Open billing
            </Button>
          </div>
        ) : !options ? (
          <div className="grid gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="grid gap-2">
            {options.map((o) => (
              <button
                key={o.type}
                type="button"
                disabled={Boolean(buying)}
                onClick={() => void buy(o.type)}
                className="group flex items-center justify-between gap-4 rounded-xl border
                           px-4 py-3.5 text-left transition-colors hover:border-primary/50
                           disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="min-w-0">
                  <span className="block font-medium">
                    {o.credits ? `${formatCredits(o.credits)} credits` : o.name || o.type}
                  </span>
                  {o.description && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {o.description}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-sm font-semibold tabular-nums">
                  {typeof o.price === "number"
                    ? `${o.currency || "AED"} ${o.price.toLocaleString()}`
                    : ""}
                  {buying === o.type
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />}
                </span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {/* The plan is the answer to running out every month, not to running out today. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Running out often? A bigger plan includes more every month.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Not now</Button>
            <Button variant="outline" size="sm"
                    onClick={() => { router.push("/pricing"); onClose() }}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Compare plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
