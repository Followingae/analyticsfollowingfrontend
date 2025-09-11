import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, UserPlus, Image, TrendingUp } from "lucide-react"
import { ProfileImage } from "@/components/ProfileImage"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { CDNStatusBanner } from "@/components/ui/cdn-processing-status"
import type { ProfileHeader } from "@/types/creatorTypes"

interface ProfileHeaderCardProps {
  profileHeader: ProfileHeader
}

export function ProfileHeaderCard({ profileHeader }: ProfileHeaderCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatEngagementRate = (rate: number | undefined | null) => {
    if (typeof rate !== 'number' || isNaN(rate)) {
      return 'N/A'
    }
    return `${rate.toFixed(2)}%`
  }

  return (
    <div className="space-y-4">
      {/* CDN Processing Status Banner */}
      <CDNStatusBanner profileId={profileHeader.id} />
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="relative">
              <ProfileAvatar
                src={profileHeader.profile_pic_url || '/placeholder-avatar.webp'}
                alt={`${profileHeader.full_name} profile picture`}
                fallbackText={profileHeader.full_name}
                size="xl"
                className="w-24 h-24 border-2 border-white dark:border-gray-900 shadow-lg"
              />
              {profileHeader.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="flex-1 space-y-4">
            {/* Name and Username */}
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                {profileHeader.full_name}
                {profileHeader.is_verified && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </h1>
              <p className="text-lg text-muted-foreground">
                @{profileHeader.username}
              </p>
            </div>

            {/* Category Badge */}
            {profileHeader.category_name && (
              <div className="flex justify-center md:justify-start">
                <Badge variant="outline" className="text-sm px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 border-purple-200 dark:border-purple-700">
                  {profileHeader.category_name}
                </Badge>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-1.5">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Followers</span>
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {formatNumber(profileHeader.followers_count)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-1.5">
                  <UserPlus className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Following</span>
                </div>
                <div className="text-xl font-bold">
                  {formatNumber(profileHeader.following_count)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-1.5">
                  <Image className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Posts</span>
                </div>
                <div className="text-xl font-bold">
                  {formatNumber(profileHeader.posts_count)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-1.5">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Engagement</span>
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {formatEngagementRate(profileHeader.engagement_rate)}
                </div>
              </div>
            </div>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}