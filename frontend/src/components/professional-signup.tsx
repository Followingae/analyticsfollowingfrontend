'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Check,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  User,
  Building2,
  Lock,
  Sparkles,
  TrendingUp,
  BarChart3,
  Globe,
  ArrowRight,
  Shield,
  Zap,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Moon,
  Sun
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ENDPOINTS, API_CONFIG } from '@/config/api'

interface PlanDetails {
  id: 'free' | 'standard' | 'premium' | 'enterprise'
  name: string
  price: string
  priceMonthly: number
  priceAnnual?: number
  savings?: number
  description: string
  credits: string
  features: string[]
  popular?: boolean
  icon: React.ElementType
  gradient: string
  buttonText: string
}

const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 'Free',
    priceMonthly: 0,
    description: 'Perfect for trying out our platform',
    credits: '5 profiles',
    features: [
      '5 profile analyses per month',
      'Basic engagement metrics',
      'Search history (7 days)',
      'Standard support'
    ],
    icon: Sparkles,
    gradient: 'from-slate-500 to-slate-700',
    buttonText: 'Start Free'
  },
  {
    id: 'standard',
    name: 'Professional',
    price: '$199',
    priceMonthly: 199,
    priceAnnual: 1908,
    savings: 480,
    description: 'For growing businesses and agencies',
    credits: '500 profiles',
    features: [
      '500 profile analyses per month',
      'Advanced AI insights',
      'Full engagement analytics',
      'Data export (CSV/Excel)',
      'Priority email support',
      'Up to 2 team members'
    ],
    popular: true,
    icon: Zap,
    gradient: 'from-blue-500 to-indigo-600',
    buttonText: 'Get Started'
  },
  {
    id: 'premium',
    name: 'Business',
    price: '$499',
    priceMonthly: 499,
    priceAnnual: 4788,
    savings: 1200,
    description: 'For teams requiring advanced features',
    credits: '2,000 profiles',
    features: [
      '2,000 profile analyses per month',
      'Premium AI insights & predictions',
      'Custom analytics dashboards',
      'API access',
      'Dedicated account manager',
      'Up to 5 team members',
      '20% credit top-up discount'
    ],
    icon: Crown,
    gradient: 'from-purple-500 to-pink-600',
    buttonText: 'Upgrade to Business'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceMonthly: 0,
    description: 'Tailored solutions for large organizations',
    credits: 'Unlimited',
    features: [
      'Unlimited profile analyses',
      'White-label options',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated success team',
      'Unlimited team members',
      'Advanced security features'
    ],
    icon: Building2,
    gradient: 'from-gray-700 to-gray-900',
    buttonText: 'Contact Sales'
  }
]

// Password validation helper
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"|<>?,./`~]/.test(password)
  }

  const strength = Object.values(checks).filter(Boolean).length

  return {
    checks,
    strength,
    score: strength === 5 ? 'strong' : strength >= 3 ? 'medium' : 'weak'
  }
}

