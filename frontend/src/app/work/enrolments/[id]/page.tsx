"use client"

/**
 * One enrolment: what the creator gave us, and the trail of how.
 *
 * The screen exists mainly for one action. A creator's bank details arrive DISABLED and
 * nothing pays out until a person has re-keyed the holder name and the last four digits
 * against what the creator told them on a call or in the DM thread. That check is the only
 * thing standing between us and paying the wrong account, so it is the first card on the
 * page and it is typed, not ticked. A "yes I checked" button checks nothing.
 *
 * The full IBAN is not here, and there is no view that shows it. The API does not return it
 * to any browser. The last four is what a person needs to reconcile a payment; the whole
 * number is only ever needed by the payout file itself.
 */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Loader2, ArrowLeft, Download, FileSignature, ShieldCheck, Copy, Check,
  CircleAlert, Mail, MapPin, Landmark, User, Clock, Link2 as LinkIcon,
} from "lucide-react"
import { toast } from "sonner"
import { enrolmentApi, type EnrolmentDetail } from "@/services/enrolmentApi"

const money = (c?: number | null) =>
  c == null ? "—" : `AED ${(Number(c) / 100).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`

const at = (iso?: unknown) => {
  if (!iso || typeof iso !== "string") return "—"
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

const s = (v: unknown) => (v == null || v === "" ? "—" : String(v))

type AttachableCampaign = {
  id: string; name: string; brand?: string | null; client?: string | null
}

export default function DetailWrapper() {
  return <AuthGuard><SuperAdminInterface><Detail /></SuperAdminInterface></AuthGuard>
}

function Detail() {
  const params = useParams()
  const id = String(params?.id || "")
  const [data, setData] = useState<EnrolmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [holder, setHolder] = useState("")
  const [last4, setLast4] = useState("")
  const [confirming, setConfirming] = useState(false)

  /* Tagging a direct link onto a campaign after the fact. */
  const [campQ, setCampQ] = useState("")
  const [camps, setCamps] = useState<AttachableCampaign[]>([])
  const [chosen, setChosen] = useState<AttachableCampaign | null>(null)
  const [attaching, setAttaching] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
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

  const L = data.link as Record<string, unknown>
  const S = data.submission as Record<string, unknown>
  const bankStatus = String(S.bank_status || "")
  const needsPayee = !!S.bank_iban_present || (!!S.bank_last4 && bankStatus === "pending")

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

  const Card = ({ icon, title, children, tone }: {
    icon: React.ReactNode; title: string; children: React.ReactNode; tone?: string
  }) => (
    <section className={`rounded-2xl border p-5 ${tone || ""}`}>
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">{icon}{title}</div>
      {children}
    </section>
  )

  const KV = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-right text-sm font-medium">{v}</span>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/work/enrolments"><ArrowLeft className="mr-1.5 h-4 w-4" /> All enrolments</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{s(L.creator_handle)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {s(L.campaign_display_name)} for {s(L.brand_display_name)} · {s(L.deliverables_summary)} · {money(L.fee_aed_cents as number)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={String(L.status) === "completed" ? "default" : "secondary"}>
            {String(L.status).replace("_", " ")}
          </Badge>
          {String(L.status) === "live" && (
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(data.url); setCopied(true)
              toast.success("Copied"); setTimeout(() => setCopied(false), 1800)
            }}>
              {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Copy className="mr-1.5 h-4 w-4" />}
              Copy link
            </Button>
          )}
          {S.signed_at != null && (
            <>
              <Button variant="outline" size="sm" onClick={() =>
                enrolmentApi.agreementPdf(id).catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))}>
                <FileSignature className="mr-1.5 h-4 w-4" /> Agreement
              </Button>
              <Button variant="outline" size="sm" onClick={() =>
                enrolmentApi.recordPdf(id).catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))}>
                <Download className="mr-1.5 h-4 w-4" /> Record pack
              </Button>
            </>
          )}
        </div>
      </div>

      {/* A link raised with no booking behind it. Said here because its payments sit outside
          every campaign money screen until somebody tags it, which is easy to not notice. */}
      {L.campaign_id == null && (
        <div className="mt-6 rounded-2xl border p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            {String(L.purpose || "") === "direct"
              ? "Raised directly, on no campaign"
              : "Not on a campaign yet"}
          </div>
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
            {String(L.purpose || "") === "direct"
              ? "Nothing is wrong with that, but what we owe this creator will not appear on any campaign's money screen until it is tagged. Tagging moves their payments with it."
              : "The campaign for this proposal has not been opened yet. It will be tagged on its own the moment somebody opens it."}
          </p>
          {String(L.purpose || "") === "direct" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="attach-camp">Campaign</Label>
                <div className="flex gap-2">
                  <Input id="attach-camp" value={campQ} className="w-72"
                    placeholder="Search by campaign, brand or client"
                    onChange={(e) => { setCampQ(e.target.value); void searchCampaigns(e.target.value) }} />
                </div>
                {camps.length > 0 && (
                  <div className="max-h-44 w-72 overflow-y-auto rounded-lg border">
                    {camps.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => { setChosen(c); setCamps([]); setCampQ(c.name) }}
                        className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left last:border-0 hover:bg-muted/60">
                        <span className="text-sm font-medium">{c.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {c.client || c.brand || "No client"}
                        </span>
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

      {/* The payee check, first because it is the thing blocking money. */}
      {bankStatus === "pending" && S.bank_last4 != null && (
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-amber-600" /> Confirm the payee before anything pays out
          </div>
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
            Call or message {s(L.creator_handle)} and ask them for the account holder name and the last four
            digits of their IBAN. Type what they tell you below. Do not copy it off this screen: reading it
            back to yourself proves nothing, and this check is the only thing standing between us and paying
            the wrong account.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Holder name, as they said it</Label>
              <Input value={holder} onChange={(e) => setHolder(e.target.value)} className="w-72" placeholder="Full name on the account" />
            </div>
            <div className="space-y-1.5">
              <Label>Last 4 of the IBAN</Label>
              <Input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\s/g, "").slice(0, 4))} className="w-28" placeholder="0000" />
            </div>
            <Button onClick={confirmPayee} disabled={confirming || holder.trim().length < 2 || last4.length !== 4}>
              {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Confirm payee
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card icon={<User className="h-4 w-4" />} title="Who they are">
          <KV k="Full name" v={s(S.full_name)} />
          <KV k="Instagram" v={s(S.instagram_handle || L.creator_handle)} />
          <KV k="Email" v={s(S.email)} />
          <KV k="Email confirmed" v={at(S.email_verified_at)} />
          <KV k="Mobile" v={s(S.mobile)} />
          <KV k="Date of birth" v={s(S.date_of_birth)} />
        </Card>

        <Card icon={<FileSignature className="h-4 w-4" />} title="What they signed">
          <KV k="Signed" v={at(S.signed_at)} />
          <KV k="Signed by" v={s(S.signature_name)} />
          <KV k="Drawn signature" v={data.has_signature ? "Yes, on the PDF" : "Typed name only"} />
          <KV k="Agreement version" v={s(L.agreement_version)} />
          <KV k="IP address" v={s(S.sign_ip)} />
          <KV k="Document hash" v={<span className="font-mono text-[11px]">{String(S.agreement_sha256 || "—").slice(0, 24)}…</span>} />
        </Card>

        <Card icon={<Landmark className="h-4 w-4" />} title="Where money lands">
          <KV k="Holder" v={s(S.bank_holder)} />
          <KV k="IBAN" v={S.bank_last4 ? `ending ${S.bank_last4}` : "—"} />
          <KV k="Country" v={s(S.bank_country)} />
          <KV k="SWIFT" v={s(S.bank_swift)} />
          <KV k="Status" v={
            <span className={bankStatus === "confirmed" ? "text-emerald-600" : "text-amber-600"}>
              {bankStatus === "confirmed" ? "Confirmed by a person" : bankStatus === "pending" ? "Awaiting confirmation" : s(bankStatus)}
            </span>} />
          <KV k="Confirmed" v={at(S.bank_confirmed_at)} />
          <p className="mt-3 text-[11px] text-muted-foreground">
            The full IBAN is never shown on a screen and is not returned to the browser at all.
          </p>
        </Card>

        <Card icon={<MapPin className="h-4 w-4" />} title="Where product goes">
          <KV k="Address" v={s(S.address_line)} />
          <KV k="City" v={s(S.address_city)} />
          <KV k="Country" v={s(S.address_country)} />
          <KV k="Phone" v={s(S.address_phone)} />
        </Card>
      </div>

      <section className="mt-6 rounded-2xl border p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-4 w-4" /> What happened, in order
        </div>
        <ol className="space-y-0">
          {data.events.map((e, i) => (
            <li key={i} className="flex items-start justify-between gap-4 border-b py-2.5 text-sm last:border-0">
              <span className="capitalize">{e.kind.replace(/_/g, " ")}</span>
              <span className="shrink-0 text-right text-xs text-muted-foreground">
                {e.actor_label ? `${e.actor_label} · ` : ""}{at(e.at)}
              </span>
            </li>
          ))}
          {!data.events.length && <li className="py-3 text-sm text-muted-foreground">Nothing yet.</li>}
        </ol>
      </section>
    </div>
  )
}
