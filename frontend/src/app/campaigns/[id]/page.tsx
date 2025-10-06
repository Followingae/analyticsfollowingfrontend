"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { ArrowLeft, Users, FileText, Eye, TrendingUp, Heart, MessageCircle, Image, Video, Share2, Plus, Pencil, Upload, Trash2, X, Link as LinkIcon, Loader2, MoreVertical, Download } from "lucide-react";
import { toast } from "sonner";
import { AudienceBarChart } from "@/components/campaigns/AudienceBarChart";
import { InterestsRadarChart } from "@/components/campaigns/InterestsRadarChart";
import { PostCard } from "@/components/campaigns/PostCard";
import { CampaignPDFExportButton, downloadCampaignPDF } from "@/components/campaigns/CampaignPDFExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";

// Backend response interfaces
interface BackendCampaignPost {
  id: string;
  thumbnail: string | null;
  url: string;
  type: "static" | "reel";
  caption: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number; // Percentage format (e.g., 2.5 for 2.5%)

  // AI Analysis (nullable for old posts)
  ai_content_category: string | null;
  ai_sentiment: "positive" | "neutral" | "negative" | null;
  ai_language_code: string | null;

  // Creator Info
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
  totalCreators: number;
  totalPosts: number;
  totalFollowers: number;
  totalReach: number;
  totalViews: number;
  overallEngagementRate: number;
  totalComments: number;
  totalLikes: number;
  postTypeBreakdown: {
    static: number;
    reels: number;
    story: number;
  };
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

  // Add post state
  const [isAddPostDialogOpen, setIsAddPostDialogOpen] = useState(false);
  const [newPostUrl, setNewPostUrl] = useState("");

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

  // Polling for AI insights when posts are being analyzed
  useEffect(() => {
    if (!aiInsights || aiInsights.ai_analyzed_posts === 0) return;

    const hasIncompleteAnalysis =
      aiInsights.ai_analyzed_posts < aiInsights.total_posts ||
      !aiInsights.sentiment_analysis.available ||
      !aiInsights.category_classification.available;

    if (hasIncompleteAnalysis) {
      const pollInterval = setInterval(() => {
        fetchCampaignData();
      }, 10000); // Poll every 10 seconds

      // Stop polling after 3 minutes
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
      }, 180000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [aiInsights]);

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);

      const { API_CONFIG } = await import("@/config/api");
      const { fetchWithAuth } = await import("@/utils/apiInterceptor");

