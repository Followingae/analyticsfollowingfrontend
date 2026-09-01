"use client"

/**
 * Office screens — the TV wall, and any other screen we hang.
 *
 * The wall has been running for weeks on tokens minted by hand, because everything needed to
 * manage one existed except a page to do it on. This is that page: mint a screen, choose
 * which slides it shows and how fast it refreshes, and turn it off when the screen comes
 * down.
 *
 * A delivery screen's link does not expire by default, and that is deliberate: it runs
 * unattended in the office, and an expiry nobody is watching means a blank wall on a Sunday.
 * A screen that shows money is the exception — its URL reads revenue with no login, so a new
 * one is offered an end date, switched on by default. Existing screens are untouched: every
 * link that works today keeps working, and any end date can be extended or cleared here.
 */

import { useCallback, useEffect, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { UnauthorizedAccess } from "@/components/UnauthorizedAccess"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { CARD, PageHead } from "@/components/console/primitives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Plus, Monitor, Copy, Power, Eye, CalendarClock, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/displays`

// Every date anyone reads in this product is Dubai time, and the office wall is a physical
// object in Dubai. An end date written here is a Dubai calendar day: set the 12th and the
// screen runs until the 12th ends in the office, not at 03:59 on the 13th.
// The UAE has no daylight saving, so the offset is +04:00 all year.
const DUBAI_TZ = "Asia/Dubai"

/** The Dubai calendar day of an instant, as YYYY-MM-DD — what the date input round-trips. */
const dubaiDay = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-CA", { timeZone: DUBAI_TZ })

/** The last moment of a Dubai calendar day, as an instant the server can store. */
const dubaiEndOfDay = (ymd: string) => new Date(`${ymd}T23:59:59+04:00`).toISOString()

/** A date as a person here reads it. */
const readableDay = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-GB",
    { timeZone: DUBAI_TZ, day: "numeric", month: "short", year: "numeric" })

const SLIDE_LABEL: Record<string, string> = {
  app_barter: "App campaigns — barter",
  app_paid: "App campaigns — paid",
  managed: "Managed campaigns",
  ugc: "UGC",
  waiting: "Waiting on us",
  sourcing: "Sourcing",
}

interface Display {
  id: string
  label: string
  scope: "team" | "leadership"
  token: string
  slides: string[] | null
  refresh_seconds: number
  expires_at: string | null
  revoked_at: string | null
  last_seen_at: string | null
  created_at: string
}

