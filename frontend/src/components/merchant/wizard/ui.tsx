'use client'

/**
 * The wizard's furniture: one question per screen, a lot of white, one icon.
 */
import * as React from 'react'
import { useState } from 'react'
import { X, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Question({
  icon: Icon,
  title,
  sub,
  children,
}: {
  icon: LucideIcon
  title: React.ReactNode
  sub?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <div className="flex flex-col gap-4">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <h1 className="m-0 text-[28px] font-medium leading-[1.15] tracking-[-0.02em] sm:text-[34px]">{title}</h1>
        {sub ? <p className="m-0 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">{sub}</p> : null}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  )
}

export function Field({ label, hint, children, error }: { label: string; hint?: string; children: React.ReactNode; error?: string | null }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export const INPUT =
  'flex min-h-[48px] w-full rounded-xl border border-input bg-background px-4 text-[15px] placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 transition-colors'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(INPUT, props.className)} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(INPUT, 'min-h-[96px] resize-none py-3 leading-relaxed', props.className)} />
}

/** A big tappable option with a title and one line under it. */
export function Choice({
  selected,
  onSelect,
  title,
  sub,
  icon: Icon,
  right,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  sub?: string
  icon?: LucideIcon
  right?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border bg-card px-4 py-4 text-left transition-colors',
        selected ? 'border-foreground ring-1 ring-foreground' : 'border-border hover:bg-muted/40',
      )}
    >
      {Icon ? (
        <span className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-xl', selected ? 'bg-foreground text-background' : 'bg-muted text-foreground')}>
          <Icon className="size-[18px]" strokeWidth={1.75} />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-medium">{title}</span>
        {sub ? <span className="text-[13px] text-muted-foreground">{sub}</span> : null}
      </span>
      {right}
    </button>
  )
}

/** A row of small tappable pills, one selected. */
export function Pills<T extends string | number>({
  options,
  value,
  onChange,
  render,
}: {
  options: T[]
  value: T | null | undefined
  onChange: (v: T) => void
  render?: (v: T) => React.ReactNode
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = opt === value
        return (
          <button
            key={String(opt)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt)}
            className={cn(
              'inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-[15px] font-medium transition-colors',
              selected ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-muted/50',
            )}
          >
            {render ? render(opt) : String(opt)}
          </button>
        )
      })}
    </div>
  )
}

/** A list of short strings the person adds one at a time. Enter adds, the x removes. */
export function ListEditor({
  items,
  onChange,
  placeholder,
  prefix,
  max = 12,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  /** '@' or '#': typed once by us, never twice by them. */
  prefix?: string
  max?: number
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    let v = draft.trim()
    if (!v) return
    if (prefix) v = prefix + v.replace(new RegExp(`^\\${prefix}+`), '')
    if (items.includes(v) || items.length >= max) {
      setDraft('')
      return
    }
    onChange([...items, v])
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.length > 0 ? (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {items.map((item) => (
            <li key={item} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-muted pl-3.5 pr-1.5 text-sm">
              <span className="max-w-[28ch] truncate">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i !== item))}
                aria-label={`Remove ${item}`}
                className="rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {prefix ? (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">{prefix}</span>
          ) : null}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            placeholder={placeholder}
            className={cn(INPUT, prefix && 'pl-8')}
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          aria-label="Add"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function Note({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'bad' | 'good' }) {
  return (
    <p
      className={cn(
        'm-0 text-sm leading-relaxed',
        tone === 'muted' && 'text-muted-foreground',
        tone === 'bad' && 'text-destructive',
        tone === 'good' && 'text-[var(--tone-good-ink)]',
      )}
    >
      {children}
    </p>
  )
}
