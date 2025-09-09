"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Shield, 
  Eye, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Star,
  Target,
  BarChart3,
  Zap
} from 'lucide-react'
import type { EnhancedAIAnalysis, ComprehensiveAIAnalysisResponse } from '@/types/creator'

interface ComprehensiveAIInsightsProps {
  analysis: EnhancedAIAnalysis | ComprehensiveAIAnalysisResponse
  loading?: boolean
}

export const ComprehensiveAIInsights: React.FC<ComprehensiveAIInsightsProps> = ({ 
  analysis, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-2 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Handle both direct EnhancedAIAnalysis and API response format
  const getAnalysisData = () => {
    if ('advanced_ai_analysis' in analysis) {
      // ComprehensiveAIAnalysisResponse format
      return {
        audience_quality: analysis.advanced_ai_analysis.audience_quality_assessment,
        visual_content: analysis.advanced_ai_analysis.visual_content_analysis,
        audience_insights: analysis.advanced_ai_analysis.audience_insights,
        trend_detection: analysis.advanced_ai_analysis.trend_detection,
        fraud_detection: analysis.advanced_ai_analysis.fraud_detection_analysis,
        behavioral_patterns: analysis.advanced_ai_analysis.behavioral_patterns_analysis,
        comprehensive_insights: analysis.comprehensive_insights,
        metadata: analysis.analysis_metadata
      }
    } else {
      // Direct EnhancedAIAnalysis format
      return {
        audience_quality: analysis.audience_quality_assessment,
        visual_content: analysis.visual_content_analysis,
        audience_insights: analysis.audience_insights,
        trend_detection: analysis.trend_detection,
        fraud_detection: analysis.fraud_detection_analysis,
        behavioral_patterns: analysis.behavioral_patterns_analysis,
        comprehensive_insights: analysis.comprehensive_insights,
        metadata: null
      }
    }
  }

  const data = getAnalysisData()

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'increasing':
      case 'positive': return 'text-green-600'
      case 'decreasing': 
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Comprehensive AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {data.comprehensive_insights?.overall_authenticity_score || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Authenticity Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.comprehensive_insights?.content_aesthetic_score || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Content Quality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.comprehensive_insights?.viral_potential_score || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Viral Potential</div>
            </div>
          </div>
          
          {data.metadata && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>AI Models Success Rate: {data.metadata.models_success_rate}%</span>
                <span>Analysis v{data.metadata.comprehensive_analysis_version}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Audience Quality Assessment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Audience Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Authenticity</span>
                  <span>{data.audience_quality?.authenticity_score || 0}%</span>
                </div>
                <Progress value={data.audience_quality?.authenticity_score || 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Engagement Quality</span>
                  <span>{data.audience_quality?.engagement_authenticity || 0}%</span>
                </div>
                <Progress value={data.audience_quality?.engagement_authenticity || 0} className="h-2" />
              </div>

              <Separator />
              
              <div className="text-xs text-muted-foreground">
                Fake followers: {data.audience_quality?.fake_follower_percentage || 0}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Content Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              Visual Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Aesthetic Score</span>
                  <span>{data.visual_content?.aesthetic_score || 0}%</span>
                </div>
                <Progress value={data.visual_content?.aesthetic_score || 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Professional Quality</span>
                  <span>{data.visual_content?.professional_quality_score || 0}%</span>
                </div>
                <Progress value={data.visual_content?.professional_quality_score || 0} className="h-2" />
              </div>

              {data.visual_content?.dominant_colors && data.visual_content.dominant_colors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Color Palette</div>
                    <div className="flex gap-1">
                      {data.visual_content.dominant_colors.slice(0, 5).map((colorData, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: colorData.color }}
                          title={`${colorData.color} (${colorData.percentage}%)`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trend Detection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Viral Potential</span>
                  <span>{data.trend_detection?.viral_potential?.overall_viral_score || 0}%</span>
                </div>
                <Progress value={data.trend_detection?.viral_potential?.overall_viral_score || 0} className="h-2" />
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Engagement Trend</div>
                <Badge 
                  variant="outline" 
                  className={getTrendColor(data.trend_detection?.engagement_trend_direction || 'stable')}
                >
                  {data.trend_detection?.engagement_trend_direction || 'Stable'}
                </Badge>
              </div>

              {data.trend_detection?.trending_hashtags && data.trend_detection.trending_hashtags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Top Hashtags</div>
                    <div className="flex flex-wrap gap-1">
                      {data.trend_detection.trending_hashtags.slice(0, 3).map((hashtag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          #{hashtag.hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fraud Detection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Fraud Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <Badge 
                  className={`${getRiskLevelColor(data.fraud_detection?.fraud_assessment?.risk_level || 'unknown')} font-semibold`}
                >
                  {(data.fraud_detection?.fraud_assessment?.risk_level || 'Unknown').toUpperCase()} RISK
                </Badge>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Bot Likelihood</span>
                  <span>{data.fraud_detection?.fraud_assessment?.bot_likelihood_percentage || 0}%</span>
                </div>
                <Progress 
                  value={data.fraud_detection?.fraud_assessment?.bot_likelihood_percentage || 0} 
                  className="h-2"
                />
              </div>

              {data.fraud_detection?.red_flags && data.fraud_detection.red_flags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Red Flags</div>
                    <div className="text-xs text-red-600">
                      {data.fraud_detection.red_flags.length} detected
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Patterns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              Behavioral Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Lifecycle Stage</div>
                <Badge variant="outline" className="font-medium">
                  {data.behavioral_patterns?.lifecycle_analysis?.current_stage || 'Unknown'}
                </Badge>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">User Lifecycle</div>
                <Badge variant="secondary">
                  {data.comprehensive_insights?.user_lifecycle_stage || 'Unknown'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audience Demographics Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Audience Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-lg font-bold">
                  {data.comprehensive_insights?.fake_follower_percentage || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Fake Followers</div>
              </div>

              <Separator />

              <div className="text-xs text-center text-muted-foreground">
                Advanced demographic insights available
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

export default ComprehensiveAIInsights