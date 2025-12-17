"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Eye,
  Activity,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

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

interface CampaignAnalyticsCardsProps {
  className?: string;
}

export function CampaignAnalyticsCards({ className = "" }: CampaignAnalyticsCardsProps) {
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setIsLoading(true);

        // Import the complete campaign API service
        const { campaignApi } = await import('@/services/campaignApiComplete');

        const response = await campaignApi.getDashboardOverview();

        if (response.success && response.data) {
          // Process summary data to handle missing values gracefully
          const summary = response.data.summary;
          if (summary) {
            // Ensure all metrics have valid values
            summary.totalReach = summary.totalReach || { current: 0, previous: 0, trend: 'stable', changePercent: 0 };
            summary.avgEngagementRate = summary.avgEngagementRate || { current: 0, previous: 0, trend: 'stable', changePercent: 0 };
            summary.totalSpend = summary.totalSpend || { current: 0, previous: 0, trend: 'stable', changePercent: 0 };
          }

          setSummary(summary || null);
        } else {
          throw new Error(response.error || 'Failed to fetch overview data');
        }
      } catch (error) {
        console.error("Error fetching overview data:", error);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Total Reach */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-base text-muted-foreground">Total Reach</p>
            <p className="text-4xl font-bold mt-2">{formatNumber(summary.totalReach.current)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Average Engagement */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-base text-muted-foreground">Avg. Engagement</p>
            <p className="text-4xl font-bold mt-2">{summary.avgEngagementRate.current}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Campaigns */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-base text-muted-foreground">Total Campaigns</p>
            <p className="text-4xl font-bold mt-2">{summary.totalCampaigns}</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Creators */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-base text-muted-foreground">Total Creators</p>
            <p className="text-4xl font-bold mt-2">{summary.totalCreators}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}