'use client'

/**
 * Writing the brief.
 *
 * Three groups, in the order the questions get asked in a room: what the client wants, what
 * we are offering, what we need back. The flat form this replaces put the budget between the
 * follower range and the deliverables, which is three different subjects in three adjacent
 * rows, and reads as a settings screen rather than as a decision anyone is making.
 *
 * Dynamic means absent, not greyed out. A cash brief never renders a barter field. A brief
 * that only wants Instagram never renders TikTok formats. A disabled input still costs the
 * reader the moment it takes to work out why it is disabled, and a founder writing a
 * straightforward cash Instagram brief should see the same short form they saw before.
 *
 * The component owns no state. It takes a brief and hands back a new one, so the create
 * dialog and the edit dialog on the area screen are the same fields, and a field added here
 * appears in both by construction.
 */
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import type { AreaBrief, BriefDeliverable, BriefPlatform } from '@/services/imdListsApi'
import {
  PLATFORMS, PLATFORM_LABEL, PLATFORM_FORMATS, briefDeliverables, legacyDeliverables,
  compMode, barterValue, briefLine, briefGaps,
} from '@/lib/areaBrief'

/** A group of fields under an eyebrow. The hairline above is the separation, not a box. */
function Group({ title, hint, children }: {
  title: string; hint?: string; children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-ds-3 border-t pt-ds-3">
      <div className="flex flex-col gap-ds-1">
        <p className="text-ds-overline uppercase text-muted-foreground">{title}</p>
        {hint && <p className="text-ds-caption text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-ds-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

/** A toggle chip. On means the thing is asked for; off means it is not in the brief at all. */
function Chip({ on, onClick, children }: {
  on: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <Button type="button" size="sm" variant={on ? 'default' : 'outline'}
            className="h-7 rounded-ds-full px-3 text-xs capitalize" onClick={onClick}>
      {children}
    </Button>
  )
}

const num = (v: string) => (v ? Number(v) : undefined)
const csv = (v: string) => v.split(',').map(x => x.trim()).filter(Boolean)

export function BriefFields({ brief, onChange }: {
  brief: AreaBrief
  onChange: (b: AreaBrief) => void
}) {
  const set = (patch: Partial<AreaBrief>) => onChange({ ...brief, ...patch })

  const mode = compMode(brief)
  const specs = briefDeliverables(brief)

  /**
   * Which platforms are on screen. Seeded from what the brief already asks for, so reopening
   * a TikTok brief shows the TikTok row. Instagram is on by default because it is the answer
   * nine times out of ten, and a founder who only wants Instagram never touches this row.
   */
  const [platforms, setPlatforms] = React.useState<BriefPlatform[]>(() => {
    const used = Array.from(new Set(specs.map(s => s.platform)))
    return used.length ? used as BriefPlatform[] : ['instagram']
  })

  /* Specs are the source of truth; `deliverables` is written alongside on every change so
     an older reader of the brief still sees a sensible list rather than nothing. */
  const writeSpecs = (next: BriefDeliverable[]) =>
    set({ deliverable_specs: next, deliverables: legacyDeliverables(next) })

  const toggleFormat = (platform: BriefPlatform, format: string) => {
    const has = specs.some(s => s.platform === platform && s.format === format)
    writeSpecs(has
      ? specs.filter(s => !(s.platform === platform && s.format === format))
      : [...specs, { platform, format, quantity: 1 }])
  }

  const setQuantity = (platform: BriefPlatform, format: string, quantity: number) =>
    writeSpecs(specs.map(s =>
      s.platform === platform && s.format === format ? { ...s, quantity } : s))

  const togglePlatform = (p: BriefPlatform) => {
    if (platforms.includes(p)) {
      /* Turning a platform off removes what it was asking for. Leaving the asks behind
         while hiding the row is how a brief goes out promising a TikTok video nobody
         remembers agreeing to. */
      setPlatforms(platforms.filter(x => x !== p))
      writeSpecs(specs.filter(s => s.platform !== p))
    } else {
      setPlatforms([...platforms, p])
    }
  }

  const items = brief.barter_items || []
  const setItems = (next: typeof items) => set({ barter_items: next })

  const line = briefLine(brief)
  const gaps = briefGaps(brief)

  return (
    <div className="flex flex-col gap-ds-4">
      <Group title="What the client wants" hint="Who we are going out to find, and for whom.">
        <div className="grid grid-cols-2 gap-ds-3">
          <Field label="How many">
            <Input type="number" min={1} placeholder="8" value={brief.target_count ?? ''}
                   onChange={e => set({ target_count: num(e.target.value) })} />
          </Field>
          <Field label="Market">
            <Input placeholder="UAE" value={brief.market ?? ''}
                   onChange={e => set({ market: e.target.value })} />
          </Field>
        </div>
        <Field label="Categories">
          <Input placeholder="food, lifestyle" value={(brief.categories ?? []).join(', ')}
                 onChange={e => set({ categories: csv(e.target.value) })} />
        </Field>
        <div className="grid grid-cols-2 gap-ds-3">
          <Field label="Followers from">
            <Input type="number" placeholder="20000" value={brief.followers_min ?? ''}
                   onChange={e => set({ followers_min: num(e.target.value) })} />
          </Field>
          <Field label="to">
            <Input type="number" placeholder="100000" value={brief.followers_max ?? ''}
                   onChange={e => set({ followers_max: num(e.target.value) })} />
          </Field>
        </div>
        {/* Follower count is the creator's size. This is the brand's target, and the two
            disagree often enough that a manager needs both before she picks anyone. */}
        <Field label="Audience the brand wants reached">
          <Input placeholder="mothers 25 to 40 in Dubai" value={brief.audience ?? ''}
                 onChange={e => set({ audience: e.target.value })} />
        </Field>
      </Group>

      <Group title="What we are offering"
             hint="What a creator is being asked to say yes to.">
        <div className="flex flex-wrap gap-ds-1">
          {(['cash', 'barter', 'both'] as const).map(m => (
            <Chip key={m} on={mode === m}
                  onClick={() => set({ comp_mode: m })}>
              {m === 'both' ? 'Cash and barter' : m}
            </Chip>
          ))}
        </div>

        {mode !== 'barter' && (
          /* The client's number, and which kind of number it is.
             There is no per-creator field here on purpose. Every creator in the master
             database already carries a rate with the margin a superadmin set on it, and a
             creator the talent team soft-adds is waiting on a superadmin for a sell price.
             A figure typed here would be a second source for the same fact, reconciled
             against nothing, and it would be the one people quote. */
          <div className="flex flex-col gap-ds-2">
            <div className="grid grid-cols-2 gap-ds-3">
              <Field label="The client's budget (AED)">
                <Input type="number" placeholder="50000" value={brief.client_budget ?? ''}
                       onChange={e => set({ client_budget: num(e.target.value) })} />
              </Field>
              <Field label="Which kind">
                <Select value={brief.client_budget_kind ?? 'campaign'}
                        onValueChange={(v: string) =>
                          set({ client_budget_kind: v as 'campaign' | 'monthly' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign">For this campaign</SelectItem>
                    <SelectItem value="monthly">Every month</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-ds-caption text-muted-foreground">
              What they told us they have. What each creator costs comes from their record in
              the database, so it is never written here.
            </p>
            {/* An area released before the ruling still holds a per-creator figure. It is
                shown so nobody wonders where it went, and it cannot be edited back into
                existence. */}
            {brief.budget_per_creator ? (
              <p className="text-ds-caption text-muted-foreground">
                This brief was written with AED{' '}
                {Number(brief.budget_per_creator).toLocaleString('en-US')} per creator on it.
                That is kept as written. New briefs take rates from the database instead.
              </p>
            ) : null}
          </div>
        )}

        {mode !== 'cash' && (
          <div className="flex flex-col gap-ds-2">
            <Label className="text-xs">What they get</Label>
            {items.length === 0 && (
              <p className="text-ds-caption text-muted-foreground">
                Nothing listed yet. A barter brief with no package is a brief nobody can pitch.
              </p>
            )}
            {items.map((it, i) => (
              <div key={i} className="flex items-start gap-ds-2">
                <Input className="flex-1" placeholder="Dinner for two" value={it.name ?? ''}
                       onChange={e => setItems(items.map((x, j) =>
                         j === i ? { ...x, name: e.target.value } : x))} />
                <Input className="w-28" type="number" placeholder="Value AED"
                       value={it.value_aed ?? ''}
                       onChange={e => setItems(items.map((x, j) =>
                         j === i ? { ...x, value_aed: num(e.target.value) } : x))} />
                <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0"
                        onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-ds-3">
              <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-3 text-xs"
                      onClick={() => setItems([...items, { name: '' }])}>
                <Plus className="h-3 w-3" />Add an item
              </Button>
              {barterValue(brief) > 0 && (
                <span className="text-ds-caption text-muted-foreground">
                  Worth AED {barterValue(brief).toLocaleString('en-US')} to each creator
                </span>
              )}
            </div>
            {/* Delivery or a visit is not a detail: it decides whether the manager needs a
                shipping address or a date, and it is the same choice the FA campaign makes. */}
            <Field label="How they get it">
              <Select value={brief.fulfilment_mode ?? 'delivery'}
                      onValueChange={(v: string) =>
                        set({ fulfilment_mode: v as 'delivery' | 'dine_in' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">We send it to them</SelectItem>
                  <SelectItem value="dine_in">They visit</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </Group>

      <Group title="What we need back"
             hint="What a creator is quoting against, and what we do with it afterwards.">
        <div className="flex flex-col gap-ds-2">
          <Label className="text-xs">Platforms</Label>
          <div className="flex flex-wrap gap-ds-1">
            {PLATFORMS.map(p => (
              <Chip key={p} on={platforms.includes(p)} onClick={() => togglePlatform(p)}>
                {PLATFORM_LABEL[p]}
              </Chip>
            ))}
          </div>
        </div>

        {platforms.map(p => (
          <div key={p} className="flex flex-col gap-ds-2">
            <Label className="text-xs">{PLATFORM_LABEL[p]}</Label>
            <div className="flex flex-wrap items-center gap-ds-2">
              {PLATFORM_FORMATS[p].map(f => {
                const spec = specs.find(s => s.platform === p && s.format === f)
                return (
                  <div key={f} className="flex items-center gap-ds-1">
                    <Chip on={!!spec} onClick={() => toggleFormat(p, f)}>{f}</Chip>
                    {spec && (
                      /* The number is the ask. "Reels" without one is how a manager and a
                         creator agree to two different jobs at the same price. */
                      <Input type="number" min={1} value={spec.quantity}
                             aria-label={`How many ${PLATFORM_LABEL[p]} ${f}`}
                             className="h-7 w-14 px-2 text-xs"
                             onChange={e => setQuantity(p, f, Math.max(1, Number(e.target.value) || 1))} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-ds-3">
          {/* Usage is the biggest single reason a quote moves, so it is asked at brief time
              rather than discovered at negotiation. "Paid media or organic" is not a separate
              question: it is which of these three we picked. */}
          <Field label="Usage rights">
            <Select value={brief.usage_rights ?? ''}
                    onValueChange={(v: string) =>
                      set({ usage_rights: v as AreaBrief['usage_rights'] })}>
              <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="organic">Organic only, they post it</SelectItem>
                <SelectItem value="paid_ads">We may run it as an ad</SelectItem>
                <SelectItem value="full_buyout">Full buyout</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {brief.usage_rights && brief.usage_rights !== 'organic' && (
            <Field label="For how long (days)">
              <Input type="number" placeholder="30" value={brief.usage_days ?? ''}
                     onChange={e => set({ usage_days: num(e.target.value) })} />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-ds-3">
          <Field label="Goes live from">
            <Input type="date" value={brief.live_from ?? ''}
                   onChange={e => set({ live_from: e.target.value || undefined })} />
          </Field>
          <Field label="to">
            <Input type="date" value={brief.live_to ?? ''}
                   onChange={e => set({ live_to: e.target.value || undefined })} />
          </Field>
        </div>
        {(brief.live_from || brief.live_to) && (
          /* Whether the window can move is the question a manager is asked by the first
             creator who is busy that week, and the one she currently has to come back for. */
          <label className="flex items-center gap-ds-2 text-ds-caption">
            <Checkbox checked={!!brief.dates_firm}
                      onCheckedChange={(v: boolean | 'indeterminate') =>
                        set({ dates_firm: v === true })} />
            <span>These dates cannot move</span>
          </label>
        )}

        <div className="grid grid-cols-2 gap-ds-3">
          {/* Exclusivity and the brands to avoid are the two things that disqualify a creator
              before anyone looks at their rate, so they belong in front of the manager
              rather than in a contract she has not been sent yet. */}
          <Field label="Brands to avoid">
            <Input placeholder="McDonalds, KFC" value={(brief.avoid_brands ?? []).join(', ')}
                   onChange={e => set({ avoid_brands: csv(e.target.value) })} />
          </Field>
          <Field label="Exclusivity (days)">
            <Input type="number" placeholder="30" value={brief.exclusivity_days ?? ''}
                   onChange={e => set({ exclusivity_days: num(e.target.value) })} />
          </Field>
        </div>

        <Field label="Anything else">
          <Textarea rows={2} placeholder="Optional. Context the fields above cannot carry."
                    value={brief.notes ?? ''}
                    onChange={e => set({ notes: e.target.value })} />
        </Field>
      </Group>

      {/* The sentence, live, because it is what the recipient reads and the writer should
          see it before they send it. Gaps are named rather than left out: a brief with no
          budget and a brief that forgot the budget produce the same sentence otherwise. */}
      <div className="flex flex-col gap-ds-1 border-t pt-ds-3">
        <p className="text-ds-overline uppercase text-muted-foreground">They will read</p>
        {line
          ? <p className="text-ds-body">{line}</p>
          : <p className="text-ds-caption text-muted-foreground">
              Nothing yet. Released like this, the alert says there is no brief.
            </p>}
        {gaps.length > 0 && (
          <p className="text-ds-caption text-[var(--tone-warn-ink)]">
            Not said: {gaps.join(', ')}.
          </p>
        )}
      </div>
    </div>
  )
}
