"use client"

/**
 * Account settings.
 *
 * WORKING tier. 40px between subjects, 24px inside a panel, 16px between fields, 8px from a
 * label to its input, and the form is capped at 640px so the inputs stop stretching to the
 * width of whatever monitor this lands on.
 *
 * What changed beyond spacing, because three things on this screen were saying something
 * that was not true:
 *
 *   The team lookup ended in a bare `catch`, so a 500 rendered as "No Team: you are not
 *   currently part of any team". Told to a Premium customer with five seats, that is not an
 *   empty state, it is a wrong answer. Failure and emptiness are now separate.
 *
 *   "Last Sign In" was `new Date().toISOString()`, stamped at page load. The overview
 *   endpoint has never returned a last-sign-in at all, so that row said "just now", every
 *   time, to everyone, for as long as it has existed. A fabricated fact is worse than an
 *   absent one, so the row is gone until there is something real to put in it.
 *
 *   The credit balance fell back to `'0'`. A balance we could not read is not a balance of
 *   zero, and this is the screen where somebody decides whether to top up.
 *
 * And where the individual-endpoint fallback substitutes default toggles because the saved
 * settings could not be read, it now says so above the switches, rather than presenting our
 * defaults as the customer's own choices.
 */

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { AuthGuard } from "@/components/AuthGuard"
import {
  User,
  Shield,
  CreditCard,
  Key,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Users as TeamIcon,
  BarChart3,
  Settings as SettingsIcon,
  RefreshCw,
  Bell,
} from "lucide-react"

import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import {
  userSettingsService,
  type UserProfile,
  type UserAccount,
  type UserPreferences,
  type UserSecurity,
  type NotificationPreferences,
  type PrivacySettings,
  type MyTeam,
  type MyTeamUsage,
} from "@/services/userSettingsService"
import { TeamMembersManagement } from "@/components/team/TeamMembersManagement"
import { UserAvatar } from "@/components/UserAvatar"
import { AvatarSelectionDialog } from "@/components/AvatarSelectionDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Figure, LoadFailed, Loading, Nothing, Page, PageHead, Panel, UNKNOWN,
} from "@/components/brand/primitives"

/* ── Local pieces ─────────────────────────────────────────────────────────────────────
   Three shapes cover this whole screen. Written once here so a switch row on Notifications
   and a switch row on Privacy are the same row, rather than the same markup typed twice
   with a `<Separator />` wedged between every pair. */

/** A read-only fact: a term on the left, its value on the right, one shared hairline. */
function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-ds-3 border-b border-border/70 py-ds-3 last:border-b-0">
      <dt className="text-ds-body text-muted-foreground">{term}</dt>
      <dd className="text-ds-label text-right">{children}</dd>
    </div>
  )
}

/** A setting you can change: a label, one line of what it does, and its control. */
function SettingRow({
  label, help, children,
}: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-ds-4 border-b border-border/70 py-ds-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-ds-1">
        <Label className="text-ds-label">{label}</Label>
        {help && <p className="max-w-[65ch] text-ds-caption text-muted-foreground">{help}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-ds-2">{children}</div>
    </div>
  )
}

/** A form field: 8px from the label to its input, which is the gap `ds-2` is named for. */
function Field({
  htmlFor, label, help, children,
}: { htmlFor?: string; label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-ds-2">
      <Label htmlFor={htmlFor} className="text-ds-label">{label}</Label>
      {children}
      {help && <p className="text-ds-caption text-muted-foreground">{help}</p>}
    </div>
  )
}

/** Said once, above any control whose current position we had to guess. */
function AssumedDefaults() {
  return (
    <p className="max-w-[65ch] rounded-ds-md bg-muted/60 px-ds-3 py-ds-2 text-ds-caption text-muted-foreground">
      We could not read your saved settings, so the switches below show our defaults rather
      than your choices. Saving from here will overwrite what you had.
    </p>
  )
}

