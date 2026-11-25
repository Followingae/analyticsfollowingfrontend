'use client'

/**
 * The pieces the brand brief is built from. One look throughout: white space, ink on white,
 * lime only ever as a surface (a selected chip, the main button) with ink on top of it.
 */
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BotAvatar } from 'bot-avatars'
import { ThinkingOrb } from 'thinking-orbs'
import { BorderBeam } from 'border-beam'
import { Check, Minus, Plus, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const LIME = '#d3ff02'
export const EASE = [0.22, 1, 0.36, 1] as const

/* The assistant. A lime droid, the same character the rest of Following uses. Browsers with
   no OffscreenCanvas get a still lime disc instead of a broken canvas. */
export function BriefBot({ size = 44, state = 'default', interactive = true }: {
  size?: number; state?: 'default' | 'working' | 'sleeping'; interactive?: boolean
}) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => { setOk(typeof window !== 'undefined' && 'OffscreenCanvas' in window) }, [])
  if (!ok) {
    return <span className="inline-block rounded-full" style={{ width: size, height: size, background: LIME }} />
  }
  return (
    <BotAvatar type="droid" color={LIME} face="mouth" glasses="round" size={size} state={state}
               interactive={interactive} theme="dark" seed={0.3} />
  )
}

export function Orb({ state = 'composing', size = 64 }: {
  state?: 'working' | 'searching' | 'solving' | 'composing' | 'weaving' | 'shaping' | 'connecting'
  size?: 64 | 32 | 20
}) {
  return <ThinkingOrb state={state} size={size} theme="dark" />
}

/** The assistant speaking: avatar and a bubble that types itself in. */
export function BotSays({ children, state = 'default' }: { children: React.ReactNode; state?: 'default' | 'working' }) {
  return (
    <div className="flex items-end gap-3">
      <div className="shrink-0"><BriefBot size={44} state={state} /></div>
      <motion.div
        key={String(children)}
        initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="rounded-2xl rounded-bl-md bg-white/[0.07] px-4 py-2.5 text-[14px] leading-relaxed text-white/80">
        {children}
      </motion.div>
    </div>
  )
}

export function Field({ label, hint, optional, children, ai }: {
  label: string; hint?: string; optional?: boolean; children: React.ReactNode; ai?: boolean
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[15px] font-medium text-white">
          {label}
          {optional && <span className="ml-2 text-[13px] font-normal text-white/40">optional</span>}
        </label>
        {ai && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-white/60">
            <Sparkles className="h-3 w-3" />From your document
          </span>
        )}
      </div>
      {hint && <p className="-mt-1 text-[13px] leading-relaxed text-white/50">{hint}</p>}
      {children}
    </div>
  )
}

const inputBase =
  'w-full rounded-2xl border border-white/10 bg-[#111] px-4 text-[15px] text-white ' +
  'placeholder:text-white/40 outline-none transition-[border-color,box-shadow] duration-200 ' +
  'focus:border-white/60 focus:shadow-[0_0_0_4px_rgba(211,255,2,0.45)]'

