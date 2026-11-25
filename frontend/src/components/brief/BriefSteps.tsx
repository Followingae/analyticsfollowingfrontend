'use client'

/**
 * The nine steps of the brief. Each one is a short page of questions; nothing is required to
 * move on, because a brand that cannot answer one thing should still be able to send the rest.
 * What is missing is shown on the review, not enforced here.
 */
import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Instagram, Youtube, Ghost, MapPin, Plus, Trash2, Truck, Store, Package, Banknote, Gift,
  Layers, Building2, Ban, CalendarDays,
} from 'lucide-react'
import { TikTokGlyph } from '@/components/icons/PlatformIcon'
import {
  AGES, CATEGORIES, FORMATS, GENDERS, KPIS, LANGUAGES, MARKETS, OBJECTIVES, PLATFORM_LABEL,
  PLATFORM_ORDER, TIERS, TONES, USAGE,
  type BriefAnswers, type Deliverable, type Platform, type StepKey,
} from '@/lib/brandBrief'
import {
  AiTextArea, ChipGroup, ChoiceCard, Divider, EASE, Field, LIME, Section, Stepper, TagInput,
  TextArea, TextInput, Toggle, opts,
} from './ui'
import { cn } from '@/lib/utils'

export interface StepProps {
  a: BriefAnswers
  set: (path: string, value: unknown) => void
  ai: (path: string) => boolean
  assist: (field: string, text: string) => Promise<string[]>
}

const num = (v: string) => {
  const n = Number(String(v).replace(/[^\d.]/g, ''))
  return v.trim() === '' || Number.isNaN(n) ? null : Math.round(n)
}

export function PlatformMark({ p, className }: { p: Platform; className?: string }) {
  if (p === 'instagram') return <Instagram className={className} />
  if (p === 'youtube') return <Youtube className={className} />
  if (p === 'tiktok') return <TikTokGlyph className={className} />
  return <Ghost className={className} />
}

function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}
                    className="overflow-hidden">
          <div className="pt-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* 1. You */
function Contact({ a, set, ai }: StepProps) {
  const c = a.contact || {}
  return (
    <Section>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name" ai={ai('contact.name')}>
          <TextInput value={c.name} onChange={v => set('contact.name', v)} placeholder="Sara Ahmed" />
        </Field>
        <Field label="Your role" optional ai={ai('contact.role')}>
          <TextInput value={c.role} onChange={v => set('contact.role', v)} placeholder="Marketing Manager" />
        </Field>
        <Field label="Email" ai={ai('contact.email')}>
          <TextInput type="email" inputMode="email" value={c.email} onChange={v => set('contact.email', v)} placeholder="sara@brand.com" />
        </Field>
        <Field label="Phone" optional ai={ai('contact.phone')}>
          <TextInput type="tel" inputMode="tel" value={c.phone} onChange={v => set('contact.phone', v)} placeholder="+971 50 000 0000" />
        </Field>
      </div>
    </Section>
  )
}

/* 2. Campaign */
function Campaign({ a, set, ai, assist }: StepProps) {
  const c = a.campaign || {}
  return (
    <Section>
      <Field label="Campaign name" ai={ai('campaign.name')}>
        <TextInput value={c.name} onChange={v => set('campaign.name', v)} placeholder="Winter Menu Launch" />
      </Field>
      <Field label="What are we promoting?" ai={ai('campaign.product')}>
        <TextInput value={c.product} onChange={v => set('campaign.product', v)} placeholder="Our new winter menu at all Dubai branches" />
      </Field>
      <Field label="What is the goal?" ai={ai('campaign.objectives')}>
        <ChipGroup options={OBJECTIVES} value={c.objectives} onChange={v => set('campaign.objectives', v)} />
      </Field>
      <Field label="Background" optional ai={ai('campaign.background')}>
        <AiTextArea field="Campaign background" value={c.background} onChange={v => set('campaign.background', v)}
                    onAssist={assist} placeholder="New menu, 6 dishes, cosy winter feel, launching 1 Dec..." />
      </Field>
    </Section>
  )
}

