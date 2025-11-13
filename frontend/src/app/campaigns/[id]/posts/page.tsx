"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Share2,
  Download,
  MoreHorizontal,
  Play,
  Pause,
  StopCircle,
  Plus,
  Users,
  FileText,
  Eye,
  TrendingUp,
  MessageCircle,
  Heart,
  Image,
  Video,
  Pencil,
  X,
  Trash2,
  LinkIcon,
  FileUp,
  Copy,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { toast } from "sonner";

import { CampaignWorkflow } from "@/components/campaigns/unified/CampaignWorkflow";
import { InfluencerSelection } from "@/components/campaigns/unified/InfluencerSelection";
import { PostCard } from "@/components/campaigns/PostCard";

// Backend response interfaces (UPDATED with collaboration support)
interface BackendCampaignPost {
  id: string;
  thumbnail: string | null;
  url: string;
  type: "static" | "reel"; // Legacy field - still used but supplemented by is_video
  caption: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number; // Percentage format (e.g., 2.5 for 2.5%)

  // ENHANCED VIDEO DETECTION (NEW from backend team)
  is_video: boolean; // ✅ FIXED: Now correctly identifies video content
  media_type?: "Video" | "Image" | "Carousel"; // Enhanced media type from post analytics
  video_duration?: number; // Video duration in seconds (if video)
  video_url?: string; // Direct video URL (if available)

  // COLLABORATION SUPPORT (NEW from backend team)
  collaborators: Array<{
    username: string;
    full_name: string;
    is_verified: boolean;
    collaboration_type: 'coauthor_producer' | 'tagged_user' | 'mention';
  }>;
  is_collaboration: boolean;
  total_creators: number; // 1 for solo posts, 2+ for collaborations

  // AI Analysis (nullable for old posts)
  ai_content_category: string | null;
  ai_sentiment: "positive" | "neutral" | "negative" | null;
  ai_language_code: string | null;

  // Creator Info (Main Creator)
  creator_username: string;
  creator_full_name: string;
  creator_followers_count: number;
  creator_profile_pic_url?: string | null;
  creator_profile_pic_url_hd?: string | null;

  // Additional Metadata
  shortcode: string;
  added_at: string;
  display_url?: string; // Fallback for thumbnail
}

interface BackendCampaignDetails {
  id: string;
  name: string;
  brand_name: string;
  brand_logo_url: string | null;
  status: "active" | "completed" | "draft";
  created_at: string;
  updated_at: string;
  posts_count?: number;
  creators_count?: number;
  total_reach?: number;
  engagement_rate?: number;
}

interface BackendAudience {
  total_reach: number;
  total_creators: number;

  // AI-Estimated Demographics (may be null while processing)
  gender_distribution?: {
    FEMALE: number;
    MALE: number;
  };
  age_distribution?: {
    "18-24"?: number;
    "25-34"?: number;
    "35-44"?: number;
    "45+"?: number;
    [key: string]: number | undefined;
  };
  country_distribution?: Record<string, number>;
  city_distribution?: Record<string, number>;

  // Top Demographics (provided by backend)
  topGender?: {
    name: string;
    percentage: number;
  };
  topAgeGroup?: {
    name: string;
    percentage: number;
  };
  topCountry?: {
    name: string;
    percentage: number;
  };
  topCity?: {
    name: string;
    percentage: number;
  };
}

interface BackendCreator {
  profile_id: string;
  username: string;
  full_name: string;
  profile_pic_url: string | null;
  followers_count: number;
  posts_count: number;

  // Campaign-specific metrics (updated field names)
  posts_in_campaign: number;
  total_likes: number;
  total_comments: number;
  avg_engagement_rate: number; // Percentage format (e.g., 2.5 for 2.5%)

  // AI-Estimated Audience Demographics (nullable while processing)
  audience_demographics?: {
    gender_distribution?: { FEMALE: number; MALE: number };
    age_distribution?: Record<string, number>;
    country_distribution?: Record<string, number>;
    city_distribution?: Record<string, number>;
  };
}

interface CampaignStats {
  totalCreators: number; // UNIQUE creators count (no duplicates, includes main creators + collaborators)
  totalPosts: number;
  totalFollowers: number;
  totalReach: number; // Industry-standard estimated reach (replaces totalViews)
  overallEngagementRate: number;
  totalComments: number;
  totalLikes: number;
  postTypeBreakdown: {
    static: number;
    reels: number;
    carousel?: number; // Added for carousel support
    story: number;
  };
  // NEW COLLABORATION METRICS
  collaborationRate?: number; // Percentage of posts that are collaborations
  collaborationPosts?: number; // Number of collaboration posts
}

