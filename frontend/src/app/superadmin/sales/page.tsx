'use client'

/**
 * The pipeline. Business development's board, out of the spreadsheet.
 *
 * WHY DEALS AND NOT BRANDS. Her sheet has one row per brand, so Barakat — eighteen
 * campaigns with us — can only ever show one stage. A client who is live on one campaign
 * and negotiating the next had to be filed as one or the other, which is why the same brand
 * appears on three different tabs of the sheet. Here a brand is permanent and each
 * conversation about money is its own deal underneath it.
 *
 * ⚠️ THE SOURCING BUTTON IS THE POINT OF THIS SCREEN. Talent used to be told when a campaign
 * locked, which is after the client expects to see names, so every deal started its sourcing
 * already late. "Ask talent to start" sits on a deal that is still being negotiated and
 * raises a real request plus an empty roster.
 *
 * IT IS A BUTTON AND NOT AN AUTOMATIC TRIGGER. Twenty-five proposals went out last year and
 * six closed. Sourcing automatically at "proposal sent" would have had talent researching
 * nineteen deals that died. The person in the conversation is the one who knows.
 *
 * NO TARGET COUNT ANYWHERE ON THIS SCREEN. A client who signs fifteen creators may need to
 * see five hundred first, so a number typed here by somebody mid-sale would be read as a
 * target by somebody doing the sourcing. The brief says what is wanted; how many to show is
 * talent's judgement.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote, Building2, Calendar, Loader2, Plus, Search, Send, Sparkles, Users2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CARD, PageHead } from '@/components/console/primitives'
import { ReadState } from '@/components/console/surfaces'
import {
  aed, crmApi, person, STAGE_LABEL, type Board, type Deal, type Stage,
} from '@/services/crmApi'
import { cn } from '@/lib/utils'

const MODEL_LABEL: Record<string, string> = {
  paid: 'Paid', barter: 'Barter', ugc: 'UGC', cashback: 'Cashback',
}

/** Overdue is the only colour on this board, because it is the only thing to act on. */
function dueTone(iso: string | null): string {
  if (!iso) return 'text-muted-foreground'
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (d < today) return 'font-medium text-[var(--tone-bad-ink)]'
  const soon = new Date(today); soon.setDate(soon.getDate() + 2)
  return d <= soon ? 'font-medium text-[var(--tone-warn-ink)]' : 'text-muted-foreground'
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null

export default function PipelinePage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout><Pipeline /></SuperadminLayout>
    </AuthGuard>
  )
}

