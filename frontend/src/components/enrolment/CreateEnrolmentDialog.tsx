"use client"

/**
 * The enrolment link popup.
 *
 * Opened from wherever a confirmed creator is standing, prefilled from the proposal, and
 * closed the moment the link exists. It is a dialog rather than a page in the sidebar
 * because it is always about one creator you are already looking at, and sending somebody
 * to a separate screen to do it loses the row they came from.
 *
 * WHAT IS PREFILLED AND WHY IT IS STILL EDITABLE. Everything comes from the proposal:
 * brand, campaign, deliverables, fee, deadline. All of it can be overridden here, because
 * the number the creator is offered is the negotiated cost and that is a conversation the
 * talent team has, not something the proposal always knows. What is typed here is frozen
 * onto the link, so an edit to the proposal afterwards cannot move a signed deal.
 *
 * THE TWO STEPS THAT CANNOT BE SWITCHED OFF. Identity and signature are locked on. An
 * agreement signed by somebody we cannot name is not an agreement, so the toggles for those
 * are disabled here and the server forces them on regardless of what this sends.
 *
 * WHO SEES WHAT HAPPENS ON SAVE. Leadership creates a live link. Anybody else creates a
 * request, and the dialog says so before they press the button rather than after.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Loader2, Copy, Check, ShieldCheck, Lock, AlertTriangle, Send,
} from "lucide-react"
import { toast } from "sonner"
import { enrolmentApi, type Prefill } from "@/services/enrolmentApi"

type StepKey = "email" | "sign" | "bank" | "addr"

const STEP_LABEL: Record<StepKey, { title: string; note: string }> = {
  email: { title: "Their details", note: "Name, email, mobile. Confirmed by a code." },
  sign: { title: "Sign the agreement", note: "Signature, date of birth, the terms." },
  bank: { title: "Where money lands", note: "IBAN and holder. A person confirms it after." },
  addr: { title: "Where product goes", note: "Delivery address. Turn off if nothing ships." },
}

export function CreateEnrolmentDialog({
  proposalInfluencerId, open, onOpenChange, onCreated,
}: {
  proposalInfluencerId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: () => void
}) {
  const [pre, setPre] = useState<Prefill | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; status: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // The form
  const [brand, setBrand] = useState("")
  const [campaign, setCampaign] = useState("")
  const [deliverables, setDeliverables] = useState("")
  const [feeAed, setFeeAed] = useState("")
  const [submitBy, setSubmitBy] = useState("")
  const [usage, setUsage] = useState("")
  const [talent, setTalent] = useState<string>("")
  const [agreement, setAgreement] = useState("")
  const [steps, setSteps] = useState<Record<StepKey, boolean>>({ email: true, sign: true, bank: true, addr: true })
  const [split, setSplit] = useState(35)

  const reset = useCallback(() => {
    setPre(null); setError(null); setResult(null); setCopied(false)
    setBrand(""); setCampaign(""); setDeliverables(""); setFeeAed(""); setSubmitBy("")
    setUsage(""); setTalent(""); setAgreement(""); setSplit(35)
    setSteps({ email: true, sign: true, bank: true, addr: true })
  }, [])

  useEffect(() => {
    if (!open || !proposalInfluencerId) { reset(); return }
    let cancelled = false
    setLoading(true); setError(null)
    enrolmentApi.prefill(proposalInfluencerId)
      .then((p) => {
        if (cancelled) return
        setPre(p)
        setBrand(p.brand_display_name || "")
        setCampaign(p.campaign_display_name || "")
        setDeliverables(p.deliverables_summary || "")
        setFeeAed(p.fee_aed_cents != null ? String(Math.round(p.fee_aed_cents / 100)) : "")
        setSubmitBy((p.submit_by || "").slice(0, 10))
        setUsage(p.usage_terms || "")
        setAgreement(p.agreement_body || "")
        const cfg = p.field_config || {}
        setSteps({
          email: true, sign: true,
          bank: cfg.bank?.on ?? true,
          addr: cfg.addr?.on ?? true,
        })
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load this creator.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, proposalInfluencerId, reset])

  const feeCents = useMemo(() => {
    const n = Number(String(feeAed).replace(/[^0-9.]/g, ""))
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null
  }, [feeAed])

  const terms = useMemo(() => {
    if (!feeCents) return []
    const first = Math.round((feeCents * split) / 100)
    return [
      { pct: split, label: "on signing", amount_aed_cents: first },
      { pct: 100 - split, label: "on posting", amount_aed_cents: feeCents - first },
    ]
  }, [feeCents, split])

  const createsLive = pre?.creates_live ?? false
  const blocked = pre?.existing_link && ["pending_approval", "live", "completed"].includes(pre.existing_link.status)

  const submit = async () => {
    if (!proposalInfluencerId) return
    setSaving(true); setError(null)
    try {
      const res = await enrolmentApi.create({
        proposal_influencer_id: proposalInfluencerId,
        assigned_talent_id: talent || null,
        brand_display_name: brand.trim() || null,
        campaign_display_name: campaign.trim() || null,
        deliverables_summary: deliverables.trim() || null,
        fee_aed_cents: feeCents,
        submit_by: submitBy || null,
        usage_terms: usage.trim() || null,
        payment_terms: terms,
        product_sent: steps.addr,
        agreement_body: agreement.trim() || null,
        field_config: {
          email: { on: true, required: true, locked: true },
          sign: { on: true, required: true, locked: true },
          bank: { on: steps.bank, required: steps.bank },
          addr: { on: steps.addr, required: false },
        },
      })
      setResult({ url: res.url, status: res.status })
      onCreated?.()
      toast.success(res.status === "live" ? "Link is live" : "Sent for approval")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "That did not save."
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ---- the after state --------------------------------------------------------------
  if (result) {
    const live = result.status === "live"
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {live ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <Send className="h-5 w-5 text-amber-600" />}
              {live ? "The link is live" : "Sent for approval"}
            </DialogTitle>
            <DialogDescription>
              {live
                ? "Paste this into the DM thread you already have with them. It expires 48 hours after they first open it, not 48 hours from now, so it is safe to send on a Friday."
                : "A superadmin or the co-founder has to approve it before it works. They have been emailed. Nobody can open it in the meantime."}
            </DialogDescription>
          </DialogHeader>

          {live && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <code className="flex-1 truncate text-xs">{result.url}</code>
              <Button
                size="sm" variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(result.url)
                  setCopied(true); toast.success("Copied")
                  setTimeout(() => setCopied(false), 1800)
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ---- the form ---------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enrolment link</DialogTitle>
          <DialogDescription>
            {pre?.creator_handle
              ? <>Everything {pre.creator_handle} needs to sign, in one link: the agreement, their details, where they get paid and where product goes.</>
              : "The paperwork after a brand confirms a creator, as one link."}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading the proposal…
          </div>
        )}

        {!loading && error && !pre && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {!loading && pre && (
          <div className="space-y-6">
            {blocked && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <span>
                  This creator already has a link that is <strong>{pre.existing_link!.status.replace("_", " ")}</strong>.
                  Retract it before making another, or you will be sending them two different deals.
                </span>
              </div>
            )}

            {/* who */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              {pre.creator_avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={pre.creator_avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                : <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-sm font-semibold">
                    {(pre.creator_handle || "?").replace(/^@/, "").slice(0, 2).toUpperCase()}
                  </div>}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{pre.creator_name || pre.creator_handle}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {pre.creator_handle}
                  {pre.followers ? ` · ${Intl.NumberFormat("en", { notation: "compact" }).format(pre.followers)} followers` : ""}
                </div>
              </div>
              <Badge variant="secondary">Confirmed</Badge>
            </div>

            {/* the deal */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Who the creator sees" />
              </div>
              <div className="space-y-1.5">
                <Label>Campaign</Label>
                <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Deliverables</Label>
                <Input value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="1 Reel, 3 Stories" />
              </div>
              <div className="space-y-1.5">
                <Label>Their fee (AED)</Label>
                <Input value={feeAed} onChange={(e) => setFeeAed(e.target.value)} inputMode="decimal" placeholder="4500" />
                <p className="text-[11px] text-muted-foreground">
                  What we pay them, not what we charge the brand.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Submit by</Label>
                <Input type="date" value={submitBy} onChange={(e) => setSubmitBy(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Usage</Label>
                <Input value={usage} onChange={(e) => setUsage(e.target.value)} placeholder="United Arab Emirates, 6 months" />
              </div>
            </div>

            {/* payment split */}
            {feeCents != null && (
              <div className="space-y-2 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <Label>Payment split</Label>
                  <span className="text-xs text-muted-foreground">{split}% on signing, {100 - split}% on posting</span>
                </div>
                <input
                  type="range" min={0} max={100} step={5} value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  className="w-full accent-foreground"
                />
                <div className="flex gap-4 text-sm">
                  {terms.map((t) => (
                    <div key={t.label} className="flex-1 rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.label}</div>
                      <div className="font-semibold">AED {((t.amount_aed_cents ?? 0) / 100).toLocaleString("en-AE")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* steps */}
            <div className="space-y-2">
              <Label>What this link asks for</Label>
              <div className="divide-y rounded-xl border">
                {(["email", "sign", "bank", "addr"] as StepKey[]).map((k) => {
                  const locked = k === "email" || k === "sign"
                  return (
                    <div key={k} className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          {STEP_LABEL[k].title}
                          {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{STEP_LABEL[k].note}</div>
                      </div>
                      <Switch
                        checked={locked ? true : steps[k]}
                        disabled={locked}
                        onCheckedChange={(v: boolean) => setSteps((p) => ({ ...p, [k]: v }))}
                      />
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Their details and the signature are always on. An agreement signed by somebody we cannot name is not an agreement.
              </p>
            </div>

            {/* owner */}
            <div className="space-y-1.5">
              <Label>Whose link is this</Label>
              <Select value={talent} onValueChange={setTalent}>
                <SelectTrigger><SelectValue placeholder="The talent person who sends and chases it" /></SelectTrigger>
                <SelectContent>
                  {(pre.talent_options || []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name || t.email}
                      {t.staff_role ? ` · ${t.staff_role.replace("_", " ")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* agreement */}
            <details className="rounded-xl border p-3">
              <summary className="cursor-pointer text-sm font-medium">The agreement text</summary>
              <Textarea
                className="mt-3 min-h-[220px] font-mono text-xs"
                value={agreement}
                onChange={(e) => setAgreement(e.target.value)}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                This is frozen onto the link and reproduced on the signed PDF. Editing it later does not change an agreement already signed.
              </p>
            </details>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                <span>{error}</span>
              </div>
            )}

            <div className={`rounded-lg border p-3 text-sm ${createsLive ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
              {createsLive
                ? "You can approve your own links, so this one goes live the moment you save it."
                : "This goes to a superadmin for approval before it works. You will be emailed the link once it is approved."}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || loading || !pre || !!blocked}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {createsLive ? "Create the link" : "Send for approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