function SettingsPageContent() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [security, setSecurity] = useState<UserSecurity | null>(null)
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null)
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null)
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null)
  const [myTeamUsage, setMyTeamUsage] = useState<MyTeamUsage | null>(null)
  // A team we could not read is not a team you do not have.
  const [teamFailed, setTeamFailed] = useState(false)
  // True when a switch on screen shows our default rather than the customer's saved value.
  const [assumedNotifications, setAssumedNotifications] = useState(false)
  const [assumedPrivacy, setAssumedPrivacy] = useState(false)

  // Form states
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({})
  const [preferencesForm, setPreferencesForm] = useState<Partial<UserPreferences>>({})
  const [notificationsForm, setNotificationsForm] = useState<Partial<NotificationPreferences>>({})
  const [privacyForm, setPrivacyForm] = useState<PrivacySettings>({})
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // UI states
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false
  })
  const [toggle2FADialog, setToggle2FADialog] = useState<'enable' | 'disable' | null>(null)
  const [twoFAPassword, setTwoFAPassword] = useState('')
  const [avatarConfig, setAvatarConfig] = useState<any>(null)

  const { user, refreshUser, hasRole } = useEnhancedAuth()
  const isFreeTier = hasRole('brand_free')

  useEffect(() => {
    if (user?.avatar_config && !avatarConfig) {
      setAvatarConfig(user.avatar_config)
    }
  }, [user?.avatar_config, avatarConfig])

  // Load all settings data from backend
  const loadSettingsData = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      setTeamFailed(false)
      setAssumedNotifications(false)
      setAssumedPrivacy(false)

      // Try overview endpoint first (single call for everything)
      let overviewLoaded = false
      try {
        const overview = await userSettingsService.getOverview()
        if (overview) {
          // Profile from overview
          setProfile(overview.profile)
          setProfileForm(overview.profile)

          // Security from overview. `last_sign_in_at` is not in the payload and never has
          // been, so it is left empty rather than stamped with the current time.
          setSecurity({
            two_factor_enabled: overview.security?.two_factor_enabled ?? false,
            email_verified: overview.security?.email_verified ?? true,
            last_sign_in_at: ''
          })

          // Notifications from overview
          if (overview.notifications) {
            setNotifications(overview.notifications)
            setNotificationsForm(overview.notifications)
          }

          // Privacy from overview
          if (overview.privacy) {
            setPrivacy(overview.privacy)
            setPrivacyForm(overview.privacy)
          }

          // Preferences from overview
          if (overview.preferences) {
            setPreferences(overview.preferences)
            setPreferencesForm(overview.preferences)
          }

          overviewLoaded = true
        }
      } catch (error) {
        console.error('Settings overview fetch failed:', error)
      }

      // Fallback: load individual endpoints if overview failed
      if (!overviewLoaded) {
        const profileData = await userSettingsService.getProfile()
        setProfile(profileData)
        setProfileForm(profileData)

        try {
          const prefsData = await userSettingsService.getPreferences()
          setPreferences(prefsData)
          setPreferencesForm(prefsData)
        } catch (error) {
          console.error('Failed to load preferences:', error)
          setPreferences({ timezone: 'UTC', language: 'en' })
          setPreferencesForm({ timezone: 'UTC', language: 'en' })
        }

        try {
          const notifData = await userSettingsService.getNotifications()
          setNotifications(notifData)
          setNotificationsForm(notifData)
        } catch (error) {
          console.error('Failed to load notification preferences:', error)
          const defaults: NotificationPreferences = {
            email_notifications: true,
            push_notifications: true,
            marketing_emails: false,
            security_alerts: true,
            weekly_reports: true
          }
          setNotifications(defaults)
          setNotificationsForm(defaults)
          // The switches are about to show our guesses. Say so above them.
          setAssumedNotifications(true)
        }

        setSecurity({
          two_factor_enabled: false,
          email_verified: true,
          last_sign_in_at: ''
        })

        setPrivacy({ profile_visibility: false, data_analytics_enabled: true })
        setPrivacyForm({ profile_visibility: false, data_analytics_enabled: true })
        setAssumedPrivacy(true)
      }

      // Account data from auth context
      if (user) {
        const displayRole = user.role ? user.role.replace('brand_', '').replace('_', ' ') : 'user'
        let subscriptionTier = 'free'
        if (user.subscription_tier) {
          subscriptionTier = user.subscription_tier.replace('brand_', '')
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

      // Team data
      try {
        const [teamData, teamUsageData] = await Promise.all([
          userSettingsService.getMyTeam(),
          userSettingsService.getMyTeamUsage(),
        ])
        setMyTeam(teamData)
        setMyTeamUsage(teamUsageData)
      } catch (error) {
        console.error('Failed to load team data:', error)
        setMyTeam(null)
        setMyTeamUsage(null)
        setTeamFailed(true)
      }

    } catch (error) {
      console.error('Failed to load settings:', error)
      setLoadError('We could not load your settings. This is a problem on our side, not a change to your account.')
      toast.error('Failed to load settings data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettingsData()

    // Safety timeout: force loading to end after 5 seconds to prevent infinite spinner
    const safetyTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          setLoadError('Loading took too long. Some settings may not be available.')
          return false
        }
        return prev
      })
    }, 5000)

    return () => clearTimeout(safetyTimeout)
  }, [])

  // Save profile
  const saveProfile = async () => {
    try {
      setSaving(true)
      const result = await userSettingsService.updateProfile(profileForm)
      setProfile(result)
      setProfileForm(result)
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

  // Save notifications
  const saveNotifications = async () => {
    try {
      setSaving(true)
      const result = await userSettingsService.updateNotifications(notificationsForm)
      setNotifications(result)
      setNotificationsForm(result)
      setAssumedNotifications(false)
      toast.success('Notification preferences updated')
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      toast.error('Failed to save notification preferences')
    } finally {
      setSaving(false)
    }
  }

  // Save privacy
  const savePrivacy = async () => {
    try {
      setSaving(true)
      const result = await userSettingsService.updatePrivacy(privacyForm)
      setPrivacy(result)
      setPrivacyForm(result)
      setAssumedPrivacy(false)
      toast.success('Privacy settings updated')
    } catch (error) {
      console.error('Failed to save privacy settings:', error)
      toast.error('Failed to save privacy settings')
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
    } catch (error: any) {

      toast.error(error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  // Handle avatar config change
  const handleAvatarConfigChange = async (config: any) => {
    try {
      setSaving(true)
      setAvatarConfig(config)
      const updatedProfile = { ...profileForm, avatar_config: config }
      const result = await userSettingsService.updateProfile(updatedProfile)
      setProfile(result)
      setProfileForm(result)
      await refreshUser()
      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Failed to update avatar:', error)
      toast.error('Failed to update avatar')
      setAvatarConfig(user?.avatar_config || null)
    } finally {
      setSaving(false)
    }
  }

  // Toggle 2FA
  const handleToggle2FA = async () => {
    if (!twoFAPassword.trim()) {
      toast.error('Please enter your password')
      return
    }
    const enabling = toggle2FADialog === 'enable'
    try {
      setSaving(true)
      const result = await userSettingsService.toggle2FA(enabling, twoFAPassword)
      toast.success(result.message || `2FA ${enabling ? 'enabled' : 'disabled'} successfully`)
      setSecurity(prev => prev ? { ...prev, two_factor_enabled: enabling } : prev)
      setToggle2FADialog(null)
      setTwoFAPassword('')
    } catch (error: any) {

      toast.error(error.message || `Failed to ${enabling ? 'enable' : 'disable'} 2FA`)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return UNKNOWN
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return UNKNOWN
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <BrandUserInterface>
        <Page tier="working">
          <PageHead title="Settings" sub="Your profile, your account, and how we contact you." />
          <Loading rows={5} />
        </Page>
      </BrandUserInterface>
    )
  }

  if (loadError && !profile) {
    return (
      <BrandUserInterface>
        <Page tier="working">
          <PageHead title="Settings" sub="Your profile, your account, and how we contact you." />
          <LoadFailed what="Your settings" detail={loadError} onRetry={() => loadSettingsData()} />
        </Page>
      </BrandUserInterface>
    )
  }

  const savingSpinner = saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null

  // `credits_balance` is not on the EnhancedUser type but is on the payload, which is why
  // the old call site was already an unchecked read. Narrowed once here so the three places
  // that ask about it agree, and so `undefined` stays distinguishable from a real zero.
  const creditsBalance = (user as { credits_balance?: number | null } | null | undefined)?.credits_balance

  return (
    <BrandUserInterface>
      <Page tier="working">
        <PageHead title="Settings" sub="Your profile, your account, and how we contact you." />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-ds-5">
          <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* ── Profile ─────────────────────────────────────────────────────────────── */}
          <TabsContent value="profile" className="flex flex-col gap-ds-5">
            <Panel
              title={<span className="flex items-center gap-ds-2"><User className="h-4 w-4" />Personal information</span>}
              description="Update your profile information and avatar."
            >
              <div className="flex max-w-[640px] flex-col gap-ds-5">
                {/* Who you are. Stacks on phones, a row from sm up. */}
                <div className="flex flex-col items-start gap-ds-3 sm:flex-row sm:items-center">
                  <div className="shrink-0">
                    <UserAvatar
                      user={{
                        full_name: profile?.full_name || '',
                        email: profile?.email || '',
                        avatar_config: avatarConfig
                      }}
                      size={80}
                      className="h-16 w-16 sm:h-20 sm:w-20"
                    />
                  </div>
                  <div className="flex w-full min-w-0 flex-1 flex-col gap-ds-2">
                    <div className="flex flex-col gap-ds-1">
                      <h3 className="truncate text-ds-label">{profile?.full_name}</h3>
                      <p className="truncate text-ds-caption text-muted-foreground">{profile?.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-ds-2">
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
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Generate New
                      </Button>
                    </div>
                  </div>
                </div>

                {/* The details. 16px between siblings, 8px from a label to its input. */}
                <div className="flex flex-col gap-ds-3">
                  <div className="grid gap-ds-3 md:grid-cols-2">
                    <Field htmlFor="full_name" label="Full name">
                      <Input
                        id="full_name"
                        value={profileForm.full_name || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </Field>
                    <Field htmlFor="email" label="Email" help="Email cannot be changed.">
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-ds-3 md:grid-cols-2">
                    <Field htmlFor="company" label="Company">
                      <Input
                        id="company"
                        value={profileForm.company || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </Field>
                    <Field htmlFor="job_title" label="Job title">
                      <Input
                        id="job_title"
                        value={profileForm.job_title || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, job_title: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <Field htmlFor="phone_number" label="Phone number">
                    <Input
                      id="phone_number"
                      value={profileForm.phone_number || ''}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                    />
                  </Field>

                  <Field htmlFor="bio" label="Bio">
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself"
                      value={profileForm.bio || ''}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    />
                  </Field>
                </div>

                {/* 40px before the action: it is a different subject from the fields. */}
                <Button onClick={saveProfile} disabled={saving} className="self-start">
                  {savingSpinner}
                  <Save className="mr-2 h-4 w-4" />
                  Save profile
                </Button>
              </div>
            </Panel>
          </TabsContent>

          {/* ── Account ─────────────────────────────────────────────────────────────── */}
          <TabsContent value="account" className="flex flex-col gap-ds-5">
            <Panel
              title={<span className="flex items-center gap-ds-2"><SettingsIcon className="h-4 w-4" />Account status</span>}
              description="Your account information and subscription details."
            >
              <dl className="flex max-w-[640px] flex-col">
                <Fact term="Role">
                  <Badge variant="outline" className="capitalize">{account?.role || UNKNOWN}</Badge>
                </Fact>
                <Fact term="Subscription">
                  <Badge
                    variant={account?.subscription_tier === 'free' ? 'secondary' : 'default'}
                    className="capitalize"
                  >
                    {account?.subscription_tier || UNKNOWN}
                  </Badge>
                </Fact>
                {account?.subscription_expires_at && (
                  <Fact term="Expires">{formatDate(account.subscription_expires_at)}</Fact>
                )}
                <Fact term="Account created">{formatDate(account?.created_at)}</Fact>
              </dl>
            </Panel>

            <Panel
              title={<span className="flex items-center gap-ds-2"><CreditCard className="h-4 w-4" />Credits</span>}
              description="What is left in your balance."
            >
              {/* A balance is a reading, not an object, so it has no box of its own. And a
                  balance we could not read is not a balance of zero. */}
              <div className="flex flex-col gap-ds-2">
                <p className="text-ds-caption font-medium text-muted-foreground">Current balance</p>
                <p className="text-[38px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
                  <Figure
                    value={creditsBalance?.toLocaleString()}
                    error={creditsBalance == null}
                  />
                </p>
                <p className="text-ds-caption text-muted-foreground">
                  {creditsBalance == null
                    ? 'We could not read your balance just now, so this is not a zero.'
                    : 'credits'}
                </p>
              </div>
            </Panel>
          </TabsContent>

          {/* ── Security ────────────────────────────────────────────────────────────── */}
          <TabsContent value="security" className="flex flex-col gap-ds-5">
            <Panel
              title={<span className="flex items-center gap-ds-2"><Shield className="h-4 w-4" />Security</span>}
              description="Your account security and authentication."
            >
              <div className="flex max-w-[640px] flex-col">
                <SettingRow label="Email verification" help="Whether we have confirmed this address.">
                  <Badge variant={security?.email_verified ? 'default' : 'destructive'}>
                    {security?.email_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </SettingRow>

                <SettingRow label="Two-factor authentication" help="Add an extra layer of security.">
                  <Badge variant={security?.two_factor_enabled ? 'default' : 'secondary'}>
                    {security?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Dialog open={toggle2FADialog !== null} onOpenChange={(open) => { if (!open) { setToggle2FADialog(null); setTwoFAPassword('') } }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setToggle2FADialog(security?.two_factor_enabled ? 'disable' : 'enable')}
                      >
                        {security?.two_factor_enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {toggle2FADialog === 'enable' ? 'Enable' : 'Disable'} two-factor authentication
                        </DialogTitle>
                        <DialogDescription>
                          Enter your password to confirm.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-ds-5">
                        <Field label="Password">
                          <Input
                            type="password"
                            value={twoFAPassword}
                            onChange={(e) => setTwoFAPassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                        </Field>
                        <div className="flex gap-ds-2">
                          <Button variant="outline" onClick={() => { setToggle2FADialog(null); setTwoFAPassword('') }}>
                            Cancel
                          </Button>
                          <Button
                            variant={toggle2FADialog === 'disable' ? 'destructive' : 'default'}
                            onClick={handleToggle2FA}
                            disabled={saving || !twoFAPassword.trim()}
                          >
                            {savingSpinner}
                            {toggle2FADialog === 'enable' ? 'Enable 2FA' : 'Disable 2FA'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </SettingRow>

                {/* "Last sign in" used to live here, filled with the time the page loaded.
                    Nothing in the API returns it, so there is nothing honest to show. */}
              </div>
            </Panel>

            <Panel
              title={<span className="flex items-center gap-ds-2"><Key className="h-4 w-4" />Change password</span>}
              description="Update your account password."
            >
              <div className="flex max-w-[640px] flex-col gap-ds-5">
                <div className="flex flex-col gap-ds-3">
                  <Field htmlFor="current_password" label="Current password">
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
                        aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Field>

                  <Field htmlFor="new_password" label="New password" help="At least 8 characters.">
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
                        aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Field>

                  <Field htmlFor="confirm_password" label="Confirm new password">
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
                        aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Field>
                </div>

                <Button
                  onClick={changePassword}
                  disabled={saving || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                  className="self-start"
                >
                  {savingSpinner}
                  <Key className="mr-2 h-4 w-4" />
                  Change password
                </Button>
              </div>
            </Panel>
          </TabsContent>

          {/* ── Notifications ───────────────────────────────────────────────────────── */}
          <TabsContent value="notifications" className="flex flex-col gap-ds-5">
            <Panel
              title={<span className="flex items-center gap-ds-2"><Bell className="h-4 w-4" />Notifications</span>}
              description="Choose which notifications you want to receive."
            >
              <div className="flex max-w-[640px] flex-col gap-ds-5">
                {assumedNotifications && <AssumedDefaults />}

                {/* Five switches, one list. Five `<Separator />` elements came out: a list
                    needs one shared hairline per row, not a drawn rule between each pair. */}
                <div className="flex flex-col">
                  <SettingRow label="Email notifications" help="Receive notifications via email.">
                    <Switch
                      checked={notificationsForm.email_notifications ?? true}
                      onCheckedChange={(checked) => setNotificationsForm(prev => ({ ...prev, email_notifications: checked }))}
                    />
                  </SettingRow>
                  <SettingRow label="Push notifications" help="Receive push notifications in your browser.">
                    <Switch
                      checked={notificationsForm.push_notifications ?? true}
                      onCheckedChange={(checked) => setNotificationsForm(prev => ({ ...prev, push_notifications: checked }))}
                    />
                  </SettingRow>
                  <SettingRow label="Security alerts" help="Get notified about security events on your account.">
                    <Switch
                      checked={notificationsForm.security_alerts ?? true}
                      onCheckedChange={(checked) => setNotificationsForm(prev => ({ ...prev, security_alerts: checked }))}
                    />
                  </SettingRow>
                  <SettingRow label="Weekly reports" help="Receive a weekly summary of your analytics.">
                    <Switch
                      checked={notificationsForm.weekly_reports ?? true}
                      onCheckedChange={(checked) => setNotificationsForm(prev => ({ ...prev, weekly_reports: checked }))}
                    />
                  </SettingRow>
                  <SettingRow label="Marketing emails" help="Receive product updates and promotional content.">
                    <Switch
                      checked={notificationsForm.marketing_emails ?? false}
                      onCheckedChange={(checked) => setNotificationsForm(prev => ({ ...prev, marketing_emails: checked }))}
                    />
                  </SettingRow>
                </div>

                <Button onClick={saveNotifications} disabled={saving} className="self-start">
                  {savingSpinner}
                  <Save className="mr-2 h-4 w-4" />
                  Save notification preferences
                </Button>
              </div>
            </Panel>
          </TabsContent>

          {/* ── Preferences ─────────────────────────────────────────────────────────── */}
          {/* Timezone + Language selectors removed (June 2026): they persisted
              values nothing consumed. No i18n is wired and no formatter reads
              the timezone. Re-add Language when Arabic localization ships. */}
          <TabsContent value="preferences" className="flex flex-col gap-ds-5">
            <Panel
              title={<span className="flex items-center gap-ds-2"><Shield className="h-4 w-4" />Privacy</span>}
              description="Control your data and visibility."
            >
              <div className="flex max-w-[640px] flex-col gap-ds-5">
                {assumedPrivacy && <AssumedDefaults />}

                <div className="flex flex-col">
                  <SettingRow label="Profile visibility" help="Make your profile visible to other users.">
                    <Switch
                      checked={privacyForm.profile_visibility === true || privacyForm.profile_visibility === 'public'}
                      onCheckedChange={(checked) => setPrivacyForm(prev => ({ ...prev, profile_visibility: checked }))}
                    />
                  </SettingRow>
                  <SettingRow label="Data analytics" help="Allow us to analyse your usage data to improve our service.">
                    <Switch
                      checked={privacyForm.data_analytics_enabled ?? true}
                      onCheckedChange={(checked) => setPrivacyForm(prev => ({ ...prev, data_analytics_enabled: checked }))}
                    />
                  </SettingRow>
                </div>

                <Button onClick={savePrivacy} disabled={saving} className="self-start">
                  {savingSpinner}
                  <Save className="mr-2 h-4 w-4" />
                  Save privacy settings
                </Button>
              </div>
            </Panel>
          </TabsContent>

          {/* ── Team ────────────────────────────────────────────────────────────────── */}
          <TabsContent value="team" className="flex flex-col gap-ds-5">
            {teamFailed ? (
              /* This used to render "No Team". A customer paying for five seats reading
                 that we have no record of their team is the worst version of this bug. */
              <LoadFailed
                what="Your team"
                detail="We could not read your team just now. This does not mean you are not on one."
                onRetry={() => loadSettingsData()}
              />
            ) : myTeam ? (
              <>
                <Panel
                  title={<span className="flex items-center gap-ds-2"><TeamIcon className="h-4 w-4" />Team</span>}
                  description="Your team membership and role."
                >
                  <dl className="flex max-w-[640px] flex-col">
                    <Fact term="Team name">{myTeam.team_name}</Fact>
                    <Fact term="Your role">
                      <Badge variant="outline" className="capitalize">{myTeam.team_role}</Badge>
                    </Fact>
                    <Fact term="Monthly profile limit">
                      <span className="tabular-nums">{myTeam.monthly_limits.profile_limit}</span>
                    </Fact>
                  </dl>
                </Panel>

                {myTeamUsage && (
                  <Panel
                    title={<span className="flex items-center gap-ds-2"><BarChart3 className="h-4 w-4" />Usage this month</span>}
                    description="What your team has spent of its monthly allowance."
                  >
                    <div className="flex flex-col gap-ds-2">
                      <p className="text-ds-caption font-medium text-muted-foreground">Profiles unlocked</p>
                      <p className="text-[38px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
                        {myTeamUsage.usage_this_month.profiles_unlocked}
                      </p>
                      <p className="text-ds-caption text-muted-foreground">
                        of {myTeam.monthly_limits.profile_limit} this month
                      </p>
                    </div>
                  </Panel>
                )}

                {/* Seats are sold on Standard and Premium, so the screen that sells them
                    is also the screen that fills them. This panel already existed and was
                    never mounted anywhere, which is part of why no paid seat was ever used. */}
                {!isFreeTier && <TeamMembersManagement />}

                {isFreeTier && (
                  <Panel
                    title={<span className="flex items-center gap-ds-2"><TeamIcon className="h-4 w-4 text-primary" />Invite your team</span>}
                    description="Your Free plan is limited to one member, which is you. A paid plan adds seats."
                  >
                    <div className="flex max-w-[640px] flex-col gap-ds-4">
                      {/* Three figures being compared, so no borders between them. */}
                      <dl className="grid grid-cols-3 gap-ds-5">
                        {([['Free', 1, false], ['Standard', 2, true], ['Premium', 5, true]] as const).map(
                          ([plan, seats, paid]) => (
                            <div key={plan} className="flex flex-col gap-ds-1">
                              <dd className={`text-ds-title tabular-nums ${paid ? 'text-primary' : ''}`}>{seats}</dd>
                              <dt className="text-ds-overline uppercase text-muted-foreground">{plan}</dt>
                            </div>
                          ),
                        )}
                      </dl>
                      <Button
                        variant="outline"
                        className="self-start"
                        onClick={() => window.location.href = '/billing'}
                      >
                        View plans
                      </Button>
                    </div>
                  </Panel>
                )}
              </>
            ) : (
              <Nothing>
                You are not part of a team yet. Contact your administrator to be added to one,
                or upgrade your account to use team features.
              </Nothing>
            )}
          </TabsContent>
        </Tabs>
      </Page>
    </BrandUserInterface>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <SettingsPageContent />
    </AuthGuard>
  )
}
