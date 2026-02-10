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
  ArrowRight,
  ArrowLeft,
  Crown,
  Zap,
  ChevronLeft,
  Sun,
  Moon,
  Calendar,
  Globe,
  BriefcaseIcon,
  Phone,
  CheckCircle,
  XCircle,
  CreditCard,
  Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ENDPOINTS, API_CONFIG } from '@/config/api'
import { motion, AnimatePresence } from 'framer-motion'

// Step definitions
const STEPS = [
  { id: 1, title: 'Welcome', description: 'Let\'s get started' },
  { id: 2, title: 'Account Setup', description: 'Create your account' },
  { id: 3, title: 'Personalization', description: 'Tell us about yourself' },
  { id: 4, title: 'Choose Your Plan', description: 'Select a subscription' }
]

// Plan details
interface PlanDetails {
  id: 'free' | 'standard' | 'premium'
  name: string
  price: string
  priceMonthly: number
  description: string
  credits: string
  features: string[]
  popular?: boolean
  icon: React.ElementType
  highlight?: string
}

const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    priceMonthly: 0,
    description: 'For individuals getting started',
    credits: '5 profiles',
    features: [
      '5 profile analyses/month',
      'Basic analytics',
      '7-day search history',
      'Standard support'
    ],
    icon: Sparkles
  },
  {
    id: 'standard',
    name: 'Professional',
    price: '$199',
    priceMonthly: 199,
    description: 'For growing businesses',
    credits: '500 profiles',
    features: [
      '500 profile analyses/month',
      'Advanced AI insights',
      'Full analytics suite',
      'Data export (CSV/Excel)',
      'Priority support',
      '2 team members'
    ],
    popular: true,
    icon: Zap,
    highlight: 'Most Popular'
  },
  {
    id: 'premium',
    name: 'Business',
    price: '$499',
    priceMonthly: 499,
    description: 'For teams and agencies',
    credits: '2,000 profiles',
    features: [
      '2,000 profile analyses/month',
      'Premium AI predictions',
      'Custom dashboards',
      'API access',
      'Dedicated manager',
      '5 team members',
      '20% top-up discount'
    ],
    icon: Crown
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

export function OnboardingSignup() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium'>('free')
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

    // Step 3: Personalization
    company: '',
    jobTitle: '',
    phoneNumber: '',
    birthDate: '',
    language: 'en',
    howHeard: ''
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
        // No validation needed for welcome step
        return true

      case 2:
        // Account validation
        if (!formData.email) {
          newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email'
        }

        if (!formData.password) {
          newErrors.password = 'Password is required'
        } else {
          const strength = checkPasswordStrength(formData.password)
          if (!strength.checks.length) {
            newErrors.password = 'Password must be at least 8 characters'
          } else if (strength.score === 'weak') {
            newErrors.password = 'Password is too weak'
          }
        }

        if (!formData.fullName) {
          newErrors.fullName = 'Full name is required'
        } else if (formData.fullName.trim().split(' ').length < 2) {
          newErrors.fullName = 'Please enter your full name'
        }
        break

      case 3:
        // Personalization validation
        if (!formData.company) {
          newErrors.company = 'Company name is required'
        }
        break

      case 4:
        // Plan selection - no validation needed
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
    // Skip personalization details in step 3
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
        phone_number: formData.phoneNumber || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        language: formData.language
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
        phone_number: formData.phoneNumber || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        language: formData.language,
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
          <StepPersonalization
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

  if (!mounted) return null // Prevent hydration mismatch

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-2xl relative">
        {/* Logo at the top - subtle */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-60">
          <img
            src={logoSrc}
            alt="Following"
            className="h-6 transition-opacity duration-300 hover:opacity-100"
          />
        </div>

        {/* Progress dots */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "h-2 transition-all duration-300",
                  currentStep === step.id ? "w-8 bg-primary rounded-full" : "w-2 bg-muted rounded-full",
                  currentStep > step.id && "bg-primary/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
            className={cn(
              "transition-opacity",
              currentStep === 1 && "opacity-0 pointer-events-none"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep === 3 && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="ml-auto"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : currentStep === STEPS.length ? (
              <>Get Started</>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
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
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Rocket className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Welcome to Following</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Let's set up your account and get you started with powerful Instagram analytics
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-base">Choose your style</Label>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={cn(
                "relative p-8 cursor-pointer transition-all duration-300 overflow-hidden",
                selectedTheme === 'light' ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              )}
              onClick={() => setSelectedTheme('light')}
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-yellow-100/50 to-orange-100/50 dark:from-yellow-100/10 dark:to-orange-100/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: selectedTheme === 'light' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              <div className="relative space-y-4">
                <motion.div
                  animate={{
                    rotate: selectedTheme === 'light' ? 360 : 0,
                    scale: selectedTheme === 'light' ? 1.1 : 1
                  }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <Sun className="h-8 w-8 mx-auto text-yellow-600 dark:text-yellow-500" />
                </motion.div>
                <p className="font-medium">Light</p>
              </div>

              <AnimatePresence>
                {selectedTheme === 'light' && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-2 right-2"
                  >
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={cn(
                "relative p-8 cursor-pointer transition-all duration-300 overflow-hidden",
                selectedTheme === 'dark' ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              )}
              onClick={() => setSelectedTheme('dark')}
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50 dark:from-blue-900/30 dark:to-purple-900/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: selectedTheme === 'dark' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              <div className="relative space-y-4">
                <motion.div
                  animate={{
                    rotate: selectedTheme === 'dark' ? 360 : 0,
                    scale: selectedTheme === 'dark' ? 1.1 : 1
                  }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <Moon className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-400" />
                </motion.div>
                <p className="font-medium">Dark</p>
              </div>

              <AnimatePresence>
                {selectedTheme === 'dark' && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-2 right-2"
                  >
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground">Enter your details to get started</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="John Smith"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={cn(
                "pl-10",
                errors.fullName && "border-red-500"
              )}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={cn(
                "pl-10",
                errors.email && "border-red-500"
              )}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
                "pl-10 pr-10",
                errors.password && "border-red-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Strength */}
          {(passwordFocused || formData.password) && passwordStrength && (
            <div className="space-y-2">
              <div className="flex gap-1">
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
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className={passwordStrength.checks.length ? "text-green-600" : "text-muted-foreground"}>
                  {passwordStrength.checks.length ? <CheckCircle className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
                  8+ characters
                </div>
                <div className={passwordStrength.checks.uppercase ? "text-green-600" : "text-muted-foreground"}>
                  {passwordStrength.checks.uppercase ? <CheckCircle className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
                  Uppercase
                </div>
                <div className={passwordStrength.checks.lowercase ? "text-green-600" : "text-muted-foreground"}>
                  {passwordStrength.checks.lowercase ? <CheckCircle className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
                  Lowercase
                </div>
                <div className={passwordStrength.checks.number ? "text-green-600" : "text-muted-foreground"}>
                  {passwordStrength.checks.number ? <CheckCircle className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
                  Number
                </div>
              </div>
            </div>
          )}

          {errors.password && (
            <p className="text-xs text-red-500">{errors.password}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Step 3: Personalization
function StepPersonalization({
  formData,
  setFormData,
  errors
}: any) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Help us personalize your experience</h1>
        <p className="text-muted-foreground">Tell us a bit about yourself (optional)</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {/* Company */}
        <div className="space-y-2">
          <Label htmlFor="company">Company <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="company"
              type="text"
              placeholder="Your company name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className={cn(
                "pl-10",
                errors.company && "border-red-500"
              )}
            />
          </div>
          {errors.company && (
            <p className="text-xs text-red-500">{errors.company}</p>
          )}
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job Title (optional)</Label>
          <div className="relative">
            <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="jobTitle"
              type="text"
              placeholder="e.g., Marketing Manager"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Preferred Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Preferred Language</Label>
          <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
            <SelectTrigger id="language">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
            </SelectContent>
          </Select>
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
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Choose your plan</h1>
        <p className="text-muted-foreground">Select the plan that best fits your needs</p>
      </div>

      <div className="grid gap-4 max-w-4xl mx-auto md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isSelected = selectedPlan === plan.id

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative p-6 cursor-pointer transition-all hover:shadow-lg",
                isSelected && "ring-2 ring-primary",
                plan.popular && "scale-105"
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.highlight}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-muted-foreground ml-1">/month</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>{plan.credits}/month</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPlan(plan.id)
                  }}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        You can upgrade, downgrade, or cancel your subscription at any time
      </p>
    </div>
  )
}