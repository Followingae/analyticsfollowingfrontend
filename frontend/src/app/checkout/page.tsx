'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { billingManager } from '@/services/billingManager'

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tier = searchParams.get('tier') || 'free'
  const mode = searchParams.get('mode') || 'embedded' // 'embedded' or 'redirect'

  useEffect(() => {
    initializeCheckout()
  }, [tier, mode])

  const initializeCheckout = async () => {
    try {
      setLoading(true)
      setError(null)

      // DEBUG: Check if token exists
      const token = localStorage.getItem('access_token')
      const authTokens = localStorage.getItem('auth_tokens')
      console.log('🔍 Checkout Debug:', {
        'Token exists?': !!token,
        'Token value': token ? token.substring(0, 20) + '...' : 'NULL',
        'Auth tokens exist?': !!authTokens,
        'Auth tokens': authTokens ? JSON.parse(authTokens) : 'NULL'
      })

      if (!token && !authTokens) {
        console.error('❌ NO TOKEN FOUND! User not authenticated')
        toast.error('Not authenticated. Please log in first.')
        router.push('/auth/login')
        return
      }

      // Create checkout session using billing manager
      const sessionData = await billingManager.createCheckoutSession(tier)

      if (mode === 'redirect') {
        // Option A: Redirect to Stripe Checkout (simpler)
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
      console.error('Checkout initialization error:', err)
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
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading checkout...</span>
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