"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, FileText, Eye, TrendingUp, Heart, MessageCircle, Image, Video, Share2, Plus, Pencil, Upload, Trash2, X, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  engagementRate: number; // Decimal 0-1 format

  // AI Analysis (nullable for old posts)
  ai_content_category: string | null;
  ai_sentiment: "positive" | "neutral" | "negative" | null;
  ai_language_code: string | null;

  // Creator Info
  creator_username: string;
  creator_full_name: string;
  creator_followers_count: number;

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
  avg_engagement_rate: number; // Decimal 0-1 format

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

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<BackendCampaignDetails | null>(null);
  const [posts, setPosts] = useState<BackendCampaignPost[]>([]);
  const [creators, setCreators] = useState<BackendCreator[]>([]);
  const [audience, setAudience] = useState<BackendAudience | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
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

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);
      const { API_CONFIG } = await import("@/config/api");
      const { fetchWithAuth } = await import("@/utils/apiInterceptor");

      // Fetch campaign details, posts, creators, and audience in parallel
      const [campaignRes, postsRes, creatorsRes, audienceRes] = await Promise.all([
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}`),
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/posts`),
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/creators`),
        fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/audience`),
      ]);

      const campaignData = await campaignRes.json();
      const postsData = await postsRes.json();
      const creatorsData = await creatorsRes.json();
      const audienceData = await audienceRes.json();

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
    } catch (error) {
      console.error("Error fetching campaign data:", error);
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

  if (isLoading) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="container mx-auto py-8 px-4 space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-8 w-64" />
              </div>
              <Skeleton className="h-[400px] w-full" />
            </div>
          </SidebarInset>
        </SidebarProvider>
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
        <Badge>{campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</Badge>
        <Button
          variant="outline"
          onClick={() => setIsAddPostDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Posts
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="stats">Campaign Stats</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

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
                <div className="text-2xl font-bold">{stats?.totalCreators || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.totalReach || 0)}
                </div>
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
          </div>

          {/* Engagement Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((stats?.overallEngagementRate ?? 0) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

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
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          {/* Top Demographics */}
          <div className="grid gap-4 md:grid-cols-4">
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Top City</CardTitle>
              </CardHeader>
              <CardContent>
                {!audience?.topCity ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Analyzing demographics...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{audience.topCity.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(audience.topCity.percentage ?? 0).toFixed(1)}% of audience
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Top Country</CardTitle>
              </CardHeader>
              <CardContent>
                {topCountry.isLoading ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Analyzing...</div>
                ) : (
                  <div className="text-xl font-bold">{topCountry.name}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gender Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Male</span>
                  <span className="text-2xl font-bold">
                    {(audience?.gender_distribution?.MALE ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${audience?.gender_distribution?.MALE || 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Female</span>
                  <span className="text-2xl font-bold">
                    {(audience?.gender_distribution?.FEMALE ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${audience?.gender_distribution?.FEMALE || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Age Group Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Age Group Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {audience &&
                  Object.entries(audience.age_distribution).map(([range, percentage]) => (
                    <div key={range} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{range}</span>
                        <span className="font-bold">{(percentage ?? 0).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No posts added to this campaign yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      <div className="aspect-square relative bg-muted">
                        <img
                          src={post.thumbnail || post.display_url || "/placeholder.jpg"}
                          alt="Post thumbnail"
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.jpg";
                          }}
                        />
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          <div className="flex items-center gap-1">
                            {getPostTypeIcon(post.type)}
                            <span className="text-xs capitalize">{post.type}</span>
                          </div>
                        </Badge>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        {/* Caption */}
                        {post.caption && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.caption}
                          </p>
                        )}

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {/* Only show views for reels, not static posts */}
                          {post.type === "reel" && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{formatNumber(post.views)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{formatNumber(post.likes)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{formatNumber(post.comments)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{((post.engagementRate ?? 0) * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(post.url, "_blank")}
                        >
                          View Post
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
