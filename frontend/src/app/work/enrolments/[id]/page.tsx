"use client"

/**
 * One enrolment: everything the creator gave us, shown in full, and the trail of how.
 *
 * Sections: the creator and their progress, who they are, where product goes, how they get
 * paid (with the payee check), their passport, what they signed, and every event in order.
 * Anything the API returns with a value is shown; fields not covered by a section land in
 * "Other details" so nothing is ever silently dropped.
 *
 * The payee check: a creator's bank details arrive DISABLED and nothing pays out until a person
 * has re-keyed the holder name and the last four digits against what the creator told them.
 * It is typed, not ticked. A "yes I checked" button checks nothing.
 *
 * The full IBAN is not here, and there is no view that shows it. The API does not return it to
 * any browser.
 */

import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2, ArrowLeft, Download, FileSignature, ShieldCheck, Copy, Check, CircleAlert, MapPin, Landmark, User,
  Clock, Link2 as LinkIcon, ExternalLink, BadgeCheck, IdCard, History, X, Info,
} from "lucide-react"
import { toast } from "sonner"
import { enrolmentApi, type EnrolmentDetail, type Instalment } from "@/services/enrolmentApi"

/* ------------------------------------------------------------------ formatting */

type Rec = Record<string, unknown>

const has = (v: unknown) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
const str = (v: unknown) => (has(v) ? String(v) : "")

const money = (c?: unknown) => {
  if (c == null || c === "" || isNaN(Number(c))) return ""
  return `AED ${(Number(c) / 100).toLocaleString("en-AE", { maximumFractionDigits: 2 })}`
}

const at = (iso?: unknown) => {
  if (!iso || typeof iso !== "string") return ""
  const d = new Date(iso)
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

const day = (iso?: unknown) => {
  if (!iso || typeof iso !== "string") return ""
  const d = new Date(iso)
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

const human = (k: string) => {
  const t = k.replace(/_aed_cents$/, "").replace(/_at$/, "").replace(/_/g, " ").trim()
  return t ? t[0].toUpperCase() + t.slice(1) : k
}

const words = (v: unknown) => str(v).replace(/_/g, " ")

/** Any value, shown readably: dates, money, yes/no, lists and objects included. */
function Val({ k, v }: { k?: string; v: unknown }): React.ReactElement {
  if (typeof v === "boolean") return <>{v ? "Yes" : "No"}</>
  if (k && /_aed_cents$/.test(k)) return <>{money(v)}</>
  if (typeof v === "string" && k && /(_at|_on|date|_by)$/.test(k) && !isNaN(new Date(v).getTime()) && /\d{4}-\d{2}-\d{2}/.test(v)) {
    return <>{/T\d{2}:/.test(v) ? at(v) : day(v)}</>
  }
  if (Array.isArray(v)) {
    return (
      <ul className="flex flex-col gap-1">
        {v.map((x, i) => <li key={i}><Val v={x} /></li>)}
      </ul>
    )
  }
  if (v && typeof v === "object") {
    const o = v as Rec
    const q = o.qty ?? o.quantity ?? o.count
    const t = o.type ?? o.kind ?? o.deliverable ?? o.name ?? o.label
    if (t && Object.keys(o).length <= 4) {
      const rest = Object.entries(o).filter(([kk, vv]) => !["qty", "quantity", "count", "type", "kind", "deliverable", "name", "label"].includes(kk) && has(vv))
      return <>{q ? `${q} × ` : ""}{words(t)}{rest.map(([kk, vv]) => <span key={kk} className="text-muted-foreground"> · {human(kk)}: <Val k={kk} v={vv} /></span>)}</>
    }
    return (
      <div className="flex flex-col gap-0.5">
        {Object.entries(o).filter(([, vv]) => has(vv)).map(([kk, vv]) => (
          <span key={kk}><span className="text-muted-foreground">{human(kk)}: </span><Val k={kk} v={vv} /></span>
        ))}
      </div>
    )
  }
  return <>{str(v)}</>
}

/* ------------------------------------------------------------------ layout pieces */

function Card({ icon, title, children, aside, className = "" }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; aside?: React.ReactNode; className?: string
}) {
  return (
    <section className={`min-w-0 rounded-2xl border bg-background p-5 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</span>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

/** One fact. Core facts (`always`) show "Not given" when empty; the rest only render with a value. */
function KV({ k, v, always, mono }: { k: string; v: React.ReactNode; always?: boolean; mono?: boolean }) {
  const empty = v === null || v === undefined || v === "" || v === false
  if (empty && !always) return null
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-4 border-b py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className={`min-w-0 break-words text-sm font-medium [overflow-wrap:anywhere] ${mono ? "font-mono text-xs" : ""}`}>
        {empty ? <span className="font-normal text-muted-foreground">Not given</span> : v}
      </span>
    </div>
  )
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); toast.success("Copied"); setTimeout(() => setDone(false), 1600) }
      catch { toast.error("Could not copy") }
    }}>
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{label}
    </Button>
  )
}

type StepState = "done" | "partial" | "bad" | "todo"

function Steps({ steps }: { steps: { label: string; state: StepState; when?: string }[] }) {
  return (
    <ol className="grid grid-cols-3 gap-y-4 sm:grid-cols-6">
      {steps.map((st, i) => (
        <li key={st.label} className="relative flex flex-col items-center gap-1.5 text-center">
          {i > 0 && <span className={`absolute right-1/2 top-3.5 hidden h-px w-full sm:block ${st.state === "todo" ? "bg-border" : "bg-foreground/40"}`} />}
          <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
            st.state === "done" ? "border-foreground bg-foreground text-background"
            : st.state === "partial" ? "border-amber-500 bg-amber-50 text-amber-700"
            : st.state === "bad" ? "border-red-500 bg-red-50 text-red-600"
            : "border-border bg-background text-muted-foreground"}`}>
            {st.state === "done" ? <Check className="h-3.5 w-3.5" /> : st.state === "partial" ? <Clock className="h-3.5 w-3.5" />
              : st.state === "bad" ? <X className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />}
          </span>
          <span className={`text-xs font-medium ${st.state === "todo" ? "text-muted-foreground" : ""}`}>{st.label}</span>
          {st.when && <span className="text-[10px] leading-tight text-muted-foreground">{st.when}</span>}
        </li>
      ))}
    </ol>
  )
}

