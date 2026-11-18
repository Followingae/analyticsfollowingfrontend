'use client'

/**
 * Seven questions, one per screen, autosaved as a draft after every step.
 *
 * Resuming opens the first step that is not yet answered, unless the URL asks
 * for one (?step=3). Sending calls POST /submit; a 422 comes back as a list of
 * problems, and the wizard jumps to the first step that owns one and shows
 * them there, inline.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useMerchantHome, useInvalidateMerchant } from '@/hooks/useMerchantHome'
import { merchantApi, CampaignProblemsError, type CampaignBrief, type CampaignProblem, type MerchantCampaign } from '@/services/merchantApi'
import {
  StepPlace,
  StepOffer,
  StepRedeem,
  StepGetBack,
  StepBrief,
  StepDates,
  StepReview,
  STEP_NAMES,
  stepComplete,
  stepForField,
} from './steps'

const STEPS = [StepPlace, StepOffer, StepRedeem, StepGetBack, StepBrief, StepDates, StepReview]
const LAST = STEPS.length - 1

const BRIEF_KEYS: (keyof CampaignBrief)[] = [
  'name', 'description', 'category', 'barter_items', 'fulfilment_mode', 'visit_location', 'visit_required', 'guests_allowed',
  'entitlement_cap_aed', 'start_date', 'end_date', 'max_participants', 'creator_approval_mode', 'mandatory_tags', 'mandatory_hashtags',
  'content_requirements', 'things_to_avoid', 'reference_links', 'hero_image_url', 'swap_reel_for_tiktok',
]

function briefOf(c: MerchantCampaign | null | undefined): CampaignBrief {
  const out: CampaignBrief = {}
  if (!c) return out
  for (const k of BRIEF_KEYS) {
    const v = c[k]
    if (v !== undefined) (out as Record<string, unknown>)[k] = v
  }
  return out
}

export function CampaignWizard() {
  const router = useRouter()
  const params = useSearchParams()
  const home = useMerchantHome()
  const invalidate = useInvalidateMerchant()
  const existing = useQuery({ queryKey: ['merchant', 'campaign'], queryFn: merchantApi.campaign, retry: 0 })

  const [brief, setBrief] = useState<CampaignBrief | null>(null)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [sending, setSending] = useState(false)
  const [problems, setProblems] = useState<CampaignProblem[]>([])
  const dirty = useRef(false)

  const programme = home.data?.trial.programme
  const merchant = home.data?.merchant

  // Seed the brief once both reads have landed.
  useEffect(() => {
    if (brief || !programme || !merchant || existing.isPending) return
    const c = existing.data
    const seeded = briefOf(c)
    if (!seeded.name) seeded.name = ''
    if (!seeded.category && merchant.category) seeded.category = merchant.category
    if (!seeded.creator_approval_mode) seeded.creator_approval_mode = home.data?.settings?.creator_approval_mode || 'manual'
    if (!seeded.max_participants) seeded.max_participants = programme.creators_per_month
    if (!seeded.visit_required && !seeded.fulfilment_mode) seeded.visit_required = true
    if (c?.problems?.length) setProblems(c.problems)
    setBrief(seeded)

    const asked = Number(params.get('step'))
    if (asked >= 1 && asked <= STEPS.length) {
      setStep(asked - 1)
      return
    }
    let first = 0
    while (first < LAST && stepComplete(first, seeded, programme)) first++
    setStep(first)
  }, [brief, programme, merchant, existing.isPending, existing.data, params, home.data])

  const patch = useCallback((p: Partial<CampaignBrief>) => {
    dirty.current = true
    setBrief((b) => ({ ...(b || {}), ...p }))
  }, [])

  const save = useCallback(async (): Promise<boolean> => {
    if (!brief || !dirty.current) return true
    setSaving('saving')
    try {
      const res = await merchantApi.saveCampaign(brief)
      dirty.current = false
      setProblems(res?.problems || [])
      setSaving('saved')
      return true
    } catch (e) {
      setSaving('failed')
      if (e instanceof CampaignProblemsError) setProblems(e.problems)
      else toast.error(e instanceof Error ? e.message : 'We could not save that')
      return false
    }
  }, [brief])

  const go = async (to: number) => {
    if (!brief || !programme) return
    setDir(to > step ? 1 : -1)
    await save()
    setStep(Math.max(0, Math.min(LAST, to)))
  }

  const canContinue = useMemo(() => (brief && programme ? stepComplete(step, brief, programme) : false), [brief, programme, step])

  const submit = async () => {
    if (!brief) return
    setSending(true)
    const ok = await save()
    if (!ok) {
      setSending(false)
      return
    }
    try {
      await merchantApi.submitCampaign()
      await invalidate()
      toast.success('Sent. We will read it and come back to you.')
      router.push('/merchant/campaign')
    } catch (e) {
      if (e instanceof CampaignProblemsError) {
        setProblems(e.problems)
        const owners = e.problems.map((p) => (p.step != null ? p.step - 1 : stepForField(p.field))).filter((s): s is number => s != null)
        if (owners.length) {
          setDir(-1)
          setStep(Math.min(...owners))
        }
        toast.error(e.problems[0]?.message || 'The campaign is not ready to send')
      } else {
        toast.error(e instanceof Error ? e.message : 'That did not go through')
      }
    } finally {
      setSending(false)
    }
  }

  const leave = async () => {
    await save()
    router.push(existing.data ? '/merchant/campaign' : '/dashboard')
  }

  // Not a merchant, or the server is down: say so rather than show a blank wizard.
  if (home.notMerchant) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">This page is for merchant accounts on the barter trial.</p>
        <Button asChild variant="outline" className="rounded-full">
          <a href="/dashboard">Back to your dashboard</a>
        </Button>
      </Centered>
    )
  }
  if (home.failed || existing.isError) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">We could not load your campaign just now. Reload in a moment, or email partners@following.ae.</p>
      </Centered>
    )
  }
  if (!brief || !programme || !merchant) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-8 px-6 py-16">
        <Skeleton className="size-11 rounded-2xl" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }

  const Step = STEPS[step]
  const locked = existing.data && !['draft', 'rejected'].includes(existing.data.status) && !existing.data.review_note

  if (locked) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">Your campaign is {existing.data?.status === 'in_review' ? 'with us for review' : 'live'}, so it cannot be edited here.</p>
        <Button asChild variant="outline" className="rounded-full">
          <a href="/merchant/campaign">See your campaign</a>
        </Button>
      </Centered>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Progress line */}
      <div aria-hidden="true" className="h-0.5 w-full bg-muted">
        <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => (step === 0 ? leave() : go(step - 1))}
          className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={step === 0 ? 'Leave' : 'Back'}
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            {step + 1} of {STEPS.length} · {STEP_NAMES[step]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {saving === 'saving' && <Loader2 className="size-3 animate-spin" />}
            {saving === 'saved' && <Check className="size-3" />}
            {saving === 'saving' ? 'Saving' : saving === 'saved' ? 'Saved' : saving === 'failed' ? 'Not saved' : ''}
          </span>
          <button
            type="button"
            onClick={leave}
            className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Save and leave"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col px-5 pb-32 pt-6 sm:px-8 sm:pt-10">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex flex-1 flex-col"
          >
            <Step brief={brief} patch={patch} programme={programme} merchant={merchant} problems={problems} />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            {step < LAST ? (canContinue ? '' : 'Answer this to continue') : 'You can edit until we approve it'}
          </span>
          {step < LAST ? (
            <Button onClick={() => go(step + 1)} disabled={!canContinue || saving === 'saving'} className={cn('h-12 rounded-full px-6 text-[15px]')}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={sending} className="h-12 rounded-full px-6 text-[15px]">
              {sending ? <Loader2 className="size-4 animate-spin" /> : null}
              Send for approval
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">{children}</div>
}