export function ProfessionalSignup() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium' | 'enterprise' | null>(null)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    company: '',
    termsAccepted: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof checkPasswordStrength>>()
  const [isFormValid, setIsFormValid] = useState(false)

  // Handle mounting for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update password strength on change
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password))
    }
  }, [formData.password])

  // Check form validity whenever form data changes (excluding terms)
  useEffect(() => {
    const hasValidEmail = formData.email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    const hasValidPassword = formData.password.length >= 8 && (passwordStrength?.score === 'medium' || passwordStrength?.score === 'strong')
    const hasValidName = formData.fullName.length > 0 && formData.fullName.trim().includes(' ')
    const hasValidCompany = formData.company.length >= 2

    const isValid = hasValidEmail && hasValidPassword && hasValidName && hasValidCompany

    setIsFormValid(isValid)
  }, [formData, passwordStrength])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const strength = checkPasswordStrength(formData.password)
      if (!strength.checks.length) {
        newErrors.password = 'Password must be at least 8 characters'
      } else if (strength.score === 'weak') {
        newErrors.password = 'Password is too weak. Add uppercase, numbers, and special characters'
      }
    }

    // Full name validation
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Please enter your full name (first and last name)'
    }

    // Company validation - NOW REQUIRED
    if (!formData.company) {
      newErrors.company = 'Company/Organization name is required'
    } else if (formData.company.length < 2) {
      newErrors.company = 'Company name must be at least 2 characters'
    }

    // Terms validation
    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the terms to continue'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please complete all required fields correctly')
      return
    }

    if (!selectedPlan) {
      toast.error('Please select a subscription plan')
      return
    }

    setIsLoading(true)

    try {
      if (selectedPlan === 'free') {
        await handleFreeSignup()
      } else if (selectedPlan === 'enterprise') {
        await handleEnterpriseSignup()
      } else {
        await handlePaidSignup()
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const handleFreeSignup = async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.freeTierRegistration}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        company: formData.company, // Now required
        job_title: '', // Optional
        phone_number: '', // Optional
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        language: navigator.language.substring(0, 2) || 'en'
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Registration failed')

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
    }

    toast.success('Welcome aboard! Redirecting to your dashboard...')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const handlePaidSignup = async () => {
    try {
      console.log('Calling API:', `${API_CONFIG.BASE_URL}${ENDPOINTS.billing.preRegistrationCheckout}`)

      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.preRegistrationCheckout}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          plan: selectedPlan.toLowerCase(), // Must be lowercase as per backend requirement
          company: formData.company, // Now required
          job_title: '', // Optional but included for backend compatibility
          phone_number: '', // Optional
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          language: navigator.language.substring(0, 2) || 'en',
          billing_interval: billingInterval,
          success_url: `${window.location.origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/signup?payment=cancelled`
        })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', await response.text())
        throw new Error('Server error: Invalid response format. Please try again.')
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Failed to create checkout session')

      // Backend returns sessionUrl as per the instructions
      if (data.sessionUrl || data.session_url || data.checkout_url) {
        // Redirect user to Stripe Checkout (handling all possible response formats)
        const checkoutUrl = data.sessionUrl || data.session_url || data.checkout_url
        console.log('Redirecting to Stripe checkout:', checkoutUrl)
        window.location.href = checkoutUrl
      } else {
        throw new Error('No checkout URL received from backend')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      throw error
    }
  }

  const handleEnterpriseSignup = async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.auth.register}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: 'standard',
        billing_type: 'admin_managed',
        company: formData.company
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Registration failed')

    toast.success('Thank you! Our enterprise team will contact you within 24 hours.')
    setTimeout(() => router.push('/pending-approval'), 1500)
  }

  const getButtonText = () => {
    if (isLoading) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating your account...</>
    if (selectedPlan === 'free') return 'Start Free Trial'
    if (selectedPlan === 'enterprise') return 'Request Enterprise Demo'
    return 'Continue to Secure Checkout'
  }

  // Use default logo until mounted to avoid hydration mismatch
  const logoSrc = mounted && theme === 'dark' ? '/Following Logo Dark Mode.svg' : '/followinglogo.svg'

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 flex relative">
      {/* Theme Toggle - Absolute positioned in top right */}
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

      {/* Left Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <img
              src={logoSrc}
              alt="Following"
              className="h-8 mx-auto"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Create Your Account
              </h1>
              <p className="mt-2 text-muted-foreground">
                Discover influencers, track campaigns, and scale your brand
              </p>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={cn(
                    "pl-10 h-11",
                    errors.fullName && "border-red-500 focus:ring-red-500"
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Work Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    "pl-10 h-11",
                    errors.email && "border-red-500 focus:ring-red-500"
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Company - NOW REQUIRED */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">
                Company/Organization
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Corporation"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={cn(
                    "pl-10 h-11",
                    errors.company && "border-red-500 focus:ring-red-500"
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.company && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.company}
                </p>
              )}
            </div>

            {/* Password with Strength Indicator */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={cn(
                    "pl-10 pr-10 h-11",
                    errors.password && "border-red-500 focus:ring-red-500"
                  )}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Clean Minimal Password Strength */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-0.5 w-8 rounded-full transition-all duration-300",
                            passwordStrength.strength > level
                              ? passwordStrength.score === 'strong'
                                ? "bg-green-500"
                                : passwordStrength.score === 'medium'
                                ? "bg-amber-500"
                                : "bg-red-500"
                              : "bg-border"
                          )}
                        />
                      ))}
                    </div>
                    {passwordStrength.score !== 'strong' && (
                      <span className="text-[10px] text-muted-foreground">
                        {!passwordStrength.checks.uppercase ? "Add uppercase" :
                         !passwordStrength.checks.number ? "Add number" :
                         !passwordStrength.checks.special ? "Add symbol" :
                         !passwordStrength.checks.length ? "Too short" : ""}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, termsAccepted: checked as boolean })
                  }
                  className={cn(
                    "mt-1",
                    errors.terms ? "border-red-500" : ""
                  )}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                >
                  I agree to Following's{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-xs text-red-500 flex items-center gap-1 ml-6">
                  <AlertCircle className="h-3 w-3" />
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
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

      {/* Right Side - Simplified Pricing */}
      <div className="hidden lg:flex flex-1 bg-muted/20 items-center justify-center p-12 relative">
        <div className={cn(
          "w-full max-w-lg space-y-6 transition-all duration-700",
          !isFormValid && "opacity-40 scale-[0.98]"
        )}>
          <div className="text-center space-y-3">
            <h2 className="text-xl font-medium">
              {isFormValid ? "Select Your Plan" : "Choose a plan"}
            </h2>
            {!isFormValid && (
              <p className="text-xs text-muted-foreground animate-in fade-in duration-500">
                Complete your details to continue
              </p>
            )}

            {/* Billing Toggle */}
            {isFormValid && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <span className={cn(
                  "text-sm transition-colors",
                  billingInterval === 'monthly' ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  Monthly
                </span>
                <button
                  type="button"
                  onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'annual' : 'monthly')}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary"
                  data-state={billingInterval === 'annual' ? 'checked' : 'unchecked'}
                >
                  <span className={cn(
                    "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                    billingInterval === 'annual' ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
                <span className={cn(
                  "text-sm transition-colors flex items-center gap-1",
                  billingInterval === 'annual' ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  Annual
                  {billingInterval === 'annual' && (
                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                      Save 20%
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Simplified Plan Cards */}
          <div className="space-y-2">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              const isSelected = selectedPlan === plan.id

              return (
                <div
                  key={plan.id}
                  onClick={() => isFormValid && setSelectedPlan(plan.id)}
                  className={cn(
                    "relative rounded-lg border p-4 transition-all",
                    isFormValid ? "cursor-pointer" : "cursor-not-allowed",
                    isSelected && isFormValid
                      ? "border-primary bg-background shadow-lg shadow-primary/10"
                      : "border-border/50 bg-background/50",
                    isFormValid && !isSelected && "hover:border-border"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 right-3">
                      <span className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded">
                        POPULAR
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        isSelected ? "opacity-100" : "opacity-60",
                        "w-1.5 h-8 rounded-full bg-gradient-to-b",
                        plan.gradient
                      )} />
                      <div>
                        <h3 className="font-medium text-sm">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground">{plan.credits}/month</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {billingInterval === 'monthly' ? (
                        <p className="text-lg font-semibold">
                          {plan.price}
                          {plan.priceMonthly > 0 && <span className="text-[10px] font-normal text-muted-foreground">/mo</span>}
                        </p>
                      ) : (
                        <>
                          {plan.priceAnnual ? (
                            <div>
                              <p className="text-lg font-semibold">
                                ${Math.floor(plan.priceAnnual / 12)}
                                <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                              </p>
                              {plan.savings && (
                                <p className="text-[9px] text-green-600 dark:text-green-400">
                                  Save ${plan.savings}/year
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-lg font-semibold">{plan.price}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Checkout Style Billing */}
          {isFormValid && selectedPlan && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {selectedPlan !== 'enterprise' ? (
                <div className="bg-background border border-border rounded-lg overflow-hidden">
                  {/* Main Display */}
                  <div className="p-6 text-center">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {billingInterval === 'annual' ? 'Annual' : 'Monthly'} Total
                      </p>
                      <p className="text-3xl font-bold">
                        {selectedPlan === 'free' ? (
                          '$0'
                        ) : (
                          <>
                            ${billingInterval === 'annual'
                              ? PLANS.find(p => p.id === selectedPlan)?.priceAnnual?.toLocaleString()
                              : PLANS.find(p => p.id === selectedPlan)?.priceMonthly
                            }
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              {billingInterval === 'annual' ? '/year' : '/month'}
                            </span>
                          </>
                        )}
                      </p>

                      {/* Show monthly breakdown for annual */}
                      {billingInterval === 'annual' && selectedPlan !== 'free' && (
                        <p className="text-sm text-muted-foreground">
                          ${Math.floor((PLANS.find(p => p.id === selectedPlan)?.priceAnnual || 0) / 12)}/month • Save ${PLANS.find(p => p.id === selectedPlan)?.savings}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stripe Footer */}
                  {selectedPlan !== 'free' && (
                    <div className="border-t border-border bg-muted/30 px-4 py-2">
                      <p className="text-[10px] text-muted-foreground text-center">
                        Secure payment via Stripe
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Enterprise */
                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">Custom Pricing</p>
                    <p className="text-xs text-muted-foreground mt-1">Contact sales for quote</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}