      // Fetch campaign details, posts, creators, audience, and AI insights in parallel
      // Add timestamp to prevent caching issues
      const timestamp = Date.now();
      const [campaignRes, postsRes, creatorsRes, audienceRes, aiInsightsRes] = await Promise.all([
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}?t=${timestamp}`),
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/posts?t=${timestamp}`),
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/creators?t=${timestamp}`),
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/audience?t=${timestamp}`),
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ai-insights?t=${timestamp}`),
      ]);

      const campaignData = await campaignRes.json();
      const postsData = await postsRes.json();
      const creatorsData = await creatorsRes.json();
      const audienceData = await audienceRes.json();

      console.log("📊 Campaign data received:", campaignData.data);
      console.log("  - creators_count:", campaignData.data?.creators_count);
      console.log("  - posts_count:", campaignData.data?.posts_count);
      console.log("  - total_reach:", campaignData.data?.total_reach);
      console.log("  - engagement_rate:", campaignData.data?.engagement_rate);

      // Fetch AI insights with error handling
      let aiInsightsData = null;
      try {
        if (aiInsightsRes.ok) {
          aiInsightsData = await aiInsightsRes.json();
          console.log("AI Insights loaded:", aiInsightsData);
        } else {
          console.warn("AI Insights endpoint returned error:", aiInsightsRes.status);
        }
      } catch (err) {
        console.warn("AI Insights not available yet:", err);
      }

      // Check if demographics are missing
      const hasCreators = creatorsData.data.creators?.length > 0;
      const hasNoDemographics = !audienceData.data?.topGender && !audienceData.data?.topAgeGroup;

      if (hasCreators && hasNoDemographics) {
        console.log("⏳ Demographics are being processed. This may take 2-3 minutes after adding creators.");
      }

      setCampaign(campaignData.data);
      setPosts(postsData.data.posts || []);
      setCreators(creatorsData.data.creators || []);
      setAudience(audienceData.data);

      // Set AI insights if available
      if (aiInsightsData?.data) {
        setAiInsights(aiInsightsData.data);
        console.log("AI Insights state updated");
      } else {
        console.log("No AI insights data available");
      }

      // Calculate stats from fetched data
      const postTypes = postsData.data.posts.reduce(
        (acc: any, post: BackendCampaignPost) => {
          acc[post.type === "reel" ? "reels" : post.type]++;
          return acc;
        },
        { static: 0, reels: 0, story: 0 }
      );

      const totalViews = postsData.data.posts.reduce(
        (sum: number, post: BackendCampaignPost) => sum + post.views,
        0
      );
      const totalLikes = postsData.data.posts.reduce(
        (sum: number, post: BackendCampaignPost) => sum + post.likes,
        0
      );
      const totalComments = postsData.data.posts.reduce(
        (sum: number, post: BackendCampaignPost) => sum + post.comments,
        0
      );
      const avgEngagement =
        postsData.data.posts.reduce(
          (sum: number, post: BackendCampaignPost) => sum + post.engagementRate,
          0
        ) / (postsData.data.posts.length || 1);
      const totalFollowers = creatorsData.data.creators.reduce(
        (sum: number, creator: BackendCreator) => sum + creator.followers_count,
        0
      );

      console.log("📊 Stats calculation:", {
        totalCreators: audienceData.data.total_creators,
        totalReach: audienceData.data.total_reach,
        totalFollowers,
        campaignCreatorsCount: campaignData.data?.creators_count,
        campaignTotalReach: campaignData.data?.total_reach,
      });

      setStats({
        totalCreators: audienceData.data.total_creators,
        totalPosts: postsData.data.total_posts,
        totalFollowers,
        totalReach: audienceData.data.total_reach,
        totalViews,
        overallEngagementRate: avgEngagement,
        totalComments,
        totalLikes,
        postTypeBreakdown: postTypes,
      });
    } catch (error: any) {
      console.error("Error fetching campaign data:", error);

      // If it's an authentication error, redirect to login
      if (error.message?.includes('authentication') || error.message?.includes('token')) {
        router.push('/auth/login');
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

  const getPostTypeIcon = (type: BackendCampaignPost["type"]) => {
    switch (type) {
      case "static":
        return <Image className="h-3 w-3" />;
      case "reel":
        return <Video className="h-3 w-3" />;
      case "story":
        return <Share2 className="h-3 w-3" />;
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
      const tokenResult = await tokenManager.getValidToken();

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
      const tokenResult = await tokenManager.getValidToken();

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

      // Upload new logo if selected
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
    if (!newPostUrl.trim()) {
      toast.error("Please enter a post URL");
      return;
    }

    setIsSaving(true);
    try {
      const { API_CONFIG } = await import("@/config/api");
      const { tokenManager } = await import("@/utils/tokenManager");
      const tokenResult = await tokenManager.getValidToken();

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

      toast.success("Post added successfully! Analytics will be ready in 5-10 minutes.", {
        duration: 5000,
      });
      setNewPostUrl("");
      setIsAddPostDialogOpen(false);

      // Refresh campaign data to show new post
      fetchCampaignData();
    } catch (error) {
      console.error("Error adding post:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add post";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
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
              <AvatarFallback>{campaign.brand_name.substring(0, 2).toUpperCase()}</AvatarFallback>
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
          <Badge>{campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</Badge>
          <Button
            variant="default"
            onClick={() => setIsAddPostDialogOpen(true)}
            className="h-10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Posts
          </Button>
          <CampaignPDFExportButton
            data={{
              campaign: {
                ...campaign,
                engagement_rate: campaign.engagement_rate || stats?.overallEngagementRate || 0,
                posts_count: campaign.posts_count || stats?.totalPosts || posts.length,
                creators_count: campaign.creators_count || stats?.totalCreators || creators.length,
                total_reach: campaign.total_reach || stats?.totalReach || 0,
              },
              stats: stats || undefined,
              posts: posts.map(post => ({
                ...post,
                thumbnail: post.thumbnail,
                engagementRate: post.engagementRate || 0,
                creator_profile_pic_url: post.creator_profile_pic_url,
              })),
              creators: creators.map(creator => ({
                ...creator,
                profile_pic_url: creator.profile_pic_url || null,
                avg_engagement_rate: creator.avg_engagement_rate || 0,
              })),
              audience: audience ? {
                age_groups: audience.age_groups,
                gender_split: audience.gender_split,
                top_countries: audience.top_countries?.map((c: any) => ({
                  country: c.country,
                  percentage: c.percentage
                })),
                top_cities: audience.top_cities?.map((c: any) => ({
                  city: c.city,
                  percentage: c.percentage
                })),
                interests: audience.interests,
              } : undefined,
              aiInsights: aiInsights || undefined,
            }}
            className="h-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="stats">Campaign Stats</TabsTrigger>
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

        {/* Campaign Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Primary Metrics */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign?.creators_count || stats?.totalCreators || 0}</div>
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
                  {formatNumber(campaign?.total_reach || stats?.totalReach || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Combined reach</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.totalViews || 0)}
                </div>
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
                <AudienceBarChart
                  title="Audience Geographic Distribution"
                  description="Top audience locations by country"
                  data={Object.entries(aiInsights.audience_insights.geographic_analysis.top_countries)
                    .filter(([, percentage]) => percentage >= 5)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([country, percentage]) => ({
                      label: country,
                      value: percentage
                    }))}
                />
              )}

              {/* Demographic Insights - Age Distribution */}
              {aiInsights.audience_insights.demographic_insights &&
               aiInsights.audience_insights.demographic_insights.estimated_age_groups &&
               typeof aiInsights.audience_insights.demographic_insights.estimated_age_groups === 'object' && (
                <AudienceBarChart
                  title="Audience Age Distribution"
                  description="Age demographics of campaign audience"
                  data={Object.entries(aiInsights.audience_insights.demographic_insights.estimated_age_groups)
                    .sort(([a], [b]) => {
                      const aNum = parseInt(a.split('-')[0]);
                      const bNum = parseInt(b.split('-')[0]);
                      return aNum - bNum;
                    })
                    .map(([age, percentage]) => ({
                      label: `${age} years`,
                      value: percentage * 100
                    }))}
                />
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
                  <InterestsRadarChart
                    interests={aiInsights.audience_insights.audience_interests.interest_distribution}
                  />
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

      {/* Add Post Dialog */}
      <Dialog open={isAddPostDialogOpen} onOpenChange={setIsAddPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Post to Campaign</DialogTitle>
            <DialogDescription>
              Enter the Instagram post URL you want to add to this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-url">Instagram Post URL</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="post-url"
                    placeholder="https://instagram.com/p/..."
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
              </div>
              <p className="text-xs text-muted-foreground">
                Example: https://instagram.com/p/CXXXxxxxxx/
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddPostDialogOpen(false);
                setNewPostUrl("");
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPost} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Post...
                </>
              ) : (
                "Add Post"
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