interface AIInsights {
  total_posts: number;
  ai_analyzed_posts: number;
  sentiment_analysis: {
    available: boolean;
    distribution?: {
      positive: number;
      neutral: number;
      negative: number;
    };
    average_score?: number;
    dominant_sentiment?: string;
  };
  language_detection: {
    available: boolean;
    total_languages?: number;
    primary_language?: string;
    top_languages?: Array<{ language: string; percentage: number }>;
  };
  category_classification: {
    available: boolean;
    total_categories?: number;
    primary_category?: string;
    average_confidence?: number;
    top_categories?: Array<{ category: string; percentage: number }>;
  };
  audience_quality: {
    available: boolean;
    average_authenticity?: number;
    average_bot_score?: number;
    quality_rating?: "high" | "medium" | "low";
  };
  visual_content: {
    available: boolean;
    aesthetic_score?: number;
    professional_quality_score?: number;
    image_quality_metrics?: {
      average_quality: number;
    };
  };
  audience_insights: {
    available: boolean;
    geographic_analysis?: {
      top_countries?: Record<string, number>;
      top_cities?: Record<string, number>;
      geographic_reach: string;
      geographic_diversity_score: number;
      international_reach: boolean;
    };
    demographic_insights?: {
      estimated_age_groups: Record<string, number>;
      estimated_gender_split: Record<string, number>;
      audience_sophistication: string;
    };
    audience_interests?: {
      interest_distribution: Record<string, number>;
      brand_affinities: Record<string, number>;
    };
    cultural_analysis?: {
      social_context: string;
      language_indicators: Record<string, number>;
    };
  };
  trend_detection: {
    available: boolean;
    average_viral_potential?: number;
    viral_rating?: "high" | "medium" | "low";
    trending_posts?: number;
  };
  advanced_nlp: {
    available: boolean;
    average_word_count?: number;
    average_readability?: number;
    average_hashtags?: number;
    total_brand_mentions?: number;
    content_depth?: "detailed" | "moderate" | "brief";
  };
  fraud_detection: {
    available: boolean;
    average_fraud_score?: number;
    risk_distribution?: {
      low: number;
      medium: number;
      high: number;
    };
    overall_trust_level?: "high" | "medium" | "low";
  };
  behavioral_patterns: {
    available: boolean;
    average_engagement_consistency?: number;
    average_posting_frequency?: number;
    consistency_rating?: "high" | "medium" | "low";
  };
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  const [campaign, setCampaign] = useState<BackendCampaignDetails | null>(null);
  const [posts, setPosts] = useState<BackendCampaignPost[]>([]);
  const [creators, setCreators] = useState<BackendCreator[]>([]);
  const [audience, setAudience] = useState<BackendAudience | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit campaign state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCampaignName, setEditCampaignName] = useState("");
  const [editBrandName, setEditBrandName] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "active" | "completed">("draft");
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Add post state (enhanced for batch upload)
  const [isAddPostDialogOpen, setIsAddPostDialogOpen] = useState(false);
  const [newPostUrl, setNewPostUrl] = useState("");
  const [batchPostUrls, setBatchPostUrls] = useState("");
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Check authentication and fetch data
  useEffect(() => {
    // Wait for auth context to load
    if (authLoading) return;

    // If no user after auth loading is complete, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // User is authenticated, fetch campaign data
    if (campaignId) {
      fetchCampaignData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, campaignId, router]);

  // POLLING DISABLED - User can manually refresh if needed
  // useEffect(() => {
  //   if (!aiInsights || aiInsights.ai_analyzed_posts === 0) return;

  //   const hasIncompleteAnalysis =
  //     aiInsights.ai_analyzed_posts < aiInsights.total_posts ||
  //     !aiInsights.sentiment_analysis.available ||
  //     !aiInsights.category_classification.available;

  //   if (hasIncompleteAnalysis) {
  //     // DISABLED: Too much server load
  //     console.log('⚠️ AI analysis polling disabled to reduce server load');
  //   }
  // }, [aiInsights]);

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);
      const { API_CONFIG } = await import("@/config/api");
      const { tokenManager } = await import("@/utils/tokenManager");
      const tokenResult = await tokenManager.getValidTokenWithRefresh();

      if (!tokenResult.isValid || !tokenResult.token) {
        router.push('/auth/login');
        return;
      }

      // 1. Fetch campaign details
      const campaignResponse = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!campaignResponse.ok) {
        if (campaignResponse.status === 404) {
          console.log('🔧 DEBUG: Campaign not found (404)');
          setCampaign(null);
          return;
        }
        throw new Error(`Campaign fetch failed: ${campaignResponse.status}`);
      }

      const campaignData = await campaignResponse.json();
      console.log('🔧 DEBUG: FULL CAMPAIGN DETAILS RESPONSE:', JSON.stringify(campaignData, null, 2));
      console.log('🔧 DEBUG: Campaign response structure keys:', Object.keys(campaignData));

      // Check for nested data structure
      let processedCampaignData = campaignData;
      if (campaignData.data) {
        console.log('🔧 DEBUG: Campaign has nested data structure');
        processedCampaignData = campaignData.data;
        console.log('🔧 DEBUG: Processed campaign data keys:', Object.keys(processedCampaignData));
      }

      // Log all available campaign fields
      console.log('🔧 DEBUG: Available campaign fields:');
      Object.keys(processedCampaignData).forEach(key => {
        console.log(`  - ${key}:`, typeof processedCampaignData[key], processedCampaignData[key]);
      });

      // Extract campaign details using processed data
      const campaignDetails: BackendCampaignDetails = {
        id: processedCampaignData.id,
        name: processedCampaignData.name,
        brand_name: processedCampaignData.brand_name,
        brand_logo_url: processedCampaignData.brand_logo_url,
        status: processedCampaignData.status,
        created_at: processedCampaignData.created_at,
        updated_at: processedCampaignData.updated_at,
        posts_count: processedCampaignData.posts_count,
        creators_count: processedCampaignData.creators_count,
        total_reach: processedCampaignData.total_reach,
        engagement_rate: processedCampaignData.engagement_rate,
      };

      console.log('🔧 DEBUG: Extracted campaign details for UI:', campaignDetails);

      // Validate interface completeness
      const requiredFields = ['id', 'name', 'brand_name', 'status', 'created_at', 'updated_at'];
      const optionalFields = ['brand_logo_url', 'posts_count', 'creators_count', 'total_reach', 'engagement_rate'];
      const allInterfaceFields = [...requiredFields, ...optionalFields];

      console.log('🔧 DEBUG: Campaign interface validation:');
      const missingRequired = requiredFields.filter(field => !processedCampaignData.hasOwnProperty(field));
      const missingOptional = optionalFields.filter(field => !processedCampaignData.hasOwnProperty(field));

      if (missingRequired.length > 0) {
        console.log('  ❌ MISSING REQUIRED FIELDS:', missingRequired);
      }
      if (missingOptional.length > 0) {
        console.log('  ⚠️ MISSING OPTIONAL FIELDS:', missingOptional);
      }
      if (missingRequired.length === 0 && missingOptional.length === 0) {
        console.log('  ✅ ALL INTERFACE FIELDS PRESENT');
      }

      // Check for any additional rich fields not in our interface
      const unusedFields = Object.keys(processedCampaignData).filter(key => !allInterfaceFields.includes(key));
      if (unusedFields.length > 0) {
        console.log('🔧 DEBUG: EXTRA CAMPAIGN FIELDS (not in interface):', unusedFields);
        unusedFields.forEach(field => {
          console.log(`  - EXTRA ${field}:`, typeof processedCampaignData[field], processedCampaignData[field]);
        });
      }

      // Check data types for critical fields
      console.log('🔧 DEBUG: Campaign data type validation:');
      console.log('  - posts_count type:', typeof processedCampaignData.posts_count, 'value:', processedCampaignData.posts_count);
      console.log('  - creators_count type:', typeof processedCampaignData.creators_count, 'value:', processedCampaignData.creators_count);
      console.log('  - total_reach type:', typeof processedCampaignData.total_reach, 'value:', processedCampaignData.total_reach);
      console.log('  - engagement_rate type:', typeof processedCampaignData.engagement_rate, 'value:', processedCampaignData.engagement_rate);

      setCampaign(campaignDetails);

      // 2. Fetch campaign posts
      const postsResponse = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/posts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let campaignPosts: BackendCampaignPost[] = [];
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        // Log basic status for monitoring
        console.log('✅ Posts API Response: Retrieved', postsData.data?.posts?.length || 0, 'posts');

        // Handle the response structure properly
        if (Array.isArray(postsData)) {
          campaignPosts = postsData;
        } else if (postsData.data) {
          // Handle {success: true, data: [...], message: "..."} format
          campaignPosts = Array.isArray(postsData.data) ? postsData.data : (postsData.data.posts || []);
        } else {
          // Fallback to old structure
          campaignPosts = postsData.posts || [];
        }

        // Enhance posts data with missing fields for better UI compatibility
        campaignPosts = campaignPosts.map(post => ({
          ...post,
          // Add is_video field based on media_type if missing
          is_video: post.is_video ?? (post.media_type === "Video" || post.type === "reel"),
          // Calculate engagement rate if missing (likes + comments) / views * 100
          engagementRate: post.engagementRate > 0 ? post.engagementRate :
            post.views > 0 ? ((post.likes + post.comments) / post.views) * 100 : 0
        }));

        console.log('✅ Enhanced Posts: Applied video detection and engagement rate fixes to', campaignPosts.length, 'posts');
      } else {
        console.log('❌ Posts fetch failed:', postsResponse.status);
      }
      setPosts(campaignPosts);

      // 3. Fetch campaign analytics (optional)
      try {
        const analyticsResponse = await fetch(
          `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/analytics`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${tokenResult.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          console.log('✅ Analytics API Response: Retrieved campaign analytics data');

          // Handle analytics data parsing similar to posts
          let processedAnalyticsData = analyticsData;
          if (analyticsData.data) {
            // Handle {success: true, data: {...}} format
            processedAnalyticsData = analyticsData.data;
          }

          // Extract audience data from analytics totals (backend sends it in this structure)
          if (processedAnalyticsData.totals) {
            const audienceData = {
              total_reach: processedAnalyticsData.totals.total_reach || 0,
              total_creators: campaignPosts.length > 0 ? new Set(campaignPosts.map(p => p.creator_username)).size : 0,
              // Add any demographic data if available in the analytics structure
              ...(processedAnalyticsData.demographics && { demographics: processedAnalyticsData.demographics }),
              ...(processedAnalyticsData.audience_insights && { insights: processedAnalyticsData.audience_insights })
            };
            console.log('✅ Audience Data: Extracted from analytics totals - reach:', audienceData.total_reach);
            setAudience(audienceData);
          }

          // Extract performance insights from analytics (backend sends rich performance data)
          if (processedAnalyticsData.performance_insights) {
            console.log('✅ Performance Insights: Available');
          }

          // Extract daily stats for trend analysis
          if (processedAnalyticsData.daily_stats && Array.isArray(processedAnalyticsData.daily_stats)) {
            console.log('✅ Daily Stats: Available for', processedAnalyticsData.daily_stats.length, 'days');
          }

          // Set AI insights if available
          if (processedAnalyticsData.ai_insights) {
            setAiInsights(processedAnalyticsData.ai_insights);
          }

          // Set creators data if available
          if (processedAnalyticsData.creators) {
            setCreators(processedAnalyticsData.creators);
          }
        } else {
          console.log('❌ Analytics fetch failed:', analyticsResponse.status);
        }
      } catch (analyticsError) {
        console.log('⚠️ Analytics fetch error (non-critical):', analyticsError);
      }

      // Calculate stats from real data
      if (campaignPosts.length > 0) {
        const postTypes = {
          static: campaignPosts.filter(p => p.type === "static" || p.media_type === "Image").length,
          reels: campaignPosts.filter(p => p.type === "reel" || p.media_type === "Video" || p.is_video === true).length,
          carousel: campaignPosts.filter(p => p.media_type === "Carousel").length,
          story: 0
        };

        console.log('✅ Post Types Calculated:', postTypes);

        const totalLikes = campaignPosts.reduce((sum, post) => sum + post.likes, 0);
        const totalComments = campaignPosts.reduce((sum, post) => sum + post.comments, 0);
        const avgEngagement = campaignPosts.length > 0
          ? campaignPosts.reduce((sum, post) => sum + post.engagementRate, 0) / campaignPosts.length
          : 0;

        // Get unique creators from posts
        const uniqueCreators = new Set(campaignPosts.map(p => p.creator_username));
        const totalFollowers = campaignPosts.reduce((sum, post) => sum + post.creator_followers_count, 0);
        const collaborationPosts = campaignPosts.filter(p => p.is_collaboration).length;
        const collaborationRate = campaignPosts.length > 0 ? (collaborationPosts / campaignPosts.length) * 100 : 0;

        // Calculate estimated reach
        const totalReach = calculateCampaignReach(campaignPosts);

        console.log('✅ Campaign Stats:', {
          posts: campaignPosts.length,
          creators: uniqueCreators.size,
          reach: totalReach,
          engagement: `${avgEngagement.toFixed(2)}%`
        });

        setStats({
          totalCreators: uniqueCreators.size,
          totalPosts: campaignPosts.length,
          totalFollowers,
          totalReach: totalReach || campaignDetails.total_reach || 0,
          overallEngagementRate: avgEngagement,
          totalComments,
          totalLikes,
          postTypeBreakdown: postTypes,
          collaborationRate,
          collaborationPosts,
        });
      } else {
        // No posts yet - set empty stats
        setStats({
          totalCreators: 0,
          totalPosts: 0,
          totalFollowers: 0,
          totalReach: 0,
          overallEngagementRate: 0,
          totalComments: 0,
          totalLikes: 0,
          postTypeBreakdown: {
            static: 0,
            reels: 0,
            carousel: 0,
            story: 0
          },
          collaborationRate: 0,
          collaborationPosts: 0,
        });
      }

    } catch (error: any) {
      console.error("Campaign data fetch error:", error);

      // Handle authentication errors
      if (error.message?.includes('authentication') || error.message?.includes('token') || error.message?.includes('401')) {
        router.push('/auth/login');
        return;
      }

      // For other errors, show user feedback but don't crash
      toast.error('Failed to load campaign data. Please try refreshing the page.');

      // Set empty state if campaign not found
      if (error.message?.includes('404')) {
        setCampaign(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // ========================================================================
  // REACH CALCULATION UTILITIES (Industry-Standard Estimation)
  // ========================================================================

  const calculateEstimatedReach = (post: BackendCampaignPost, followerCount: number): number => {
    const followers = followerCount;
    const likes = post.likes;
    const comments = post.comments;

    // Method 1: Engagement-based reach estimation
    const totalEngagement = likes + comments;
    if (followers === 0) return totalEngagement * 100; // Much better fallback

    // For organic posts, reach should be MINIMUM 20% of followers (Instagram reality)
    const baseReachRate = 0.25; // 25% minimum organic reach
    const followerBasedReach = followers * baseReachRate;

    // Engagement-based estimation (much more aggressive)
    const engagementBasedReach = totalEngagement * 50; // Way higher multiplier

    // Use the HIGHER of the two estimates - reach should be substantial!
    const estimatedReach = Math.max(
      followerBasedReach,     // At least 25% of followers
      engagementBasedReach,   // Or 50x engagement
      followers * 0.15        // Absolute minimum 15% of followers
    );

    // Cap at reasonable maximum but allow for viral content
    const maxReach = followers * 1.5; // Can reach 150% of followers (viral/shares)

    return Math.round(Math.min(estimatedReach, maxReach));
  };

  const calculateVideoReach = (post: BackendCampaignPost, followerCount: number): number => {
    if (!post.is_video || !post.views) {
      return calculateEstimatedReach(post, followerCount);
    }

    // For videos, views are a direct reach indicator
    const videoViews = post.views;
    const followers = followerCount;

    // Videos get MUCH better reach than static posts
    const baseReach = Math.max(
      videoViews,           // Full view count as reach
      followers * 0.4,      // Minimum 40% of followers for videos
      post.likes * 100      // Or 100x likes (videos get shared more)
    );

    // Videos can go viral - allow much higher reach
    const maxReach = Math.max(followers * 5, videoViews * 1.2); // 5x followers or 120% of views

    return Math.round(Math.min(baseReach, maxReach));
  };

  const calculatePostReach = (post: BackendCampaignPost): number => {
    const mainCreatorFollowers = post.creator_followers_count;

    // Calculate base reach for main creator
    let totalReach = post.is_video
      ? calculateVideoReach(post, mainCreatorFollowers)
      : calculateEstimatedReach(post, mainCreatorFollowers);

    // Add collaborator reach (with overlap reduction)
    if (post.is_collaboration && post.collaborators) {
      for (const collaborator of post.collaborators) {
        if (collaborator.collaboration_type === 'coauthor_producer') {
          // Estimate collaborator followers (we don't have this data, so estimate based on engagement)
          const estimatedCollabFollowers = (post.likes + post.comments) * 20; // Rough estimate
          const collabReach = calculateEstimatedReach(post, estimatedCollabFollowers);
          // Assume 30% overlap between audiences
          totalReach += collabReach * 0.7;
        }
      }
    }

    return Math.round(totalReach);
  };

  const calculateCampaignReach = (posts: BackendCampaignPost[]): number => {
    if (posts.length === 0) return 0;

    let totalReach = 0;
    const creatorReachMap = new Map<string, number>();

    // Calculate reach per creator (to avoid double-counting same creator's audience)
    for (const post of posts) {
      const postReach = calculatePostReach(post);
      const creator = post.creator_username;

      // Track the highest reach for each creator (don't sum multiple posts from same creator)
      const currentCreatorReach = creatorReachMap.get(creator) || 0;
      creatorReachMap.set(creator, Math.max(currentCreatorReach, postReach));

      // For collaborators, add their estimated contribution
      if (post.collaborators) {
        post.collaborators.forEach(collaborator => {
          if (collaborator.collaboration_type === 'coauthor_producer') {
            const collabKey = collaborator.username;
            const estimatedCollabReach = postReach * 0.3; // Assume collaborator contributes 30% additional reach
            const currentCollabReach = creatorReachMap.get(collabKey) || 0;
            creatorReachMap.set(collabKey, Math.max(currentCollabReach, estimatedCollabReach));
          }
        });
      }
    }

    // Sum up unique creator reaches
    totalReach = Array.from(creatorReachMap.values()).reduce((sum, reach) => sum + reach, 0);

    // NO DEDUPLICATION - reach should be ADDITIVE across creators!
    // Multiple creators = MORE reach, not less!
    // Only apply a slight boost for multi-creator campaigns
    const uniqueCreators = creatorReachMap.size;
    const reachMultiplier = uniqueCreators > 1 ? 1.2 : 1; // 20% BOOST for multi-creator campaigns

    return Math.round(totalReach * reachMultiplier);
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "static":
        return <Image className="h-3 w-3" />;
      case "reels":
        return <Video className="h-3 w-3" />;
      case "carousel":
        return <FileText className="h-3 w-3" />;
      case "story":
        return <Share2 className="h-3 w-3" />;
      default:
        return <Image className="h-3 w-3" />;
    }
  };

  // Use backend-provided top demographics
  const getTopAgeGroup = () => {
    if (!audience?.topAgeGroup) return { range: "N/A", percentage: 0, isLoading: !audience };
    return { range: audience.topAgeGroup.name, percentage: audience.topAgeGroup.percentage, isLoading: false };
  };

  const getTopGender = () => {
    if (!audience?.topGender) return { gender: "N/A", percentage: 0, isLoading: !audience };
    // Display friendly name (FEMALE -> Female, MALE -> Male)
    const displayName = audience.topGender.name === "FEMALE" ? "Female" : "Male";
    return { gender: displayName, percentage: audience.topGender.percentage, isLoading: false };
  };

  const getTopCountry = () => {
    if (!audience?.topCountry) return { name: "N/A", isLoading: !audience };
    return { name: audience.topCountry.name, isLoading: false };
  };

  const handleOpenEditDialog = () => {
    if (campaign) {
      setEditCampaignName(campaign.name);
      setEditBrandName(campaign.brand_name);
      setEditStatus(campaign.status as "draft" | "active" | "completed");
      setLogoPreview(campaign.brand_logo_url || "");
      setNewLogo(null);
      setIsEditDialogOpen(true);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > MAX_SIZE) {
        toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
        e.target.value = ""; // Reset file input
        return;
      }

      // Validate file type
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload PNG, JPEG, or WEBP.");
        e.target.value = ""; // Reset file input
        return;
      }

      setNewLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = async () => {
    if (!campaign) return;

    if (!confirm("Are you sure you want to delete the logo?")) return;

    try {
      const { API_CONFIG } = await import("@/config/api");
      const { tokenManager } = await import("@/utils/tokenManager");
      const tokenResult = await tokenManager.getValidTokenWithRefresh();

      if (!tokenResult.isValid || !tokenResult.token) {
        toast.error("Please log in again");
        return;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/logo`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete logo");
      }

      // Update local state
      setCampaign({ ...campaign, brand_logo_url: null });
      setLogoPreview("");
      toast.success("Logo deleted successfully");
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast.error("Failed to delete logo");
    }
  };

  const handleSaveChanges = async () => {
    if (!campaign) return;

    setIsSaving(true);
    try {
      const { API_CONFIG } = await import("@/config/api");
      const { tokenManager } = await import("@/utils/tokenManager");
      const tokenResult = await tokenManager.getValidTokenWithRefresh();

      if (!tokenResult.isValid || !tokenResult.token) {
        toast.error("Please log in again");
        return;
      }

      const token = tokenResult.token;

      // Build update payload with all changed fields
      const updatePayload: Record<string, any> = {};

      if (editCampaignName !== campaign.name) {
        updatePayload.name = editCampaignName;
      }

      if (editBrandName !== campaign.brand_name) {
        updatePayload.brand_name = editBrandName;
      }

      if (editStatus !== campaign.status) {
        updatePayload.status = editStatus;
      }

      // Update campaign if any fields changed
      if (Object.keys(updatePayload).length > 0) {
        const updateResponse = await fetch(
          `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
          }
        );

        if (!updateResponse.ok) {
          throw new Error("Failed to update campaign");
        }
      }

      // Handle logo upload
      let updatedLogoUrl = campaign.brand_logo_url;
      if (newLogo) {
        const logoFormData = new FormData();
        logoFormData.append("logo", newLogo);

        const logoResponse = await fetch(
          `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/logo`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: logoFormData,
          }
        );

        if (!logoResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const logoResult = await logoResponse.json();
        updatedLogoUrl = logoResult.data?.brand_logo_url || logoPreview;
      }

      // Update local state with all changes
      setCampaign({
        ...campaign,
        name: editCampaignName,
        brand_name: editBrandName,
        status: editStatus,
        brand_logo_url: updatedLogoUrl,
      });

      setIsEditDialogOpen(false);
      toast.success("Campaign updated successfully");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPost = async () => {
    if (uploadMode === 'single') {
      return handleSinglePostAdd();
    } else {
      return handleBatchPostAdd();
    }
  };

  const handleSinglePostAdd = async () => {
    if (!newPostUrl.trim()) {
      toast.error("Please enter a post URL");
      return;
    }

    setIsSaving(true);
    try {
      const { API_CONFIG } = await import("@/config/api");
      const { tokenManager } = await import("@/utils/tokenManager");
      const tokenResult = await tokenManager.getValidTokenWithRefresh();

      if (!tokenResult.isValid || !tokenResult.token) {
        toast.error("Please log in again");
        return;
      }

      // Use correct field name: instagram_post_url (snake_case)
      const postsPayload = {
        instagram_post_url: newPostUrl.trim(),
      };

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/posts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postsPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to add post");
      }

      toast.success("Post added successfully!", {
        duration: 5000,
      });
      setNewPostUrl("");
      setIsAddPostDialogOpen(false);

      // Refresh campaign data to show new post
      console.log("🔧 DEBUG: Post added successfully, refreshing campaign data...");
      await fetchCampaignData();
      console.log("🔧 DEBUG: Campaign data refreshed after adding post");
    } catch (error) {
      console.error("Error adding post:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add post";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatchPostAdd = async () => {
    const urls = batchPostUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      toast.error("Please enter at least one post URL");
      return;
    }

    if (urls.length > 50) {
      toast.error("Maximum 50 posts allowed per batch");
      return;
    }

    setIsProcessingBatch(true);
    setBatchProgress({ current: 0, total: urls.length });

    try {
      const { postAnalyticsApi } = await import("@/services/postAnalyticsApi");

      // Process batch with progress tracking
      const result = await postAnalyticsApi.processBatch(urls, {
        campaignId,
        maxConcurrent: 3,
        onProgress: (completed, total) => {
          setBatchProgress({ current: completed, total });
        },
        onWarning: (message) => {
          toast.warning(message, { duration: 8000 });
        }
      });

      if (result.success && result.data) {
        const { summary } = result.data;

        if (summary.successful > 0) {
          toast.success(
            `✅ Successfully added ${summary.successful}/${summary.total_requested} posts to campaign!`,
            { duration: 6000 }
          );
        }

        if (summary.failed > 0) {
          toast.error(
            `❌ ${summary.failed} posts failed to process. Check URLs and try again.`,
            { duration: 6000 }
          );
        }

        // Clear form and close dialog
        setBatchPostUrls("");
        setIsAddPostDialogOpen(false);

        // Refresh campaign data to show new posts
        fetchCampaignData();
      } else {
        throw new Error(result.message || "Batch processing failed");
      }
    } catch (error) {
      console.error("Error processing batch:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process batch";
      toast.error(errorMessage);
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress(null);
    }
  };

  // Show consistent loading state to prevent hydration mismatch
  if (authLoading || isLoading || !user) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading campaign...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!campaign) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="container mx-auto py-8 px-4">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Campaign not found</p>
                <Button className="mt-4" onClick={() => router.push("/campaigns")}>
                  Back to Campaigns
                </Button>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

  const topAgeGroup = getTopAgeGroup();
  const topGender = getTopGender();
  const topCountry = getTopCountry();

  return (
    <AuthGuard>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={campaign.brand_logo_url || ""} />
              <AvatarFallback>{campaign.brand_name ? campaign.brand_name.substring(0, 2).toUpperCase() : 'BR'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
                <Button variant="ghost" size="icon" onClick={handleOpenEditDialog}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{campaign.brand_name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{campaign.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : 'Draft'}</Badge>
          <Button
            variant="default"
            onClick={() => setIsAddPostDialogOpen(true)}
            className="h-10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Posts
          </Button>
          <Button variant="outline" className="h-10">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="stats">Analytics</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        {/* AI Analysis Progress Indicator */}
        {aiInsights && aiInsights.ai_analyzed_posts < aiInsights.total_posts && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <div className="font-medium">AI Analysis in Progress</div>
                  <div className="text-sm text-muted-foreground">
                    Analyzing {aiInsights.total_posts} posts... {aiInsights.ai_analyzed_posts}/{aiInsights.total_posts} complete
                  </div>
                </div>
                <Badge variant="secondary">
                  {Math.round((aiInsights.ai_analyzed_posts / aiInsights.total_posts) * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaign Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <CampaignWorkflow
            campaignId={campaignId}
            currentStage={campaign?.status === "active" ? "influencer_selection" : "proposal"}
            isAgencyClient={user?.role === 'premium' || user?.role === 'enterprise'}
          />
        </TabsContent>

        {/* Campaign Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Primary Metrics - Enhanced with Collaboration Support */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCreators || campaign?.creators_count || 0}</div>
                {stats && stats.totalCreators > (campaign?.creators_count || 0) && (
                  <p className="text-xs text-muted-foreground mt-1">Unique creators (no duplicates)</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign?.posts_count || stats?.totalPosts || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.totalFollowers || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Combined followers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Reach</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.totalReach || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Industry-standard estimation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign?.engagement_rate !== undefined
                    ? `${Math.min(campaign.engagement_rate, 100).toFixed(2)}%`
                    : stats?.overallEngagementRate
                    ? `${Math.min(stats.overallEngagementRate, 100).toFixed(2)}%`
                    : '0.0%'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Campaign average</p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.totalComments || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.totalLikes || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collaboration Metrics - NEW (Matching Theme Colors) */}
          {stats && (stats.collaborationRate || 0) > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Collaboration Rate</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {stats.collaborationRate?.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-xs text-primary/70 mt-1">Posts with multiple creators</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Collaboration Posts</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {stats.collaborationPosts || 0}
                  </div>
                  <p className="text-xs text-primary/70 mt-1">
                    of {stats.totalPosts} total posts
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Temporary notice while backend implements collaboration support
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Enhanced Collaboration Support</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Frontend ready for collaboration detection! Backend team is implementing collaboration fields.
                      <br />
                      Expected features: Multi-creator posts, collaboration rate, enhanced analytics.
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Post Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Static Posts</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {stats?.postTypeBreakdown.static || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Reels</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {stats?.postTypeBreakdown.reels || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Stories</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {stats?.postTypeBreakdown.story || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Content Intelligence */}
          {aiInsights && aiInsights.total_posts > 0 && (
            <>
              {/* Content Quality & Authenticity */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Quality & Authenticity</CardTitle>
                </CardHeader>
                <CardContent>
                  {!aiInsights.audience_quality?.available && !aiInsights.visual_content?.available && !aiInsights.fraud_detection?.available ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <div className="text-sm">AI analysis in progress...</div>
                      <p className="text-xs mt-2">Quality metrics will appear shortly</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                      {aiInsights.audience_quality?.available && (
                        <div className="p-4 border rounded-lg space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Authenticity Score</div>
                          <div className="text-2xl font-bold">
                            {aiInsights.audience_quality.average_authenticity?.toFixed(1)}%
                          </div>
                          <Badge variant={
                            aiInsights.audience_quality.quality_rating === "high" ? "default" :
                            aiInsights.audience_quality.quality_rating === "medium" ? "secondary" : "outline"
                          }>
                            {aiInsights.audience_quality.quality_rating?.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                      {aiInsights.visual_content?.available && (
                        <div className="p-4 border rounded-lg space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Visual Quality</div>
                          <div className="text-2xl font-bold">
                            {aiInsights.visual_content.aesthetic_score?.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Professional: {aiInsights.visual_content.professional_quality_score?.toFixed(1)}
                          </div>
                        </div>
                      )}
                      {aiInsights.fraud_detection?.available && (
                        <div className="p-4 border rounded-lg space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Trust Level</div>
                          <div className="text-2xl font-bold">
                            {(100 - (aiInsights.fraud_detection.average_fraud_score || 0)).toFixed(0)}%
                          </div>
                          <Badge variant={
                            aiInsights.fraud_detection.overall_trust_level === "high" ? "default" :
                            aiInsights.fraud_detection.overall_trust_level === "medium" ? "secondary" : "outline"
                          }>
                            {aiInsights.fraud_detection.overall_trust_level?.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sentiment & Category Analysis */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Sentiment Distribution */}
                {aiInsights.sentiment_analysis?.available && aiInsights.sentiment_analysis?.distribution && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Positive</span>
                          <span className="text-sm font-bold">
                            {aiInsights.sentiment_analysis.distribution.positive.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${aiInsights.sentiment_analysis.distribution.positive}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Neutral</span>
                          <span className="text-sm font-bold">
                            {aiInsights.sentiment_analysis.distribution.neutral.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${aiInsights.sentiment_analysis.distribution.neutral}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Negative</span>
                          <span className="text-sm font-bold">
                            {aiInsights.sentiment_analysis.distribution.negative.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${aiInsights.sentiment_analysis.distribution.negative}%` }}
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground">Dominant Sentiment</div>
                        <div className="text-lg font-bold capitalize">
                          {aiInsights.sentiment_analysis.dominant_sentiment}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Category Classification */}
                {aiInsights.category_classification?.available && aiInsights.category_classification?.top_categories && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {aiInsights.category_classification.top_categories.slice(0, 5).map((cat) => (
                        <div key={cat.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{cat.category}</span>
                            <span className="text-sm font-bold">{cat.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Viral Potential & Content Depth */}
              <div className="grid gap-4 md:grid-cols-3">
                {aiInsights.trend_detection?.available && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Viral Potential</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {aiInsights.trend_detection.average_viral_potential?.toFixed(1)}/100
                      </div>
                      <Badge className="mt-2" variant={
                        aiInsights.trend_detection.viral_rating === "high" ? "default" :
                        aiInsights.trend_detection.viral_rating === "medium" ? "secondary" : "outline"
                      }>
                        {aiInsights.trend_detection.viral_rating?.toUpperCase()}
                      </Badge>
                    </CardContent>
                  </Card>
                )}

                {aiInsights.advanced_nlp?.available && (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Content Depth</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {aiInsights.advanced_nlp.average_word_count?.toFixed(0)} words
                        </div>
                        <Badge className="mt-2" variant="secondary">
                          {aiInsights.advanced_nlp.content_depth?.toUpperCase()}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Brand Mentions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {aiInsights.advanced_nlp.total_brand_mentions || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Avg. {aiInsights.advanced_nlp.average_hashtags?.toFixed(0)} hashtags
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No audience data available yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Add posts to your campaign to see audience insights.</p>
              </CardContent>
            </Card>
          ) : (
            <>
          {/* Top Demographics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Top Gender</CardTitle>
              </CardHeader>
              <CardContent>
                {topGender.isLoading ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Analyzing demographics...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{topGender.gender}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(topGender.percentage ?? 0).toFixed(1)}% of audience
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Top Age Group</CardTitle>
              </CardHeader>
              <CardContent>
                {topAgeGroup.isLoading ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Analyzing demographics...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{topAgeGroup.range}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(topAgeGroup.percentage ?? 0).toFixed(1)}% of audience
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Audience Insights */}
          {aiInsights && aiInsights.total_posts > 0 && aiInsights.audience_insights?.available && (
            <>
              {/* Geographic Distribution */}
              {aiInsights.audience_insights.geographic_analysis &&
               aiInsights.audience_insights.geographic_analysis.top_countries &&
               typeof aiInsights.audience_insights.geographic_analysis.top_countries === 'object' &&
               Object.keys(aiInsights.audience_insights.geographic_analysis.top_countries).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Audience Geographic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(aiInsights.audience_insights.geographic_analysis.top_countries)
                        .filter(([, percentage]) => percentage >= 5)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([country, percentage]) => (
                          <div key={country} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{country}</span>
                            <span className="text-sm">{percentage.toFixed(1)}%</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Demographic Insights - Age Distribution */}
              {aiInsights.audience_insights.demographic_insights &&
               aiInsights.audience_insights.demographic_insights.estimated_age_groups &&
               typeof aiInsights.audience_insights.demographic_insights.estimated_age_groups === 'object' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Audience Age Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(aiInsights.audience_insights.demographic_insights.estimated_age_groups)
                        .sort(([a], [b]) => {
                          const aNum = parseInt(a.split('-')[0]);
                          const bNum = parseInt(b.split('-')[0]);
                          return aNum - bNum;
                        })
                        .map(([age, percentage]) => (
                          <div key={age} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{age} years</span>
                            <span className="text-sm">{(percentage * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gender Distribution and Audience Interests - Single Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Audience Gender */}
                {aiInsights.audience_insights.demographic_insights &&
                 aiInsights.audience_insights.demographic_insights.estimated_gender_split &&
                 typeof aiInsights.audience_insights.demographic_insights.estimated_gender_split === 'object' && (() => {
                  const genderData = Object.entries(aiInsights.audience_insights.demographic_insights.estimated_gender_split)
                    .filter(([gender]) => gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female');
                  const malePercentage = (genderData.find(([g]) => g.toLowerCase() === 'male')?.[1] || 0) * 100;
                  const femalePercentage = (genderData.find(([g]) => g.toLowerCase() === 'female')?.[1] || 0) * 100;
                  return (
                    <Card>
                      <CardHeader className="items-center">
                        <CardTitle>Audience Gender</CardTitle>
                        <CardDescription>Gender distribution of campaign audience</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-muted-foreground">Male</div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold" style={{ color: "#3b82f6" }}>
                                  {malePercentage.toFixed(0)}
                                </span>
                                <span className="text-lg text-muted-foreground">%</span>
                              </div>
                            </div>
                          </div>
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-muted-foreground">Female</div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold" style={{ color: "#ec4899" }}>
                                  {femalePercentage.toFixed(0)}
                                </span>
                                <span className="text-lg text-muted-foreground">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Audience Interests */}
                {aiInsights.audience_insights.audience_interests?.interest_distribution &&
                 typeof aiInsights.audience_insights.audience_interests.interest_distribution === 'object' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Audience Interests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(aiInsights.audience_insights.audience_interests.interest_distribution)
                          .slice(0, 5)
                          .map(([interest, percentage]) => (
                            <div key={interest} className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">{interest}</span>
                              <span className="text-sm">{(percentage * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
            </>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Campaign Posts</h2>
              <p className="text-muted-foreground">
                {posts.length} {posts.length === 1 ? "post" : "posts"} in this campaign
              </p>
            </div>
            <Button onClick={() => setIsAddPostDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Post
            </Button>
          </div>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding posts to track campaign performance
                </p>
                <Button onClick={() => setIsAddPostDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
              {posts.map((post) => (
                <PostCard
                  key={`${post.id}-${post.engagementRate?.toFixed(2)}`}
                  post={post}
                  onRemove={async (postId) => {
                    if (!confirm("Remove this post from the campaign?")) return;

                    try {
                      const { API_CONFIG } = await import("@/config/api");
                      const { tokenManager } = await import("@/utils/tokenManager");

                      const tokenResult = await tokenManager.getValidToken();
                      if (!tokenResult.isValid || !tokenResult.token) {
                        toast.error("Please log in again");
                        return;
                      }

                      const response = await fetch(
                        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/posts/${postId}`,
                        {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${tokenResult.token}`,
                          },
                        }
                      );

                      if (!response.ok) {
                        throw new Error("Failed to remove post");
                      }

                      toast.success("Post removed from campaign");
                      fetchCampaignData();
                    } catch (error) {
                      console.error("Error removing post:", error);
                      toast.error("Failed to remove post");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update campaign details, brand name, status, and logo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-name">Campaign Name</Label>
              <Input
                id="edit-campaign-name"
                value={editCampaignName}
                onChange={(e) => setEditCampaignName(e.target.value)}
              />
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-brand-name">Brand Name</Label>
              <Input
                id="edit-brand-name"
                value={editBrandName}
                onChange={(e) => setEditBrandName(e.target.value)}
              />
            </div>

            {/* Campaign Status */}
            <div className="space-y-2">
              <Label htmlFor="edit-status">Campaign Status</Label>
              <Select value={editStatus} onValueChange={(value: "draft" | "active" | "completed") => setEditStatus(value)}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logo Management */}
            <div className="space-y-2">
              <Label>Brand Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="h-20 w-20 rounded-lg border overflow-hidden relative group">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview("");
                        setNewLogo(null);
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="cursor-pointer"
                  />
                  {campaign?.brand_logo_url && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteLogo}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Logo
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPEG, or WEBP (max 5MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Add Post Dialog with Batch Support */}
      <Dialog open={isAddPostDialogOpen} onOpenChange={(open) => {
        setIsAddPostDialogOpen(open);
        if (!open) {
          // Reset form when closing
          setNewPostUrl("");
          setBatchPostUrls("");
          setUploadMode('single');
          setBatchProgress(null);
          setIsProcessingBatch(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Posts to Campaign</DialogTitle>
            <DialogDescription>
              Add single posts or upload multiple posts at once (up to 50 posts)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Upload Mode Selector */}
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Upload Mode:</Label>
              <div className="flex gap-2">
                <Button
                  variant={uploadMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('single')}
                  disabled={isProcessingBatch}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Single Post
                </Button>
                <Button
                  variant={uploadMode === 'batch' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('batch')}
                  disabled={isProcessingBatch}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Batch Upload
                </Button>
              </div>
            </div>

            {/* Single Post Mode */}
            {uploadMode === 'single' && (
              <div className="space-y-3">
                <Label htmlFor="single-post-url">Instagram Post URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="single-post-url"
                    placeholder="https://instagram.com/p/CXXXxxxxxx/"
                    value={newPostUrl}
                    onChange={(e) => setNewPostUrl(e.target.value)}
                    className="pl-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPost();
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a single Instagram post URL (reels, photos, or carousels)
                </p>
              </div>
            )}

            {/* Batch Upload Mode */}
            {uploadMode === 'batch' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-post-urls">Multiple Instagram Post URLs</Label>
                  <Badge variant="outline" className="text-xs">
                    Max 50 posts
                  </Badge>
                </div>
                <Textarea
                  id="batch-post-urls"
                  placeholder={`Paste multiple Instagram URLs, one per line:

https://instagram.com/p/ABC123/
https://instagram.com/p/XYZ789/
https://instagram.com/reel/DEF456/
...`}
                  value={batchPostUrls}
                  onChange={(e) => setBatchPostUrls(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {batchPostUrls.split('\n').filter(line => line.trim()).length} URLs entered
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.readText().then(text => {
                        setBatchPostUrls(text);
                      }).catch(() => {
                        toast.error("Failed to paste from clipboard");
                      });
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Paste
                  </Button>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>⏱️ Processing Time:</strong> Large batches may take 30-60+ minutes.
                    New creators require additional time for profile analysis.
                    You can safely close this tab - processing continues in background.
                  </p>
                </div>
              </div>
            )}

            {/* Batch Progress */}
            {isProcessingBatch && batchProgress && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Processing Posts...
                  </span>
                  <span className="text-sm text-blue-700">
                    {batchProgress.current}/{batchProgress.total}
                  </span>
                </div>
                <Progress
                  value={(batchProgress.current / batchProgress.total) * 100}
                  className="h-2"
                />
                <p className="text-xs text-blue-700">
                  This may take several minutes. Processing continues even if you close this dialog.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddPostDialogOpen(false)}
              disabled={isSaving || isProcessingBatch}
            >
              {isProcessingBatch ? "Close" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddPost}
              disabled={isSaving || isProcessingBatch}
            >
              {isSaving || isProcessingBatch ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadMode === 'batch' ? "Processing Batch..." : "Adding Post..."}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {uploadMode === 'batch' ? "Process Batch" : "Add Post"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
