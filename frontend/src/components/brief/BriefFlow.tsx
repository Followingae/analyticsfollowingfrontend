'use client'

/**
 * The brand's campaign brief, start to end, at /brief/{token}.
 *
 *   start    hello, and two ways in: attach the brief they already have, or start fresh
 *   reading  the assistant reads the document
 *   found    what it found, and what is still missing; "Fill in the rest" goes to the first gap
 *   steps    nine short pages, autosaved as they type
 *   review   the assistant writes the brief up in detailed points; what is missing is named
 *   done     sent, with the written brief to keep
 *
 * Nothing is required to move between steps. A brand that cannot answer one question should
 * still be able to send us the rest; the review says what is missing instead of blocking.
 */
import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BorderBeam } from 'border-beam'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, CircleDashed, FileText, ListChecks, Loader2, PenLine, RotateCcw,
  Send, Sparkles, UploadCloud,
} from 'lucide-react'
import { briefLink, BriefError, type PublicBrief } from '@/services/brandBriefApi'
import { STEPS, briefGaps, setPath, type BriefAnswers, type Composed, type Gap, type StepKey } from '@/lib/brandBrief'
import { STEP_VIEW } from './BriefSteps'
import { Quick } from './Quick'
import { BotSays, BriefBot, EASE, LIME, Orb } from './ui'
import { cn } from '@/lib/utils'

type Phase = 'loading' | 'missing' | 'closed' | 'start' | 'reading' | 'found' | 'quick' | 'steps' | 'review' | 'done'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const READING_LINES = [
  'Opening your document', 'Reading the campaign details', 'Looking for deliverables and platforms',
  'Finding budget and dates', 'Checking who to tag', 'Putting it all in place',
]
const COMPOSING_LINES = [
  'Reading your answers', 'Writing the campaign summary', 'Turning notes into clear points',
  'Laying out deliverables and timing', 'Checking what is still missing',
]

function useCycle(lines: string[], on: boolean, ms = 2200) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!on) { setI(0); return }
    const t = setInterval(() => setI(x => Math.min(x + 1, lines.length - 1)), ms)
    return () => clearInterval(t)
  }, [on, lines.length, ms])
  return lines[i]
}

