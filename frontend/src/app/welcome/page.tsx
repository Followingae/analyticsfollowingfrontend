'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2, Sparkles, ArrowRight, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ENDPOINTS, API_CONFIG } from '@/config/api'
import { cn } from '@/lib/utils'

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

      console.log(`Verification attempt #${currentPollCount + 1}`)

      const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.billing.verifySession(sessionId)}`
      console.log('Calling:', url)

      const response = await fetch(url)

      let data;
      try {
        data = await response.json()
        console.log('Verification response:', data)
      } catch (e) {
        console.log('Failed to parse response')
        data = {}
      }

      // Handle different status responses as per backend instructions
      if (data.status === 'complete' && data.access_token) {
        console.log('Account creation COMPLETE!')

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

        // Redirect to dashboard since we have tokens
        setTimeout(() => {
          console.log('Redirecting to dashboard')
          router.push('/dashboard')
        }, 2500)

        return

      } else if (data.status === 'processing') {
        // Account still being created, keep polling
        console.log('Account creation in progress, continuing to poll...')

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
      console.error('Error verifying session:', error)

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Modern gradient background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center space-y-8">
            {/* Animated Logo/Icon */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping animation-delay-200" />
              <div className="relative flex items-center justify-center w-full h-full bg-background border-2 border-primary/20 rounded-full">
                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Setting Up Your Account
              </h1>
              <p className="text-muted-foreground">
                Just a moment while we verify your payment...
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </div>
                <span className="text-sm font-medium">Verifying payment</span>
              </div>

              <div className="flex items-center gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Creating account</span>
              </div>

              <div className="flex items-center gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Setting up workspace</span>
              </div>
            </div>

            {/* Poll count indicator (subtle) */}
            {pollCount > 10 && (
              <p className="text-xs text-muted-foreground animate-in fade-in">
                This is taking a bit longer than usual...
              </p>
            )}
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Success Icon */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-full h-full bg-background border-2 border-green-500/30 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            </div>

            {/* Success Text */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                Welcome to Following!
              </h1>
              <p className="text-muted-foreground">
                Your account is ready. Let's get started!
              </p>
            </div>

            {/* Checkmarks */}
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Payment verified</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Account created</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Subscription activated</span>
              </div>
            </div>

            {/* Redirecting indicator */}
            <div className="pt-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Redirecting to dashboard</span>
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Error Icon */}
            <div className="relative mx-auto w-32 h-32">
              <div className="relative flex items-center justify-center w-full h-full bg-background border-2 border-red-500/30 rounded-full">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
            </div>

            {/* Error Text */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-red-600">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground">
                {message}
              </p>
            </div>

            {/* Retry Button */}
            <div className="pt-4">
              <Button
                onClick={handleRetry}
                className="min-w-[200px]"
                size="lg"
              >
                Try Again
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Support Link */}
            <p className="text-xs text-muted-foreground">
              Need help? <a href="mailto:support@following.ae" className="text-primary hover:underline">Contact support</a>
            </p>
          </div>
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