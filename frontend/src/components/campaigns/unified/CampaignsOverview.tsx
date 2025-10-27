"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  FileText,
  Eye,
  Calendar,
  Activity,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface CampaignSummary {
  totalCampaigns: number;
  totalCreators: number;
  totalReach: number;
  avgEngagementRate: number;
  activeCampaigns: number;
  completedCampaigns: number;
  pendingProposals: number;
  thisMonthCampaigns: number;
}

interface RecentCampaign {
  id: string;
  name: string;
  status: "active" | "completed" | "draft" | "proposal_pending";
  engagement_rate?: number;
  total_reach?: number;
  creators_count?: number;
  created_at: string;
  updated_at: string;
}

interface CampaignsOverviewProps {
  searchQuery: string;
}

export function CampaignsOverview({ searchQuery }: CampaignsOverviewProps) {
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

      // Mock data for frontend demo
      const mockSummary: CampaignSummary = {
        totalCampaigns: 12,
        totalCreators: 45,
        totalReach: 2800000,
        avgEngagementRate: 4.2,
        activeCampaigns: 8,
        completedCampaigns: 4,
        pendingProposals: 3,
        thisMonthCampaigns: 6
      };

      const mockRecentCampaigns: RecentCampaign[] = [
        {
          id: "1",
          name: "Summer Collection Launch",
          status: "active",
          engagement_rate: 4.8,
          total_reach: 850000,
          creators_count: 12,
          created_at: "2024-10-20T00:00:00Z",
          updated_at: "2024-10-25T00:00:00Z"
        },
        {
          id: "2",
          name: "Brand Awareness Q4",
          status: "completed",
          engagement_rate: 3.9,
          total_reach: 650000,
          creators_count: 8,
          created_at: "2024-10-15T00:00:00Z",
          updated_at: "2024-10-22T00:00:00Z"
        },
        {
          id: "3",
          name: "Product Launch",
          status: "proposal_pending",
          engagement_rate: 0,
          total_reach: 0,
          creators_count: 0,
          created_at: "2024-10-24T00:00:00Z",
          updated_at: "2024-10-24T00:00:00Z"
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setSummary(mockSummary);
      setRecentCampaigns(mockRecentCampaigns);
    } catch (error) {
      console.error("Error fetching overview data:", error);
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

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        label: "Active",
        icon: Circle,
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
      },
      completed: {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
      },
      draft: {
        label: "Draft",
        icon: AlertCircle,
        className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
      },
      proposal_pending: {
        label: "Proposal Pending",
        icon: Clock,
        className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{summary?.totalCampaigns || 0}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Activity className="h-3 w-3" />
                <span>{summary?.activeCampaigns || 0} active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{summary?.totalCreators || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all campaigns
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {formatNumber(summary?.totalReach || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total impressions
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {summary?.avgEngagementRate?.toFixed(1) || "0.0"}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all campaigns
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Campaigns</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/campaigns?tab=active")}
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.length > 0 ? (
                  recentCampaigns.map((campaign) => {
                    const statusConfig = getStatusConfig(campaign.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/campaigns/${campaign.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{campaign.name}</h4>
                            <Badge variant="secondary" className={statusConfig.className}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {campaign.creators_count && (
                              <span>{campaign.creators_count} creators</span>
                            )}
                            {campaign.total_reach && (
                              <span>{formatNumber(campaign.total_reach)} reach</span>
                            )}
                            {campaign.engagement_rate && (
                              <span>{campaign.engagement_rate.toFixed(1)}% engagement</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(campaign.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No campaigns yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => router.push("/campaigns/new")}
                    >
                      Create your first campaign
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Progress & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Campaign Status Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Campaigns</span>
                    <span className="font-medium">{summary?.activeCampaigns || 0}</span>
                  </div>
                  <Progress
                    value={summary?.totalCampaigns ? (summary.activeCampaigns / summary.totalCampaigns) * 100 : 0}
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed This Month</span>
                    <span className="font-medium">{summary?.completedCampaigns || 0}</span>
                  </div>
                  <Progress
                    value={summary?.thisMonthCampaigns ? (summary.completedCampaigns / summary.thisMonthCampaigns) * 100 : 0}
                    className="h-2"
                  />
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm">Quick Actions</h4>
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => router.push("/campaigns/new")}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Create New Campaign
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => router.push("/discover")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Discover Creators
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => router.push("/my-lists")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Saved Lists
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}