'use client'

/**
 * The seven questions. Each step reads the brief, writes a patch, and knows
 * whether it is answered. The wizard owns saving and moving between them.
 */
import { useRef, useState } from 'react'
import {
  Store,
  Gift,
  UtensilsCrossed,
  Truck,
  Package,
  Repeat,
  PenLine,
  CalendarDays,
  Send,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Check,
  Play,
  Circle,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import {
  merchantApi,
  tierFor,
  totalValue,
  deliverableName,
  type BarterItem,
  type CampaignBrief,
  type CampaignProblem,
  type Programme,
  type ProgrammeTier,
} from '@/services/merchantApi'
import { Money, Face, DirhamSign } from '../bits'
import { CreatorCard } from '../CreatorCard'
import { Question, Field, TextInput, TextArea, Choice, Pills, ListEditor, Note } from './ui'

export interface StepProps {
  brief: CampaignBrief
  patch: (p: Partial<CampaignBrief>) => void
  programme: Programme
  merchant: { name: string; logo_url: string | null; category: string | null }
  problems: CampaignProblem[]
}

export const STEP_ICONS = [Store, Gift, UtensilsCrossed, Repeat, PenLine, CalendarDays, Send]
export const STEP_NAMES = ['Your place', 'What they get', 'How they redeem', 'What you get back', 'The brief', 'Dates and creators', 'Review']

/** Which step a server problem belongs to, by field name. */
export function stepForField(field: string | null | undefined): number | null {
  if (!field) return null
  const f = field.toLowerCase()
  if (['name', 'category', 'visit_location', 'hero_image_url', 'logo'].includes(f)) return 0
  if (f.startsWith('barter') || f.includes('value')) return 1
  if (['fulfilment_mode', 'guests_allowed', 'entitlement_cap_aed', 'visit_required'].includes(f)) return 2
  if (f.includes('tiktok') || f.includes('deliverable')) return 3
  if (['mandatory_tags', 'mandatory_hashtags', 'content_requirements', 'things_to_avoid', 'reference_links', 'description'].includes(f)) return 4
  if (['start_date', 'end_date', 'max_participants', 'creator_approval_mode'].includes(f)) return 5
  return null
}

export function problemsFor(problems: CampaignProblem[], step: number): CampaignProblem[] {
  return problems.filter((p) => (p.step != null ? p.step - 1 === step || p.step === step : stepForField(p.field) === step))
}

/** Is this step answered well enough to move on? */
export function stepComplete(step: number, brief: CampaignBrief, programme: Programme): boolean {
  switch (step) {
    case 0:
      return !!brief.name?.trim() && !!brief.visit_location?.trim()
    case 1:
      return totalValue(brief.barter_items) >= programme.min_value_per_creator_aed && (brief.barter_items || []).every((i) => i.name.trim())
    case 2:
      return !!brief.fulfilment_mode
    case 3:
      return !!tierFor(programme, totalValue(brief.barter_items))
    case 4:
      return (brief.content_requirements || []).length > 0 || (brief.mandatory_tags || []).length > 0
    case 5:
      return !!brief.start_date && !!brief.max_participants && !!brief.creator_approval_mode
    default:
      return true
  }
}

/* ── 1. Your place ───────────────────────────────────────────────────────── */

export function StepPlace({ brief, patch, merchant, problems }: StepProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const err = (f: string) => problems.find((p) => p.field === f)?.message

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const { url } = await merchantApi.uploadCover(file)
      patch({ hero_image_url: url })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That photo did not upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Question icon={Store} title="Tell us about your place" sub="Creators see this first. The name and a good cover photo do most of the work.">
      <Field label="Campaign name" hint="What the creator will see at the top of the card" error={err('name')}>
        <TextInput value={brief.name || ''} onChange={(e) => patch({ name: e.target.value })} placeholder={`${merchant.name}, a visit for two`} autoFocus />
      </Field>
      <Field label="What kind of place" error={err('category')}>
        <TextInput value={brief.category || ''} onChange={(e) => patch({ category: e.target.value })} placeholder={merchant.category || 'Café, restaurant, salon, gym'} />
      </Field>
      <Field label="Where creators go" hint="A street address or the mall and floor" error={err('visit_location')}>
        <TextInput value={brief.visit_location || ''} onChange={(e) => patch({ visit_location: e.target.value })} placeholder="Shop 12, Alserkal Avenue, Al Quoz" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Logo</span>
          <div className="flex size-[88px] items-center justify-center rounded-2xl border border-border bg-card">
            <Face name={merchant.name} src={merchant.logo_url} className="size-14 rounded-xl text-lg" />
          </div>
          <span className="text-xs text-muted-foreground">From your account</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Cover photo</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={cn(
              'relative flex h-[88px] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground transition-colors hover:bg-muted/40',
              brief.hero_image_url && 'border-solid',
            )}
          >
            {brief.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brief.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <span className={cn('relative inline-flex items-center gap-2', brief.hero_image_url && 'rounded-full bg-black/50 px-3 py-1.5 text-white')}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? 'Uploading' : brief.hero_image_url ? 'Change photo' : 'Add a photo'}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <span className="text-xs text-muted-foreground">Landscape, of the place or the food. {err('hero_image_url') || ''}</span>
        </div>
      </div>
    </Question>
  )
}

