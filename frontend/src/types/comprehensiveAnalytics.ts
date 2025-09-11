// Comprehensive AI Analytics API Types - 10-Model System

// Enhanced Profile Response with Full AI Data
export interface EnhancedProfileResponse {
  success: boolean
  profile: {
    // Basic Profile Data
    username: string
    full_name: string | null
    biography: string | null
    followers_count: number
    following_count: number
    posts_count: number
    is_verified: boolean
    profile_pic_url: string | null
    
    // Enhanced AI Analysis (Main Feature)
    ai_primary_content_type: string | null
    ai_content_distribution: Record<string, number> | null
    ai_avg_sentiment_score: number | null
    ai_content_quality_score: number | null
    ai_language_distribution: Record<string, number> | null
    ai_top_3_categories: string[] | null
    ai_top_10_categories: string[] | null
    ai_profile_analyzed_at: string | null
  }
  message: string
}

// Individual Post Analytics
export interface PostAnalyticsResponse {
  success: boolean
  posts: Array<{
    id: string
    media_type: 'photo' | 'video' | 'carousel'
    caption: string | null
    timestamp: string
    like_count: number
    comment_count: number
    
    // Per-Post AI Data
    ai_content_category: string | null
    ai_sentiment_score: number | null
    ai_language_code: string | null
    ai_category_confidence: number | null
    ai_sentiment_confidence: number | null
    ai_language_confidence: number | null
    ai_analyzed_at: string | null
    ai_analysis_raw: Record<string, any> | null
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  message: string
}

// Advanced AI Intelligence (10-Model System)
export interface ComprehensiveAnalysisResponse {
  success: boolean
  analysis: {
    // Behavioral Patterns
    behavioral_patterns: {
      posting_consistency: {
        frequency: 'daily' | 'weekly' | 'irregular'
        optimal_times: string[]
        consistency_score: number
      }
      engagement_patterns: {
        average_engagement_rate: number
        peak_engagement_times: string[]
        engagement_trend: 'increasing' | 'stable' | 'decreasing'
      }
      content_evolution: {
        style_changes: string[]
        quality_trend: 'improving' | 'stable' | 'declining'
        topic_shifts: string[]
      }
    }
    
    // Audience Quality
    audience_quality: {
      engagement_authenticity: number
      bot_detection_score: number
      real_audience_percentage: number
      audience_quality_grade: 'A' | 'B' | 'C' | 'D' | 'F'
    }
    
    // Visual Content Analysis
    visual_analysis: {
      image_vs_video_breakdown: Record<string, number>
      visual_themes: string[]
      aesthetic_consistency_score: number
      color_palette_analysis: string[]
    }
    
    // Trend Detection
    trend_detection: {
      trending_topics: Array<{
        topic: string
        relevance_score: number
        trend_direction: 'rising' | 'stable' | 'declining'
      }>
      viral_potential_score: number
      seasonal_patterns: Record<string, number>
    }
    
    // Advanced NLP
    advanced_nlp: {
      topic_modeling: Array<{
        topic: string
        weight: number
        keywords: string[]
      }>
      keyword_extraction: Array<{
        keyword: string
        frequency: number
        sentiment: number
      }>
      content_depth_score: number
      vocabulary_diversity: number
    }
    
    // Fraud Detection
    fraud_detection: {
      authenticity_score: number
      suspicious_activity_indicators: string[]
      risk_level: 'low' | 'medium' | 'high'
      verification_status: 'verified' | 'suspected' | 'flagged'
    }
    
    // Audience Insights
    audience_insights: {
      demographic_predictions: {
        age_groups: Record<string, number>
        gender_distribution: Record<string, number>
        geographic_distribution: Record<string, number>
      }
      interest_mapping: Array<{
        interest: string
        affinity_score: number
      }>
      engagement_quality_score: number
    }
  }
  analyzed_at: string
  model_versions: Record<string, string>
  message: string
}

// Content Performance Analytics
export interface ContentPerformanceResponse {
  success: boolean
  performance: {
    // Top Performing Categories
    top_categories: Array<{
      category: string
      avg_engagement: number
      post_count: number
      growth_rate: number
    }>
    
    // Sentiment Timeline
    sentiment_timeline: Array<{
      date: string
      sentiment_score: number
      post_count: number
    }>
    
    // Content Recommendations
    recommendations: Array<{
      recommendation_type: 'content_type' | 'posting_time' | 'topic' | 'format'
      suggestion: string
      expected_improvement: number
      confidence: number
    }>
    
    // Engagement Prediction
    engagement_prediction: Array<{
      content_type: string
      predicted_engagement_rate: number
      confidence_interval: [number, number]
    }>
    
    // Optimal Posting
    optimal_posting: {
      best_times: Array<{
        day: string
        time: string
        expected_reach: number
      }>
      content_mix_recommendation: Record<string, number>
    }
  }
  message: string
}

// Safety & Risk Assessment
export interface SafetyAnalysisResponse {
  success: boolean
  safety: {
    brand_safety_score: number
    risk_indicators: Array<{
      type: string
      severity: 'low' | 'medium' | 'high'
      description: string
      affected_posts: string[]
    }>
    content_moderation: {
      inappropriate_content_detected: boolean
      flagged_posts: Array<{
        post_id: string
        violation_type: string
        severity: string
      }>
    }
    compliance_analysis: {
      platform_guideline_score: number
      violations: string[]
      compliance_grade: 'A' | 'B' | 'C' | 'D' | 'F'
    }
  }
  message: string
}

// Competitive Intelligence
export interface CompetitiveIntelligenceResponse {
  success: boolean
  competitive: {
    // Category Benchmarks
    category_benchmarks: {
      category: string
      user_rank: number
      total_in_category: number
      percentile: number
      benchmark_metrics: Record<string, number>
    }
    
    // Growth Potential
    growth_potential: {
      predicted_growth_rate: number
      growth_ceiling: number
      growth_factors: Array<{
        factor: string
        impact: number
      }>
    }
    
    // Market Position
    market_position: {
      market_share: number
      competitive_advantage: string[]
      improvement_opportunities: string[]
    }
    
    // Collaboration Opportunities
    collaboration_opportunities: Array<{
      username: string
      similarity_score: number
      collaboration_type: 'cross-promotion' | 'content-partnership' | 'joint-campaign'
      expected_reach: number
    }>
  }
  message: string
}

// Real-time Status & Health
export interface AnalysisStatusResponse {
  success: boolean
  status: {
    processing_status: 'idle' | 'analyzing' | 'complete' | 'error'
    progress_percentage: number
    data_freshness: {
      profile_data: string
      posts_analysis: string
      ai_insights: string
      competitive_data: string
    }
    model_confidence: Record<string, number>
    analysis_coverage: {
      posts_analyzed: number
      total_posts: number
      coverage_percentage: number
    }
  }
  message: string
}

// System Health & Model Status
export interface SystemHealthResponse {
  success: boolean
  health: {
    overall_status: 'healthy' | 'degraded' | 'unhealthy'
    model_availability: Record<string, boolean>
    processing_queue: {
      queue_length: number
      average_wait_time: number
      processing_capacity: number
    }
    system_performance: {
      response_time_ms: number
      success_rate: number
      error_rate: number
    }
  }
  timestamp: string
}

// Export & Reporting
export interface ExportRequest {
  username: string
  export_type: 'complete' | 'custom'
  date_range?: {
    start: string
    end: string
  }
  include_sections: string[]
  format: 'json' | 'csv' | 'pdf'
}

export interface ExportResponse {
  success: boolean
  export: {
    export_id: string
    download_url: string
    expires_at: string
    file_size: number
    format: string
  }
  message: string
}

// Unified Analytics Dashboard Data
export interface AnalyticsDashboardData {
  profile: EnhancedProfileResponse['profile']
  posts: PostAnalyticsResponse['posts']
  comprehensive_analysis: ComprehensiveAnalysisResponse['analysis']
  performance: ContentPerformanceResponse['performance']
  safety: SafetyAnalysisResponse['safety']
  competitive: CompetitiveIntelligenceResponse['competitive']
  status: AnalysisStatusResponse['status']
}