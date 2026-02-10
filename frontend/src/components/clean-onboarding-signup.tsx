'use client'

import React, { useState, useEffect } from 'react'
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
  ArrowRight,
  ArrowLeft,
  Crown,
  Zap,
  Globe,
  BriefcaseIcon,
  CheckCircle,
  XCircle,
  Search,
  Users,
  BarChart3,
  Shield,
  TrendingDown,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { Sun } from '@/components/animate-ui/icons/sun'
import { Moon } from '@/components/animate-ui/icons/moon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnimatedInput } from '@/components/ui/animated-input'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ENDPOINTS, API_CONFIG } from '@/config/api'
import { motion, AnimatePresence } from 'framer-motion'

// Step definitions
const STEPS = [
  { id: 1, title: 'Welcome' },
  { id: 2, title: 'Account' },
  { id: 3, title: 'Profile' },
  { id: 4, title: 'Plan' }
]

// Industry options
const INDUSTRIES = [
  { value: 'fashion_beauty', label: 'Fashion & Beauty' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'technology', label: 'Technology' },
  { value: 'health_fitness', label: 'Health & Fitness' },
  { value: 'travel_hospitality', label: 'Travel & Hospitality' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'agency', label: 'Agency' },
  { value: 'other', label: 'Other' }
]

// Company size options
const COMPANY_SIZES = [
  { value: 'solo', label: 'Just me' },
  { value: 'small', label: '2-10 people' },
  { value: 'growing', label: '11-50 people' },
  { value: 'large', label: '50+ people' }
]

// Use case options with icons
const USE_CASES = [
  { value: 'find_influencers', label: 'Find influencers', icon: Search },
  { value: 'analyze_competitors', label: 'Analyze competitors', icon: Users },
  { value: 'track_campaigns', label: 'Track campaigns', icon: BarChart3 },
  { value: 'verify_authenticity', label: 'Verify authenticity', icon: Shield },
  { value: 'research_trends', label: 'Research trends', icon: TrendingUp }
]

// Marketing budget options
const MARKETING_BUDGETS = [
  { value: 'under_5k', label: 'Under $5K' },
  { value: '5k_25k', label: '$5K - $25K' },
  { value: '25k_100k', label: '$25K - $100K' },
  { value: 'over_100k', label: 'Over $100K' },
  { value: 'not_sure', label: 'Not sure' }
]

// Plan details
interface PlanDetails {
  id: 'free' | 'standard' | 'premium'
  name: string
  price: string
  priceMonthly: number
  profiles: string
  emails: string
  posts: string
  teams: string
  credits: string
  features: string[]
  popular?: boolean
}

const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceMonthly: 0,
    profiles: '5 profile unlocks',
    emails: '0 email reveals',
    posts: '0 post analytics',
    teams: '1 team member',
    credits: '100 credits included',
    features: [
      'Basic analytics only',
      'No export features',
      'No campaigns',
      'Community support'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$199',
    priceMonthly: 199,
    profiles: '500 profile unlocks',
    emails: '250 email reveals',
    posts: '125 post analytics',
    teams: '2 team members',
    credits: '2,000 credits included',
    features: [
      'Full analytics suite',
      'All AI insights',
      'Campaign management',
      'Data export (CSV/Excel)',
      'Email support'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$499',
    priceMonthly: 499,
    profiles: '2,000 profile unlocks',
    emails: '800 email reveals',
    posts: '300 post analytics',
    teams: '5 team members',
    credits: '5,000 credits included',
    features: [
      'Everything in Standard',
      '20% discount on credit top-ups',
      'Priority support',
      'Advanced exports'
    ]
  }
]

// Password validation with Supabase requirements
const validatePassword = (password: string): {valid: boolean, errors: string[]} => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  // Common weak passwords that Supabase rejects
  const weakPasswords = [
    'password', 'Password123', '12345678', 'qwerty123',
    'admin123', 'Welcome123', 'Password1', 'Following0925_25'
  ]

  if (weakPasswords.some(weak => password.toLowerCase().includes(weak.toLowerCase()))) {
    errors.push("Password is too common, please choose a stronger one")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Password strength indicator helper
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }

  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (checks.uppercase && checks.lowercase) strength++
  if (checks.number) strength++
  if (checks.special) strength++

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['red', 'orange', 'yellow', 'blue', 'green']

  return {
    checks,
    strength,
    score: labels[Math.min(strength - 1, 4)],
    color: colors[Math.min(strength - 1, 4)]
  }
}

