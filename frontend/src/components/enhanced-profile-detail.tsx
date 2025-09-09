"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle2, 
  Users, 
  ImageIcon, 
  Brain, 
  BarChart3, 
  Eye, 
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { ProfileImageWithFallback } from './profile-image-with-fallback'
import { ComprehensiveAIInsights } from './comprehensive-ai-insights'
import { useComprehensiveAIAnalysis } from '@/hooks/useComprehensiveAIAnalysis'
import { useCDNMedia } from '@/hooks/useCDNMedia'
import type { CreatorProfile } from '@/types/creator'

interface EnhancedProfileDetailProps {
  profile: CreatorProfile
  showAdvancedAI?: boolean
  onUnlock?: (username: string) => void
  isUnlocked?: boolean
}

export const EnhancedProfileDetail: React.FC<EnhancedProfileDetailProps> = ({ 
  profile, 
  showAdvancedAI = true,
  onUnlock,
  isUnlocked = false
}) => {
  const [activeTab, setActiveTab] = useState("overview")
  
  const cdnMedia = useCDNMedia(profile.id)
  
  const comprehensiveAI = useComprehensiveAIAnalysis(
    profile.username,
    { 
      enabled: showAdvancedAI && isUnlocked,
      staleTime: 10 * 60 * 1000 // 10 minutes
    }
  )

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const calculateEngagementRate = () => {
    if (profile.followers_count === 0) return 0
    return profile.engagement_rate || 0
  }

  const getVerificationStatus = () => {
    if (profile.is_verified) {
      return <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
    }
    return <Badge variant="outline">Not Verified</Badge>
  }

  const getAccountType = () => {
    if (profile.is_business_account) {
      return <Badge className="bg-purple-100 text-purple-800">Business</Badge>
    }
    if (profile.is_private) {
      return <Badge className="bg-gray-100 text-gray-800">Private</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Public</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <ProfileImageWithFallback
              src={cdnMedia.data?.avatar?.["512"]}
              fallback={profile.profile_pic_url}
              alt={profile.username}
              className="h-24 w-24 md:h-32 md:w-32"
              isPlaceholder={cdnMedia.data?.avatar?.placeholder}
            />
            
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">@{profile.username}</h1>
                  {profile.is_verified && (
                    <CheckCircle2 className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                
                {profile.full_name && (
                  <h2 className="text-lg text-muted-foreground mb-2">
                    {profile.full_name}
                  </h2>
                )}
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {getVerificationStatus()}
                  {getAccountType()}
                  {profile.business_category_name && (
                    <Badge variant="outline">{profile.business_category_name}</Badge>
                  )}
                </div>
              </div>

              {profile.biography && (
                <p className="text-muted-foreground leading-relaxed">
                  {profile.biography}
                </p>
              )}

              {profile.external_url && (
                <a 
                  href={profile.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {profile.external_url}
                </a>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {!isUnlocked && onUnlock && (
                <Button onClick={() => onUnlock(profile.username)} className="whitespace-nowrap">
                  Unlock Profile
                </Button>
              )}
              
              {isUnlocked && showAdvancedAI && (
                <Button 
                  variant="outline" 
                  onClick={() => comprehensiveAI.refetch()}
                  disabled={comprehensiveAI.isFetching}
                  className="whitespace-nowrap"
                >
                  {comprehensiveAI.isFetching ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Refresh AI Analysis
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(profile.followers_count)}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(profile.following_count)}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(profile.posts_count)}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{calculateEngagementRate().toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">Engagement</div>
            </div>
          </div>

          {/* Access Information */}
          {profile.access_granted_at && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-800">Profile Unlocked</div>
                  <div className="text-sm text-green-600">
                    Access granted on {new Date(profile.access_granted_at).toLocaleDateString()}
                  </div>
                </div>
                {profile.days_remaining && (
                  <Badge className="bg-green-100 text-green-800">
                    {profile.days_remaining} days remaining
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-analysis" disabled={!isUnlocked}>
            <Brain className="h-4 w-4 mr-2" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="content" disabled={!isUnlocked}>
            <Eye className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Account Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{new Date(profile.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Privacy:</span>
                        <span>{profile.is_private ? 'Private' : 'Public'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Engagement Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Engagement Rate:</span>
                        <span>{calculateEngagementRate().toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Follower Ratio:</span>
                        <span>1:{Math.round(profile.following_count / Math.max(profile.followers_count, 1))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Posts per 1K followers:</span>
                        <span>{Math.round((profile.posts_count / Math.max(profile.followers_count, 1)) * 1000)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legacy AI Insights */}
                {profile.ai_insights && (
                  <div>
                    <h4 className="font-medium mb-2">Basic AI Insights</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {profile.ai_insights.content_category}
                      </Badge>
                      <Badge variant="secondary">
                        Quality: {profile.ai_insights.content_quality_score}/10
                      </Badge>
                      <Badge className={
                        profile.ai_insights.average_sentiment > 0.3 ? "bg-green-100 text-green-800" :
                        profile.ai_insights.average_sentiment < -0.3 ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }>
                        {profile.ai_insights.average_sentiment > 0.3 ? 'Positive' :
                         profile.ai_insights.average_sentiment < -0.3 ? 'Negative' : 'Neutral'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis">
          <div className="space-y-4">
            {!isUnlocked ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">AI Analysis Locked</h3>
                  <p className="text-muted-foreground mb-4">
                    Unlock this profile to access comprehensive AI analysis with 10 advanced models
                  </p>
                  {onUnlock && (
                    <Button onClick={() => onUnlock(profile.username)}>
                      Unlock Profile
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : comprehensiveAI.isLoading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Loading AI Analysis</h3>
                  <p className="text-muted-foreground">
                    Processing comprehensive insights with 10 AI models...
                  </p>
                </CardContent>
              </Card>
            ) : comprehensiveAI.isError ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-red-500 mb-4">AI Analysis Error</div>
                  <p className="text-muted-foreground mb-4">
                    {comprehensiveAI.error}
                  </p>
                  <Button variant="outline" onClick={() => comprehensiveAI.refetch()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : comprehensiveAI.hasAnalysis ? (
              <ComprehensiveAIInsights 
                analysis={comprehensiveAI.data!}
                loading={comprehensiveAI.isFetching}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No AI Analysis Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Comprehensive AI analysis is not yet available for this profile
                  </p>
                  <Button variant="outline" onClick={() => comprehensiveAI.refetch()}>
                    Request Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardContent className="text-center py-12">
              <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Content Analysis</h3>
              <p className="text-muted-foreground">
                Detailed content analysis coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedProfileDetail