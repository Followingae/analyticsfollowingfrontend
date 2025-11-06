'use client'

import React, { useState, useEffect } from 'react'
import ReactCountryFlag from 'react-country-flag'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  Heart,
  MessageCircle,
  BarChart3,
  Shield,
  Eye,
  Globe,
  Star,
  Award,
  Target,
  Camera,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Brain,
  Activity,
  Image as ImageIcon,
  TrendingUp,
  Sparkles,
  BookOpen
} from 'lucide-react'
import { comprehensiveAnalyticsApi } from '@/services/comprehensiveAnalyticsApi'
import { getCountryName } from '@/utils/countryNames'

interface ComprehensiveCreatorAnalyticsProps {
  username: string
}

// Safe formatting helpers
const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : num.toFixed(decimals)
}

const safePercentage = (value: any, decimals: number = 1): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : (num * 100).toFixed(decimals)
}

function ComprehensiveCreatorAnalyticsComponent({ username }: ComprehensiveCreatorAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await comprehensiveAnalyticsApi.getCompleteDashboardData(username)
        console.log('📊 COMPLETE API RESPONSE:', JSON.stringify(response, null, 2))
        setData(response)
      } catch (err) {
        console.error('❌ Error fetching creator analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchData()
    }
  }, [username])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data || !data.profile) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
          <p className="text-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </Card>
    )
  }

  const profile = data.profile
  const posts = data.posts || profile.posts || []

  // ACTUAL backend structure (not the documentation!)
  const aiAnalysis = profile.ai_analysis || {}
  const audience = profile.audience || {}
  const content = profile.content || {}
  const engagement = profile.engagement || {}
  const security = profile.security || {}

  return (
    <div className="space-y-6">
      {/* Header Section - Profile Overview */}
      <Card className="border-0 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-8">
            <Avatar className="h-32 w-32 border-4 border-primary/30 shadow-xl ring-4 ring-primary/10">
              <AvatarImage
                src={profile.cdn_avatar_url || profile.profile_pic_url_hd || profile.profile_pic_url}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {profile.full_name?.charAt(0) || profile.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{profile.full_name || profile.username}</h1>
                {profile.is_verified && <CheckCircle className="h-6 w-6 text-blue-500" />}
                {profile.detected_country && (
                  <div className="flex items-center gap-2">
                    <ReactCountryFlag
                      countryCode={profile.detected_country}
                      svg
                      style={{ width: '1.2em', height: '1.2em' }}
                      title={getCountryName(profile.detected_country)}
                    />
                    <Badge variant="outline" className="font-medium">
                      {getCountryName(profile.detected_country)}
                    </Badge>
                  </div>
                )}
                {profile.is_business_account && <Badge variant="secondary">Business</Badge>}
              </div>

              <p className="text-xl text-muted-foreground">@{profile.username}</p>

              {profile.biography && (
                <p className="text-muted-foreground max-w-2xl">{profile.biography}</p>
              )}

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{(profile.followers_count || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{(profile.posts_count || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{safeToFixed(profile.engagement_rate, 2)}%</span>
                  <span className="text-muted-foreground">engagement</span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-2">
              {aiAnalysis.content_quality_score !== null && aiAnalysis.content_quality_score !== undefined && (
                <Badge variant="secondary" className="mb-2">
                  AI Score: {safeToFixed(aiAnalysis.content_quality_score, 1)}/100
                </Badge>
              )}
              {aiAnalysis.primary_content_type && (
                <Badge variant="outline" className="capitalize">{aiAnalysis.primary_content_type}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Likes</p>
                <p className="text-2xl font-bold">{(profile.avg_likes || 0).toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Comments</p>
                <p className="text-2xl font-bold">{(profile.avg_comments || 0).toLocaleString()}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {audience.quality?.authenticity_score !== null && audience.quality?.authenticity_score !== undefined && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Authenticity</p>
                  <p className="text-2xl font-bold">{safeToFixed(audience.quality.authenticity_score, 1)}%</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {content.visual_analysis?.aesthetic_score !== null && content.visual_analysis?.aesthetic_score !== undefined && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aesthetic Score</p>
                  <p className="text-2xl font-bold">{safeToFixed(content.visual_analysis.aesthetic_score, 1)}%</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs for Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="authenticity">Authenticity</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Analysis Summary */}
            {aiAnalysis && Object.keys(aiAnalysis).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiAnalysis.primary_content_type && (
                    <div className="flex justify-between">
                      <span className="text-sm">Primary Content Type</span>
                      <Badge variant="secondary" className="capitalize">{aiAnalysis.primary_content_type}</Badge>
                    </div>
                  )}
                  {aiAnalysis.content_quality_score !== null && aiAnalysis.content_quality_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Content Quality Score</span>
                        <span className="font-medium">{safeToFixed(aiAnalysis.content_quality_score, 1)}/100</span>
                      </div>
                      <Progress value={aiAnalysis.content_quality_score} className="h-2" />
                    </div>
                  )}
                  {aiAnalysis.models_success_rate !== null && aiAnalysis.models_success_rate !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AI Models Success Rate</span>
                        <span className="font-medium">{safePercentage(aiAnalysis.models_success_rate, 0)}%</span>
                      </div>
                      <Progress value={(aiAnalysis.models_success_rate || 0) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Content Distribution */}
            {aiAnalysis.content_distribution && Object.keys(aiAnalysis.content_distribution).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Content Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(aiAnalysis.content_distribution)
                    .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                    .map(([category, percentage]: [string, any]) => (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{category}</span>
                          <span className="font-medium">{safeToFixed(percentage, 1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Language Distribution */}
            {aiAnalysis.language_distribution && Object.keys(aiAnalysis.language_distribution).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Language Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(aiAnalysis.language_distribution).map(([lang, percentage]: [string, any]) => (
                    <div key={lang}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="uppercase">{lang}</span>
                        <span className="font-medium">{safeToFixed(percentage, 1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Engagement Behavioral Patterns */}
            {engagement.behavioral_patterns && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Behavioral Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {engagement.behavioral_patterns.current_stage && (
                    <div className="flex justify-between">
                      <span className="text-sm">Current Stage</span>
                      <Badge variant="secondary" className="capitalize">{engagement.behavioral_patterns.current_stage}</Badge>
                    </div>
                  )}
                  {engagement.behavioral_patterns.posting_consistency && (
                    <div className="flex justify-between text-sm">
                      <span>Posting Consistency</span>
                      <span className="font-medium capitalize">{engagement.behavioral_patterns.posting_consistency}</span>
                    </div>
                  )}
                  {engagement.behavioral_patterns.content_strategy_maturity && (
                    <div className="flex justify-between text-sm">
                      <span>Strategy Maturity</span>
                      <span className="font-medium capitalize">{engagement.behavioral_patterns.content_strategy_maturity}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Analysis */}
            {content.visual_analysis && Object.keys(content.visual_analysis).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Visual Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {content.visual_analysis.aesthetic_score !== null && content.visual_analysis.aesthetic_score !== undefined && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{safeToFixed(content.visual_analysis.aesthetic_score, 1)}%</div>
                        <div className="text-sm text-muted-foreground">Aesthetic Score</div>
                      </div>
                    )}
                    {content.visual_analysis.professional_quality_score !== null && content.visual_analysis.professional_quality_score !== undefined && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{safeToFixed(content.visual_analysis.professional_quality_score, 1)}%</div>
                        <div className="text-sm text-muted-foreground">Professional Quality</div>
                      </div>
                    )}
                  </div>

                  {content.visual_analysis.image_quality_metrics && (
                    <div>
                      <h4 className="font-medium mb-2">Image Quality Metrics</h4>
                      {content.visual_analysis.image_quality_metrics.average_quality !== null && content.visual_analysis.image_quality_metrics.average_quality !== undefined && (
                        <div className="space-y-1 mb-2">
                          <div className="flex justify-between text-sm">
                            <span>Average Quality</span>
                            <span className="font-medium">{safeToFixed(content.visual_analysis.image_quality_metrics.average_quality, 1)}%</span>
                          </div>
                          <Progress value={content.visual_analysis.image_quality_metrics.average_quality} className="h-1" />
                        </div>
                      )}
                      {content.visual_analysis.image_quality_metrics.quality_consistency !== null && content.visual_analysis.image_quality_metrics.quality_consistency !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Quality Consistency</span>
                            <span className="font-medium">{safePercentage(content.visual_analysis.image_quality_metrics.quality_consistency, 1)}%</span>
                          </div>
                          <Progress value={(content.visual_analysis.image_quality_metrics.quality_consistency || 0) * 100} className="h-1" />
                        </div>
                      )}
                    </div>
                  )}

                  {content.visual_analysis.face_analysis && (
                    <div>
                      <h4 className="font-medium mb-2">Face Analysis</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 bg-muted/30 rounded">
                          <div className="text-lg font-bold">{content.visual_analysis.face_analysis.faces_detected || 0}</div>
                          <div className="text-xs text-muted-foreground">Faces Detected</div>
                        </div>
                        <div className="text-center p-2 bg-muted/30 rounded">
                          <div className="text-lg font-bold">{content.visual_analysis.face_analysis.unique_faces || 0}</div>
                          <div className="text-xs text-muted-foreground">Unique Faces</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* NLP Insights */}
            {content.nlp_insights && Object.keys(content.nlp_insights).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    NLP Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {content.nlp_insights.vocabulary_richness !== null && content.nlp_insights.vocabulary_richness !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Vocabulary Richness</span>
                        <span className="font-medium">{safePercentage(content.nlp_insights.vocabulary_richness, 1)}%</span>
                      </div>
                      <Progress value={(content.nlp_insights.vocabulary_richness || 0) * 100} className="h-2" />
                    </div>
                  )}

                  {content.nlp_insights.text_complexity_score !== null && content.nlp_insights.text_complexity_score !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Text Complexity</span>
                        <span className="font-medium">{safeToFixed(content.nlp_insights.text_complexity_score, 1)}%</span>
                      </div>
                      <Progress value={content.nlp_insights.text_complexity_score} className="h-2" />
                    </div>
                  )}

                  {content.nlp_insights.readability_scores && (
                    <div>
                      <h4 className="font-medium mb-2">Readability Scores</h4>
                      {Object.entries(content.nlp_insights.readability_scores).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{safeToFixed(value, 1)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {content.nlp_insights.main_themes && content.nlp_insights.main_themes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Main Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {content.nlp_insights.main_themes.map((theme: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="capitalize">{theme}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {content.nlp_insights.top_keywords && content.nlp_insights.top_keywords.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Top Keywords</h4>
                      <div className="flex flex-wrap gap-1">
                        {content.nlp_insights.top_keywords.slice(0, 10).map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demographics */}
            {audience.demographics && Object.keys(audience.demographics).length > 0 && (
              <>
                {audience.demographics.age_groups && Object.keys(audience.demographics.age_groups).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Age Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(audience.demographics.age_groups)
                        .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                        .map(([age, percentage]: [string, any]) => (
                          <div key={age}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{age}</span>
                              <span className="font-medium">{safeToFixed(percentage, 1)}%</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}

                {audience.demographics.gender_split && Object.keys(audience.demographics.gender_split).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Gender Split
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(audience.demographics.gender_split)
                        .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                        .map(([gender, percentage]: [string, any]) => (
                          <div key={gender}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{gender}</span>
                              <span className="font-medium">{safeToFixed(percentage, 1)}%</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}

                {audience.demographics.countries && Object.keys(audience.demographics.countries).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Geographic Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(audience.demographics.countries)
                        .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                        .map(([country, percentage]: [string, any]) => (
                          <div key={country}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{country}</span>
                              <span className="font-medium">{safeToFixed(percentage, 1)}%</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Audience Quality */}
            {audience.quality && Object.keys(audience.quality).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Audience Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {audience.quality.authenticity_score !== null && audience.quality.authenticity_score !== undefined && (
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{safeToFixed(audience.quality.authenticity_score, 1)}%</div>
                        <div className="text-sm text-green-700">Authenticity</div>
                      </div>
                    )}
                    {audience.quality.bot_detection_score !== null && audience.quality.bot_detection_score !== undefined && (
                      <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">{safeToFixed(audience.quality.bot_detection_score, 1)}%</div>
                        <div className="text-sm text-yellow-700">Bot Detection</div>
                      </div>
                    )}
                  </div>

                  {audience.quality.fake_follower_percentage !== null && audience.quality.fake_follower_percentage !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Fake Followers</span>
                        <span className="font-medium text-red-600">{safeToFixed(audience.quality.fake_follower_percentage, 1)}%</span>
                      </div>
                      <Progress value={audience.quality.fake_follower_percentage} className="h-2 bg-red-100" />
                    </div>
                  )}

                  {audience.quality.engagement_authenticity !== null && audience.quality.engagement_authenticity !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>Engagement Authenticity</span>
                      <span className="font-medium">{safeToFixed(audience.quality.engagement_authenticity, 1)}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Authenticity Tab */}
        <TabsContent value="authenticity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fraud Detection */}
            {security.fraud_detection && Object.keys(security.fraud_detection).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Fraud Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {security.fraud_detection.overall_fraud_score !== null && security.fraud_detection.overall_fraud_score !== undefined && (
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-3xl font-bold text-red-600">{security.fraud_detection.overall_fraud_score}</div>
                        <div className="text-sm text-red-700">Fraud Score</div>
                      </div>
                    )}
                    {security.fraud_detection.trust_score !== null && security.fraud_detection.trust_score !== undefined && (
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-3xl font-bold text-green-600">{security.fraud_detection.trust_score}</div>
                        <div className="text-sm text-green-700">Trust Score</div>
                      </div>
                    )}
                  </div>

                  {security.fraud_detection.risk_level && (
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Level</span>
                      <Badge
                        variant={security.fraud_detection.risk_level === 'low' ? 'secondary' : 'destructive'}
                        className="capitalize"
                      >
                        {security.fraud_detection.risk_level}
                      </Badge>
                    </div>
                  )}

                  {security.fraud_detection.authenticity_score !== null && security.fraud_detection.authenticity_score !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Authenticity Score</span>
                        <span className="font-medium">{security.fraud_detection.authenticity_score}%</span>
                      </div>
                      <Progress value={security.fraud_detection.authenticity_score} className="h-2" />
                    </div>
                  )}

                  {security.fraud_detection.bot_likelihood_percentage !== null && security.fraud_detection.bot_likelihood_percentage !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Bot Likelihood</span>
                        <span className="font-medium text-red-600">{security.fraud_detection.bot_likelihood_percentage}%</span>
                      </div>
                      <Progress value={security.fraud_detection.bot_likelihood_percentage} className="h-2 bg-red-100" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Geographic Insights */}
            {audience.geographic_insights && Object.keys(audience.geographic_insights).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Geographic Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {audience.geographic_insights.primary_regions && audience.geographic_insights.primary_regions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Primary Regions</h4>
                      <div className="flex flex-wrap gap-2">
                        {audience.geographic_insights.primary_regions.map((region: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{region}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {audience.geographic_insights.international_reach !== null && audience.geographic_insights.international_reach !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm">International Reach</span>
                      <Badge variant={audience.geographic_insights.international_reach ? 'secondary' : 'outline'}>
                        {audience.geographic_insights.international_reach ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}

                  {audience.geographic_insights.geographic_diversity_score !== null && audience.geographic_insights.geographic_diversity_score !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Geographic Diversity</span>
                        <span className="font-medium">{safePercentage(audience.geographic_insights.geographic_diversity_score, 1)}%</span>
                      </div>
                      <Progress value={(audience.geographic_insights.geographic_diversity_score || 0) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Enhanced Cultural Analysis - Full Width Prominent Display */}
          {audience.cultural_analysis && Object.keys(audience.cultural_analysis).length > 0 && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  Cultural Analysis & Insights
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Deep cultural context and behavioral patterns of the creator's audience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {audience.cultural_analysis.social_context && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-6 border border-primary/20">
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Globe className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Social Context</p>
                          <p className="text-xl font-bold capitalize mt-1">{audience.cultural_analysis.social_context}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {audience.cultural_analysis.language_indicators && Object.keys(audience.cultural_analysis.language_indicators).length > 0 && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-6 border border-primary/20 md:col-span-2">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <h4 className="text-lg font-bold">Language Indicators</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(audience.cultural_analysis.language_indicators).map(([lang, count]: [string, any]) => (
                            <div key={lang} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                              <span className="font-medium capitalize">{lang}</span>
                              <Badge variant="outline" className="font-bold">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Cultural Metrics if available */}
                  {audience.cultural_analysis.cultural_affinity && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-6 border border-primary/20">
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Heart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Cultural Affinity</p>
                          <p className="text-xl font-bold capitalize mt-1">{audience.cultural_analysis.cultural_affinity}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {audience.cultural_analysis.regional_influence && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-6 border border-primary/20">
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Regional Influence</p>
                          <p className="text-xl font-bold capitalize mt-1">{audience.cultural_analysis.regional_influence}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Cultural Insights if available */}
                {audience.cultural_analysis.behavioral_patterns && (
                  <div className="mt-6 p-6 bg-white/30 dark:bg-black/10 rounded-lg border border-primary/10">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Behavioral Patterns
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      {typeof audience.cultural_analysis.behavioral_patterns === 'string'
                        ? audience.cultural_analysis.behavioral_patterns
                        : JSON.stringify(audience.cultural_analysis.behavioral_patterns)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fallback message if no cultural analysis available */}
          {(!audience.cultural_analysis || Object.keys(audience.cultural_analysis).length === 0) && (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="py-12 text-center">
                <Brain className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">Cultural Analysis In Progress</h3>
                <p className="text-muted-foreground">AI cultural insights will appear here once analysis is complete.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Recent Posts ({posts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {posts.map((post: any, idx: number) => (
                    <Card key={post.id || idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {(post.cdn_thumbnail_url || post.display_url) && (
                        <div className="aspect-square bg-muted relative overflow-hidden">
                          <img
                            src={post.cdn_thumbnail_url || post.display_url}
                            alt={post.caption?.slice(0, 50) || 'Post'}
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-3">
                        {post.caption && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{post.caption}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs mb-2">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            {(post.likes_count || post.like_count || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3 text-blue-500" />
                            {(post.comments_count || post.comment_count || 0).toLocaleString()}
                          </span>
                        </div>
                        {post.engagement_rate !== null && post.engagement_rate !== undefined && (
                          <div className="text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3 text-primary" />
                              {safeToFixed(post.engagement_rate, 2)}%
                            </span>
                          </div>
                        )}
                        {post.ai_analysis && (
                          <div className="flex flex-wrap gap-1">
                            {post.ai_analysis.content_category && (
                              <Badge variant="secondary" className="text-xs capitalize">{post.ai_analysis.content_category}</Badge>
                            )}
                            {post.ai_analysis.sentiment && (
                              <Badge variant="outline" className="text-xs capitalize">{post.ai_analysis.sentiment}</Badge>
                            )}
                            {post.ai_analysis.language_code && (
                              <Badge variant="outline" className="text-xs uppercase">{post.ai_analysis.language_code}</Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No posts available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { ComprehensiveCreatorAnalyticsComponent as ComprehensiveCreatorAnalytics }
