'use client'

/**
 * The brief, read rather than written.
 *
 * The one-line summary is the right thing for a card and for an alert, because it is glanced
 * at. It is the wrong thing for the screen where the work actually happens: a manager on the
 * area is about to write to a creator, and she needs the usage term, the go-live window and
 * the brands to avoid as separate facts she can check, not as clauses in a sentence she has
 * to parse. So the area screen gets the whole brief, laid out in the three groups it was
 * written in.
 *
 * Anything absent is absent. There is no "not set" row, no placeholder and no greyed-out
 * label: an empty row is a line the eye has to read to learn nothing. What is missing is
 * said once, at the bottom, in the manager's own terms.
 */
import * as React from 'react'
import { Aed } from '@/components/console/primitives'
import type { AreaBrief } from '@/services/imdListsApi'
import {
  briefDeliverables, deliverableLabel, compMode, barterValue,
  USAGE_LABEL, FULFILMENT_LABEL, BUDGET_KIND_TAIL, briefGaps,
} from '@/lib/areaBrief'

const fmtDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** One fact. Rendered only when there is one: `Fact` with no value renders nothing at all. */
function Fact({ label, children }: { label: string; children?: React.ReactNode }) {
  if (children === null || children === undefined || children === '' || children === false) return null
  return (
    <div className="flex flex-col gap-ds-1">
      <p className="text-ds-overline uppercase text-muted-foreground">{label}</p>
      <div className="text-ds-body">{children}</div>
    </div>
  )
}

/**
 * A group, present only when it has something in it.
 *
 * `show` is passed rather than inferred from the children. A `Fact` that decides to render
 * nothing is still a React element, and an element is truthy, so counting children would
 * have said every group was full and drawn three headings over an empty screen.
 */