/* 3. Audience */
function Audience({ a, set, ai, assist }: StepProps) {
  const x = a.audience || {}
  const others = (x.markets || []).filter(m => !MARKETS.includes(m))
  return (
    <Section>
      <Field label="Which countries?" ai={ai('audience.markets')}>
        <ChipGroup options={opts([...MARKETS, ...others])} value={x.markets} onChange={v => set('audience.markets', v)} />
      </Field>
      <Field label="Cities or areas" optional ai={ai('audience.cities')}>
        <TextInput value={x.cities} onChange={v => set('audience.cities', v)} placeholder="Dubai Marina, JBR, Riyadh" />
      </Field>
      <Field label="Age" ai={ai('audience.age_ranges')}>
        <ChipGroup options={opts(AGES)} value={x.age_ranges} onChange={v => set('audience.age_ranges', v)} />
      </Field>
      <div className="grid gap-9 sm:grid-cols-2">
        <Field label="Gender" ai={ai('audience.genders')}>
          <ChipGroup options={GENDERS} value={x.genders} onChange={v => set('audience.genders', v)} />
        </Field>
        <Field label="Language" ai={ai('audience.languages')}>
          <ChipGroup options={opts(LANGUAGES)} value={x.languages} onChange={v => set('audience.languages', v)} />
        </Field>
      </div>
      <Field label="Anything else" optional ai={ai('audience.notes')}>
        <AiTextArea field="Audience" rows={3} value={x.notes} onChange={v => set('audience.notes', v)} onAssist={assist}
                    placeholder="Young professionals, foodies, families with kids..." />
      </Field>
    </Section>
  )
}

/* 4. Creators */
function Creators({ a, set, ai }: StepProps) {
  const c = a.creators || {}
  const tiers = c.tiers || []
  const others = (c.categories || []).filter(x => !CATEGORIES.includes(x))
  return (
    <Section>
      <Field label="Size (followers)" ai={ai('creators.tiers')}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {TIERS.map(t => {
            const on = tiers.includes(t.key)
            return (
              <motion.button key={t.key} type="button" whileTap={{ scale: 0.97 }}
                             onClick={() => set('creators.tiers', on ? tiers.filter(x => x !== t.key) : [...tiers, t.key])}
                             className={cn('rounded-2xl border p-4 text-left transition-all duration-200',
                                           on ? 'border-transparent text-white' : 'border-white/10 bg-[#111] hover:border-white/30')}
                             style={on ? { background: LIME } : undefined}>
                <span className="flex gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className={cn('h-1.5 w-1.5 rounded-full',
                                                i < t.dots ? (on ? 'bg-black' : 'bg-white') : on ? 'bg-black/15' : 'bg-white/15')} />
                  ))}
                </span>
                <span className="mt-3 block text-[15px] font-semibold">{t.label}</span>
                <span className={cn('block text-[13px]', on ? 'text-white/90' : 'text-white/50')}>{t.range}</span>
              </motion.button>
            )
          })}
        </div>
      </Field>
      <Field label="Categories" ai={ai('creators.categories')}>
        <ChipGroup options={opts([...CATEGORIES, ...others])} value={c.categories} onChange={v => set('creators.categories', v)} />
      </Field>
      <div className="grid gap-9 sm:grid-cols-2">
        <Field label="How many" optional ai={ai('creators.count')}>
          <Stepper value={Number(c.count || 0)} onChange={n => set('creators.count', n || null)} max={500} />
        </Field>
        <Field label="Creator gender" optional ai={ai('creators.creator_gender')}>
          <ChipGroup single options={[{ key: 'women', label: 'Women' }, { key: 'men', label: 'Men' }, { key: 'mix', label: 'A mix' }]}
                     value={c.creator_gender} onChange={v => set('creators.creator_gender', v)} />
        </Field>
      </div>
      <Divider />
      <Field label="Creators you like" optional ai={ai('creators.liked_handles')}>
        <TagInput prefix="@" value={c.liked_handles} onChange={v => set('creators.liked_handles', v)} placeholder="@handle, then enter" />
      </Field>
      <Field label="Creators to avoid" optional ai={ai('creators.avoid_handles')}>
        <TagInput prefix="@" value={c.avoid_handles} onChange={v => set('creators.avoid_handles', v)} placeholder="@handle" />
      </Field>
      <Field label="Competitors to avoid" optional ai={ai('creators.avoid_brands')}>
        <TagInput value={c.avoid_brands} onChange={v => set('creators.avoid_brands', v)} placeholder="Brand name" />
      </Field>
      <Field label="Competitor exclusivity" optional ai={ai('creators.exclusivity_days')}>
        <ChipGroup single options={[{ key: '0', label: 'None' }, { key: '30', label: '30 days' }, { key: '60', label: '60 days' }, { key: '90', label: '90 days' }]}
                   value={c.exclusivity_days != null ? String(c.exclusivity_days) : null}
                   onChange={v => set('creators.exclusivity_days', v == null ? null : Number(v))} />
      </Field>
    </Section>
  )
}

