'use client'

/**
 * The merchant's first screen: one password, then straight into their home.
 *
 * The link in their email carries a token that is the only authorisation here.
 * The page is public, white and short on purpose: by the time they arrive, a
 * person has already spoken to them and their business is already set up. The
 * only thing left to ask is a password.
 *
 * The password rules mirror app/utils/password_validator.py, checked here so
 * they are told before the round trip, never instead of it.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedInput } from '@/components/ui/animated-input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { merchantApi, type AccessLink } from '@/services/merchantApi'
import { Face } from '@/components/merchant/bits'

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One capital letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
  { id: 'special', label: 'One symbol, like @ or #', test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
] as const

type Phase = 'checking' | 'ready' | 'expired' | 'unreachable' | 'done'

export function SetPassword({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [link, setLink] = useState<AccessLink | null>(null)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let alive = true
    merchantApi
      .accessLink(token)
      .then((res) => {
        if (!alive) return
        setLink(res)
        setPhase(res.valid ? 'ready' : 'expired')
      })
      .catch(() => alive && setPhase('unreachable'))
    return () => {
      alive = false
    }
  }, [token])

  const problems = PASSWORD_RULES.filter((r) => !r.test(password))

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setTouched(true)
    if (problems.length > 0) return
    setSubmitting(true)
    try {
      const result = await merchantApi.setPassword(token, password)
      const email = result?.email || link?.email
      if (!email) throw new Error('We set your password but could not sign you in. Please sign in with your email.')
      const { authService } = await import('@/services/authService')
      const signedIn = await authService.login({ email, password })
      if (!signedIn.success) {
        setError('Your password is set, but we could not sign you in just now. Please sign in with your email and the password you chose.')
        setSubmitting(false)
        return
      }
      setPhase('done')
      // A hard navigation: the auth contexts read the stored session on mount.
      window.location.assign('/dashboard')
    } catch (err) {
      const text = String((err as Error)?.message || '')
      const lower = text.toLowerCase()
      if (lower.includes('expired') || lower.includes('used') || lower.includes('invalid')) {
        setPhase('expired')
      } else {
        setError(text || 'That did not go through. Please try again.')
      }
      setSubmitting(false)
    }
  }

  const name = link?.business_name || ''

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-6 py-10 sm:px-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/followinglogo.svg" alt="Following" className="h-5 w-auto opacity-80" />

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-sm">
          {phase === 'checking' && (
            <div className="space-y-4">
              <Skeleton className="size-14 rounded-2xl" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="mt-8 h-11 w-full" />
            </div>
          )}

          {(phase === 'expired' || phase === 'unreachable') && (
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {phase === 'expired' ? 'This link has been used or has expired' : 'We could not check this link'}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {phase === 'expired'
                  ? 'Set-up links work once and for a limited time. If you already set a password, sign in. Otherwise email us and we will send a fresh one.'
                  : 'Our servers did not answer. Give it a moment and reload, or email us and we will sort it out.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="min-h-[44px] rounded-full px-5">
                  <a href="mailto:partners@following.ae?subject=My%20set-up%20link">Email us</a>
                </Button>
                <Button asChild variant="ghost" className="min-h-[44px] rounded-full px-5">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </div>
            </div>
          )}

          {(phase === 'ready' || phase === 'done') && (
            <>
              <Face name={name || 'F'} src={link?.logo_url} className="size-14 rounded-2xl text-base" />
              <h1 className="mt-6 text-3xl font-semibold tracking-tight">
                Welcome, <span className="font-serif font-normal italic">{name || 'partner'}</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Your account is ready{link?.email ? ` for ${link.email}` : ''}. Choose a password and you are in.
              </p>

              <form onSubmit={submit} noValidate className="mt-8 space-y-5">
                <div>
                  <div className="relative">
                    <AnimatedInput
                      id="password"
                      type={show ? 'text' : 'password'}
                      label="Password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setTouched(true)}
                      autoComplete="new-password"
                      disabled={submitting || phase === 'done'}
                      className="pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute right-3 top-8 p-1 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={show ? 'Hide password' : 'Show password'}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {touched && problems.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const met = rule.test(password)
                        return (
                          <li key={rule.id} className={cn('flex items-center gap-2 text-xs', met ? 'text-foreground' : 'text-muted-foreground')}>
                            <Check className={cn('h-3 w-3 shrink-0', met ? 'opacity-100' : 'opacity-25')} />
                            {rule.label}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-foreground">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={submitting || phase === 'done'} className="min-h-[44px] w-full rounded-full">
                  {submitting || phase === 'done' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {phase === 'done' ? 'Taking you in' : 'Setting your password'}
                    </>
                  ) : (
                    'Set my password'
                  )}
                </Button>
              </form>

              <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
                Questions? Email partners@following.ae and a person will answer.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