// Generate strong password helper
const generateStrongPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'

  let password = ''

  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly to reach 12 chars
  const all = uppercase + lowercase + numbers + special
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function CleanOnboardingSignup() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium'>('standard')
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    if (theme) {
      setSelectedTheme(theme as 'light' | 'dark')
    }
  }, [])

  // Form data for all steps
  const [formData, setFormData] = useState({
    // Step 2: Account
    email: '',
    password: '',
    fullName: '',

    // Step 3: Profile
    company: '',
    jobTitle: '',
    language: 'en',
    industry: '',
    companySize: '',
    useCases: [] as string[], // Changed to array for multi-select
    marketingBudget: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof checkPasswordStrength>>()

  // Update password strength
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password))
    }
  }, [formData.password])

  // Handle theme changes
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setSelectedTheme(newTheme)
    setTheme(newTheme)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        return true

      case 2:
        if (!formData.email) {
          newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email'
        }

        if (!formData.password) {
          newErrors.password = 'Password is required'
        } else {
          const passwordValidation = validatePassword(formData.password)
          if (!passwordValidation.valid) {
            newErrors.password = passwordValidation.errors[0] // Show first error
          }
        }

        if (!formData.fullName) {
          newErrors.fullName = 'Full name is required'
        }
        break

      case 3:
        if (!formData.company) {
          newErrors.company = 'Company name is required'
        }
        break

      case 4:
        return true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === STEPS.length) {
        handleSubmit()
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const handleSkip = () => {
    if (currentStep === 3) {
      setCurrentStep(4)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      if (selectedPlan === 'free') {
        await handleFreeSignup()
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
        company: formData.company,
        job_title: formData.jobTitle || '',
        phone_number: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        language: formData.language,
        // New personalization fields
        industry: formData.industry || '',
        company_size: formData.companySize || '',
        use_case: formData.useCases.join(',') || '', // Join array for API
        marketing_budget: formData.marketingBudget || ''
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Registration failed')

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
    }

    toast.success('Welcome! Redirecting to dashboard...')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const handlePaidSignup = async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.preRegistrationCheckout}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        plan: selectedPlan.toLowerCase(),
        company: formData.company,
        job_title: formData.jobTitle || '',
        phone_number: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        language: formData.language,
        // New personalization fields
        industry: formData.industry || '',
        company_size: formData.companySize || '',
        use_case: formData.useCases.join(',') || '', // Join array for API
        marketing_budget: formData.marketingBudget || '',
        success_url: `${window.location.origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/signup?payment=cancelled`
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Failed to create checkout session')

    if (data.sessionUrl || data.session_url || data.checkout_url) {
      const checkoutUrl = data.sessionUrl || data.session_url || data.checkout_url
      window.location.href = checkoutUrl
    } else {
      throw new Error('No checkout URL received')
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepWelcome selectedTheme={selectedTheme} setSelectedTheme={handleThemeChange} />
      case 2:
        return (
          <StepAccount
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            passwordFocused={passwordFocused}
            setPasswordFocused={setPasswordFocused}
            passwordStrength={passwordStrength}
          />
        )
      case 3:
        return (
          <StepProfile
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )
      case 4:
        return (
          <StepPlan
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
          />
        )
      default:
        return null
    }
  }

  const logoSrc = mounted && theme === 'dark' ? '/Following Logo Dark Mode.svg' : '/followinglogo.svg'

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logo */}
      <div className="p-6 lg:p-8">
        <img
          src={logoSrc}
          alt="Following"
          className="h-5 opacity-70"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Progress dots */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "h-1.5 transition-all duration-300 rounded-full",
                    currentStep === step.id ? "w-8 bg-foreground" : "w-1.5 bg-muted-foreground/30",
                    currentStep > step.id && "bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12">
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep === 3 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                Skip
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={isLoading}
              className={cn(
                "min-w-[120px]",
                currentStep === STEPS.length && "bg-primary"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentStep === STEPS.length ? (
                'Complete setup'
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 1: Welcome & Theme Selection
function StepWelcome({
  selectedTheme,
  setSelectedTheme
}: {
  selectedTheme: 'light' | 'dark'
  setSelectedTheme: (theme: 'light' | 'dark') => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Choose your theme</h1>
        <p className="text-muted-foreground text-sm">Select your preferred appearance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedTheme('light')}
          className={cn(
            "relative p-6 rounded-lg border-2 transition-all duration-300 text-center group",
            selectedTheme === 'light'
              ? "border-foreground bg-muted/30"
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <div className="mx-auto mb-3 flex justify-center">
            <Sun
              animateOnHover
              className="h-8 w-8"
            />
          </div>
          <span className="text-sm font-medium">Light</span>
          {selectedTheme === 'light' && (
            <motion.div
              className="absolute top-3 right-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.4 }}
            >
              <div className="w-2 h-2 rounded-full bg-foreground" />
            </motion.div>
          )}
        </button>

        <button
          onClick={() => setSelectedTheme('dark')}
          className={cn(
            "relative p-6 rounded-lg border-2 transition-all duration-300 text-center group",
            selectedTheme === 'dark'
              ? "border-foreground bg-muted/30"
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <div className="mx-auto mb-3 flex justify-center">
            <Moon
              animateOnHover
              className="h-8 w-8"
            />
          </div>
          <span className="text-sm font-medium">Dark</span>
          {selectedTheme === 'dark' && (
            <motion.div
              className="absolute top-3 right-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.4 }}
            >
              <div className="w-2 h-2 rounded-full bg-foreground" />
            </motion.div>
          )}
        </button>
      </div>
    </div>
  )
}

// Step 2: Account Setup
function StepAccount({
  formData,
  setFormData,
  errors,
  showPassword,
  setShowPassword,
  passwordFocused,
  setPasswordFocused,
  passwordStrength
}: any) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-muted-foreground text-sm">Enter your details to get started</p>
      </div>

      <div className="space-y-5">
        <AnimatedInput
          id="fullName"
          type="text"
          label="What's your name?"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          error={errors.fullName}
          required
        />

        <AnimatedInput
          id="email"
          type="email"
          label="What's your email?"
          placeholder="name@company.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />

        <div className="space-y-2">
          <div className="relative">
            <AnimatedInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Create a password"
              placeholder="Strong password required"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              error={errors.password}
              className="pr-20"
              required
            />
            <div className="absolute right-3 top-8 flex gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const newPassword = generateStrongPassword()
                  setFormData({ ...formData, password: newPassword })
                  setShowPassword(true)
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Generate strong password"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Password strength indicator */}
          {formData.password && passwordStrength && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-200",
                      i < passwordStrength.strength
                        ? passwordStrength.color === 'green'
                          ? "bg-green-500"
                          : passwordStrength.color === 'blue'
                          ? "bg-blue-500"
                          : passwordStrength.color === 'yellow'
                          ? "bg-yellow-500"
                          : passwordStrength.color === 'orange'
                          ? "bg-orange-500"
                          : "bg-red-500"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className={cn(
                "text-xs font-medium",
                passwordStrength.color === 'green' && "text-green-600",
                passwordStrength.color === 'blue' && "text-blue-600",
                passwordStrength.color === 'yellow' && "text-yellow-600",
                passwordStrength.color === 'orange' && "text-orange-600",
                passwordStrength.color === 'red' && "text-red-600"
              )}>
                Password Strength: {passwordStrength.score}
              </p>
            </div>
          )}

          {/* Password requirements checklist */}
          {(passwordFocused || formData.password) && (
            <div className="text-xs space-y-1 mt-2">
              <p className={cn(
                "flex items-center gap-1.5",
                passwordStrength?.checks.length ? "text-green-600" : "text-muted-foreground"
              )}>
                <span className="text-[10px]">{passwordStrength?.checks.length ? "✓" : "○"}</span>
                At least 8 characters
              </p>
              <p className={cn(
                "flex items-center gap-1.5",
                passwordStrength?.checks.uppercase ? "text-green-600" : "text-muted-foreground"
              )}>
                <span className="text-[10px]">{passwordStrength?.checks.uppercase ? "✓" : "○"}</span>
                One uppercase letter
              </p>
              <p className={cn(
                "flex items-center gap-1.5",
                passwordStrength?.checks.lowercase ? "text-green-600" : "text-muted-foreground"
              )}>
                <span className="text-[10px]">{passwordStrength?.checks.lowercase ? "✓" : "○"}</span>
                One lowercase letter
              </p>
              <p className={cn(
                "flex items-center gap-1.5",
                passwordStrength?.checks.number ? "text-green-600" : "text-muted-foreground"
              )}>
                <span className="text-[10px]">{passwordStrength?.checks.number ? "✓" : "○"}</span>
                One number
              </p>
              <p className={cn(
                "flex items-center gap-1.5",
                passwordStrength?.checks.special ? "text-green-600" : "text-muted-foreground"
              )}>
                <span className="text-[10px]">{passwordStrength?.checks.special ? "✓" : "○"}</span>
                One special character (!@#$%^&*)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Step 3: Profile
function StepProfile({
  formData,
  setFormData,
  errors
}: any) {
  // Helper to toggle goals
  const toggleGoal = (goal: string) => {
    setFormData((prev: any) => ({
      ...prev,
      useCases: prev.useCases.includes(goal)
        ? prev.useCases.filter((g: string) => g !== goal)
        : [...prev.useCases, goal]
    }))
  }

  // Map slider value to budget option
  const sliderToBudget = (value: number) => {
    if (value === 0) return 'not_sure'
    if (value === 1) return 'under_5k'
    if (value === 2) return '5k_25k'
    if (value === 3) return '25k_100k'
    return 'over_100k'
  }

  const budgetToSlider = (budget: string) => {
    switch(budget) {
      case 'not_sure': return 0
      case 'under_5k': return 1
      case '5k_25k': return 2
      case '25k_100k': return 3
      case 'over_100k': return 4
      default: return 0
    }
  }

  const getBudgetLabel = (value: number) => {
    const budgets = ['Not sure', 'Under $5K', '$5K-25K', '$25K-100K', 'Over $100K']
    return budgets[value] || 'Not sure'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">About your business</h1>
        <p className="text-muted-foreground text-sm">Help us customize your experience</p>
      </div>

      <div className="space-y-6">
        {/* Company */}
        <AnimatedInput
          id="company"
          type="text"
          label="Company name"
          placeholder="Acme Inc."
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          error={errors.company}
          required
        />

        {/* Goals - Multi-select grid */}
        <div>
          <Label className="text-sm font-normal text-muted-foreground mb-3">
            Goals <span className="text-muted-foreground/50">(select all that apply)</span>
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {USE_CASES.map(useCase => {
              const Icon = useCase.icon
              const isSelected = formData.useCases.includes(useCase.value)
              return (
                <button
                  key={useCase.value}
                  type="button"
                  onClick={() => toggleGoal(useCase.value)}
                  className={cn(
                    "relative aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center p-3",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 mb-1",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="text-[10px] text-center leading-tight">
                    {useCase.label.split(' ')[0]}
                  </p>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Marketing Budget Slider */}
        <div>
          <Label className="text-sm font-normal text-muted-foreground mb-4">
            Monthly marketing budget
          </Label>
          <div className="space-y-3">
            <Slider
              value={[budgetToSlider(formData.marketingBudget)]}
              onValueChange={(values) => setFormData({ ...formData, marketingBudget: sliderToBudget(values[0]) })}
              min={0}
              max={4}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not sure</span>
              <span className="font-medium text-foreground">
                {getBudgetLabel(budgetToSlider(formData.marketingBudget))}
              </span>
              <span>$100K+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 4: Plan Selection
function StepPlan({
  selectedPlan,
  setSelectedPlan
}: {
  selectedPlan: 'free' | 'standard' | 'premium'
  setSelectedPlan: (plan: 'free' | 'standard' | 'premium') => void
}) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Choose your plan</h1>
        <p className="text-muted-foreground text-sm">Select the best option for your needs</p>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg flex gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              billingCycle === 'monthly'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              billingCycle === 'annual'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual
            <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left relative",
                isSelected
                  ? "border-foreground bg-muted/20"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{plan.name}</span>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xl font-semibold">
                    {billingCycle === 'annual' && plan.priceMonthly > 0
                      ? `$${Math.round(plan.priceMonthly * 0.8)}`
                      : plan.price}
                    {plan.priceMonthly > 0 && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                  </p>
                </div>

                {/* Key limits */}
                <div className="space-y-1 py-2">
                  <p className="text-xs font-medium">{plan.profiles.split(' ')[0]} profiles</p>
                  {plan.priceMonthly > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground">{plan.credits.split(' ')[0]} credits</p>
                      <p className="text-xs text-muted-foreground">{plan.teams}</p>
                    </>
                  )}
                </div>

                {/* Top features only */}
                <div className="space-y-1 pt-2 border-t border-border">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <p key={idx} className="text-[10px] text-muted-foreground">
                      {feature}
                    </p>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Cancel or change anytime
      </p>
    </div>
  )
}