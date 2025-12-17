"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Target, Plus, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CampaignCard, type CampaignCardData } from "@/components/campaigns/CampaignCard";

interface PerformanceMetric {
  current: number;
  previous: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
}

interface CampaignSummary {
  totalCampaigns: number;
  totalCreators: number;
  totalReach: PerformanceMetric;
  avgEngagementRate: PerformanceMetric;
  activeCampaigns: number;
  completedCampaigns: number;
  pendingProposals: number;
  thisMonthCampaigns: number;
  totalSpend: PerformanceMetric;
  contentProduced: number;
}

// Use shared Campaign interface
type RecentCampaign = CampaignCardData;


interface CampaignsOverviewProps {
  searchQuery: string;
}

export function CampaignsOverviewV2({ searchQuery }: CampaignsOverviewProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);

      // Use the SAME API call as Active tab to ensure identical data
      const { dedicatedApiCall } = await import('@/utils/apiDeduplication');
      const responseData = await dedicatedApiCall.campaignsList({ limit: 10 }); // Get recent 10 campaigns

      if (responseData.success && responseData.data) {
        const campaigns = responseData.data.campaigns || [];

        // Process campaigns EXACTLY like Active tab
        const processedCampaigns = campaigns.map(campaign => ({
          ...campaign,
          // Ensure numeric fields are properly handled
          engagement_rate: campaign.engagement_rate || 0,
          total_reach: campaign.total_reach || 0,
          creators_count: campaign.creators_count || 0,
          posts_count: campaign.posts_count || 0,
          progress: campaign.progress || 0,
          content_delivered: campaign.content_delivered || 0,
          content_total: campaign.content_total || 0,
          // Handle missing created_by field
          created_by: campaign.created_by || 'user',
          has_posts: campaign.has_posts || (campaign.posts_count > 0)
        }));

        setRecentCampaigns(processedCampaigns);

        // Create a mock summary since we're not using overview endpoint
        setSummary({
          totalCampaigns: campaigns.length,
          totalCreators: 0,
          totalReach: { current: 0, previous: 0, trend: 'stable' as const, changePercent: 0 },
          avgEngagementRate: { current: 0, previous: 0, trend: 'stable' as const, changePercent: 0 },
          activeCampaigns: campaigns.filter(c => c.status === 'active').length,
          completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
          pendingProposals: 0,
          thisMonthCampaigns: campaigns.length,
          totalSpend: { current: 0, previous: 0, trend: 'stable' as const, changePercent: 0 },
          contentProduced: 0
        });
      } else {
        throw new Error(responseData.error || 'Failed to fetch campaigns');
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
      setSummary(null);
      setRecentCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Campaign action handler - no actions needed for overview, but required for CampaignCard interface
  const handleCampaignAction = async (action: string, campaignId: string, campaignName: string) => {
    // Overview tab doesn't need actions, but we need to provide this for the interface
    console.log(`Campaign action ${action} on ${campaignName} (${campaignId}) - not implemented in overview`);
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons for Recent Campaigns */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-64 bg-muted rounded animate-pulse" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) return null;

  const filteredCampaigns = recentCampaigns.filter(campaign => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return campaign.name.toLowerCase().includes(query) ||
           campaign.brand_name.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Recent Campaigns - Full Width */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Recent Campaigns</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/campaigns?tab=active')}
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">No campaigns found</p>
              <Button onClick={() => router.push('/campaigns/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Campaign
              </Button>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                showActions={false}
                onAction={handleCampaignAction}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}