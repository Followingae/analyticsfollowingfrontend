'use client'

import { useState } from 'react'
import { useCreatorSearch } from '@/hooks/useCreatorSearch'
import { useProfileAIAnalysis } from '@/hooks/useProfileAIAnalysis'
import { useCDNMedia } from '@/hooks/useCDNMedia'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Loader2, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  User,
  Users,
  Heart,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Building,
  Mail,
  Phone,
  Globe,
  Target,
  Sparkles,
  Clock,
  Image,
  Eye
} from "lucide-react"
import { 
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, PieChart, Pie, Cell, Label } from "recharts"
import { ProfileAvatar } from '@/components/ui/profile-avatar'

interface CreatorProfilePageProps {
  username: string
  onError?: (error: string) => void
}

export function CreatorProfilePage({ username, onError }: CreatorProfilePageProps) {
  const [activeTab, setActiveTab] = useState('profile')
  
  // Step 1: Basic profile data (immediate)
  const profileSearch = useCreatorSearch({
    onError: (error) => onError?.(error.message)
  })
  
  // Step 2: AI analysis data (progressive)
  const aiAnalysis = useProfileAIAnalysis(username, {
    enabled: Boolean(profileSearch.data?.profile)
  })
  
  // CDN data for enhanced images
  const { data: cdnData } = useCDNMedia(username)

  // Search for profile if not already loaded
  const handleSearchProfile = () => {
    profileSearch.mutate(username)
  }
  
  // Get current profile data
  const profile = profileSearch.data?.profile
  const isLoading = profileSearch.isPending
  const hasError = profileSearch.error
  
  // Format numbers for display
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }
  
  // Determine influencer tier
  const getInfluencerTier = (followerCount: number) => {
    if (followerCount >= 1000000) return { tier: 'mega', color: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900' }
    if (followerCount >= 100000) return { tier: 'macro', color: 'bg-[#5100f3] text-white' }
    if (followerCount >= 10000) return { tier: 'micro', color: 'bg-[#d3ff02] text-black' }
    return { tier: 'nano', color: 'bg-gray-100 text-black border' }
  }
      })

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
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
  if (hasError || !profile) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">Profile Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  {hasError?.message || `No profile found for @${username}`}
                </p>
              </div>
              <Button onClick={handleSearchProfile}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Search Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tierInfo = getInfluencerTier(profile.followers_count || 0)


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