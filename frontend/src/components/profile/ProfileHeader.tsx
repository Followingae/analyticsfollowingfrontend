'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InstagramProfile } from '@/services/instagramApi'
import { formatNumber } from '@/lib/utils'
import { ProfileAvatar } from '@/components/ui/cdn-image'
import { 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Star, 
  Users, 
  Grid3x3, 
  Heart,
  CheckCircle2,
  Mail,
  Phone,
  Globe
} from 'lucide-react'

interface ProfileHeaderProps {
  profile: InstagramProfile
  className?: string
  cdnMedia?: {
    avatar: {
      small: string
      large: string
      available: boolean
    }
  }
}

export default function ProfileHeader({ profile, className = '', cdnMedia }: ProfileHeaderProps) {
  const openInstagramProfile = () => {
    window.open(`https://www.instagram.com/${profile.username}/`, '_blank')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className={`border-0 bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Profile Picture */}
          <div className="relative flex-shrink-0">
            <ProfileAvatar
              profile={{
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name,
                profile_pic_url: profile.profile_pic_url,
                profile_pic_url_hd: profile.profile_pic_url_hd
              }}
              cdnMedia={cdnMedia}
              size="large"
              className="w-24 h-24 md:w-30 md:h-30 border-4 border-white"
            />
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                  {profile.full_name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg text-gray-600">@{profile.username}</span>
                  {profile.is_verified && (
                    <Badge className="bg-blue-500 text-white">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                onClick={openInstagramProfile}
                variant="outline"
                className="md:ml-auto"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Instagram
              </Button>
            </div>

            {/* Account Type Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.is_business_account && (
                <Badge variant="secondary">Business Account</Badge>
              )}
              {profile.is_professional_account && (
                <Badge variant="secondary">Professional</Badge>
              )}
              {profile.is_private && (
                <Badge variant="outline">Private</Badge>
              )}
              {profile.business_category_name && (
                <Badge variant="outline">
                  {profile.business_category_name}
                </Badge>
              )}
            </div>

            {/* Biography */}
            {profile.biography && (
              <p className="text-gray-700 mb-4 leading-relaxed">
                {profile.biography}
              </p>
            )}

            {/* Business Contact Info */}
            {(profile.business_email || profile.business_phone_number || profile.external_url) && (
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                {profile.business_email && (
                  <a 
                    href={`mailto:${profile.business_email}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Mail className="w-4 h-4" />
                    {profile.business_email}
                  </a>
                )}
                {profile.business_phone_number && (
                  <a 
                    href={`tel:${profile.business_phone_number}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Phone className="w-4 h-4" />
                    {profile.business_phone_number}
                  </a>
                )}
                {profile.external_url && (
                  <a 
                    href={profile.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            )}

            {/* Last Updated */}
            {profile.last_refreshed && (
              <div className="text-xs text-gray-500">
                <Calendar className="w-3 h-3 inline mr-1" />
                Last updated: {formatDate(profile.last_refreshed)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(profile.followers_count)}
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Followers
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(profile.following_count || 0)}
            </div>
            <div className="text-sm text-gray-600">Following</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(profile.posts_count || 0)}
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Grid3x3 className="w-3 h-3" />
              Posts
            </div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {profile.engagement_rate?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3" />
              Engagement
            </div>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {profile.influence_score?.toFixed(1) || '0.0'}
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Star className="w-3 h-3" />
              Influence
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {profile.avg_likes && (
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="font-semibold text-gray-800">
                {formatNumber(profile.avg_likes)}
              </div>
              <div className="text-gray-600">Avg Likes</div>
            </div>
          )}

          {profile.avg_comments && (
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="font-semibold text-gray-800">
                {formatNumber(profile.avg_comments)}
              </div>
              <div className="text-gray-600">Avg Comments</div>
            </div>
          )}

          {profile.content_quality_score && (
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="font-semibold text-gray-800">
                {profile.content_quality_score.toFixed(1)}/10
              </div>
              <div className="text-gray-600">Content Quality</div>
            </div>
          )}

          {profile.data_quality_score && (
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="font-semibold text-gray-800">
                {profile.data_quality_score.toFixed(1)}/10
              </div>
              <div className="text-gray-600">Data Quality</div>
            </div>
          )}
        </div>

        {/* Features Badges */}
        {(profile.has_ar_effects || profile.has_clips || profile.has_guides || profile.has_channel) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Features:</div>
            <div className="flex flex-wrap gap-2">
              {profile.has_ar_effects && (
                <Badge variant="outline" className="text-xs">AR Effects</Badge>
              )}
              {profile.has_clips && (
                <Badge variant="outline" className="text-xs">Reels</Badge>
              )}
              {profile.has_guides && (
                <Badge variant="outline" className="text-xs">Guides</Badge>
              )}
              {profile.has_channel && (
                <Badge variant="outline" className="text-xs">Channel</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}