function StatusChip({ status }: { status: string }) {
  const tone = status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : /reject|retract|expired|cancel/.test(status) ? "bg-red-50 text-red-700 border-red-200"
    : status === "live" ? "bg-[#d3ff02] text-[#111] border-transparent"
    : "bg-muted text-foreground border-transparent"
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}>{words(status)}</span>
}

/* ------------------------------------------------------------------ keys each section owns */

const SHOWN_LINK = new Set([
  "creator_handle", "creator_name", "creator_avatar", "avatar_url", "brand_display_name", "campaign_display_name",
  "deliverables_summary", "deliverables", "fee_aed_cents", "currency", "payment_terms", "usage_terms", "product_sent",
  "status", "submit_by", "created_at", "first_opened_at", "open_count", "payout_method", "purpose", "campaign_id",
  "agreement_version", "token", "id",
])
const SHOWN_SUB = new Set([
  "full_name", "email", "mobile", "instagram_handle", "date_of_birth", "email_verified_at", "details_at",
  "agreed_terms", "agreed_electronic", "agreed_age", "signature_name", "signed_at", "sign_ip", "agreement_pdf_url",
  "agreement_sha256", "bank_holder", "bank_swift", "bank_country", "bank_last4", "bank_status", "bank_confirmed_at",
  "bank_rejected_reason", "bank_iban_present", "address_line", "address_line2", "address_city", "address_state",
  "address_postcode", "address_country", "address_phone", "address_lat", "address_lng", "address_maps_url",
  "address_pin_source", "address_kind", "address_property", "address_unit", "address_floor", "address_building",
  "address_company", "passport_filename", "passport_uploaded_at", "passport_status", "passport_rejected_reason",
  "tax_number", "payout_collect_city", "completed_at", "inflink_influencer_id", "id", "link_id", "avatar_url",
])
const HIDDEN = /(^id$|token|_id$|password|secret|signature_svg|iban$)/

type AttachableCampaign = { id: string; name: string; brand?: string | null; client?: string | null }

export default function DetailWrapper() {
  return <AuthGuard><SuperAdminInterface><Detail /></SuperAdminInterface></AuthGuard>
}

