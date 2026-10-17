'use client'

/**
 * The parts every confirmation shares.
 *
 * Four dialog bodies, one vocabulary: a figure is always formatted the same way, a
 * recipient always renders as a row with the same shape, a type-to-confirm field always
 * says what to type and why. Keeping that here is what stops the money dialog and the
 * outbound sheet from drifting into two different products.
 */

import * as React from 'react'
import { CheckIcon, XIcon, AlertTriangleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** ---------------------------------------------------------------------------------
 *  Numbers
 *  ------------------------------------------------------------------------------- */

/** Thousands separated, no decimals. Dirham amounts in this console are whole dirhams:
 *  showing `AED 4,500.00` invites the reader to look for fils that never exist. */
export function formatAed(amount: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    Math.round(amount),
  )
}

/** The digits a person would type to restate an amount, with nothing else in it. */
export function amountDigits(amount: number): string {
  return String(Math.abs(Math.round(amount)))
}

/** Strip anything that is not a digit, so `4,500` and `AED 4500` both count as typed. */
export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, '')
}

/** ---------------------------------------------------------------------------------
 *  Copy
 *  ------------------------------------------------------------------------------- */

/**
 * "Send proposal" becomes "Sending proposal" once the button is pressed, so a second
 * click has something to tell the operator other than a frozen label. Only the first
 * word is conjugated, which is all our labels need: the verb always leads.
 */
export function pressedLabel(label: string): string {
  const [first, ...rest] = label.trim().split(/\s+/)
  if (!first) return label
  const tail = rest.length ? ' ' + rest.join(' ') : ''
  return conjugate(first) + tail
}

function conjugate(word: string): string {
  const lower = word.toLowerCase()
  let stem = word
  if (/[^aeiou]e$/i.test(lower)) {
    // Release, Approve, Delete, Remove
    stem = word.slice(0, -1)
  } else if (/[^aeiou][aeiou][bdglmnprt]$/i.test(lower)) {
    // Drop, Set, Commit: the final consonant doubles
    stem = word + word.slice(-1)
  }
  return stem + 'ing'
}

/** ---------------------------------------------------------------------------------
 *  Tone surfaces
 *  ------------------------------------------------------------------------------- */

export const toneWash = {
  good: { background: 'var(--tone-good-wash)', color: 'var(--tone-good-ink)' },
  warn: { background: 'var(--tone-warn-wash)', color: 'var(--tone-warn-ink)' },
  bad: { background: 'var(--tone-bad-wash)', color: 'var(--tone-bad-ink)' },
} as const