/* ── 2. What the creator gets ────────────────────────────────────────────── */

export function StepOffer({ brief, patch, programme, problems }: StepProps) {
  const items: BarterItem[] = brief.barter_items?.length ? brief.barter_items : [{ name: '', value_aed: 0 }]
  const total = totalValue(items)
  const min = programme.min_value_per_creator_aed
  const tier = tierFor(programme, total)
  const tiers = [...programme.tiers].sort((a, b) => a.min - b.min)
  const top = tiers.length ? Math.max(tiers[tiers.length - 1].min * 1.5, min * 3) : min * 3
  const pct = Math.min(100, Math.round((total / top) * 100))

  const set = (i: number, p: Partial<BarterItem>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...p } : it))
    patch({ barter_items: next })
  }
  const remove = (i: number) => patch({ barter_items: items.filter((_, idx) => idx !== i) })
  const add = () => patch({ barter_items: [...items, { name: '', value_aed: 0 }] })

  return (
    <Question icon={Gift} title="What does each creator get?" sub="List what they receive on the visit and what it is worth on your menu or price list.">
      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <TextInput
              value={item.name}
              onChange={(e) => set(i, { name: e.target.value })}
              placeholder={i === 0 ? 'Brunch for two' : 'Dessert to share'}
              className="flex-1"
              autoFocus={i === 0 && !item.name}
            />
            <div className="relative w-[132px] shrink-0">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                <DirhamSign />
              </span>
              <TextInput
                type="number"
                inputMode="numeric"
                min={0}
                value={item.value_aed || ''}
                onChange={(e) => set(i, { value_aed: Number(e.target.value) || 0 })}
                placeholder="0"
                className="pl-9 text-right tabular-nums"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={items.length === 1}
              aria-label="Remove"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={add} className="inline-flex h-10 w-fit items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Plus className="size-4" /> Add another
        </button>
      </div>

      {/* Running total and the tier strip */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Value per creator</span>
          <span className="text-[26px] font-medium tracking-[-0.02em]">
            <Money amount={total} />
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full transition-all', tier ? 'bg-foreground' : 'bg-muted-foreground/40')} style={{ width: `${pct}%` }} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {tiers.map((t) => {
            const on = tier?.key === t.key
            return (
              <div key={t.key} className={cn('flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 transition-colors', on ? 'border-foreground bg-muted/40' : 'border-border')}>
                <span className={cn('text-[13px] font-medium tabular-nums', !on && 'text-muted-foreground')}>
                  <Money amount={t.min} />
                  {t.max != null ? (
                    <>
                      {' to '}
                      <Money amount={t.max} />
                    </>
                  ) : (
                    ' and up'
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{t.label}</span>
              </div>
            )
          })}
        </div>
        {total < min ? (
          <Note>
            Your offer needs to be worth at least <Money amount={min} /> per creator.
          </Note>
        ) : (
          <Note tone="good">
            <Check className="mr-1 inline size-3.5 align-[-2px]" />
            Above the minimum. {tier?.label}.
          </Note>
        )}
        {problemsFor(problems, 1).map((p) => (
          <Note key={p.message} tone="bad">
            {p.message}
          </Note>
        ))}
      </div>
    </Question>
  )
}

/* ── 3. How they redeem ──────────────────────────────────────────────────── */

