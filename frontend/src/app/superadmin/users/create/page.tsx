"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { ArrowLeft, UserPlus, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default function CreateBrandAccountPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)

  // Form state with comprehensive fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company: '',
    phone_number: '',
    subscription_tier: 'free',
    initial_credits: 0,
    create_team: false,
    team_name: '',
    max_team_members: 1,
    monthly_profile_limit: 5,
    monthly_email_limit: 0,
    monthly_posts_limit: 0,
  })

  // Subscription tier presets
  const tierPresets = {
    free: {
      initial_credits: 0,
      monthly_profile_limit: 5,
      monthly_email_limit: 0,
      monthly_posts_limit: 0,
      max_team_members: 1,
      create_team: false,
    },
    standard: {
      initial_credits: 1000,
      monthly_profile_limit: 500,
      monthly_email_limit: 250,
      monthly_posts_limit: 125,
      max_team_members: 2,
      create_team: true,
    },
    premium: {
      initial_credits: 5000,
      monthly_profile_limit: 2000,
      monthly_email_limit: 800,
      monthly_posts_limit: 300,
      max_team_members: 5,
      create_team: true,
    },
  }

  // Handle tier change and auto-fill limits
  const handleTierChange = (tier: 'free' | 'standard' | 'premium') => {
    const preset = tierPresets[tier]
    setFormData(prev => ({
      ...prev,
      subscription_tier: tier,
      ...preset,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.email.trim() || !formData.full_name.trim() || !formData.password.trim()) {
      toast.error("Please fill in email, name, and password")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (formData.create_team && !formData.team_name.trim()) {
      toast.error("Team name is required when creating a team")
      return
    }

    setIsSubmitting(true)

    try {
      // Map subscription_tier to role for backend compatibility
      const roleMap = {
        'free': 'free',
        'standard': 'premium',
        'premium': 'brand_premium'
      }

      const payload = {
        ...formData,
        role: roleMap[formData.subscription_tier as keyof typeof roleMap] || 'free',
        status: 'active'
      }

      console.log('📤 Creating user with data:', payload)
      const result = await superadminApiService.createUser(payload)
      console.log('📥 API Response:', result)

      if (result.success) {
        setCreatedCredentials({
          email: formData.email,
          password: formData.password,
        })
        setShowSuccess(true)
        toast.success("Brand account created successfully!")
      } else {
        console.error('❌ Create user failed:', result.error)
        const errorMsg = result.error || 'Failed to create user'

        // Check if it's a 404 error
        if (errorMsg.includes('Not Found')) {
          toast.error('Backend endpoint not implemented yet. Contact backend team to implement POST /api/v1/superadmin/users/create', {
            duration: 5000
          })
        } else {
          toast.error(errorMsg)
        }
      }
    } catch (error: any) {
      console.error('❌ Create user exception:', error)
      toast.error(error.response?.data?.detail || error.message || 'Network error while creating user')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess && createdCredentials) {
    return (
      <SuperadminLayout>
        <div className="space-y-6">
          {/* Success Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/superadmin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>

          {/* Success Card */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-green-900 dark:text-green-100">Brand Account Created!</CardTitle>
                  <CardDescription>The user can login immediately with these credentials</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Credentials Display */}
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 bg-background px-4 py-3 rounded text-base font-mono">
                      {createdCredentials.email}
                    </code>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.email)
                        toast.success("Email copied!")
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 bg-background px-4 py-3 rounded text-base font-mono">
                      {createdCredentials.password}
                    </code>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.password)
                        toast.success("Password copied!")
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong className="block mb-2">Important:</strong>
                  • Save these credentials securely<br />
                  • No email confirmation required - user can login immediately<br />
                  • Email has been auto-verified
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/superadmin/users')}
                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
                  className="hover:opacity-90"
                >
                  View All Users
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccess(false)
                    setCreatedCredentials(null)
                    setFormData({
                      email: '',
                      password: '',
                      full_name: '',
                      company: '',
                      phone_number: '',
                      subscription_tier: 'free',
                      initial_credits: 0,
                      create_team: false,
                      team_name: '',
                      max_team_members: 1,
                      monthly_profile_limit: 5,
                      monthly_email_limit: 0,
                      monthly_posts_limit: 0,
                    })
                  }}
                >
                  Create Another Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/superadmin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Brand Account</h1>
            <p className="text-muted-foreground">Create a complete brand account with subscription, credits, and team setup</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column */}
        <div className="space-y-6">
        {/* Required Information */}
        <Card>
          <CardHeader>
            <CardTitle>Required Information</CardTitle>
            <CardDescription>Basic account details for the new user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="brand@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password * <span className="text-xs text-muted-foreground">(min 8 chars)</span></label>
                <Input
                  type="password"
                  placeholder="SecurePass123!"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input
                  placeholder="Marketing Agency LLC"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                placeholder="+1-555-0123"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Credits & Monthly Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Credits & Monthly Limits</CardTitle>
            <CardDescription>Configure initial credits and usage limits (auto-filled based on tier)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Initial Credits</label>
                <Input
                  type="number"
                  value={formData.initial_credits}
                  onChange={(e) => setFormData(prev => ({ ...prev, initial_credits: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Monthly Profile Limit</label>
                <Input
                  type="number"
                  value={formData.monthly_profile_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_profile_limit: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Monthly Email Limit</label>
                <Input
                  type="number"
                  value={formData.monthly_email_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_email_limit: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Monthly Posts Limit</label>
                <Input
                  type="number"
                  value={formData.monthly_posts_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_posts_limit: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
        {/* Subscription Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Tier</CardTitle>
            <CardDescription>Select a subscription plan with automatic credit and limit configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={formData.subscription_tier} onValueChange={(value) => handleTierChange(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex flex-col">
                    <span className="font-medium">Free</span>
                    <span className="text-xs text-muted-foreground">5 profiles/month • No credits</span>
                  </div>
                </SelectItem>
                <SelectItem value="standard">
                  <div className="flex flex-col">
                    <span className="font-medium">Standard - $199/month</span>
                    <span className="text-xs text-muted-foreground">500 profiles • 1000 credits • 2 team members</span>
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex flex-col">
                    <span className="font-medium">Premium - $499/month</span>
                    <span className="text-xs text-muted-foreground">2000 profiles • 5000 credits • 5 team members</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Team Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Team Setup (Optional)</CardTitle>
            <CardDescription>Create a team for brand collaboration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="create_team"
                checked={formData.create_team}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, create_team: checked === true }))}
              />
              <label htmlFor="create_team" className="text-sm font-medium cursor-pointer">
                Create team for this account
              </label>
            </div>
            {formData.create_team && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-sm font-medium">Team Name *</label>
                  <Input
                    placeholder="Digital Marketing Agency"
                    value={formData.team_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Team Members</label>
                  <Input
                    type="number"
                    value={formData.max_team_members}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_team_members: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
            <CardDescription>Review the account configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription:</span>
                <span className="font-medium capitalize">{formData.subscription_tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initial Credits:</span>
                <span className="font-medium">{formData.initial_credits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile Limit:</span>
                <span className="font-medium">{formData.monthly_profile_limit}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Limit:</span>
                <span className="font-medium">{formData.monthly_email_limit}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Posts Limit:</span>
                <span className="font-medium">{formData.monthly_posts_limit}/month</span>
              </div>
              {formData.create_team && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team:</span>
                  <span className="font-medium">{formData.team_name || 'Not set'} ({formData.max_team_members} members)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

          {/* Submit Button - Full Width */}
          <div className="lg:col-span-2 flex justify-end gap-3 pb-8 border-t pt-6 mt-6">
            <Button type="button" variant="outline" size="lg" onClick={() => router.push('/superadmin/users')}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Brand Account
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </SuperadminLayout>
  )
}
