'use client'
import { tokenManager } from '@/utils/tokenManager'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { billingManager } from '@/services/billingManager'

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Do NOT auto-redirect on mount — show an in-app order summary first and only
  // create the Stripe session once the user explicitly confirms.
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tier = searchParams.get('tier') || 'free'
  // Backend hosted checkout only — embedded mode (client_secret) is not supported.
  const mode = searchParams.get('mode') || 'redirect'

  const getPlanPrice = (planTier: string) => {
    const prices: Record<string, string> = {
      free: '$0',
      standard: '$199 / month',
      premium: '$499 / month'
    }
    return prices[planTier] || ''
  }

  const initializeCheckout = async () => {
    setStarted(true)
    try {
      setLoading(true)
      setError(null)

      // Check if user is authenticated
      const token = (tokenManager.getTokenSync() || localStorage.getItem('access_token'))
      const authTokens = localStorage.getItem('auth_tokens')

      if (!token && !authTokens) {
        toast.error('Not authenticated. Please log in first.')
        router.push('/auth/login')
        return
      }

      // Create checkout session using billing manager
      const sessionData = await billingManager.createCheckoutSession(tier)

      if (mode === 'redirect') {
        // Hosted-checkout: prefer the checkout_url returned by the backend (no Stripe.js round-trip needed).
        if (sessionData.checkout_url) {
          window.location.href = sessionData.checkout_url
          return
        }

        // Fallback: use Stripe.js redirectToCheckout with session_id.
        const stripe = await stripePromise
        if (!stripe) {
          throw new Error('Failed to load Stripe')
        }

        const { error } = await stripe.redirectToCheckout({
          sessionId: sessionData.session_id
        })

        if (error) {
          throw error
        }
      } else {
        // Option B: Embedded Checkout (stays on your site)
        const stripe = await stripePromise
        if (!stripe) {
          throw new Error('Failed to load Stripe')
        }

        // Initialize Embedded Checkout
        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret: sessionData.client_secret
        })

        // Mount checkout
        checkout.mount('#checkout')
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize checkout')
      setLoading(false)
      toast.error('Failed to load checkout. Please try again.')
    }
  }

  const getPlanDisplayName = (planTier: string) => {
    const names: Record<string, string> = {
      free: 'Free',
      standard: 'Standard ($199/mo)',
      premium: 'Premium ($499/mo)'
    }
    return names[planTier] || planTier
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
          <p className="text-muted-foreground mt-2">
            You're subscribing to the {getPlanDisplayName(tier)} plan
          </p>
        </div>

        <Card className="p-6">
          {/* Order summary — shown BEFORE any redirect. The Stripe session is only
              created when the user clicks "Continue to payment". */}
          {!started && !error && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Order summary</h2>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{getPlanDisplayName(tier)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-xl font-bold">{getPlanPrice(tier)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <p>You&apos;ll be taken to Stripe to complete your payment securely. You can review the full total before you&apos;re charged.</p>
              </div>

              <Button className="w-full" size="lg" onClick={initializeCheckout}>
                Continue to payment
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Redirecting to secure checkout...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={initializeCheckout}>Try Again</Button>
            </div>
          )}

          {/* Stripe Embedded Checkout will be mounted here */}
          {mode === 'embedded' && <div id="checkout" className="min-h-[600px]"></div>}
        </Card>

        {/* Test Card Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Test Card Numbers</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Success: 4242 4242 4242 4242</li>
              <li>🔐 Requires Auth: 4000 0025 0000 3155</li>
              <li>❌ Declined: 4000 0000 0000 9995</li>
              <li>Use any future expiry date and any 3-digit CVC</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}