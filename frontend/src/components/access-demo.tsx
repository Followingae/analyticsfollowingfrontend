/**
 * 30-Day Access System Demo Component
 * Shows how to integrate the access system into any profile component
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AccessBadge, AccessUpgradePrompt } from "@/components/access-status"
import { useProfileAccess } from "@/hooks/useProfileAccess"
import { ProfileResponse } from "@/services/instagramApi"

interface AccessDemoProps {
  username: string
}

export function AccessDemo({ username }: AccessDemoProps) {
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const { unlockProfile, isUnlocking, checkAccessStatus } = useProfileAccess()

  const handleFetchProfile = async () => {
    setLoading(true)
    try {
      // This would normally come from your API call
      const mockProfileData: ProfileResponse = {
        profile: {
          username,
          full_name: "Demo User",
          biography: "This is a demo profile",
          external_url: "",
          profile_pic_url: "",
          profile_pic_url_hd: "",
          followers_count: 10000,
          following_count: 500,
          posts_count: 100,
          mutual_followers_count: 0,
          highlight_reel_count: 5,
          is_verified: false,
          is_private: false,
          is_business_account: false,
          is_professional_account: true,
          business_category_name: "Creator",
          business_email: "",
          business_phone_number: "",
          has_ar_effects: false,
          has_clips: true,
          has_guides: false,
          has_channel: false,
          ai_agent_type: "",
          ai_agent_owner_username: "",
          transparency_label: "",
          engagement_rate: 4.5,
          avg_likes: 450,
          avg_comments: 25,
          influence_score: 7.2,
          content_quality_score: 8.1,
          profile_images: [],
          profile_thumbnails: [],
          data_quality_score: 9.0,
          last_refreshed: new Date().toISOString(),
          refresh_count: 1
        },
        posts: [],
        analytics: {
          engagement_rate: 4.5,
          influence_score: 7.2,
          data_quality_score: 95.0
        },
        demographics: {
          gender_distribution: { female: 60, male: 40 },
          age_distribution: { "18-24": 30, "25-34": 45, "35-44": 20, "45-54": 5, "55+": 0 },
          location_distribution: { "United States": 40, "United Kingdom": 20, "Canada": 15 },
          sample_size: 1000,
          confidence_score: 85,
          analysis_method: "statistical"
        },
        meta: {
          analysis_timestamp: new Date().toISOString(),
          user_has_access: false, // Demo: no access initially
          access_expires_in_days: 0,
          data_source: "demo"
        }
      }
      
      setProfileData(mockProfileData)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    const result = await unlockProfile(username)
    if (result) {
      setProfileData(result)
    }
  }

  const renderProfileContent = () => {
    if (!profileData) return null

    const accessStatus = checkAccessStatus(profileData)

    if (accessStatus.hasAccess) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Full Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Female</span>
                    <span>{profileData.demographics?.gender_distribution.female}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Male</span>
                    <span>{profileData.demographics?.gender_distribution.male}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(profileData.demographics?.age_distribution || {}).map(([age, percentage]) => (
                    <div key={age} className="flex justify-between">
                      <span>{age}</span>
                      <span>{percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Complete Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>✅ Full access to all 80+ data points</p>
              <p>✅ Complete post history and engagement metrics</p>
              <p>✅ AI-powered insights and recommendations</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Limited preview
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Profile Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Username</span>
                <span>@{profileData.profile.username}</span>
              </div>
              <div className="flex justify-between">
                <span>Followers</span>
                <span>{profileData.profile.followers_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Posts</span>
                <span>{profileData.profile.posts_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <AccessUpgradePrompt
          username={username}
          onUnlock={handleUnlock}
          isUnlocking={isUnlocking}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>30-Day Access System Demo</CardTitle>
          <div className="flex items-center gap-2">
            <span>Status:</span>
            {profileData ? (
              <AccessBadge
                hasAccess={profileData.meta?.user_has_access || false}
                expiresAt={profileData.meta?.analysis_timestamp}
              />
            ) : (
              <span className="text-muted-foreground">No data loaded</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleFetchProfile} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading Profile..." : "Fetch Profile (Demo)"}
            </Button>

            {renderProfileContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}