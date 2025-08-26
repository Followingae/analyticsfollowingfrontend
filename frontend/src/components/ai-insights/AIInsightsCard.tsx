'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  BarChart3, 
  Languages, 
  Heart, 
  Star,
  TrendingUp,
  Globe,
  Target,
  Calendar
} from 'lucide-react';
import { AIInsights, CONTENT_CATEGORY_LABELS, LANGUAGE_LABELS, SentimentType } from '@/types/creator';

interface AIInsightsCardProps {
  insights: AIInsights;
  className?: string;
}

/**
 * 🧠 AI INSIGHTS CARD - Comprehensive AI analysis visualization
 * Displays all AI-powered insights using shadcn components
 */
export function AIInsightsCard({ insights, className }: AIInsightsCardProps) {
  if (!insights.available) {
    return (
      <Card className={className}>
        <CardHeader className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle className="text-muted-foreground">AI Analysis Not Available</CardTitle>
          <CardDescription>
            This creator's profile hasn't been analyzed yet or analysis is still in progress.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getSentimentType = (score: number): SentimentType => {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  };

  const getSentimentColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sentimentType = getSentimentType(insights.average_sentiment);
  const sentimentScore = Math.round(((insights.average_sentiment + 1) / 2) * 100);

  // Get top 4 content categories
  const topCategories = Object.entries(insights.content_distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  // Get top 3 languages
  const topLanguages = Object.entries(insights.language_distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Insights</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(insights.last_analyzed).toLocaleDateString()}
          </Badge>
        </div>
        <CardDescription>
          AI-powered analysis with {insights.analysis_completeness} data coverage
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary Content Category */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Primary Content Category</h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-sm px-3 py-1">
              {CONTENT_CATEGORY_LABELS[insights.content_category]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {Math.round(insights.content_distribution[insights.content_category] || 0)}% of content
            </span>
          </div>
        </div>

        <Separator />

        {/* Content Distribution */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Content Distribution</h4>
          </div>
          <div className="space-y-2">
            {topCategories.map(([category, percentage]) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {CONTENT_CATEGORY_LABELS[category as keyof typeof CONTENT_CATEGORY_LABELS]}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(percentage)}%
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Sentiment Analysis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Sentiment Analysis</h4>
          </div>
          <div className="flex items-center gap-4">
            <Badge className={getSentimentColor(sentimentType)}>
              {sentimentType.charAt(0).toUpperCase() + sentimentType.slice(1)}
            </Badge>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Positivity Score</span>
                <span className="font-medium">{sentimentScore}%</span>
              </div>
              <Progress 
                value={sentimentScore} 
                className="h-2"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on sentiment analysis of all posts and captions
          </p>
        </div>

        <Separator />

        {/* Language Distribution */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Languages</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {topLanguages.map(([langCode, percentage]) => (
              <Badge key={langCode} variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                {LANGUAGE_LABELS[langCode as keyof typeof LANGUAGE_LABELS]} ({Math.round(percentage)}%)
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Content Quality Score */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Content Quality Score</h4>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-bold ${getQualityScoreColor(insights.content_quality_score)}`}>
              {insights.content_quality_score.toFixed(1)}
            </div>
            <div className="flex-1">
              <Progress 
                value={(insights.content_quality_score / 10) * 100} 
                className="h-3"
              />
            </div>
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI assessment based on engagement, content variety, and posting consistency
          </p>
        </div>

        {/* Analysis Status */}
        {insights.analysis_completeness !== 'complete' && (
          <>
            <Separator />
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">Analysis Status: </span>
                <Badge variant="secondary" className="capitalize">
                  {insights.analysis_completeness}
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}