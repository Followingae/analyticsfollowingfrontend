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
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ENDPOINTS } from '@/config/api'

interface PlanDetails {
  id: 'free' | 'standard' | 'premium' | 'enterprise'
  name: string
  price: string
  priceMonthly: number
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
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium' | 'enterprise'>('standard')
  const [passwordFocused, setPasswordFocused] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    company: '',
    termsAccepted: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof checkPasswordStrength>>()

  // Update password strength on change
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password))
    }
  }, [formData.password])

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINTS.billing.freeTierRegistration}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINTS.billing.preRegistrationCheckout}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        plan: selectedPlan
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Failed to create checkout session')

    if (data.sessionUrl || data.checkout_url) {
      window.location.href = data.sessionUrl || data.checkout_url
    } else {
      throw new Error('No checkout URL received')
    }
  }

  const handleEnterpriseSignup = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINTS.auth.register}`, {
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

  const logoSrc = theme === 'dark' ? '/Following Logo Dark Mode.svg' : '/followinglogo.svg'

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 flex">
      {/* Left Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <img
              src={logoSrc}
              alt="Following"
              className="h-8 mx-auto opacity-90"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Start Your Analytics Journey
              </h1>
              <p className="mt-2 text-muted-foreground">
                Join thousands of brands using AI-powered Instagram insights
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

              {/* Password Strength Indicator */}
              {(passwordFocused || formData.password) && passwordStrength && (
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i < passwordStrength.strength
                            ? passwordStrength.score === 'strong'
                              ? "bg-green-500"
                              : passwordStrength.score === 'medium'
                              ? "bg-yellow-500"
                              : "bg-red-500"
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className={cn(
                      "flex items-center gap-1",
                      passwordStrength.checks.length ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {passwordStrength.checks.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      8+ characters
                    </div>
                    <div className={cn(
                      "flex items-center gap-1",
                      passwordStrength.checks.uppercase ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {passwordStrength.checks.uppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Uppercase
                    </div>
                    <div className={cn(
                      "flex items-center gap-1",
                      passwordStrength.checks.lowercase ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {passwordStrength.checks.lowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Lowercase
                    </div>
                    <div className={cn(
                      "flex items-center gap-1",
                      passwordStrength.checks.number ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {passwordStrength.checks.number ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Number
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 col-span-2",
                      passwordStrength.checks.special ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {passwordStrength.checks.special ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Special character (!@#$%^&*)
                    </div>
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

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>256-bit SSL encrypted • SOC2 compliant</span>
          </div>
        </div>
      </div>

      {/* Right Side - Simplified Pricing */}
      <div className="hidden lg:flex flex-1 bg-muted/20 items-center justify-center p-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-medium">Select Your Plan</h2>
          </div>

          {/* Simplified Plan Cards */}
          <div className="space-y-2">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              const isSelected = selectedPlan === plan.id

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "relative rounded-lg border p-4 cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-background"
                      : "border-border/50 hover:border-border bg-background/50"
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
                      <p className="text-lg font-semibold">
                        {plan.price}
                        {plan.priceMonthly > 0 && <span className="text-[10px] font-normal text-muted-foreground">/mo</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Minimalist Trust Line */}
          <div className="pt-8 border-t border-border/50">
            <p className="text-center text-xs text-muted-foreground">
              Trusted by 10,000+ brands worldwide • SOC2 Certified
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}