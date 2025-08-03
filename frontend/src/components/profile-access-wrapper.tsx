/**
 * Profile Access Wrapper Component
 * Handles 30-day access system with limited vs full views
 */

"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessStatus, AccessUpgradePrompt } from "@/components/access-status"
import { ProfileResponse } from "@/services/instagramApi"
import { Lock, Eye, BarChart3, Users, TrendingUp } from "lucide-react"

interface ProfileAccessWrapperProps {
  profileData: ProfileResponse
  onUnlock?: () => void
  isUnlocking?: boolean
  children: ReactNode
}

export function ProfileAccessWrapper({
  profileData,
  onUnlock,
  isUnlocking,
  children
}: ProfileAccessWrapperProps) {
  const { profile, meta } = profileData
  const has_access = meta?.user_has_access || false
  const access_expires_in_days = meta?.access_expires_in_days || 0
  const data_source = meta?.data_source

  return (
    <div className="space-y-6">
      {/* Access Status Card */}
      <AccessStatus
        hasAccess={has_access}
        expiresAt={access_expires_in_days}
        accessMethod={data_source}
        username={profile.username}
        onUnlock={onUnlock}
        isUnlocking={isUnlocking}
      />

      {/* Profile Content - Full or Limited */}
      {has_access ? (
        // Full Access View
        <div className="space-y-6">
          {children}
        </div>
      ) : (
        // Limited Preview View
        <div className="space-y-6">
          {/* Basic Profile Info (Always Visible) */}
          <ProfilePreview profile={profile} />
          
          {/* Locked Content Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            <LockedSection
              title="Demographics Analytics"
              description="Age groups, gender split, locations"
              icon={<Users className="h-5 w-5" />}
            />
            <LockedSection
              title="Engagement Insights"
              description="Detailed metrics and trends"
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>
          
          <LockedSection
            title="Complete Post Analytics"
            description="Full post history with engagement data"
            icon={<TrendingUp className="h-5 w-5" />}
            className="w-full"
          />

          {/* Upgrade Prompt */}
          <AccessUpgradePrompt
            username={profile.username}
            onUnlock={onUnlock}
            isUnlocking={isUnlocking}
          />
        </div>
      )}
    </div>
  )
}

// Basic profile info that's always visible
function ProfilePreview({ profile }: { profile: ProfileResponse['profile'] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {profile.full_name?.[0] || profile.username[0].toUpperCase()}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {profile.full_name || profile.username}
                {profile.is_verified && <span className="text-blue-500">✓</span>}
              </CardTitle>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-bold text-lg">{formatNumber(profile.followers_count)}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="font-bold text-lg">{formatNumber(profile.following_count)}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
            <div>
              <div className="font-bold text-lg">{formatNumber(profile.posts_count)}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Type</span>
              <span className="font-medium">
                {profile.is_business_account ? 'Business' : 
                 profile.is_professional_account ? 'Creator' : 'Personal'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">
                {profile.is_private ? 'Private' : 'Public'}
              </span>
            </div>
            {profile.business_category_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{profile.business_category_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Locked content section placeholder
function LockedSection({ 
  title, 
  description,
  icon,
  className = ""
}: { 
  title: string
  description: string
  icon: ReactNode
  className?: string
}) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-white/40 dark:via-black/20 dark:to-black/40" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-muted-foreground">
          {icon}
          {title}
          <Lock className="h-4 w-4 ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Utility function for number formatting
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}