'use client'

import React from 'react'
import { ComprehensiveAnalyticsDashboard } from './ComprehensiveAnalyticsDashboard'
import { AnalyticsLoadingState } from './AnalyticsLoadingState'

// Legacy interface for backward compatibility
export interface CreatorProfile {
  // Basic Profile Data
  username: string
  full_name: string
  biography: string
  is_private: boolean
  is_verified: boolean
  external_url?: string
  profile_pic_url: string
  profile_pic_url_hd?: string
  cdn_url_512?: string | null
  
  // Basic Metrics
  followers_count: number
  following_count: number
  posts_count: number
  
  // AI Analysis (simplified - always present, but may not be available)
  ai_analysis: {
    available: boolean
    primary_content_type?: string
    content_distribution?: Record<string, number>
    avg_sentiment_score?: number
    language_distribution?: Record<string, number>
    content_quality_score?: number
    profile_analyzed_at?: string
  }
  
  // Unlock Status
  is_unlocked: boolean
  unlock_cost: number
  can_unlock: boolean
  
  engagement_metrics?: {
    avg_likes: number
    avg_comments: number
    engagement_rate: number
    engagement_trend: 'increasing' | 'stable' | 'decreasing'
    best_performing_time: string
    posting_frequency: string
  }
  
  audience_demographics?: {
    age_groups: Record<string, number>
    gender_distribution: {
      male: number
      female: number
    }
    top_countries: string[]
    verified_followers_percentage: number
  }
  
  content_performance?: {
    avg_likes_per_post: number
    avg_comments_per_post: number
    avg_shares_per_post: number
    most_engaging_content_type: string
    peak_engagement_hours: number[]
  }
  
  brand_safety?: {
    safety_score: number
    risk_factors: string[]
    content_appropriateness: string
    brand_mention_frequency: string
  }
  
  authenticity_metrics?: {
    authenticity_score: number
    fake_follower_percentage: number
    engagement_authenticity: number
    growth_pattern: string
  }
}

interface CreatorAnalyticsDashboardProps {
  username: string
  onUnlock?: () => void
}

/**
 * CreatorAnalyticsDashboard - Now powered by the comprehensive 10-model AI system
 * 
 * This component has been completely replaced with the advanced analytics system
 * that includes AI intelligence, performance analytics, safety assessment, and more.
 */
export function CreatorAnalyticsDashboard({ username, onUnlock }: CreatorAnalyticsDashboardProps) {
  // Always use the comprehensive analytics dashboard
  return (
    <React.Suspense fallback={<AnalyticsLoadingState />}>
      <ComprehensiveAnalyticsDashboard username={username} />
    </React.Suspense>
  )
}