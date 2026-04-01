'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { superadminService } from '@/utils/superadminApi';
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/analytics-cards";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import {
  Users,
  Coins,
  Briefcase,
  BarChart3,
  TrendingUp,
  UserPlus,
  Activity,
  Target
} from "lucide-react";
import { cn } from '@/lib/utils';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    premium: number;
    new_this_month: number;
  };
  revenue: {
    total_mrr: number;
    new_mrr_this_month: number;
  };
  content: {
    total_profiles: number;
    profiles_analyzed_today: number;
  };
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // PERF FIX: No artificial delays - show content immediately when data is ready
  const showHeader = !loading && !!stats;
  const showCards = !loading && !!stats;
  const showMetrics = !loading && !!stats;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsData = await superadminService.getDashboardStats();

      // Transform flat backend response to nested structure expected by component
      // Backend returns: { total_users, active_users, total_profiles, total_revenue_this_month, etc. }
      // Component expects: { users: { total, active }, revenue: { total_mrr }, etc. }

      const transformedStats: DashboardStats = {
        users: {
          total: statsData.total_users || 0,
          active: statsData.active_users || 0,
          premium: statsData.premium_users || 0, // This might not exist in backend
          new_this_month: statsData.new_users_this_month || 0
        },
        revenue: {
          total_mrr: statsData.total_revenue_this_month || 0,
          new_mrr_this_month: statsData.total_revenue_this_month || 0
        },
        content: {
          total_profiles: statsData.total_profiles || 0,
          profiles_analyzed_today: statsData.profiles_analyzed_today || 0
        }
      };

      setStats(transformedStats);
    } catch (err: any) {
      // Set default values on error
      setStats({
        users: { total: 0, active: 0, premium: 0, new_this_month: 0 },
        revenue: { total_mrr: 0, new_mrr_this_month: 0 },
        content: { total_profiles: 0, profiles_analyzed_today: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const navigationCards = [
    {
      label: 'User Management',
      path: '/superadmin/users',
      icon: Users,
      metric: (stats?.users?.total || 0).toLocaleString(),
      subMetric: `${stats?.users?.active || 0} active users`,
      description: 'Manage users and permissions'
    },
    {
      label: 'Billing & Revenue',
      path: '/superadmin/billing',
      icon: Coins,
      metric: `د.إ${((stats?.revenue?.total_mrr || 0) / 1000).toFixed(1)}k`,
      subMetric: `Monthly recurring revenue`,
      description: 'Track payments and subscriptions'
    },
    {
      label: 'Proposals',
      path: '/superadmin/proposals',
      icon: Briefcase,
      metric: 'Manage',
      subMetric: 'Campaign proposals',
      description: 'Create and manage proposals'
    },
    {
      label: 'Content Profiles',
      path: '/superadmin/analytics',
      icon: Target,
      metric: (stats?.content?.total_profiles || 0).toLocaleString(),
      subMetric: 'Instagram profiles analyzed',
      description: 'Content and analytics data'
    },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className={cn(
          "transition-all duration-500 ease-out",
          showHeader ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform overview and quick actions
          </p>
        </div>

        {/* Navigation Cards - Primary Actions */}
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
          "transition-all duration-500 ease-out",
          showCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          {navigationCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                onClick={() => router.push(card.path)}
                className={cn(
                  "cursor-pointer group",
                  "hover:shadow-md transition-all duration-200",
                  "border border-border hover:border-primary/30"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-200">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight">
                    {card.metric}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subMetric}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Key Metrics Row */}
        {stats && (
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
            "transition-all duration-500 ease-out",
            showMetrics ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            <MetricCard
              title="Total Users"
              value={stats.users?.total?.toLocaleString() || "0"}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              change={stats.users?.new_this_month > 0 ? stats.users.new_this_month : undefined}
            />

            <MetricCard
              title="Active Users"
              value={stats.users?.active?.toLocaleString() || "0"}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />

            <MetricCard
              title="Monthly Revenue"
              value={`د.إ${(stats.revenue?.total_mrr || 0).toLocaleString()}`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />

            <MetricCard
              title="Profiles Analyzed"
              value={stats.content?.total_profiles?.toLocaleString() || "0"}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        )}

      </div>
    </div>
  );
}