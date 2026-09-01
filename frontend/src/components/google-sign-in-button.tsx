'use client'

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { isGoogleSignInConfigured, startGoogleSignIn } from '@/lib/supabaseBrowserClient'

/** Google's brand mark. Inline so the button never waits on a third-party asset. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.28a12 12 0 0 0 0 10.74l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.63l4.01 3.09C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  )
}

interface GoogleSignInButtonProps {
  /** Where to land after sign-in, when the user arrived with a deep link. */
  next?: string | null
  /** Copy on the button. Sign-in says "Continue with Google"; register can say "Sign up". */
  label?: string
  /** True while the surrounding form is busy, so the two buttons cannot both fire. */
  disabled?: boolean
  className?: string
  onError?: (message: string) => void
}

export function GoogleSignInButton({
  next,
  label = 'Continue with Google',
  disabled = false,
  className,
  onError,
}: GoogleSignInButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Nothing to offer if the deployment has no Supabase keys. Better an absent button
  // than one that throws when pressed.
  if (!isGoogleSignInConfigured()) return null

  const handleClick = async () => {
    setIsRedirecting(true)
    try {
      await startGoogleSignIn(next)
      // Success is a full-page redirect to Google, so we stay in the loading state.
    } catch (error: any) {
      const message = error?.message || 'Could not start Google sign-in. Please try again.'
      setIsRedirecting(false)
      if (onError) {
        onError(message)
      } else {
        toast.error(message)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isRedirecting}
      className={cn(
        'w-full rounded-2xl border border-border bg-foreground/5 min-h-[44px] py-4 px-4',
        'font-medium text-foreground transition-all duration-150',
        'hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2.5',
        className
      )}
    >
      {isRedirecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleMark className="h-[18px] w-[18px]" />
      )}
      <span className="text-sm">{isRedirecting ? 'Opening Google...' : label}</span>
    </button>
  )
}

/** A labelled rule, for putting the Google button beside the email form. */
export function AuthDivider({ label = 'or', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
