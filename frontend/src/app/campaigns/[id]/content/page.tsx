"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Upload,
  ChevronRight,
  FileText,
  Calendar,
  Sparkles,
  MoreHorizontal,
  MessageSquare,
  RefreshCcw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";

interface ContentItem {
  id: string;
  influencer_id: string;
  influencer_name: string;
  influencer_avatar: string;
  influencer_handle: string;
  content_type: "post" | "story" | "reel";
  status: "pending" | "in_review" | "approved" | "revision_needed" | "published";
  title: string;
  description: string;
  due_date: string;
  submitted_at?: string;
  preview_url?: string;
  feedback?: string;
  engagement_estimate?: number;
  reach_estimate?: number;
}

export default function CampaignContentPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (campaignId) {
      loadContentData();
    }
  }, [user, authLoading, campaignId, router]);

  const loadContentData = async () => {
    try {
      setIsLoading(true);

      const mockCampaign = {
        id: campaignId,
        name: campaignId === "1" ? "Summer Collection Launch" :
              campaignId === "2" ? "Brand Awareness Q4" :
              campaignId === "3" ? "Product Launch" : "Holiday Campaign 2024",
        brand_name: "Fashion Forward",
        status: "content_creation",
        total_content: 12,
        approved: 4,
        in_review: 3,
        pending: 3,
        revision_needed: 2,
        deadline: "2024-11-15"
      };

      const mockContentItems: ContentItem[] = [
        {
          id: "1",
          influencer_id: "inf_1",
          influencer_name: "Sarah Johnson",
          influencer_handle: "@foodie_sarah",
          influencer_avatar: "https://picsum.photos/200/200?random=1",
          content_type: "reel",
          status: "approved",
          title: "Summer Vibes Collection",
          description: "30-second reel showcasing the summer collection with trending audio",
          due_date: "2024-10-28",
          submitted_at: "2024-10-26",
          preview_url: "https://picsum.photos/400/600?random=101",
          engagement_estimate: 12500,
          reach_estimate: 85000
        },
        {
          id: "2",
          influencer_id: "inf_1",
          influencer_name: "Sarah Johnson",
          influencer_handle: "@foodie_sarah",
          influencer_avatar: "https://picsum.photos/200/200?random=1",
          content_type: "post",
          status: "in_review",
          title: "Beach Day Essentials",
          description: "Carousel post featuring 5 summer outfits for beach days",
          due_date: "2024-10-29",
          submitted_at: "2024-10-27",
          preview_url: "https://picsum.photos/400/400?random=102",
          engagement_estimate: 8200,
          reach_estimate: 65000
        },
        {
          id: "3",
          influencer_id: "inf_2",
          influencer_name: "Mike Chen",
          influencer_handle: "@tech_mike",
          influencer_avatar: "https://picsum.photos/200/200?random=2",
          content_type: "story",
          status: "revision_needed",
          title: "Unboxing Experience",
          description: "Story series showing product unboxing and first impressions",
          due_date: "2024-10-30",
          submitted_at: "2024-10-28",
          feedback: "Please ensure the brand logo is more prominent and add swipe-up link",
          engagement_estimate: 5500,
          reach_estimate: 42000
        },
        {
          id: "4",
          influencer_id: "inf_3",
          influencer_name: "Emma Rodriguez",
          influencer_handle: "@fashion_emma",
          influencer_avatar: "https://picsum.photos/200/200?random=3",
          content_type: "post",
          status: "pending",
          title: "Style Guide",
          description: "Educational post on styling the new collection pieces",
          due_date: "2024-11-01",
          engagement_estimate: 9800,
          reach_estimate: 72000
        },
        {
          id: "5",
          influencer_id: "inf_3",
          influencer_name: "Emma Rodriguez",
          influencer_handle: "@fashion_emma",
          influencer_avatar: "https://picsum.photos/200/200?random=3",
          content_type: "reel",
          status: "approved",
          title: "Get Ready With Me",
          description: "GRWM reel featuring products from the collection",
          due_date: "2024-10-25",
          submitted_at: "2024-10-24",
          preview_url: "https://picsum.photos/400/600?random=103",
          engagement_estimate: 15200,
          reach_estimate: 98000
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 800));
      setCampaign(mockCampaign);
      setContentItems(mockContentItems);
    } catch (error) {
      console.error("Error loading content data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: "Pending",
        color: "text-slate-600 bg-slate-50 border-slate-200",
        icon: Clock,
        dotColor: "bg-slate-400"
      },
      in_review: {
        label: "In Review",
        color: "text-blue-600 bg-blue-50 border-blue-200",
        icon: Eye,
        dotColor: "bg-blue-500"
      },
      approved: {
        label: "Approved",
        color: "text-green-600 bg-green-50 border-green-200",
        icon: CheckCircle2,
        dotColor: "bg-green-500"
      },
      revision_needed: {
        label: "Needs Revision",
        color: "text-amber-600 bg-amber-50 border-amber-200",
        icon: RefreshCcw,
        dotColor: "bg-amber-500"
      },
      published: {
        label: "Published",
        color: "text-purple-600 bg-purple-50 border-purple-200",
        icon: Sparkles,
        dotColor: "bg-purple-500"
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getContentTypeConfig = (type: string) => {
    const configs = {
      post: { label: "Post", icon: "🖼", color: "bg-blue-100 text-blue-700" },
      story: { label: "Story", icon: "📱", color: "bg-purple-100 text-purple-700" },
      reel: { label: "Reel", icon: "🎬", color: "bg-pink-100 text-pink-700" }
    };
    return configs[type as keyof typeof configs] || configs.post;
  };

  const filteredContent = activeTab === "all"
    ? contentItems
    : contentItems.filter(item => {
        if (activeTab === "review") return item.status === "in_review";
        if (activeTab === "approved") return item.status === "approved";
        if (activeTab === "revisions") return item.status === "revision_needed";
        return true;
      });

  if (authLoading || isLoading || !user) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading content briefs...</p>
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

  const progressPercentage = Math.round((campaign.approved / campaign.total_content) * 100);

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />

          {/* Main Content */}
          <div className="flex-1 space-y-8 p-8 lg:p-12">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 -ml-2"
                  onClick={() => router.push("/campaigns")}
                >
                  Campaigns
                </Button>
                <ChevronRight className="h-3.5 w-3.5" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push(`/campaigns/${campaignId}`)}
                >
                  {campaign.name}
                </Button>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-medium">Content & Briefs</span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Content Production
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Track and manage content creation for {campaign.name}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Brief
                  </Button>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Content
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Production Progress</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {campaign.approved} of {campaign.total_content} pieces approved
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{progressPercentage}%</div>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>

                <Progress value={progressPercentage} className="h-2 mb-6" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-2xl font-bold text-slate-600">{campaign.pending}</div>
                    <div className="text-xs text-muted-foreground mt-1">Pending</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-600">{campaign.in_review}</div>
                    <div className="text-xs text-muted-foreground mt-1">In Review</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <div className="text-2xl font-bold text-amber-600">{campaign.revision_needed}</div>
                    <div className="text-xs text-muted-foreground mt-1">Needs Revision</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600">{campaign.approved}</div>
                    <div className="text-xs text-muted-foreground mt-1">Approved</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="font-medium">
                      {new Date(campaign.deadline).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted/30 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-background">
                  All Content
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {contentItems.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="review" className="data-[state=active]:bg-background">
                  In Review
                  {campaign.in_review > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {campaign.in_review}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="revisions" className="data-[state=active]:bg-background">
                  Revisions
                  {campaign.revision_needed > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                      {campaign.revision_needed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="data-[state=active]:bg-background">
                  Approved
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {campaign.approved}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {filteredContent.map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  const contentType = getContentTypeConfig(item.content_type);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={item.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex items-start gap-6 p-6">
                          {/* Thumbnail */}
                          {item.preview_url ? (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={item.preview_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge className={cn("text-xs", contentType.color)}>
                                  {contentType.icon} {contentType.label}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <div className="text-center">
                                <span className="text-4xl">{contentType.icon}</span>
                                <p className="text-xs text-muted-foreground mt-2">{contentType.label}</p>
                              </div>
                            </div>
                          )}

                          {/* Content Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{item.title}</h3>
                                  <Badge variant="outline" className={cn("text-xs border", statusConfig.color)}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusConfig.dotColor)} />
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {item.description}
                                </p>

                                {/* Creator Info */}
                                <div className="flex items-center gap-3 mb-4">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={item.influencer_avatar} />
                                    <AvatarFallback className="text-xs">
                                      {item.influencer_name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{item.influencer_name}</p>
                                    <p className="text-xs text-muted-foreground">{item.influencer_handle}</p>
                                  </div>
                                </div>

                                {/* Meta Info */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due {new Date(item.due_date).toLocaleDateString()}
                                  </span>
                                  {item.submitted_at && (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Submitted {new Date(item.submitted_at).toLocaleDateString()}
                                    </span>
                                  )}
                                  {item.engagement_estimate && (
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      Est. {(item.reach_estimate! / 1000).toFixed(0)}K reach
                                    </span>
                                  )}
                                </div>

                                {/* Feedback */}
                                {item.feedback && (
                                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                                          Revision Requested
                                        </p>
                                        <p className="text-xs text-amber-800 dark:text-amber-200">
                                          {item.feedback}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                {item.preview_url && (
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                    <span className="ml-1.5 hidden lg:inline">Preview</span>
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Brief
                                    </DropdownMenuItem>
                                    {item.status === "in_review" && (
                                      <>
                                        <DropdownMenuItem className="text-green-600">
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-amber-600">
                                          <RefreshCcw className="mr-2 h-4 w-4" />
                                          Request Revision
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredContent.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No content found</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-md">
                        No content items match the selected filter. Check back later or try a different view.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}