function Detail() {
  const params = useParams()
  const id = String(params?.id || "")
  const [data, setData] = useState<EnrolmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [holder, setHolder] = useState("")
  const [last4, setLast4] = useState("")
  const [confirming, setConfirming] = useState(false)

  /* Tagging a direct link onto a campaign after the fact. */
  const [campQ, setCampQ] = useState("")
  const [camps, setCamps] = useState<AttachableCampaign[]>([])
  const [chosen, setChosen] = useState<AttachableCampaign | null>(null)
  const [attaching, setAttaching] = useState(false)

  const load = useCallback(async () => {
    setErr(null)
    try { setData(await enrolmentApi.detail(id)) }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not load this enrolment.") }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
    </div>
  }
  if (err || !data) {
    return <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <CircleAlert className="mt-0.5 h-4 w-4 text-destructive" /><span>{err}</span>
      </div>
    </div>
  }

  const L = data.link as Rec
  const S = data.submission as Rec
  const status = str(L.status)
  const bankStatus = str(S.bank_status)
  const handle = str(S.instagram_handle || L.creator_handle).replace(/^@/, "")
  const avatar = str(L.creator_avatar || L.avatar_url || S.avatar_url)
  const name = str(S.full_name || L.creator_name)

  const searchCampaigns = async (term: string) => {
    setChosen(null)
    if (term.trim().length < 2) { setCamps([]); return }
    try { setCamps(await enrolmentApi.attachableCampaigns(term.trim())) }
    catch { setCamps([]) }
  }

  const attach = async () => {
    if (!chosen) return
    setAttaching(true)
    try {
      const res = await enrolmentApi.attach(id, { campaign_id: chosen.id })
      toast.success(res.payments_moved
        ? `Tagged. ${res.payments_moved} payment${res.payments_moved === 1 ? "" : "s"} moved onto the campaign.`
        : "Tagged.")
      setCampQ(""); setCamps([]); setChosen(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not tag it.")
    } finally { setAttaching(false) }
  }

  const confirmPayee = async () => {
    setConfirming(true)
    try {
      await enrolmentApi.confirmPayee(id, holder.trim(), last4.trim())
      toast.success("Payee confirmed. Payouts can be raised.")
      setHolder(""); setLast4("")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That did not match.")
    } finally { setConfirming(false) }
  }

  /* ---------------- progress */
  const pStatus = str(S.passport_status).toLowerCase()
  const passportState: StepState = /reject/.test(pStatus) ? "bad"
    : has(S.passport_uploaded_at) || has(S.passport_filename) ? (/pending|review/.test(pStatus) ? "partial" : "done") : "todo"
  const bankState: StepState = bankStatus === "confirmed" ? "done" : bankStatus === "rejected" ? "bad" : has(S.bank_last4) ? "partial" : "todo"
  const steps: { label: string; state: StepState; when?: string }[] = [
    { label: "Opened", state: has(L.first_opened_at) ? "done" : "todo", when: day(L.first_opened_at) },
    { label: "Details", state: has(S.details_at) ? "done" : "todo", when: day(S.details_at) },
    { label: "Signed", state: has(S.signed_at) ? "done" : "todo", when: day(S.signed_at) },
    { label: "Bank", state: bankState, when: bankStatus === "pending" && has(S.bank_last4) ? "to confirm" : day(S.bank_confirmed_at) },
    { label: "Passport", state: passportState, when: day(S.passport_uploaded_at) },
    { label: "Address", state: has(S.address_line) ? "done" : "todo" },
  ]

  /* ---------------- address */
  const cityLine = [str(S.address_city), str(S.address_state), str(S.address_postcode)].filter(Boolean).join(", ")
  // Home or office, and what kind of home: the courier's first question. The door number,
  // floor and building are already composed into line 2.
  const kindLine = [S.address_kind === "office" ? "Office" : S.address_kind === "home" ? "Home" : "",
    S.address_property === "villa" ? "Villa" : S.address_property === "apartment" ? "Apartment" : ""].filter(Boolean).join(" · ")
  const addressLines = [kindLine, str(S.address_line2), str(S.address_line), cityLine, str(S.address_country)].filter(Boolean)
  const mapsUrl = str(S.address_maps_url)
    || (has(S.address_lat) && has(S.address_lng) ? `https://maps.google.com/?q=${S.address_lat},${S.address_lng}` : "")

  /* ---------------- payee */
  const payeeEvent = [...data.events].reverse().find(e => e.kind === "payee_confirmed")
  const autoConfirmed = !!payeeEvent?.actor_label && /^automatic/i.test(payeeEvent.actor_label)
  const pay = data.payments

  /* ---------------- anything not covered above */
  const extra = [
    ...Object.entries(L).filter(([k, v]) => !SHOWN_LINK.has(k) && !HIDDEN.test(k) && has(v)).map(([k, v]) => ({ k, v, from: "link" })),
    ...Object.entries(S).filter(([k, v]) => !SHOWN_SUB.has(k) && !HIDDEN.test(k) && has(v)).map(([k, v]) => ({ k, v, from: "sub" })),
  ]
  const inviteExtra = extra.filter(x => /^(invite_|whatsapp_)/.test(x.k))
  const otherExtra = extra.filter(x => !/^(invite_|whatsapp_)/.test(x.k))

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/work/enrolments"><ArrowLeft className="mr-1.5 h-4 w-4" /> All enrolments</Link>
      </Button>

      {/* 1. Header */}
      <section className="rounded-3xl border bg-background p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatar} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
              : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold uppercase">
                  {(handle || name || "?").slice(0, 2)}</span>}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{handle ? `@${handle}` : name || "Creator"}</h1>
                {status && <StatusChip status={status} />}
              </div>
              {name && handle && <p className="truncate text-sm text-muted-foreground">{name}</p>}
              {/* Each name opens where it lives: an enrolment was a dead end, papering a booking
                  you could not get back to. */}
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-sm">
                {has(L.team_id)
                  ? <Link href={`/work/brands/${str(L.team_id)}`} className="font-medium hover:underline">{str(L.brand_display_name)}</Link>
                  : <span className="font-medium">{str(L.brand_display_name)}</span>}
                {has(L.campaign_display_name) && (
                  <span className="text-muted-foreground"> · {has(L.campaign_id)
                    ? <Link href={`/work/campaigns/${str(L.campaign_id)}`} className="hover:text-foreground hover:underline">{str(L.campaign_display_name)}</Link>
                    : str(L.campaign_display_name)}</span>
                )}
                {has(L.proposal_id) && (
                  <span className="text-muted-foreground"> · <Link href={`/work/proposals/${str(L.proposal_id)}`} className="hover:text-foreground hover:underline">Proposal</Link></span>
                )}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2 md:w-[22rem]">
            <div className="flex min-w-0 items-center gap-2 rounded-full border bg-muted/30 py-1 pl-3 pr-1">
              <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <a href={data.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-xs hover:underline">{data.url}</a>
              <CopyButton text={data.url} />
            </div>
            <p className="text-xs text-muted-foreground">
              {[has(L.created_at) && `Sent ${day(L.created_at)}`, has(L.submit_by) && `due ${day(L.submit_by)}`,
                has(L.open_count) && `opened ${L.open_count}×`, has(S.completed_at) && `completed ${day(S.completed_at)}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="mt-6 border-t pt-5"><Steps steps={steps} /></div>
      </section>

      {/* Not on a campaign: tagging */}
      {L.campaign_id == null && (
        <div className="mt-5 rounded-2xl border p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            {str(L.purpose) === "direct" ? "Raised directly, on no campaign" : "Not on a campaign yet"}
          </div>
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
            {str(L.purpose) === "direct"
              ? "What we owe this creator will not appear on any campaign's money screen until it is tagged. Tagging moves their payments with it."
              : "The campaign for this proposal has not been opened yet. It is tagged on its own the moment somebody opens it."}
          </p>
          {str(L.purpose) === "direct" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="attach-camp">Campaign</Label>
                <Input id="attach-camp" value={campQ} className="w-72 max-w-full"
                  placeholder="Search by campaign, brand or client"
                  onChange={(e) => { setCampQ(e.target.value); void searchCampaigns(e.target.value) }} />
                {camps.length > 0 && (
                  <div className="max-h-44 w-72 max-w-full overflow-y-auto rounded-lg border">
                    {camps.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => { setChosen(c); setCamps([]); setCampQ(c.name) }}
                        className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left last:border-0 hover:bg-muted/60">
                        <span className="text-sm font-medium">{c.name}</span>
                        <span className="text-[11px] text-muted-foreground">{c.client || c.brand || "No client"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button disabled={!chosen || attaching} onClick={attach}>
                {attaching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tag to {chosen ? chosen.name : "a campaign"}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* 2. Identity */}
        <Card icon={<User className="h-4 w-4" />} title="Identity">
          <KV k="Full name" v={str(S.full_name)} always />
          <KV k="Date of birth" v={day(S.date_of_birth) || str(S.date_of_birth)} always />
          <KV k="Email" always v={has(S.email) ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <a href={`mailto:${S.email}`} className="hover:underline">{str(S.email)}</a>
              {has(S.email_verified_at) && <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700" title={`Verified ${at(S.email_verified_at)}`}>
                <BadgeCheck className="h-3.5 w-3.5" />verified</span>}
            </span>) : ""} />
          <KV k="Mobile" always v={has(S.mobile) ? <a href={`tel:${S.mobile}`} className="hover:underline">{str(S.mobile)}</a> : ""} />
          <KV k="Instagram" always v={handle ? <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className="hover:underline">@{handle}</a> : ""} />
          <KV k="Details given" v={at(S.details_at)} />
          <KV k="Inflink ID" v={str(S.inflink_influencer_id)} mono />
        </Card>

        {/* 3. Address */}
        <Card icon={<MapPin className="h-4 w-4" />} title="Address"
              aside={addressLines.length > 0 ? <CopyButton text={[...addressLines, str(S.address_phone)].filter(Boolean).join("\n")} label="Copy address" /> : undefined}>
          {addressLines.length > 0 ? (
            <address className="whitespace-pre-line break-words text-base not-italic leading-relaxed [overflow-wrap:anywhere]">{addressLines.join("\n")}</address>
          ) : <p className="text-sm text-muted-foreground">Not given</p>}
          <div className="mt-3">
            <KV k="Phone" v={has(S.address_phone) ? <a href={`tel:${S.address_phone}`} className="hover:underline">{str(S.address_phone)}</a> : ""} />
            <KV k="Pin" v={has(S.address_pin_source) ? words(S.address_pin_source) : ""} />
            <KV k="Coordinates" v={has(S.address_lat) && has(S.address_lng) ? `${S.address_lat}, ${S.address_lng}` : ""} mono />
          </div>
          {mapsUrl && (
            <Button variant="outline" size="sm" asChild className="mt-3 h-8 gap-1.5 rounded-full">
              <a href={mapsUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Open in Maps</a>
            </Button>
          )}
        </Card>
      </div>

      {/* 4. Payment */}
      <Card icon={<Landmark className="h-4 w-4" />} title="Payment" className="mt-5"
            aside={bankStatus === "confirmed" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />Payee confirmed</span>
            ) : bankStatus === "pending" && has(S.bank_last4) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                <Clock className="h-3.5 w-3.5" />Payee to confirm</span>
            ) : bankStatus === "rejected" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                <X className="h-3.5 w-3.5" />Bank details rejected</span>
            ) : undefined}>
        <div className="grid gap-x-8 lg:grid-cols-2">
          <div>
            <KV k="Fee" always v={money(L.fee_aed_cents)} />
            <KV k="Currency" v={str(L.currency)} />
            <KV k="Payment terms" v={has(L.payment_terms) ? <Val k="payment_terms" v={L.payment_terms} /> : ""} />
            <KV k="Payout method" v={words(L.payout_method)} />
            <KV k="Collect in" v={str(S.payout_collect_city)} />
            <KV k="Tax number" v={str(S.tax_number)} mono />
          </div>
          <div>
            <KV k="Account holder" always v={str(S.bank_holder)} />
            <KV k="Bank country" v={str(S.bank_country)} />
            <KV k="SWIFT" v={str(S.bank_swift)} mono />
            <KV k="IBAN" v={has(S.bank_last4) ? <span className="font-mono">•••• {str(S.bank_last4)}</span> : ""} />
            <KV k="Payee" v={bankStatus === "confirmed" ? (
              <span className="text-emerald-700">
                Confirmed{has(S.bank_confirmed_at) ? ` ${at(S.bank_confirmed_at)}` : ""}
                {autoConfirmed
                  ? <span className="block text-xs font-normal text-muted-foreground">Confirmed automatically: account is in their own signed name</span>
                  : payeeEvent?.actor_label ? <span className="block text-xs font-normal text-muted-foreground">by {payeeEvent.actor_label}</span> : null}
              </span>
            ) : bankStatus === "rejected" ? (
              <span className="text-red-700">Rejected{has(S.bank_rejected_reason) ? `: ${str(S.bank_rejected_reason)}` : ""}</span>
            ) : bankStatus ? <span className="text-amber-700">Awaiting confirmation</span> : ""} />
          </div>
        </div>

        {pay && pay.instalments?.length > 0 && (
          <div className="mt-4 rounded-xl border">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b bg-muted/30 px-4 py-2.5 text-xs">
              <span className="font-medium capitalize">{words(pay.status)}</span>
              <span className="text-muted-foreground">Paid <span className="font-medium text-foreground tabular-nums">{money(pay.paid_aed_cents)}</span></span>
              <span className="text-muted-foreground">{pay.overpaid ? "Overpaid" : "Outstanding"} <span className="font-medium text-foreground tabular-nums">{money(Math.abs(pay.outstanding_aed_cents))}</span></span>
            </div>
            {pay.instalments.map((ins: Instalment) => (
              <div key={ins.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b px-4 py-2.5 text-sm last:border-0 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_6rem]">
                <span className="min-w-0">
                  <span className="font-medium">{ins.label || `Instalment ${ins.seq}`}</span>
                  {ins.pct != null && <span className="text-muted-foreground"> · {ins.pct}%</span>}
                  {ins.paid_on && <span className="block text-xs text-muted-foreground">Paid {day(ins.paid_on)}{ins.reference ? ` · ref ${ins.reference}` : ""}{ins.marked_by_label ? ` · ${ins.marked_by_label}` : ""}</span>}
                </span>
                <span className="text-right tabular-nums sm:text-left">{money(ins.due_aed_cents)}</span>
                <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                  {ins.paid ? `paid ${money(ins.paid_aed_cents)}` : ins.now_due_aed_cents != null ? `now ${money(ins.now_due_aed_cents)}` : ""}
                </span>
                <span className="col-span-2 text-xs capitalize sm:col-span-1 sm:text-right">
                  <span className={`rounded-full px-2 py-0.5 ${ins.paid ? "bg-emerald-50 text-emerald-700" : ins.approved ? "bg-muted" : "bg-amber-50 text-amber-800"}`}>{ins.status}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {bankStatus === "pending" && has(S.bank_last4) && (
          <div className="mt-4 rounded-xl border border-dashed p-4">
            <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Ask {handle ? `@${handle}` : "the creator"} for the holder name and last 4 of the IBAN and type what they say. Nothing pays out until this matches.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Holder name, as they said it</Label>
                <Input value={holder} onChange={(e) => setHolder(e.target.value)} className="h-9 w-64 max-w-full" placeholder="Full name on the account" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last 4</Label>
                <Input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\s/g, "").slice(0, 4))} className="h-9 w-20" placeholder="0000" />
              </div>
              <Button size="sm" variant="outline" className="h-9" onClick={confirmPayee} disabled={confirming || holder.trim().length < 2 || last4.length !== 4}>
                {confirming ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4" />}
                Confirm payee
              </Button>
            </div>
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">The full IBAN is never shown and is not sent to the browser.</p>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* 5. Passport */}
        <Card icon={<IdCard className="h-4 w-4" />} title="Passport"
              aside={has(S.passport_uploaded_at) ? (
                <Button size="sm" variant="outline" onClick={async () => {
                  try { window.open(await enrolmentApi.passportUrl(id), "_blank", "noopener") }
                  catch (e) { toast.error(e instanceof Error ? e.message : "Could not open the passport") }
                }}>View passport</Button>
              ) : undefined}>
          {/* "pending" read as stuck. It means nobody has looked yet, and the verdict is
              given right here now, not on another screen. */}
          <KV k="Status" always v={has(S.passport_status) ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className={/reject/.test(pStatus) ? "text-red-700" : /pending|review/.test(pStatus) ? "text-amber-700" : "text-emerald-700"}>
                {/pending|review/.test(pStatus) ? "Not checked yet" : /reject/.test(pStatus) ? "Sent back" : "Checked"}
              </span>
              {/pending|review/.test(pStatus) && (
                <>
                  <Button size="sm" className="h-7 px-2.5 text-xs" onClick={async () => {
                    try { await enrolmentApi.passportVerdict(id, true); toast.success("Passport checked"); load() }
                    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save that") }
                  }}>Looks right</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs" onClick={async () => {
                    const note = window.prompt("What is wrong with it? They will see this.")
                    if (!note?.trim()) return
                    try { await enrolmentApi.passportVerdict(id, false, note.trim()); toast.success("Sent back. Their passport step is open again"); load() }
                    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save that") }
                  }}>Send back</Button>
                </>
              )}
            </span>
          ) : has(S.passport_uploaded_at) ? "Uploaded" : ""} />
          <KV k="File" v={str(S.passport_filename)} />
          <KV k="Uploaded" v={at(S.passport_uploaded_at)} />
          <KV k="Reason" v={str(S.passport_rejected_reason)} />
        </Card>

        {/* 6. Agreement */}
        <Card icon={<FileSignature className="h-4 w-4" />} title="Agreement"
              aside={has(S.signed_at) ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full" onClick={() =>
                    enrolmentApi.agreementPdf(id).catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))}>
                    <FileSignature className="h-3.5 w-3.5" />Agreement PDF
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full" onClick={() =>
                    enrolmentApi.recordPdf(id).catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))}>
                    <Download className="h-3.5 w-3.5" />Record pack
                  </Button>
                </div>
              ) : undefined}>
          <KV k="Signed by" always v={str(S.signature_name)} />
          <KV k="Signed" always v={at(S.signed_at)} />
          <KV k="IP address" v={str(S.sign_ip)} mono />
          <KV k="Drawn signature" v={has(S.signed_at) ? (data.has_signature ? "Yes, on the PDF" : "Typed name only") : ""} />
          <KV k="Agreed" v={[S.agreed_terms && "terms", S.agreed_electronic && "electronic signing", S.agreed_age && "age"].filter(Boolean).length
            ? <span className="inline-flex flex-wrap gap-1.5">{[["terms", S.agreed_terms], ["electronic signing", S.agreed_electronic], ["age 18+", S.agreed_age]]
                .filter(([, v]) => v).map(([l]) => <span key={String(l)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal"><Check className="h-3 w-3" />{String(l)}</span>)}</span>
            : ""} />
          <KV k="Version" v={str(L.agreement_version)} />
          <KV k="Document hash" v={str(S.agreement_sha256)} mono />
          <KV k="Stored PDF" v={has(S.agreement_pdf_url) ? <a href={str(S.agreement_pdf_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">Open<ExternalLink className="h-3 w-3" /></a> : ""} />
          <KV k="Deliverables" v={has(L.deliverables) ? <Val k="deliverables" v={L.deliverables} /> : str(L.deliverables_summary)} />
          {has(L.deliverables) && has(L.deliverables_summary) && <KV k="Summary" v={str(L.deliverables_summary)} />}
          <KV k="Usage terms" v={has(L.usage_terms) ? <Val k="usage_terms" v={L.usage_terms} /> : ""} />
          <KV k="Product sent" v={L.product_sent == null ? "" : <Val v={L.product_sent} />} />
        </Card>
      </div>

      {(inviteExtra.length > 0 || otherExtra.length > 0 || has(L.purpose)) && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {(inviteExtra.length > 0 || has(L.purpose)) && (
            <Card icon={<LinkIcon className="h-4 w-4" />} title="Link and invites">
              <KV k="Purpose" v={words(L.purpose)} />
              <KV k="First opened" v={at(L.first_opened_at)} />
              <KV k="Opens" v={has(L.open_count) ? String(L.open_count) : ""} />
              {inviteExtra.map(x => <KV key={x.k} k={human(x.k)} v={<Val k={x.k} v={x.v} />} />)}
            </Card>
          )}
          {otherExtra.length > 0 && (
            <Card icon={<Info className="h-4 w-4" />} title="Other details">
              {otherExtra.map(x => <KV key={`${x.from}-${x.k}`} k={human(x.k)} v={<Val k={x.k} v={x.v} />} />)}
            </Card>
          )}
        </div>
      )}

      {/* 7. Timeline */}
      {data.events.length > 0 && (
        <Card icon={<History className="h-4 w-4" />} title="Timeline" className="mt-5">
          <ol className="relative">
            {data.events.map((e, i) => (
              <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                {i < data.events.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-border" />}
                <span className="relative z-10 mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-foreground bg-background" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium first-letter:uppercase">{e.kind.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{[e.actor_label, at(e.at)].filter(Boolean).join(" · ")}</p>
                  {e.detail != null && typeof e.detail === "object" && Object.keys(e.detail as Rec).length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground"><Val v={e.detail} /></div>
                  )}
                  {typeof e.detail === "string" && e.detail && <p className="mt-1 break-words text-xs text-muted-foreground">{e.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
