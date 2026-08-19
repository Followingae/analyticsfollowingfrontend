'use client'

/**
 * QUOTATION view of a public proposal link (`mode === 'quote'`).
 *
 * Unlike the sales view, everything is visible immediately and the client is here to
 * CHOOSE: per creator, which deliverables they want, and on eligible lines whether to take
 * the standard rate or the priced add-on ("With MEFCC visit" +15%). Their picks set the
 * quoted total directly — the agreement and advance invoice are raised off this number.
 *
 * Every price shown comes from the server. Nothing is computed here beyond display, so the
 * figure the client agrees to and the figure we invoice cannot drift apart.
 */

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { API_CONFIG } from '@/config/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Check, Users, Loader2, Sparkles, Lock, ArrowRight, Info,
} from 'lucide-react'
import { cdnAvatar } from "@/lib/avatar"

const PUBLIC = `${API_CONFIG.BASE_URL}/api/v1/public/proposals`

const money = (n: number | string | null | undefined) =>
  n == null ? null : `⃃ ${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`
const compact = (n: number | null | undefined) =>
  n == null ? null : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n))

const DELIVERABLE_LABEL: Record<string, string> = {
  post: 'Post', story: 'Story', reel: 'Reel', carousel: 'Carousel',
  video: 'Video', bundle: 'Bundle', monthly: 'Monthly package',
}

const AV_GRADIENTS = [
  'from-violet-500 to-fuchsia-500', 'from-sky-500 to-indigo-500', 'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500', 'from-cyan-500 to-blue-500',
]
const avatarFor = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const initials = (seed || '?').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
  return { grad: AV_GRADIENTS[h % AV_GRADIENTS.length], initials }
}

interface Line {
  type: string
  quantity: number
  /** Server-owned: is this deliverable in the client's selection (and therefore charged)? */
  selected: boolean
  unit_price: number | null
  unit_price_with_modifier: number | null
  line_total: number | null
  line_total_standard: number | null
  line_total_with_modifier: number | null
  modifier_eligible: boolean
  modifier_applied: boolean
  unpriced: boolean
}

interface QuoteInfluencer {
  id: string
  username: string | null
  full_name: string | null
  followers_count: number | null
  profile_image_url: string | null
  deliverables: Line[]
  subtotal: number
  total: number
  selectable: boolean
}

interface Modifier {
  id: string
  label: string
  description: string | null
  kind: 'percent' | 'fixed'
  percent_value: number | null
  amount_aed: number | null
}

/** The uplift as the client should read it: "+15%" or "+⃃ 500". */
function modifierSuffix(m: Modifier): string {
  return m.kind === 'percent' ? `+${Number(m.percent_value)}%` : `+${money(m.amount_aed)}`
}

