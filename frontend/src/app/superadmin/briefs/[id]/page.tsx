'use client'

/**
 * One brand brief: the link to send, what the brand wrote (and the assistant's write-up of
 * it), the document they attached, and the one founder action, turning it into the brand's
 * sourcing round.
 */
import { Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, Copy, ExternalLink, FileText, Loader2, MessageSquare, Radar, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CARD } from '@/components/console/primitives'
import { brandBriefs, type AdminBrief, type BrandAccount } from '@/services/brandBriefApi'
import {
  FORMATS, KPIS, OBJECTIVES, PLATFORM_LABEL, TIERS, USAGE, aed, type BriefAnswers,
} from '@/lib/brandBrief'
import { STATUS, BrandLogo, ago } from '../shared'
import { cn } from '@/lib/utils'

export default function BriefPage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout><Suspense fallback={null}><Brief /></Suspense></SuperadminLayout>
    </AuthGuard>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button variant="outline" onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600) }}>
      {done ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}{done ? 'Copied' : label}
    </Button>
  )
}

function Brief() {
  const { id } = useParams<{ id: string }>()
  const isNew = useSearchParams().get('new') === '1'
  const [b, setB] = useState<AdminBrief | null>(null)
  const [failed, setFailed] = useState(false)
  const [sourcing, setSourcing] = useState(false)
  const [tagging, setTagging] = useState(false)

  const load = useCallback(() => brandBriefs.get(id).then(setB).catch(() => setFailed(true)), [id])
  useEffect(() => { load() }, [load])

  if (failed) return <p className="py-16 text-center text-sm text-muted-foreground">Could not load this brief.</p>
  if (!b) return <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading</div>

  const first = b.answers.contact?.name?.split(' ')[0]
  const message =
    `Hi${first ? ` ${first}` : ''}, here is your campaign brief for ${b.brand_name}: ${b.url}\n\n` +
    `It takes about six minutes. If you already have a brief, attach it at the start and the assistant fills in what it can, then asks only for what is missing. It saves as you go.`
  const sent = b.status === 'submitted' || b.status === 'sourcing'

  return (
    <div className="space-y-ds-6">
      <Link href="/work/briefs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Brand briefs
      </Link>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo name={b.brand_name} url={b.brand_logo_url} size={56} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{b.answers.campaign?.name || b.brand_name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {b.brand_name}
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS[b.status].tone)}>{STATUS[b.status].label}</span>
              <span>updated {ago(b.updated_at)}</span>
              {!b.team_id && (
                <button type="button" onClick={() => setTagging(true)} className="text-xs font-medium text-[var(--tone-warn-ink)] underline underline-offset-2">
                  Not tagged to a brand account
                </button>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={b.url} label="Copy link" />
          <CopyButton text={message} label="Copy message" />
          <Button variant="ghost" asChild><a href={b.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" />Open</a></Button>
        </div>
      </div>

      {isNew && !sent && (
        <div className={cn(CARD, 'bg-card p-5')}>
          <p className="font-semibold">The link is ready</p>
          <p className="mt-1 text-sm text-muted-foreground">Send it however you talk to them. Nothing is emailed from here.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={b.url} className="font-mono text-xs" onFocus={e => e.target.select()} />
            <CopyButton text={b.url} label="Copy link" />
          </div>
        </div>
      )}

      <div className="grid gap-ds-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-ds-5">
          {b.composed ? (
            <div className={cn(CARD, 'space-y-7 bg-card p-6 sm:p-8')}>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Written up by the assistant</p>
                <h2 className="text-xl font-semibold">{b.composed.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{b.composed.summary}</p>
              </div>
              {b.composed.sections.map(s => (
                <section key={s.title} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</h3>
                  <ul className="space-y-1.5">
                    {s.points.map((p, i) => <li key={i} className="flex gap-2.5 text-sm leading-relaxed"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--console-lime)]" />{p}</li>)}
                  </ul>
                </section>
              ))}
              {b.composed.open_questions.length > 0 && (
                <section className="space-y-2 rounded-xl bg-muted/50 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open questions</h3>
                  <ul className="space-y-1.5">{b.composed.open_questions.map((q, i) => <li key={i} className="text-sm">{q}</li>)}</ul>
                </section>
              )}
            </div>
          ) : (
            <div className={cn(CARD, 'bg-card p-6 text-sm text-muted-foreground')}>
              {sent ? 'Sent without a write-up. Their answers are below.' : 'Not written up yet. It is written when the brand reaches the review.'}
            </div>
          )}
          <Answers a={b.answers} />
        </div>

        <aside className="space-y-ds-5">
          <SourcingCard b={b} onTag={() => setTagging(true)} onStart={() => setSourcing(true)} />

          {b.gaps.length > 0 && (
            <div className={cn(CARD, 'bg-card p-5')}>
              <p className="text-sm font-semibold">Not said yet</p>
              <ul className="mt-2 space-y-1">{b.gaps.map(g => <li key={g.key} className="text-sm text-muted-foreground">{g.label}</li>)}</ul>
            </div>
          )}

          {b.doc_name && (
            <div className={cn(CARD, 'bg-card p-5')}>
              <p className="text-sm font-semibold">Their document</p>
              {b.doc_url ? (
                <a href={b.doc_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-sm underline underline-offset-2">
                  <FileText className="h-4 w-4" />{b.doc_name}
                </a>
              ) : <p className="mt-2 flex items-center gap-2 text-sm"><FileText className="h-4 w-4" />{b.doc_name}</p>}
              {(b.doc_found || []).length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{b.doc_found!.map((f, i) => <li key={i}>{f}</li>)}</ul>
              )}
            </div>
          )}

          <div className={cn(CARD, 'space-y-2 bg-card p-5 text-sm')}>
            <p className="font-semibold">Trail</p>
            <p className="text-muted-foreground">Made {ago(b.created_at)}{b.created_by_email ? ` by ${b.created_by_email}` : ''}</p>
            {b.opened_at && <p className="text-muted-foreground">Opened {ago(b.opened_at)}</p>}
            {b.submitted_at && <p className="text-muted-foreground">Sent to us {ago(b.submitted_at)}</p>}
            {b.request_id && (
              <Link href="/work/requests" className="inline-flex items-center gap-1.5 font-medium underline underline-offset-2">
                <MessageSquare className="h-3.5 w-3.5" />On Requests
              </Link>
            )}
            {b.status !== 'withdrawn' && b.status !== 'sourcing' && (
              <button type="button" className="block pt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      onClick={() => brandBriefs.update(b.id, { status: 'withdrawn' }).then(setB).then(() => toast.success('Link withdrawn'))}>
                Withdraw the link
              </button>
            )}
            {b.status === 'submitted' && (
              <button type="button" className="block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      onClick={() => brandBriefs.update(b.id, { status: 'reopen' }).then(setB).then(() => toast.success('The brand can edit it again'))}>
                Let the brand edit it again
              </button>
            )}
          </div>
        </aside>
      </div>

      <TagDialog open={tagging} onOpenChange={setTagging} onPick={async t => { setB(await brandBriefs.update(b.id, { team_id: t.id })); setTagging(false) }} />
      <SourcingDialog open={sourcing} onOpenChange={setSourcing} b={b} onDone={() => { setSourcing(false); load() }} />
    </div>
  )
}

function SourcingCard({ b, onTag, onStart }: { b: AdminBrief; onTag: () => void; onStart: () => void }) {
  if (b.status === 'sourcing' && b.area_id) {
    return (
      <div className={cn(CARD, 'bg-card p-5')}>
        <p className="flex items-center gap-2 text-sm font-semibold"><Radar className="h-4 w-4" />Sourcing</p>
        <p className="mt-1 text-sm text-muted-foreground">{b.area_name}{b.area_round && b.area_round > 1 ? `, round ${b.area_round}` : ''}</p>
        <Button className="mt-3 w-full" variant="outline" asChild>
          <Link href={`/work/areas/${b.area_id}`}>Open the round<ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </div>
    )
  }
  return (
    <div className={cn(CARD, 'bg-card p-5')}>
      <p className="flex items-center gap-2 text-sm font-semibold"><Radar className="h-4 w-4" />Sourcing round</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {!b.team_id ? 'Tag the brand account first, so the round belongs to them.'
          : b.brand_area ? `Goes onto ${b.brand_area.name}${b.brand_area.locked ? ' as the next round' : ''}, with this as its brief.`
          : 'Opens the brand’s sourcing area with this brief and sends the talent team to work.'}
      </p>
      {!b.team_id ? (
        <Button className="mt-3 w-full" variant="outline" onClick={onTag}>Tag a brand account</Button>
      ) : b.can_source ? (
        <Button className="mt-3 w-full" onClick={onStart} disabled={b.status === 'withdrawn'}>Start sourcing round</Button>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">A founder starts the round.</p>
      )}
    </div>
  )
}

function SourcingDialog({ open, onOpenChange, b, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; b: AdminBrief; onDone: () => void
}) {
  const [due, setDue] = useState(b.answers.timeline?.proposal_by || '')
  const [busy, setBusy] = useState(false)
  const ab = (b.area_brief || {}) as Record<string, any>
  const go = async () => {
    setBusy(true)
    try {
      const r = await brandBriefs.toSourcing(b.id, due || null)
      toast.success(r.opened === 'new' ? `Sourcing opened: ${r.area_name}` : r.opened === 'next_round' ? `Next round opened on ${r.area_name}` : `Brief updated on ${r.area_name}`)
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start the round')
    } finally { setBusy(false) }
  }
  const rows: [string, string][] = [
    ['Creators', [ab.categories?.join(', '), ab.market, ab.followers_min ? `${Math.round(ab.followers_min / 1000)}k+` : ''].filter(Boolean).join(' · ')],
    ['Offer', ab.comp_mode === 'barter' ? 'Barter' : ab.comp_mode === 'both' ? 'Paid and barter' : ab.comp_mode ? 'Paid' : ''],
    ['Budget', ab.client_budget ? aed(ab.client_budget) + (ab.client_budget_kind === 'monthly' ? ' a month' : '') : ''],
    ['Deliverables', (ab.deliverable_specs || []).map((d: any) => `${d.quantity} ${PLATFORM_LABEL[d.platform as keyof typeof PLATFORM_LABEL]} ${d.format}`).join(', ')],
    ['Live', [ab.live_from, ab.live_to].filter(Boolean).join(' to ')],
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start the sourcing round</DialogTitle>
          <DialogDescription>
            {b.brand_area ? `${b.brand_area.name} gets this brief${b.brand_area.locked ? ' and opens its next round' : ''}. Its current brief is kept.` : `Opens ${b.brand_name}'s sourcing area and tells the talent team.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <dl className="divide-y rounded-xl border text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-4 px-4 py-2.5"><dt className="w-24 shrink-0 text-muted-foreground">{k}</dt><dd className={cn(!v && 'text-muted-foreground')}>{v || 'Not said'}</dd></div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">Everything else the brand wrote travels in the round&apos;s notes, with a link back to this brief.</p>
          <div className="space-y-1.5">
            <Label>Wanted back by</Label>
            <Input type="date" value={due} onChange={e => setDue(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={go} disabled={busy}>{busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Start sourcing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TagDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (t: BrandAccount) => void }) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<BrandAccount[]>([])
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => brandBriefs.brands(q).then(setRows).catch(() => setRows([])), 200)
    return () => clearTimeout(t)
  }, [q, open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Tag a brand account</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Search brand accounts" />
        </div>
        <div className="max-h-72 overflow-y-auto rounded-xl border">
          {rows.map(t => (
            <button key={t.id} type="button" onClick={() => onPick(t)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted">
              <BrandLogo name={t.name} url={t.logo_url} size={28} />{t.name}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* Their answers, as they gave them, for when the write-up is missing or you want the source. */
function Answers({ a }: { a: BriefAnswers }) {
  const label = (list: { key: string; label: string }[], keys?: string[]) =>
    (keys || []).map(k => list.find(x => x.key === k)?.label || k).join(', ')
  const rows: [string, ReactNode][] = [
    ['Contact', [a.contact?.name, a.contact?.role, a.contact?.email, a.contact?.phone].filter(Boolean).join(' · ')],
    ['Promoting', a.campaign?.product],
    ['Goal', label(OBJECTIVES, a.campaign?.objectives)],
    ['Background', a.campaign?.background],
    ['Audience', [a.audience?.markets?.join(', '), a.audience?.cities, a.audience?.age_ranges?.join(', '), a.audience?.genders?.join(', '), a.audience?.languages?.join(', '), a.audience?.notes].filter(Boolean).join(' · ')],
    ['Creators', [label(TIERS, a.creators?.tiers), a.creators?.categories?.join(', '), a.creators?.count ? `${a.creators.count} creators` : '', a.creators?.creator_gender].filter(Boolean).join(' · ')],
    ['Liked / avoid', [a.creators?.liked_handles?.join(' '), a.creators?.avoid_handles?.length ? `avoid ${a.creators.avoid_handles.join(' ')}` : '', a.creators?.avoid_brands?.length ? `competitors ${a.creators.avoid_brands.join(', ')}` : '', a.creators?.exclusivity_days ? `${a.creators.exclusivity_days} days exclusive` : ''].filter(Boolean).join(' · ')],
    ['Platforms', (a.platforms || ['instagram']).map(p => PLATFORM_LABEL[p]).join(', ')],
    ['Per creator', (a.deliverables || []).map(d => `${d.quantity} ${PLATFORM_LABEL[d.platform]} ${FORMATS[d.platform]?.find(f => f.key === d.format)?.label || d.format}`).join(', ')],
    ['Tagging', [a.tagging?.accounts?.join(' '), a.tagging?.hashtags?.join(' '), a.tagging?.collab_post ? 'collab post' : '', a.tagging?.link_sticker ? 'link sticker' : '', a.tagging?.promo_code, a.tagging?.link].filter(Boolean).join(' · ')],
    ['Visit', a.visit?.needed === false ? 'No visit' : a.visit?.needed ? [((a.visit.locations || []).map(l => [l.name, l.address].filter(Boolean).join(', ')).filter(Boolean).join(' | ')), a.visit.when, a.visit.booking, a.visit.guests ? `+${a.visit.guests} guests` : '', a.visit.details].filter(Boolean).join(' · ') : ''],
    ['Reward', [a.compensation?.mode, a.compensation?.budget_aed ? aed(a.compensation.budget_aed) + (a.compensation.budget_kind === 'monthly' ? ' a month' : '') : '', (a.compensation?.barter_items || []).filter(i => i.name).map(i => `${i.name}${i.value_aed ? ` (${aed(i.value_aed)})` : ''}`).join(', '), a.compensation?.fulfilment_mode, a.compensation?.budget_notes].filter(Boolean).join(' · ')],
    ['Usage', [USAGE.find(u => u.key === a.usage?.rights)?.label, a.usage?.days ? `${a.usage.days} days` : '', a.usage?.raw_footage ? 'raw footage' : ''].filter(Boolean).join(' · ')],
    ['Key messages', a.campaign?.key_messages],
    ['Must include', a.content?.dos],
    ['Must avoid', a.content?.donts],
    ['Content style', a.content?.styles?.join(', ')],
    ['Tone', a.content?.tones?.join(', ')],
    ['Where to shoot', [a.content?.shoot_locations?.join(', '), a.content?.shoot_notes].filter(Boolean).join(' · ')],
    ['References', [...(a.content?.references || []), a.content?.guidelines_link].filter(Boolean).join(' · ')],
    ['Approval', a.content?.approval_required ? 'Content approved before it goes live' : ''],
    ['Timing', [a.timeline?.live_from && `live ${a.timeline.live_from}`, a.timeline?.live_to && `to ${a.timeline.live_to}`, a.timeline?.dates_firm ? 'fixed' : '', a.timeline?.proposal_by && `proposal by ${a.timeline.proposal_by}`, a.timeline?.key_dates].filter(Boolean).join(' · ')],
    ['Success', [label(KPIS, a.success?.kpis), a.success?.reporting].filter(Boolean).join(' · ')],
    ['Anything else', a.success?.anything_else],
  ]
  return (
    <div className={cn(CARD, 'bg-card p-6 sm:p-8')}>
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Their answers</p>
      <dl className="divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[140px_1fr] sm:gap-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className={cn('whitespace-pre-line text-sm', !v && 'text-muted-foreground/60')}>{v || 'Not said'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
