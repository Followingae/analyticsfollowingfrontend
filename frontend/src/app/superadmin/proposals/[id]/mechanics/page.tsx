"use client"

/**
 * How the confirmed roster actually happens: where the product goes, or where they visit,
 * and when the post is due.
 *
 * WHY THIS SCREEN EXISTS
 * ----------------------
 * A barter campaign is agreed the moment the client picks their creators, and then stops
 * dead, because nothing on either side says where eight hampers are being sent, which two
 * creators are coming to the restaurant instead, or when any of it is due. Those answers
 * were arriving one WhatsApp at a time and living nowhere.
 *
 * WHAT IT IS NOT
 * --------------
 * Not a form that must be completed. These answers come back one phone call at a time, so
 * every field saves on its own and the screen's job is to show what is still outstanding -
 * a "3 of 8 ready" you can act on, rather than a submit button that refuses you.
 *
 * It applies to paid campaigns too. A paid creator still has a posting deadline, and a paid
 * creator being sent a product still needs an address; barter is simply the case where it is
 * never optional.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Check, Gift, MapPin, Store, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { cdnAvatar } from "@/lib/avatar"

type Creator = {
  row_id: string
  username?: string | null
  full_name?: string | null
  profile_image_url?: string | null
  locked: boolean
  fulfilment_mode?: "delivery" | "visit" | null
  address_line?: string | null
  address_city?: string | null
  address_phone?: string | null
  contact_email?: string | null
  visit_venue?: string | null
  visit_at?: string | null
  post_due_at?: string | null
  mechanics_note?: string | null
  confirmed_at?: string | null
  barter_product?: string | null
  barter_value_aed?: number | null
  assigned_deliverables?: Array<{ type: string; quantity?: number }>
  missing: string[]
}

/** A timestamp the datetime-local input will accept: it refuses a zone, and it refuses seconds. */
const forInput = (iso?: string | null) => (iso ? iso.slice(0, 16) : "")

