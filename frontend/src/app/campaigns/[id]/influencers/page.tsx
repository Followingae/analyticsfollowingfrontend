"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Filter, Grid3X3, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { InfluencerSelection } from "@/components/campaigns/unified/InfluencerSelection";

export default function CampaignInfluencersPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth context to load
    if (authLoading) return;

    // If no user after auth loading is complete, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load campaign data and selected influencers
    if (campaignId) {
      loadCampaignData();
    }
  }, [user, authLoading, campaignId, router]);

  const loadCampaignData = async () => {
    try {
      setIsLoading(true);

      // Mock campaign data
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
        content_requirements: "3 posts per influencer, mix of static and reels"
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setCampaign(mockCampaign);

      // Mock some pre-selected influencers
      if (campaignId === "1") {
        setSelectedInfluencers(["inf_1", "inf_3"]);
      }
    } catch (error) {
      console.error("Error loading campaign data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (selected: string[]) => {
    setSelectedInfluencers(selected);
    // In a real app, this would save to backend
    console.log("Selected influencers updated:", selected);
  };

  // Show loading state
  if (authLoading || isLoading || !user) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading influencer selection...</p>
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
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Influencer Selection</h1>
                    <p className="text-sm text-muted-foreground">{campaign.name}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right text-sm">
                  <div className="font-medium">{selectedInfluencers.length} Selected</div>
                  <div className="text-muted-foreground">Budget: {campaign.budget_range}</div>
                </div>
              </div>
            </div>

            {/* Campaign Brief Card */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Brief</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Target Reach</div>
                    <div className="text-lg font-semibold">{campaign.target_reach}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Budget Range</div>
                    <div className="text-lg font-semibold">{campaign.budget_range}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Content Requirements</div>
                    <div className="text-sm">{campaign.content_requirements}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Influencer Selection Component */}
            <Card className="min-h-[600px]">
              <CardContent className="p-0">
                <InfluencerSelection
                  campaignId={campaignId}
                  selectedInfluencers={selectedInfluencers}
                  onSelectionChange={handleSelectionChange}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => router.push(`/campaigns/${campaignId}`)}
              >
                Back to Campaign
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {selectedInfluencers.length} influencer{selectedInfluencers.length !== 1 ? 's' : ''} selected
                </div>
                <Button
                  disabled={selectedInfluencers.length === 0}
                  onClick={() => {
                    // In a real app, this would proceed to next stage
                    console.log("Proceeding with selected influencers:", selectedInfluencers);
                    router.push(`/campaigns/${campaignId}?tab=workflow`);
                  }}
                >
                  Continue to Content Brief
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}