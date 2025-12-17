'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2, CreditCard, User, Mail, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { ENDPOINTS } from '@/config/api'

function WelcomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [status, setStatus] = useState<'loading' | 'processing' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [userDetails, setUserDetails] = useState<any>(null)
  const [pollCount, setPollCount] = useState(0)
  const maxPolls = 30 // Maximum 60 seconds of polling (30 * 2 seconds)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get session ID from URL
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setStatus('error')
      setMessage('Invalid payment session. Please try registering again.')
      return
    }

    // Start polling for verification
    startPollingVerification(sessionId)

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [searchParams])

  const startPollingVerification = (sessionId: string) => {
    // Immediately check once
    verifySession(sessionId)

    // Then poll every 2 seconds
    pollIntervalRef.current = setInterval(() => {
      verifySession(sessionId)
    }, 2000)
  }

  const verifySession = async (sessionId: string) => {
    try {
      setPollCount(prev => prev + 1)
      console.log(`Polling verification attempt ${pollCount + 1}/${maxPolls}`)

      // Check if we've exceeded max polls
      if (pollCount >= maxPolls) {
        clearInterval(pollIntervalRef.current!)
        setStatus('error')
        setMessage('Account creation is taking longer than expected. Please contact support.')
        return
      }

      // Call the verification endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINTS.billing.verifySession(sessionId)}`
      )

      const data = await response.json()

      console.log('Verification response:', data)

      if (!response.ok) {
        throw new Error(data.detail || 'Verification failed')
      }

      // Handle different statuses
      if (data.status === 'complete' && data.can_login) {
        // Success! Account is ready
        clearInterval(pollIntervalRef.current!)

        setUserDetails(data.user || {})

        // Store tokens if provided
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token)
          }
        }

        setStatus('success')
        setMessage('Payment verified and account created successfully!')
        toast.success('Welcome to Following! Your account has been created.')

        // Redirect to login or dashboard
        setTimeout(() => {
          if (data.access_token) {
            router.push('/dashboard')
          } else {
            router.push('/auth/login')
          }
        }, 2000)

      } else if (data.status === 'processing') {
        // Still processing, update UI
        setStatus('processing')
        setMessage('Creating your account... This may take a few moments.')
      } else if (data.status === 'failed') {
        // Failed
        clearInterval(pollIntervalRef.current!)
        setStatus('error')
        setMessage(data.message || 'Account creation failed. Please contact support.')
      }

    } catch (error: any) {
      console.error('Error verifying session:', error)

      // Don't stop polling on network errors, just continue
      if (pollCount < 5) {
        // For first few attempts, ignore errors
        return
      }

      // After 5 attempts, show error
      clearInterval(pollIntervalRef.current!)
      setStatus('error')
      setMessage(error.message || 'Failed to verify payment. Please contact support.')
    }
  }

  const handleRetry = () => {
    router.push('/auth/register')
  }

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@following.ae?subject=Payment%20Verification%20Issue'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          {(status === 'loading' || status === 'processing') && (
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          )}

          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Your Payment...'}
            {status === 'processing' && 'Creating Your Account...'}
            {status === 'success' && 'Welcome to Following!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>

          <CardDescription className="text-base mt-2">
            {status === 'loading' && 'Please wait while we confirm your payment with Stripe.'}
            {status === 'processing' && message}
            {status === 'success' && message}
            {status === 'error' && message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <p className="text-sm text-muted-foreground">Verifying payment with Stripe...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <p className="text-sm text-muted-foreground">Waiting for account creation...</p>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-muted-foreground">Payment verified successfully</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <p className="text-sm text-muted-foreground">Creating your account...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <p className="text-sm text-muted-foreground">Setting up your subscription...</p>
              </div>
              {pollCount > 10 && (
                <div className="flex items-center gap-3 mt-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs text-yellow-600">This is taking longer than usual...</p>
                </div>
              )}
            </div>
          )}

          {status === 'success' && userDetails && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">Account Created Successfully</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">{userDetails.email || searchParams.get('email')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">{userDetails.full_name || searchParams.get('full_name')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">
                      {searchParams.get('tier')?.charAt(0).toUpperCase() + searchParams.get('tier')?.slice(1)} Plan
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Redirecting to your dashboard in a moment...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
                  <p>We couldn't verify your payment or create your account.</p>
                  <p>This could happen if:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The payment session expired</li>
                    <li>The payment was cancelled</li>
                    <li>There was a network issue</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleContactSupport}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  )
}