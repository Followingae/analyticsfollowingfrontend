"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, TrendingUp, Calendar, Target, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthGuard } from "@/components/AuthGuard";
import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";

import { CampaignsOverviewV2 } from "@/components/campaigns/unified/CampaignsOverviewV2";
import { ActiveCampaignsV2 } from "@/components/campaigns/unified/ActiveCampaignsV2";
import { ProposalsTab } from "@/components/campaigns/unified/ProposalsTab";
import { ArchiveTab } from "@/components/campaigns/unified/ArchiveTab";

export default function UnifiedCampaignsDashboard() {
  const router = useRouter();
  const { user } = useEnhancedAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
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
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const storedTokens = localStorage.getItem('auth_tokens');

        if (!storedTokens) return;

        const tokenData = JSON.parse(storedTokens);
        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) return;

        const data = await response.json();

        // Extract counts from summary if available
        if (data.summary) {
          setStats({
            active: data.summary.active_count || 0,
            proposals: data.summary.proposals_count || 0,
            completed: data.summary.completed_count || 0,
            totalReach: data.summary.total_reach || "0",
            engagement: data.summary.avg_engagement || "0%",
            totalSpend: data.summary.total_spend || "$0"
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
              {/* Top Section */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
                  <p className="text-muted-foreground mt-1">
                    Create and manage influencer campaigns
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/campaigns/new')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-3 mt-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns by name or brand"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>

                <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-semibold">Filter by Status</div>
                    <DropdownMenuItem>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Active Campaigns
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        In Review
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        Draft
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm font-semibold">Filter by Date</div>
                    <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                    <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                    <DropdownMenuItem>Last 3 months</DropdownMenuItem>
                    <DropdownMenuItem>Custom range</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Clear filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {!isAgencyClient && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10">
                        Quick Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => router.push('/campaigns/templates')}>
                        Browse Templates
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/campaigns/import')}>
                        Import from CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/campaigns/duplicate')}>
                        Duplicate Campaign
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/campaigns/analytics')}>
                        View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/campaigns/export')}>
                        Export Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
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