export function StepRedeem({ brief, patch, problems }: StepProps) {
  const mode = brief.fulfilment_mode
  return (
    <Question icon={UtensilsCrossed} title="How do they redeem it?" sub="Pick one. You can change this later with a note to us.">
      <div role="radiogroup" className="flex flex-col gap-2.5">
        <Choice
          icon={UtensilsCrossed}
          selected={mode === 'dine_in'}
          onSelect={() => patch({ fulfilment_mode: 'dine_in', visit_required: true })}
          title="They come in"
          sub="Visit your place, show their code, enjoy it there"
        />
        <Choice
          icon={Truck}
          selected={mode === 'delivery'}
          onSelect={() => patch({ fulfilment_mode: 'delivery', visit_required: false, guests_allowed: null })}
          title="You deliver"
          sub="They order, you send it to them"
        />
        <Choice
          icon={Package}
          selected={mode === 'brand_ships'}
          onSelect={() => patch({ fulfilment_mode: 'brand_ships', visit_required: false, guests_allowed: null })}
          title="You ship a product"
          sub="A parcel to their address, anywhere in the UAE"
        />
      </div>

      {mode === 'dine_in' ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Guests they can bring</span>
            <Pills options={[0, 1, 2, 3]} value={brief.guests_allowed ?? 0} onChange={(v) => patch({ guests_allowed: v })} render={(v) => (v === 0 ? 'Just them' : `+${v}`)} />
          </div>
          <Field label="Spend cap, if any" hint="Leave empty to let the offer above speak for itself">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                <DirhamSign />
              </span>
              <TextInput
                type="number"
                inputMode="numeric"
                min={0}
                value={brief.entitlement_cap_aed ?? ''}
                onChange={(e) => patch({ entitlement_cap_aed: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="No cap"
                className="pl-9 tabular-nums"
              />
            </div>
          </Field>
        </div>
      ) : null}
      {problemsFor(problems, 2).map((p) => (
        <Note key={p.message} tone="bad">
          {p.message}
        </Note>
      ))}
    </Question>
  )
}

/* ── 4. What you get back ────────────────────────────────────────────────── */

const ICON: Record<string, typeof Play> = { reel: Play, video: Play, tiktok_video: Play, story: Circle, post: ImageIcon, carousel: ImageIcon }

function DeliverableRow({ type, qty, kind }: { type: string; qty: number; kind: 'guaranteed' | 'attempted' }) {
  const Icon = ICON[type] || ImageIcon
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
      <span className={cn('inline-flex size-10 items-center justify-center rounded-xl', kind === 'guaranteed' ? 'bg-foreground text-background' : 'bg-primary text-primary-foreground')}>
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] font-medium">
          {qty} {deliverableName(type, qty)} per creator
        </span>
        <span className="text-[13px] text-muted-foreground">{kind === 'guaranteed' ? 'Guaranteed at this value' : 'Attempted, not promised'}</span>
      </span>
    </div>
  )
}

export function StepGetBack({ brief, patch, programme }: StepProps) {
  const total = totalValue(brief.barter_items)
  const tier: ProgrammeTier | null = tierFor(programme, total)
  const hasReel = !!tier && [...tier.guaranteed, ...tier.attempted].some((d) => d.type === 'reel')
  const hasTiktok = !!tier && [...tier.guaranteed, ...tier.attempted].some((d) => d.type === 'tiktok_video')
  const canSwap = hasReel && hasTiktok

  return (
    <Question
      icon={Repeat}
      title="Here is what you get back"
      sub={
        <>
          Set by what your offer is worth: <Money amount={total} /> per creator puts you in the {tier ? tier.label.toLowerCase() : ''} tier.
        </>
      }
    >
      {!tier ? (
        <Note tone="bad">Your offer is below the minimum, so there is nothing to show yet. Go back a step and add to it.</Note>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tier.guaranteed.map((d) => (
            <DeliverableRow key={`g-${d.type}`} type={d.type} qty={d.qty} kind="guaranteed" />
          ))}
          {tier.attempted.map((d) => (
            <DeliverableRow key={`a-${d.type}`} type={d.type} qty={d.qty} kind="attempted" />
          ))}
        </div>
      )}

      {canSwap ? (
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
          <span className="flex flex-col">
            <span className="text-[15px] font-medium">Prefer a TikTok video to the reel</span>
            <span className="text-[13px] text-muted-foreground">Same length and effort, posted on TikTok instead of Instagram</span>
          </span>
          <Switch checked={!!brief.swap_reel_for_tiktok} onCheckedChange={(v: boolean) => patch({ swap_reel_for_tiktok: v })} />
        </label>
      ) : null}

      <Note>Every post tags your account and your location. The content is yours to reuse for 30 days.</Note>
    </Question>
  )
}

