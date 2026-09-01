"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { ArrowLeft, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ADMIN_MODULES } from "@/hooks/useAdminAccess"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHead, Panel } from "@/components/console/primitives"
import { formatMonthlyPlanPrice } from '@/config/planPricing'

export const dynamic = 'force-dynamic'

// Validate password meets Supabase requirements
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[a-z]/.test(password)) errors.push('A lowercase letter')
  if (!/[A-Z]/.test(password)) errors.push('An uppercase letter')
  if (!/[0-9]/.test(password)) errors.push('A number')
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./`~]/.test(password)) errors.push('A special character')
  return { valid: errors.length === 0, errors }
}

export default function CreateBrandAccountPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  // Brand user vs module-scoped Admin
  const [accountType, setAccountType] = useState<'brand' | 'admin' | 'staff'>('brand')
  const [adminModules, setAdminModules] = useState<string[]>([])
  const [staffRole, setStaffRole] = useState<'talent_manager' | 'account_manager' | 'business_development' | 'cofounder' | 'ceo'>('talent_manager')

  // Form state with comprehensive fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company: '',
    phone_number: '',
    subscription_tier: 'free',
    initial_credits: 125,
    create_team: true,
    team_name: '',
    max_team_members: 1,
    monthly_profile_limit: 5,
    monthly_posts_limit: 0,
  })

  // Subscription tier presets - matches SUBSCRIPTION_TIER_LIMITS in backend
  const tierPresets = {
    free: {
      initial_credits: 125,       // 5 profiles × 25 credits
      monthly_profile_limit: 5,
      monthly_posts_limit: 0,
      max_team_members: 1,
      create_team: true,          // Always create team - required for platform
    },
    standard: {
      initial_credits: 8750,      // Standard tier canonical credits
      monthly_profile_limit: 350,
      monthly_posts_limit: 100,
      max_team_members: 2,
      create_team: true,
    },
    premium: {
      initial_credits: 25000,     // Premium tier canonical credits
      monthly_profile_limit: 1000,
      monthly_posts_limit: 250,
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
    setFormError(null)

    // Validation
    if (!formData.email.trim() || !formData.full_name.trim() || !formData.password.trim()) {
      setFormError("Please fill in email, name, and password")
      return
    }

    // Password strength validation
    const pwCheck = validatePassword(formData.password)
    if (!pwCheck.valid) {
      setFormError(`Password must contain: ${pwCheck.errors.join(', ')}`)
      return
    }

    // Auto-fill team name from company if not set
    if (formData.create_team && !formData.team_name.trim()) {
      if (formData.company.trim()) {
        setFormData(prev => ({ ...prev, team_name: formData.company.trim() }))
      } else {
        setFormData(prev => ({ ...prev, team_name: `${formData.full_name}'s Team` }))
      }
    }

    if (accountType === 'admin' && adminModules.length === 0) {
      setFormError("Pick at least one module for this admin")
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

      const payload = accountType === 'admin'
        ? {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            company: formData.company,
            phone_number: formData.phone_number,
            role: 'admin',
            status: 'active',
            subscription_tier: 'free',
            admin_modules: adminModules,
            create_team: false,
          }
        : accountType === 'staff'
        ? {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            company: formData.company,
            phone_number: formData.phone_number,
            role: 'user',
            staff_role: staffRole,
            status: 'active',
            subscription_tier: 'free',
            create_team: false,
          }
        : {
            ...formData,
            role: roleMap[formData.subscription_tier as keyof typeof roleMap] || 'free',
            status: 'active'
          }

      const result = await superadminApiService.createUser(payload)

      if (result.success) {
        setCreatedCredentials({
          email: formData.email,
          password: formData.password,
        })
        setShowSuccess(true)
        toast.success("Account created")
      } else {
        const errorMsg = result.error || 'Failed to create user'
        setFormError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      setFormError(error.response?.data?.detail || error.message || 'Network error while creating user')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess && createdCredentials) {
    return (
      <SuperadminLayout>
        <div className="space-y-ds-5">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground"
                  onClick={() => router.push('/superadmin/users')}>
            <ArrowLeft className="h-4 w-4" /> Users
          </Button>

          {/* The tinted circle around a tick was the only thing carrying "this worked", and
              it carried it in colour alone. The heading says it in words. */}
          <Panel
            title="Account created"
            description="They can sign in with these straight away. Nothing is emailed, so you have to send them across yourself."
          >
            <div className="space-y-ds-4">
              {/* The two credentials were a tinted panel inside the card, and inside that
                  panel each value sat in a second box of its own. Three edges around a string
                  you are meant to read once and copy. The panel is gone; the value keeps the
                  one quiet chip that says "this is the literal text", and the labels and the
                  gap do the grouping. */}
              <div className="space-y-ds-4">
                <div>
                  <label className="text-ds-label text-muted-foreground">Email</label>
                  <div className="mt-ds-2 flex items-center gap-ds-2">
                    <code className="flex-1 rounded-ds-md bg-black/[0.05] px-ds-3 py-ds-2 font-mono text-base dark:bg-white/[0.07]">
                      {createdCredentials.email}
                    </code>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.email)
                        toast.success("Email copied")
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-ds-label text-muted-foreground">Password</label>
                  <div className="mt-ds-2 flex items-center gap-ds-2">
                    <code className="flex-1 rounded-ds-md bg-black/[0.05] px-ds-3 py-ds-2 font-mono text-base dark:bg-white/[0.07]">
                      {createdCredentials.password}
                    </code>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.password)
                        toast.success("Password copied")
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              {/* Important Notice — a second bordered, tinted box inside the same card, for
                  three lines of prose. The heading is the fence. */}
              <div>
                <p className="mb-ds-2 text-ds-label">Important</p>
                <ul className="space-y-ds-1 text-ds-body text-muted-foreground">
                  <li>Save these somewhere safe. This screen is the only place the password is shown.</li>
                  <li>No email confirmation is needed. They can log in right now.</li>
                  <li>The email address is already marked verified.</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/superadmin/users')}
                >
                  Back to the user list
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
                      initial_credits: 125,
                      create_team: true,
                      team_name: '',
                      max_team_members: 1,
                      monthly_profile_limit: 5,
                      monthly_posts_limit: 0,
                    })
                  }}
                >
                  Create another account
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <div>
          <Button type="button" variant="ghost" size="sm" className="-ml-2 mb-ds-3 gap-1.5 text-muted-foreground"
                  onClick={() => router.push('/superadmin/users')}>
            <ArrowLeft className="h-4 w-4" /> Users
          </Button>
          <PageHead
            title={accountType === 'admin' ? 'New admin'
              : accountType === 'staff' ? 'New staff member'
              : 'New brand account'}
            sub={accountType === 'admin'
              ? 'An admin who can only open the modules you tick below. Everything else stays hidden from them.'
              : accountType === 'staff'
              ? 'Someone on our own team: talent manager, account manager, business development, cofounder or CEO.'
              : 'A client account, with its subscription, its credits and the team the platform needs to attach them to.'}
            action={
              <div className="inline-flex rounded-ds-lg border border-black/[0.06] p-0.5 dark:border-white/[0.07]">
                <Button type="button" size="sm" variant={accountType === 'brand' ? 'default' : 'ghost'} onClick={() => setAccountType('brand')}>
                  Brand
                </Button>
                <Button type="button" size="sm" variant={accountType === 'staff' ? 'default' : 'ghost'} onClick={() => setAccountType('staff')}>
                  Staff
                </Button>
                <Button type="button" size="sm" variant={accountType === 'admin' ? 'default' : 'ghost'} onClick={() => setAccountType('admin')}>
                  Admin
                </Button>
              </div>
            }
          />
        </div>

        {formError && (
          <div className="rounded-ds-lg bg-[var(--tone-bad-wash)] px-ds-3 py-ds-2 text-ds-body text-[var(--tone-bad-ink)]">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-ds-4 lg:grid-cols-2">

        {/* Left Column */}
        <div className="space-y-ds-4">
        {/* Required Information */}
        <Panel title="Required information" description="The details this account cannot be created without.">
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  autoComplete="email"
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
                  autoComplete="new-password"
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
              {accountType === 'brand' && (
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    placeholder="Marketing Agency LLC"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            {accountType === 'brand' && (
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="+1-555-0123"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="mt-1"
                />
              </div>
            )}
            </div>
          </Panel>

        {/* Credits & Monthly Limits (brand accounts only) */}
        {accountType === 'brand' && (
        <Panel title="Credits and monthly limits" description="Filled in from the tier you pick. Change them here if this account is an exception.">
            <div>
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
                <label className="text-sm font-medium">Monthly Posts Limit</label>
                <Input
                  type="number"
                  value={formData.monthly_posts_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_posts_limit: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>
            </div>
          </Panel>
        )}
        </div>

        {/* Right Column */}
        <div className="space-y-ds-4">
        {accountType === 'admin' ? (
        <Panel title="Admin modules" description="Tick the areas this admin can open. Everything else stays hidden from them.">
            <div className="grid grid-cols-2 gap-2">
            {ADMIN_MODULES.map((m) => {
              const checked = adminModules.includes(m.key)
              return (
                <label key={m.key} className="flex cursor-pointer items-center gap-ds-2 rounded-ds-md border border-black/[0.06] p-2.5 hover:bg-accent/40 dark:border-white/[0.07]">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c: boolean) =>
                      setAdminModules(prev => c ? [...prev, m.key] : prev.filter(x => x !== m.key))
                    }
                  />
                  <span className="text-sm">{m.label}</span>
                </label>
              )
            })}
            </div>
          </Panel>
        ) : accountType === 'staff' ? (
        <Panel title="Staff role" description="What this person does here. It decides what they can open and what they can approve.">
            <div>
            <Select value={staffRole} onValueChange={(v) => setStaffRole(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="talent_manager">Talent Manager</SelectItem>
                <SelectItem value="account_manager">Account Manager</SelectItem>
                <SelectItem value="business_development">Business Development</SelectItem>
                <SelectItem value="cofounder">Cofounder</SelectItem>
                <SelectItem value="ceo">CEO</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </Panel>
        ) : (
        <>
        {/* Subscription Tier */}
        <Panel title="Subscription tier" description="Picking a plan fills in the credits and limits below.">
            <div>
            <Select value={formData.subscription_tier} onValueChange={(value) => handleTierChange(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex flex-col">
                    <span className="font-medium">Free</span>
                    <span className="text-xs text-muted-foreground">5 profiles/month • 125 credits • 1 member</span>
                  </div>
                </SelectItem>
                <SelectItem value="standard">
                  <div className="flex flex-col">
                    <span className="font-medium">Standard - {formatMonthlyPlanPrice('standard')}</span>
                    <span className="text-xs text-muted-foreground">350 profiles • 8,750 credits • 2 members</span>
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex flex-col">
                    <span className="font-medium">Premium - {formatMonthlyPlanPrice('premium')}</span>
                    <span className="text-xs text-muted-foreground">1,000 profiles • 25,000 credits • 5 members</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            </div>
          </Panel>

        {/* Team Setup */}
        <Panel title="Team" description="A team is always created, because the platform needs one for credits and access to work. Name it here.">
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Team Name</label>
                <Input
                  placeholder={formData.company || `${formData.full_name || 'User'}'s Team`}
                  value={formData.team_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Defaults to company name if left empty
                </p>
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
            </div>
          </Panel>

        {/* Account Summary */}
        <Panel title="What you are about to create" description="Check this before you press create.">
            <div>
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
            </div>
          </Panel>
        </>
        )}
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
                  {accountType === 'admin' ? 'Create Admin' : accountType === 'staff' ? 'Create Staff Member' : 'Create Brand Account'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </SuperadminLayout>
  )
}
