'use client'

/**
 * Icons that cannot be used wrongly.
 *
 * The registry in `@/lib/consoleIcons` decides WHICH glyph; this file decides HOW it is drawn,
 * and makes the three mistakes people actually make impossible by construction:
 *
 *   - a size off the sanctioned grid      -> `size` takes a key, never a number
 *   - a stroke that fights the text       -> `weight` takes a key, defaulting to regular
 *   - a screen reader reading "image" or nothing -> accessible naming is decided by `alone`
 *
 * The naming rule is the one that matters. A glyph beside its word is decoration: reading it
 * aloud makes the screen say "Posted Posted", so it is `aria-hidden`. A glyph with no word
 * beside it is the ONLY carrier of its meaning, so it gets `role="img"` and an `aria-label`.
 * Colour never travels without the word, so every chip below carries its label as text.
 */
import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tone } from '@/components/console/primitives'
// The one list pairing a stage key with its label and the role that owns it.
import { STAGES } from '@/services/ladderApi'
import {
  ACTION_ICON,
  CHANNEL_ICON,
  ENTITY_ICON,
  ICON_SIZE,
  LATE_ICON,
  STAGE_ICON,
  DROPPED_ICON,
  STAGE_STATE_TONE,
  STROKE,
  type ActionVerb,
  type ChannelKind,
  type EntityKind,
  type EntityTint,
  type IconSize,
  type StageRung,
  type StageState,
  type StrokeWeight,
} from '@/lib/consoleIcons'

/* Literal class strings, because Tailwind only emits what it can read in the source. Same
   tokens as the maps in primitives.tsx; neutral is muted so a quiet glyph stays quiet. */
const INK: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  good: 'text-[var(--tone-good-ink)]',
  warn: 'text-[var(--tone-warn-ink)]',
  bad: 'text-[var(--tone-bad-ink)]',
  info: 'text-foreground',
}

const WASH: Record<Tone, string> = {
  neutral: 'bg-muted/60',
  good: 'bg-[var(--tone-good-wash)]',
  warn: 'bg-[var(--tone-warn-wash)]',
  bad: 'bg-[var(--tone-bad-wash)]',
  info: 'bg-[var(--tone-info-wash)]',
}

/* ── Glyph ─────────────────────────────────────────────────────────────────────────────── */

export interface GlyphProps {
  icon: LucideIcon
  /** The accessible name. Spoken only when `alone`; always required so it is never forgotten. */
  name: string
  /** True when no visible text sits beside the glyph, so the glyph is the only carrier. */
  alone?: boolean
  size?: IconSize
  /** Match to the weight of adjacent text: regular 400, medium 500 to 600, bold 700. */
  weight?: StrokeWeight
  tone?: Tone
  className?: string
}

export function Glyph({
  icon: Icon,
  name,
  alone = false,
  size = 'default',
  weight = 'regular',
  tone = 'neutral',
  className,
}: GlyphProps) {
  const px = ICON_SIZE[size]
  return (
    <span
      {...(alone ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true })}
      className={cn('inline-flex shrink-0 items-center justify-center', INK[tone], className)}
    >
      <Icon size={px} strokeWidth={STROKE[weight]} aria-hidden="true" focusable="false" />
    </span>
  )
}

/* ── EntityTile ────────────────────────────────────────────────────────────────────────── */

/* The tile is the glyph plus 12px of air each side, rounded to the same family as cards. */
const TILE_BOX: Record<IconSize, string> = {
  glyph: 'size-5 rounded-md',
  row: 'size-6 rounded-md',
  default: 'size-7 rounded-lg',
  tile: 'size-9 rounded-lg',
  hero: 'size-11 rounded-xl',
}

export interface EntityTileProps {
  kind: EntityKind
  size?: IconSize
  /** True when the tile stands alone with no name beside it. */
  alone?: boolean
  className?: string
}

