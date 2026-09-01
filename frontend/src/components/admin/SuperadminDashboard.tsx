'use client';

/**
 * The console's front door.
 *
 * Four ways in, and three figures about the platform. It was eight bordered cards: four with
 * an icon in a tinted rounded tile inside them, four more holding one number each. The tiles
 * and the borders said nothing the gap between them does not, so they are gone and the
 * figures take the room the padding was using.
 *
 * The numbers themselves were the bigger problem. Every one of them read `x || 0`, so a
 * response that arrived without its `user_metrics` block — or with one field missing —
 * printed a confident "0 users, 0 active, 0 profiles" on the screen a founder glances at.
 * A figure we were not given is a dash now. A real zero still prints 0.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { superadminService } from '@/utils/superadminApi';
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import {
  Users,
  Briefcase,
  Activity,
  Target,
  RefreshCw,
  Building2
} from "lucide-react";
import { PageHead, Stat, StatGrid } from "@/components/console/primitives";

interface DashboardStats {
  users: {
    total: number | null;
    active: number | null;
    premium: number | null;
    new_this_month: number | null;
  };
  revenue: {
    total_mrr: number | null;
    new_mrr_this_month: number | null;
  };
  content: {
    total_profiles: number | null;
    profiles_analyzed_today: number | null;
  };
}

/** First figure that actually is one. Absent stays absent rather than falling through to 0. */
const pick = (...vals: unknown[]): number | null => {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
};

const show = (v: number | null) => (v == null ? '—' : v.toLocaleString());

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await superadminService.getDashboardStats();

      // Handle both response shapes:
      // Flat: { total_users, active_users, total_profiles, total_revenue_this_month, ... }
      // Nested: { data: { system_health, user_metrics, revenue, ... } }
      const flat = statsData?.data || statsData;
      const userMetrics = flat?.user_metrics || flat?.user_statistics || {};
      const revenueData = flat?.revenue || flat?.revenue_analytics || {};

      const transformedStats: DashboardStats = {
        users: {
          total: pick(userMetrics?.total_users, flat?.total_users),
          active: pick(userMetrics?.active_users, flat?.active_users),
          premium: pick(userMetrics?.premium_users, flat?.premium_users),
          new_this_month: pick(userMetrics?.new_users_this_month, flat?.new_users_this_month)
        },
        revenue: {
          total_mrr: pick(revenueData?.total_mrr, flat?.total_revenue_this_month),
          new_mrr_this_month: pick(revenueData?.new_mrr_this_month, flat?.total_revenue_this_month)
        },
        content: {
          total_profiles: pick(flat?.total_profiles),
          profiles_analyzed_today: pick(flat?.profiles_analyzed_today)
        }
      };

      setStats(transformedStats);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const navigationCards = [
    {
      label: 'Users',
      path: '/superadmin/users',
      icon: Users,
      metric: show(stats?.users?.total ?? null),
      subMetric: stats?.users?.active == null
        ? 'How many are active did not come back'
        : `${stats.users.active.toLocaleString()} active`,
    },
    {
      label: 'Proposals',
      path: '/superadmin/proposals',
      icon: Briefcase,
      metric: 'Open',
      subMetric: 'Quotes out with a client',
    },
    {
      label: 'Clients',
      path: '/superadmin/clients',
      icon: Building2,
      metric: 'Open',
      subMetric: 'Scope, commercial and approvals',
    },
    {
      label: 'Creators',
      path: '/work/influencers',
      icon: Target,
      metric: 'Open',
      subMetric: 'The master database, rates and tiers',
    },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  /* An error is not an empty platform: nothing below it is drawn, so the only claim on
     screen is the one we can stand behind. */
  if (error) {
    return (
      <div className="p-4 md:p-7">
        <div className="mx-auto max-w-[1600px] space-y-3">
          <p className="text-sm font-medium">Could not load the dashboard.</p>
          <p className="text-sm text-muted-foreground">
            {error}. Nothing here is known: these are not real figures of zero.
          </p>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-7">
      <div className="mx-auto max-w-[1600px] space-y-ds-5">
        <PageHead title="Dashboard" sub="Where the platform stands, and the four places you go most." />

        {/* The four ways in. Same shape as every other figure band on the console. */}
        <StatGrid>
          {navigationCards.map((card) => (
            <Stat
              key={card.path}
              label={card.label}
              value={card.metric}
              icon={card.icon}
              hint={card.subMetric}
              onClick={() => router.push(card.path)}
            />
          ))}
        </StatGrid>

        {stats && (
          <StatGrid cols={3}>
            <Stat label="Users in total" value={show(stats.users.total)} icon={Users}
                  hint={stats.users.new_this_month == null
                    ? 'New this month did not come back'
                    : `${stats.users.new_this_month.toLocaleString()} joined this month`} />
            <Stat label="Active users" value={show(stats.users.active)} icon={Activity}
                  tone={stats.users.active ? 'good' : 'neutral'}
                  hint="Signed in recently" />
            <Stat label="Profiles analysed" value={show(stats.content.total_profiles)} icon={Target}
                  hint={stats.content.profiles_analyzed_today == null
                    ? 'Today’s count did not come back'
                    : `${stats.content.profiles_analyzed_today.toLocaleString()} today`} />
          </StatGrid>
        )}
      </div>
    </div>
  );
}
