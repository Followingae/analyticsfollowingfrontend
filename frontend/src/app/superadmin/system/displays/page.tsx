"use client"

/**
 * Office screens — the TV wall, and any other screen we hang.
 *
 * The wall has been running for weeks on tokens minted by hand, because everything needed to
 * manage one existed except a page to do it on. This is that page: mint a screen, choose
 * which slides it shows and how fast it refreshes, and turn it off when the screen comes
 * down.
 *
 * A screen link does not expire by default, and that is deliberate: it runs unattended in
 * the office, and an expiry nobody is watching means a blank wall on a Sunday.
 */

import { useCallback, useEffect, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, Monitor, Copy, Power, Eye } from "lucide-react"
import { toast } from "sonner"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/displays`

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
  const [items, setItems] = useState<Display[]>([])
  const [slideKeys, setSlideKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [label, setLabel] = useState("")
  const [scope, setScope] = useState<"team" | "leadership">("team")
  const [picked, setPicked] = useState<string[]>([])

  const load = useCallback(async () => {
    try {
      const res = await api()
      setItems(res?.data?.displays ?? [])
      setSlideKeys(res?.data?.slide_keys ?? [])
    } catch (e) {
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
      await api("", {
        method: "POST",
        body: JSON.stringify({
          label: label.trim(), scope,
          slides: picked.length ? picked : null,
        }),
      })
      toast.success("Screen created")
      setOpen(false); setLabel(""); setPicked([]); setScope("team")
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

  const revoke = async (d: Display) => {
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

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Office screens</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground">
                The wall in the office and anything else we hang. A screen link stays open until
                you turn it off — it runs unattended, and an expiry nobody watches is a blank wall.
              </p>
            </div>
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
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Show money</p>
                      <p className="text-xs text-muted-foreground">
                        Invoiced, collected and unpaid. Founders&apos; screens only.
                      </p>
                    </div>
                    <Switch checked={scope === "leadership"}
                            onCheckedChange={(v: boolean) => setScope(v ? "leadership" : "team")} />
                  </div>
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
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">No screens yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((d) => {
                const off = !!d.revoked_at
                return (
                  <Card key={d.id} className={off ? "opacity-60" : undefined}>
                    <CardContent className="flex flex-wrap items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{d.label}</span>
                          {d.scope === "leadership" && <Badge variant="secondary">Shows money</Badge>}
                          {off && <Badge variant="outline">Off</Badge>}
                          {!off && d.last_seen_at && (
                            <Badge variant="outline" className="gap-1 text-emerald-600 dark:text-emerald-400">
                              <Eye className="h-3 w-3" />
                              seen {new Date(d.last_seen_at).toLocaleString("en-GB",
                                { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={off}
                                onClick={() => {
                                  navigator.clipboard.writeText(wallUrl(d))
                                  toast.success("Link copied — open it on the screen")
                                }}>
                          <Copy className="h-3.5 w-3.5" />Copy link
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive"
                                disabled={off} onClick={() => revoke(d)}>
                          <Power className="h-3.5 w-3.5" />Turn off
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