/** What kind of thing this is. The tint is the kind, never the state. */
export function EntityTile({ kind, size = 'tile', alone = false, className }: EntityTileProps) {
  const { icon, label, tint } = ENTITY_ICON[kind]
  const t: EntityTint = tint
  return (
    <span
      {...(alone ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        TILE_BOX[size],
        WASH[t],
        INK[t],
        className,
      )}
    >
      <Glyph icon={icon} name={label} size={size} weight="medium" tone={t} className="text-current" />
    </span>
  )
}

/* ── Lozenges ──────────────────────────────────────────────────────────────────────────── */

const LOZENGE = 'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'

export interface StageChipProps {
  /** A rung, or `dropped`. A dropped creator exists in production, so it must render rather
   *  than fall through a `Record` lookup and come out blank. */
  rung: StageRung | 'dropped'
  /** Overrides the rung's default tone: done is ink, current lime, late bad, not yet neutral. */
  state?: StageState
  className?: string
}

/** The rung as a lozenge: glyph plus the rung's word, in its tone. Colour never travels alone.
 *
 *  The WORD comes from `STAGES` in `@/services/ladderApi`, which is the one list pairing a stage
 *  key with its label. This component holds the glyph and nothing else: writing the labels out
 *  again here is exactly how one rung ends up with two names. */
export function StageChip({ rung, state, className }: StageChipProps) {
  if (rung === 'dropped') {
    return (
      <span className={cn(LOZENGE, WASH.bad, INK.bad, className)}>
        <Glyph icon={DROPPED_ICON} name="Dropped" size="glyph" weight="medium" tone="bad" className="text-current" />
        Dropped
      </span>
    )
  }
  const { icon, tone: base } = STAGE_ICON[rung]
  const tone: Tone = state ? STAGE_STATE_TONE[state] : base
  const label = STAGES.find(s => s.key === rung)?.label ?? rung
  // Late is a different fact from the rung, so it gets its own mark and keeps the rung's glyph.
  const Late = state === 'late' ? LATE_ICON : null
  return (
    <span className={cn(LOZENGE, WASH[tone], INK[tone] === 'text-muted-foreground' ? 'text-foreground' : INK[tone], className)}>
      <Glyph icon={icon} name={label} size="glyph" weight="medium" tone={tone} className="text-current" />
      {label}
      {Late ? <Glyph icon={Late} name="Late" size="glyph" weight="medium" tone="bad" className="text-current" /> : null}
    </span>
  )
}

export interface ChannelChipProps {
  channel: ChannelKind
  className?: string
}

/** The channel mark plus its name, so "went by WhatsApp" is readable and not only coloured. */
export function ChannelChip({ channel, className }: ChannelChipProps) {
  const { icon, label, tone } = CHANNEL_ICON[channel]
  return (
    <span className={cn(LOZENGE, WASH[tone], tone === 'neutral' ? 'text-foreground' : INK[tone], className)}>
      <Glyph icon={icon} name={label} size="glyph" weight="medium" tone={tone} className="text-current" />
      {label}
    </span>
  )
}

/* ── ActionIcon ────────────────────────────────────────────────────────────────────────── */

export interface ActionIconProps {
  verb: ActionVerb
  /** Row actions are 14; anywhere else 16. The other sanctioned sizes make no sense for a verb. */
  size?: Extract<IconSize, 'row' | 'default'>
  /** True when it is the only thing in the control (icon-only), so it must announce itself. */
  alone?: boolean
  className?: string
}

/** The glyph for a verb. Destructive verbs take the destructive colour wherever they appear. */
export function ActionIcon({ verb, size = 'row', alone = false, className }: ActionIconProps) {
  const { icon, label, destructive } = ACTION_ICON[verb]
  return (
    <Glyph
      icon={icon}
      name={label}
      alone={alone}
      size={size}
      weight={size === 'row' ? 'regular' : 'medium'}
      tone="neutral"
      className={cn(destructive && 'text-destructive', className)}
    />
  )
}
