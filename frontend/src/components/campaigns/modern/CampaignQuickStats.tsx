"use client";

import {
  TrendingUp,
  Users,
  Eye,
  DollarSign,
  Calendar,
  Target,
  Zap,
  Award
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  progress?: number;
}

interface CampaignQuickStatsProps {
  campaign: any;
  stages: any[];
}

export function CampaignQuickStats({ campaign, stages }: CampaignQuickStatsProps) {
  const stats: QuickStat[] = [
    {
      label: "Campaign Budget",
      value: "$25,000",
      change: 0,
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
      progress: 65,
    },
    {
      label: "Total Reach",
      value: "2.5M",
      change: 12,
      icon: Eye,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Influencers",
      value: "8/10",
      icon: Users,
      color: "text-purple-600 bg-purple-50",
      progress: 80,
    },
    {
      label: "Engagement Rate",
      value: "4.5%",
      change: 8,
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "Days Remaining",
      value: "18",
      icon: Calendar,
      color: "text-red-600 bg-red-50",
      progress: 40,
    },
    {
      label: "Campaign Score",
      value: "A+",
      icon: Award,
      color: "text-primary bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", stat.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {stat.change && (
                    <div className={cn(
                      "text-xs font-medium flex items-center gap-0.5",
                      stat.change > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      <TrendingUp className={cn(
                        "h-3 w-3",
                        stat.change < 0 && "rotate-180"
                      )} />
                      {Math.abs(stat.change)}%
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>

                {stat.progress !== undefined && (
                  <Progress value={stat.progress} className="h-1 mt-2" />
                )}

                {/* Background decoration */}
                <div className={cn(
                  "absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10",
                  stat.color.replace("text-", "bg-").split(" ")[0]
                )} />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}