export function BriefFlow({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [brief, setBrief] = useState<PublicBrief | null>(null)
  const [a, setA] = useState<BriefAnswers>({})
  const [aiFilled, setAiFilled] = useState<Set<string>>(new Set())
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [visited, setVisited] = useState<Set<number>>(new Set([0]))
  const [save, setSave] = useState<SaveState>('idle')
  const [found, setFound] = useState<string[]>([])
  const [docName, setDocName] = useState<string | null>(null)
  const [attachErr, setAttachErr] = useState<string | null>(null)
  const [composed, setComposed] = useState<Composed | null>(null)
  const [composing, setComposing] = useState(false)
  const [composeErr, setComposeErr] = useState<string | null>(null)
  const [composedFor, setComposedFor] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [sendErr, setSendErr] = useState<string | null>(null)
  const dirty = useRef(false)
  const topRef = useRef<HTMLDivElement>(null)

  /* Load. */
  useEffect(() => {
    let live = true
    briefLink.read(token).then(b => {
      if (!live) return
      setBrief(b); setA(b.answers || {}); setAiFilled(new Set(b.ai_filled || []))
      setComposed(b.composed); setDocName(b.doc_name); setFound(b.doc_found || [])
      if (b.composed) setComposedFor(JSON.stringify(b.answers || {}))
      if (b.status === 'withdrawn') setPhase('closed')
      else if (b.status === 'submitted' || b.status === 'sourcing') setPhase('done')
      else setPhase('start')
    }).catch(e => { if (live) setPhase(e instanceof BriefError && e.status === 404 ? 'missing' : 'missing') })
    return () => { live = false }
  }, [token])

  /* Autosave, quietly, a moment after they stop typing. */
  useEffect(() => {
    if (!dirty.current) return
    setSave('saving')
    const t = setTimeout(() => {
      briefLink.save(token, a).then(() => setSave('saved')).catch(() => setSave('error'))
    }, 800)
    return () => clearTimeout(t)
  }, [a, token])

  const set = useCallback((path: string, value: unknown) => {
    dirty.current = true
    setA(prev => setPath(prev, path, value))
    setAiFilled(prev => { if (!prev.has(path)) return prev; const n = new Set(prev); n.delete(path); return n })
  }, [])
  const ai = useCallback((path: string) => aiFilled.has(path), [aiFilled])
  const assist = useCallback(async (field: string, text: string) =>
    (await briefLink.assist(token, field, text, a)).points, [token, a])

  const gaps = useMemo(() => briefGaps(a), [a])
  const gapSteps = useMemo(() => new Set(gaps.map(g => g.step)), [gaps])

  const scrollTop = () => {
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }
  const go = (i: number) => {
    setDir(i >= step ? 1 : -1); setStep(i)
    setVisited(v => new Set(v).add(i)); setPhase('steps'); scrollTop()
  }
  const goStep = (k: StepKey) => go(STEPS.findIndex(s => s.key === k))

  /* Quick questions: only what is missing, one tap at a time. */
  const [quickStart, setQuickStart] = useState<string | null>(null)
  const [quickRun, setQuickRun] = useState(0)
  const startQuick = (key: string | null = null) => {
    if (!key && !briefGaps(a).length) { toReview(); return }
    setQuickStart(key); setQuickRun(n => n + 1); setPhase('quick'); scrollTop()
  }

  /* They describe the campaign in their own words. */
  const describe = async (text: string) => {
    setAttachErr(null); setPhase('reading'); scrollTop()
    try {
      const res = await briefLink.describe(token, text, a)
      setA(res.answers); setAiFilled(new Set(res.ai_filled)); setFound(res.found)
      setDocName(null); setPhase('found')
    } catch (e) {
      setAttachErr(e instanceof Error ? e.message : 'The assistant is not answering just now.')
      setPhase('start')
    }
  }

  /* Attach a document. */
  const attach = async (file: File) => {
    setAttachErr(null); setPhase('reading'); scrollTop()
    try {
      const res = await briefLink.attach(token, file)
      setA(res.answers); setAiFilled(new Set(res.ai_filled)); setFound(res.found)
      setDocName(res.doc_name || file.name); setPhase('found')
    } catch (e) {
      setAttachErr(e instanceof Error ? e.message : 'We could not read that file.')
      setPhase('start')
    }
  }

  /* Write it up. */
  const compose = useCallback(async () => {
    setComposing(true); setComposeErr(null)
    try {
      const res = await briefLink.compose(token, a)
      setComposed(res.composed); setComposedFor(JSON.stringify(a))
    } catch (e) {
      setComposeErr(e instanceof Error ? e.message : 'The assistant is not answering just now.')
    } finally { setComposing(false) }
  }, [token, a])

  const toReview = () => {
    setDir(1); setPhase('review'); scrollTop()
    if (!composed || composedFor !== JSON.stringify(a)) void compose()
  }

  const send = async () => {
    setSending(true); setSendErr(null)
    try {
      const b = await briefLink.submit(token, a)
      setBrief(b); setPhase('done'); scrollTop()
      try {
        const confetti = (await import('canvas-confetti')).default
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.35 }, colors: [LIME, '#111111', '#e5e5e5'] })
      } catch { /* a missed confetti is fine */ }
    } catch (e) {
      setSendErr(e instanceof Error ? e.message : 'That did not send. Try again.')
    } finally { setSending(false) }
  }

  if (phase === 'loading') {
    return <Center><motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6 }}><BriefBot size={64} /></motion.div></Center>
  }
  if (phase === 'missing' || phase === 'closed' || !brief) {
    return (
      <Center>
        <div className="max-w-sm space-y-4 text-center">
          <div className="flex justify-center"><BriefBot size={72} state="sleeping" /></div>
          <h1 className="text-[22px] font-semibold tracking-tight">This link is not active</h1>
          <p className="text-[15px] text-white/50">Ask your contact at Following for a fresh one.</p>
        </div>
      </Center>
    )
  }

  const cur = STEPS[step]
  const View = STEP_VIEW[cur.key]
  const pct = phase === 'steps' ? ((step + 1) / (STEPS.length + 1)) * 100
    : phase === 'review' || phase === 'done' ? 100 : 0

  return (
    <div ref={topRef} className="brief-dark min-h-[100dvh] bg-black text-white antialiased [color-scheme:dark]">
      {/* Lime is a surface; whatever sits on it is ink, in a theme where everything else is white. */}
      <style>{`.brief-dark [style*="211, 255, 2"], .brief-dark [style*="211, 255, 2"] * { color: #0a0a0a !important; }`}</style>
      <Header brief={brief} save={save} pct={pct} showProgress={phase === 'steps'} />

      <AnimatePresence mode="wait" initial={false}>
        {phase === 'start' && (
          <Page key="start">
            <Start brief={brief} onFile={attach} onDescribe={describe} onQuick={() => startQuick()} error={attachErr}
                   resume={!!(brief.status === 'in_progress' && Object.keys(a).length)} />
          </Page>
        )}

        {phase === 'reading' && (
          <Page key="reading"><Thinking lines={READING_LINES} state="searching" title="Reading your brief" /></Page>
        )}

        {phase === 'quick' && (
          <motion.main key={`quick-${quickRun}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Quick a={a} set={set} startKey={quickStart} onDone={toReview}
                   onDetail={goStep} onExit={() => setPhase('start')} />
          </motion.main>
        )}

        {phase === 'found' && (
          <Page key="found">
            <Found docName={docName} found={found} gaps={gaps}
                   onFill={() => startQuick()}
                   onAll={() => go(0)} />
          </Page>
        )}

        {phase === 'steps' && (
          <motion.main key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="mx-auto flex w-full max-w-6xl gap-12 px-5 pb-36 pt-8 sm:px-8 lg:pt-14">
            <Rail step={step} visited={visited} gapSteps={gapSteps} onGo={go} onReview={toReview} />
            <div className="min-w-0 flex-1 lg:max-w-[660px]">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.section key={cur.key} custom={dir}
                                initial={{ opacity: 0, x: 28 * dir }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -28 * dir }} transition={{ duration: 0.38, ease: EASE }}>
                  <p className="text-[13px] font-medium text-white/40">Step {step + 1} of {STEPS.length}</p>
                  <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">{cur.title}</h1>
                  <div className="mt-5"><BotSays>{cur.hint}</BotSays></div>
                  <div className="mt-10"><View a={a} set={set} ai={ai} assist={assist} /></div>
                </motion.section>
              </AnimatePresence>
            </div>
          </motion.main>
        )}

        {phase === 'review' && (
          <Page key="review" wide>
            <Review brief={brief} composed={composed} composing={composing} error={composeErr}
                    gaps={gaps} onGap={g => startQuick(g.key)} onRewrite={compose}
                    stale={!!composed && composedFor !== JSON.stringify(a)}
                    onSend={send} sending={sending} sendErr={sendErr} onBack={() => go(0)} />
          </Page>
        )}

        {phase === 'done' && (
          <Page key="done" wide><Done brief={brief} composed={composed || brief.composed} name={a.contact?.name} /></Page>
        )}
      </AnimatePresence>

      {phase === 'steps' && (
        <BottomBar
          onBack={() => (step === 0 ? setPhase('start') : go(step - 1))}
          onNext={() => (step === STEPS.length - 1 ? toReview() : go(step + 1))}
          last={step === STEPS.length - 1} />
      )}
    </div>
  )
}

/* ── Frame ──────────────────────────────────────────────────────────────────────────── */

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-black px-6 text-white">{children}</div>
}

function Page({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.45, ease: EASE }}
                 className={cn('mx-auto w-full px-5 pb-28 pt-10 sm:px-8 sm:pt-16', wide ? 'max-w-3xl' : 'max-w-2xl')}>
      {children}
    </motion.main>
  )
}

function BrandMark({ brief, size = 32 }: { brief: PublicBrief; size?: number }) {
  const [bad, setBad] = useState(false)
  if (brief.brand_logo_url && !bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brief.brand_logo_url} alt="" onError={() => setBad(true)} width={size} height={size}
                className="rounded-full border border-white/[0.06] bg-[#111] object-cover" style={{ width: size, height: size }} />
  }
  return (
    <span className="flex items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ width: size, height: size, background: LIME }}>
      {brief.brand_name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function Header({ brief, save, pct, showProgress }: { brief: PublicBrief; save: SaveState; pct: number; showProgress: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark brief={brief} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-semibold">{brief.brand_name}</p>
            <p className="text-[12px] text-white/40">Campaign brief · Following</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {save !== 'idle' && (
            <motion.span key={save} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                         className={cn('inline-flex items-center gap-1.5 text-[12px]', save === 'error' ? 'text-red-400' : 'text-white/40')}>
              {save === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {save === 'saved' && <Check className="h-3.5 w-3.5" />}
              {save === 'saving' ? 'Saving' : save === 'saved' ? 'Saved' : 'Not saved, check your connection'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className={cn('h-[3px] bg-white/[0.07] transition-opacity duration-500', showProgress ? 'opacity-100' : 'opacity-0')}>
        <motion.div className="h-full rounded-r-full" style={{ background: LIME }}
                    animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: EASE }} />
      </div>
    </header>
  )
}

function Rail({ step, visited, gapSteps, onGo, onReview }: {
  step: number; visited: Set<number>; gapSteps: Set<StepKey>; onGo: (i: number) => void; onReview: () => void
}) {
  return (
    <nav className="sticky top-28 hidden h-fit w-52 shrink-0 lg:block">
      <ol className="space-y-1">
        {STEPS.map((s, i) => {
          const done = visited.has(i) && !gapSteps.has(s.key) && i !== step
          const on = i === step
          return (
            <li key={s.key}>
              <button type="button" onClick={() => onGo(i)}
                      className={cn('group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] transition-colors',
                                    on ? 'bg-white/[0.07] font-semibold text-white' : 'text-white/50 hover:text-white')}>
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                                    done ? 'text-white' : on ? 'bg-white text-black' : 'bg-white/[0.07] text-white/50')}
                      style={done ? { background: LIME } : undefined}>
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {s.short}
              </button>
            </li>
          )
        })}
        <li>
          <button type="button" onClick={onReview}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] text-white/50 hover:text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.07]"><Sparkles className="h-3.5 w-3.5" /></span>
            Review
          </button>
        </li>
      </ol>
    </nav>
  )
}

function BottomBar({ onBack, onNext, last }: { onBack: () => void; onNext: () => void; last: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-black/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-3 px-5 sm:px-8 lg:pl-[calc(13rem+5rem)]">
        <button type="button" onClick={onBack}
                className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-white/60 transition-colors hover:bg-white/[0.07]">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <PrimaryButton onClick={onNext}>
          {last ? <>Review my brief<Sparkles className="h-4 w-4" /></> : <>Continue<ArrowRight className="h-4 w-4" /></>}
        </PrimaryButton>
      </div>
    </div>
  )
}

function PrimaryButton({ children, onClick, disabled, className }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string
}) {
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled}
                   whileHover={disabled ? undefined : { scale: 1.02 }} whileTap={disabled ? undefined : { scale: 0.97 }}
                   className={cn('inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white shadow-[0_6px_20px_-8px_rgba(150,190,0,0.8)] disabled:opacity-50', className)}
                   style={{ background: LIME }}>
      {children}
    </motion.button>
  )
}

/* ── Start ──────────────────────────────────────────────────────────────────────────── */

function Start({ brief, onFile, onDescribe, onQuick, error, resume }: {
  brief: PublicBrief; onFile: (f: File) => void; onDescribe: (t: string) => void; onQuick: () => void
  error: string | null; resume: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [text, setText] = useState('')
  const ready = text.trim().length >= 8
  return (
    <div className="space-y-10"
         onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
         onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f) }}>
      <div className="space-y-6">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}>
          <BriefBot size={72} />
        </motion.div>
        <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[44px]">
          Hi {brief.brand_name}.<br />
          <span className="text-white/40">Tell me about the campaign.</span>
        </h1>
        {brief.note && <p className="max-w-lg text-[15px] leading-relaxed text-white/60">{brief.note}</p>}
      </div>

      <BorderBeam size="md" colorVariant="ocean" strength={ready ? 0.7 : 0.3} theme="dark" className="rounded-3xl">
        <div className={cn('rounded-3xl border bg-[#111] p-2 transition-colors', over ? 'border-white/60' : 'border-white/10')}>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={5} autoFocus
                    placeholder="e.g. Launching our winter menu in Dubai on 1 Dec. 10 food creators, a reel each, they come in for dinner for two. Tag @ourbrand."
                    className="w-full resize-none bg-transparent px-4 py-3 text-[16px] leading-relaxed text-white outline-none placeholder:text-white/30" />
          <div className="flex items-center justify-end gap-2 px-2 pb-1">
            <motion.button type="button" disabled={!ready} onClick={() => onDescribe(text)}
                           whileTap={ready ? { scale: 0.96 } : undefined}
                           className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold disabled:opacity-30"
                           style={{ background: LIME }}>
              <Sparkles className="h-4 w-4" />Go
            </motion.button>
          </div>
        </div>
      </BorderBeam>

      <div className="flex items-center gap-4 text-[13px] text-white/30">
        <span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <motion.button type="button" onClick={() => input.current?.click()} whileTap={{ scale: 0.98 }}
                       className={cn('group flex w-full flex-col items-start gap-4 rounded-3xl border-2 border-dashed p-6 text-left transition-all duration-300',
                                     over ? 'border-white/60 bg-white/[0.04]' : 'border-white/15 bg-[#111] hover:border-white/40')}>
          <motion.span animate={over ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }}
                       className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: LIME }}>
            <UploadCloud className="h-5 w-5" />
          </motion.span>
          <span>
            <span className="block text-[17px] font-semibold">Attach your brief</span>
            <span className="mt-0.5 block text-[14px] text-white/50">PDF, Word, slides or a photo</span>
          </span>
        </motion.button>
        <motion.button type="button" onClick={onQuick} whileTap={{ scale: 0.98 }}
                       className="group flex w-full flex-col items-start gap-4 rounded-3xl border border-white/15 bg-[#111] p-6 text-left transition-all duration-300 hover:border-white/40">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: LIME }}>
            <ListChecks className="h-5 w-5" />
          </span>
          <span className="flex w-full items-end justify-between gap-2">
            <span>
              <span className="block text-[17px] font-semibold">{resume ? 'Continue where you left off' : 'Answer quick questions'}</span>
              <span className="mt-0.5 block text-[14px] text-white/50">A few taps, about two minutes</span>
            </span>
            <ArrowRight className="mb-0.5 h-5 w-5 shrink-0 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </span>
        </motion.button>
      </div>
      <input ref={input} type="file" className="hidden"
             accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.txt,.md,.csv,image/*"
             onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-[14px] text-red-400">{error}</motion.p>
        )}
      </AnimatePresence>

    </div>
  )
}

/* ── Thinking ───────────────────────────────────────────────────────────────────────── */

function Thinking({ lines, state, title }: { lines: string[]; state: 'searching' | 'composing'; title: string }) {
  const line = useCycle(lines, true)
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: EASE }}
                  className="scale-[1.6]"><Orb state={state} size={64} /></motion.div>
      <div className="space-y-2">
        <h2 className="text-[24px] font-semibold tracking-tight">{title}</h2>
        <AnimatePresence mode="wait">
          <motion.p key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }} className="text-[15px] text-white/50">{line}</motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ── Found ──────────────────────────────────────────────────────────────────────────── */

function Found({ docName, found, gaps, onFill, onAll }: {
  docName: string | null; found: string[]; gaps: Gap[]; onFill: () => void; onAll: () => void
}) {
  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <BriefBot size={64} state="working" />
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
          {found.length ? `I found ${found.length} things in your brief.` : 'I read your brief.'}
        </h1>
        {docName && (
          <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-[13px] text-white/60">
            <FileText className="h-3.5 w-3.5" />{docName}
          </p>
        )}
      </div>

      {found.length > 0 && (
        <ul className="space-y-2.5">
          {found.map((f, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.25 + i * 0.07, duration: 0.35, ease: EASE }}
                       className="flex items-start gap-3 text-[15px] leading-relaxed">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                           transition={{ delay: 0.3 + i * 0.07, type: 'spring', stiffness: 400, damping: 18 }}
                           className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: LIME }}>
                <Check className="h-3 w-3" />
              </motion.span>
              {f}
            </motion.li>
          ))}
        </ul>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + found.length * 0.07 }}
                  className="space-y-6">
        {gaps.length > 0 ? (
          <div className="rounded-3xl bg-white/[0.04] p-6">
            <p className="text-[15px] font-semibold">{gaps.length === 1 ? 'One thing' : `${gaps.length} things`} still needed</p>
            <ul className="mt-3 space-y-2">
              {gaps.map(g => (
                <li key={g.key} className="flex items-center gap-3 text-[14px] text-white/60">
                  <CircleDashed className="h-4 w-4 text-white/40" />{g.label}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[15px] text-white/60">All there. Review and send.</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryButton onClick={onFill}>
            {gaps.length ? `Answer ${gaps.length} quick question${gaps.length === 1 ? '' : 's'}` : 'Review my brief'}<ArrowRight className="h-4 w-4" />
          </PrimaryButton>
          <button type="button" onClick={onAll}
                  className="h-12 rounded-full px-5 text-[15px] font-medium text-white/60 transition-colors hover:bg-white/[0.07]">
            Use the full form
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Review ─────────────────────────────────────────────────────────────────────────── */

function BriefDoc({ composed }: { composed: Composed }) {
  return (
    <article className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">{composed.title}</h2>
        {composed.summary && <p className="text-[16px] leading-relaxed text-white/60">{composed.summary}</p>}
      </div>
      {composed.sections.map((s, i) => (
        <motion.section key={s.title + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.4, ease: EASE }} className="space-y-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/40">{s.title}</h3>
          <ul className="space-y-2">
            {s.points.map((p, j) => (
              <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#9bbb00' }} />{p}
              </li>
            ))}
          </ul>
        </motion.section>
      ))}
    </article>
  )
}

function Review({ brief, composed, composing, error, gaps, onGap, onRewrite, stale, onSend, sending, sendErr, onBack }: {
  brief: PublicBrief; composed: Composed | null; composing: boolean; error: string | null; gaps: Gap[]
  onGap: (g: Gap) => void; onRewrite: () => void; stale: boolean; onSend: () => void; sending: boolean
  sendErr: string | null; onBack: () => void
}) {
  const line = useCycle(COMPOSING_LINES, composing, 2600)
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <p className="text-[13px] font-medium text-white/40">Review</p>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">Your brief</h1>
        <BotSays state={composing ? 'working' : 'default'}>
          {composing ? 'Writing it up.' : 'Here it is. Change anything and I will rewrite it.'}
        </BotSays>
      </div>

      <BorderBeam size="md" colorVariant="ocean" strength={composing ? 0.8 : 0.35} active={composing} theme="dark" className="rounded-3xl">
        <div className="min-h-[280px] rounded-3xl border border-white/[0.06] bg-[#111] p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {composing ? (
              <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex min-h-[240px] flex-col items-center justify-center gap-6 text-center">
                <Orb state="composing" size={64} />
                <AnimatePresence mode="wait">
                  <motion.p key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            className="text-[15px] text-white/50">{line}</motion.p>
                </AnimatePresence>
              </motion.div>
            ) : composed ? (
              <motion.div key="doc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><BriefDoc composed={composed} /></motion.div>
            ) : (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center">
                <p className="text-[15px] text-white/50">{error || 'Not written yet.'}</p>
                <button type="button" onClick={onRewrite} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-4 text-[14px] font-medium text-white">
                  <RotateCcw className="h-4 w-4" />Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BorderBeam>

      {stale && !composing && (
        <button type="button" onClick={onRewrite}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[14px] font-medium hover:border-white/60">
          <RotateCcw className="h-4 w-4" />You changed something. Rewrite it
        </button>
      )}

      {composed && composed.open_questions.length > 0 && !composing && (
        <div className="space-y-3 rounded-3xl bg-white/[0.04] p-6">
          <p className="text-[15px] font-semibold">Worth thinking about</p>
          <ul className="space-y-2">
            {composed.open_questions.map((q, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-white/60">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/25" />{q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {gaps.length > 0 && (
        <div className="space-y-4">
          <p className="text-[15px] font-semibold">Still missing</p>
          <div className="flex flex-wrap gap-2">
            {gaps.map(g => (
              <button key={g.key} type="button" onClick={() => onGap(g)}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[14px] text-white/80 transition-colors hover:border-white/60">
                <CircleDashed className="h-4 w-4 text-white/40" />{g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack}
                className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-white/60 hover:bg-white/[0.07]">
          <PenLine className="h-4 w-4" />Add more detail
        </button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <PrimaryButton onClick={onSend} disabled={sending || composing} className="px-8">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to Following
          </PrimaryButton>
          {sendErr && <p className="text-[13px] text-red-400">{sendErr}</p>}
        </div>
      </div>
    </div>
  )
}

/* ── Done ───────────────────────────────────────────────────────────────────────────── */

function Done({ brief, composed, name }: { brief: PublicBrief; composed: Composed | null; name?: string }) {
  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center gap-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 16 }}>
          <BriefBot size={96} state="working" />
        </motion.div>
        <div className="space-y-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: 'spring' }}
                      className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: LIME }}>
            <CheckCircle2 className="h-5 w-5" />
          </motion.div>
          <h1 className="text-[30px] font-semibold tracking-[-0.02em] sm:text-[38px]">
            Sent{name ? `. Thank you, ${name.split(' ')[0]}` : '. Thank you'}.
          </h1>
          <p className="mx-auto max-w-md text-[16px] leading-relaxed text-white/50">
            We will be in touch with creators and a plan.
          </p>
        </div>
      </div>
      {composed && (
        <div className="rounded-3xl border border-white/[0.06] bg-[#111] p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.18)] sm:p-10">
          <BriefDoc composed={composed} />
        </div>
      )}
    </div>
  )
}
