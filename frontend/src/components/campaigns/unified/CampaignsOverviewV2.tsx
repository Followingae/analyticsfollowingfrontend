"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  Eye,
  Calendar,
  Activity,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Sparkles,
  ChevronRight,
  BarChart3
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

interface RecentCampaign {
  id: string;
  name: string;
  brand_name: string;
  brand_logo?: string;
  status: "active" | "completed" | "draft" | "in_review" | "paused";
  engagement_rate: number;
  total_reach: number;
  creators_count: number;
  created_at: string;
  updated_at: string;
  progress: number;
  budget: string;
  deadline: string;
}

interface TopCreator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  campaigns_count: number;
  total_reach: number;
  avg_engagement: number;
}

interface CampaignsOverviewProps {
  searchQuery: string;
}

export function CampaignsOverviewV2({ searchQuery }: CampaignsOverviewProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);

      const mockSummary: CampaignSummary = {
        totalCampaigns: 36,
        totalCreators: 145,
        totalReach: {
          current: 2800000,
          previous: 2100000,
          trend: "up",
          changePercent: 33.3
        },
        avgEngagementRate: {
          current: 4.8,
          previous: 4.2,
          trend: "up",
          changePercent: 14.3
        },
        activeCampaigns: 8,
        completedCampaigns: 24,
        pendingProposals: 3,
        thisMonthCampaigns: 6,
        totalSpend: {
          current: 84250,
          previous: 72000,
          trend: "up",
          changePercent: 17.0
        },
        contentProduced: 324
      };

      const mockRecentCampaigns: RecentCampaign[] = [
        {
          id: "1",
          name: "Summer Collection Launch",
          brand_name: "Fashion Forward",
          brand_logo: "https://picsum.photos/100/100?random=1",
          status: "active",
          engagement_rate: 4.8,
          total_reach: 850000,
          creators_count: 12,
          created_at: "2024-10-20T00:00:00Z",
          updated_at: "2024-10-25T00:00:00Z",
          progress: 65,
          budget: "$25,000",
          deadline: "2024-11-15"
        },
        {
          id: "2",
          name: "Brand Awareness Q4",
          brand_name: "TechNova",
          brand_logo: "https://picsum.photos/100/100?random=2",
          status: "active",
          engagement_rate: 3.9,
          total_reach: 650000,
          creators_count: 8,
          created_at: "2024-10-15T00:00:00Z",
          updated_at: "2024-10-22T00:00:00Z",
          progress: 40,
          budget: "$18,500",
          deadline: "2024-12-01"
        },
        {
          id: "3",
          name: "Product Launch - Series X",
          brand_name: "Innovation Labs",
          brand_logo: "https://picsum.photos/100/100?random=3",
          status: "completed",
          engagement_rate: 5.2,
          total_reach: 1200000,
          creators_count: 20,
          created_at: "2024-09-15T00:00:00Z",
          updated_at: "2024-10-20T00:00:00Z",
          progress: 100,
          budget: "$45,000",
          deadline: "2024-10-20"
        }
      ];

      const mockTopCreators: TopCreator[] = [
        {
          id: "1",
          name: "Sarah Johnson",
          handle: "@foodie_sarah",
          avatar: "https://picsum.photos/100/100?random=101",
          campaigns_count: 8,
          total_reach: 450000,
          avg_engagement: 5.2
        },
        {
          id: "2",
          name: "Mike Chen",
          handle: "@tech_mike",
          avatar: "https://picsum.photos/100/100?random=102",
          campaigns_count: 6,
          total_reach: 320000,
          avg_engagement: 4.8
        },
        {
          id: "3",
          name: "Emma Rodriguez",
          handle: "@fashion_emma",
          avatar: "https://picsum.photos/100/100?random=103",
          campaigns_count: 10,
          total_reach: 680000,
          avg_engagement: 4.5
        },
        {
          id: "4",
          name: "Alex Thompson",
          handle: "@fitness_alex",
          avatar: "https://picsum.photos/100/100?random=104",
          campaigns_count: 5,
          total_reach: 280000,
          avg_engagement: 6.1
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 800));
      setSummary(mockSummary);
      setRecentCampaigns(mockRecentCampaigns);
      setTopCreators(mockTopCreators);
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { label: "Active", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
      completed: { label: "Completed", color: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
      in_review: { label: "In Review", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
      paused: { label: "Paused", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
      draft: { label: "Draft", color: "bg-gray-100 text-gray-700", dot: "bg-gray-500" }
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
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
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              {summary.totalReach.trend === "up" ? (
                <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  {summary.totalReach.changePercent}%
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-medium text-red-600">
                  <ArrowDownRight className="h-3 w-3" />
                  {summary.totalReach.changePercent}%
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reach</p>
              <p className="text-2xl font-bold mt-1">{formatNumber(summary.totalReach.current)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                vs {formatNumber(summary.totalReach.previous)} last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              {summary.avgEngagementRate.trend === "up" ? (
                <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  {summary.avgEngagementRate.changePercent}%
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-medium text-red-600">
                  <ArrowDownRight className="h-3 w-3" />
                  {summary.avgEngagementRate.changePercent}%
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Engagement</p>
              <p className="text-2xl font-bold mt-1">{summary.avgEngagementRate.current}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                vs {summary.avgEngagementRate.previous}% last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                {summary.activeCampaigns} active
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold mt-1">{summary.totalCampaigns}</p>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={(summary.activeCampaigns / summary.totalCampaigns) * 100} className="h-1.5" />
                <span className="text-xs text-muted-foreground">
                  {Math.round((summary.activeCampaigns / summary.totalCampaigns) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                <Sparkles className="h-3 w-3" />
                Top tier
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Creators</p>
              <p className="text-2xl font-bold mt-1">{summary.totalCreators}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.contentProduced} pieces produced
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns & Top Creators */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Campaigns */}
        <div className="lg:col-span-2">
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
            <CardContent className="space-y-4">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No campaigns found</p>
                </div>
              ) : (
                filteredCampaigns.slice(0, 3).map((campaign) => {
                  const statusConfig = getStatusConfig(campaign.status);

                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={campaign.brand_logo} />
                        <AvatarFallback className="rounded-lg text-xs">
                          {campaign.brand_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{campaign.name}</p>
                          <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1", statusConfig.dot)} />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{campaign.brand_name}</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.creators_count} creators
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(campaign.total_reach)} reach
                          </span>
                        </div>
                        {campaign.status === "active" && (
                          <Progress value={campaign.progress} className="h-1 mt-2" />
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium">{campaign.budget}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(campaign.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {filteredCampaigns.length === 0 && (
                <div className="flex justify-center pt-2">
                  <Button onClick={() => router.push('/campaigns/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Creators */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Top Creators</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/creators')}
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {topCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/creators/${creator.handle.slice(1)}`)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={creator.avatar} />
                    <AvatarFallback>
                      {creator.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">{creator.handle}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">{creator.avg_engagement}%</p>
                    <p className="text-xs text-muted-foreground">
                      {creator.campaigns_count} campaigns
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm mt-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/campaigns/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/creators/discover')}
              >
                <Users className="mr-2 h-4 w-4" />
                Discover Creators
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/analytics')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}