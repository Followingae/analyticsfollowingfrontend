'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, Sparkles, ArrowRight, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ENDPOINTS, API_CONFIG } from '@/config/api'

function WelcomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [userDetails, setUserDetails] = useState<any>(null)
  const [pollCount, setPollCount] = useState(0)
  const maxPolls = 30
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasVerifiedRef = useRef(false) // Prevent double processing

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setStatus('error')
      setMessage('Invalid payment session. Please try registering again.')
      return
    }

    // Prevent double initialization
    if (hasVerifiedRef.current) {
      return
    }

    startPollingVerification(sessionId)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [searchParams])

  const startPollingVerification = (sessionId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    // Immediately check once
    verifySession(sessionId)

    // Then poll every 2 seconds
    pollIntervalRef.current = setInterval(() => {
      if (!hasVerifiedRef.current) {
        verifySession(sessionId)
      }
    }, 2000)
  }

  const verifySession = async (sessionId: string) => {
    try {
      // Prevent concurrent verifications
      if (hasVerifiedRef.current) {
        return
      }

      const currentPollCount = pollCount
      setPollCount(prev => prev + 1)

      const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.billing.verifySession(sessionId)}`
      const response = await fetch(url)

      let data;
      try {
        data = await response.json()
      } catch (error) {
        console.error('Failed to parse welcome page response:', error)
        data = {}
      }

      // Handle different status responses as per backend instructions
      if (data.status === 'complete' && data.access_token) {
        // Mark as verified immediately
        hasVerifiedRef.current = true

        // Stop polling immediately
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }

        // Store authentication tokens in the format TokenManager expects
        const tokenData = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || undefined,
          token_type: 'bearer',
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }
        localStorage.setItem('auth_tokens', JSON.stringify(tokenData))

        // Store user info in the key AuthContext expects
        if (data.user) {
          setUserDetails(data.user)
          localStorage.setItem('user_data', JSON.stringify(data.user))
        }

        setStatus('success')
        setMessage('Your account has been created successfully!')
        toast.success('Welcome to Analytics Following!')

        // Redirect to dashboard immediately
        router.push('/dashboard')

        return

      } else if (data.status === 'processing') {
        // Account still being created, keep polling
        if (currentPollCount >= maxPolls) {
          hasVerifiedRef.current = true
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setStatus('error')
          setMessage('Account creation is taking longer than expected. Please check your email.')
          return
        }
        // Continue polling automatically via interval

      } else if (data.status === 'pending_payment') {
        // Payment not completed
        hasVerifiedRef.current = true
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setStatus('error')
        setMessage('Payment was not completed. Please try again.')
        return

      } else if (response.status === 404) {
        // Session not found
        hasVerifiedRef.current = true
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setStatus('error')
        setMessage('Payment session not found. Please try registering again.')
        return

      } else if (response.status === 400) {
        // Invalid session
        hasVerifiedRef.current = true
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setStatus('error')
        setMessage(data.detail || 'Invalid payment session. Please try again.')
        return
      }

    } catch (error: any) {

      if (pollCount >= 5) {
        hasVerifiedRef.current = true
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setStatus('error')
        setMessage('Failed to verify payment. Please check your connection.')
      }
    }
  }

  const handleRetry = () => {
    router.push('/auth/register')
  }

  /**
   * Density tier: READING. This is one screen with one thing on it, so it gets the
   * reading treatment: text left-aligned and capped near 65 characters, 40px between
   * subjects, and nothing competing with the single sentence that says what is happening.
   *
   * What came off: two blurred colour blobs pulsing behind the content, a ping halo around
   * a 128px icon, a gradient-clipped heading, and three raw palette colours (green-500,
   * red-500, red-600) that are not tokens in this theme. What went on: the theme's own
   * success and danger tokens, one icon at text scale, and left alignment, because a
   * centred column of three left-aligned checkmarks under a centred heading was never
   * aligned to anything.
   */
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-ds-5">

        {status === 'loading' && (
          <>
            <div className="flex flex-col gap-ds-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-ds-title">Setting up your account</h1>
              <p className="max-w-[65ch] text-ds-body text-muted-foreground">
                We are verifying your payment. This usually takes a few seconds.
              </p>
            </div>

            <ol className="flex flex-col gap-ds-3">
              <li className="flex items-center gap-ds-3">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                <span className="text-ds-body font-medium">Verifying payment</span>
              </li>
              <li className="flex items-center gap-ds-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span className="text-ds-body text-muted-foreground">Creating account</span>
              </li>
              <li className="flex items-center gap-ds-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span className="text-ds-body text-muted-foreground">Setting up workspace</span>
              </li>
            </ol>

            {pollCount > 10 && (
              <p className="text-ds-body-sm text-muted-foreground">
                This is taking longer than usual. Do not close this page.
              </p>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex flex-col gap-ds-2">
              <CheckCircle className="h-6 w-6 text-success" />
              <h1 className="text-ds-title">Welcome to Following</h1>
              <p className="max-w-[65ch] text-ds-body text-muted-foreground">
                Your account is ready.
              </p>
            </div>

            <ul className="flex flex-col gap-ds-3">
              {['Payment verified', 'Account created', 'Subscription activated'].map(step => (
                <li key={step} className="flex items-center gap-ds-3">
                  <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                  <span className="text-ds-body">{step}</span>
                </li>
              ))}
            </ul>

            <p className="flex items-center gap-ds-2 text-ds-body-sm text-muted-foreground">
              Taking you to your dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex flex-col gap-ds-2">
              <XCircle className="h-6 w-6 text-danger" />
              <h1 className="text-ds-title">Something went wrong</h1>
              <p className="max-w-[65ch] text-ds-body text-muted-foreground">
                {message}
              </p>
            </div>

            <div>
              <Button onClick={handleRetry} size="lg" className="min-h-[44px]">
                Try again
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="text-ds-body-sm text-muted-foreground">
              Need help?{' '}
              <a href="mailto:support@following.ae" className="text-primary hover:underline">
                Contact support
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  )
}