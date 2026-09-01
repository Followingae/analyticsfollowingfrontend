'use client'

/**
 * Where Google sends the user back.
 *
 * Supabase redirects here with a one-time code. We swap it for a Supabase session in
 * the browser, hand that session to our backend to verify and provision, and then land
 * the user exactly where a password login lands them. Nothing about the password flow
 * changes: by the time we redirect, the app holds the same kind of session it always did.
 */

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient, takeOAuthNext } from '@/lib/supabaseBrowserClient'

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  // React runs effects twice in dev StrictMode, and an auth code is single use.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const run = async () => {
      // Google or Supabase can refuse before we ever get a code.
      const providerError =
        searchParams.get('error_description') || searchParams.get('error')
      if (providerError) {
        setError(providerError)
        return
      }

      const code = searchParams.get('code')
      if (!code) {
        setError('This sign-in link is incomplete. Please start again.')
        return
      }

      try {
        const supabase = await getSupabaseBrowserClient()
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError || !data?.session?.access_token) {
          setError(exchangeError?.message || 'Could not complete your Google sign-in.')
          return
        }

        const { authService } = await import('@/services/authService')
        const result = await authService.completeOAuthSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
          expires_in: data.session.expires_in || 0,
        })

        if (!result.success) {
          setError(result.error || 'Could not complete your Google sign-in.')
          return
        }

        // The app holds the session now. Drop the scratch copy Supabase kept under its
        // own storage key. Local only: it must not revoke the token we just adopted.
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch {
          /* cosmetic cleanup, never worth failing a sign-in over */
        }

        const next = takeOAuthNext()
        let target = next
        if (!target) {
          const { roleHome } = await import('@/lib/roleHome')
          const user: any = result.data?.user || null
          target = roleHome(user?.role ?? null, user?.email ?? null, user?.staff_role ?? null)
        }

        // A hard navigation, not router.replace: the auth contexts read the stored
        // session on mount, so a fresh document load is what puts the app in the
        // signed-in state. This is the same move authService.logout makes.
        window.location.replace(target)
      } catch (e: any) {
        setError(e?.message || 'Something went wrong completing your sign-in.')
      }
    }

    run()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold">We could not sign you in</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => router.replace('/auth/login')}
            className="w-full rounded-2xl bg-foreground min-h-[44px] py-3 font-medium text-background hover:bg-foreground/90 transition-all duration-150"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}
