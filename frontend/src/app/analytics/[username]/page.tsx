"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiService } from "@/services/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompleteProfileResponse } from "@/types"
import { 
  IconSearch, 
  IconTrendingUp, 
  IconTrendingDown, 
  IconCalendar,
  IconTarget,
  IconUsers,
  IconHeart,
  IconMessage,
  IconShare,
  IconBookmark,
  IconEye
} from "@tabler/icons-react"

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default function AnalyticsPage({ params }: { params: { username: string } }) {
  const [profileData, setProfileData] = useState<CompleteProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const username = params.username

  const analyzeProfile = async (targetUsername: string) => {
    if (!targetUsername.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Use real backend API service instead of mock
      const result = await apiService.fetchProfileWithFallback(targetUsername)
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }
      
      setProfileData(result.data)
    } catch (error) {
      console.error('Profile analysis error:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze profile')
    } finally {
      setLoading(false)
    }
  }

  // Auto-load analytics when component mounts
  useEffect(() => {
    if (username) {
      analyzeProfile(username)
    }
  }, [username])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Creator Analytics</h1>
                <p className="text-muted-foreground">
                  Detailed analytics for @{username}
                </p>
              </div>
              <Button variant="outline" onClick={() => router.back()}>
                ← Back to Creators
              </Button>
            </div>

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Analyzing @{username}</h3>
                  <p className="text-muted-foreground text-center">
                    Getting comprehensive analytics data...
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-red-500 mb-4">
                    <IconSearch className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
                  <p className="text-muted-foreground text-center mb-4">{error}</p>
                  <Button onClick={() => analyzeProfile(username)}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {profileData && (
              <div className="space-y-6">
                
                {/* Profile Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      {profileData.profile.profile_pic_url && (
                        <img 
                          src={profileData.profile.profile_pic_url} 
                          alt={profileData.profile.full_name}
                          className="w-20 h-20 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/default-avatar.png'
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-2xl font-bold">{profileData.profile.full_name}</h2>
                          {profileData.profile.is_verified && (
                            <Badge variant="secondary">✓ Verified</Badge>
                          )}
                          {profileData.profile.is_private && (
                            <Badge variant="outline">🔒 Private</Badge>
                          )}
                        </div>
                        <p className="text-lg text-muted-foreground mb-2">@{profileData.profile.username}</p>
                        <p className="text-sm mb-4">{profileData.profile.biography}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{formatNumber(profileData.profile.followers)}</div>
                            <div className="text-sm text-muted-foreground">Followers</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{formatNumber(profileData.profile.following)}</div>
                            <div className="text-sm text-muted-foreground">Following</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{formatNumber(profileData.profile.posts_count)}</div>
                            <div className="text-sm text-muted-foreground">Posts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{profileData.profile.engagement_rate.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">Engagement</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analytics Tabs */}
                <Tabs defaultValue="engagement" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="audience">Audience</TabsTrigger>
                    <TabsTrigger value="content">Content Strategy</TabsTrigger>
                    <TabsTrigger value="growth">Growth Analysis</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="engagement" className="space-y-6">
                    {/* Engagement Metrics */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Like Rate</CardTitle>
                          <IconHeart className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{profileData.engagement_metrics.like_rate.toFixed(2)}%</div>
                          <Progress value={profileData.engagement_metrics.like_rate * 20} className="mt-2" />
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Comment Rate</CardTitle>
                          <IconMessage className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{profileData.engagement_metrics.comment_rate.toFixed(2)}%</div>
                          <Progress value={profileData.engagement_metrics.comment_rate * 50} className="mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Save Rate</CardTitle>
                          <IconBookmark className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{profileData.engagement_metrics.save_rate.toFixed(2)}%</div>
                          <Progress value={profileData.engagement_metrics.save_rate * 100} className="mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Share Rate</CardTitle>
                          <IconShare className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{profileData.engagement_metrics.share_rate.toFixed(2)}%</div>
                          <Progress value={profileData.engagement_metrics.share_rate * 100} className="mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Reach Rate</CardTitle>
                          <IconEye className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{profileData.engagement_metrics.reach_rate.toFixed(1)}%</div>
                          <Progress value={Math.min(profileData.engagement_metrics.reach_rate * 10, 100)} className="mt-2" />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Performance Scores */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Content Quality Score</CardTitle>
                          <CardDescription>Based on engagement patterns and content analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold mb-2">
                            {profileData.profile.content_quality_score.toFixed(1)}/10
                          </div>
                          <Progress value={profileData.profile.content_quality_score * 10} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {profileData.profile.content_quality_score > 7 ? "Excellent content quality" : 
                             profileData.profile.content_quality_score > 5 ? "Good content quality" : 
                             "Room for improvement"}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Influence Score</CardTitle>
                          <CardDescription>Overall influence and reach potential</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold mb-2">
                            {profileData.profile.influence_score.toFixed(1)}/10
                          </div>
                          <Progress value={profileData.profile.influence_score * 10} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {profileData.profile.influence_score > 7 ? "High influence potential" : 
                             profileData.profile.influence_score > 5 ? "Moderate influence" : 
                             "Building influence"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="audience" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Demographics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Primary Age Group</span>
                              <span className="text-sm font-medium">{profileData.audience_insights.primary_age_group}</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Female</span>
                              <span className="text-sm font-medium">{profileData.audience_insights.gender_split.female}%</span>
                            </div>
                            <Progress value={profileData.audience_insights.gender_split.female} className="mb-2" />
                            
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Male</span>
                              <span className="text-sm font-medium">{profileData.audience_insights.gender_split.male}%</span>
                            </div>
                            <Progress value={profileData.audience_insights.gender_split.male} className="mb-4" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Top Locations & Interests</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Top Locations</h4>
                            <div className="space-y-1">
                              {profileData.audience_insights.top_locations.map((location, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span className="text-sm">{location}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Interests</h4>
                            <div className="flex flex-wrap gap-1">
                              {profileData.audience_insights.interests.map((interest, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Times</CardTitle>
                        <CardDescription>When your audience is most active</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {profileData.audience_insights.activity_times.map((time, index) => (
                            <Badge key={index} variant="secondary" className="justify-center p-2">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Content Mix Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Photos</span>
                              <span className="text-sm font-medium">{profileData.content_strategy.content_mix.photos}%</span>
                            </div>
                            <Progress value={profileData.content_strategy.content_mix.photos} className="mb-3" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Videos</span>
                              <span className="text-sm font-medium">{profileData.content_strategy.content_mix.videos}%</span>
                            </div>
                            <Progress value={profileData.content_strategy.content_mix.videos} className="mb-3" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Carousels</span>
                              <span className="text-sm font-medium">{profileData.content_strategy.content_mix.carousels}%</span>
                            </div>
                            <Progress value={profileData.content_strategy.content_mix.carousels} className="mb-3" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Reels</span>
                              <span className="text-sm font-medium">{profileData.content_strategy.content_mix.reels}%</span>
                            </div>
                            <Progress value={profileData.content_strategy.content_mix.reels} className="mb-3" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Content Pillars</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {profileData.content_strategy.primary_content_pillars.map((pillar, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm">{pillar}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Best Posting Times</CardTitle>
                        <CardDescription>Optimal times to post for maximum engagement</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {profileData.best_posting_times.map((time, index) => (
                            <Badge key={index} variant="outline" className="justify-center p-2">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="growth" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Growth Recommendations</CardTitle>
                          <CardDescription>AI-powered suggestions for account growth</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {profileData.growth_recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                <p className="text-sm">{recommendation}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Competitor Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Market Position</span>
                              <Badge variant="outline">{profileData.competitor_analysis.market_position}</Badge>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Competitive Score</span>
                              <span className="text-sm font-medium">{profileData.competitor_analysis.competitive_score.toFixed(1)}/10</span>
                            </div>
                            <Progress value={profileData.competitor_analysis.competitive_score * 10} />
                          </div>

                          {profileData.competitor_analysis.growth_opportunities.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Growth Opportunities</h4>
                              <div className="space-y-1">
                                {profileData.competitor_analysis.growth_opportunities.map((opportunity, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-sm">{opportunity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Engagement Tactics</CardTitle>
                        <CardDescription>Proven strategies to boost engagement</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 md:grid-cols-2">
                          {profileData.content_strategy.engagement_tactics.map((tactic, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                              <IconTarget className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{tactic}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}