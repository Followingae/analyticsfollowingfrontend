'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { currencyService } from "@/services/currencyService"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  ArrowLeft,
  Save,
  User,
  CreditCard,
  Shield,
  Settings,
  DollarSign,
  Users,
  Mail,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Crown,
  Calendar
} from "lucide-react"

// Interfaces based on your backend specification
interface UserDetails {
  id: string
  email: string
  full_name: string
  company?: string
  job_title?: string
  phone_number?: string
  role: string
  status: string
  subscription_tier: string
  subscription_expires_at?: string
  credits: number
  credits_used_this_month: number
  current_balance: number
  package_id?: string
  team_id?: string  // Added missing team_id field
  team_name?: string
  team_role?: string
  monthly_profile_limit: number
  monthly_email_limit: number
  currency_code: string
  currency_symbol: string
  decimal_places: number
  email_verified: boolean
  two_factor_enabled: boolean
  last_sign_in_at: string
  login_count: number
  created_at: string
}

interface SupportedCurrency {
  code: string
  name: string
  symbol: string
  decimal_places: number
}

export default function UserEditPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<UserDetails | null>(null)
  const [supportedCurrencies, setSupportedCurrencies] = useState<SupportedCurrency[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states
  const [basicInfo, setBasicInfo] = useState({
    email: '',
    full_name: '',
    company: '',
    job_title: '',
    phone_number: ''
  })

  const [accountControl, setAccountControl] = useState({
    role: '',
    status: '',
    subscription_tier: '',
    subscription_expires_at: ''
  })

  const [creditsAdjustment, setCreditsAdjustment] = useState({
    amount: 0,
    reason: '',
    action: 'add' as 'add' | 'remove'
  })

  const [currencySettings, setCurrencySettings] = useState({
    currency_code: '',
    currency_symbol: '',
    decimal_places: 2
  })

  const [teamSettings, setTeamSettings] = useState({
    team_name: '',
    team_role: '',
    monthly_profile_limit: 0,
    monthly_email_limit: 0
  })

  const [securityOverrides, setSecurityOverrides] = useState({
    email_verified: false,
    two_factor_enabled: false
  })

  // Load user data
  const loadUserData = async () => {
    try {
      setLoading(true)

      // Load user details
      const userResult = await superadminApiService.getUserDetails(userId)
      if (userResult.success && userResult.data) {
        const userData = userResult.data
        setUser(userData)

        // Populate form states
        setBasicInfo({
          email: userData.email || '',
          full_name: userData.full_name || '',
          company: userData.company || '',
          job_title: userData.job_title || '',
          phone_number: userData.phone_number || ''
        })

        setAccountControl({
          role: userData.role || '',
          status: userData.status || '',
          subscription_tier: userData.subscription_tier || '',
          subscription_expires_at: userData.subscription_expires_at || ''
        })

        setCurrencySettings({
          currency_code: userData.currency_code || 'USD',
          currency_symbol: userData.currency_symbol || '$',
          decimal_places: userData.decimal_places || 2
        })

        setTeamSettings({
          team_name: userData.team_name || '',
          team_role: userData.team_role || '',
          monthly_profile_limit: userData.monthly_profile_limit || 0,
          monthly_email_limit: userData.monthly_email_limit || 0
        })

        setSecurityOverrides({
          email_verified: userData.email_verified || false,
          two_factor_enabled: userData.two_factor_enabled || false
        })
      }

      // Load supported currencies
      const currenciesResult = await currencyService.getSupportedCurrencies()
      setSupportedCurrencies(currenciesResult || [])

    } catch (error) {
      console.error('Failed to load user data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [userId])

  // Save basic information
  const saveBasicInfo = async () => {
    try {
      setSaving(true)
      const result = await superadminApiService.updateUser(userId, basicInfo)
      if (result.success) {
        toast.success('Basic information updated successfully')
        loadUserData()
      } else {
        toast.error(result.error || 'Failed to update basic information')
      }
    } catch (error) {
      toast.error('Failed to update basic information')
    } finally {
      setSaving(false)
    }
  }

  // Save account control
  const saveAccountControl = async () => {
    try {
      setSaving(true)
      const result = await superadminApiService.updateUser(userId, accountControl)
      if (result.success) {
        toast.success('Account settings updated successfully')
        loadUserData()
      } else {
        toast.error(result.error || 'Failed to update account settings')
      }
    } catch (error) {
      toast.error('Failed to update account settings')
    } finally {
      setSaving(false)
    }
  }

  // Adjust credits
  const adjustCredits = async () => {
    try {
      setSaving(true)
      const result = await superadminApiService.adjustUserCredits(userId, {
        amount: creditsAdjustment.action === 'add' ? creditsAdjustment.amount : -creditsAdjustment.amount,
        reason: creditsAdjustment.reason
      })
      if (result.success) {
        toast.success(`Credits ${creditsAdjustment.action === 'add' ? 'added' : 'removed'} successfully`)
        setCreditsAdjustment({ amount: 0, reason: '', action: 'add' })
        loadUserData()
      } else {
        toast.error(result.error || 'Failed to adjust credits')
      }
    } catch (error) {
      toast.error('Failed to adjust credits')
    } finally {
      setSaving(false)
    }
  }

  // Update currency settings
  const updateCurrencySettings = async () => {
    try {
      setSaving(true)
      if (user?.team_id) {
        const result = await currencyService.updateTeamCurrency(
          user.team_id,
          currencySettings.currency_code,
          currencySettings.currency_symbol,
          currencySettings.decimal_places
        )
        toast.success('Currency settings updated successfully')
        loadUserData()
      }
    } catch (error) {
      toast.error('Failed to update currency settings')
    } finally {
      setSaving(false)
    }
  }

  // Verify email
  const verifyEmail = async () => {
    try {
      const result = await superadminApiService.verifyUserEmail(userId)
      if (result.success) {
        toast.success('Email verified successfully')
        loadUserData()
      } else {
        toast.error(result.error || 'Failed to verify email')
      }
    } catch (error) {
      toast.error('Failed to verify email')
    }
  }

  // Reset 2FA
  const reset2FA = async () => {
    try {
      const result = await superadminApiService.resetUser2FA(userId)
      if (result.success) {
        toast.success('2FA reset successfully')
        loadUserData()
      } else {
        toast.error(result.error || 'Failed to reset 2FA')
      }
    } catch (error) {
      toast.error('Failed to reset 2FA')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${user?.currency_symbol || '$'}${(amount / 100).toFixed(user?.decimal_places || 2)}`
  }

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  if (!user) {
    return (
      <SuperadminLayout>
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-semibold">User Not Found</h2>
            <p className="text-muted-foreground">The requested user could not be found.</p>
            <Button onClick={() => router.push('/superadmin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/superadmin/users" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Users
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit User</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.full_name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                {user.status}
              </Badge>
              <Badge variant="outline">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                User profile and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={basicInfo.full_name}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={basicInfo.company}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={basicInfo.job_title}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, job_title: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={basicInfo.phone_number}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>

              <Button onClick={saveBasicInfo} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Basic Information
              </Button>
            </CardContent>
          </Card>

          {/* Account Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Control
              </CardTitle>
              <CardDescription>
                Role, status, and subscription management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={accountControl.role} onValueChange={(value) => setAccountControl(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand_free">Brand Free</SelectItem>
                      <SelectItem value="brand_standard">Brand Standard</SelectItem>
                      <SelectItem value="brand_premium">Brand Premium</SelectItem>
                      <SelectItem value="brand_enterprise">Brand Enterprise</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={accountControl.status} onValueChange={(value) => setAccountControl(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subscription_tier">Subscription Tier</Label>
                  <Select value={accountControl.subscription_tier} onValueChange={(value) => setAccountControl(prev => ({ ...prev, subscription_tier: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_expires_at">Subscription Expires</Label>
                  <Input
                    id="subscription_expires_at"
                    type="date"
                    value={accountControl.subscription_expires_at}
                    onChange={(e) => setAccountControl(prev => ({ ...prev, subscription_expires_at: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={saveAccountControl} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Account Settings
              </Button>
            </CardContent>
          </Card>

          {/* Credits Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Credits Management
              </CardTitle>
              <CardDescription>
                Current balance: {formatCurrency(user.current_balance)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Credits:</span>
                  <span className="font-medium">{user.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Used This Month:</span>
                  <span className="font-medium">{user.credits_used_this_month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="font-medium">{formatCurrency(user.current_balance)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Adjust Credits</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select value={creditsAdjustment.action} onValueChange={(value: 'add' | 'remove') => setCreditsAdjustment(prev => ({ ...prev, action: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add Credits</SelectItem>
                        <SelectItem value="remove">Remove Credits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      value={creditsAdjustment.amount}
                      onChange={(e) => setCreditsAdjustment(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Reason for credit adjustment..."
                    value={creditsAdjustment.reason}
                    onChange={(e) => setCreditsAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={adjustCredits}
                  disabled={saving || creditsAdjustment.amount <= 0 || !creditsAdjustment.reason.trim()}
                  variant={creditsAdjustment.action === 'remove' ? 'destructive' : 'default'}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {creditsAdjustment.action === 'add' ? 'Add' : 'Remove'} Credits
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Currency Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency Settings
              </CardTitle>
              <CardDescription>
                Team currency configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currencySettings.currency_code} onValueChange={(value) => {
                    const currency = supportedCurrencies.find(c => c.code === value)
                    if (currency) {
                      setCurrencySettings({
                        currency_code: currency.code,
                        currency_symbol: currency.symbol,
                        decimal_places: currency.decimal_places
                      })
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedCurrencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Decimal Places</Label>
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    value={currencySettings.decimal_places}
                    onChange={(e) => setCurrencySettings(prev => ({ ...prev, decimal_places: parseInt(e.target.value) || 2 }))}
                  />
                </div>
              </div>

              <Button onClick={updateCurrencySettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Update Currency
              </Button>
            </CardContent>
          </Card>

          {/* Team Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Team settings and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Name:</span>
                  <span className="font-medium">{user.team_name || 'No team'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Role:</span>
                  <span className="font-medium">{user.team_role || 'Individual'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profile Limit:</span>
                  <span className="font-medium">{user.monthly_profile_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Limit:</span>
                  <span className="font-medium">{user.monthly_email_limit}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Override */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Override
              </CardTitle>
              <CardDescription>
                Security settings and overrides
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Verified</Label>
                    <p className="text-sm text-muted-foreground">User email verification status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.email_verified ? 'default' : 'destructive'}>
                      {user.email_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                    {!user.email_verified && (
                      <Button variant="outline" size="sm" onClick={verifyEmail}>
                        <Mail className="h-4 w-4 mr-2" />
                        Verify
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">2FA security status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.two_factor_enabled ? 'default' : 'secondary'}>
                      {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {user.two_factor_enabled && (
                      <Button variant="outline" size="sm" onClick={reset2FA}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Sign In:</span>
                    <span>{formatDate(user.last_sign_in_at)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Login Count:</span>
                    <span>{user.login_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account Created:</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that permanently affect the user account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete User Account</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the user account and all associated data.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

      </div>
    </SuperadminLayout>
  )
}