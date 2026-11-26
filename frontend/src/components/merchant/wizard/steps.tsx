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
  Coffee,
  Utensils,
  ShoppingBag,
  Stethoscope,
  Scissors,
  Dumbbell,
  ShoppingCart,
  Sparkles,
  MapPin,
  AlertCircle,
  Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  merchantApi,
  tierFor,
  totalValue,
  deliverableName,
  deliverablesLine,
  slotIsPast,
  type BarterItem,
  type VisitSchedule,
  type CampaignBrief,
  type CampaignProblem,
  type Programme,
  type ProgrammeTier,
} from '@/services/merchantApi'
import { Money, Face, DirhamSign } from '../bits'
import { CreatorCard } from '../CreatorCard'
import { Question, Field, TextInput, TextArea, Choice, Pills, ListEditor, Note, Badge, Chips, INPUT, INPUT_BAD } from './ui'
import { VisitSlotsEditor } from '@/components/visits/VisitSlotsEditor'

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
  if (['fulfilment_mode', 'guests_allowed', 'entitlement_cap_aed', 'visit_required', 'visit_schedule'].includes(f)) return 2
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
      if (!brief.fulfilment_mode) return false
      // Set times need at least one, and none that has already passed.
      if (brief.fulfilment_mode === 'dine_in' && brief.visit_schedule?.mode === 'slots') {
        const slots = brief.visit_schedule.slots || []
        return slots.length > 0 && !slots.some((s) => slotIsPast(s))
      }
      return true
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

const KINDS = [
  { key: 'cafe', label: 'Café', icon: Coffee },
  { key: 'restaurant', label: 'Restaurant', icon: Utensils },
  { key: 'retail', label: 'Retail', icon: ShoppingBag },
  { key: 'clinic', label: 'Clinic', icon: Stethoscope },
  { key: 'salon', label: 'Salon', icon: Scissors },
  { key: 'gym', label: 'Gym', icon: Dumbbell },
  { key: 'supermarket', label: 'Supermarket', icon: ShoppingCart },
  { key: 'other', label: 'Something else', icon: Sparkles },
]
const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']

function kindKey(cat?: string | null): string {
  const c = (cat || '').trim().toLowerCase()
  if (!c) return ''
  const hit = KINDS.find((k) => k.key === c || k.label.toLowerCase() === c)
  return hit ? hit.key : 'other'
}

/** The address is one line to the creator app, four boxes to the merchant. */
type Address = { venue: string; street: string; area: string; emirate: string }
function splitAddress(s?: string | null): Address {
  const parts = (s || '').split(',').map((x) => x.trim()).filter(Boolean)
  const last = parts[parts.length - 1]?.toLowerCase()
  const emirate = EMIRATES.find((e) => e.toLowerCase() === last) || ''
  const rest = emirate ? parts.slice(0, -1) : parts
  return { venue: rest[0] || '', street: rest[1] || '', area: rest.slice(2).join(', '), emirate }
}
function joinAddress(a: Address): string {
  return [a.venue, a.street, a.area, a.emirate].map((x) => x.trim()).filter(Boolean).join(', ')
}
const MAP_RE = /(maps\.app\.goo\.gl|google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.apple\.com|waze\.com)/i
export function isMapLink(u: string): boolean {
  return MAP_RE.test(u)
}

const SELECT_TRIGGER = cn(INPUT, 'h-12 justify-between data-[placeholder]:text-muted-foreground/70')