async function api(path = "", options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase()
  const res = await fetchWithAuth(`${BASE}${path}`, {
    ...options,
    headers: { ...(method === "GET" ? {} : { "Content-Type": "application/json" }), ...options.headers },
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(e.detail || `API error: ${res.status}`)
  }
  return res.json()
}

export default function DisplaysPage() {
  // Minting a screen link is minting a credential that never expires, so this page is gated
  // the way every other console screen is: operators only (AuthGuard requireAdmin), scoped
  // to the "system" module the way ModuleRouteGuard scopes the rest of /superadmin.
  // `canExport` is the frontend mirror of field_policy's leadership scope (superadmin /
  // admin / ceo / cofounder) — the only people who may point a screen at money.
  const { can, canExport, loading: accessLoading } = useAdminAccess()
  const [items, setItems] = useState<Display[]>([])
  const [slideKeys, setSlideKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [label, setLabel] = useState("")
  const [scope, setScope] = useState<"team" | "leadership">("team")
  const [picked, setPicked] = useState<string[]>([])
  // A money screen's link is a permanent, login-free URL onto revenue, so a new one is given
  // an end date by default. A delivery screen keeps the old behaviour — permanent, no field,
  // because an expiry nobody watches is a blank wall on a Sunday.
  const [expiryOn, setExpiryOn] = useState(true)
  const [expiryDays, setExpiryDays] = useState(90)
  /**
   * Two irreversible actions, neither of which used to ask.
   *
   * "New link" rotates the token, which stops the URL currently open on the wall: the screen
   * in the office goes to an error page and stays there until someone walks over with the new
   * link. "Turn off" revokes it outright. Both were a single click on a small ghost button
   * sitting beside "Copy link". They now confirm, and the confirmation names the screen.
   */
  const [confirmRotate, setConfirmRotate] = useState<Display | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<Display | null>(null)
  // A failed read is not "no screens yet" — the wall may be running perfectly on links this
  // page simply could not list.
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await api()
      // The route returns `items`; reading `displays` left the list permanently empty.
      setItems(res?.data?.items ?? res?.data?.displays ?? [])
      setSlideKeys(res?.data?.slide_keys ?? [])
      setFailure(null)
    } catch (e) {
      setItems([])
      setFailure((e as Error).message || "The request did not complete")
      toast.error((e as Error).message || "Could not load screens")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!label.trim()) return toast.error("Name the screen — where it hangs is the useful name")
    setBusy(true)
    try {
      // Only a money screen carries an expiry, and only when it is left switched on.
      // Everything else sends nothing, which the route already reads as "never expires".
      const expires_at = scope === "leadership" && expiryOn && expiryDays > 0
        ? dubaiEndOfDay(dubaiDay(new Date(Date.now() + expiryDays * 86400_000)))
        : null
      await api("", {
        method: "POST",
        body: JSON.stringify({
          label: label.trim(), scope,
          slides: picked.length ? picked : null,
          expires_at,
        }),
      })
      toast.success(expires_at
        ? `Screen created. The link stops working at the end of ${readableDay(expires_at)}.`
        : "Screen created")
      setOpen(false); setLabel(""); setPicked([]); setScope("team")
      setExpiryOn(true); setExpiryDays(90)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Could not create the screen")
    } finally {
      setBusy(false)
    }
  }

  const patch = async (d: Display, body: Record<string, unknown>, said: string) => {
    try {
      await api(`/${d.id}`, { method: "PATCH", body: JSON.stringify(body) })
      toast.success(said)
      load()
    } catch (e) {
      toast.error((e as Error).message || "That did not save")
    }
  }

  const rotate = async (d: Display) => {
    setConfirmRotate(null)
    try {
      const res = await api(`/${d.id}/rotate`, { method: "POST", body: "{}" })
      const path = res?.data?.path
      if (path) navigator.clipboard.writeText(`${window.location.origin}${path}`)
      toast.success(`New link for "${d.label}" copied. The old one has stopped working — open this one on the screen.`)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Could not issue a new link")
    }
  }

  const revoke = async (d: Display) => {
    setConfirmRevoke(null)
    try {
      await api(`/${d.id}/revoke`, { method: "POST", body: "{}" })
      toast.success(`"${d.label}" turned off`)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Could not turn it off")
    }
  }

  const wallUrl = (d: Display) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/tv/${d.token}`

  if (!accessLoading && !can("system")) {
    return (
      <AuthGuard requireAuth={true} requireAdmin={true}>
        <SuperAdminInterface><UnauthorizedAccess /></SuperAdminInterface>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <SuperAdminInterface>
        <div className="mx-auto max-w-5xl space-y-ds-5 p-ds-4">
          {/* The title was a fourth hand-rolled copy of the console's page head. It is the
              shared one now, so this screen's title weighs what every other title weighs. */}
          <PageHead
            title="Office screens"
            sub="The wall in the office and anything else we hang. A screen link stays open until you turn it off: it runs unattended, and an expiry nobody watches is a blank wall on a Sunday. A screen that shows money is the exception, and is offered an end date."
            action={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />New screen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New screen</DialogTitle>
                  <DialogDescription>
                    Name it for where it hangs, so the list still makes sense next year.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Name *</Label>
                    <Input value={label} onChange={(e) => setLabel(e.target.value)}
                           placeholder="e.g. Office wall — main" />
                  </div>
                  {/* These two settings each sat in a bordered box inside a dialog that
                      already has an edge and a title — four edges around two switches. They
                      are separated by the gap now, and the end-date block, which only appears
                      once Show money is on, hangs off it by indentation rather than by a box
                      of its own. The gate is unchanged: canExport is the frontend mirror of
                      the leadership scope, and only it can point a screen at money. */}
                  {canExport && (
                    <div className="flex items-center justify-between gap-ds-3">
                      <div>
                        <p className="text-ds-label">Show money</p>
                        <p className="text-ds-caption text-muted-foreground">
                          Invoiced, collected and unpaid. Founders&apos; screens only.
                        </p>
                      </div>
                      <Switch checked={scope === "leadership"}
                              onCheckedChange={(v: boolean) => setScope(v ? "leadership" : "team")} />
                    </div>
                  )}
                  {canExport && scope === "leadership" && (
                    <div className="space-y-ds-2 border-l border-black/[0.08] pl-ds-3 dark:border-white/[0.1]">
                      <div className="flex items-center justify-between gap-ds-3">
                        <div>
                          <p className="text-ds-label">Give the link an end date</p>
                          <p className="text-ds-caption text-muted-foreground">
                            Anyone with this URL reads our revenue without logging in. You can
                            extend it any time from the list, and turning this off keeps the
                            link permanent.
                          </p>
                        </div>
                        <Switch checked={expiryOn} onCheckedChange={setExpiryOn} />
                      </div>
                      {expiryOn && (
                        <div className="flex items-center gap-2">
                          <Input type="number" min={1} max={730} value={expiryDays}
                                 className="h-8 w-24"
                                 onChange={(e) => setExpiryDays(Number(e.target.value) || 0)} />
                          <span className="text-xs text-muted-foreground">
                            days — runs until the end of{" "}
                            {readableDay(new Date(Date.now() + (expiryDays || 0) * 86400_000))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Slides</Label>
                    <p className="text-xs text-muted-foreground">
                      Leave all off to show everything that has live work.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {slideKeys.map((k) => {
                        const on = picked.includes(k)
                        return (
                          <Button key={k} type="button" size="sm"
                                  variant={on ? "default" : "outline"}
                                  className="h-7 rounded-full px-3 text-xs"
                                  onClick={() => setPicked(on ? picked.filter(x => x !== k) : [...picked, k])}>
                            {SLIDE_LABEL[k] ?? k}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
                  <Button onClick={create} disabled={busy}>
                    {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            }
          />

          {loading ? (
            <div className="flex justify-center py-ds-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : failure ? (
            <div className="py-ds-6 text-center">
              <p className="text-ds-subheading">Could not load the screens</p>
              <p className="mt-ds-2 text-ds-body text-muted-foreground">
                Any screen already hanging carries on showing what it was showing. This page
                just could not list them, so nothing below is a count.
              </p>
              <p className="mt-ds-2 text-ds-caption text-muted-foreground">{failure}</p>
              <Button variant="outline" size="sm" className="mt-ds-3" onClick={() => { setLoading(true); load() }}>
                <RefreshCw className="mr-1.5 h-4 w-4" />Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-ds-6 text-center">
              <Monitor className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-ds-3 text-ds-label">No screens yet</p>
            </div>
          ) : (
            <div className="space-y-ds-2">
              {items.map((d) => {
                const off = !!d.revoked_at
                return (
                  /* One card per screen is right — each is a different physical object. It
                     moves to the console shell so its radius and shadow match the rest. */
                  <div key={d.id}
                       className={`${CARD} bg-[var(--tone-neutral-wash)] ${off ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-center gap-ds-3 p-ds-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{d.label}</span>
                          {d.scope === "leadership" && <Badge variant="secondary">Shows money</Badge>}
                          {off && <Badge variant="outline">Off</Badge>}
                          {!off && (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <CalendarClock className="h-3 w-3" />
                              {d.expires_at ? `until ${readableDay(d.expires_at)}` : "no end date"}
                            </Badge>
                          )}
                          {!off && d.last_seen_at && (
                            <Badge variant="outline" className="gap-1 text-[var(--tone-good-ink)]">
                              <Eye className="h-3 w-3" />
                              seen {new Date(d.last_seen_at).toLocaleString("en-GB",
                                { timeZone: DUBAI_TZ, day: "numeric", month: "short",
                                  hour: "2-digit", minute: "2-digit" })}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {d.slides?.length
                            ? d.slides.map(s => SLIDE_LABEL[s] ?? s).join(" · ")
                            : "Everything with live work"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Refresh</Label>
                        <Input
                          type="number" min={15} max={3600} defaultValue={d.refresh_seconds}
                          className="h-8 w-20"
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (v && v !== d.refresh_seconds) patch(d, { refresh_seconds: v }, "Refresh saved")
                          }}
                        />
                        <span className="text-xs text-muted-foreground">s</span>
                      </div>

                      {/* Extend, set or clear the end date without re-issuing the URL —
                          clearing it makes the screen permanent again, so no wall that
                          works today can be left to die by accident. */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Until</Label>
                        <Input
                          type="date" className="h-8 w-36" disabled={off}
                          defaultValue={d.expires_at ? dubaiDay(d.expires_at) : ""}
                          onBlur={(e) => {
                            const v = e.target.value
                            // Compare and store in Dubai days, so the date you set is the
                            // date that reads back out of the badge and this field.
                            const now = d.expires_at ? dubaiDay(d.expires_at) : ""
                            if (v === now) return
                            patch(d, { expires_at: v ? dubaiEndOfDay(v) : null },
                                  v ? "End date saved" : "End date cleared — the link is permanent again")
                          }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={off}
                                onClick={() => {
                                  navigator.clipboard.writeText(wallUrl(d))
                                  toast.success("Link copied — open it on the screen")
                                }}>
                          <Copy className="h-3.5 w-3.5" />Copy link
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={off}
                                onClick={() => setConfirmRotate(d)}>
                          <RefreshCw className="h-3.5 w-3.5" />New link
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive"
                                disabled={off} onClick={() => setConfirmRevoke(d)}>
                          <Power className="h-3.5 w-3.5" />Turn off
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Both confirmations name the screen, because the list is a list of physical
              objects in the office and "this one" is not enough to walk to. */}
          <AlertDialog open={!!confirmRotate} onOpenChange={(o: boolean) => !o && setConfirmRotate(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Issue a new link for &ldquo;{confirmRotate?.label}&rdquo;?</AlertDialogTitle>
                <AlertDialogDescription>
                  The link currently open on that screen stops working the moment you do this,
                  so the screen in the office goes blank until somebody opens the new link on
                  it. The new link is copied to your clipboard.
                  {confirmRotate?.scope === "leadership"
                    ? " This screen shows money, so treat the new URL the same way: anyone holding it reads our revenue without logging in."
                    : ""}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep the current link</AlertDialogCancel>
                <AlertDialogAction onClick={() => confirmRotate && rotate(confirmRotate)}>
                  Issue a new link
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!confirmRevoke} onOpenChange={(o: boolean) => !o && setConfirmRevoke(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Turn off &ldquo;{confirmRevoke?.label}&rdquo;?</AlertDialogTitle>
                <AlertDialogDescription>
                  Its link stops working for good. Whatever is on that screen now will be
                  replaced by an error page, and turning it back on means creating a new
                  screen with a new URL.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Leave it running</AlertDialogCancel>
                <AlertDialogAction onClick={() => confirmRevoke && revoke(confirmRevoke)}>
                  Turn it off
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
