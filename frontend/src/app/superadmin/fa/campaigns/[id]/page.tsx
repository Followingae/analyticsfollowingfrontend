"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, ClipboardList, ExternalLink } from "lucide-react"
import { PageHead } from "@/components/console/primitives"
import { FaPage, Failed, Loading, Nothing, TONE_BADGE, TONE_TEXT, type Tone } from "../../_ui"
import Link from "next/link"
import { faCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"
import { AutoApproveCard } from '@/components/superadmin/fa/AutoApproveCard'
import { ParticipantDetailSheet, type ParticipantLike } from "@/components/campaigns/fa/ParticipantDetailSheet"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

interface FunnelCreator {
  participant_id: string
  member_id: string | null
  offline: boolean
  handle: string | null
  full_name: string | null
  avatar_url: string | null
  followers_count: number | null
  participation_type: string | null
  source: string | null
  status: string
  bucket: string
  joined_at: string | null
  brand_rejection_reason: string | null
  /** The edit the brand asked for, off the DELIVERABLE. Distinct from
   *  brand_rejection_reason, which is the proposal-level rejection. */
  revision_reason: string | null
  deliverables: Record<string, number> & { total: number }
}

// Funnel order = lifecycle order. One creator lands in exactly one bucket (computed
// by the backend), so the counts read as a real funnel.
/* Eight stages that were eight unrelated palette families. Tone carries it now, so the
   same stage looks the same here as it does on the deliverables queue. */
const BUCKETS: { key: string; label: string; tone: Tone }[] = [
  { key: "applied", label: "Applied", tone: "neutral" },
  { key: "enrolled", label: "Enrolled, content pending", tone: "info" },
  { key: "content_review", label: "Content review", tone: "warn" },
  { key: "revision_requested", label: "Edit requested", tone: "warn" },
  { key: "content_approved", label: "Approved, awaiting the post", tone: "info" },
  { key: "proof_submitted", label: "Proof submitted", tone: "warn" },
  { key: "completed", label: "Completed", tone: "good" },
  { key: "rejected", label: "Rejected", tone: "bad" },
]

const DELIVERABLE_CHIP_LABELS: Record<string, string> = {
  pending: "pending",
  content_review: "in review",
  revision_requested: "edit requested",
  content_approved: "awaiting post",
  proof_submitted: "proof in",
  verified: "verified",
  rejected: "rejected",
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-AE", { month: "short", day: "numeric" }) : "—"

const fmtFollowers = (n?: number | null) =>
  n == null ? null : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`

export default function FACampaignFunnelPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState<any>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [creators, setCreators] = useState<FunnelCreator[]>([])
  const [bucket, setBucket] = useState<string>("all")
  /** Whether the funnel request actually answered. Before this existed the strip read
   *  `counts[key] ?? 0` unconditionally, so while the page was loading — and for as long
   *  as it stayed failed — all eight stages showed a confident "0". Eight measured zeroes
   *  and eight unanswered questions are not the same thing, and the screen said the first
   *  when it meant the second. Unanswered now shows an em dash. */
  const [answered, setAnswered] = useState(false)

  /* ⚠️ THE TEAM LOST THE CREATOR SIDEBAR ON THIS SCREEN, AND IT WAS NEVER HERE TO LOSE.
     `ParticipantDetailSheet` - deliverables, analytics, the coupon, the dine-in visit,
     approve, reject, approve content, request an edit, upload on the creator's behalf,
     mark a parcel sent - is mounted in ONE place, `FaCampaignProgressPanel`, and that
     panel lives on `/campaigns/{id}/posts`, which is the BRAND's app. The team had been
     reaching it by opening the customer's own screen. Routing staff to internal screens
     instead was right, but it moved them to a page that had only ever been a read-only
     funnel: eight numbers and a list of names with nothing behind them.

     The funnel's eight buckets are worth keeping - they are finer than the sheet's three
     tabs and they are why somebody opens this page - so the rows stay and gain the sheet
     behind them. The sheet takes the participant shape that `fa-progress` returns, which
     the funnel endpoint does not, so both are loaded and matched on participant_id. */
  const [richById, setRichById] = useState<Record<string, ParticipantLike>>({})
  const [selected, setSelected] = useState<ParticipantLike | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faCampaignApi.funnel(id)
      const d = res?.data
      setCampaign(d?.campaign ?? null)
      setCounts(d?.counts ?? {})
      setCreators(Array.isArray(d?.creators) ? d.creators : [])
      setAnswered(true)
    } catch {
      setAnswered(false)
      toast.error("Could not load the campaign funnel")
    } finally {
      setLoading(false)
    }

    /* Separate, and deliberately not fatal. If this one fails the funnel still draws and
       the rows simply do not open, which is the screen as it was a minute ago. Failing the
       whole page because the detail could not be fetched would be a worse trade. */
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${id}/fa-progress`,
        { headers: getAuthHeaders() },
      )
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      const list: ParticipantLike[] = body?.data?.participants ?? []
      setRichById(Object.fromEntries(list.map((p) => [p.participant_id, p])))
    } catch {
      setRichById({})
    }
  }, [id])

  // Keep the open sheet in step with a reload, so approving from inside it redraws the
  // row behind it rather than leaving yesterday's status on screen.
  useEffect(() => {
    setSelected((cur) => (cur ? richById[cur.participant_id] ?? cur : cur))
  }, [richById])

  const faType = campaign?.campaign_type as string | undefined
  const sheetType: "cashback" | "paid_deal" | "barter" | null =
    faType === "cashback" || faType === "paid_deal" || faType === "barter" ? faType : null

  useEffect(() => { load() }, [load])

  const visible = useMemo(
    () => (bucket === "all" ? creators : creators.filter((c) => c.bucket === bucket)),
    [creators, bucket],
  )

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage>
          <div className="flex flex-wrap items-center justify-between gap-ds-3">
            <div className="flex items-center gap-ds-3 min-w-0">
              <Button size="sm" variant="ghost" onClick={() => router.push("/superadmin/fa/campaigns")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <PageHead
                  title={campaign?.name || "Campaign"}
                  sub={[
                    campaign?.campaign_type ? String(campaign.campaign_type).replace(/_/g, " ") : null,
                    campaign?.status ?? null,
                    `${creators.length}${campaign?.max_participants ? ` of ${campaign.max_participants}` : ""} creators`,
                  ].filter(Boolean).join(" · ")}
                  action={(
                    /* The queue has a campaign picker; it just never read the campaign you came from. */
                    <Link href={`/superadmin/fa/deliverables?campaign=${id}`}>
                      <Button size="sm" variant="outline"><ClipboardList className="h-4 w-4 mr-1.5" />All deliverables</Button>
                    </Link>
                  )}
                />
              </div>
            </div>
          </div>

          <AutoApproveCard campaignId={id} />

          {/* Funnel strip — click a stage to filter the list below.
              Each stage used to be its own bordered, padded box, so reading this row of
              eight meant crossing sixteen edges to compare two numbers. The edges said
              nothing the row was not already saying. They are gone; the gap between
              stages does the grouping instead, and the figures took the room the padding
              was holding. The selected stage is marked by a rule under it and by its
              label going to full strength, which is a stronger signal than the old tinted
              border because nothing else on the row carries either. */}
          <div className="-mx-ds-2 grid grid-cols-2 gap-x-ds-4 gap-y-ds-4 sm:grid-cols-4 lg:grid-cols-8">
            {BUCKETS.map((b) => {
              const n = answered ? counts[b.key] ?? 0 : null
              const active = bucket === b.key
              return (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBucket(active ? "all" : b.key)}
                  className={`group rounded-ds-md px-ds-2 pb-ds-2 pt-ds-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${active ? "" : "hover:bg-black/[0.035] dark:hover:bg-white/[0.05]"}`}
                >
                  <p
                    className={`text-[32px] font-semibold leading-none tracking-[-0.025em] tabular-nums ${
                      active ? "text-foreground" : n === 0 ? "text-muted-foreground/50" : "text-foreground"
                    }`}
                  >
                    {n ?? "—"}
                  </p>
                  <p
                    className={`mt-ds-2 text-ds-caption leading-tight ${
                      active ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {b.label}
                  </p>
                  <span
                    className={`mt-ds-2 block h-[2px] rounded-full transition-colors ${
                      active ? "bg-foreground" : "bg-transparent"
                    }`}
                  />
                </button>
              )
            })}
          </div>

          {/* The one hairline on this screen. Above it the funnel; below it the people in
              it. That is a genuinely different subject, and it is the only place here
              where a rule earns its keep. */}
          <div className="border-t border-black/[0.06] pt-ds-4 dark:border-white/[0.07]">
          {loading ? (
            <Loading label="Loading the funnel" />
          ) : !answered ? (
            /* The funnel request did not come back. Before this branch existed the page
               fell through to the empty state and told the operator this campaign has no
               creators in it, which is a claim about the campaign made out of a 500. */
            <Failed what="this campaign's creators" onRetry={load} />
          ) : visible.length === 0 ? (
            <Nothing>
              {bucket === "all"
                ? "No creator has joined this campaign yet."
                : `Nobody is at “${BUCKETS.find((b) => b.key === bucket)?.label}” right now.`}
            </Nothing>
          ) : (
            /* Was a Card per creator: forty rows, forty borders, forty shadows, and the
               eye crossing two edges to get from one person's name to the next. It is a
               list, so it is drawn as one — a hairline between rows, nothing around
               them. Every field the cards carried is still on the row. */
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
              {visible.map((c) => {
                const meta = BUCKETS.find((b) => b.key === c.bucket) ?? BUCKETS[0]
                const chips = Object.entries(c.deliverables)
                  .filter(([k, v]) => k !== "total" && (v as number) > 0)
                  .map(([k, v]) => `${v} ${DELIVERABLE_CHIP_LABELS[k] ?? k}`)
                const rich = richById[c.participant_id]
                const openable = !!rich && !!sheetType
                return (
                  <div
                    key={c.participant_id}
                    role={openable ? "button" : undefined}
                    tabIndex={openable ? 0 : undefined}
                    aria-label={openable ? `Open ${c.handle ? `@${c.handle}` : c.full_name || "this creator"}` : undefined}
                    onClick={openable ? () => { setSelected(rich); setSheetOpen(true) } : undefined}
                    onKeyDown={openable ? (e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(rich); setSheetOpen(true) }
                    } : undefined}
                    className={`flex flex-wrap items-center justify-between gap-ds-3 py-ds-3 ${
                      openable
                        ? "-mx-ds-2 cursor-pointer rounded-lg px-ds-2 hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        : ""
                    }`}
                  >
                      <div className="flex items-center gap-ds-3 min-w-0">
                        {c.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                            {(c.handle || c.full_name || "?").replace(/^@/, "").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {c.handle ? (
                              <a
                                href={`https://instagram.com/${c.handle}`}
                                target="_blank" rel="noopener noreferrer"
                                // The row opens the creator now, so this link has to stop
                                // bubbling or Instagram and the sheet both open at once.
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium truncate hover:underline inline-flex items-center gap-1"
                              >
                                @{c.handle}<ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </a>
                            ) : (
                              <span className="font-medium truncate">{c.full_name || "Creator"}</span>
                            )}
                            {c.offline && <Badge variant="outline" className="text-[10px]">offline · team managed</Badge>}
                            {c.source === "team_suggested" && <Badge variant="outline" className="text-[10px]">team suggested</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                            {c.full_name && c.handle && <span className="truncate">{c.full_name}</span>}
                            {fmtFollowers(c.followers_count) && <span>· {fmtFollowers(c.followers_count)} followers</span>}
                            <span>· joined {fmtDate(c.joined_at)}</span>
                            {chips.length > 0 && <span>· {chips.join(" · ")}</span>}
                          </div>
                          {c.bucket === "rejected" && c.brand_rejection_reason && (
                            <p className={`mt-0.5 max-w-[420px] truncate text-ds-caption italic ${TONE_TEXT.bad}`}>“{c.brand_rejection_reason}”</p>
                          )}
                          {/* The edit the brand asked for. The row already showed an
                              "Edit requested" badge with no text beside it, so the team
                              could see that an edit was wanted and never what it was —
                              which makes the badge worse than useless. Not truncated:
                              this is an instruction someone has to act on. */}
                          {c.bucket === "revision_requested" && c.revision_reason && (
                            <p className={`mt-0.5 max-w-[520px] text-ds-caption italic ${TONE_TEXT.warn}`}>
                              Edit requested: “{c.revision_reason}”
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${TONE_BADGE[meta.tone]}`}>{meta.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
          </div>

          {sheetType && (
            <ParticipantDetailSheet
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              campaignId={id}
              campaignType={sheetType}
              participant={selected}
              onChanged={load}
            />
          )}
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