/** An amber strip. Used for the one sentence a person must read before committing. */
export function WarnStrip({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-start gap-2 rounded-ds-control px-3 py-2 text-ds-caption"
      style={toneWash.warn}
    >
      <AlertTriangleIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

/** ---------------------------------------------------------------------------------
 *  Recipients
 *  ------------------------------------------------------------------------------- */

export type RecipientRow = {
  name: string
  detail?: string
  amountAed?: number
  warn?: string
}

/**
 * NN/g: when many items are affected a count is the minimum, listing them is better.
 * So this lists. Five rows is about what a dialog holds without becoming a table, and
 * the rest sit behind one disclosure that opens the list, never a number.
 */
export function RecipientList({
  recipients,
  label = 'Recipients',
  compact = false,
}: {
  recipients: RecipientRow[]
  label?: string
  compact?: boolean
}) {
  const [expanded, setExpanded] = React.useState(false)
  const hidden = Math.max(0, recipients.length - 5)
  const shown = expanded ? recipients : recipients.slice(0, 5)

  if (recipients.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-ds-label text-muted-foreground">{label}</p>
        <p className="text-ds-caption text-muted-foreground tabular-nums">
          {recipients.length}
        </p>
      </div>

      <ul className={cn('divide-y divide-border rounded-ds-control border', compact && 'text-ds-caption')}>
        {shown.map((r, i) => (
          <li key={`${r.name}-${i}`} className="flex items-start justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-ds-body">{r.name}</p>
              {r.detail ? (
                <p className="truncate text-ds-caption text-muted-foreground">{r.detail}</p>
              ) : null}
              {r.warn ? (
                <p className="text-ds-caption" style={{ color: 'var(--tone-warn-ink)' }}>
                  {r.warn}
                </p>
              ) : null}
            </div>
            {typeof r.amountAed === 'number' ? (
              <p className="shrink-0 text-ds-body tabular-nums">AED {formatAed(r.amountAed)}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-ds-caption underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          {expanded ? 'Show fewer' : `Show the other ${hidden}`}
        </button>
      ) : null}
    </div>
  )
}

/** Recipients as chips, for the outbound sheet where the list sits beside a preview. */
export function RecipientChips({ recipients }: { recipients: RecipientRow[] }) {
  const [expanded, setExpanded] = React.useState(false)
  const hidden = Math.max(0, recipients.length - 10)
  const shown = expanded ? recipients : recipients.slice(0, 10)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {shown.map((r, i) => (
          <span
            key={`${r.name}-${i}`}
            className="inline-flex items-baseline gap-1.5 rounded-full border px-2.5 py-1 text-ds-caption"
            title={r.detail}
          >
            <span>{r.name}</span>
            {r.detail ? <span className="text-muted-foreground">{r.detail}</span> : null}
            {typeof r.amountAed === 'number' ? (
              <span className="tabular-nums">AED {formatAed(r.amountAed)}</span>
            ) : null}
          </span>
        ))}
      </div>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-ds-caption underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          {expanded ? 'Show fewer' : `Show the other ${hidden}`}
        </button>
      ) : null}
    </div>
  )
}

/** ---------------------------------------------------------------------------------
 *  Type to confirm
 *  ------------------------------------------------------------------------------- */

/**
 * NN/g blesses this only for rare, serious cases: used everywhere it becomes muscle
 * memory and stops meaning anything. The field always names what to type, and when the
 * primary button is disabled the dialog says what is missing, never just greys out.
 */
export function TypeToConfirm({
  id,
  expect,
  value,
  onChange,
  prompt,
  why,
  disabled,
  numeric = false,
}: {
  id: string
  expect: string
  value: string
  onChange: (next: string) => void
  prompt: string
  why?: string
  disabled?: boolean
  numeric?: boolean
}) {
  const matched = numeric ? onlyDigits(value) === expect : value.trim() === expect
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-ds-label">
        {prompt}
      </Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        autoComplete="off"
        inputMode={numeric ? 'numeric' : 'text'}
        aria-describedby={`${id}-why`}
        onChange={(e) => onChange(e.target.value)}
        className="tabular-nums"
      />
      <p id={`${id}-why`} className="text-ds-caption text-muted-foreground">
        {matched ? 'Matched.' : why ?? `Type ${expect} to enable the button.`}
      </p>
    </div>
  )
}

/** ---------------------------------------------------------------------------------
 *  Footer
 *  ------------------------------------------------------------------------------- */

/**
 * Atlassian: footer buttons right, primary to the right of the secondary, and the
 * primary label matches the title. The confirm button is never autofocused, so there is
 * no default yes to press through.
 */
export function ConfirmFooter({
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  pressed,
  disabled,
  destructive,
  blockedReason,
  aside,
}: {
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  pressed: boolean
  disabled?: boolean
  destructive?: boolean
  blockedReason?: string
  aside?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      {disabled && blockedReason && !pressed ? (
        <p className="text-ds-caption text-muted-foreground">{blockedReason}</p>
      ) : null}
      {/* The consequence sits beside the primary, where it is read on the way to the
          click rather than above the fold of the footer. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {aside ? (
          <p className="text-ds-caption text-muted-foreground sm:mr-auto sm:max-w-[22rem]">
            {aside}
          </p>
        ) : null}
        <div className="flex flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pressed}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={disabled || pressed}
          >
            {pressed ? pressedLabel(confirmLabel) + '...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** ---------------------------------------------------------------------------------
 *  Loss rows
 *  ------------------------------------------------------------------------------- */

export function LossIcon({ kept, warn }: { kept?: boolean; warn?: boolean }) {
  if (kept) {
    return (
      <CheckIcon
        className="mt-0.5 size-4 shrink-0"
        style={{ color: 'var(--tone-good-ink)' }}
        aria-hidden="true"
      />
    )
  }
  if (warn) {
    return (
      <AlertTriangleIcon
        className="mt-0.5 size-4 shrink-0"
        style={{ color: 'var(--tone-warn-ink)' }}
        aria-hidden="true"
      />
    )
  }
  return (
    <XIcon
      className="mt-0.5 size-4 shrink-0"
      style={{ color: 'var(--tone-bad-ink)' }}
      aria-hidden="true"
    />
  )
}
