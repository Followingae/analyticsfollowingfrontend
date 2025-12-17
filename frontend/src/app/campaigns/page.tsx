"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthGuard } from "@/components/AuthGuard";
import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";

import { CampaignsOverviewV2 } from "@/components/campaigns/unified/CampaignsOverviewV2";
import { ActiveCampaignsV2 } from "@/components/campaigns/unified/ActiveCampaignsV2";
import { ProposalsTab } from "@/components/campaigns/unified/ProposalsTab";
import { ArchiveTab } from "@/components/campaigns/unified/ArchiveTab";
import { CampaignAnalyticsCards } from "@/components/campaigns/CampaignAnalyticsCards";

export default function UnifiedCampaignsDashboard() {
  const router = useRouter();
  const { user } = useEnhancedAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    active: 0,
    proposals: 0,
    completed: 0,
    totalReach: "0",
    engagement: "0%",
    totalSpend: "$0"
  });

  const isAgencyClient = user?.role === 'premium' || user?.role === 'enterprise' || false;

  // Fetch campaign stats for tab badges
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { campaignApi } = await import('@/services/campaignApiComplete');
        const response = await campaignApi.getDashboardOverview();

        if (response.success && response.data) {
          const { summary } = response.data;
          setStats({
            active: summary.activeCampaigns || 0,
            proposals: summary.pendingProposals || 0,
            completed: summary.completedCampaigns || 0,
            totalReach: summary.totalReach.current.toString(),
            engagement: `${summary.avgEngagementRate.current}%`,
            totalSpend: `$${summary.totalSpend.current}`
          });
        }
      } catch (error) {
        console.error("Error fetching campaign stats:", error);
      }
    };

    fetchStats();
  }, []);

  const tabConfig = [
    { id: "overview", label: "Overview", component: CampaignsOverviewV2, count: null },
    { id: "active", label: "Active", component: ActiveCampaignsV2, count: stats.active },
    ...(isAgencyClient ? [{ id: "proposals", label: "Proposals", component: ProposalsTab, count: stats.proposals }] : []),
    { id: "archive", label: "Completed", component: ArchiveTab, count: stats.completed },
  ];

  return (
    <AuthGuard>
      <BrandUserInterface>
        <div className="flex flex-col min-h-screen bg-background">
          {/* Enhanced Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              {/* Top Section - Now empty since title moved to header */}

              {/* Analytics Cards */}
              <CampaignAnalyticsCards className="mt-6" />
            </div>
          </div>

          {/* Tabs Content */}
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              {/* Tabs with Search */}
              <div className="flex items-center justify-between gap-4">
                <TabsList className="bg-muted/30 p-1 h-auto">
                  {tabConfig.map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
                    >
                      <span>{tab.label}</span>
                      {tab.count !== null && tab.count > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 px-1.5 min-w-[20px] text-xs"
                        >
                          {tab.count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Search and New Campaign Button */}
                <div className="flex items-center gap-3">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 w-64"
                    />
                  </div>
                  <Button
                    onClick={() => router.push('/campaigns/new')}
                    className="gap-2 h-10"
                  >
                    <Plus className="h-4 w-4" />
                    New Campaign
                  </Button>
                </div>
              </div>

              <div className="mt-6 pb-8">
                {tabConfig.map(tab => {
                  const TabComponent = tab.component;
                  return (
                    <TabsContent key={tab.id} value={tab.id} className="mt-0 space-y-4">
                      <TabComponent searchQuery={searchQuery} />
                    </TabsContent>
                  );
                })}
              </div>
            </Tabs>
          </div>
        </div>
      </BrandUserInterface>
    </AuthGuard>
  );
}