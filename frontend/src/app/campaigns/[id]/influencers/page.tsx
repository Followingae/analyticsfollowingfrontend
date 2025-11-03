"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Sparkles, ChevronRight, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { InfluencerSelectionV3 } from "@/components/campaigns/unified/InfluencerSelectionV3";

export default function CampaignInfluencersPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (campaignId) {
      loadCampaignData();
    }
  }, [user, authLoading, campaignId, router]);

  const loadCampaignData = async () => {
    try {
      setIsLoading(true);
      const mockCampaign = {
        id: campaignId,
        name: campaignId === "1" ? "Summer Collection Launch" :
              campaignId === "2" ? "Brand Awareness Q4" :
              campaignId === "3" ? "Product Launch" : "Holiday Campaign 2024",
        brand_name: campaignId === "1" ? "Fashion Forward" :
                    campaignId === "2" ? "TechNova" :
                    campaignId === "3" ? "Lifestyle Co" : "Demo Brand",
        status: "active",
        budget_range: "$10,000 - $25,000",
        target_reach: "500K - 1M",
        content_requirements: "3 posts per influencer, mix of static and reels",
        timeline: "4 weeks",
        objectives: ["Brand Awareness", "Product Launch", "Engagement"]
      };

      await new Promise(resolve => setTimeout(resolve, 800));
      setCampaign(mockCampaign);

      // Start with no pre-selected influencers
      // if (campaignId === "1") {
      //   setSelectedInfluencers(["1", "3"]);
      // }
    } catch (error) {
      console.error("Error loading campaign data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (selected: string[]) => {
    setSelectedInfluencers(selected);
    console.log("Selected influencers updated:", selected);
  };

  if (authLoading || isLoading || !user) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading creator selection...</p>
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
                <span className="font-medium">Creator Selection</span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Select Creators
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Choose the perfect creators for your {campaign.name} campaign
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1.5">
                    {selectedInfluencers.length} Selected
                  </Badge>
                  <Button
                    disabled={selectedInfluencers.length === 0}
                    onClick={() => {
                      console.log("Proceeding with selected influencers:", selectedInfluencers);
                      router.push(`/campaigns/${campaignId}/content`);
                    }}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Continue to Brief
                  </Button>
                </div>
              </div>
            </div>

            {/* Campaign Overview Card */}
            <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Campaign Budget
                    </h4>
                    <p className="text-lg font-semibold">{campaign.budget_range}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Target Reach
                    </h4>
                    <p className="text-lg font-semibold">{campaign.target_reach}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Timeline
                    </h4>
                    <p className="text-lg font-semibold">{campaign.timeline}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Content Type
                    </h4>
                    <p className="text-sm leading-relaxed">{campaign.content_requirements}</p>
                  </div>
                </div>

                {campaign.objectives && campaign.objectives.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <span className="text-sm font-medium text-muted-foreground">Objectives:</span>
                    <div className="flex flex-wrap gap-2">
                      {campaign.objectives.map((obj: string) => (
                        <Badge key={obj} variant="secondary" className="text-xs">
                          {obj}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Influencer Selection Component */}
            <InfluencerSelectionV3
              campaignId={campaignId}
              selectedInfluencers={selectedInfluencers}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}