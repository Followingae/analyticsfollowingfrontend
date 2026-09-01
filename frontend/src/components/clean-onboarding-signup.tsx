'use client'

/**
 * Sign up.
 *
 * This used to be a four step wizard: pick a theme, make an account, name your
 * company, tick five goals, drag a budget slider, then choose a plan from a card
 * before you had seen a single creator. Six screens of asking, zero screens of
 * showing. It did not convert, and it never could.
 *
 * What it is now: one screen. Google first, or three fields. Everyone lands on
 * the Free plan with a working team and a credit wallet, and sees the product.
 * Plans are sold later, from /pricing, once there is something to buy an upgrade
 * for. Company, industry and budget are sales questions, not signup questions:
 * the backend has always treated them as optional, so they are gone.
 *
 * Two rules this file must keep:
 *
 *  1. Never print a limit the server does not enforce. Every number on this page
 *     comes from PLAN_LIMITS in src/config/planPricing.ts, which mirrors
 *     SUBSCRIPTION_TIER_LIMITS in app/models/teams.py. The old copy advertised
 *     500 and 2,000 monthly unlocks while the server enforced 350 and 1,000.
 *  2. Never print a plan price here. Prices depend on the billing currency the
 *     SERVER charges in, which is only known from a live response. Anything with
 *     a number on it lives on /pricing and /checkout, which read that response.
 *
 * Paid intent still works. Arriving with ?plan=standard&interval=annual creates
 * the free account first and then hands the person to /checkout with the tier
 * and interval intact, which is the only path that can actually bill annually
 * (POST /api/v1/checkout/create-session takes billing_interval; the old
 * pre-registration checkout this page used to call is monthly-only).
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedInput } from '@/components/ui/animated-input'
import { GoogleSignInButton, AuthDivider } from '@/components/google-sign-in-button'
import { cn } from '@/lib/utils'
import { ENDPOINTS, API_CONFIG } from '@/config/api'
import { getPlanLimits } from '@/config/planPricing'

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------
// Mirrors app/utils/password_validator.py. Checked here so the person is told
// before the round trip, never instead of it: the server is still the authority.

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One capital letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
  {
    id: 'special',
    label: 'One symbol, like ! or @',
    test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
  },
] as const

function failedPasswordRules(password: string) {
  return PASSWORD_RULES.filter((rule) => !rule.test(password))
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
// Three states, three treatments: idle, submitting, failed. A failure says what
// went wrong and what to do about it. Never a status code, never "error 400".

interface AuthError {
  message: string
  /** An in-app route that resolves the problem, when one exists. */
  actionHref?: string
  actionLabel?: string
}

function readableSignupError(raw: unknown): AuthError {
  const text = String((raw as Error)?.message ?? raw ?? '').trim()
  const lower = text.toLowerCase()

  if (!text || lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return { message: 'We could not reach our servers. Check your connection and try again.' }
  }
  if (lower.includes('already exists') || lower.includes('already registered')) {
    return {
      message: 'There is already an account with that email address.',
      actionHref: '/auth/login',
      actionLabel: 'Sign in instead',
    }
  }
  if (lower.includes('password')) {
    // The server prefixes its own sentence. Keep its reason, drop its scaffolding.
    const reason = text.replace(/^password validation failed:\s*/i, '')
    return { message: reason.charAt(0).toUpperCase() + reason.slice(1) }
  }
  if (lower.includes('email')) {
    return { message: 'That email address was not accepted. Please check it and try again.' }
  }
  return {
    message: 'We could not create your account just now. Please try again, or email support@following.ae and we will set it up for you.',
  }
}

// ---------------------------------------------------------------------------
// Where the person goes next
// ---------------------------------------------------------------------------

type PaidTier = 'standard' | 'premium'

