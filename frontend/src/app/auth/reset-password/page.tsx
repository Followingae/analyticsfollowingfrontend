'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Moon, Sun, ArrowLeft, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-all duration-150 focus-within:border-foreground/50 focus-within:bg-foreground/10 focus-within:ring-2 focus-within:ring-foreground/10">
    {children}
  </div>
)

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  const logoSrc = mounted && theme === 'dark'
    ? '/Following Logo Dark Mode.svg'
    : '/followinglogo.svg'

  // Password strength indicators
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const strengthMet = Object.values(checks).filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true)

    try {
      // Supabase handles the token from the URL automatically via the auth callback
      // We need to use the Supabase client to update the password
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      )

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setIsComplete(true)
      toast.success('Password updated successfully')

      setTimeout(() => router.push('/auth/login'), 2000)
    } catch {
      setError('Something went wrong. Please request a new reset link.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center font-geist w-[100dvw] relative p-8">
      {/* Theme Toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 z-10 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </button>
      )}

      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="mb-4 animate-element animate-delay-50">
            <img
              src={logoSrc}
              className="h-6 w-auto object-contain"
              alt="Following Logo"
            />
          </div>

          {isComplete ? (
            /* ── Success State ── */
            <div className="flex flex-col gap-4">
              <div className="animate-element animate-delay-100 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <Check className="h-5 w-5 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-semibold leading-tight tracking-tight">
                  Password Updated
                </h1>
              </div>
              <p className="animate-element animate-delay-200 text-muted-foreground">
                Your password has been reset. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            /* ── Reset Form ── */
            <>
              <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
                <span className="font-light text-foreground tracking-tighter">
                  New Password
                </span>
              </h1>
              <p className="animate-element animate-delay-200 text-muted-foreground">
                Choose a strong password for your account
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* New Password */}
                <div className="animate-element animate-delay-300">
                  <label htmlFor="new-password" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
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
                          : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-150" />
                        }
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>

                {/* Password Strength */}
                {password.length > 0 && (
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
                )}

                {/* Confirm Password */}
                <div className="animate-element animate-delay-400">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <GlassInputWrapper>
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-transparent text-sm p-4 min-h-[44px] rounded-2xl focus:outline-none transition-colors duration-150"
                    />
                  </GlassInputWrapper>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || strengthMet < 4 || password !== confirmPassword}
                  className="animate-element animate-delay-500 w-full rounded-2xl bg-foreground min-h-[44px] py-4 font-medium text-background hover:bg-foreground/90 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                  )}
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>

              <button
                onClick={() => router.push('/auth/login')}
                className="animate-element animate-delay-600 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