export default function MechanicsPage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = String(params?.id ?? "")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [proposal, setProposal] = useState<{ name?: string; is_barter?: boolean; product?: string | null } | null>(null)
  const [creators, setCreators] = useState<Creator[]>([])

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/proposals/${proposalId}/mechanics`,
        { headers: getAuthHeaders() },
      )
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setProposal(json.data?.proposal ?? null)
      setCreators(json.data?.creators ?? [])
    } catch {
      toast.error("Could not load this roster")
    } finally {
      setLoading(false)
    }
  }, [proposalId])

  useEffect(() => { load() }, [load])

  const ready = useMemo(() => creators.filter(c => c.missing.length === 0).length, [creators])

  /** Change one field locally. Nothing is sent until the field is left, so typing an address
   *  does not fire eight requests. */
  function patch(rowId: string, next: Partial<Creator>) {
    setCreators(prev => prev.map(c => (c.row_id === rowId ? { ...c, ...next } : c)))
  }

  async function save(rowId: string, next?: Partial<Creator>) {
    const c = creators.find(x => x.row_id === rowId)
    if (!c) return
    const body = { ...c, ...next }
    setSaving(rowId)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/proposals/${proposalId}/mechanics`,
        {
          method: "PUT",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: [{
              row_id: rowId,
              fulfilment_mode: body.fulfilment_mode ?? undefined,
              address_line: body.address_line ?? undefined,
              address_city: body.address_city ?? undefined,
              address_phone: body.address_phone ?? undefined,
              contact_email: body.contact_email ?? undefined,
              visit_venue: body.visit_venue ?? undefined,
              visit_at: body.visit_at ?? undefined,
              post_due_at: body.post_due_at ?? undefined,
              mechanics_note: body.mechanics_note ?? undefined,
            }],
          }),
        },
      )
      if (!res.ok) throw new Error(await res.text())
      // Re-read rather than guess: the server decides what still counts as missing, and it
      // is the same rule the campaign will be judged by.
      await load()
    } catch {
      toast.error(`Could not save ${c.username ? "@" + c.username : "that creator"}`)
    } finally {
      setSaving(null)
    }
  }

  return (
    <SuperadminLayout>
      <div className="space-y-ds-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-8 text-muted-foreground"
                    onClick={() => router.push(`/work/proposals/${proposalId}`)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {proposal?.name || "Proposal"}
            </Button>
            <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em]">
              How this happens
            </h1>
            <p className="mt-1 max-w-2xl text-[15px] text-muted-foreground">
              Where each creator gets their product, or where they go, and when they post.
              Every answer saves on its own.
            </p>
          </div>
          {!loading && creators.length > 0 && (
            <div className="rounded-xl border bg-card px-4 py-3 text-right">
              <p className="text-[26px] font-semibold leading-none tabular-nums">
                {ready}<span className="text-muted-foreground"> / {creators.length}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">ready to run</p>
            </div>
          )}
        </div>

        {proposal?.product && (
          <div className="flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">
              <span className="text-muted-foreground">Every creator receives </span>
              <span className="font-medium">{proposal.product}</span>
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : creators.length === 0 ? (
          <div className="rounded-xl border bg-card px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nobody is confirmed on this proposal yet. This screen fills in once the client
              has picked their creators.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {creators.map((c) => {
              const mode = c.fulfilment_mode
              const done = c.missing.length === 0
              return (
                <section key={c.row_id}
                         className={cn("rounded-xl border bg-card p-4",
                                       done && "border-emerald-500/30")}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={cdnAvatar(c.profile_image_url || undefined)} />
                        <AvatarFallback>{(c.username?.[0] ?? "?").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">@{c.username ?? "unknown"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.full_name}
                          {c.barter_product ? ` · ${c.barter_product}` : ""}
                        </p>
                      </div>
                    </div>
                    {done ? (
                      <Badge className="gap-1 border-transparent bg-emerald-500/10 text-emerald-600">
                        <Check className="h-3 w-3" /> Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Needs {c.missing.join(", ")}
                      </Badge>
                    )}
                  </div>

                  {/* How they get it. Two ways, and picking one clears the other, so a visit
                      date can never sit behind a delivery address. */}
                  <div className="mt-3 flex gap-2">
                    {([
                      ["delivery", "Send it to them", MapPin],
                      ["visit", "They come to us", Store],
                    ] as const).map(([key, label, Icon]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { patch(c.row_id, { fulfilment_mode: key }); save(c.row_id, { fulfilment_mode: key }) }}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors duration-150",
                          mode === key
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {mode === "delivery" && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Input placeholder="Building, street, area" value={c.address_line ?? ""}
                             onChange={e => patch(c.row_id, { address_line: e.target.value })}
                             onBlur={() => save(c.row_id)} className="sm:col-span-2" />
                      <Input placeholder="City" value={c.address_city ?? ""}
                             onChange={e => patch(c.row_id, { address_city: e.target.value })}
                             onBlur={() => save(c.row_id)} />
                      <Input placeholder="Phone the courier can call" value={c.address_phone ?? ""}
                             onChange={e => patch(c.row_id, { address_phone: e.target.value })}
                             onBlur={() => save(c.row_id)} />
                    </div>
                  )}

                  {mode === "visit" && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Input placeholder="Where they go" value={c.visit_venue ?? ""}
                             onChange={e => patch(c.row_id, { visit_venue: e.target.value })}
                             onBlur={() => save(c.row_id)} />
                      <Input type="datetime-local" value={forInput(c.visit_at)}
                             onChange={e => patch(c.row_id, { visit_at: e.target.value })}
                             onBlur={() => save(c.row_id)} />
                    </div>
                  )}

                  <div className="mt-3 grid gap-2 sm:grid-cols-[220px_1fr]">
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" /> Post due
                      </label>
                      <Input type="datetime-local" value={forInput(c.post_due_at)}
                             onChange={e => patch(c.row_id, { post_due_at: e.target.value })}
                             onBlur={() => save(c.row_id)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Anything the team should know
                      </label>
                      <Textarea rows={2} value={c.mechanics_note ?? ""}
                                onChange={e => patch(c.row_id, { mechanics_note: e.target.value })}
                                onBlur={() => save(c.row_id)}
                                placeholder="Gate code, who to ask for, allergies" />
                    </div>
                  </div>

                  {saving === c.row_id && (
                    <p className="mt-2 text-xs text-muted-foreground">Saving…</p>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </SuperadminLayout>
  )
}
