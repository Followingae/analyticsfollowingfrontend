'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { superadminService } from '@/utils/superadminApi';
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/analytics-cards";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import {
  Users,
  DollarSign,
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

  // Animation states for sequential loading
  const [showHeader, setShowHeader] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && stats) {
      // Sequential animation timing
      const timers = [
        setTimeout(() => setShowHeader(true), 100),
        setTimeout(() => setShowCards(true), 300),
        setTimeout(() => setShowMetrics(true), 500)
      ];

      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [loading, stats]);

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
      console.error('Dashboard load error:', err);
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
      path: '/admin/users',
      icon: Users,
      metric: (stats?.users?.total || 0).toLocaleString(),
      subMetric: `${stats?.users?.active || 0} active users`,
      description: 'Manage users and permissions'
    },
    {
      label: 'Billing & Revenue',
      path: '/admin/billing',
      icon: DollarSign,
      metric: `$${((stats?.revenue?.total_mrr || 0) / 1000).toFixed(1)}k`,
      subMetric: `Monthly recurring revenue`,
      description: 'Track payments and subscriptions'
    },
    {
      label: 'HR Management',
      path: '/admin/hrm',
      icon: Briefcase,
      metric: 'Portal',
      subMetric: 'Employee management system',
      description: 'Manage team and resources'
    },
    {
      label: 'Content Profiles',
      path: '/admin/content/profiles',
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className={cn(
          "transition-all duration-700 ease-out",
          showHeader ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Superadmin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Complete system control and management
          </p>
        </div>

        {/* Navigation Cards - Primary Actions */}
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
          "transition-all duration-700 ease-out delay-200",
          showCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {navigationCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                onClick={() => router.push(card.path)}
                className={cn(
                  "relative overflow-hidden cursor-pointer group",
                  "hover:shadow-lg transition-all duration-300",
                  "border border-border/50 hover:border-primary/20"
                )}
              >
                <CardContent className="p-6">
                  {/* Icon with background */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {card.label}
                    </h3>
                    <p className="text-2xl font-bold tracking-tight">
                      {card.metric}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.subMetric}
                    </p>
                    <p className="text-xs text-muted-foreground/70 pt-2">
                      {card.description}
                    </p>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Key Metrics Row */}
        {stats && (
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
            "transition-all duration-700 ease-out delay-400",
            showMetrics ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <MetricCard
              title="Total Users"
              value={stats.users?.total?.toLocaleString() || "0"}
              icon={<Users className="h-4 w-4" />}
              trend={stats.users?.new_this_month > 0 ? {
                value: stats.users.new_this_month,
                label: "new this month",
                isPositive: true
              } : undefined}
            />

            <MetricCard
              title="Active Users"
              value={stats.users?.active?.toLocaleString() || "0"}
              icon={<Activity className="h-4 w-4" />}
              description="Currently active"
            />

            <MetricCard
              title="Monthly Revenue"
              value={`$${(stats.revenue?.total_mrr || 0).toLocaleString()}`}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={stats.revenue?.new_mrr_this_month > 0 ? {
                value: `+$${(stats.revenue.new_mrr_this_month).toLocaleString()}`,
                label: "this month",
                isPositive: true
              } : undefined}
            />

            <MetricCard
              title="Profiles Analyzed"
              value={stats.content?.total_profiles?.toLocaleString() || "0"}
              icon={<Target className="h-4 w-4" />}
              trend={stats.content?.profiles_analyzed_today > 0 ? {
                value: stats.content.profiles_analyzed_today,
                label: "today",
                isPositive: true
              } : undefined}
            />
          </div>
        )}

      </div>
    </div>
  );
}