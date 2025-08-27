'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Brain, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { ProfileHeaderCard } from "./ProfileHeaderCard"
import { ContactInfoPanel } from "./ContactInfoPanel"
import { QuickStatsDashboard } from "./QuickStatsDashboard"
import { RecentPostsPreview } from "./RecentPostsPreview"
import { ContentAnalysisCard } from "./ContentAnalysisCard"
import { SentimentAnalysisCard } from "./SentimentAnalysisCard"
import { AudienceInsightsCard } from "./AudienceInsightsCard"
import { LanguageAnalysisCard } from "./LanguageAnalysisCard"
import { PartnershipAssessmentCard } from "./PartnershipAssessmentCard"
import { AdvancedAnalyticsCard } from "./AdvancedAnalyticsCard"
import { CompletePostsGallery } from "./CompletePostsGallery"
import { creatorApiService } from "@/services/creatorApi"
import { useCDNMedia } from "@/hooks/useCDNMedia"
import type { Phase1Data, Phase2Data, CompleteCreatorProfile } from "@/types/creatorTypes"

interface CreatorProfilePageProps {
  username: string
  onError?: (error: string) => void
}

export function CreatorProfilePage({ username, onError }: CreatorProfilePageProps) {
  const [profile, setProfile] = useState<CompleteCreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  
  // Get CDN data for profile images
  const { data: cdnData } = useCDNMedia(profile?.phase1?.profile_header?.id || '', !!profile?.phase1?.profile_header?.id)

  // Load Phase 1 data immediately
  const loadPhase1Data = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🚀 CreatorProfile: Loading Phase 1 data for:', username)
      
      // Call the main creator search endpoint (POST /api/v1/creator/search/{username})
      const response = await creatorApiService.searchCreator(username, {
        force_refresh: false,
        include_posts: true,
        analysis_depth: 'standard'
      })

      if (response.success && response.data) {
        console.log('✅ CreatorProfile: Phase 1 data loaded successfully')
        
        // Map the response to our Phase1Data structure
        const phase1Data: Phase1Data = {
          profile_header: {
            username: response.data.profile.username,
            full_name: response.data.profile.full_name,
            profile_pic_url: response.data.profile.profile_pic_url_hd || response.data.profile.profile_pic_url,
            is_verified: response.data.profile.is_verified,
            followers_count: response.data.profile.followers_count,
            following_count: response.data.profile.following_count,
            posts_count: response.data.profile.posts_count,
            engagement_rate: response.data.profile.engagement_rate,
            category_name: response.data.profile.category || response.data.profile.business_category_name || 'General'
          },
          quick_metrics: {
            avg_likes_per_post: response.data.profile.avg_likes_per_post || 0,
            avg_comments_per_post: response.data.profile.avg_comments_per_post || 0,
            posting_frequency: response.data.profile.posting_frequency || 'Unknown',
            last_post_date: response.data.profile.last_post_date || new Date().toISOString(),
            account_type: response.data.profile.is_business_account ? 'Business' : 
                         response.data.profile.is_professional_account ? 'Creator' : 'Personal'
          },
          contact_info: {
            business_email: response.data.profile.business_email,
            business_phone: response.data.profile.business_phone_number,
            external_url: response.data.profile.external_url,
            location: response.data.profile.location
          },
          recent_posts: response.data.recent_posts?.map(post => ({
            post_id: post.id,
            thumbnail_url: post.media_url,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            posted_at: post.posted_at,
            caption_preview: post.caption?.substring(0, 100) + '...' || ''
          })) || []
        }

        setProfile({
          phase1: phase1Data,
          analysis_status: response.data.stage === 'complete' ? 'completed' : 'processing',
          loading_progress: response.data.progress
        })

        // If analysis is not complete, start polling for Phase 2
        if (response.data.stage !== 'complete') {
          startPollingForPhase2()
        } else {
          // Load Phase 2 data immediately if complete
          loadPhase2Data()
        }
      } else {
        const errorMsg = response.error || 'Failed to load creator profile'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error loading profile'
      console.error('❌ CreatorProfile: Phase 1 error:', err)
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Start polling for Phase 2 data completion
  const startPollingForPhase2 = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    const pollForCompletion = async () => {
      try {
        console.log('🔄 CreatorProfile: Checking analysis status...')
        
        // Check status endpoint (GET /api/v1/creator/{username}/status)
        const statusResponse = await creatorApiService.getAnalysisStatus(username)
        
        if (statusResponse.success && statusResponse.data) {
          const status = statusResponse.data.status
          console.log('📊 CreatorProfile: Analysis status:', status)
          
          setProfile(prev => prev ? {
            ...prev,
            analysis_status: status,
            loading_progress: statusResponse.data.progress
          } : null)

          if (status === 'completed') {
            console.log('🎉 CreatorProfile: Analysis complete! Loading Phase 2 data...')
            clearInterval(pollingInterval!)
            setPollingInterval(null)
            await loadPhase2Data()
          } else if (status === 'error') {
            console.error('❌ CreatorProfile: Analysis failed')
            clearInterval(pollingInterval!)
            setPollingInterval(null)
            setProfile(prev => prev ? { ...prev, analysis_status: 'error' } : null)
          }
        }
      } catch (err) {
        console.error('❌ CreatorProfile: Polling error:', err)
        // Continue polling on errors - might be temporary
      }
    }

    // Poll every 5 seconds
    const intervalId = setInterval(pollForCompletion, 5000)
    setPollingInterval(intervalId)

    // Auto-stop after 5 minutes
    setTimeout(() => {
      if (intervalId) {
        clearInterval(intervalId)
        setPollingInterval(null)
        console.log('⏰ CreatorProfile: Polling timeout - stopping')
      }
    }, 5 * 60 * 1000)
  }

  // Load Phase 2 data (detailed analytics)
  const loadPhase2Data = async () => {
    try {
      console.log('🧠 CreatorProfile: Loading Phase 2 data...')
      
      // Get detailed analytics (GET /api/v1/creator/{username}/detailed)
      const detailedResponse = await creatorApiService.getDetailedAnalysis(username)
      
      if (detailedResponse.success && detailedResponse.data) {
        console.log('✅ CreatorProfile: Phase 2 data loaded successfully')
        
        // Get all posts with AI analysis
        const postsResponse = await creatorApiService.getCreatorPosts(username, {
          limit: 50,
          offset: 0,
          include_ai: true
        })

        const allPosts = postsResponse.success && postsResponse.data ? 
          postsResponse.data.posts.map(post => ({
            post_id: post.id,
            media_url: post.media_url,
            caption: post.caption,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            posted_at: post.posted_at,
            ai_content_category: post.ai_content_category || 'Unknown',
            ai_sentiment: post.ai_sentiment || 'neutral',
            ai_sentiment_score: post.ai_sentiment_score || 0.5,
            ai_language: post.ai_language || 'English',
            engagement_performance: post.engagement_performance || 'average'
          })) : []

        // Map detailed response to Phase2Data structure
        const phase2Data: Phase2Data = {
          content_analysis: {
            primary_content_type: detailedResponse.data.ai_insights?.primary_content_type || 'General',
            content_distribution: detailedResponse.data.ai_insights?.content_distribution || {},
            content_consistency_score: detailedResponse.data.ai_insights?.content_consistency_score || 0,
            brand_safety_score: detailedResponse.data.ai_insights?.brand_safety_score || 0
          },
          sentiment_analysis: {
            overall_sentiment: detailedResponse.data.ai_insights?.overall_sentiment || 'Neutral',
            sentiment_score: detailedResponse.data.ai_insights?.sentiment_score || 0,
            sentiment_breakdown: detailedResponse.data.ai_insights?.sentiment_breakdown || {
              positive: 0, neutral: 100, negative: 0
            },
            brand_friendliness: detailedResponse.data.ai_insights?.brand_friendliness || 0
          },
          audience_insights: detailedResponse.data.audience_insights || {
            estimated_demographics: {
              age_groups: { '25-34': 50, '18-24': 30, '35-44': 20 },
              gender_split: { female: 50, male: 50 },
              top_locations: ['Global']
            }
          },
          language_analysis: detailedResponse.data.language_analysis || {
            primary_language: 'English',
            language_distribution: { 'English': 100 },
            target_markets: ['Global'],
            multilingual_score: 0
          },
          partnership_potential: detailedResponse.data.partnership_potential || {
            overall_score: 0,
            scoring_breakdown: {
              engagement_quality: 0,
              audience_alignment: 0,
              content_consistency: 0,
              brand_safety: 0,
              posting_regularity: 0
            },
            recommended_budget: '$0',
            best_collaboration_types: []
          },
          all_posts: allPosts,
          advanced_metrics: detailedResponse.data.advanced_metrics || {
            engagement_trends: {
              trend_direction: 'stable',
              monthly_growth: 0,
              peak_hours: [12, 18],
              optimal_posting_days: ['Monday', 'Wednesday', 'Friday']
            },
            content_performance: {
              best_performing_type: 'General',
              worst_performing_type: 'General',
              viral_potential_score: 0
            },
            competitive_analysis: {
              market_position: 'Unknown',
              similar_creators: [],
              competitive_advantage: 'Unknown'
            }
          }
        }

        setProfile(prev => prev ? {
          ...prev,
          phase2: phase2Data,
          analysis_status: 'completed'
        } : null)
      } else {
        console.error('❌ CreatorProfile: Failed to load Phase 2 data:', detailedResponse.error)
      }
    } catch (err) {
      console.error('❌ CreatorProfile: Phase 2 error:', err)
    }
  }

  // Manual refresh
  const handleRefresh = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    setProfile(null)
    loadPhase1Data()
  }

  // Initialize on mount
  useEffect(() => {
    if (username) {
      loadPhase1Data()
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [username])

  // Loading state
  if (loading && !profile) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Loading Creator Profile</h3>
                <p className="text-sm text-muted-foreground">Fetching profile data for @{username}...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">Failed to Load Profile</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Phase 1: Immediate Display */}
      <div className="space-y-6">
        <ProfileHeaderCard 
          profileHeader={profile.phase1.profile_header} 
          cdnMedia={cdnData ? {
            avatar: {
              small: cdnData.avatar['256'],
              large: cdnData.avatar['512'],
              available: cdnData.avatar.available
            }
          } : undefined}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QuickStatsDashboard quickMetrics={profile.phase1.quick_metrics} />
          </div>
          <div>
            <ContactInfoPanel contactInfo={profile.phase1.contact_info} />
          </div>
        </div>

        <RecentPostsPreview 
          recentPosts={profile.phase1.recent_posts} 
          username={profile.phase1.profile_header.username}
        />
      </div>

      {/* AI Analysis Progress Indicator */}
      {profile.analysis_status !== 'completed' && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {profile.analysis_status === 'processing' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                ) : profile.analysis_status === 'error' ? (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                ) : (
                  <Brain className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    {profile.analysis_status === 'processing' ? 'AI Analysis in Progress' :
                     profile.analysis_status === 'error' ? 'Analysis Failed' :
                     'AI Analysis Pending'}
                  </h3>
                  {profile.loading_progress && (
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {profile.loading_progress.percentage?.toFixed(0) || 0}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {profile.analysis_status === 'processing' ? 
                    profile.loading_progress?.current_step || 'Analyzing content with AI...' :
                   profile.analysis_status === 'error' ? 
                    'Failed to complete AI analysis. Some advanced features may not be available.' :
                    'AI analysis will begin shortly...'}
                </p>
                {profile.loading_progress && (
                  <Progress 
                    value={profile.loading_progress.percentage || 0} 
                    className="h-2"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 2: Complete Analytics (Progressive Enhancement) */}
      {profile.phase2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-bold">Complete AI Analytics</h2>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Analysis Complete
            </Badge>
          </div>

          {/* AI Intelligence Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContentAnalysisCard contentAnalysis={profile.phase2.content_analysis} />
            <SentimentAnalysisCard sentimentAnalysis={profile.phase2.sentiment_analysis} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AudienceInsightsCard audienceInsights={profile.phase2.audience_insights} />
            <LanguageAnalysisCard languageAnalysis={profile.phase2.language_analysis} />
          </div>

          <PartnershipAssessmentCard partnershipPotential={profile.phase2.partnership_potential} />
          
          <AdvancedAnalyticsCard advancedMetrics={profile.phase2.advanced_metrics} />

          {/* Complete Posts Gallery */}
          <CompletePostsGallery 
            posts={profile.phase2.all_posts} 
            username={profile.phase1.profile_header.username}
          />
        </div>
      )}
    </div>
  )
}