export function TextInput({ value, onChange, placeholder, type = 'text', inputMode, prefix, className }: {
  value?: string | number | null; onChange: (v: string) => void; placeholder?: string
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; prefix?: string; className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {prefix && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-white/40">{prefix}</span>}
      <input type={type} inputMode={inputMode} value={value ?? ''} placeholder={placeholder}
             onChange={e => onChange(e.target.value)}
             className={cn(inputBase, 'h-12', prefix && 'pl-14')} />
    </div>
  )
}

export function TextArea({ value, onChange, placeholder, rows = 4 }: {
  value?: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea value={value ?? ''} rows={rows} placeholder={placeholder} onChange={e => onChange(e.target.value)}
              className={cn(inputBase, 'resize-none py-3 leading-relaxed')} />
  )
}

/**
 * A free-text answer with the assistant beside it. "Make it detailed" sends what they typed,
 * the orb thinks, and the points arrive in a card with a beam round it. "Use these" swaps
 * them in; "Keep mine" leaves their words alone.
 */
export function AiTextArea({ value, onChange, placeholder, field, onAssist, rows = 4 }: {
  value?: string; onChange: (v: string) => void; placeholder?: string; field: string; rows?: number
  onAssist: (field: string, text: string) => Promise<string[]>
}) {
  const [busy, setBusy] = useState(false)
  const [points, setPoints] = useState<string[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const canAsk = (value || '').trim().length >= 3
  const ask = async () => {
    setBusy(true); setErr(null); setPoints(null)
    try { setPoints(await onAssist(field, value || '')) }
    catch (e) { setErr(e instanceof Error ? e.message : 'The assistant is not answering just now.') }
    finally { setBusy(false) }
  }
  return (
    <div className="space-y-3">
      <div className="relative">
        <TextArea value={value} onChange={onChange} placeholder={placeholder} rows={rows} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-2.5">
          <button type="button" disabled={!canAsk || busy} onClick={ask}
                  className={cn(
                    'pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-all duration-200',
                    canAsk && !busy ? 'bg-white text-black hover:scale-[1.03] active:scale-[0.98]'
                                    : 'bg-white/[0.07] text-white/40',
                  )}>
            {busy ? <Orb state="composing" size={20} /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy ? 'Writing' : 'Make it detailed'}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[13px] text-red-400">{err}</motion.p>
        )}
        {points && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.4, ease: EASE }}>
            <BorderBeam size="md" colorVariant="ocean" strength={0.55} theme="dark" className="rounded-2xl">
              <div className="rounded-2xl bg-[#111] p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-white/50">
                  <BriefBot size={24} interactive={false} />Here it is, clearer
                </div>
                <ul className="space-y-2">
                  {points.map((p, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.06 * i, duration: 0.3 }}
                               className="flex gap-2.5 text-[14px] leading-relaxed text-white/90">
                      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#9bbb00' }} />
                      {p}
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => { onChange(points.map(p => `• ${p}`).join('\n')); setPoints(null) }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-white transition-transform hover:scale-[1.03]"
                          style={{ background: LIME }}>
                    <Check className="h-3.5 w-3.5" />Use these
                  </button>
                  <button type="button" onClick={() => setPoints(null)}
                          className="h-9 rounded-full px-4 text-[13px] font-medium text-white/50 hover:bg-white/[0.07]">
                    Keep mine
                  </button>
                </div>
              </div>
            </BorderBeam>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Chip({ selected, onClick, children, icon: Icon }: {
  selected?: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.96 }} layout
                   className={cn(
                     'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors duration-200',
                     selected ? 'border-transparent text-white' : 'border-white/10 bg-[#111] text-white/80 hover:border-white/30',
                   )}
                   style={selected ? { background: LIME } : undefined}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }}
                       exit={{ width: 0, opacity: 0 }} className="overflow-hidden">
            <Check className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export function ChipGroup<T extends string>({ options, value, onChange, single }: {
  options: { key: T; label: string; icon?: React.ComponentType<{ className?: string }> }[]
  value?: T[] | T | null; onChange: (v: T[] | T | null) => void; single?: boolean
}) {
  const list = Array.isArray(value) ? value : value ? [value] : []
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <Chip key={o.key} icon={o.icon} selected={list.includes(o.key)}
              onClick={() => {
                if (single) onChange(list.includes(o.key) ? null : o.key)
                else onChange(list.includes(o.key) ? list.filter(x => x !== o.key) : [...list, o.key])
              }}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}

export const opts = (xs: string[]) => xs.map(x => ({ key: x, label: x }))

