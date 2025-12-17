'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  User,
  Building2,
  Phone,
  Lock,
  Zap,
  Rocket,
  Crown,
  ArrowRight,
  Shield,
  CreditCard,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ENDPOINTS } from '@/config/api'

interface PlanDetails {
  id: 'free' | 'standard' | 'premium' | 'enterprise'
  name: string
  price: string
  priceMonthly: number
  credits: string
  features: string[]
  popular?: boolean
  icon: React.ElementType
  color: string
}

const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceMonthly: 0,
    credits: '5 profile unlocks',
    features: [
      '5 profile unlocks per month',
      'Basic analytics',
      'Search history',
      'Community support'
    ],
    icon: User,
    color: 'text-gray-600'
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$199',
    priceMonthly: 199,
    credits: '500 profile unlocks',
    features: [
      '500 profile unlocks per month',
      'Advanced analytics',
      'AI-powered insights',
      'Export data',
      'Email support',
      '2 team members'
    ],
    popular: true,
    icon: Zap,
    color: 'text-blue-600'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$499',
    priceMonthly: 499,
    credits: '2000 profile unlocks',
    features: [
      '2000 profile unlocks per month',
      'All analytics features',
      'Priority AI insights',
      'API access',
      'Priority support',
      '5 team members',
      '20% top-up discount'
    ],
    icon: Crown,
    color: 'text-purple-600'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceMonthly: 0,
    credits: 'Unlimited',
    features: [
      'Unlimited profile unlocks',
      'Custom analytics',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Unlimited team members'
    ],
    icon: Building2,
    color: 'text-gray-900'
  }
]

export function ModernSignup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium' | 'enterprise'>('free')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    company: '',
    jobTitle: '',
    phoneNumber: '',
    termsAccepted: false,
    marketingConsent: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain a lowercase letter'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain an uppercase letter'
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain a number'
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"|<>?,./`~]/.test(formData.password)) {
      newErrors.password = 'Password must contain a special character'
    }

    // Full name validation
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required'
    }

    // Terms validation
    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsLoading(true)

    try {
      if (selectedPlan === 'free') {
        // FREE TIER - Direct registration
        await handleFreeSignup()
      } else if (selectedPlan === 'enterprise') {
        // ENTERPRISE - Admin-managed billing
        await handleEnterpriseSignup()
      } else {
        // PAID PLANS - Payment first
        await handlePaidSignup()
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const handleFreeSignup = async () => {
    console.log('Processing free tier signup...')

    // V3 API simplified - only requires essential fields
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINTS.billing.freeTierRegistration}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // NO Authorization header - new user
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Registration failed')
    }

    // Store tokens and redirect
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    }

    toast.success('Account created successfully!')
    router.push('/dashboard')
  }

  const handlePaidSignup = async () => {
    console.log(`Processing ${selectedPlan} plan signup with payment...`)

    // V3 API simplified - only requires essential fields
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINTS.billing.preRegistrationCheckout}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // NO Authorization header - user doesn't exist yet!
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        plan: selectedPlan // 'standard' or 'premium'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to create checkout session')
    }

    console.log('Checkout session created:', data)

    // Redirect to Stripe checkout
    if (data.sessionUrl || data.checkout_url) {
      window.location.href = data.sessionUrl || data.checkout_url
    } else {
      throw new Error('No checkout URL received from backend')
    }
  }

  const handleEnterpriseSignup = async () => {
    console.log('Processing enterprise signup...')

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINTS.auth.register}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: 'standard',
        billing_type: 'admin_managed',
        company: formData.company,
        job_title: formData.jobTitle,
        phone_number: formData.phoneNumber,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        language: 'en'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Registration failed')
    }

    toast.info('Your account is pending approval. Our team will contact you within 24 hours.')
    router.push('/pending-approval')
  }

  const getButtonText = () => {
    if (isLoading) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
    if (selectedPlan === 'free') return 'Create Free Account'
    if (selectedPlan === 'enterprise') return 'Request Enterprise Demo'
    return 'Continue to Payment'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex">
      {/* Left Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground">
              Get started with professional Instagram analytics
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={cn("pl-10", errors.fullName && "border-red-500")}
                  disabled={isLoading}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn("pl-10", errors.email && "border-red-500")}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn("pl-10 pr-10", errors.password && "border-red-500")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Company (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Corp (optional)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Terms and Marketing */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, termsAccepted: checked as boolean })
                  }
                  className={errors.terms ? "border-red-500" : ""}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  I agree to the{' '}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-xs text-red-500">{errors.terms}</p>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, marketingConsent: checked as boolean })
                  }
                />
                <label
                  htmlFor="marketing"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Send me product updates and marketing emails
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {getButtonText()}
            </Button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Pricing Plans */}
      <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 border-l">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Choose your plan</h2>
            <p className="text-sm text-muted-foreground">
              Start free or unlock premium features
            </p>
          </div>

          {/* Plan Selection */}
          <RadioGroup
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value as typeof selectedPlan)}
            className="space-y-3"
          >
            {PLANS.map((plan) => {
              const Icon = plan.icon
              return (
                <label
                  key={plan.id}
                  className={cn(
                    "relative flex cursor-pointer rounded-lg border p-4 transition-all hover:bg-muted/50",
                    selectedPlan === plan.id && "border-primary bg-primary/5 ring-1 ring-primary",
                    plan.popular && "border-primary/50"
                  )}
                >
                  <RadioGroupItem value={plan.id} className="sr-only" />
                  <div className="flex items-start space-x-3 w-full">
                    <div className={cn("mt-1 p-2 rounded-lg bg-background", plan.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {plan.name}
                            {plan.popular && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {plan.credits}/month
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {plan.price}
                            {plan.priceMonthly > 0 && <span className="text-xs text-muted-foreground">/mo</span>}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="mt-3 space-y-1">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs text-primary cursor-pointer hover:underline">
                            +{plan.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </label>
              )
            })}
          </RadioGroup>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-xs text-muted-foreground">
              Secure payment powered by Stripe
            </span>
          </div>

          {/* Test Mode Notice */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Test Mode:</strong> Use card 4242 4242 4242 4242
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}