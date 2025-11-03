"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Download,
  Calendar,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthGuard } from "@/components/AuthGuard";
import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
import { InfluencerSelectionV3 } from "@/components/campaigns/unified/InfluencerSelectionV3";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CleanCampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [stages, setStages] = useState([
    { id: "proposal", label: "Proposal & Influencers", icon: FileText, status: "pending" },
    { id: "content", label: "Content Approval", icon: Eye, status: "pending" },
    { id: "live", label: "Campaign Live", icon: BarChart3, status: "pending" },
    { id: "report", label: "Final Report", icon: FileText, status: "pending" },
  ]);

  useEffect(() => {
    if (!authLoading && user && campaignId) {
      fetchCampaignData();
    }
  }, [user, authLoading, campaignId]);

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);

      let mockCampaign: any;
      let currentStage: string;

      // Different scenarios based on campaign ID
      if (campaignId === "1") {
        // Scenario 1: Proposal & Influencer Selection Stage
        mockCampaign = {
          id: campaignId,
          name: "New Product Launch Q1 2024",
          status: "created",
          budget: "$25,000",
          duration: "Jan 15 - Feb 28, 2024",
          currentStage: "proposal",
          stats: {
            influencers: { selected: 0, total: 80 },
            content: { approved: 0, pending: 0, rejected: 0 },
            reach: "5M estimated",
            engagement: "4.5% avg target",
          },
          proposalDetails: {
            objectives: "Increase brand awareness and drive Q1 sales",
            targetAudience: "Women 18-34, Urban, Fashion-conscious",
            proposedInfluencers: 80,
            estimatedReach: "5-8M",
            timeline: "6 weeks",
            contentPieces: 120,
          },
          suggestedInfluencers: true, // This triggers the InfluencerSelectionView component
          selectedInfluencers: [] // Empty initially, brand needs to select
        };
        setActiveTab("influencers"); // Start on influencers tab for selection
      } else if (campaignId === "2") {
        // Scenario 2: Content Approval Stage
        mockCampaign = {
          id: campaignId,
          name: "Summer Collection Launch 2024",
          status: "active",
          budget: "$25,000",
          duration: "May 1 - Jun 30, 2024",
          currentStage: "content",
          stats: {
            influencers: { selected: 8, total: 8 },
            content: { approved: 12, pending: 6, rejected: 2 },
            reach: "2.5M estimated",
            engagement: "4.5% avg",
          },
          contentItems: {
            pending: [
              { id: 1, influencer: "@fashionista_ny", type: "reel", submitted: "2 hours ago" },
              { id: 2, influencer: "@style_maven", type: "post", submitted: "4 hours ago" },
              { id: 3, influencer: "@trendsetter_la", type: "story", submitted: "5 hours ago" },
              { id: 4, influencer: "@chic_lifestyle", type: "carousel", submitted: "1 day ago" },
              { id: 5, influencer: "@urban_style", type: "reel", submitted: "1 day ago" },
              { id: 6, influencer: "@luxury_life", type: "post", submitted: "2 days ago" },
            ],
            approved: Array.from({ length: 12 }, (_, i) => ({
              id: i + 7,
              influencer: `@influencer_${i + 1}`,
              type: ["post", "reel", "story", "carousel"][i % 4],
              approvedOn: `${i + 1} days ago`
            })),
            rejected: [
              { id: 19, influencer: "@low_quality", type: "post", reason: "Not on brand" },
              { id: 20, influencer: "@off_topic", type: "reel", reason: "Wrong product shown" },
            ]
          }
        };
        setActiveTab("content");
      } else if (campaignId === "3") {
        // Scenario 3: Campaign Live Stage
        mockCampaign = {
          id: campaignId,
          name: "Back to School Campaign",
          status: "live",
          budget: "$30,000",
          duration: "Aug 1 - Sep 15, 2024",
          currentStage: "live",
          stats: {
            influencers: { selected: 10, total: 10 },
            content: { approved: 35, pending: 0, rejected: 5 },
            reach: "3.2M actual",
            engagement: "5.1% avg",
          },
          liveStats: {
            postsPublished: 28,
            totalPosts: 35,
            currentReach: 2450000,
            totalEngagement: 124950,
            topPerformingPost: "@fashionista_ny",
            daysRemaining: 8,
            performance: "above_target",
          }
        };
        setActiveTab("analytics");
      } else if (campaignId === "4") {
        // Scenario 4: View Report Stage (Completed)
        mockCampaign = {
          id: campaignId,
          name: "Holiday Season 2023",
          status: "completed",
          budget: "$40,000",
          duration: "Nov 15 - Dec 31, 2023",
          currentStage: "report",
          stats: {
            influencers: { selected: 12, total: 12 },
            content: { approved: 48, pending: 0, rejected: 7 },
            reach: "5.8M total",
            engagement: "6.2% avg",
          },
          finalReport: {
            totalReach: 5800000,
            totalEngagement: 359600,
            totalConversions: 3250,
            roi: "385%",
            topInfluencer: "@luxury_life",
            topContent: "Holiday Gift Guide Reel",
            sentiment: "92% positive",
            budgetSpent: "$38,500",
            costPerEngagement: "$0.11",
            newFollowers: 12500,
          }
        };
        setActiveTab("analytics");
      } else {
        // Default: New campaign at proposal stage
        mockCampaign = {
          id: campaignId,
          name: "Upcoming Campaign",
          status: "draft",
          budget: "$10,000",
          duration: "TBD",
          currentStage: "proposal",
          stats: {
            influencers: { selected: 0, total: 0 },
            content: { approved: 0, pending: 0, rejected: 0 },
            reach: "TBD",
            engagement: "TBD",
          }
        };
        setActiveTab("overview");
      }

      setCampaign(mockCampaign);

      // Update stages based on current stage
      const updatedStages = stages.map(stage => {
        const stageOrder = ["proposal", "content", "live", "report"];
        const currentIndex = stageOrder.indexOf(mockCampaign.currentStage);
        const stageIndex = stageOrder.indexOf(stage.id);

        return {
          ...stage,
          status: stageIndex < currentIndex ? "completed" :
                  stageIndex === currentIndex ? "active" : "pending"
        };
      });

      setStages(updatedStages);

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <AuthGuard>
        <BrandUserInterface>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </BrandUserInterface>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <BrandUserInterface>
        <div className="flex flex-col h-full">
          {/* Minimal Header */}
          <div className="border-b">
            <div className="container flex items-center gap-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/campaigns")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">{campaign?.name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{campaign?.duration}</Badge>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>

          {/* Integrated Stages and Stats */}
          <div className="border-b bg-muted/30">
            <div className="container py-2">
              {/* Stages Progress - Minimal */}
              <div className="flex items-center gap-3">
                {stages.map((stage, index) => {
                  const isActive = stage.status === "active";
                  const isCompleted = stage.status === "completed";

                  return (
                    <div key={stage.id} className="flex items-center">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full transition-all",
                            isCompleted && "bg-primary",
                            isActive && "bg-primary animate-pulse",
                            !isActive && !isCompleted && "bg-muted-foreground/30"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isActive && "text-foreground",
                            isCompleted && "text-primary",
                            !isActive && !isCompleted && "text-muted-foreground"
                          )}
                        >
                          {stage.label}
                        </span>
                      </div>
                      {index < stages.length - 1 && (
                        <div
                          className={cn(
                            "h-[1px] w-8 mx-2",
                            stage.status === "completed" ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Inline Stats - Minimal */}
                <div className="ml-auto flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Influencers:</span>
                    <span className="font-medium">
                      {campaign?.stats.influencers.selected}/{campaign?.stats.influencers.total}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Content:</span>
                    <span className="font-medium">{campaign?.stats.content.approved}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Reach:</span>
                    <span className="font-medium">{campaign?.stats.reach}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">{campaign?.budget}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {/* Main Tabs - Conditional based on stage */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="container pt-6">
                <TabsList>
                  <TabsTrigger value="overview">
                    {campaign?.currentStage === "proposal" ? "Proposal" : "Overview"}
                  </TabsTrigger>
                  <TabsTrigger value="influencers">
                    {campaign?.currentStage === "proposal" ? "Select Influencers" : "Influencers"}
                  </TabsTrigger>
                  {(campaign?.currentStage === "content" ||
                    campaign?.currentStage === "live" ||
                    campaign?.currentStage === "report") && (
                    <TabsTrigger value="content">Content</TabsTrigger>
                  )}
                  {(campaign?.currentStage === "live" || campaign?.currentStage === "report") && (
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="overview" className="h-full overflow-auto">
                  <div className="container py-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {campaign?.currentStage === "proposal" ? "Campaign Proposal" :
                         campaign?.currentStage === "report" ? "Campaign Summary" :
                         "Campaign Progress"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {campaign?.currentStage === "proposal" && campaign?.proposalDetails ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Objectives</p>
                              <p className="text-sm">{campaign.proposalDetails.objectives}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Target Audience</p>
                              <p className="text-sm">{campaign.proposalDetails.targetAudience}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Proposed Influencers</p>
                              <p className="text-sm">{campaign.proposalDetails.proposedInfluencers}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Estimated Reach</p>
                              <p className="text-sm">{campaign.proposalDetails.estimatedReach}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Timeline</p>
                              <p className="text-sm">{campaign.proposalDetails.timeline}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Content Pieces</p>
                              <p className="text-sm">{campaign.proposalDetails.contentPieces}</p>
                            </div>
                          </div>

                          <Separator />

                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-primary" />
                              <p className="text-sm font-medium">Action Required</p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              The admin has suggested 80 influencers for this campaign. Please review and select the ones that best match your brand vision.
                            </p>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => setActiveTab("influencers")}
                            >
                              Review & Select Influencers
                            </Button>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button className="flex-1">Start Campaign</Button>
                            <Button variant="outline" className="flex-1">Contact Admin</Button>
                          </div>
                        </div>
                      ) : campaign?.currentStage === "report" && campaign?.finalReport ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold text-green-600">{campaign.finalReport.roi}</p>
                              <p className="text-sm text-muted-foreground">ROI</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold">{(campaign.finalReport.totalReach / 1000000).toFixed(1)}M</p>
                              <p className="text-sm text-muted-foreground">Total Reach</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold">{campaign.finalReport.totalConversions.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">Conversions</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Top Influencer</p>
                              <p className="font-medium">{campaign.finalReport.topInfluencer}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Top Content</p>
                              <p className="font-medium">{campaign.finalReport.topContent}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Sentiment</p>
                              <p className="font-medium">{campaign.finalReport.sentiment}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Cost per Engagement</p>
                              <p className="font-medium">{campaign.finalReport.costPerEngagement}</p>
                            </div>
                          </div>
                          <Button className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download Full Report
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Overall Progress</span>
                              <span className="text-sm font-medium">
                                {stages.filter(s => s.status === "completed").length * 25}%
                              </span>
                            </div>
                            <Progress
                              value={stages.filter(s => s.status === "completed").length * 25}
                              className="h-2"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Current Stage</p>
                              <p className="text-sm text-muted-foreground">
                                {stages.find(s => s.status === "active")?.label || "Pending"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Next Action</p>
                              <p className="text-sm text-muted-foreground">
                                {campaign?.currentStage === "proposal" ? "Review campaign proposal" :
                                 campaign?.currentStage === "content" ? "Review and approve content" :
                                 campaign?.currentStage === "live" ? "Monitor campaign performance" :
                                 "Awaiting next stage"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  </div>
                </TabsContent>

                <TabsContent value="influencers" className="h-full overflow-hidden">
                  {campaign?.currentStage === "proposal" && (
                    <InfluencerSelectionV3
                      campaignId={campaignId}
                      selectedInfluencers={[]}
                      onSelectionChange={() => {}}
                    />
                  )}

                  {campaign?.currentStage !== "proposal" && (
                    <div className="container py-6 space-y-6">
                      {campaign?.pendingInfluencers && campaign.pendingInfluencers.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Pending Approval</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {campaign.pendingInfluencers.map((influencer: any) => (
                                <div key={influencer.id} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage src={`https://picsum.photos/100/100?random=${influencer.id}`} />
                                      <AvatarFallback>{influencer.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">@{influencer.username}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {(influencer.followers / 1000).toFixed(0)}K followers • {influencer.engagement}% engagement
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="default">
                                      <ThumbsUp className="mr-1 h-3 w-3" />
                                      Approve
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <ThumbsDown className="mr-1 h-3 w-3" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {campaign?.approvedInfluencers && campaign.approvedInfluencers.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Approved Influencers</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {campaign.approvedInfluencers.map((influencer: any) => (
                                <div key={influencer.id} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage src={`https://picsum.photos/100/100?random=${influencer.id}`} />
                                      <AvatarFallback>{influencer.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">@{influencer.username}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {(influencer.followers / 1000).toFixed(0)}K followers • {influencer.engagement}% engagement
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-green-600">
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      Approved
                                    </Badge>
                                    <Button size="sm" variant="outline">
                                      View Profile
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {(!campaign?.pendingInfluencers || campaign.pendingInfluencers.length === 0) &&
                       (!campaign?.approvedInfluencers || campaign.approvedInfluencers.length === 0) && (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No influencers assigned yet</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="content" className="h-full overflow-auto">
                  <div className="container py-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">All (20)</Badge>
                      <Badge variant="outline" className="text-orange-600">
                        Pending (6)
                      </Badge>
                      <Badge variant="outline" className="text-green-600">
                        Approved (12)
                      </Badge>
                      <Badge variant="outline" className="text-red-600">
                        Rejected (2)
                      </Badge>
                    </div>
                    <Button size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export All
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="aspect-square bg-muted relative">
                          <img
                            src={`https://picsum.photos/400/400?random=${i}`}
                            alt="Content"
                            className="w-full h-full object-cover"
                          />
                          <Badge
                            className="absolute top-2 right-2"
                            variant={i <= 2 ? "destructive" : i <= 4 ? "default" : "secondary"}
                          >
                            {i <= 2 ? "Pending" : i <= 4 ? "Approved" : "Draft"}
                          </Badge>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">@influencer_{i}</p>
                            <p className="text-xs text-muted-foreground">2 hours ago</p>
                          </div>
                          {i <= 2 && (
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1" variant="default">
                                <ThumbsUp className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button size="sm" className="flex-1" variant="outline">
                                <ThumbsDown className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="h-full overflow-auto">
                  <div className="container py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <div className="text-center">
                          <AlertCircle className="h-12 w-12 mx-auto mb-3" />
                          <p className="text-lg font-medium">Campaign Not Yet Live</p>
                          <p className="text-sm">Analytics will be available once the campaign goes live</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </BrandUserInterface>
    </AuthGuard>
  );
}