/** A big tappable choice with an icon, a title and a line under it. */
export function ChoiceCard({ selected, onClick, icon: Icon, title, sub, badge }: {
  selected?: boolean; onClick: () => void; icon?: React.ComponentType<{ className?: string }>
  title: string; sub?: string; badge?: string
}) {
  return (
    <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.98 }}
                   className={cn(
                     'relative flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5',
                     selected ? 'border-white bg-[#111] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]'
                              : 'border-white/10 bg-[#111] hover:border-white/30',
                   )}>
      {Icon && (
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                            selected ? 'text-white' : 'bg-white/[0.07] text-white/60')}
              style={selected ? { background: LIME } : undefined}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-white">
          {title}
          {badge && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-white/60">{badge}</span>}
        </span>
        {sub && <span className="mt-0.5 block text-[13px] leading-relaxed text-white/50">{sub}</span>}
      </span>
      <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          selected ? 'border-white bg-white text-black' : 'border-white/20')}>
        {selected && <Check className="h-3 w-3" />}
      </span>
    </motion.button>
  )
}

export function Stepper({ value, onChange, min = 0, max = 99 }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-[#111] p-1">
      <button type="button" aria-label="Less" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.07] disabled:opacity-30">
        <Minus className="h-4 w-4" />
      </button>
      <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                   className="w-8 text-center text-[15px] font-semibold tabular-nums">{value}</motion.span>
      <button type="button" aria-label="More" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.07] disabled:opacity-30">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Toggle({ checked, onChange, label, sub }: {
  checked?: boolean; onChange: (v: boolean) => void; label: string; sub?: string
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#111] px-4 py-3.5 text-left transition-colors hover:border-white/30">
      <span>
        <span className="block text-[15px] font-medium text-white">{label}</span>
        {sub && <span className="block text-[13px] text-white/50">{sub}</span>}
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300', checked ? '' : 'bg-white/15')}
            style={checked ? { background: LIME } : undefined}>
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                     className={cn('absolute top-1 h-5 w-5 rounded-full shadow', checked ? 'right-1 bg-black' : 'left-1 bg-white/80')} />
      </span>
    </button>
  )
}

/** Handles, hashtags, links: type and press enter or comma. */
export function TagInput({ value, onChange, placeholder, prefix }: {
  value?: string[]; onChange: (v: string[]) => void; placeholder?: string; prefix?: '@' | '#'
}) {
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const list = value || []
  const add = (raw: string) => {
    const parts = raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
      .map(s => (prefix && !s.startsWith(prefix) && !s.startsWith('http') ? prefix + s.replace(/^[@#]/, '') : s))
    if (parts.length) onChange([...list, ...parts.filter(p => !list.includes(p))])
    setDraft('')
  }
  return (
    <div onClick={() => ref.current?.focus()}
         className={cn(inputBase, 'flex min-h-12 cursor-text flex-wrap items-center gap-1.5 px-2.5 py-2 focus-within:border-white/60 focus-within:shadow-[0_0_0_4px_rgba(211,255,2,0.45)]')}>
      <AnimatePresence initial={false}>
        {list.map(t => (
          <motion.span key={t} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.8, opacity: 0 }}
                       className="inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-white/[0.07] pl-3 pr-1.5 text-[14px] text-white/90">
            <span className="truncate">{t}</span>
            <button type="button" aria-label={`Remove ${t}`} onClick={e => { e.stopPropagation(); onChange(list.filter(x => x !== t)) }}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.12]">
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input ref={ref} value={draft} placeholder={list.length ? '' : placeholder}
             onChange={e => { const v = e.target.value; if (/[,\n]$/.test(v)) add(v); else setDraft(v) }}
             onKeyDown={e => {
               if (e.key === 'Enter') { e.preventDefault(); add(draft) }
               if (e.key === 'Backspace' && !draft && list.length) onChange(list.slice(0, -1))
             }}
             onBlur={() => draft && add(draft)}
             className="h-8 min-w-[8rem] flex-1 bg-transparent px-1.5 text-[15px] outline-none placeholder:text-white/40" />
    </div>
  )
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-9', className)}>{children}</div>
}

export function Divider() {
  return <div className="h-px bg-white/[0.07]" />
}
