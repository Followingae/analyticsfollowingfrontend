'use client'

/**
 * The page at the end of a team invitation email.
 *
 * Almost everyone who lands here is signed out, and roughly half of them have never had a
 * Following account at all, so the page has to work with nothing: it reads who invited
 * them and to what from a public preview endpoint, then asks for the one thing it still
 * needs. A password if they are new, a sign in if they are not, a single button if they
 * already happen to be signed in as the right person.
 *
 * Deliberately the same shape as /auth/reset-password: someone arriving from an email and
 * being asked to set a password should recognise the room.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Check, Clock, Eye, EyeOff, Mail, Moon, Sun, Users } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { API_CONFIG } from '@/config/api'
import { tokenManager } from '@/utils/tokenManager'
import { roleHome } from '@/lib/roleHome'

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-all duration-150 focus-within:border-foreground/50 focus-within:bg-foreground/10 focus-within:ring-2 focus-within:ring-foreground/10">
    {children}
  </div>
)

type InvitationState = 'valid' | 'expired' | 'accepted' | 'withdrawn' | 'not_found'

interface InvitationPreview {
  state: InvitationState
  email?: string
  team_name?: string
  role?: string
  inviter_name?: string
  personal_message?: string | null
  expires_at?: string | null
  has_account?: boolean
  seat_available?: boolean
  message?: string | null
}

const ROLE_LABEL: Record<string, string> = {
  member: 'Member',
  manager: 'Manager',
  admin: 'Admin',
}

export default function AcceptInvitationPage() {
  const params = useParams<{ token: string }>()
  const token = typeof params?.token === 'string' ? params.token : ''
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, login, logout } = useEnhancedAuth()

  const [mounted, setMounted] = useState(false)
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [joinedTeam, setJoinedTeam] = useState<string | null>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const logoSrc = mounted && theme === 'dark'
    ? '/Following Logo Dark Mode.svg'
    : '/followinglogo.svg'

  // ── The invitation itself ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/api/v1/teams/invitations/${encodeURIComponent(token)}/preview`
        )
        const data = await res.json()
        if (!cancelled) setPreview(res.ok ? data : { state: 'not_found' })
      } catch {
        if (!cancelled) setPreview({ state: 'not_found' })
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [token])

  const isNewAccount = preview?.state === 'valid' && !preview?.has_account
  const signedInAsInvitee =
    isAuthenticated &&
    !!user?.email &&
    !!preview?.email &&
    user.email.trim().toLowerCase() === preview.email.trim().toLowerCase()

  // Password rules, matching /auth/reset-password so the bar is the same everywhere.
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const strengthMet = Object.values(checks).filter(Boolean).length

  /**
   * Why a just-created account could not sign in.
   *
   * The auth context's login() returns a bare boolean, and after a successful sign up the
   * two plausible causes are worlds apart: the project requires email confirmation, or
   * something genuinely went wrong. The login endpoint already distinguishes them (400 and
   * a message about confirmation, versus 401), so one cheap call on the failure path buys
   * the difference between "check your inbox" and a dead end.
   */
  const needsEmailConfirmation = useCallback(async (email: string, pw: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      })
      if (res.ok) return false
      const data = await res.json().catch(() => ({}))
      const detail = typeof data?.detail === 'string' ? data.detail.toLowerCase() : ''
      return detail.includes('confirm')
    } catch {
      return false
    }
  }, [])

  const claimSeat = useCallback(async (): Promise<boolean> => {
    const res = await fetch(
      `${API_CONFIG.BASE_URL}/api/v1/teams/invitations/${encodeURIComponent(token)}/accept`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenManager.getTokenSync() || ''}`,
        },
      }
    )
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const detail = typeof data?.detail === 'string' ? data.detail : 'We could not add you to the team.'
      setError(detail)
      return false
    }

    // A double click races past the membership check and lands on the unique constraint.
    // The backend reports that as a success, because it is one: they are on the team.
    if (data?.already_member) setAlreadyMember(true)
    setJoinedTeam(data?.team_name || preview?.team_name || 'your team')
    return true
  }, [token, preview?.team_name])

  const landInside = useCallback(() => {
    // A short beat so they read the confirmation, then straight into the product.
    setTimeout(() => {
      router.push(roleHome(user?.role, user?.email, user?.staff_role))
    }, 1600)
  }, [router, user?.role, user?.email, user?.staff_role])

  // ── Already signed in as the right person: one button ──────────────────
  const handleJoinAsCurrentUser = async () => {
    setError('')
    setSubmitting(true)
    try {
      if (await claimSeat()) {
        toast.success('You are on the team')
        landInside()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── New account: set a password, then straight in ──────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (strengthMet < 4) {
      setError('Please meet all password requirements')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/teams/invitations/${encodeURIComponent(token)}/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, full_name: fullName.trim() || undefined }),
        }
      )
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(typeof data?.detail === 'string' ? data.detail : 'We could not create your account.')
        return
      }

      // Two outcomes are possible here and neither is an error. If the Supabase project
      // signs new accounts straight in, we have a session and can claim the seat now. If
      // it requires the address to be confirmed first, the account exists but there is no
      // session yet, and the right thing is to say so rather than show a dead login.
      const signedIn = await login(preview?.email || '', password)
      if (!signedIn) {
        if (await needsEmailConfirmation(preview?.email || '', password)) {
          setNeedsConfirmation(true)
          return
        }
        setError('Your account is ready, but signing you in did not work. Please sign in and open this link again.')
        return
      }

      if (await claimSeat()) {
        toast.success('You are on the team')
        landInside()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Existing account, signed out: sign in, then claim ──────────────────
  const handleSignInAndJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const signedIn = await login(preview?.email || '', password)
      if (!signedIn) {
        setError('That password did not work. Try again, or reset it and come back to this link.')
        return
      }
      if (await claimSeat()) {
        toast.success('You are on the team')
        landInside()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Frames ─────────────────────────────────────────────────────────────
  const Frame = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center font-geist w-full relative p-8">
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 z-10 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            : <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />}
        </button>
      )}
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="mb-4 animate-element animate-delay-50">
            <img src={logoSrc} className="h-6 w-auto object-contain" alt="Following" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )

  const ErrorBox = () => error ? (
    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      {error}
    </div>
  ) : null

  const PasswordStrength = () => password.length > 0 ? (
    <div className="animate-element animate-delay-350 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= strengthMet
                ? strengthMet <= 2 ? 'bg-amber-500' : 'bg-emerald-500'
                : 'bg-border'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className={checks.length ? 'text-emerald-500' : ''}>8+ characters</span>
        <span className={checks.uppercase ? 'text-emerald-500' : ''}>Uppercase</span>
        <span className={checks.lowercase ? 'text-emerald-500' : ''}>Lowercase</span>
        <span className={checks.number ? 'text-emerald-500' : ''}>Number</span>
      </div>
    </div>
  ) : null

  const InvitationHeader = () => (
    <>
      <div className="animate-element animate-delay-100 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
          <Users className="h-5 w-5 text-emerald-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
          Join {preview?.team_name}
        </h1>
      </div>
      <p className="animate-element animate-delay-200 text-muted-foreground">
        {preview?.inviter_name || 'Your team owner'} kept a seat for you as{' '}
        <span className="text-foreground font-medium">
          {ROLE_LABEL[(preview?.role || 'member').toLowerCase()] || 'Member'}
        </span>
        . It was sent to <span className="text-foreground font-medium">{preview?.email}</span>.
      </p>
      {preview?.personal_message && (
        <div className="animate-element animate-delay-250 rounded-2xl border-l-2 border-emerald-500 bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {preview.personal_message}
          </p>
        </div>
      )}
    </>
  )

  const BackToSignIn = () => (
    <button
      onClick={() => router.push('/auth/login')}
      className="animate-element animate-delay-600 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to Sign In
    </button>
  )

  // ── Loading ────────────────────────────────────────────────────────────
  if (loadingPreview) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  // ── Account made, but the address has to be confirmed first ────────────
  if (needsConfirmation) {
    return (
      <Frame>
        <div className="flex flex-col gap-4">
          <div className="animate-element animate-delay-100 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <Mail className="h-5 w-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              Check your email
            </h1>
          </div>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            Your account is created. We sent a confirmation link to{' '}
            <span className="text-foreground font-medium">{preview?.email}</span>. Open it,
            then come back to this page and sign in.
          </p>
          <p className="animate-element animate-delay-300 text-sm text-muted-foreground">
            Your seat on {preview?.team_name} is still held, and this invitation stays valid
            until {preview?.expires_at ? new Date(preview.expires_at).toLocaleDateString() : 'it expires'}.
          </p>
          <BackToSignIn />
        </div>
      </Frame>
    )
  }

  // ── Joined ─────────────────────────────────────────────────────────────
  if (joinedTeam) {
    return (
      <Frame>
        <div className="flex flex-col gap-4">
          <div className="animate-element animate-delay-100 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              {alreadyMember ? 'You are already in' : 'You are in'}
            </h1>
          </div>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            {alreadyMember
              ? `You are already on ${joinedTeam}. Taking you there now.`
              : `You have joined ${joinedTeam}. Taking you there now.`}
          </p>
        </div>
      </Frame>
    )
  }

  // ── Dead link ──────────────────────────────────────────────────────────
  if (!preview || preview.state !== 'valid') {
    const headings: Record<InvitationState, string> = {
      valid: 'Join your team',
      expired: 'This invitation expired',
      accepted: 'This invitation was already used',
      withdrawn: 'This invitation was withdrawn',
      not_found: 'We could not find this invitation',
    }
    const heading = headings[preview?.state || 'not_found']

    return (
      <Frame>
        <div className="flex flex-col gap-4">
          <div className="animate-element animate-delay-100 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              {preview?.state === 'expired'
                ? <Clock className="h-5 w-5 text-amber-500" />
                : <AlertCircle className="h-5 w-5 text-amber-500" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              {heading}
            </h1>
          </div>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            {preview?.message || 'Ask your team owner to send you a new invitation.'}
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="animate-element animate-delay-300 w-full rounded-2xl bg-foreground min-h-[44px] py-4 font-medium text-background hover:bg-foreground/90 transition-all duration-150"
          >
            Go to sign in
          </button>
        </div>
      </Frame>
    )
  }

  // ── The team is full ───────────────────────────────────────────────────
  if (preview.seat_available === false) {
    return (
      <Frame>
        <div className="flex flex-col gap-4">
          <div className="animate-element animate-delay-100 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              {preview.team_name} is full
            </h1>
          </div>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            Every seat on this plan is taken right now. Your invitation is still valid, so
            once {preview.inviter_name || 'your team owner'} frees a seat or upgrades the
            plan, this link will work.
          </p>
          <BackToSignIn />
        </div>
      </Frame>
    )
  }

  // ── Signed in as someone else ──────────────────────────────────────────
  if (isAuthenticated && !signedInAsInvitee) {
    return (
      <Frame>
        <InvitationHeader />
        <div className="animate-element animate-delay-300 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          You are signed in as <span className="text-foreground font-medium">{user?.email}</span>,
          and this invitation belongs to {preview.email}. Sign out and come back to this link
          to claim it.
        </div>
        <button
          onClick={() => { logout(); }}
          className="animate-element animate-delay-400 w-full rounded-2xl bg-foreground min-h-[44px] py-4 font-medium text-background hover:bg-foreground/90 transition-all duration-150"
        >
          Sign out
        </button>
      </Frame>
    )
  }

  // ── Signed in as the invitee: one button ───────────────────────────────
  if (signedInAsInvitee) {
    return (
      <Frame>
        <InvitationHeader />
        <ErrorBox />
        <button
          onClick={handleJoinAsCurrentUser}
          disabled={submitting}
          className="animate-element animate-delay-400 w-full rounded-2xl bg-foreground min-h-[44px] py-4 font-medium text-background hover:bg-foreground/90 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
          )}
          {submitting ? 'Joining...' : `Join ${preview.team_name}`}
        </button>
      </Frame>
    )
  }

  // ── New here: pick a password ──────────────────────────────────────────
  if (isNewAccount) {
    return (
      <Frame>
        <InvitationHeader />
        <form className="space-y-5" onSubmit={handleCreateAccount}>
          <div className="animate-element animate-delay-300">
            <label htmlFor="full-name" className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Your name
            </label>
            <GlassInputWrapper>
              <input
                id="full-name"
                type="text"
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="How your team will see you"
                className="w-full bg-transparent text-sm p-4 min-h-[44px] rounded-2xl focus:outline-none transition-colors duration-150"
              />
            </GlassInputWrapper>
          </div>

          <div className="animate-element animate-delay-300">
            <label htmlFor="new-password" className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Choose a password <span className="text-red-500">*</span>
            </label>
            <GlassInputWrapper>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-transparent text-sm p-4 pr-12 min-h-[44px] rounded-2xl focus:outline-none transition-colors duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-150" />
                    : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-150" />}
                </button>
              </div>
            </GlassInputWrapper>
          </div>

          <PasswordStrength />

          <div className="animate-element animate-delay-400">
            <label htmlFor="confirm-password" className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <GlassInputWrapper>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type it once more"
                className="w-full bg-transparent text-sm p-4 min-h-[44px] rounded-2xl focus:outline-none transition-colors duration-150"
              />
            </GlassInputWrapper>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          <ErrorBox />

          <button
            type="submit"
            disabled={submitting || strengthMet < 4 || password !== confirmPassword}
            className="animate-element animate-delay-500 w-full rounded-2xl bg-foreground min-h-[44px] py-4 font-medium text-background hover:bg-foreground/90 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
            )}
            {submitting ? 'Setting you up...' : `Join ${preview.team_name}`}
          </button>
        </form>
        <BackToSignIn />
      </Frame>
    )
  }

  // ── Has an account, signed out: sign in and claim ──────────────────────
  return (
    <Frame>
      <InvitationHeader />
      <form className="space-y-5" onSubmit={handleSignInAndJoin}>
        <div className="animate-element animate-delay-300">
          <label htmlFor="invite-email" className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Email
          </label>
          <GlassInputWrapper>
            <input
              id="invite-email"
              type="email"
              value={preview.email || ''}
              readOnly
              className="w-full bg-transparent text-sm p-4 min-h-[44px] rounded-2xl focus:outline-none text-muted-foreground"
            />
          </GlassInputWrapper>
        </div>

        <div className="animate-element animate-delay-400">
          <label htmlFor="signin-password" className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Password <span className="text-red-500">*</span>
          </label>
          <GlassInputWrapper>
            <div className="relative">
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your Following password"
                className="w-full bg-transparent text-sm p-4 pr-12 min-h-[44px] rounded-2xl focus:outline-none transition-colors duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-150" />
                  : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-150" />}
              </button>
            </div>
          </GlassInputWrapper>
        </div>

        <ErrorBox />

        <button
          type="submit"
          disabled={submitting || !password}
          className="animate-element animate-delay-500 w-full rounded-2xl bg-foreground min-h-[44px] py-4 font-medium text-background hover:bg-foreground/90 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
          )}
          {submitting ? 'Joining...' : `Sign in and join ${preview.team_name}`}
        </button>
      </form>
      <BackToSignIn />
    </Frame>
  )
}