/* 5. Platforms, deliverables, tagging */
function Content({ a, set, ai }: StepProps) {
  const platforms = a.platforms?.length ? a.platforms : ['instagram' as Platform]
  const dels = a.deliverables || []
  const t = a.tagging || {}
  const qty = (p: Platform, f: string) => dels.find(d => d.platform === p && d.format === f)?.quantity || 0
  const setQty = (p: Platform, f: string, n: number) => {
    const rest = dels.filter(d => !(d.platform === p && d.format === f))
    set('deliverables', n > 0 ? [...rest, { platform: p, format: f, quantity: n } as Deliverable] : rest)
  }
  const togglePlatform = (p: Platform) => {
    if (p === 'instagram') return
    const on = platforms.includes(p)
    set('platforms', on ? platforms.filter(x => x !== p) : [...platforms, p])
    if (on) set('deliverables', dels.filter(d => d.platform !== p))
  }
  const extra = platforms.some(p => p !== 'instagram')
  return (
    <Section>
      <Field label="Platforms" ai={ai('platforms')}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {PLATFORM_ORDER.map(p => {
            const on = platforms.includes(p)
            return (
              <motion.button key={p} type="button" whileTap={{ scale: 0.97 }} onClick={() => togglePlatform(p)}
                             className={cn('flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200',
                                           on ? 'border-white bg-[#111] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]'
                                              : 'border-white/10 bg-[#111] hover:border-white/30',
                                           p === 'instagram' && 'cursor-default')}>
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', on ? 'text-white' : 'bg-white/[0.07] text-white/50')}
                      style={on ? { background: LIME } : undefined}>
                  <PlatformMark p={p} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-white">{PLATFORM_LABEL[p]}</span>
                  <span className="block text-[12px] text-white/50">{p === 'instagram' ? 'Standard' : 'Priced separately'}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
        <Reveal show={extra}>
          <p className="rounded-2xl bg-white/[0.04] px-4 py-3 text-[13px] leading-relaxed text-white/60">
            Cross-posting to TikTok, Snapchat or YouTube is priced separately.
          </p>
        </Reveal>
      </Field>

      <Field label="Posts per creator" ai={ai('deliverables')}>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {platforms.map(p => (
              <motion.div key={p} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 text-[14px] font-semibold">
                  <PlatformMark p={p} className="h-4 w-4" />{PLATFORM_LABEL[p]}
                </div>
                <div className="divide-y divide-neutral-100">
                  {FORMATS[p].map(f => {
                    const n = qty(p, f.key)
                    return (
                      <div key={f.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <span className="flex items-center gap-3 text-[15px]">
                          <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-colors', n ? 'text-white' : 'bg-white/[0.07] text-white/50')}
                                style={n ? { background: LIME } : undefined}>
                            <f.icon className="h-4 w-4" />
                          </span>
                          {f.label}
                        </span>
                        <Stepper value={n} onChange={v => setQty(p, f.key, v)} max={30} />
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Field>

      <Divider />
      <Field label="Accounts to tag" ai={ai('tagging.accounts')}>
        <TagInput prefix="@" value={t.accounts} onChange={v => set('tagging.accounts', v)} placeholder="@yourbrand" />
      </Field>
      <Field label="Hashtags" optional ai={ai('tagging.hashtags')}>
        <TagInput prefix="#" value={t.hashtags} onChange={v => set('tagging.hashtags', v)} placeholder="#yourcampaign" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle checked={t.collab_post} onChange={v => set('tagging.collab_post', v)} label="Instagram collab post" />
        <Toggle checked={t.link_sticker} onChange={v => set('tagging.link_sticker', v)} label="Link sticker in stories" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Promo code" optional ai={ai('tagging.promo_code')}>
          <TextInput value={t.promo_code} onChange={v => set('tagging.promo_code', v)} placeholder="WINTER20" />
        </Field>
        <Field label="Link" optional ai={ai('tagging.link')}>
          <TextInput type="url" inputMode="url" value={t.link} onChange={v => set('tagging.link', v)} placeholder="https://" />
        </Field>
      </div>
    </Section>
  )
}

/* 6. Visit */
function Visit({ a, set, ai, assist }: StepProps) {
  const v = a.visit || {}
  const locs = v.locations?.length ? v.locations : [{}]
  const setLoc = (i: number, k: string, val: string) =>
    set('visit.locations', locs.map((l, j) => (j === i ? { ...l, [k]: val } : l)))
  return (
    <Section>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard icon={Store} title="Yes, they visit us" sub="Store, restaurant, hotel or event"
                    selected={v.needed === true} onClick={() => set('visit.needed', true)} />
        <ChoiceCard icon={Ban} title="No visit needed" sub="Content made anywhere"
                    selected={v.needed === false} onClick={() => set('visit.needed', false)} />
      </div>
      <Reveal show={v.needed === true}>
        <div className="space-y-9">
          <Field label="Where?" ai={ai('visit.locations')}>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {locs.map((l, i) => (
                  <motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                              className="space-y-2.5 rounded-2xl border border-white/10 bg-[#111] p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-white/60">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <TextInput className="flex-1" value={l.name} onChange={val => setLoc(i, 'name', val)} placeholder="Branch name, e.g. Dubai Mall" />
                      {locs.length > 1 && (
                        <button type="button" aria-label="Remove location" onClick={() => set('visit.locations', locs.filter((_, j) => j !== i))}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white/80">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <TextInput value={l.address} onChange={val => setLoc(i, 'address', val)} placeholder="Address" />
                    <TextInput type="url" value={l.map_url} onChange={val => setLoc(i, 'map_url', val)} placeholder="Google Maps link (optional)" />
                  </motion.div>
                ))}
              </AnimatePresence>
              <button type="button" onClick={() => set('visit.locations', [...locs, {}])}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed border-white/20 px-4 text-[14px] font-medium text-white/80 hover:border-white/40">
                <Plus className="h-4 w-4" />Add a location
              </button>
            </div>
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Days and times" optional ai={ai('visit.when')}>
              <TextInput value={v.when} onChange={val => set('visit.when', val)} placeholder="Weekdays, 12pm to 6pm" />
            </Field>
            <Field label="How do they book?" optional ai={ai('visit.booking')}>
              <TextInput value={v.booking} onChange={val => set('visit.booking', val)} placeholder="WhatsApp the manager a day before" />
            </Field>
          </div>
          <Field label="Guests they can bring" optional ai={ai('visit.guests')}>
            <Stepper value={Number(v.guests || 0)} onChange={n => set('visit.guests', n)} max={6} />
          </Field>
          <Field label="At the visit" optional ai={ai('visit.details')}>
            <AiTextArea field="Visit details" rows={3} value={v.details} onChange={val => set('visit.details', val)} onAssist={assist}
                        placeholder="They try the tasting menu, film the open kitchen..." />
          </Field>
        </div>
      </Reveal>
    </Section>
  )
}

/* 7. Budget, barter, usage */
function Budget({ a, set, ai }: StepProps) {
  const c = a.compensation || {}
  const u = a.usage || {}
  const items = c.barter_items?.length ? c.barter_items : [{ name: '' }]
  const setItem = (i: number, k: string, val: unknown) =>
    set('compensation.barter_items', items.map((x, j) => (j === i ? { ...x, [k]: val } : x)))
  const paid = c.mode === 'paid' || c.mode === 'both'
  const barter = c.mode === 'barter' || c.mode === 'both'
  return (
    <Section>
      <Field label="Creators get" ai={ai('compensation.mode')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <ChoiceCard icon={Banknote} title="Paid" selected={c.mode === 'paid'} onClick={() => set('compensation.mode', 'paid')} />
          <ChoiceCard icon={Gift} title="Barter" selected={c.mode === 'barter'} onClick={() => set('compensation.mode', 'barter')} />
          <ChoiceCard icon={Layers} title="Both" selected={c.mode === 'both'} onClick={() => set('compensation.mode', 'both')} />
        </div>
      </Field>

      <Reveal show={paid}>
        <div className="space-y-6">
          <Field label="Budget" ai={ai('compensation.budget_aed')}>
            <TextInput prefix="AED" inputMode="numeric" value={c.budget_aed ? Number(c.budget_aed).toLocaleString('en') : ''}
                       onChange={v => set('compensation.budget_aed', num(v))} placeholder="25,000" />
            <div className="flex flex-wrap gap-2 pt-1">
              {[10000, 25000, 50000, 100000].map(n => (
                <button key={n} type="button" onClick={() => set('compensation.budget_aed', n)}
                        className="h-8 rounded-full bg-white/[0.07] px-3 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[0.12]">
                  {n.toLocaleString('en')}
                </button>
              ))}
            </div>
          </Field>
          <ChipGroup single options={[{ key: 'campaign', label: 'For the whole campaign' }, { key: 'monthly', label: 'Every month' }]}
                     value={c.budget_kind || 'campaign'} onChange={v => set('compensation.budget_kind', v || 'campaign')} />
          <Field label="Budget notes" optional>
            <TextInput value={c.budget_notes} onChange={v => set('compensation.budget_notes', v)} placeholder="Includes VAT, flexible for the right creators..." />
          </Field>
        </div>
      </Reveal>

      <Reveal show={barter}>
        <div className="space-y-6">
          <Field label="Items per creator" ai={ai('compensation.barter_items')}>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((it, i) => (
                  <motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                              className="space-y-2.5 rounded-2xl border border-white/10 bg-[#111] p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-white/60">
                        <Package className="h-4 w-4" />
                      </span>
                      <TextInput className="flex-1" value={it.name} onChange={v => setItem(i, 'name', v)} placeholder="Dinner for two" />
                      {items.length > 1 && (
                        <button type="button" aria-label="Remove item" onClick={() => set('compensation.barter_items', items.filter((_, j) => j !== i))}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white/80">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-[160px_1fr]">
                      <TextInput prefix="AED" inputMode="numeric" value={it.value_aed ?? ''} onChange={v => setItem(i, 'value_aed', num(v))} placeholder="Value" />
                      <TextInput value={it.description} onChange={v => setItem(i, 'description', v)} placeholder="Details, e.g. any 2 mains and drinks" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button type="button" onClick={() => set('compensation.barter_items', [...items, { name: '' }])}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed border-white/20 px-4 text-[14px] font-medium text-white/80 hover:border-white/40">
                <Plus className="h-4 w-4" />Add an item
              </button>
            </div>
          </Field>
          <Field label="How they get it" ai={ai('compensation.fulfilment_mode')}>
            <div className="grid gap-3 sm:grid-cols-3">
              <ChoiceCard icon={Truck} title="We deliver" selected={c.fulfilment_mode === 'delivery'} onClick={() => set('compensation.fulfilment_mode', 'delivery')} />
              <ChoiceCard icon={Store} title="They visit" selected={c.fulfilment_mode === 'dine_in'} onClick={() => set('compensation.fulfilment_mode', 'dine_in')} />
              <ChoiceCard icon={Building2} title="They pick up" selected={c.fulfilment_mode === 'pickup'} onClick={() => set('compensation.fulfilment_mode', 'pickup')} />
            </div>
          </Field>
        </div>
      </Reveal>

      <Divider />
      <Field label="Content usage" ai={ai('usage.rights')}>
        <div className="grid gap-3 sm:grid-cols-3">
          {USAGE.map(o => (
            <ChoiceCard key={o.key} title={o.label} sub={o.sub} selected={u.rights === o.key} onClick={() => set('usage.rights', o.key)} />
          ))}
        </div>
      </Field>
      <Reveal show={u.rights === 'paid_ads' || u.rights === 'full_buyout'}>
        <div className="space-y-6">
          <Field label="For how long?">
            <ChipGroup single options={[{ key: '30', label: '30 days' }, { key: '60', label: '60 days' }, { key: '90', label: '90 days' }, { key: '180', label: '6 months' }, { key: '365', label: '1 year' }]}
                       value={u.days ? String(u.days) : null} onChange={v => set('usage.days', v ? Number(v) : null)} />
          </Field>
          <Toggle checked={u.raw_footage} onChange={v => set('usage.raw_footage', v)} label="Raw footage needed" />
        </div>
      </Reveal>
    </Section>
  )
}

/* 8. Creative */
function Creative({ a, set, ai, assist }: StepProps) {
  const c = a.content || {}
  return (
    <Section>
      <Field label="Key messages" ai={ai('campaign.key_messages')}>
        <AiTextArea field="Key messages" value={a.campaign?.key_messages} onChange={v => set('campaign.key_messages', v)} onAssist={assist}
                    placeholder="Freshly made, new winter flavours, only until February..." />
      </Field>
      <Field label="Must include" ai={ai('content.dos')}>
        <AiTextArea field="Do (must include)" value={c.dos} onChange={v => set('content.dos', v)} onAssist={assist}
                    placeholder="Show the dish being served, say the price, tag the branch..." />
      </Field>
      <Field label="Must avoid" ai={ai('content.donts')}>
        <AiTextArea field="Don't (must avoid)" rows={3} value={c.donts} onChange={v => set('content.donts', v)} onAssist={assist}
                    placeholder="No competitor logos, no alcohol in frame..." />
      </Field>
      <Field label="Tone" optional ai={ai('content.tones')}>
        <ChipGroup options={opts(TONES)} value={c.tones} onChange={v => set('content.tones', v)} />
      </Field>
      <Field label="References" optional ai={ai('content.references')}>
        <TagInput value={c.references} onChange={v => set('content.references', v)} placeholder="Paste a link, then enter" />
      </Field>
      <Field label="Brand guidelines" optional ai={ai('content.guidelines_link')}>
        <TextInput type="url" value={c.guidelines_link} onChange={v => set('content.guidelines_link', v)} placeholder="Link to a drive folder or PDF" />
      </Field>
      <Toggle checked={c.approval_required} onChange={v => set('content.approval_required', v)}
              label="We approve content first" />
    </Section>
  )
}

/* 9. Timing and success */
function Timeline({ a, set, ai }: StepProps) {
  const t = a.timeline || {}
  const s = a.success || {}
  return (
    <Section>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Content live from" ai={ai('timeline.live_from')}>
          <DateInput value={t.live_from} onChange={v => set('timeline.live_from', v)} />
        </Field>
        <Field label="Until" ai={ai('timeline.live_to')}>
          <DateInput value={t.live_to} onChange={v => set('timeline.live_to', v)} />
        </Field>
      </div>
      <Toggle checked={t.dates_firm} onChange={v => set('timeline.dates_firm', v)} label="Dates are fixed" />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Proposal needed by" optional ai={ai('timeline.proposal_by')}>
          <DateInput value={t.proposal_by} onChange={v => set('timeline.proposal_by', v)} />
        </Field>
        <Field label="Key dates" optional ai={ai('timeline.key_dates')}>
          <TextInput value={t.key_dates} onChange={v => set('timeline.key_dates', v)} placeholder="Launch event on 3 Dec" />
        </Field>
      </div>
      <Divider />
      <Field label="Success means" ai={ai('success.kpis')}>
        <ChipGroup options={KPIS} value={s.kpis} onChange={v => set('success.kpis', v)} />
      </Field>
      <Field label="Reporting" optional ai={ai('success.reporting')}>
        <TextInput value={s.reporting} onChange={v => set('success.reporting', v)} placeholder="Screenshots of story insights after 48 hours" />
      </Field>
      <Field label="Anything else" optional ai={ai('success.anything_else')}>
        <TextArea rows={3} value={s.anything_else} onChange={v => set('success.anything_else', v)} placeholder="" />
      </Field>
    </Section>
  )
}

function DateInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input type="date" value={value || ''} onChange={e => onChange(e.target.value)}
             className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#111] pl-11 pr-4 text-[15px] text-white outline-none transition-[border-color,box-shadow] focus:border-white/60 focus:shadow-[0_0_0_4px_rgba(211,255,2,0.45)]" />
    </div>
  )
}

export const STEP_VIEW: Record<StepKey, (p: StepProps) => React.ReactElement> = {
  contact: Contact, campaign: Campaign, audience: Audience, creators: Creators,
  content: Content, visit: Visit, budget: Budget, creative: Creative, timeline: Timeline,
}


