'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  BarChart3,
  Users,
  Heart,
  MessageCircle,
  Globe,
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  Shield,
  Eye,
  Camera,
  Palette,
  FileText,
  Bot,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Map,
  Languages,
  Calendar,
  Clock,
  Hash,
  AtSign,
  Link,
  Verified,
  Activity,
  Brain,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { getOptimizedProfilePicture } from '@/utils/cdnUtils'
import {
  Pie, PieChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Area, AreaChart,
  Label, PolarAngleAxis, Radar, RadarChart
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import ReactCountryFlag from "react-country-flag"
import { getCountryCode } from "@/lib/countryUtils"

// Backend data interface matching the 5-section structure
interface BackendCreatorData {
  overview: {
    profile: {
      username: string
      full_name: string
      biography: string
      profile_picture_url: string
      // CDN fields for optimized profile pictures
      cdn_avatar_url?: string | null
      profile_pic_url_hd?: string | null
      cdn_url_512?: string | null
      cdn_urls?: {
        avatar_256?: string
        avatar_512?: string
      } | null
      followers_count: number
      following_count: number
      posts_count: number
      is_verified: boolean
      is_private: boolean
      external_url?: string
      created_at: string
      detected_country?: string | null
    }
    engagement_metrics: {
      avg_likes: number
      avg_comments: number
      engagement_rate: number
      best_performing_post_likes: number
      total_engagement: number
    }
    ai_classification: {
      ai_primary_content_type: string
      ai_content_distribution: Record<string, number>
      ai_content_quality_score: number
      ai_avg_sentiment_score: number
    }
  }
  audience: {
    demographics: {
      estimated_age_groups: Record<string, number>
      estimated_gender_split: Record<string, number>
      demographic_confidence: number
    }
    geographic_distribution: {
      primary_regions: string[]
      country_distribution: Record<string, number>
      geographic_diversity_score: number
      international_reach: boolean
    }
    language_analysis: {
      ai_language_distribution: Record<string, number>
      language_indicators: Record<string, number>
    }
    authenticity_analysis: {
      authenticity_score: number
      bot_detection_score: number
      fake_follower_percentage: number
      fraud_assessment: {
        risk_level: string
        authenticity_score: number
        overall_fraud_score: number
        bot_likelihood_percentage: number
      }
      red_flags: string[]
    }
  }
  engagement: {
    behavioral_patterns: {
      posting_frequency: number
      avg_engagement_rate: number
      engagement_consistency_score: number
      high_engagement_posts_percentage: number
      posting_consistency: number
    }
    sentiment_analysis: {
      overall_sentiment_distribution: Record<string, number>
      ai_avg_sentiment_score: number
      sentiment_trends: string
    }
    engagement_quality: {
      avg_like_rate: number
      avg_comment_rate: number
      avg_likes_comments_ratio: number
      engagement_authenticity: number
      suspicious_engagement_posts: number
    }
    optimization_insights: {
      engagement_triggers: string[]
      optimal_post_structure: string
      top_performing_elements: string[]
      optimization_recommendations: string[]
    }
  }
  content: {
    visual_analysis: {
      aesthetic_score: number
      dominant_colors: string[]
      image_quality_metrics: {
        average_quality: number
        quality_consistency: number
        average_resolution: [number, number]
      }
      professional_quality_score: number
      faces_detected: number
      brand_logo_detected: string[]
    }
    content_themes: {
      topic_modeling: {
        main_themes: string[]
        top_keywords: Array<{
          keyword: string
          frequency: number
          score: number
        }>
        semantic_clusters: Array<{
          cluster_id: number
          theme: string
          size: number
          sample_texts: string[]
        }>
      }
      brand_analysis: {
        unique_brands: number
        total_brand_mentions: number
        brand_partnership_indicators: string[]
        sponsored_content_likelihood: number
        brand_mentions: Array<{
          mention: string
          type: string
          frequency: number
        }>
        brand_affinities: Record<string, number>
      }
    }
    content_strategy: {
      posting_style: {
        primary_style: string
        avg_post_length: number
        interactivity_score: number
      }
      content_depth_score: number
      content_strategy_maturity: number
      viral_potential: {
        overall_viral_score: number
        note: string
      }
    }
    nlp_insights: {
      text_analysis: {
        unique_words: number
        total_word_count: number
        average_word_count: number
        vocabulary_richness: number
        text_complexity_score: number
      }
      readability_scores: {
        flesch_ease: number
        flesch_kincaid_grade: number
        automated_readability_index: number
      }
      entity_extraction: {
        entities: {
          PERSON: Array<{ text: string; confidence: number }>
          ORG: Array<{ text: string; confidence: number }>
          GPE: Array<{ text: string; confidence: number }>
        }
        hashtags: number
        mentions: number
        urls: number
        emojis: number
      }
    }
  }
  posts: {
    recent_posts: Array<{
      post_data: {
        instagram_post_id: string
        caption: string
        likes_count: number
        comments_count: number
        created_at: string
        post_url: string
        media_type: string
        thumbnail_url: string
      }
      ai_analysis: {
        basic_analysis: {
          ai_content_category: string
          ai_category_confidence: number
          ai_sentiment: string
          ai_sentiment_score: number
          ai_sentiment_confidence: number
          ai_language_code: string
          ai_language_confidence: number
        }
        advanced_analysis: {
          category: {
            category: string
            confidence: number
          }
          sentiment: {
            sentiment: string
            score: number
            confidence: number
          }
          language: {
            language: string
            confidence: number
          }
          visual_content: {
            aesthetic_score: number
            dominant_colors: string[]
            face_analysis: {
              faces_detected: number
              emotions: string[]
              celebrities: string[]
            }
            content_recognition: {
              objects_detected: Array<{
                object: string
                confidence: number
              }>
            }
          }
          engagement_prediction: {
            score: number
            prediction: string
            factors: {
              optimal_length: boolean
              consistent_posting: boolean
              good_hashtag_usage: boolean
              interactive_content: boolean
            }
          }
        }
      }
    }>
    posts_summary: {
      total_posts_analyzed: number
      ai_completion_rate: number
      average_engagement: number
      top_performing_post: {
        instagram_post_id: string
        likes: number
        engagement_rate: number
      }
    }
  }
}

interface ComprehensiveCreatorDashboardProps {
  username: string
}

export function ComprehensiveCreatorDashboard({ username }: ComprehensiveCreatorDashboardProps) {
  const [data, setData] = useState<BackendCreatorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Helper function to render country badge
  const renderCountryBadge = (detectedCountry?: string | null) => {
    if (!detectedCountry) {
      // Show Global badge with world flag when country is NULL
      return (
        <Badge variant="outline" className="capitalize">
          <Globe className="h-3 w-3 mr-1" />
          Global
        </Badge>
      )
    }

    // Show country flag and name
    const countryCode = getCountryCode(detectedCountry)
    return (
      <Badge variant="outline" className="capitalize">
        <ReactCountryFlag
          countryCode={countryCode}
          svg
          style={{
            width: '12px',
            height: '9px',
            marginRight: '4px',
            borderRadius: '2px'
          }}
          title={detectedCountry}
        />
        {detectedCountry}
      </Badge>
    )
  }

  // Fetch real data from API using the comprehensive analytics service
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Import the API service
        const { comprehensiveAnalyticsApi } = await import('@/services/comprehensiveAnalyticsApi')

        // Get the real data from the backend endpoint
        const response = await comprehensiveAnalyticsApi.getCompleteDashboardData(username)


        // Transform the existing API response to match our comprehensive structure
        if (response && response.profile) {
          // Map the existing API response to our comprehensive structure
          const transformedData: BackendCreatorData = {
            overview: {
              profile: {
                username: response.profile.username || username,
                full_name: response.profile.full_name || "Creator",
                biography: response.profile.biography || "",
                profile_picture_url: response.profile.profile_pic_url || "",
                // CDN fields for optimized profile pictures
                cdn_avatar_url: response.profile.cdn_avatar_url || null,
                profile_pic_url_hd: response.profile.profile_pic_url_hd || null,
                cdn_url_512: response.profile.cdn_url_512 || null,
                cdn_urls: response.profile.cdn_urls || null,
                followers_count: response.profile.followers_count || 0,
                following_count: response.profile.following_count || 0,
                posts_count: response.profile.posts_count || 0,
                is_verified: response.profile.is_verified || false,
                is_private: response.profile.is_private || false,
                external_url: response.profile.external_url || "",
                created_at: new Date().toISOString(),
                detected_country: response.profile.detected_country || null
              },
              engagement_metrics: {
                avg_likes: response.analytics_summary?.avg_likes || 0,
                avg_comments: response.analytics_summary?.avg_comments || 0,
                engagement_rate: response.profile.engagement_rate || 0,
                best_performing_post_likes: Math.max(...(response.posts || []).map(p => p.likes_count || 0), 0),
                total_engagement: response.analytics_summary?.total_engagement || 0
              },
              ai_classification: {
                ai_primary_content_type: response.profile.ai_analysis?.primary_content_type || "general",
                ai_content_distribution: response.profile.ai_analysis?.content_distribution || {},
                ai_content_quality_score: response.profile.ai_analysis?.content_quality_score || 0,
                ai_avg_sentiment_score: response.profile.ai_analysis?.avg_sentiment_score || 0
              }
            },
            audience: {
              demographics: {
                estimated_age_groups: response.profile.ai_analysis?.audience_insights?.age_distribution || {
                  "18-24": 0.25, "25-34": 0.4, "35-44": 0.2, "45-54": 0.1, "55+": 0.05
                },
                estimated_gender_split: response.profile.ai_analysis?.audience_insights?.gender_breakdown || {
                  "female": 0.6, "male": 0.35, "other": 0.05
                },
                demographic_confidence: 0.75
              },
              geographic_distribution: {
                primary_regions: ["North America", "Europe", "Asia", "Other"],
                country_distribution: response.profile.ai_analysis?.audience_insights?.geographic_distribution || {
                  "United States": 40, "Canada": 15, "United Kingdom": 12, "Other": 33
                },
                geographic_diversity_score: 1,
                international_reach: true
              },
              language_analysis: {
                ai_language_distribution: response.profile.ai_analysis?.language_distribution,
                language_indicators: response.profile.ai_analysis?.language_indicators
              },
              authenticity_analysis: {
                authenticity_score: response.profile.ai_analysis?.audience_quality_assessment?.authenticity_score,
                bot_detection_score: response.profile.ai_analysis?.audience_quality_assessment?.bot_detection_score,
                fake_follower_percentage: response.profile.ai_analysis?.fraud_detection_analysis?.fake_follower_percentage,
                fraud_assessment: {
                  risk_level: response.profile.ai_analysis?.comprehensive_insights?.fraud_risk_level,
                  authenticity_score: response.profile.ai_analysis?.comprehensive_insights?.overall_authenticity_score,
                  overall_fraud_score: response.profile.ai_analysis?.comprehensive_insights?.overall_fraud_score,
                  bot_likelihood_percentage: response.profile.ai_analysis?.comprehensive_insights?.bot_likelihood_percentage
                },
                red_flags: response.profile.ai_analysis?.red_flags || []
              }
            },
            engagement: {
              behavioral_patterns: {
                posting_frequency: response.profile.ai_analysis?.behavioral_patterns?.posting_frequency,
                avg_engagement_rate: response.profile.engagement_rate,
                engagement_consistency_score: response.profile.ai_analysis?.behavioral_patterns?.engagement_consistency_score,
                high_engagement_posts_percentage: response.profile.ai_analysis?.behavioral_patterns?.high_engagement_posts_percentage,
                posting_consistency: response.profile.ai_analysis?.behavioral_patterns?.posting_consistency
              },
              sentiment_analysis: {
                overall_sentiment_distribution: response.profile.ai_analysis?.overall_sentiment_distribution,
                ai_avg_sentiment_score: response.profile.ai_analysis?.avg_sentiment_score,
                sentiment_trends: response.profile.ai_analysis?.sentiment_trends
              },
              engagement_quality: {
                avg_like_rate: response.profile.ai_analysis?.engagement_quality?.avg_like_rate,
                avg_comment_rate: response.profile.ai_analysis?.engagement_quality?.avg_comment_rate,
                avg_likes_comments_ratio: response.profile.ai_analysis?.engagement_quality?.avg_likes_comments_ratio,
                engagement_authenticity: response.profile.ai_analysis?.engagement_quality?.engagement_authenticity,
                suspicious_engagement_posts: response.profile.ai_analysis?.engagement_quality?.suspicious_engagement_posts
              },
              optimization_insights: {
                engagement_triggers: response.profile.ai_analysis?.optimization_insights?.engagement_triggers,
                optimal_post_structure: response.profile.ai_analysis?.optimization_insights?.optimal_post_structure,
                top_performing_elements: response.profile.ai_analysis?.optimization_insights?.top_performing_elements,
                optimization_recommendations: response.profile.ai_analysis?.optimization_insights?.optimization_recommendations
              }
            },
            content: {
              visual_analysis: {
                aesthetic_score: response.profile.ai_analysis?.visual_content_analysis?.aesthetic_score,
                dominant_colors: response.profile.ai_analysis?.visual_content_analysis?.dominant_colors,
                image_quality_metrics: {
                  average_quality: response.profile.ai_analysis?.visual_content_analysis?.image_quality_metrics?.average_quality,
                  quality_consistency: response.profile.ai_analysis?.visual_content_analysis?.image_quality_metrics?.quality_consistency,
                  average_resolution: response.profile.ai_analysis?.visual_content_analysis?.image_quality_metrics?.average_resolution
                },
                professional_quality_score: response.profile.ai_analysis?.visual_content_analysis?.professional_quality_score,
                faces_detected: response.profile.ai_analysis?.visual_content_analysis?.faces_detected,
                brand_logo_detected: (() => {
                  // Extract brand names from the brand mentions data
                  const brandLogos = new Set()

                  ;(response.posts || []).forEach(post => {
                    const rawAnalysis = post.ai_analysis_raw || {}
                    const brandMentions = rawAnalysis.advanced_models?.advanced_nlp?.entity_extraction?.brand_mentions || []

                    brandMentions.forEach(mention => {
                      if (mention.type === 'brand_name') {
                        brandLogos.add(mention.mention)
                      }
                    })
                  })

                  return Array.from(brandLogos)
                })()
              },
              content_themes: {
                topic_modeling: {
                  main_themes: [response.profile.ai_analysis?.primary_content_type || "lifestyle"],
                  top_keywords: Object.entries(response.profile.ai_analysis?.content_distribution || {}).map(([key, value]) => ({
                    keyword: key, frequency: Math.round((value as number) * 100), score: value as number
                  })).slice(0, 5),
                  semantic_clusters: [{
                    cluster_id: 0,
                    theme: response.profile.ai_analysis?.primary_content_type || "general",
                    size: Object.keys(response.profile.ai_analysis?.content_distribution || {}).length,
                    sample_texts: Object.keys(response.profile.ai_analysis?.content_distribution || {}).slice(0, 2)
                  }]
                },
                brand_analysis: (() => {
                  // Extract brand data from posts using correct AI analysis paths
                  const allPosts = response.posts || []


                  let allBrandMentions = []
                  let brandAffinities = {}
                  let partnershipIndicators = []

                  // Extract from each post's AI analysis using the updated backend structure
                  allPosts.forEach(post => {
                    const analysis = post.ai_analysis || {}
                    const rawAnalysis = post.ai_analysis_raw || {}

                    // Get brand mentions from entity extraction (try both paths)
                    const brandMentions = analysis.entity_extraction?.brand_mentions ||
                                         rawAnalysis.advanced_models?.advanced_nlp?.entity_extraction?.brand_mentions || []
                    allBrandMentions.push(...brandMentions)

                    // Get brand affinities from audience insights
                    const affinities = rawAnalysis.advanced_models?.audience_insights?.audience_interests?.brand_affinities || {}
                    Object.assign(brandAffinities, affinities)

                    // Get partnership indicators
                    const indicators = rawAnalysis.advanced_models?.advanced_nlp?.brand_analysis?.brand_partnership_indicators || []
                    partnershipIndicators.push(...indicators)

                    // Also check for visual brand detection
                    const visualBrands = analysis.visual_analysis?.brand_logo_detected || []
                    if (visualBrands.length > 0) {
                      visualBrands.forEach(brand => {
                        allBrandMentions.push({
                          mention: brand,
                          type: 'visual_logo',
                          frequency: 1
                        })
                      })
                    }
                  })

                  // Calculate metrics
                  const uniqueBrands = new Set((allBrandMentions || []).map(b => b.mention)).size
                  const totalMentions = allBrandMentions.reduce((sum, b) => sum + (b.frequency || 1), 0)
                  const sponsoredLikelihood = partnershipIndicators.includes('ad') ? 0.8 :
                                             partnershipIndicators.length > 0 ? 0.5 : 0.2


                  return {
                    unique_brands: uniqueBrands,
                    total_brand_mentions: totalMentions,
                    brand_partnership_indicators: [...new Set(partnershipIndicators)],
                    sponsored_content_likelihood: sponsoredLikelihood,
                    brand_mentions: allBrandMentions,
                    brand_affinities: brandAffinities
                  }
                })()
              },
              content_strategy: {
                posting_style: {
                  primary_style: response.profile.ai_analysis?.content_strategy?.posting_style?.primary_style,
                  avg_post_length: response.profile.ai_analysis?.content_strategy?.posting_style?.avg_post_length,
                  interactivity_score: response.profile.ai_analysis?.content_strategy?.posting_style?.interactivity_score
                },
                content_depth_score: response.profile.ai_analysis?.content_strategy?.content_depth_score,
                content_strategy_maturity: response.profile.ai_analysis?.content_strategy?.content_strategy_maturity,
                viral_potential: {
                  overall_viral_score: response.profile.ai_analysis?.content_strategy?.viral_potential?.overall_viral_score,
                  note: response.profile.ai_analysis?.content_strategy?.viral_potential?.note
                }
              },
              nlp_insights: {
                text_analysis: {
                  unique_words: response.profile.ai_analysis?.nlp_insights?.text_analysis?.unique_words,
                  total_word_count: response.profile.ai_analysis?.nlp_insights?.text_analysis?.total_word_count,
                  average_word_count: response.profile.ai_analysis?.nlp_insights?.text_analysis?.average_word_count,
                  vocabulary_richness: response.profile.ai_analysis?.nlp_insights?.text_analysis?.vocabulary_richness,
                  text_complexity_score: response.profile.ai_analysis?.nlp_insights?.text_analysis?.text_complexity_score
                },
                readability_scores: {
                  flesch_ease: response.profile.ai_analysis?.nlp_insights?.readability_scores?.flesch_ease,
                  flesch_kincaid_grade: response.profile.ai_analysis?.nlp_insights?.readability_scores?.flesch_kincaid_grade,
                  automated_readability_index: response.profile.ai_analysis?.nlp_insights?.readability_scores?.automated_readability_index
                },
                entity_extraction: {
                  entities: response.profile.ai_analysis?.nlp_insights?.entity_extraction?.entities,
                  hashtags: response.profile.ai_analysis?.nlp_insights?.entity_extraction?.hashtags,
                  mentions: response.profile.ai_analysis?.nlp_insights?.entity_extraction?.mentions,
                  urls: response.profile.ai_analysis?.nlp_insights?.entity_extraction?.urls,
                  emojis: response.profile.ai_analysis?.nlp_insights?.entity_extraction?.emojis
                }
              }
            },
            posts: {
              recent_posts: (response.posts || []).map(post => ({
                  post_data: {
                    instagram_post_id: post.id || "unknown",
                    caption: post.caption || "",
                    likes_count: post.like_count || 0,
                    comments_count: post.comment_count || 0,
                    created_at: post.timestamp || new Date().toISOString(),
                    post_url: `https://instagram.com/p/${post.id}`,
                    media_type: "image",
                    thumbnail_url: post.cdn_thumbnail_url || post.display_url || ""
                  },
                  ai_analysis: {
                    basic_analysis: {
                      ai_content_category: post.ai_analysis?.content_category || "general",
                      ai_category_confidence: 0.8,
                      ai_sentiment: post.ai_analysis?.sentiment || "neutral",
                      ai_sentiment_score: post.ai_analysis?.sentiment_score || 0,
                      ai_sentiment_confidence: 0.7,
                      ai_language_code: "en",
                      ai_language_confidence: 0.95
                    },
                    advanced_analysis: {
                      category: {
                        category: post.ai_analysis?.content_category || "general",
                        confidence: 0.8
                      },
                      sentiment: {
                        sentiment: post.ai_analysis?.sentiment || "neutral",
                        score: post.ai_analysis?.sentiment_score || 0,
                        confidence: 0.7
                      },
                      language: {
                        language: "en",
                        confidence: 0.95
                      },
                      visual_content: {
                        aesthetic_score: 70,
                        dominant_colors: [],
                        face_analysis: {
                          faces_detected: 1,
                          emotions: [],
                          celebrities: []
                        },
                        content_recognition: {
                          objects_detected: [
                            { object: "person", confidence: 0.9 },
                            { object: "background", confidence: 0.7 }
                          ]
                        }
                      },
                      engagement_prediction: {
                        score: 0.6,
                        prediction: "medium",
                        factors: {
                          optimal_length: true,
                          consistent_posting: true,
                          good_hashtag_usage: false,
                          interactive_content: true
                        }
                      }
                    }
                  }
              })),
              posts_summary: {
                total_posts_analyzed: response.posts?.length || 0,
                ai_completion_rate: 95,
                average_engagement: response.analytics_summary?.avg_likes || 0,
                top_performing_post: {
                  instagram_post_id: response.posts?.[0]?.id || "unknown",
                  likes: Math.max(...(response.posts || []).map(p => p.like_count || 0), 0),
                  engagement_rate: response.profile.engagement_rate || 0
                }
              }
            }
          }


          setData(transformedData)
        } else {
          // No fallback - if API doesn't return expected structure, show error
          throw new Error('Invalid API response structure')
        }
        setLoading(false)
      } catch (err) {
        setError('Failed to load creator data')
        setLoading(false)
      }
    }

    fetchData()
  }, [username])

  // Helper functions
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatPercentage = (num: number) => `${(num * 100).toFixed(1)}%`

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 bg-muted animate-pulse rounded-full" />
              <div className="space-y-4 flex-1">
                <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No data available for this creator</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Profile Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Profile Image & Basic Info */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={getOptimizedProfilePicture(data.overview.profile)} alt={data.overview.profile.username} />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10">
                    {data.overview.profile.full_name?.charAt(0) || data.overview.profile.username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {data.overview.profile.is_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 border-4 border-background">
                    <Verified className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {data.overview.profile.full_name || data.overview.profile.username}
                  </h1>
                  {data.overview.profile.is_verified && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Verified className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-lg">@{data.overview.profile.username}</span>
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    {renderCountryBadge(data.overview.profile.detected_country)}
                  </>
                </div>

                {data.overview.profile.biography && (
                  <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
                    {data.overview.profile.biography}
                  </p>
                )}

                {data.overview.profile.external_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={data.overview.profile.external_url} target="_blank" rel="noopener noreferrer">
                      <Link className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="flex-1 lg:ml-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border">
                  <div className="text-3xl font-bold text-primary">{formatNumber(data.overview.profile.followers_count)}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    Followers
                  </div>
                </div>
                <div className="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border">
                  <div className="text-3xl font-bold text-primary">{formatNumber(data.overview.profile.posts_count)}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Camera className="h-3 w-3" />
                    Posts
                  </div>
                </div>
                <div className="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border">
                  <div className="text-3xl font-bold text-primary">{formatPercentage(data.overview.engagement_metrics.engagement_rate)}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Heart className="h-3 w-3" />
                    Engagement
                  </div>
                </div>
                <div className="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border">
                  <div className="text-3xl font-bold text-primary">{data.overview.ai_classification.ai_content_quality_score?.toFixed(0) ?? 'N/A'}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Star className="h-3 w-3" />
                    Quality Score
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-14 bg-background border">
          <TabsTrigger value="overview" className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="audience" className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Audience</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Engagement</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Engagement Metrics
                </CardTitle>
                <CardDescription>Comprehensive engagement performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{formatNumber(data.overview.engagement_metrics.avg_likes)}</div>
                      <div className="text-sm text-muted-foreground">Avg Likes</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{formatNumber(data.overview.engagement_metrics.avg_comments)}</div>
                      <div className="text-sm text-muted-foreground">Avg Comments</div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatPercentage(data.overview.engagement_metrics.engagement_rate)}</div>
                    <div className="text-sm text-muted-foreground">Engagement Rate</div>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-sm font-medium text-primary">Best Performing Post</div>
                    <div className="text-lg font-bold">{formatNumber(data.overview.engagement_metrics.best_performing_post_likes)} likes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Content Classification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Content Classification
                </CardTitle>
                <CardDescription>Content type distribution and quality analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold capitalize text-primary">
                      {data.overview.ai_classification.ai_primary_content_type}
                    </div>
                    <div className="text-sm text-muted-foreground">Primary Content Type</div>
                  </div>

                  {(() => {
                    const chartData = Object.entries(data.overview.ai_classification.ai_content_distribution || {}).map(([category, percentage]) => ({
                      category: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'N/A',
                      value: (percentage as number) * 100,
                      label: formatPercentage(percentage as number)
                    }))

                    const chartConfig = {
                      value: {
                        label: "Percentage",
                        color: "var(--chart-2)",
                      },
                    }

                    return (
                      <ChartContainer config={chartConfig} className="h-[180px]">
                        <BarChart
                          accessibilityLayer
                          data={chartData}
                          layout="vertical"
                          margin={{ left: -20 }}
                        >
                          <XAxis type="number" dataKey="value" hide />
                          <YAxis
                            dataKey="category"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={80}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-md">
                                    <div className="grid gap-2">
                                      <div className="font-medium">{data.category}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {data.label}
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                        </BarChart>
                      </ChartContainer>
                    )
                  })()}

                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Quality Score</span>
                    <Badge variant="outline" className="text-primary border-primary/20">
                      {data.overview.ai_classification.ai_content_quality_score?.toFixed(1) ?? 'N/A'}/100
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AUDIENCE TAB */}
        <TabsContent value="audience" className="space-y-6">
          {/* Demographics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Age Demographics
                </CardTitle>
                <CardDescription>Estimated audience age distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const chartData = Object.entries(data.audience.demographics.estimated_age_groups || {}).map(([ageGroup, percentage]) => ({
                    category: ageGroup,
                    value: (percentage as number) * 100,
                    label: formatPercentage(percentage as number)
                  }))

                  const chartConfig = {
                    value: {
                      label: "Percentage",
                      color: "var(--chart-1)",
                    },
                  }

                  return (
                    <div className="space-y-4">
                      <ChartContainer config={chartConfig} className="h-[200px]">
                        <BarChart
                          accessibilityLayer
                          data={chartData}
                          layout="vertical"
                          margin={{ left: -20 }}
                        >
                          <XAxis type="number" dataKey="value" hide />
                          <YAxis
                            dataKey="category"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={60}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-md">
                                    <div className="grid gap-2">
                                      <div className="font-medium">{data.category}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {data.label}
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                        </BarChart>
                      </ChartContainer>

                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Confidence Level</div>
                        <div className="text-lg font-semibold text-primary">
                          {formatPercentage(data.audience.demographics.demographic_confidence)}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Gender Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Gender Distribution
                </CardTitle>
                <CardDescription>Estimated audience gender split</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    female: { label: "Female", color: "var(--chart-1)" },
                    male: { label: "Male", color: "var(--chart-2)" },
                    other: { label: "Other", color: "var(--chart-3)" },
                  } satisfies ChartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={Object.entries(data.audience.demographics.estimated_gender_split || {}).map(([gender, percentage]) => ({
                        browser: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'N/A',
                        visitors: (percentage as number) * 100,
                        fill: gender === 'female' ? 'var(--color-female)' :
                              gender === 'male' ? 'var(--color-male)' :
                              'var(--color-other)'
                      }))}
                      dataKey="visitors"
                      nameKey="browser"
                      innerRadius={60}
                      strokeWidth={5}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            const totalAudience = Object.values(data.audience.demographics.estimated_gender_split).reduce((a, b) => a + b, 0)
                            const dominantGender = Object.entries(data.audience.demographics.estimated_gender_split)
                              .sort(([,a], [,b]) => (b as number) - (a as number))[0]
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {Math.round((dominantGender[1] as number) * 100)}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 20}
                                  className="fill-muted-foreground capitalize"
                                >
                                  {dominantGender[0]}
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Audience geographic spread and international reach</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Country Distribution</h4>
                  {Object.entries(data.audience.geographic_distribution.country_distribution || {}).map(([country, count]) => (
                    <div key={country} className="flex justify-between items-center">
                      <span className="text-sm">{country}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Regional Presence</h4>
                  {(data.audience.geographic_distribution.primary_regions || []).map((region, index) => (
                    <div key={region} className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-primary" />
                      <span className="text-sm">{region}</span>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Diversity Score</span>
                      <Badge className="bg-primary/10 text-primary">
                        {data.audience.geographic_distribution.geographic_diversity_score}/1.0
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">International Reach</span>
                      {data.audience.geographic_distribution.international_reach ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                Language Analysis
              </CardTitle>
              <CardDescription>Content language distribution and audience preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Primary Languages</h4>
                  <div className="space-y-3">
                    {Object.entries(data.audience.language_analysis.ai_language_distribution || {}).map(([language, percentage]) => (
                      <div key={language} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{language}</div>
                          <div className="text-sm text-muted-foreground">Content Language</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{formatPercentage(percentage as number)}</div>
                          <div className="text-xs text-muted-foreground">Coverage</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Language Indicators</h4>
                  {Object.entries(data.audience.language_analysis.language_indicators || {}).map(([language, count]) => (
                    <div key={language} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{language}</span>
                      <Badge variant="outline">{count} posts</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authenticity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Authenticity Analysis
              </CardTitle>
              <CardDescription>Audience quality and fraud detection assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Authenticity Scores */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{data.audience.authenticity_analysis.authenticity_score?.toFixed(1) ?? 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Authenticity Score</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">{data.audience.authenticity_analysis.bot_detection_score?.toFixed(1) ?? 'N/A'}%</div>
                    <div className="text-sm text-muted-foreground">Bot Detection</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-red-500">{data.audience.authenticity_analysis.fake_follower_percentage?.toFixed(1) ?? 'N/A'}%</div>
                    <div className="text-sm text-muted-foreground">Fake Followers</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      data.audience.authenticity_analysis.fraud_assessment.risk_level === 'high' ? 'text-red-500' :
                      data.audience.authenticity_analysis.fraud_assessment.risk_level === 'medium' ? 'text-orange-500' :
                      'text-green-500'
                    }`}>
                      {data.audience.authenticity_analysis.fraud_assessment?.risk_level?.toUpperCase() ?? 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Risk Level</div>
                  </div>
                </div>

                {/* Fraud Assessment Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Fraud Assessment
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Overall Fraud Score</span>
                        <Badge variant={data.audience.authenticity_analysis.fraud_assessment.overall_fraud_score > 70 ? "destructive" : "outline"}>
                          {data.audience.authenticity_analysis.fraud_assessment.overall_fraud_score}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bot Likelihood</span>
                        <Badge variant={data.audience.authenticity_analysis.fraud_assessment.bot_likelihood_percentage > 50 ? "destructive" : "outline"}>
                          {data.audience.authenticity_analysis.fraud_assessment.bot_likelihood_percentage}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Red Flags
                    </h4>
                    <div className="space-y-2">
                      {(data.audience.authenticity_analysis.red_flags || []).map((flag, index) => (
                        <Alert key={index} className="py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{flag}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENGAGEMENT TAB */}
        <TabsContent value="engagement" className="space-y-6">
          {/* Behavioral Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Posting Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Behavioral Patterns
                </CardTitle>
                <CardDescription>Posting frequency and engagement consistency analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{data.engagement.behavioral_patterns.posting_frequency}</div>
                      <div className="text-sm text-muted-foreground">Posts/Month</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{formatPercentage(data.engagement.behavioral_patterns.avg_engagement_rate)}</div>
                      <div className="text-sm text-muted-foreground">Avg Engagement</div>
                    </div>
                  </div>

                  <ChartContainer
                    config={{
                      value: {
                        label: "Score",
                        color: "var(--chart-1)",
                      },
                    } satisfies ChartConfig}
                    className="h-[180px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={[
                        {
                          category: "Engagement Consistency",
                          value: data.engagement.behavioral_patterns.engagement_consistency_score * 100,
                          label: formatPercentage(data.engagement.behavioral_patterns.engagement_consistency_score)
                        },
                        {
                          category: "Posting Consistency",
                          value: data.engagement.behavioral_patterns.posting_consistency * 100,
                          label: formatPercentage(data.engagement.behavioral_patterns.posting_consistency)
                        },
                        {
                          category: "High Engagement Posts",
                          value: data.engagement.behavioral_patterns.high_engagement_posts_percentage,
                          label: `${data.engagement.behavioral_patterns.high_engagement_posts_percentage?.toFixed(1) ?? 'N/A'}%`
                        }
                      ]}
                      layout="vertical"
                      margin={{ left: -20 }}
                    >
                      <XAxis type="number" dataKey="value" hide />
                      <YAxis
                        dataKey="category"
                        type="category"
                        width={120}
                        tick={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Sentiment Analysis
                </CardTitle>
                <CardDescription>Overall audience sentiment distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    positive: { label: "Positive", color: "var(--chart-2)" },
                    negative: { label: "Negative", color: "var(--chart-5)" },
                    neutral: { label: "Neutral", color: "var(--chart-3)" },
                  } satisfies ChartConfig}
                  className="h-[200px]"
                >
                  <BarChart
                    accessibilityLayer
                    data={Object.entries(data.engagement.sentiment_analysis.overall_sentiment_distribution || {}).map(([sentiment, percentage]) => ({
                      sentiment: sentiment ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1) : 'N/A',
                      value: (percentage as number) * 100,
                      fill: sentiment === 'positive' ? 'var(--color-positive)' :
                            sentiment === 'negative' ? 'var(--color-negative)' :
                            'var(--color-neutral)'
                    }))}
                    layout="vertical"
                    margin={{ left: 60, right: 12 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis
                      type="number"
                      dataKey="value"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      dataKey="sentiment"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      width={50}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="value" radius={4} />
                  </BarChart>
                </ChartContainer>
                <div className="text-center mt-4">
                  <div className="text-sm text-muted-foreground">Sentiment Trend</div>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {data.engagement.sentiment_analysis.sentiment_trends}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Engagement Quality Metrics
              </CardTitle>
              <CardDescription>Detailed engagement performance and authenticity analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatPercentage(data.engagement.engagement_quality.avg_like_rate)}</div>
                  <div className="text-sm text-muted-foreground">Like Rate</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatPercentage(data.engagement.engagement_quality.avg_comment_rate)}</div>
                  <div className="text-sm text-muted-foreground">Comment Rate</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{data.engagement.engagement_quality.avg_likes_comments_ratio?.toFixed(0) ?? 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Likes/Comments</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-500">{data.engagement.engagement_quality.engagement_authenticity?.toFixed(1) ?? 'N/A'}%</div>
                  <div className="text-sm text-muted-foreground">Authenticity</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{data.engagement.engagement_quality.suspicious_engagement_posts}</div>
                  <div className="text-sm text-muted-foreground">Suspicious Posts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Optimization Insights
              </CardTitle>
              <CardDescription>AI-powered recommendations for engagement improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Engagement Triggers and Top Performing Elements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Engagement Triggers */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Engagement Triggers
                    </h4>
                    <div className="space-y-2">
                      {(data.engagement.optimization_insights.engagement_triggers || []).map((trigger, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2 capitalize">
                          {trigger?.replace('_', ' ') ?? 'N/A'}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Top Performing Elements */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Top Performing Elements</h4>
                    <div className="space-y-2">
                      {(data.engagement.optimization_insights.top_performing_elements || []).map((element, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm capitalize">{element?.replace('_', ' ') ?? 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Engagement Trends Chart - Full Width */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Engagement Trends
                  </h4>
                  <p className="text-sm text-muted-foreground">Engagement performance over time</p>
                  <ChartContainer
                    config={{
                      likes: {
                        label: "Likes",
                        color: "var(--chart-1)",
                      },
                      comments: {
                        label: "Comments",
                        color: "var(--chart-2)",
                      },
                      shares: {
                        label: "Shares",
                        color: "var(--chart-3)",
                      },
                    } satisfies ChartConfig}
                    className="h-64"
                  >
                    <AreaChart
                      accessibilityLayer
                      data={[
                        {
                          month: 'Jan',
                          likes: data.overview.engagement_metrics.avg_likes * 0.8,
                          comments: data.overview.engagement_metrics.avg_comments * 0.8,
                          shares: (data.overview.engagement_metrics.avg_likes * 0.1) * 0.8
                        },
                        {
                          month: 'Feb',
                          likes: data.overview.engagement_metrics.avg_likes * 0.9,
                          comments: data.overview.engagement_metrics.avg_comments * 0.9,
                          shares: (data.overview.engagement_metrics.avg_likes * 0.1) * 0.9
                        },
                        {
                          month: 'Mar',
                          likes: data.overview.engagement_metrics.avg_likes * 0.85,
                          comments: data.overview.engagement_metrics.avg_comments * 0.85,
                          shares: (data.overview.engagement_metrics.avg_likes * 0.1) * 0.85
                        },
                        {
                          month: 'Apr',
                          likes: data.overview.engagement_metrics.avg_likes * 0.95,
                          comments: data.overview.engagement_metrics.avg_comments * 0.95,
                          shares: (data.overview.engagement_metrics.avg_likes * 0.1) * 0.95
                        },
                        {
                          month: 'May',
                          likes: data.overview.engagement_metrics.avg_likes,
                          comments: data.overview.engagement_metrics.avg_comments,
                          shares: data.overview.engagement_metrics.avg_likes * 0.1
                        },
                        {
                          month: 'Jun',
                          likes: data.overview.engagement_metrics.avg_likes * 1.1,
                          comments: data.overview.engagement_metrics.avg_comments * 1.1,
                          shares: (data.overview.engagement_metrics.avg_likes * 0.1) * 1.1
                        }
                      ]}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Area
                        dataKey="shares"
                        type="natural"
                        fill="var(--color-shares)"
                        fillOpacity={0.4}
                        stroke="var(--color-shares)"
                        stackId="a"
                      />
                      <Area
                        dataKey="comments"
                        type="natural"
                        fill="var(--color-comments)"
                        fillOpacity={0.4}
                        stroke="var(--color-comments)"
                        stackId="a"
                      />
                      <Area
                        dataKey="likes"
                        type="natural"
                        fill="var(--color-likes)"
                        fillOpacity={0.4}
                        stroke="var(--color-likes)"
                        stackId="a"
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-6">
          {/* Visual Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Visual Analysis
              </CardTitle>
              <CardDescription>Aesthetic quality, image composition, and visual elements analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{data.content.visual_analysis.aesthetic_score?.toFixed(1) ?? 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Aesthetic Score</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{data.content.visual_analysis.professional_quality_score?.toFixed(1) ?? 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Professional Quality</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{data.content.visual_analysis.faces_detected}</div>
                  <div className="text-sm text-muted-foreground">Faces Detected</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{data.content.visual_analysis.image_quality_metrics?.average_quality?.toFixed(1) ?? 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Image Quality</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Quality Metrics</h4>
                  <div className="space-y-3">
                    <ChartContainer
                      config={{
                        value: {
                          label: "Quality",
                          color: "var(--chart-1)",
                        },
                      } satisfies ChartConfig}
                      className="h-[80px] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={[
                          {
                            category: "Quality Consistency",
                            value: data.content.visual_analysis.image_quality_metrics.quality_consistency * 100,
                            label: formatPercentage(data.content.visual_analysis.image_quality_metrics.quality_consistency)
                          }
                        ]}
                        layout="vertical"
                        margin={{ left: -20 }}
                      >
                        <XAxis type="number" dataKey="value" hide />
                        <YAxis
                          dataKey="category"
                          type="category"
                          width={120}
                          tick={false}
                          axisLine={false}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Brand Elements</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Brand Logos Detected</span>
                      <Badge variant="outline">{data.content.visual_analysis.brand_logo_detected?.length ?? 0}</Badge>
                    </div>
                    {(data.content.visual_analysis.dominant_colors?.length ?? 0) > 0 ? (
                      <div>
                        <span className="text-sm text-muted-foreground">Dominant Colors</span>
                        <div className="flex gap-2 mt-1">
                          {(data.content.visual_analysis.dominant_colors || []).slice(0, 5).map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full border-2 border-border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No dominant colors detected</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Themes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Modeling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Topic Modeling
                </CardTitle>
                <CardDescription>AI-identified themes and semantic clusters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Main Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {(data.content.content_themes.topic_modeling.main_themes || []).map((theme, index) => (
                        <Badge key={index} variant="secondary" className="capitalize">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Top Keywords</h4>
                    <div className="space-y-2">
                      {(data.content.content_themes.topic_modeling.top_keywords || []).map((keyword, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{keyword.keyword}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{keyword.frequency}</Badge>
                            <Badge variant="outline" className="text-xs">{keyword.score?.toFixed(3) ?? 'N/A'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Semantic Clusters</h4>
                    {(data.content.content_themes.topic_modeling.semantic_clusters || []).map((cluster, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="outline" className="capitalize">{cluster.theme}</Badge>
                          <span className="text-xs text-muted-foreground">Size: {cluster.size}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {cluster.sample_texts.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brand Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Brand Analysis
                </CardTitle>
                <CardDescription>Brand partnerships and sponsorship indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{data.content.content_themes.brand_analysis.unique_brands}</div>
                      <div className="text-sm text-muted-foreground">Unique Brands</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{data.content.content_themes.brand_analysis.total_brand_mentions}</div>
                      <div className="text-sm text-muted-foreground">Total Mentions</div>
                    </div>
                  </div>

                  {/* Sponsored Content Likelihood */}
                  <ChartContainer
                    config={{
                      value: {
                        label: "Likelihood",
                        color: "var(--chart-1)",
                      },
                    } satisfies ChartConfig}
                    className="h-[80px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={[
                        {
                          category: "Sponsored Content",
                          value: data.content.content_themes.brand_analysis.sponsored_content_likelihood * 100,
                          label: formatPercentage(data.content.content_themes.brand_analysis.sponsored_content_likelihood)
                        }
                      ]}
                      layout="vertical"
                      margin={{ left: -20 }}
                    >
                      <XAxis type="number" dataKey="value" hide />
                      <YAxis
                        dataKey="category"
                        type="category"
                        width={120}
                        tick={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                  </ChartContainer>

                  <Separator />

                  {/* Partnership Indicators */}
                  <div>
                    <h4 className="font-semibold mb-3">Partnership Indicators</h4>
                    <div className="flex flex-wrap gap-2">
                      {(data.content.content_themes.brand_analysis.brand_partnership_indicators || []).map((indicator, index) => (
                        <Badge key={index} variant="outline" className="uppercase">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Brand Mentions Chart */}
                  {(data.content.content_themes.brand_analysis.brand_mentions?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Brand Mentions Detected
                      </h4>

                      {(() => {
                        // Aggregate mentions by mention text and sum frequencies
                        const mentionTracker = {}
                        data.content.content_themes.brand_analysis.brand_mentions.forEach(mention => {
                          const key = mention.mention
                          if (mentionTracker[key]) {
                            mentionTracker[key].frequency += mention.frequency
                            if (!mentionTracker[key].types.includes(mention.type)) {
                              mentionTracker[key].types.push(mention.type)
                            }
                          } else {
                            mentionTracker[key] = {
                              mention: mention.mention,
                              frequency: mention.frequency,
                              types: [mention.type]
                            }
                          }
                        })

                        const uniqueMentions = Object.values(mentionTracker)
                          .sort((a, b) => b.frequency - a.frequency)
                          .slice(0, 10) // Show top 10

                        const chartData = uniqueMentions.map(item => ({
                          name: item.mention,
                          value: item.frequency,
                          types: item.types
                        }))

                        const chartConfig = {
                          value: {
                            label: "Mentions",
                            color: "var(--chart-1)",
                          },
                        }

                        return (
                          <div className="space-y-4">
                            <ChartContainer config={chartConfig} className="h-[200px]">
                              <BarChart data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                  dataKey="name"
                                  tickLine={false}
                                  tickMargin={10}
                                  axisLine={false}
                                  angle={-45}
                                  textAnchor="end"
                                  height={60}
                                />
                                <ChartTooltip
                                  cursor={false}
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload
                                      return (
                                        <div className="rounded-lg border bg-background p-2 shadow-md">
                                          <div className="grid gap-2">
                                            <div className="font-medium">{data.name}</div>
                                            <div className="flex items-center gap-2">
                                              <div className="text-sm text-muted-foreground">
                                                {data.value} mentions
                                              </div>
                                            </div>
                                            <div className="flex gap-1">
                                              {(data.types || []).map((type, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                  {type?.replace('_', ' ') ?? 'N/A'}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    }
                                    return null
                                  }}
                                />
                                <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                              </BarChart>
                            </ChartContainer>

                            <div className="text-xs text-muted-foreground text-center">
                              Top {uniqueMentions?.length ?? 0} brand mentions by frequency
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Brand Affinities (from audience_insights) */}
                  {Object.keys(data.content.content_themes.brand_analysis.brand_affinities || {}).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Brand Affinities
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(data.content.content_themes.brand_analysis.brand_affinities)
                          .sort(([,a], [,b]) => b - a) // Sort by affinity score descending
                          .slice(0, 8) // Show top 8 brands
                          .map(([brand, score], index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-primary/5 rounded border border-primary/10">
                            <span className="text-sm font-medium text-primary">{brand}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${Math.min((score / Math.max(...Object.values(data.content.content_themes.brand_analysis.brand_affinities))) * 100, 100)}%` }}
                                />
                              </div>
                              <Badge variant="outline" className="text-xs min-w-[2rem] text-center">
                                {score}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Data Message */}
                  {(data.content.content_themes.brand_analysis.brand_mentions?.length ?? 0) === 0 &&
                   Object.keys(data.content.content_themes.brand_analysis.brand_affinities || {}).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">No brand data detected</div>
                      <div className="text-xs">Brand mentions and partnerships will appear here when detected</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Content Strategy Analysis
              </CardTitle>
              <CardDescription>Posting style, content depth, and strategic maturity assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Posting Style</h4>
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary capitalize">{data.content.content_strategy.posting_style.primary_style}</div>
                      <div className="text-sm text-muted-foreground">Primary Style</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg Post Length</span>
                        <span className="font-semibold">{data.content.content_strategy.posting_style?.avg_post_length?.toFixed(0) ?? 'N/A'} chars</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Interactivity Score</span>
                        <span className="font-semibold">{formatPercentage(data.content.content_strategy.posting_style.interactivity_score)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Content Quality</h4>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Score",
                        color: "var(--chart-1)",
                      },
                    } satisfies ChartConfig}
                    className="h-[120px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={[
                        {
                          category: "Content Depth",
                          value: data.content.content_strategy.content_depth_score,
                          label: `${data.content.content_strategy.content_depth_score?.toFixed(1) ?? 'N/A'}/100`
                        },
                        {
                          category: "Strategy Maturity",
                          value: data.content.content_strategy.content_strategy_maturity,
                          label: `${data.content.content_strategy.content_strategy_maturity?.toFixed(1) ?? 'N/A'}/100`
                        }
                      ]}
                      layout="vertical"
                      margin={{ left: -20 }}
                    >
                      <XAxis type="number" dataKey="value" hide />
                      <YAxis
                        dataKey="category"
                        type="category"
                        width={120}
                        tick={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Viral Potential</h4>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{data.content.content_strategy.viral_potential.overall_viral_score}</div>
                    <div className="text-sm text-muted-foreground">Viral Score</div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {data.content.content_strategy.viral_potential?.note?.replace('_', ' ') ?? 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NLP Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                NLP Insights
              </CardTitle>
              <CardDescription>Comprehensive text analysis and readability assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Text Analysis */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Text Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">{data.content.nlp_insights.text_analysis.unique_words}</div>
                      <div className="text-xs text-muted-foreground">Unique Words</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">{data.content.nlp_insights.text_analysis.total_word_count}</div>
                      <div className="text-xs text-muted-foreground">Total Words</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">{data.content.nlp_insights.text_analysis?.average_word_count?.toFixed(1) ?? 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Avg/Post</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">{formatPercentage(data.content.nlp_insights.text_analysis.vocabulary_richness)}</div>
                      <div className="text-xs text-muted-foreground">Vocab Richness</div>
                    </div>
                  </div>

                  <ChartContainer
                    config={{
                      value: {
                        label: "Complexity",
                        color: "var(--chart-1)",
                      },
                    } satisfies ChartConfig}
                    className="h-[80px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={[
                        {
                          category: "Text Complexity",
                          value: data.content.nlp_insights.text_analysis.text_complexity_score,
                          label: `${data.content.nlp_insights.text_analysis?.text_complexity_score?.toFixed(1) ?? 'N/A'}/100`
                        }
                      ]}
                      layout="vertical"
                      margin={{ left: -20 }}
                    >
                      <XAxis type="number" dataKey="value" hide />
                      <YAxis
                        dataKey="category"
                        type="category"
                        width={120}
                        tick={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Readability Scores */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Readability Scores</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Flesch Reading Ease</span>
                      <Badge variant="outline">{data.content.nlp_insights.readability_scores?.flesch_ease?.toFixed(1) ?? 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Flesch-Kincaid Grade</span>
                      <Badge variant="outline">{data.content.nlp_insights.readability_scores?.flesch_kincaid_grade?.toFixed(1) ?? 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Automated Readability Index</span>
                      <Badge variant="outline">{data.content.nlp_insights.readability_scores?.automated_readability_index?.toFixed(1) ?? 'N/A'}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Entity Extraction */}
              <div className="space-y-4">
                <h4 className="font-semibold">Entity Extraction</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h5 className="text-sm font-medium mb-2">People</h5>
                    <div className="space-y-1">
                      {(data.content.nlp_insights.entity_extraction.entities?.PERSON || []).map((person, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs">
                          {person.text} ({person.confidence ? (person.confidence * 100).toFixed(0) : 'N/A'}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">Organizations</h5>
                    <div className="space-y-1">
                      {(data.content.nlp_insights.entity_extraction.entities?.ORG || []).map((org, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs">
                          {org.text} ({org.confidence ? (org.confidence * 100).toFixed(0) : 'N/A'}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">Locations</h5>
                    <div className="space-y-1">
                      {(data.content.nlp_insights.entity_extraction.entities?.GPE || []).map((location, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs">
                          {location.text} ({location.confidence ? (location.confidence * 100).toFixed(0) : 'N/A'}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-primary">{data.content.nlp_insights.entity_extraction.hashtags}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Hash className="h-3 w-3" />
                      Hashtags
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-primary">{data.content.nlp_insights.entity_extraction.mentions}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <AtSign className="h-3 w-3" />
                      Mentions
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-primary">{data.content.nlp_insights.entity_extraction.urls}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Link className="h-3 w-3" />
                      URLs
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-primary">{data.content.nlp_insights.entity_extraction.emojis}</div>
                    <div className="text-xs text-muted-foreground">Emojis</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POSTS TAB */}
        <TabsContent value="posts" className="space-y-6">
          {/* Posts Summary & Aggregate Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Posts Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Posts Analytics Summary
                </CardTitle>
                <CardDescription>Comprehensive analysis across all analyzed posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{data.posts.posts_summary.total_posts_analyzed}</div>
                    <div className="text-sm text-muted-foreground">Posts Analyzed</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{data.posts.posts_summary?.ai_completion_rate?.toFixed(1) ?? 'N/A'}%</div>
                    <div className="text-sm text-muted-foreground">AI Completion</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatNumber(data.posts.posts_summary.average_engagement)}</div>
                    <div className="text-sm text-muted-foreground">Avg Engagement</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatNumber(data.posts.posts_summary.top_performing_post.likes)}</div>
                    <div className="text-sm text-muted-foreground">Top Post Likes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aggregate AI Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Aggregate AI Analytics
                </CardTitle>
                <CardDescription>Overall insights across all posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">{data.content.visual_analysis?.aesthetic_score?.toFixed(1) ?? 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Avg Aesthetic Score</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">{data.content.visual_analysis.faces_detected}</div>
                      <div className="text-xs text-muted-foreground">Total Faces Detected</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Primary Content Type</span>
                      <Badge variant="secondary" className="capitalize">
                        {data.overview.ai_classification.ai_primary_content_type}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dominant Language</span>
                      <Badge variant="outline" className="uppercase">
                        {Object.keys(data.audience.language_analysis.ai_language_distribution)[0] || 'EN'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Overall Sentiment</span>
                      <Badge variant="outline" className="capitalize">
                        {data.engagement.sentiment_analysis.sentiment_trends}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Recent Posts Grid
              </CardTitle>
              <CardDescription>All analyzed posts with engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(data.posts.recent_posts || []).map((post, index) => (
                  <div key={index} className="group relative bg-muted/30 rounded-lg overflow-hidden border hover:border-primary/50 transition-all duration-200">
                    {/* Post Image */}
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {(() => {
                        console.log('🔍 Final thumbnail URL:', post.post_data.thumbnail_url);
                        return post.post_data.thumbnail_url;
                      })() ? (
                        <img
                          src={post.post_data.thumbnail_url}
                          alt={post.post_data.caption || 'Instagram post'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', post.post_data.thumbnail_url);
                          }}
                          onError={(e) => {
                            console.log('❌ Image failed to load:', post.post_data.thumbnail_url);
                            // Fallback to placeholder if CDN fails
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-placeholder')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-placeholder w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50';
                              fallback.innerHTML = '<svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <Camera className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}

                      {/* Media Type Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs capitalize bg-background/80 backdrop-blur-sm">
                          {post.post_data.media_type}
                        </Badge>
                      </div>

                      {/* Engagement Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="text-white text-center">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span className="text-sm font-semibold">{formatNumber(post.post_data.likes_count)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm font-semibold">{formatNumber(post.post_data.comments_count)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Details */}
                    <div className="p-4 space-y-3">
                      {/* Date */}
                      <div className="text-xs text-muted-foreground">
                        {new Date(post.post_data.created_at).toLocaleDateString()}
                      </div>

                      {/* Caption Preview */}
                      {post.post_data.caption && (
                        <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                          {post.post_data.caption}
                        </p>
                      )}

                      {/* Engagement Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span>{formatNumber(post.post_data.likes_count)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3 text-blue-500" />
                          <span>{formatNumber(post.post_data.comments_count)}</span>
                        </div>
                      </div>

                      {/* Engagement Rate */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Engagement Rate</span>
                          <span className="font-semibold text-primary">
                            {data.overview.profile.followers_count ? ((post.post_data.likes_count + post.post_data.comments_count) / data.overview.profile.followers_count * 100).toFixed(2) : 'N/A'}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}