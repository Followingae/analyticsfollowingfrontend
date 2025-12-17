"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CampaignCard, type CampaignCardData } from "@/components/campaigns/CampaignCard";

// Use shared Campaign interface
type Campaign = CampaignCardData;

interface ActiveCampaignsProps {
  searchQuery: string;
}

export function ActiveCampaignsV2({ searchQuery }: ActiveCampaignsProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);

      // Use dedicated API service to prevent duplicate calls
      const { dedicatedApiCall } = await import('@/utils/apiDeduplication');
      const responseData = await dedicatedApiCall.campaignsList({ status: 'active', limit: 100 });

      if (responseData.success && responseData.data) {
        const campaigns = responseData.data.campaigns || [];

        // Process campaigns to ensure proper data handling
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

        setCampaigns(processedCampaigns);
      } else {
        throw new Error(responseData.error || 'Failed to fetch campaigns');
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Campaign action handler that will be passed to CampaignCard

  const handleCampaignAction = async (action: string, campaignId: string, campaignName: string) => {
    try {
      const { campaignApi } = await import('@/services/campaignApiComplete');

      let response;
      let successMessage = '';

      switch (action) {
        case 'pause':
          response = await campaignApi.updateCampaignStatus(campaignId, 'paused');
          successMessage = `Campaign "${campaignName}" has been paused`;
          break;
        case 'resume':
          response = await campaignApi.updateCampaignStatus(campaignId, 'active');
          successMessage = `Campaign "${campaignName}" has been resumed`;
          break;
        case 'complete':
          response = await campaignApi.updateCampaignStatus(campaignId, 'completed');
          successMessage = `Campaign "${campaignName}" has been marked as completed`;
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
            return;
          }
          response = await campaignApi.deleteCampaign(campaignId);
          successMessage = `Campaign "${campaignName}" has been deleted`;
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      if (response.success) {
        console.log(successMessage);
        // Refresh campaigns list
        await fetchCampaigns();
      } else {
        throw new Error(response.error || `Failed to ${action} campaign`);
      }
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
      alert(`Failed to ${action} campaign. Please try again.`);
    }
  };


  const filteredCampaigns = campaigns.filter(campaign => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(query) ||
      campaign.brand_name.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredCampaigns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No active campaigns</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            {searchQuery
              ? "No campaigns match your search criteria"
              : "Start your first campaign to engage with creators"}
          </p>
          <Button onClick={() => router.push('/campaigns/new')}>
            Create Campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {filteredCampaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          showActions={true}
          onAction={handleCampaignAction}
        />
      ))}
    </div>
  );
}