/* ── 5. The brief ────────────────────────────────────────────────────────── */

export function StepBrief({ brief, patch, problems }: StepProps) {
  return (
    <Question icon={PenLine} title="What should they show?" sub="Three or four short lines beat a page. Creators read this on their phone on the way in.">
      <Field label="Show this" hint="One thing per line. Press enter after each.">
        <ListEditor items={brief.content_requirements || []} onChange={(v) => patch({ content_requirements: v })} placeholder="The terrace at golden hour" />
      </Field>
      <Field label="Please avoid">
        <ListEditor items={brief.things_to_avoid || []} onChange={(v) => patch({ things_to_avoid: v })} placeholder="Filming other guests" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tag us as">
          <ListEditor items={brief.mandatory_tags || []} onChange={(v) => patch({ mandatory_tags: v })} placeholder="yourhandle" prefix="@" max={3} />
        </Field>
        <Field label="Hashtags">
          <ListEditor items={brief.mandatory_hashtags || []} onChange={(v) => patch({ mandatory_hashtags: v })} placeholder="yourplace" prefix="#" max={5} />
        </Field>
      </div>
      <Field label="Anything to look at first" hint="Links to posts you liked, your menu, your Instagram">
        <ListEditor items={brief.reference_links || []} onChange={(v) => patch({ reference_links: v })} placeholder="https://" max={5} />
      </Field>
      <Field label="A line about the place, optional">
        <TextArea value={brief.description || ''} onChange={(e) => patch({ description: e.target.value })} placeholder="Family-run, specialty coffee, the best shakshuka in Al Quoz." />
      </Field>
      {problemsFor(problems, 4).map((p) => (
        <Note key={p.message} tone="bad">
          {p.message}
        </Note>
      ))}
    </Question>
  )
}

/* ── 6. Dates and creators ───────────────────────────────────────────────── */

export function StepDates({ brief, patch, programme, problems }: StepProps) {
  const per = programme.creators_per_month || 5
  const counts = Array.from({ length: per }, (_, i) => i + 1)
  const today = new Date().toISOString().slice(0, 10)
  return (
    <Question icon={CalendarDays} title="When, and how many?" sub={`Your trial covers ${per} creators a month. Start with fewer if you want to see how it goes.`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Creators can start from">
          <TextInput type="date" min={today} value={brief.start_date || ''} onChange={(e) => patch({ start_date: e.target.value || null })} />
        </Field>
        <Field label="Last day to visit, optional" hint="Leave empty and we close it when the month does">
          <TextInput type="date" min={brief.start_date || today} value={brief.end_date || ''} onChange={(e) => patch({ end_date: e.target.value || null })} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Creators this month</span>
        <Pills options={counts} value={brief.max_participants ?? null} onChange={(v) => patch({ max_participants: v })} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Who decides which creators come</span>
        <div role="radiogroup" className="flex flex-col gap-2.5">
          <Choice
            selected={brief.creator_approval_mode === 'manual'}
            onSelect={() => patch({ creator_approval_mode: 'manual' })}
            title="You approve each creator"
            sub="We send you each one who applies. Nothing happens until you say yes."
          />
          <Choice
            selected={brief.creator_approval_mode === 'auto'}
            onSelect={() => patch({ creator_approval_mode: 'auto' })}
            title="Approve automatically"
            sub="The first creators who fit are in. Fastest way to fill your spots."
          />
        </div>
      </div>
      {problemsFor(problems, 5).map((p) => (
        <Note key={p.message} tone="bad">
          {p.message}
        </Note>
      ))}
    </Question>
  )
}

/* ── 7. Review ───────────────────────────────────────────────────────────── */

export function StepReview({ brief, programme, merchant, problems }: StepProps) {
  const tier = tierFor(programme, totalValue(brief.barter_items))
  const unplaced = problems.filter((p) => (p.step == null || p.step < 1) && stepForField(p.field) == null)
  return (
    <Question icon={Send} title="This is what creators will see" sub="We read every campaign before it goes live, usually within one business day.">
      <div className="flex justify-center py-2">
        <CreatorCard brief={brief} merchantName={merchant.name} logoUrl={merchant.logo_url} tier={tier} />
      </div>
      {unplaced.map((p) => (
        <Note key={p.message} tone="bad">
          {p.message}
        </Note>
      ))}
    </Question>
  )
}