export function QuoteView({
  token, data, onReload,
}: {
  token: string
  data: any
  onReload: () => void
}) {
  const quote = data.quote || {}
  const modifier: Modifier | null = quote.modifier || null
  const influencers: QuoteInfluencer[] = data.influencers || []
  const locked = !!quote.selections_locked
  const confirmedAt: string | null = quote.confirmed_at || null

  const [savingId, setSavingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedCount = useMemo(
    () => influencers.filter((i) => i.deliverables.some((d) => d.selected)).length,
    [influencers]
  )

  /**
   * Write one creator's picks. The whole selection for that creator is sent each time —
   * the endpoint replaces it wholesale, so sending a delta would silently drop lines.
   */
  const save = useCallback(
    async (inf: QuoteInfluencer, deliverables: Array<{ type: string; modifier: string | null }>) => {
      setSavingId(inf.id)
      setError(null)
      try {
        const res = await fetch(`${PUBLIC}/${token}/select`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ influencer_id: inf.id, deliverables }),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({ detail: res.statusText }))
          throw new Error(e.detail || 'Could not save your selection')
        }
        // Reload rather than patch locally: the total is the server's to compute, and a
        // locally-guessed one could disagree with what we invoice.
        onReload()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save your selection')
      } finally {
        setSavingId(null)
      }
    },
    [token, onReload]
  )

  /**
   * Build the creator's FULL selection with one line changed.
   *
   * The endpoint replaces the selection wholesale, so every line the client still wants has
   * to be re-sent on every edit — sending only the line they touched would silently drop
   * the rest.
   */
  const withLineChanged = (
    inf: QuoteInfluencer,
    line: Line,
    change: { include?: boolean; withModifier?: boolean }
  ) =>
    inf.deliverables
      .filter((d) => !d.unpriced)
      .filter((d) => (d.type === line.type ? (change.include ?? d.selected) : d.selected))
      .map((d) => {
        const useModifier = d.type === line.type
          ? (change.withModifier ?? d.modifier_applied)
          : d.modifier_applied
        return { type: d.type, modifier: useModifier ? modifier?.id ?? null : null }
      })

  const toggleLine = (inf: QuoteInfluencer, line: Line, include: boolean) =>
    save(inf, withLineChanged(inf, line, { include }))

  const setLineVariant = (inf: QuoteInfluencer, line: Line, withModifier: boolean) =>
    save(inf, withLineChanged(inf, line, { include: true, withModifier }))

  const confirm = async () => {
    setConfirming(true)
    setError(null)
    try {
      const res = await fetch(`${PUBLIC}/${token}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          note: note || null,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(e.detail || 'Could not confirm your quote')
      }
      setConfirmOpen(false)
      onReload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm your quote')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <>
      {/* ---------- already confirmed ---------- */}
      {confirmedAt && (
        <section className="pt-14 sm:pt-20">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-8 sm:p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">
              Your selection is confirmed
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground leading-relaxed">
              Your account manager is preparing your agreement and advance invoice. They will
              appear on this page as soon as they are ready, and we will create your Following
              account at the same time.
            </p>
            {quote.total != null && (
              <div className="mt-6 text-3xl font-semibold tracking-tight">{money(quote.total)}</div>
            )}
          </div>
        </section>
      )}

      {/* ---------- the quote ---------- */}
      <section id="quote" className="pt-14 sm:pt-20 scroll-mt-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs">1</span>
              Your quotation
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
              {locked ? 'Your selected creators' : 'Choose what you want from each creator'}
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {influencers.length} creator{influencers.length === 1 ? '' : 's'}
            {selectedCount > 0 && <span className="text-muted-foreground">· {selectedCount} selected</span>}
          </div>
        </div>

        {/* The single most important thing not to misread: this is round one. */}
        {quote.more_rounds_note && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 sm:p-5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed">{quote.more_rounds_note}</p>
          </div>
        )}

        {modifier && !locked && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">{modifier.label}</span>{' '}
              <span className="text-muted-foreground">({modifierSuffix(modifier)})</span> is
              available on some deliverables below. Choose it per deliverable — you can take it
              on one and not another.
              {modifier.description && (
                <span className="mt-1 block text-muted-foreground">{modifier.description}</span>
              )}
            </p>
          </div>
        )}

        {locked && !confirmedAt && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-border bg-muted/40 p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              This quote has been finalised, so the selection can no longer be changed here.
              Contact your account manager to adjust it.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          {influencers.map((inf, idx) => (
            <motion.div
              key={inf.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.2), ease: [0.22, 1, 0.36, 1] }}
            >
              <CreatorQuoteCard
                inf={inf}
                modifier={modifier}
                locked={locked || !inf.selectable}
                saving={savingId === inf.id}
                onToggleLine={toggleLine}
                onSetVariant={setLineVariant}
              />
            </motion.div>
          ))}
        </div>

        {/* ---------- totals ---------- */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2.5">
            <Row label="Subtotal" value={money(quote.subtotal) ?? '—'} muted />
            {modifier && quote.total != null && quote.subtotal != null &&
              Number(quote.total) !== Number(quote.subtotal) && (
                <Row
                  label={`${modifier.label} (${modifierSuffix(modifier)})`}
                  value={money(Number(quote.total) - Number(quote.subtotal)) ?? '—'}
                />
              )}
            <div className="h-px bg-border" />
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-base font-semibold">Total</span>
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {money(quote.total) ?? '—'}
              </span>
            </div>
          </div>

          {!locked && !confirmedAt && (
            <Button
              className="mt-6 w-full gap-2 rounded-xl"
              size="lg"
              disabled={!!savingId || selectedCount === 0}
              onClick={() => setConfirmOpen(true)}
            >
              Confirm this quote <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {!locked && !confirmedAt && selectedCount === 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Select at least one deliverable to continue.
            </p>
          )}
        </div>

        {/* ---------- what happens next ---------- */}
        {Array.isArray(quote.next_steps) && quote.next_steps.length > 0 && !confirmedAt && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-7">
            <div className="text-sm font-semibold">What happens next</div>
            <ol className="mt-4 space-y-3">
              {quote.next_steps.map((s: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className={i === 0 ? '' : 'text-muted-foreground'}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* ---------- confirm dialog ---------- */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your selection</DialogTitle>
            <DialogDescription>
              This is not a commitment to pay. It tells us what to prepare, so we can send your
              agreement and advance invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} creator{selectedCount === 1 ? '' : 's'}
                </span>
                <span className="text-xl font-semibold tabular-nums">{money(quote.total) ?? '—'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-name">Your name</Label>
              <Input id="quote-name" value={contactName} onChange={(e) => setContactName(e.target.value)}
                placeholder="Who should we address this to?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-email">Email</Label>
              <Input id="quote-email" type="email" value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Where should we send the agreement?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-note">Anything we should know? (optional)</Label>
              <Textarea id="quote-note" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Timings, brief notes, extra creators you'd like to see…" rows={3} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirming}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={confirming} className="gap-2">
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirm selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Which deliverable types this creator currently has selected.
 *
 * Read from the server's `selected` flag rather than kept in component state: every save
 * reloads the page from the server, so a local copy is the thing that would go stale — and
 * the total shown must be the total we invoice.
 */
function selectedTypes(inf: QuoteInfluencer): Set<string> {
  return new Set(inf.deliverables.filter((d) => d.selected).map((d) => d.type))
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  )
}

function CreatorQuoteCard({
  inf, modifier, locked, saving, onToggleLine, onSetVariant,
}: {
  inf: QuoteInfluencer
  modifier: Modifier | null
  locked: boolean
  saving: boolean
  onToggleLine: (inf: QuoteInfluencer, line: Line, include: boolean) => void
  onSetVariant: (inf: QuoteInfluencer, line: Line, withModifier: boolean) => void
}) {
  const { grad, initials } = avatarFor(inf.username || inf.full_name || '?')
  const selected = selectedTypes(inf)
  const priced = inf.deliverables.filter((d) => !d.unpriced)

  return (
    <div className={`rounded-2xl border bg-card p-5 sm:p-6 transition-colors ${
      selected.size > 0 ? 'border-primary/40' : 'border-border'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={cdnAvatar(inf.profile_image_url)} alt={inf.username || ''} />
            <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-sm font-bold`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold truncate">@{inf.username || 'creator'}</div>
            <div className="text-sm text-muted-foreground truncate">
              {inf.full_name ? `${inf.full_name} · ` : ''}
              {compact(inf.followers_count) ?? '0'} followers
            </div>
          </div>
        </div>
        <div className="text-right">
          {saving ? (
            <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="text-xl font-semibold tabular-nums">{money(inf.total) ?? '—'}</div>
              <div className="text-xs text-muted-foreground">
                {selected.size === 0 ? 'nothing selected' : `${selected.size} selected`}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {priced.map((line) => {
          const isOn = selected.has(line.type)
          return (
            <div
              key={line.type}
              className={`rounded-xl border p-3.5 transition-colors ${
                isOn ? 'border-border bg-muted/30' : 'border-border/60'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 min-w-0 cursor-pointer">
                  <Checkbox
                    checked={isOn}
                    disabled={locked || saving}
                    onCheckedChange={(v: boolean | 'indeterminate') => onToggleLine(inf, line, v === true)}
                  />
                  <span className="min-w-0">
                    <span className="font-medium">
                      {DELIVERABLE_LABEL[line.type] || line.type}
                    </span>
                    {line.quantity > 1 && (
                      <span className="text-muted-foreground"> ×{line.quantity}</span>
                    )}
                  </span>
                </label>
                <span className="shrink-0 tabular-nums font-medium">
                  {money(isOn ? line.line_total : line.line_total_standard) ?? '—'}
                </span>
              </div>

              {/* Both prices, side by side, on every eligible line. */}
              {isOn && line.modifier_eligible && modifier && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <VariantOption
                    label="Standard"
                    price={money(line.line_total_standard)}
                    active={!line.modifier_applied}
                    disabled={locked || saving}
                    onClick={() => onSetVariant(inf, line, false)}
                  />
                  <VariantOption
                    label={modifier.label}
                    hint={modifierSuffix(modifier)}
                    price={money(line.line_total_with_modifier)}
                    active={line.modifier_applied}
                    disabled={locked || saving}
                    onClick={() => onSetVariant(inf, line, true)}
                  />
                </div>
              )}
            </div>
          )
        })}

        {priced.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Deliverables for this creator are being finalised.
          </p>
        )}
      </div>
    </div>
  )
}

function VariantOption({
  label, hint, price, active, disabled, onClick,
}: {
  label: string
  hint?: string
  price: string | null
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/30'
          : 'border-border hover:border-foreground/25'
      }`}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
            active ? 'border-primary bg-primary' : 'border-muted-foreground/40'
          }`}>
            {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
          </span>
          <span className="truncate text-sm font-medium">{label}</span>
        </span>
        {hint && <span className="mt-0.5 block pl-6 text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{price ?? '—'}</span>
    </button>
  )
}
