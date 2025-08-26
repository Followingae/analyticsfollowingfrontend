'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Heart, 
  Languages,
  TrendingUp,
  Sparkles,
  Globe,
  BarChart3
} from 'lucide-react';
import { PostAIAnalysis, CONTENT_CATEGORY_LABELS, LANGUAGE_LABELS } from '@/types/creator';

interface PostAIBadgesProps {
  analysis: PostAIAnalysis;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

/**
 * 🏷️ POST AI BADGES - AI analysis badges for individual posts
 * Displays content category, sentiment, and language with confidence scores
 */
export function PostAIBadges({ 
  analysis, 
  variant = 'default', 
  className 
}: PostAIBadgesProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'negative':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'neutral':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number) => Math.round(value * 100);
  const formatSentimentScore = (score: number) => Math.round(((score + 1) / 2) * 100);

  // Compact variant - minimal badges
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          <Target className="h-3 w-3 mr-1" />
          {CONTENT_CATEGORY_LABELS[analysis.content_category]}
        </Badge>
        <Badge className={`text-xs px-2 py-0.5 ${getSentimentColor(analysis.sentiment)}`}>
          <Heart className="h-3 w-3 mr-1" />
          {analysis.sentiment}
        </Badge>
      </div>
    );
  }

  // Detailed variant - full information with confidence scores
  if (variant === 'detailed') {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Content Category with Confidence */}
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-sm px-3 py-1">
            <Target className="h-3 w-3 mr-1" />
            {CONTENT_CATEGORY_LABELS[analysis.content_category]}
          </Badge>
          <span className={`text-xs font-medium ${getConfidenceColor(analysis.category_confidence)}`}>
            {formatPercentage(analysis.category_confidence)}% confidence
          </span>
        </div>

        {/* Sentiment Analysis */}
        <div className="flex items-center gap-2">
          <Badge className={`text-sm px-3 py-1 ${getSentimentColor(analysis.sentiment)}`}>
            <Heart className="h-3 w-3 mr-1" />
            {analysis.sentiment} ({formatSentimentScore(analysis.sentiment_score)}%)
          </Badge>
          <span className={`text-xs font-medium ${getConfidenceColor(analysis.sentiment_confidence)}`}>
            {formatPercentage(analysis.sentiment_confidence)}% confidence
          </span>
        </div>

        {/* Language Detection */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Languages className="h-3 w-3 mr-1" />
            {LANGUAGE_LABELS[analysis.language]}
          </Badge>
          <span className={`text-xs font-medium ${getConfidenceColor(analysis.language_confidence)}`}>
            {formatPercentage(analysis.language_confidence)}% confidence
          </span>
        </div>

        {/* Analysis Metadata */}
        <div className="flex items-center gap-2 pt-1">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            <Sparkles className="h-3 w-3 mr-1" />
            {analysis.analysis_version}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(analysis.analyzed_at).toLocaleDateString()}
          </span>
        </div>

        {/* Processing Info (if available) */}
        {analysis.processing_info && (
          <div className="flex items-center gap-1 pt-1">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              <BarChart3 className="h-3 w-3 mr-1" />
              {analysis.processing_info.model_used === 'ai' ? 'AI Model' : 'Rule-based'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {analysis.processing_info.processing_time.toFixed(2)}s
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default variant - balanced display
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Content Category */}
      <Badge variant="default" className="text-xs px-2 py-1">
        <Target className="h-3 w-3 mr-1" />
        {CONTENT_CATEGORY_LABELS[analysis.content_category]}
        <span className={`ml-1 ${getConfidenceColor(analysis.category_confidence)}`}>
          ({formatPercentage(analysis.category_confidence)}%)
        </span>
      </Badge>

      {/* Sentiment */}
      <Badge className={`text-xs px-2 py-1 ${getSentimentColor(analysis.sentiment)}`}>
        <Heart className="h-3 w-3 mr-1" />
        {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
        <span className="ml-1 opacity-75">
          {formatSentimentScore(analysis.sentiment_score)}%
        </span>
      </Badge>

      {/* Language */}
      <Badge variant="outline" className="text-xs px-2 py-1">
        <Globe className="h-3 w-3 mr-1" />
        {LANGUAGE_LABELS[analysis.language]}
        <span className={`ml-1 ${getConfidenceColor(analysis.language_confidence)}`}>
          ({formatPercentage(analysis.language_confidence)}%)
        </span>
      </Badge>

      {/* Quality Indicator (high confidence = sparkle) */}
      {(analysis.category_confidence > 0.9 && 
        analysis.sentiment_confidence > 0.9 && 
        analysis.language_confidence > 0.9) && (
        <Badge variant="secondary" className="text-xs px-2 py-1">
          <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
          High Quality
        </Badge>
      )}
    </div>
  );
}