export function StepPlace({ brief, patch, merchant, problems }: StepProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const err = (f: string) => problems.find((p) => p.field === f)?.message
  const [addr, setAddr] = useState<Address>(() => splitAddress(brief.visit_location))
  const setA = (p: Partial<Address>) => {
    const next = { ...addr, ...p }
    setAddr(next)
    patch({ visit_location: joinAddress(next) })
  }
  const links = brief.reference_links || []
  const mapLink = links.find(isMapLink) || ''
  const setMap = (v: string) => patch({ reference_links: [...links.filter((l) => !isMapLink(l)), ...(v.trim() ? [v.trim()] : [])] })
  const kind = kindKey(brief.category || merchant.category)

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

  const addrBad = !!err('visit_location')

  return (
    <Question icon={Store} title="Tell us about your place" sub="Creators see this first. A good cover photo does most of the work.">
      <Field label="Campaign name" error={err('name')}>
        <TextInput
          value={brief.name || ''}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder={`${merchant.name}, a visit for two`}
          className={cn(err('name') && INPUT_BAD)}
          autoFocus
        />
      </Field>

      <Field label="What kind of place" error={err('category')}>
        <Select value={kind || undefined} onValueChange={(v: string) => patch({ category: v })}>
          <SelectTrigger className={cn(SELECT_TRIGGER, err('category') && INPUT_BAD)} aria-label="What kind of place">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {KINDS.map((k) => (
              <SelectItem key={k.key} value={k.key} className="h-10 rounded-lg">
                <span className="flex items-center gap-2.5">
                  <k.icon className="size-4" strokeWidth={1.75} />
                  {k.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className={cn('flex flex-col gap-3 rounded-2xl border bg-card p-4', addrBad ? 'border-destructive/60' : 'border-border')}>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" strokeWidth={1.75} />
          Where creators go
        </span>
        <TextInput
          value={addr.venue}
          onChange={(e) => setA({ venue: e.target.value })}
          placeholder="Venue or building, e.g. Noon Café, Alserkal Avenue"
          className={cn(addrBad && !addr.venue && INPUT_BAD)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput value={addr.street} onChange={(e) => setA({ street: e.target.value })} placeholder="Street, or mall and floor" />
          <TextInput
            value={addr.area}
            onChange={(e) => setA({ area: e.target.value })}
            placeholder="Area, e.g. Al Quoz"
            className={cn(addrBad && !addr.area && INPUT_BAD)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={addr.emirate || undefined} onValueChange={(v: string) => setA({ emirate: v })}>
            <SelectTrigger className={SELECT_TRIGGER} aria-label="Emirate">
              <SelectValue placeholder="Emirate" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {EMIRATES.map((e) => (
                <SelectItem key={e} value={e} className="h-10 rounded-lg">
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <TextInput value={mapLink} onChange={(e) => setMap(e.target.value)} placeholder="Google Maps link, optional" inputMode="url" className="pl-10" />
          </div>
        </div>
        {addrBad ? (
          <Badge>
            <AlertCircle className="size-3.5" strokeWidth={2} />
            Add at least the venue and the area
          </Badge>
        ) : null}
      </div>

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
              err('hero_image_url') && INPUT_BAD,
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
          {err('hero_image_url') ? (
            <Badge>
              <AlertCircle className="size-3.5" strokeWidth={2} />
              {err('hero_image_url')}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Landscape, of the place or the food.</span>
          )}
        </div>
      </div>
    </Question>
  )
}

/* ── 2. What the creator gets ────────────────────────────────────────────── */

const TIER_ICON: Record<string, typeof Play> = { reel: Play, video: Play, tiktok_video: Play, story: Circle, post: ImageIcon, carousel: ImageIcon }

export function StepOffer({ brief, patch, programme, problems }: StepProps) {
  const items: BarterItem[] = brief.barter_items?.length ? brief.barter_items : [{ name: '', value_aed: 0 }]
  const total = totalValue(items)
  const min = programme.min_value_per_creator_aed
  const tier = tierFor(programme, total)
  const tiers = [...programme.tiers].sort((a, b) => a.min - b.min)
  const touched = total > 0 || items.some((i) => i.name.trim())
  const below = touched && total < min
  const segments = [{ key: 'under', min: 0, max: min, label: 'Below the minimum' }, ...tiers.map((t) => ({ key: t.key, min: t.min, max: t.max ?? t.min * 2, label: t.label }))]

  const set = (i: number, p: Partial<BarterItem>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...p } : it))
    patch({ barter_items: next })
  }
  const remove = (i: number) => patch({ barter_items: items.filter((_, idx) => idx !== i) })
  const add = () => patch({ barter_items: [...items, { name: '', value_aed: 0 }] })

  return (
    <Question icon={Gift} title="What does each creator get?" sub="What they receive on the visit, and what it is worth on your menu or price list.">
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
              <span className={cn('pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm', below ? 'text-destructive' : 'text-muted-foreground')}>
                <DirhamSign />
              </span>
              <TextInput
                type="number"
                inputMode="numeric"
                min={0}
                value={item.value_aed || ''}
                onChange={(e) => set(i, { value_aed: Number(e.target.value) || 0 })}
                placeholder="0"
                aria-invalid={below || undefined}
                className={cn('pl-9 text-right tabular-nums', below && INPUT_BAD)}
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

      {/* The value and what it earns */}
      <div className={cn('flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-colors', below ? 'border-destructive/50' : 'border-border')}>
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Value per creator</span>
            <span className={cn('text-[34px] font-medium leading-none tracking-[-0.03em]', below && 'text-destructive')}>
              <Money amount={total} />
            </span>
          </div>
          {below ? (
            <Badge>
              <AlertCircle className="size-3.5" strokeWidth={2} />
              <Money amount={min - total} /> short of the <Money amount={min} /> minimum
            </Badge>
          ) : tier ? (
            <Badge tone="good">
              <Check className="size-3.5" strokeWidth={2.5} />
              {tier.label}
            </Badge>
          ) : (
            <Badge tone="muted">
              Minimum <Money amount={min} />
            </Badge>
          )}
        </div>

        {/* One track, four zones. The first zone is the one to get out of. */}
        <div className="flex h-2.5 gap-1" role="img" aria-label={`Value ${total} of a minimum ${min}`}>
          {segments.map((seg, i) => {
            const span = Math.max(1, seg.max - seg.min)
            const fill = total <= seg.min ? 0 : total >= seg.max ? 100 : Math.round(((total - seg.min) / span) * 100)
            const isUnder = i === 0
            return (
              <div key={seg.key} className={cn('relative flex-1 overflow-hidden rounded-full', isUnder ? 'bg-destructive/10' : 'bg-muted')}>
                <div
                  className={cn('h-full rounded-full transition-all', isUnder ? (below ? 'bg-destructive/70' : 'bg-muted-foreground/30') : 'bg-foreground')}
                  style={{ width: `${fill}%` }}
                />
              </div>
            )
          })}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {tiers.map((t) => {
            const on = tier?.key === t.key
            const all = [...t.guaranteed.map((d) => ({ ...d, sure: true })), ...t.attempted.map((d) => ({ ...d, sure: false }))]
            return (
              <div
                key={t.key}
                className={cn(
                  'flex flex-col gap-2.5 rounded-xl border px-3.5 py-3 transition-colors',
                  on ? 'border-transparent bg-[oklch(0.9354_0.2254_121.5)] text-[oklch(0.2_0.03_140)]' : 'border-border text-muted-foreground',
                )}
              >
                <span className="flex items-center gap-1.5">
                  {all.map((d, j) => {
                    const Icon = TIER_ICON[d.type] || ImageIcon
                    return (
                      <span
                        key={`${d.type}-${j}`}
                        title={d.sure ? 'Guaranteed' : 'Attempted, not promised'}
                        className={cn(
                          'inline-flex size-7 items-center justify-center rounded-lg',
                          d.sure ? (on ? 'bg-[oklch(0.2_0.03_140)] text-[oklch(0.9354_0.2254_121.5)]' : 'bg-muted text-foreground') : 'border border-dashed border-current/50',
                        )}
                      >
                        <Icon className="size-3.5" strokeWidth={2} />
                      </span>
                    )
                  })}
                </span>
                <span className="flex flex-col">
                  <span className={cn('text-[13px] font-semibold', !on && 'text-foreground')}>{t.label}</span>
                  <span className="text-xs tabular-nums opacity-80">
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
                </span>
              </div>
            )
          })}
        </div>
        {tier ? (
          <span className="text-xs text-muted-foreground">Each creator posts {deliverablesLine(tier.guaranteed)}{tier.attempted.length ? `, and tries for ${deliverablesLine(tier.attempted)}` : ''}.</span>
        ) : null}
        {problemsFor(problems, 1).map((p) => (
          <Badge key={p.message}>
            <AlertCircle className="size-3.5" strokeWidth={2} />
            {p.message}
          </Badge>
        ))}
      </div>
    </Question>
  )
}

/* ── 3. How they redeem ──────────────────────────────────────────────────── */

export function StepRedeem({ brief, patch, problems }: StepProps) {
  const mode = brief.fulfilment_mode
  const cap = brief.entitlement_cap_aed
  const offer = totalValue(brief.barter_items)
  return (
    <Question icon={UtensilsCrossed} title="How do they redeem it?" sub="Pick one. You can change this later with a note to us.">
      <div role="radiogroup" className="flex flex-col gap-2.5">
        <Choice
          icon={UtensilsCrossed}
          selected={mode === 'dine_in'}
          onSelect={() => patch({ fulfilment_mode: 'dine_in', visit_required: true, visit_schedule: brief.visit_schedule ?? { ...ANYTIME } })}
          title="They come in"
          sub="Visit your place, show their code, enjoy it there"
        />
        <Choice
          icon={Truck}
          selected={mode === 'delivery'}
          onSelect={() => patch({ fulfilment_mode: 'delivery', visit_required: false, guests_allowed: null, entitlement_cap_aed: null, visit_schedule: null })}
          title="You deliver"
          sub="They order, you send it to them"
        />
        <Choice
          icon={Package}
          selected={mode === 'brand_ships'}
          onSelect={() => patch({ fulfilment_mode: 'brand_ships', visit_required: false, guests_allowed: null, entitlement_cap_aed: null, visit_schedule: null })}
          title="You ship a product"
          sub="A parcel to their address, anywhere in the UAE"
        />
      </div>

      {mode === 'dine_in' ? (
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-2.5">
            <span className="text-sm text-muted-foreground">Guests they can bring</span>
            <Pills options={[0, 1, 2, 3]} value={brief.guests_allowed ?? 0} onChange={(v) => patch({ guests_allowed: v })} render={(v) => (v === 0 ? 'Just them' : `+${v}`)} />
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-sm text-muted-foreground">What can they order?</span>
            <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-2">
              <Choice selected={cap == null} onSelect={() => patch({ entitlement_cap_aed: null })} title="Exactly the offer" sub="What you listed, nothing more" />
              <Choice selected={cap != null} onSelect={() => patch({ entitlement_cap_aed: cap ?? Math.max(offer, 0) })} title="Anything, up to a limit" sub="They choose from the menu" />
            </div>
            {cap != null ? (
              <div className="flex items-center gap-3 pt-1">
                <div className="relative w-[160px]">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    <DirhamSign />
                  </span>
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={cap || ''}
                    onChange={(e) => patch({ entitlement_cap_aed: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="pl-9 tabular-nums"
                    autoFocus
                  />
                </div>
                <span className="text-[13px] text-muted-foreground">per visit, including guests. We tell them before they come.</span>
              </div>
            ) : null}
          </div>

          <VisitWhen value={brief.visit_schedule ?? null} onChange={(v) => patch({ visit_schedule: v })} />
        </div>
      ) : null}
      {problemsFor(problems, 2).map((p) => (
        <Badge key={p.message}>
          <AlertCircle className="size-3.5" strokeWidth={2} />
          {p.message}
        </Badge>
      ))}
    </Question>
  )
}

const ANYTIME: VisitSchedule = { mode: 'anytime', slots: [], note: null }

/** When creators should come in: any day, or the set times the place can host them. */
function VisitWhen({ value, onChange }: { value: VisitSchedule | null; onChange: (v: VisitSchedule) => void }) {
  const s: VisitSchedule = value ?? ANYTIME
  const set = (p: Partial<VisitSchedule>) => onChange({ ...s, ...p })
  const onSlots = s.mode === 'slots'
  const slots = s.slots || []

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-sm text-muted-foreground">When should they come?</span>
      <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-2">
        <Choice selected={!onSlots} onSelect={() => set({ mode: 'anytime' })} title="Any time while it runs" sub="They pick a day within a week of approval" />
        <Choice selected={onSlots} onSelect={() => set({ mode: 'slots', slots })} title="At set times" sub="Pick the days and times you can host them" />
      </div>

      {onSlots ? (
        <div className="flex flex-col gap-4 pt-1">
          <VisitSlotsEditor slots={slots} onChange={(next) => set({ slots: next })} />
          {slots.length === 0 ? (
            <Badge tone="muted" className="w-fit">
              Add at least one time
            </Badge>
          ) : null}
          <Field label="Anything they should know, optional">
            <TextInput value={s.note ?? ''} onChange={(e) => set({ note: e.target.value || null })} placeholder="It's our grand opening" maxLength={120} />
          </Field>
        </div>
      ) : null}
    </div>
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

const SHOW_COMMON = ['The space and the vibe', 'Your signature item up close', 'Their first reaction', 'How to find you']
const SHOW_BY_KIND: Record<string, string[]> = {
  cafe: ['The coffee being made', 'The counter and pastries'],
  restaurant: ['The dish arriving at the table', 'The chef plating'],
  retail: ['Trying things on', 'The unboxing at home'],
  clinic: ['Before and after', 'The treatment room'],
  salon: ['Before and after', 'The finished look'],
  gym: ['A class in motion', 'The equipment and space'],
  supermarket: ['The aisle and the find', 'Cooking with it at home'],
}
const AVOID = ['Filming other guests', 'Staff faces without asking', 'Prices on screen', 'Other brands in shot', 'Filming in the kitchen', 'Discount codes']

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

export function StepBrief({ brief, patch, merchant, problems }: StepProps) {
  const kind = kindKey(brief.category || merchant.category)
  const show = brief.content_requirements || []
  const avoid = brief.things_to_avoid || []
  const showOptions = [...SHOW_COMMON, ...(SHOW_BY_KIND[kind] || []), ...show.filter((x) => !SHOW_COMMON.includes(x) && !(SHOW_BY_KIND[kind] || []).includes(x))]
  const avoidOptions = [...AVOID, ...avoid.filter((x) => !AVOID.includes(x))]
  const links = (brief.reference_links || []).filter((l) => !isMapLink(l))
  const mapLinks = (brief.reference_links || []).filter(isMapLink)
  const bad = problemsFor(problems, 4)

  return (
    <Question icon={PenLine} title="What should they show?" sub="Tap what fits. Creators read this on their phone on the way in.">
      <section className={cn('flex flex-col gap-3 rounded-2xl border bg-card p-5', bad.length && show.length === 0 ? 'border-destructive/50' : 'border-border')}>
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-medium">Show this</span>
          {show.length ? <Badge tone="good">{show.length} picked</Badge> : <Badge tone="muted">Pick at least one</Badge>}
        </div>
        <Chips options={showOptions} items={show} onToggle={(v) => patch({ content_requirements: toggle(show, v) })} />
        <ListEditor items={show} onChange={(v) => patch({ content_requirements: v })} placeholder="Something else, in a few words" showItems={false} />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <span className="text-[15px] font-medium">Please avoid</span>
        <Chips options={avoidOptions} items={avoid} onToggle={(v) => patch({ things_to_avoid: toggle(avoid, v) })} />
        <ListEditor items={avoid} onChange={(v) => patch({ things_to_avoid: v })} placeholder="Anything else to avoid" showItems={false} />
      </section>

      <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <Field label="Your Instagram handle" hint="Every post tags it">
          <ListEditor items={brief.mandatory_tags || []} onChange={(v) => patch({ mandatory_tags: v })} placeholder="yourhandle" prefix="@" max={3} />
        </Field>
        <Field label="Your hashtag" hint="Optional">
          <ListEditor items={brief.mandatory_hashtags || []} onChange={(v) => patch({ mandatory_hashtags: v })} placeholder="yourplace" prefix="#" max={5} />
        </Field>
      </section>

      <details className="group rounded-2xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium">
          More, optional
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">A line about you, links to copy</span>
        </summary>
        <div className="flex flex-col gap-5 pt-5">
          <Field label="A line about the place">
            <TextArea value={brief.description || ''} onChange={(e) => patch({ description: e.target.value })} placeholder="Family-run, specialty coffee, the best shakshuka in Al Quoz." />
          </Field>
          <Field label="Posts you liked, your menu, your Instagram">
            <ListEditor items={links} onChange={(v) => patch({ reference_links: [...mapLinks, ...v] })} placeholder="https://" max={5} />
          </Field>
        </div>
      </details>

      {bad.map((p) => (
        <Badge key={p.message}>
          <AlertCircle className="size-3.5" strokeWidth={2} />
          {p.message}
        </Badge>
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
