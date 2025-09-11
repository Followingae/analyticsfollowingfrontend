'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  MessageSquare, 
  Globe, 
  TrendingUp,
  Star,
  Palette
} from 'lucide-react'
import { CreatorProfile } from './CreatorAnalyticsDashboard'

interface AIInsightsPanelProps {
  profile: CreatorProfile
}

export function AIInsightsPanel({ profile }: AIInsightsPanelProps) {
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(0)}%`
  }

  const getSentimentColor = (score: number): string => {
    if (score >= 0.6) return 'text-green-600'
    if (score >= 0.3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSentimentLabel = (score: number): string => {
    if (score >= 0.6) return 'Positive'
    if (score >= 0.3) return 'Neutral'
    return 'Negative'
  }

  const getContentDistributionData = () => {
    if (!profile.ai_content_distribution) return []
    
    return Object.entries(profile.ai_content_distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5 categories
  }

  const getLanguageDistributionData = () => {
    if (!profile.ai_language_distribution) return []
    
    return Object.entries(profile.ai_language_distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3) // Top 3 languages
  }

  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'ar': 'Arabic',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ru': 'Russian',
      'hi': 'Hindi',
      'th': 'Thai',
      'tr': 'Turkish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'pl': 'Polish'
    }
    return languages[code] || code.toUpperCase()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Primary Content Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Content Analysis
          </CardTitle>
          <CardDescription>
            AI-powered content categorization and quality assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.ai_primary_content_type && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Primary Content Type</span>
                <Badge variant="secondary" className="text-sm">
                  {profile.ai_primary_content_type}
                </Badge>
              </div>
            </div>
          )}

          {profile.ai_content_quality_score !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Content Quality Score</span>
                <span className="text-sm font-bold">
                  {(profile.ai_content_quality_score * 10).toFixed(1)}/10
                </span>
              </div>
              <Progress 
                value={profile.ai_content_quality_score * 100} 
                className="w-full"
              />
            </div>
          )}

          {/* Content Distribution */}
          {getContentDistributionData().length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Content Distribution</h4>
              <div className="space-y-2">
                {getContentDistributionData().map(([category, percentage]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{category}</span>
                      <span className="font-medium">{formatPercentage(percentage)}</span>
                    </div>
                    <Progress value={percentage * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentiment & Language Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Sentiment & Language
          </CardTitle>
          <CardDescription>
            Content sentiment analysis and language distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sentiment Analysis */}
          {profile.ai_avg_sentiment_score !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Sentiment</span>
                <Badge 
                  variant="secondary"
                  className={getSentimentColor(profile.ai_avg_sentiment_score)}
                >
                  {getSentimentLabel(profile.ai_avg_sentiment_score)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">
                  {(profile.ai_avg_sentiment_score * 100).toFixed(0)}%
                </span>
                <span className="text-sm text-muted-foreground">positive</span>
              </div>
              <Progress 
                value={profile.ai_avg_sentiment_score * 100} 
                className="w-full"
              />
            </div>
          )}

          {/* Language Distribution */}
          {getLanguageDistributionData().length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language Distribution
              </h4>
              <div className="space-y-2">
                {getLanguageDistributionData().map(([langCode, percentage]) => (
                  <div key={langCode} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{getLanguageName(langCode)}</span>
                      <span className="font-medium">{formatPercentage(percentage)}</span>
                    </div>
                    <Progress value={percentage * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Processing Info */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Brain className="h-3 w-3" />
              <span>Powered by advanced AI content analysis</span>
            </div>
            {profile.enhancement_completed_at && (
              <div className="text-xs text-muted-foreground mt-1">
                Analyzed: {new Date(profile.enhancement_completed_at).toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}