function Block({ title, show, children }: {
  title: string; show: boolean; children: React.ReactNode
}) {
  if (!show) return null
  return (
    <div className="flex flex-col gap-ds-3">
      <p className="text-ds-label">{title}</p>
      <div className="grid gap-ds-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

export function BriefDetail({ brief, dueAt }: { brief?: AreaBrief | null; dueAt?: string | null }) {
  const b = brief || {}
  const mode = compMode(b)
  const delivs = briefDeliverables(b)
  const gaps = briefGaps(b)
  const barter = barterValue(b)

  const size = b.followers_min && b.followers_max
    ? `${b.followers_min.toLocaleString('en-US')} to ${b.followers_max.toLocaleString('en-US')}`
    : b.followers_min ? `${b.followers_min.toLocaleString('en-US')} and up`
    : b.followers_max ? `up to ${b.followers_max.toLocaleString('en-US')}` : ''

  const cats = (b.categories || []).filter(Boolean)
  const lookingFor = (b.target_count || cats.length)
    ? [b.target_count ? String(b.target_count) : '', cats.join(', '), 'creators']
        .filter(Boolean).join(' ')
    : ''

  const live = b.live_from || b.live_to
    ? (b.live_from && b.live_to
        ? `${fmtDate(b.live_from)} to ${fmtDate(b.live_to)}`
        : (b.live_from ? `from ${fmtDate(b.live_from)}` : `by ${fmtDate(b.live_to)}`))
    : ''

  const items = b.barter_items || []
  const avoid = (b.avoid_brands || []).filter(Boolean)
  const due = fmtDate(dueAt || undefined)

  const hasWants = !!(lookingFor || b.market || size || b.audience)
  const hasOffer = !!((mode !== 'barter' && (b.client_budget || b.budget_per_creator))
    || (mode !== 'cash' && (items.length || barter > 0 || b.fulfilment_mode)))
  const hasBack = !!(delivs.length || b.usage_rights || live || due
    || avoid.length || b.exclusivity_days)

  /* Nothing written at all is its own state, and not the same as a brief that is merely
     thin. Saying so is what tells the manager to go and ask rather than to start guessing. */
  if (!hasWants && !hasOffer && !hasBack && !b.notes) {
    return (
      <p className="text-ds-caption text-muted-foreground">
        No brief was written. Ask whoever released this brand what they are looking for
        before you contact anyone.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-ds-4">
      <Block title="What the client wants" show={hasWants}>
        {/* The bare word "creators" is not an answer, so a brief that says neither a number
            nor a category shows no row rather than a row saying nothing. */}
        <Fact label="Looking for">{lookingFor}</Fact>
        <Fact label="Market">{b.market}</Fact>
        <Fact label="Creator size">{size}</Fact>
        <Fact label="Audience to reach">{b.audience}</Fact>
      </Block>

      <Block title="What we are offering" show={hasOffer}>
        {/* The client's own number, and which kind it is. A campaign total and a monthly
            retainer are spent differently, so the figure never stands on its own. */}
        {mode !== 'barter' && b.client_budget ? (
          <Fact label="The client's budget">
            <span className="flex flex-wrap items-baseline gap-ds-2">
              <Aed>{Number(b.client_budget).toLocaleString('en-US')}</Aed>
              <span className="text-muted-foreground">
                {BUDGET_KIND_TAIL[b.client_budget_kind || 'campaign']}
              </span>
            </span>
          </Fact>
        ) : null}
        {/* Retired, and read only for the areas that already carry it. Nothing writes this
            any more: a creator's rate lives on the creator. */}
        {mode !== 'barter' && b.budget_per_creator ? (
          <Fact label="Per creator, as written at release">
            <Aed>{Number(b.budget_per_creator).toLocaleString('en-US')}</Aed>
          </Fact>
        ) : null}
        {mode !== 'cash' && items.length ? (
          <Fact label="What they get">
            <ul className="flex flex-col gap-ds-1">
              {items.map((it, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-ds-2">
                  <span>{it.name || 'Unnamed item'}</span>
                  {it.value_aed ? (
                    <span className="text-muted-foreground">
                      <Aed>{Number(it.value_aed).toLocaleString('en-US')}</Aed>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Fact>
        ) : null}
        {mode !== 'cash' && barter > 0 ? (
          <Fact label="Package worth">
            <Aed>{barter.toLocaleString('en-US')}</Aed>
          </Fact>
        ) : null}
        {mode !== 'cash' && b.fulfilment_mode ? (
          <Fact label="How they get it">
            {FULFILMENT_LABEL[b.fulfilment_mode] || b.fulfilment_mode}
          </Fact>
        ) : null}
      </Block>

      <Block title="What we need back" show={hasBack}>
        <Fact label="Deliverables">
          {delivs.length ? delivs.map(deliverableLabel).join(', ') : ''}
        </Fact>
        <Fact label="Usage rights">
          {b.usage_rights
            ? `${USAGE_LABEL[b.usage_rights] || b.usage_rights}${b.usage_days ? `, ${b.usage_days} days` : ''}`
            : ''}
        </Fact>
        <Fact label="Goes live">
          {live ? `${live}${b.dates_firm ? ' · these dates cannot move' : ''}` : ''}
        </Fact>
        <Fact label="Wanted back by">{due}</Fact>
        <Fact label="Brands to avoid">{avoid.join(', ')}</Fact>
        <Fact label="Exclusivity">
          {b.exclusivity_days ? `${b.exclusivity_days} days` : ''}
        </Fact>
      </Block>

      {b.notes ? (
        <div className="flex flex-col gap-ds-1">
          <p className="text-ds-overline uppercase text-muted-foreground">Anything else</p>
          <p className="text-ds-body whitespace-pre-wrap">{b.notes}</p>
        </div>
      ) : null}

      {gaps.length > 0 && (
        /* Said once, plainly, rather than as six empty rows. She now knows what to ask for
           instead of assuming the answer was "none". */
        <p className="text-ds-caption text-[var(--tone-warn-ink)]">
          The brief does not say: {gaps.join(', ')}. Ask before you promise it.
        </p>
      )}
    </div>
  )
}
