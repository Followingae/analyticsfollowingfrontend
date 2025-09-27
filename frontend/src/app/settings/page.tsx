"use client"

import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Palette,
  Key,
  Mail,
  Smartphone,
  Save,
  Eye,
  EyeOff,
  Database,
  Trash2,
  Download,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users as TeamIcon,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/AuthGuard"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { settingsApiService, type SettingsOverview, type UserProfile, type NotificationSettings, type PrivacySettings, type UserPreferences } from "@/services/settingsApi"
import TeamContextDisplay from "@/components/team/TeamContextDisplay"
import TeamMembersManagement from "@/components/team/TeamMembersManagement"
import UsageLimitWarning from "@/components/team/UsageLimitWarning"
import { teamApiService, TeamContext } from "@/services/teamApi"
import { SiteHeader } from "@/components/site-header"
import { SettingsSkeleton } from "@/components/skeletons"
import { AvatarSelectionDialog } from "@/components/AvatarSelectionDialog"
import { UserAvatar } from "@/components/UserAvatar"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function SettingsPage() {
  // UI State
  const [showApiKey, setShowApiKey] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Settings Data
  const [settings, setSettings] = useState<SettingsOverview | null>(null)
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({})
  const [notificationSettings, setNotificationSettings] = useState<Partial<NotificationSettings>>({})
  const [privacySettings, setPrivacySettings] = useState<Partial<PrivacySettings>>({})
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({})
  
  // Team Data
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null)
  const [teamContextLoading, setTeamContextLoading] = useState(true)
  
  // Password State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, refreshUser, updateProfile, updateUserState } = useEnhancedAuth()
  const { userCurrency, isLoading: currencyLoading } = useCurrency()
  
  // Avatar configuration state
  const [avatarConfig, setAvatarConfig] = useState<{
    variant: string
    colorScheme: string  
    colors: string[]
  } | null>(null)

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
    loadTeamContext()
  }, [])

  // Initialize avatar config from user data
  useEffect(() => {
    if (user?.avatar_config && !avatarConfig) {
      setAvatarConfig(user.avatar_config)
    }
  }, [user?.avatar_config, avatarConfig])

  const loadSettings = async () => {
    setLoading(true)
    try {

      const result = await settingsApiService.getSettingsOverview()
      
      if (result.success && result.data) {

        setSettings(result.data)
        
        // Initialize form data
        setProfileData(result.data.profile)
        setNotificationSettings(result.data.notifications)
        setPrivacySettings(result.data.privacy)
        setPreferences(result.data.preferences)
      } else {

        toast.error(result.error || 'Failed to load settings')
      }
    } catch (error) {

      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const loadTeamContext = async () => {
    setTeamContextLoading(true)
    try {
      // Check for stored context first
      const storedContext = teamApiService.getStoredTeamContext()
      if (storedContext) {
        setTeamContext(storedContext)
        return
      }

      // Try to fetch team context
      const result = await teamApiService.getTeamContext()
      if (result.success && result.data) {
        setTeamContext(result.data)
        teamApiService.updateTeamContext(result.data)
      } else {
        setTeamContext(null)
      }
    } catch (error) {

      setTeamContext(null)
    } finally {
      setTeamContextLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      // Include avatar_config in profile data to prevent it from being overwritten
      const profileDataWithAvatar = {
        ...profileData,
        avatar_config: avatarConfig || user?.avatar_config
      }

      const success = await updateProfile(profileDataWithAvatar)
      
      if (success) {

        
        // Use a small delay to ensure auth context state has been updated
        setTimeout(() => {
          // Update local form state with current user data from auth context
          // The auth context has already been updated with fresh API response data
          if (user) {
            setProfileData({
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              company: user.company || '',
              job_title: user.job_title || '',
              phone_number: user.phone_number || '',
              bio: user.bio || '',
              email: user.email || ''
            })
          }
        }, 100)
      } else {

      }
    } catch (error) {

      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = async (updates: Partial<NotificationSettings>) => {
    try {

      const result = await settingsApiService.updateNotificationSettings(updates)
      
      if (result.success && result.data) {

        setNotificationSettings(result.data)
        toast.success(result.message || 'Notification preferences updated')
      } else {

        toast.error(result.error || 'Failed to update notifications')
      }
    } catch (error) {

      toast.error('Failed to update notifications')
    }
  }

  const savePrivacy = async (updates: Partial<PrivacySettings>) => {
    try {

      const result = await settingsApiService.updatePrivacySettings(updates)
      
      if (result.success && result.data) {

        setPrivacySettings(result.data)
        toast.success(result.message || 'Privacy settings updated')
      } else {

        toast.error(result.error || 'Failed to update privacy settings')
      }
    } catch (error) {

      toast.error('Failed to update privacy settings')
    }
  }

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    try {

      const result = await settingsApiService.updatePreferences(updates)
      
      if (result.success && result.data) {

        setPreferences(result.data)
        toast.success(result.message || 'Preferences updated')
      } else {

        toast.error(result.error || 'Failed to update preferences')
      }
    } catch (error) {

      toast.error('Failed to update preferences')
    }
  }

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    const validation = settingsApiService.validatePassword(passwordData.new_password)
    if (!validation.valid) {
      toast.error(validation.errors.join(', '))
      return
    }

    setSaving(true)
    try {

      const result = await settingsApiService.changePassword(passwordData)
      
      if (result.success && result.data) {

        toast.success(result.message || 'Password updated successfully')
        
        // Clear password form
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
        
        // Handle re-authentication if required
        if (result.data.requires_reauth) {
          toast.info('Please log in again with your new password', { duration: 5000 })
          // Could redirect to login or handle re-auth here
        }
      } else {

        toast.error(result.error || 'Failed to change password')
      }
    } catch (error) {

      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = settingsApiService.validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setSaving(true)
    try {

      const result = await settingsApiService.uploadAvatar(file)
      
      if (result.success && result.data) {

        setProfileData(prev => ({
          ...prev,
          profile_picture_url: result.data!.profile_picture_url
        }))
        toast.success(result.message || 'Avatar updated successfully')
        await refreshUser() // Update auth context
      } else {

        toast.error(result.error || 'Failed to upload avatar')
      }
    } catch (error) {

      toast.error('Failed to upload avatar')
    } finally {
      setSaving(false)
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAvatarConfigChange = async (config: { variant: string; colorScheme: string; colors: string[]; seed?: string }) => {
    try {
      // Update local state immediately for UI responsiveness
      setAvatarConfig(config)

      // Save to backend
      const updatedProfileData = {
        ...profileData,
        avatar_config: config
      }

      const success = await updateProfile(updatedProfileData)

      if (success) {
        // Update local profile data
        setProfileData(updatedProfileData)

        // Update auth context user state
        updateUserState({ avatar_config: config })

        // Update UserStore for dashboard persistence
        const { useUserStore } = await import('@/stores/userStore')
        const { updateUser } = useUserStore.getState()
        if (updateUser) {
          updateUser({ avatar_config: config })
        }

        toast.success('Avatar updated successfully')
      } else {
        // Revert local state on failure
        setAvatarConfig(user?.avatar_config || null)
        toast.error('Failed to save avatar changes')
      }
    } catch (error) {
      // Revert local state on error
      setAvatarConfig(user?.avatar_config || null)
      toast.error('Failed to update avatar')
    }
  }

  const handleNotificationToggle = (key: keyof NotificationSettings, value: boolean) => {
    const updates = { [key]: value }
    setNotificationSettings(prev => ({ ...prev, ...updates }))
    saveNotifications(updates)
  }

  const handlePrivacyToggle = (key: keyof PrivacySettings, value: boolean) => {
    const updates = { [key]: value }
    setPrivacySettings(prev => ({ ...prev, ...updates }))
    savePrivacy(updates)
  }

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 66)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <SettingsSkeleton />
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 66)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {loading ? (
          <SettingsSkeleton />
        ) : (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                  Manage your account settings, preferences, and integrations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6">
                {/* Profile Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your profile information and avatar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4">
                      <UserAvatar 
                        user={{
                          ...user,
                          ...profileData,
                          avatar_config: avatarConfig || user?.avatar_config
                        }}
                        size={80}
                        className="h-20 w-20"
                        key={`settings-avatar-${JSON.stringify(avatarConfig || user?.avatar_config) || 'default'}`}
                      />
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <AvatarSelectionDialog
                            currentAvatarConfig={avatarConfig || user?.avatar_config}
                            userName={user?.full_name || user?.first_name || user?.email || "User"}
                            onAvatarChange={handleAvatarConfigChange}
                            trigger={
                              <Button variant="outline" size="sm">
                                <User className="h-4 w-4 mr-2" />
                                Choose Avatar
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Profile Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={profileData.first_name || ''} 
                          onChange={(e) => setProfileData(prev => ({...prev, first_name: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={profileData.last_name || ''} 
                          onChange={(e) => setProfileData(prev => ({...prev, last_name: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={profileData.email || ''} 
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed from settings
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input 
                          id="company" 
                          value={profileData.company || ''} 
                          onChange={(e) => setProfileData(prev => ({...prev, company: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input 
                          id="jobTitle" 
                          value={profileData.job_title || ''} 
                          onChange={(e) => setProfileData(prev => ({...prev, job_title: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          value={profileData.phone_number || ''} 
                          onChange={(e) => setProfileData(prev => ({...prev, phone_number: e.target.value}))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        value={profileData.bio || ''}
                        onChange={(e) => setProfileData(prev => ({...prev, bio: e.target.value}))}
                      />
                    </div>
                    <Button onClick={saveProfile} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                {/* Notification Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose how you want to be notified about account activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications for important updates
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Campaign Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when your campaigns have updates
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Creator Activity</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifications about creator performance changes
                          </p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Weekly Reports</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive weekly analytics summaries
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Marketing Emails</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive updates about new features and tips
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security & Privacy
                    </CardTitle>
                    <CardDescription>
                      Manage your account security and privacy settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Change Password</h3>
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                      <Button variant="outline">
                        Update Password
                      </Button>
                    </div>
                    
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>2FA Status</Label>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Badge variant="outline" className="text-orange-600">
                          Not Enabled
                        </Badge>
                      </div>
                      <Button variant="outline" className="mt-4">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Enable 2FA
                      </Button>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Account Privacy</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Profile Visibility</Label>
                            <p className="text-sm text-muted-foreground">
                              Make your profile visible to other users
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Data Analytics</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow us to analyze your usage for improvements
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                {/* Team Management */}
                {teamContextLoading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Loading team data...</div>
                    </CardContent>
                  </Card>
                ) : !teamContext ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TeamIcon className="h-5 w-5" />
                        Team Management
                      </CardTitle>
                      <CardDescription>
                        Team features are not available for your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Contact support to enable team features for your organization.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Usage Warnings */}
                    <UsageLimitWarning teamContext={teamContext} className="w-full" />
                    
                    {/* Team Overview and Members */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      <TeamContextDisplay teamContext={teamContext} className="w-full" />
                      <TeamMembersManagement teamContext={teamContext} className="w-full" />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                {/* API & Integrations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Access
                    </CardTitle>
                    <CardDescription>
                      Manage API keys and access tokens for integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="apiKey"
                          type={showApiKey ? "text" : "password"}
                          defaultValue="ak_1234567890abcdef1234567890abcdef"
                          readOnly
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use this key to access our API. Keep it secure and don't share it.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        Regenerate Key
                      </Button>
                      <Button variant="outline">
                        View Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Third-party Integrations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Third-party Integrations
                    </CardTitle>
                    <CardDescription>
                      Connect with external services and platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Database className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Google Analytics</h4>
                            <p className="text-sm text-muted-foreground">Track website performance</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600">Connected</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Mailchimp</h4>
                            <p className="text-sm text-muted-foreground">Email marketing automation</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Slack</h4>
                            <p className="text-sm text-muted-foreground">Team notifications</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                {/* Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Display Preferences
                    </CardTitle>
                    <CardDescription>
                      Customize your dashboard appearance and behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select defaultValue="system">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select defaultValue="utc">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utc">UTC</SelectItem>
                            <SelectItem value="est">Eastern Time</SelectItem>
                            <SelectItem value="pst">Pacific Time</SelectItem>
                            <SelectItem value="cet">Central European Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select defaultValue="en">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        {currencyLoading ? (
                          <div className="h-10 w-full rounded-md border border-input bg-background animate-pulse" />
                        ) : userCurrency ? (
                          <div className="flex items-center justify-between p-3 rounded-md border">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-lg">{userCurrency.currency_symbol}</span>
                              <span className="font-medium">{userCurrency.currency_code}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {userCurrency.decimal_places} decimals
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 rounded-md border bg-muted">
                            <span className="text-muted-foreground">No currency information</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Currency settings are managed by your administrator
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Currency Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      💱 Account Currency
                    </CardTitle>
                    <CardDescription>
                      View your account currency settings and formatting preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currencyLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                      </div>
                    ) : userCurrency ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Current Currency</p>
                            <p className="text-sm text-muted-foreground">
                              All monetary amounts are displayed in this currency
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-lg font-mono">
                            {userCurrency.currency_symbol} {userCurrency.currency_code}
                          </Badge>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Currency Code:</span>
                              <span className="ml-2 font-mono">{userCurrency.currency_code}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Symbol:</span>
                              <span className="ml-2 font-mono">{userCurrency.currency_symbol}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Decimal Places:</span>
                              <span className="ml-2 font-mono">{userCurrency.decimal_places}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Team ID:</span>
                              <span className="ml-2 font-mono text-xs">{userCurrency.team_id}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          💡 Currency settings are managed by your administrator.
                          Contact support if you need to change your account currency.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No currency information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Data Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Management
                    </CardTitle>
                    <CardDescription>
                      Manage your account data and exports
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Export Account Data</h4>
                          <p className="text-sm text-muted-foreground">
                            Download all your account data in JSON format
                          </p>
                        </div>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Delete Account</h4>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        )}
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}
