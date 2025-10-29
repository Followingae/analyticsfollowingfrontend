"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Target,
  Activity,
  Award,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CampaignAnalyticsViewProps {
  campaign: any;
  stage: any;
}

export function CampaignAnalyticsView({ campaign, stage }: CampaignAnalyticsViewProps) {
  const [timeframe, setTimeframe] = useState("7d");

  // Mock analytics data
  const analytics = {
    overview: {
      totalReach: 2500000,
      totalEngagement: 112500,
      engagementRate: 4.5,
      totalPosts: 24,
      activeInfluencers: 8,
      roi: 320,
      conversions: 1250,
      revenue: 87500,
    },
    performance: {
      daily: [
        { date: "Mon", reach: 320000, engagement: 14400 },
        { date: "Tue", reach: 380000, engagement: 19000 },
        { date: "Wed", reach: 420000, engagement: 18900 },
        { date: "Thu", reach: 350000, engagement: 17500 },
        { date: "Fri", reach: 410000, engagement: 20500 },
        { date: "Sat", reach: 380000, engagement: 15200 },
        { date: "Sun", reach: 240000, engagement: 7000 },
      ],
    },
    topContent: [
      {
        id: "1",
        title: "Summer Collection Launch Post",
        creator: "@lifestyle_maven",
        reach: 450000,
        engagement: 22500,
        engagementRate: 5.0,
        type: "Post",
      },
      {
        id: "2",
        title: "Behind the Scenes Reel",
        creator: "@fashion_forward",
        reach: 380000,
        engagement: 22800,
        engagementRate: 6.0,
        type: "Reel",
      },
      {
        id: "3",
        title: "Product Showcase Carousel",
        creator: "@tech_innovator",
        reach: 320000,
        engagement: 14400,
        engagementRate: 4.5,
        type: "Carousel",
      },
    ],
    demographics: {
      gender: { Female: 68, Male: 32 },
      age: { "18-24": 25, "25-34": 45, "35-44": 20, "45+": 10 },
      location: { US: 65, UK: 15, CA: 10, AU: 5, Other: 5 },
    },
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <ArrowUp className="mr-1 h-3 w-3" />
                  12%
                </Badge>
              </div>
              <div>
                <div className="text-3xl font-bold">{formatNumber(analytics.overview.totalReach)}</div>
                <div className="text-sm text-muted-foreground">Total Reach</div>
              </div>
              <Progress value={85} className="mt-3 h-1" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <ArrowUp className="mr-1 h-3 w-3" />
                  8%
                </Badge>
              </div>
              <div>
                <div className="text-3xl font-bold">{analytics.overview.engagementRate}%</div>
                <div className="text-sm text-muted-foreground">Engagement Rate</div>
              </div>
              <Progress value={92} className="mt-3 h-1" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <ArrowUp className="mr-1 h-3 w-3" />
                  24%
                </Badge>
              </div>
              <div>
                <div className="text-3xl font-bold">{formatCurrency(analytics.overview.revenue)}</div>
                <div className="text-sm text-muted-foreground">Revenue Generated</div>
              </div>
              <Progress value={78} className="mt-3 h-1" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Award className="h-5 w-5 text-orange-600" />
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Excellent
                </Badge>
              </div>
              <div>
                <div className="text-3xl font-bold">{analytics.overview.roi}%</div>
                <div className="text-sm text-muted-foreground">ROI</div>
              </div>
              <Progress value={95} className="mt-3 h-1" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="content">Top Content</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-1 h-3 w-3" />
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-1 h-3 w-3" />
              Filters
            </Button>
            <Button size="sm">
              <Download className="mr-1 h-3 w-3" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="performance" className="mt-6 space-y-6">
          {/* Performance Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Daily reach and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.performance.daily.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.reach / 420000) * 100}%` }}
                        transition={{ delay: index * 0.1 }}
                        className="w-full bg-primary/20 rounded-t"
                        style={{ minHeight: "20px" }}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.engagement / 22800) * 100}%` }}
                        transition={{ delay: index * 0.1 + 0.05 }}
                        className="w-full bg-primary rounded-t"
                        style={{ minHeight: "10px" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.date}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/20 rounded" />
                  <span className="text-sm text-muted-foreground">Reach</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded" />
                  <span className="text-sm text-muted-foreground">Engagement</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Heart className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">89.2K</div>
                    <div className="text-xs text-muted-foreground">Total Likes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">18.3K</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Share2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">5.1K</div>
                    <div className="text-xs text-muted-foreground">Shares</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Content ranked by engagement rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topContent.map((content, index) => (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{content.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {content.creator} • {content.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(content.reach)}</div>
                        <div className="text-xs text-muted-foreground">Reach</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">{content.engagementRate}%</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="mt-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Gender Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Female</span>
                      <span className="text-sm font-medium">{analytics.demographics.gender.Female}%</span>
                    </div>
                    <Progress value={analytics.demographics.gender.Female} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Male</span>
                      <span className="text-sm font-medium">{analytics.demographics.gender.Male}%</span>
                    </div>
                    <Progress value={analytics.demographics.gender.Male} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Age Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.demographics.age).map(([age, percentage]) => (
                    <div key={age}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{age}</span>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Top Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.demographics.location)
                    .slice(0, 4)
                    .map(([country, percentage]) => (
                      <div key={country}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{country}</span>
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="mt-6">
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Conversion Analytics</h3>
            <p className="text-muted-foreground mb-6">
              Track sales, sign-ups, and other conversion metrics
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{analytics.overview.conversions}</div>
                  <div className="text-xs text-muted-foreground">Total Conversions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">2.1%</div>
                  <div className="text-xs text-muted-foreground">Conversion Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">$70</div>
                  <div className="text-xs text-muted-foreground">Avg. Order Value</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}