function Pipeline() {
  const router = useRouter()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  const [closed, setClosed] = useState(false)
  const [asking, setAsking] = useState<Deal | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setBoard(await crmApi.board(closed))
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not read the pipeline')
    } finally { setLoading(false) }
  }, [closed])

  useEffect(() => { void load() }, [load])

  const stages = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return board?.stages || []
    return (board?.stages || [])
      .map((s) => ({ ...s, deals: s.deals.filter((d) =>
        d.brand.toLowerCase().includes(n) ||
        d.title.toLowerCase().includes(n) ||
        (d.note || '').toLowerCase().includes(n)) }))
      .filter((s) => s.deals.length > 0)
  }, [board, q])

  const move = async (d: Deal, stage: Stage) => {
    try {
      await crmApi.updateDeal(d.id, { stage })
      toast.success(`${d.brand} → ${STAGE_LABEL[stage]}`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not move it')
    }
  }

  const t = board?.totals

  return (
    <div className="space-y-6">
      <PageHead
        title="Pipeline"
        sub="Every brand we are talking to, and what happens next."
        action={board?.can_edit ? (
          <Button onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New brand
          </Button>
        ) : undefined}
      />

      {/* Two numbers, and the honest third. A pipeline that averages a missing budget as
          zero reports itself smaller than it is, so the count of deals carrying no figure
          is said rather than hidden. */}
      {t && (
        <div className={cn(CARD, 'flex flex-wrap items-center gap-x-8 gap-y-3 bg-card px-5 py-4')}>
          <div>
            <p className="text-ds-overline uppercase text-muted-foreground">Live deals</p>
            <p className="mt-0.5 text-[24px] font-semibold leading-none tabular-nums">{t.open}</p>
          </div>
          <div>
            <p className="text-ds-overline uppercase text-muted-foreground">Worth</p>
            <p className="mt-0.5 text-[24px] font-semibold leading-none tabular-nums">
              {t.value_aed == null ? '—' : aed(t.value_aed)}
            </p>
          </div>
          {t.without_a_budget > 0 && (
            <p className="reading-width text-ds-caption text-muted-foreground">
              <span className="font-medium text-foreground">{t.without_a_budget}</span> of
              those carry no budget yet, so they are not in that figure.
            </p>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4
                                 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                     placeholder="Find a brand" className="h-9 w-48 pl-8" />
            </div>
            <Button variant={closed ? 'default' : 'outline'} size="sm"
                    onClick={() => setClosed((v) => !v)}>
              {closed ? 'Hiding nothing' : 'Show won and lost'}
            </Button>
          </div>
        </div>
      )}

      <ReadState
        failed={failed} loading={loading} empty={stages.length === 0}
        what="the pipeline" onRetry={load}
        nothing="Nothing in the pipeline yet."
        skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the pipeline
        </div>}
      >
        {/* Columns, scrolled sideways. A board is the shape her sheet already is, and
            vertical lists of 31 deals answer "what is in proposal" by counting. */}
        <div className="flex gap-3 overflow-x-auto pb-3">
          {stages.map((s) => (
            <section key={s.key} className="w-[280px] shrink-0 space-y-2">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-ds-label font-semibold">{s.label}</h2>
                <span className="text-ds-caption tabular-nums text-muted-foreground">
                  {s.deals.length}
                </span>
              </div>
              <div className="space-y-2">
                {s.deals.map((d) => (
                  <DealCard key={d.id} deal={d} canEdit={!!board?.can_edit}
                            onMove={(st) => move(d, st)}
                            onAsk={() => setAsking(d)}
                            onOpen={() => router.push(`/work/sales/${d.brand_id}`)} />
                ))}
                {s.deals.length === 0 && (
                  <p className="px-1 py-6 text-center text-ds-caption text-muted-foreground">
                    Nothing here
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </ReadState>

      <AskTalent deal={asking} onClose={() => setAsking(null)} onDone={load} />
      <NewBrand open={adding} onOpenChange={setAdding} onDone={load} />
    </div>
  )
}

function DealCard({ deal, canEdit, onMove, onAsk, onOpen }: {
  deal: Deal
  canEdit: boolean
  onMove: (s: Stage) => void
  onAsk: () => void
  onOpen: () => void
}) {
  const asked = !!deal.sourcing_asked_at
  return (
    <article className={cn(CARD, 'group space-y-2 bg-card p-3')}>
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <p className="truncate text-ds-label font-semibold">{deal.brand}</p>
        {deal.title && deal.title !== 'First campaign' && (
          <p className="truncate text-ds-caption text-muted-foreground">{deal.title}</p>
        )}
      </button>

      <div className="flex flex-wrap items-center gap-1.5">
        {deal.model && (
          <Badge variant="outline" className="text-ds-overline">
            {MODEL_LABEL[deal.model] || deal.model}
          </Badge>
        )}
        {deal.budget_aed != null && (
          <span className="text-ds-caption font-medium tabular-nums">
            {aed(deal.budget_aed)}
          </span>
        )}
        {/* The sourcing state, which is the thing this board exists to make visible. */}
        {asked ? (
          <Badge variant="outline"
                 className="border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]
                            text-ds-overline">
            <Users2 className="mr-1 h-3 w-3" /> Talent sourcing
          </Badge>
        ) : null}
        {deal.open_requests > 0 && (
          <Badge variant="outline" className="text-ds-overline">
            {deal.open_requests} waiting
          </Badge>
        )}
      </div>

      {deal.note && (
        <p className="line-clamp-2 text-ds-caption leading-relaxed text-muted-foreground">
          {deal.note}
        </p>
      )}

      {(deal.next_step || deal.next_step_at) && (
        <p className={cn('flex items-center gap-1.5 text-ds-caption', dueTone(deal.next_step_at))}>
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {deal.next_step || 'Next step'}
            {deal.next_step_at && ` · ${when(deal.next_step_at)}`}
          </span>
        </p>
      )}

      {canEdit && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {/* Asking is offered until it has been asked, at any stage. The whole point is
              that it can happen before the deal is won. */}
          {!asked && !deal.closed_at && (
            <Button size="sm" variant="outline" className="h-7 flex-1 px-2 text-ds-caption"
                    onClick={onAsk}>
              <Sparkles className="mr-1 h-3 w-3" /> Ask talent
            </Button>
          )}
          <Select value={deal.stage} onValueChange={(v: string) => onMove(v as Stage)}>
            <SelectTrigger className="h-7 w-auto gap-1 px-2 text-ds-caption">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STAGE_LABEL) as Stage[]).map((s) => (
                <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </article>
  )
}

/* ── The button that closes the lapse ─────────────────────────────────────────────────── */

function AskTalent({ deal, onClose, onDone }: {
  deal: Deal | null
  onClose: () => void
  onDone: () => void
}) {
  const [brief, setBrief] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (deal) { setBrief(''); setDue('') } }, [deal?.id])

  const go = async () => {
    if (!deal || !brief.trim()) return
    setBusy(true)
    try {
      await crmApi.askTalent(deal.id, brief.trim(), undefined, due || undefined)
      toast.success('Talent have it, and a roster is open for them')
      onClose(); onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send it')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={!!deal} onOpenChange={(o: boolean) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ask talent to start on {deal?.brand}</DialogTitle>
          <DialogDescription>
            They get this on their day, with an empty roster ready to fill. You do not have
            to wait for the deal to close.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="brief">What are you looking for?</Label>
            <Textarea id="brief" autoFocus rows={4} value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="Skincare and derm creators, UAE, 50k to 300k, must be able to film in studio" />
            {/* Said here because it is the thing he corrected me on, and the instinct
                behind it should survive into the product. */}
            <p className="text-ds-caption text-muted-foreground">
              Say what, not how many. A client who signs fifteen may need to see hundreds
              first, so how many to source is talent&apos;s call.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due">Needed by</Label>
            <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={go} disabled={busy || !brief.trim()}>
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  : <Send className="mr-1.5 h-3.5 w-3.5" />}
            Send it to talent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewBrand({ open, onOpenChange, onDone }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [industry, setIndustry] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (open) { setName(''); setContact(''); setIndustry('') } }, [open])

  const go = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      const b = await crmApi.createBrand({
        name: name.trim(), contact_name: contact.trim() || null,
        industry: industry.trim() || null })
      // A brand with no deal is a note. The first deal is created with it so the board is
      // never showing a brand that cannot move.
      await crmApi.createDeal({ brand_id: b.id, title: 'First campaign', stage: 'new' })
      toast.success(`${b.name} added`)
      onOpenChange(false); onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add it')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>A brand we are talking to</DialogTitle>
          <DialogDescription>
            Not a client yet. It becomes one when a deal is won.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bn">Brand</Label>
            <Input id="bn" autoFocus value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="Samsung" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bc">Who you are speaking to</Label>
            <Input id="bc" value={contact} onChange={(e) => setContact(e.target.value)}
                   placeholder="Ekin, marketing manager" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bi">Category</Label>
            <Input id="bi" value={industry} onChange={(e) => setIndustry(e.target.value)}
                   placeholder="Technology" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={go} disabled={busy || !name.trim()}>
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  : <Building2 className="mr-1.5 h-3.5 w-3.5" />}
            Add the brand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
