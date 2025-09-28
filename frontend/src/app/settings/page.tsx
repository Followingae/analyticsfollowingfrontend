"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Key,
  Mail,
  Save,
  Eye,
  EyeOff,
  Download,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users as TeamIcon,
  Clock,
  BarChart3,
  Settings as SettingsIcon,
  Lock,
  Smartphone,
  RefreshCw,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { userSettingsService, type UserProfile, type UserAccount, type UserPreferences, type UserSecurity, type MyTeam, type MyTeamUsage } from "@/services/userSettingsService"
import { UserAvatar } from "@/components/UserAvatar"
import { AvatarSelectionDialog } from "@/components/AvatarSelectionDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [security, setSecurity] = useState<UserSecurity | null>(null)
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null)
  const [myTeamUsage, setMyTeamUsage] = useState<MyTeamUsage | null>(null)

  // Form states
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({})
  const [preferencesForm, setPreferencesForm] = useState<Partial<UserPreferences>>({})
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // UI states
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [enable2FADialog, setEnable2FADialog] = useState(false)
  const [disable2FADialog, setDisable2FADialog] = useState(false)
  const [disable2FACode, setDisable2FACode] = useState('')
  const [avatarConfig, setAvatarConfig] = useState<any>(null)


  const { user, refreshUser } = useEnhancedAuth()

  // Initialize avatar config from user data
  useEffect(() => {
    if (user?.avatar_config && !avatarConfig) {
      setAvatarConfig(user.avatar_config)
    }
  }, [user?.avatar_config, avatarConfig])

  // Simple static currency formatting
  const formatAmount = (amountCents: number) => `AED ${(amountCents / 100).toFixed(2)}`
  const currencyInfo = { code: 'AED', symbol: 'AED' }

  // Load all settings data
  const loadSettingsData = async () => {
    try {
      setLoading(true)

      // Load profile data
      const profileData = await userSettingsService.getProfile()
      setProfile(profileData)

      // Use real user data from auth context instead of mock account data
      if (user) {
        // Map role to display-friendly format
        const displayRole = user.role ? user.role.replace('brand_', '').replace('_', ' ') : 'user'

        // Extract subscription tier from role or use the tier field
        let subscriptionTier = 'free'
        if (user.subscription_tier) {
          subscriptionTier = user.subscription_tier.replace('brand_', '')
        } else if (user.role?.startsWith('brand_')) {
          subscriptionTier = user.role.replace('brand_', '')
        } else if (user.role === 'super_admin' || user.role === 'admin') {
          subscriptionTier = 'admin'
        }

        setAccount({
          role: displayRole,
          subscription_tier: subscriptionTier,
          subscription_expires_at: user.subscription_expires_at,
          created_at: user.created_at || new Date().toISOString()
        })
      }

      // Set default preferences and security data since endpoints don't exist
      setPreferences({
        timezone: 'UTC',
        language: 'en',
        notification_preferences: { email: true, push: true },
        profile_visibility: 'private',
        data_analytics_enabled: true
      })

      setSecurity({
        two_factor_enabled: false,
        email_verified: true,
        last_sign_in_at: new Date().toISOString()
      })

      // Set form initial values
      setProfileForm(profileData)
      setPreferencesForm({
        timezone: 'UTC',
        language: 'en',
        notification_preferences: { email: true, push: true },
        profile_visibility: 'private',
        data_analytics_enabled: true
      })

      // Load team data if available
      try {
        const [teamData, teamUsageData] = await Promise.all([
          userSettingsService.getMyTeam(),
          userSettingsService.getMyTeamUsage(),
        ])
        setMyTeam(teamData)
        setMyTeamUsage(teamUsageData)
      } catch (error) {
        // Team data might not be available for all users
        console.log('No team data available')
      }

    } catch (error) {
      console.error('Failed to load settings data:', error)
      toast.error('Failed to load settings data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettingsData()
  }, [])

  // Save profile
  const saveProfile = async () => {
    try {
      setSaving(true)
      await userSettingsService.updateProfile(profileForm)
      setProfile({ ...profile!, ...profileForm })
      toast.success('Profile updated successfully')
      await refreshUser()
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true)
      await userSettingsService.updatePreferences(preferencesForm)
      setPreferences({ ...preferences!, ...preferencesForm })
      toast.success('Preferences updated successfully')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  // Change password
  const changePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    try {
      setSaving(true)
      await userSettingsService.changePassword(passwordForm.current_password, passwordForm.new_password)
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      toast.success('Password changed successfully')
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  // Handle avatar config change
  const handleAvatarConfigChange = async (config: any) => {
    try {
      setSaving(true)
      setAvatarConfig(config)

      // Save to backend via profile update (include avatar_config)
      const updatedProfile = {
        ...profileForm,
        avatar_config: config
      }

      const result = await userSettingsService.updateProfile(updatedProfile)
      setProfile(result)
      setProfileForm(result)

      // Update user state in auth context
      await refreshUser()

      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Failed to save avatar config:', error)
      toast.error('Failed to update avatar')
      // Revert avatar config on error
      setAvatarConfig(user?.avatar_config || null)
    } finally {
      setSaving(false)
    }
  }

  // Enable 2FA
  const enable2FA = async () => {
    try {
      setSaving(true)
      const result = await userSettingsService.enable2FA()
      // Show QR code and backup codes to user
      toast.success('2FA enabled successfully')
      setEnable2FADialog(false)
      await loadSettingsData()
    } catch (error) {
      console.error('Failed to enable 2FA:', error)
      toast.error('Failed to enable 2FA')
    } finally {
      setSaving(false)
    }
  }

  // Disable 2FA
  const disable2FA = async () => {
    if (!disable2FACode.trim()) {
      toast.error('Please enter verification code')
      return
    }

    try {
      setSaving(true)
      await userSettingsService.disable2FA(disable2FACode)
      toast.success('2FA disabled successfully')
      setDisable2FADialog(false)
      setDisable2FACode('')
      await loadSettingsData()
    } catch (error) {
      console.error('Failed to disable 2FA:', error)
      toast.error('Failed to disable 2FA')
    } finally {
      setSaving(false)
    }
  }

  // Export data
  const exportData = async () => {
    try {
      setSaving(true)
      const result = await userSettingsService.exportData()
      // Create download link
      const link = document.createElement('a')
      link.href = result.export_url
      link.download = 'my-data-export.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Data export started')
    } catch (error) {
      console.error('Failed to export data:', error)
      toast.error('Failed to export data')
    } finally {
      setSaving(false)
    }
  }

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not available'

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 mx-auto animate-spin" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 space-y-4 p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your profile information and avatar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <div>
                      <UserAvatar
                        user={{
                          full_name: profile?.full_name || '',
                          email: profile?.email || '',
                          avatar_config: avatarConfig
                        }}
                        size={80}
                        className="h-20 w-20"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{profile?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <AvatarSelectionDialog
                          currentAvatarConfig={avatarConfig}
                          userName={profile?.full_name || profile?.email || 'User'}
                          onAvatarChange={handleAvatarConfigChange}
                          trigger={
                            <Button variant="outline" size="sm">
                              Customize Avatar
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newConfig = {
                              variant: "beam",
                              colorScheme: "Brand Primary",
                              colors: ["#d3ff02", "#5100f3", "#c9a7f9", "#0a1221"],
                              seed: Math.random().toString(36).substring(7)
                            }
                            handleAvatarConfigChange(newConfig)
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Generate New
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Profile Form */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profileForm.company || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={profileForm.job_title || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, job_title: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={profileForm.phone_number || ''}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={profileForm.bio || ''}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    />
                  </div>

                  <Button onClick={saveProfile} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Account Status
                  </CardTitle>
                  <CardDescription>
                    View your account information and subscription details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="outline">{account?.role || 'Unknown'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subscription:</span>
                      <Badge variant={account?.subscription_tier === 'free' ? 'secondary' : 'default'}>
                        {account?.subscription_tier || 'Unknown'}
                      </Badge>
                    </div>
                    {account?.subscription_expires_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expires:</span>
                        <span>{formatDate(account.subscription_expires_at)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Created:</span>
                      <span>{formatDate(account?.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Credits & Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Credits & Usage
                  </CardTitle>
                  <CardDescription>
                    Your current credit balance and usage statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className="font-medium">
                        {user?.credits_balance ? formatAmount(user.credits_balance) : 'AED 0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency:</span>
                      <span>{currencyInfo?.code} ({currencyInfo?.symbol})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Data Export
                  </CardTitle>
                  <CardDescription>
                    Download all your account data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={exportData} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Verification */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Verification</Label>
                      <p className="text-sm text-muted-foreground">Your email verification status</p>
                    </div>
                    <Badge variant={security?.email_verified ? 'default' : 'destructive'}>
                      {security?.email_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={security?.two_factor_enabled ? 'default' : 'secondary'}>
                        {security?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      {security?.two_factor_enabled ? (
                        <Dialog open={disable2FADialog} onOpenChange={setDisable2FADialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Disable
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                              <DialogDescription>
                                Enter your verification code to disable 2FA
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Verification Code</Label>
                                <Input
                                  value={disable2FACode}
                                  onChange={(e) => setDisable2FACode(e.target.value)}
                                  placeholder="000000"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setDisable2FADialog(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={disable2FA} disabled={saving}>
                                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Disable 2FA
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button variant="outline" size="sm" onClick={enable2FA} disabled={saving}>
                          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Last Sign In */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Sign In:</span>
                      <span>{security?.last_sign_in_at ? formatDate(security.last_sign_in_at) : 'Never'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={changePassword}
                    disabled={saving || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Personal Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize your experience and notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={preferencesForm.timezone || ''}
                        onValueChange={(value) => setPreferencesForm(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferencesForm.language || ''}
                        onValueChange={(value) => setPreferencesForm(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Privacy Settings</h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                      </div>
                      <Switch
                        checked={preferencesForm.profile_visibility === 'public'}
                        onCheckedChange={(checked) => setPreferencesForm(prev => ({
                          ...prev,
                          profile_visibility: checked ? 'public' : 'private'
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Data Analytics</Label>
                        <p className="text-sm text-muted-foreground">Allow us to analyze your usage data to improve our service</p>
                      </div>
                      <Switch
                        checked={preferencesForm.data_analytics_enabled || false}
                        onCheckedChange={(checked) => setPreferencesForm(prev => ({
                          ...prev,
                          data_analytics_enabled: checked
                        }))}
                      />
                    </div>
                  </div>

                  <Button onClick={savePreferences} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-4">
              {myTeam ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TeamIcon className="h-5 w-5" />
                        Team Information
                      </CardTitle>
                      <CardDescription>
                        Your team membership and role details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Team Name:</span>
                          <span className="font-medium">{myTeam.team_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your Role:</span>
                          <Badge variant="outline">{myTeam.team_role}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Profile Limit:</span>
                          <span>{myTeam.monthly_limits.profile_limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Email Limit:</span>
                          <span>{myTeam.monthly_limits.email_limit}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {myTeamUsage && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Team Usage This Month
                        </CardTitle>
                        <CardDescription>
                          Current usage statistics for your team
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profiles Unlocked:</span>
                            <span className="font-medium">
                              {myTeamUsage.usage_this_month.profiles_unlocked} / {myTeam.monthly_limits.profile_limit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Emails Sent:</span>
                            <span className="font-medium">
                              {myTeamUsage.usage_this_month.emails_sent} / {myTeam.monthly_limits.email_limit}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TeamIcon className="h-5 w-5" />
                      No Team
                    </CardTitle>
                    <CardDescription>
                      You are not currently part of any team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Contact your administrator to be added to a team or upgrade your account to access team features.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}