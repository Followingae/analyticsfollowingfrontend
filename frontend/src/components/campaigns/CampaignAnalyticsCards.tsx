"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Eye,
  Activity,
  Coins,
  CheckCircle2,
  Calendar,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StandardMetricCard } from "@/components/ui/standard-metric-card";

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
      <div className={`grid gap-4 md:grid-cols-3 lg:grid-cols-6 ${className}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
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

  const formatAED = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toLocaleString();
  };

  return (
    <div className={`grid gap-4 md:grid-cols-3 lg:grid-cols-6 ${className}`}>
      <StandardMetricCard icon={Eye} label="Total Reach" value={formatNumber(summary.totalReach.current)} />
      <StandardMetricCard icon={TrendingUp} label="Avg. Engagement" value={`${summary.avgEngagementRate.current}%`} />
      <StandardMetricCard icon={Activity} label="Active" value={summary.activeCampaigns} />
      <StandardMetricCard icon={CheckCircle2} label="Completed" value={summary.completedCampaigns} />
      <StandardMetricCard icon={Users} label="Creators" value={summary.totalCreators} />
      <StandardMetricCard icon={Calendar} label="This Month" value={summary.thisMonthCampaigns} />
    </div>
  );
}