/** Only ever follow a same-site path: an open redirect here is a phishing hop. */
function safeNext(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<AuthError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => setMounted(true), [])

  // Paid intent, carried from /pricing. The account is still created free; the
  // card comes after, on the one checkout that can bill annually.
  const intendedTier = useMemo<PaidTier | null>(() => {
    const raw = (searchParams.get('plan') || '').toLowerCase()
    return raw === 'standard' || raw === 'premium' ? raw : null
  }, [searchParams])

  const intendedInterval = searchParams.get('interval') === 'annual' ? 'annual' : 'monthly'
  const nextPath = safeNext(searchParams.get('next'))

  const destination = useMemo(() => {
    if (intendedTier) return `/checkout?tier=${intendedTier}&interval=${intendedInterval}`
    return nextPath || '/dashboard'
  }, [intendedTier, intendedInterval, nextPath])

  const freeLimits = getPlanLimits('free')

  const passwordProblems = failedPasswordRules(password)

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Please tell us your name'
    if (!email.trim()) next.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'That does not look like an email address'
    if (!password) next.password = 'Please choose a password'
    else if (passwordProblems.length > 0) next.password = passwordProblems[0].label
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.billing.freeTierRegistration}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            full_name: fullName.trim(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            language: 'en',
          }),
        }
      )

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.detail || data?.message || '')

      // Sign in through the normal login path rather than hand-writing tokens.
      // The registration response does not always carry a usable token (the
      // endpoint falls back to a token-less payload when Supabase is slow), and
      // a half-written session lands the person on a dashboard that bounces them
      // straight back out. One extra request buys a session the whole app agrees
      // exists.
      const { authService } = await import('@/services/authService')
      const signedIn = await authService.login({ email: email.trim(), password })

      if (!signedIn.success) {
        // The registration endpoint answers 200 even when it could not finish
        // (it catches its own errors), and the commonest reason is an email that
        // already has an account. One sentence that is true either way, and a way
        // out of both.
        setError({
          message:
            'We could not sign you in. If you already have an account with that email, sign in with the password you set then.',
          actionHref: '/auth/login',
          actionLabel: 'Go to sign in',
        })
        setIsSubmitting(false)
        return
      }

      // A hard navigation: the auth contexts read the stored session on mount, so
      // a fresh document load is what puts the app in the signed-in state.
      window.location.assign(destination)
    } catch (err) {
      setError(readableSignupError(err))
      setIsSubmitting(false)
    }
  }

  const logoSrc =
    mounted && resolvedTheme === 'dark' ? '/Following Logo Dark Mode.svg' : '/followinglogo.svg'

  return (
    <div className="min-h-[100dvh] bg-background grid lg:grid-cols-[1fr_26rem]">
      {/* ── The ask ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col px-6 py-10 sm:px-10 lg:px-16">
        <img src={logoSrc} alt="Following" className="h-5 w-auto opacity-80" />

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Free to start. No card, and nobody calls you.
            </p>

            {intendedTier && (
              <p className="mt-5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                We will set up your account first, then take you to pay for{' '}
                <span className="font-medium text-foreground capitalize">{intendedTier}</span>
                {intendedInterval === 'annual' ? ', billed annually.' : ', billed monthly.'}
              </p>
            )}

            <div className="mt-8">
              <GoogleSignInButton
                label="Sign up with Google"
                next={destination}
                disabled={isSubmitting}
                onError={(message) => setError({ message })}
                className="rounded-lg"
              />
            </div>

            <AuthDivider label="or" className="my-6" />

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <AnimatedInput
                id="fullName"
                type="text"
                label="Your name"
                placeholder="Jamie Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                error={fieldErrors.fullName}
                disabled={isSubmitting}
                required
              />

              <AnimatedInput
                id="email"
                type="email"
                label="Work email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                error={fieldErrors.email}
                disabled={isSubmitting}
                required
              />

              <div>
                <div className="relative">
                  <AnimatedInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordTouched(true)}
                    autoComplete="new-password"
                    error={fieldErrors.password}
                    disabled={isSubmitting}
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-8 p-1 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Only once they have started. A checklist of five red crosses
                    on an empty field reads as a telling-off. */}
                {passwordTouched && passwordProblems.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {PASSWORD_RULES.map((rule) => {
                      const met = rule.test(password)
                      return (
                        <li
                          key={rule.id}
                          className={cn(
                            'flex items-center gap-2 text-xs',
                            met ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          <Check
                            className={cn('h-3 w-3 shrink-0', met ? 'opacity-100' : 'opacity-25')}
                          />
                          {rule.label}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="space-y-1">
                    <p className="text-foreground">{error.message}</p>
                    {error.actionHref && (
                      <Link
                        href={error.actionHref}
                        className="inline-block font-medium underline underline-offset-2"
                      >
                        {error.actionLabel}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="min-h-[44px] w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your account
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-foreground underline underline-offset-2">
                Sign in
              </Link>
            </p>

            {/* No link here on purpose: there is no /terms or /privacy route in
                this app yet, and a link to a 404 is worse than plain text. Turn
                these into links the day those pages exist. */}
            <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
              By creating an account you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>

      {/* ── The value, beside the ask rather than behind it ──────────────── */}
      <aside className="hidden border-l border-border bg-muted/20 px-12 py-16 lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-xs space-y-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              What you get today
            </p>
            <p className="mt-4 text-lg leading-snug">
              Search Dubai creators, open their real analytics, and build a shortlist you can
              actually send to a client.
            </p>
          </div>

          <ul className="space-y-4 text-sm">
            <ValueLine>
              {freeLimits.monthlyUnlocks} creator profiles a month, unlocked in full
            </ValueLine>
            <ValueLine>
              {freeLimits.monthlyCredits.toLocaleString()} credits, renewed every month
            </ValueLine>
            <ValueLine>Audience, engagement and content analysis on every profile</ValueLine>
            <ValueLine>Shortlists you can name, sort and export</ValueLine>
          </ul>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Upgrade from inside the app whenever you need more, and not before. No card is stored
            until you do.
          </p>
        </div>
      </aside>
    </div>
  )
}

function ValueLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{children}</span>
    </li>
  )
}

export function CleanOnboardingSignup() {
  // useSearchParams needs a boundary above it or the route cannot be prerendered.
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-background">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
