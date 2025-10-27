"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Users, Clock, CheckCircle2, AlertCircle, Eye, MessageSquare, Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";

interface ContentItem {
  id: string;
  influencer_id: string;
  influencer_name: string;
  influencer_avatar: string;
  content_type: "post" | "story" | "reel";
  status: "pending" | "in_progress" | "submitted" | "approved" | "needs_revision";
  title: string;
  description: string;
  due_date: string;
  submitted_at?: string;
  preview_url?: string;
  feedback?: string;
}

export default function CampaignContentPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Wait for auth context to load
    if (authLoading) return;

    // If no user after auth loading is complete, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load content data
    if (campaignId) {
      loadContentData();
    }
  }, [user, authLoading, campaignId, router]);

  const loadContentData = async () => {
    try {
      setIsLoading(true);

      // Mock campaign data
      const mockCampaign = {
        id: campaignId,
        name: campaignId === "1" ? "Summer Collection Launch" :
              campaignId === "2" ? "Brand Awareness Q4" :
              campaignId === "3" ? "Product Launch" : "Holiday Campaign 2024",
        brand_name: "Fashion Forward",
        status: "content_creation",
        total_content_pieces: 24,
        approved_pieces: 8,
        pending_pieces: 12,
        revision_pieces: 4
      };

      // Mock content items
      const mockContentItems: ContentItem[] = [
        {
          id: "content_1",
          influencer_id: "inf_1",
          influencer_name: "Sarah Fashion",
          influencer_avatar: "https://picsum.photos/100/100?random=1",
          content_type: "post",
          status: "approved",
          title: "Summer Dress Styling Post",
          description: "Outfit styling featuring the new summer dress collection",
          due_date: "2024-10-28",
          submitted_at: "2024-10-26",
          preview_url: "https://picsum.photos/300/300?random=101"
        },
        {
          id: "content_2",
          influencer_id: "inf_1",
          influencer_name: "Sarah Fashion",
          influencer_avatar: "https://picsum.photos/100/100?random=1",
          content_type: "story",
          status: "submitted",
          title: "Behind the Scenes Stories",
          description: "4 Instagram stories showing styling process",
          due_date: "2024-10-29",
          submitted_at: "2024-10-27"
        },
        {
          id: "content_3",
          influencer_id: "inf_2",
          influencer_name: "Mike Lifestyle",
          influencer_avatar: "https://picsum.photos/100/100?random=2",
          content_type: "reel",
          status: "in_progress",
          title: "Summer Vibes Reel",
          description: "Dynamic reel showcasing summer collection in lifestyle setting",
          due_date: "2024-10-30"
        },
        {
          id: "content_4",
          influencer_id: "inf_3",
          influencer_name: "Emma Style",
          influencer_avatar: "https://picsum.photos/100/100?random=3",
          content_type: "post",
          status: "needs_revision",
          title: "Casual Summer Look",
          description: "Casual styling post with summer essentials",
          due_date: "2024-10-28",
          submitted_at: "2024-10-26",
          feedback: "Great concept! Please adjust lighting and include more brand product close-ups."
        },
        {
          id: "content_5",
          influencer_id: "inf_2",
          influencer_name: "Mike Lifestyle",
          influencer_avatar: "https://picsum.photos/100/100?random=2",
          content_type: "post",
          status: "pending",
          title: "Weekend Summer Outfit",
          description: "Weekend casual look featuring summer pieces",
          due_date: "2024-11-01"
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      pending: { label: "Pending", className: "bg-gray-50 text-gray-700 border-gray-200", icon: Clock },
      in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Camera },
      submitted: { label: "Submitted", className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Eye },
      approved: { label: "Approved", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
      needs_revision: { label: "Needs Revision", className: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getContentTypeIcon = (type: string) => {
    const icons = {
      post: "📸",
      story: "🎬",
      reel: "🎥"
    };
    return icons[type as keyof typeof icons] || "📸";
  };

  const groupedContent = contentItems.reduce((acc, item) => {
    if (!acc[item.influencer_name]) {
      acc[item.influencer_name] = [];
    }
    acc[item.influencer_name].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  // Show loading state
  if (authLoading || isLoading || !user) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading content creation...</p>
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
              <Button variant="ghost" size="icon" onClick={() => router.push(`/campaigns/${campaignId}`)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Content Creation</h1>
                    <p className="text-sm text-muted-foreground">{campaign.name}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{campaign.approved_pieces}/{campaign.total_content_pieces}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </div>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Content Creation Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round((campaign.approved_pieces / campaign.total_content_pieces) * 100)}%</span>
                  </div>
                  <Progress value={(campaign.approved_pieces / campaign.total_content_pieces) * 100} className="h-2" />

                  <div className="grid gap-4 md:grid-cols-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{campaign.pending_pieces}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{campaign.pending_pieces}</div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{campaign.approved_pieces}</div>
                      <div className="text-sm text-muted-foreground">Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{campaign.revision_pieces}</div>
                      <div className="text-sm text-muted-foreground">Needs Revision</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="by-influencer">By Influencer</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4">
                  {contentItems.map((item) => {
                    const statusConfig = getStatusConfig(item.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <Card key={item.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={item.influencer_avatar} />
                                <AvatarFallback>{item.influencer_name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getContentTypeIcon(item.content_type)}</span>
                                  <h3 className="font-medium">{item.title}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span>By {item.influencer_name}</span>
                                  <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                                  {item.submitted_at && (
                                    <span>Submitted: {new Date(item.submitted_at).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={statusConfig.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {item.preview_url && (
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </Button>
                              )}
                            </div>
                          </div>
                          {item.feedback && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <div className="text-sm font-medium mb-1">Feedback:</div>
                              <div className="text-sm text-muted-foreground">{item.feedback}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* By Influencer Tab */}
              <TabsContent value="by-influencer" className="space-y-6">
                {Object.entries(groupedContent).map(([influencerName, items]) => (
                  <Card key={influencerName}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={items[0].influencer_avatar} />
                          <AvatarFallback>{influencerName[0]}</AvatarFallback>
                        </Avatar>
                        {influencerName}
                        <Badge variant="outline">
                          {items.filter(i => i.status === "approved").length}/{items.length} Approved
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {items.map((item) => {
                          const statusConfig = getStatusConfig(item.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{getContentTypeIcon(item.content_type)}</span>
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  <div className="text-sm text-muted-foreground">Due: {new Date(item.due_date).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <Badge variant="outline" className={statusConfig.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="space-y-6">
                <div className="grid gap-4">
                  {contentItems.filter(item => item.status === "submitted" || item.status === "approved" || item.status === "needs_revision").map((item) => {
                    const statusConfig = getStatusConfig(item.status);

                    return (
                      <Card key={item.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 flex-1">
                              {item.preview_url && (
                                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                                  <img
                                    src={item.preview_url}
                                    alt="Content preview"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-medium">{item.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>By {item.influencer_name}</span>
                                  {item.submitted_at && (
                                    <span>Submitted: {new Date(item.submitted_at).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={statusConfig.className}>
                                {statusConfig.label}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}