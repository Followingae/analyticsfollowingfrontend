"use client";

import { useState, useMemo } from "react";
import {
  Check,
  X,
  Eye,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Influencer {
  id: string;
  username: string;
  name: string;
  followers: number;
  engagement: number;
  category: string;
  location: string;
  estimatedReach: number;
  estimatedEngagements: number;
  costPerPost: number;
  verified: boolean;
  topContent: {
    thumbnail: string;
  }[];
  recentPerformance: "rising" | "stable" | "declining";
}

interface InfluencerSelectionViewProps {
  campaignId: string;
  suggestedInfluencers?: any[];
}

export function InfluencerSelectionView({
  campaignId,
  suggestedInfluencers,
}: InfluencerSelectionViewProps) {
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
  const [rejectedInfluencers, setRejectedInfluencers] = useState<Set<string>>(new Set());

  // Generate comprehensive mock data for 80 influencers
  const influencers: Influencer[] = useMemo(() => {
    const categories = ["Fashion", "Beauty", "Lifestyle", "Fitness", "Food", "Travel", "Tech"];
    const locations = ["New York", "Los Angeles", "Miami", "Chicago", "Dallas", "Atlanta", "SF"];

    return Array.from({ length: 80 }, (_, i) => ({
      id: `inf-${i + 1}`,
      username: `influencer_${i + 1}`,
      name: `Influencer Name ${i + 1}`,
      followers: Math.floor(Math.random() * 900000) + 100000,
      engagement: parseFloat((Math.random() * 8 + 2).toFixed(2)),
      category: categories[i % categories.length],
      location: locations[i % locations.length],
      estimatedReach: Math.floor(Math.random() * 500000) + 50000,
      estimatedEngagements: Math.floor(Math.random() * 30000) + 3000,
      costPerPost: Math.floor(Math.random() * 2000) + 500,
      verified: Math.random() > 0.3,
      topContent: Array.from({ length: 2 }, () => ({
        thumbnail: `https://picsum.photos/200/200?random=${Math.random()}`,
      })),
      recentPerformance: ["rising", "stable", "declining"][Math.floor(Math.random() * 3)] as any,
    }));
  }, []);

  // Calculate real-time campaign impact
  const campaignImpact = useMemo(() => {
    const selected = influencers.filter(inf => selectedInfluencers.has(inf.id));

    return {
      totalReach: selected.reduce((sum, inf) => sum + inf.estimatedReach, 0),
      totalEngagements: selected.reduce((sum, inf) => sum + inf.estimatedEngagements, 0),
      totalCost: selected.reduce((sum, inf) => sum + inf.costPerPost, 0),
      avgEngagementRate: selected.length > 0
        ? (selected.reduce((sum, inf) => sum + inf.engagement, 0) / selected.length).toFixed(2)
        : "0.00",
      selectedCount: selected.length,
      rejectedCount: rejectedInfluencers.size,
      pendingCount: influencers.length - selected.length - rejectedInfluencers.size,
    };
  }, [selectedInfluencers, rejectedInfluencers, influencers]);

  const handleSelectInfluencer = (id: string) => {
    const newSelected = new Set(selectedInfluencers);
    const newRejected = new Set(rejectedInfluencers);

    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
      newRejected.delete(id);
    }

    setSelectedInfluencers(newSelected);
    setRejectedInfluencers(newRejected);
  };

  const handleRejectInfluencer = (id: string) => {
    const newSelected = new Set(selectedInfluencers);
    const newRejected = new Set(rejectedInfluencers);

    if (newRejected.has(id)) {
      newRejected.delete(id);
    } else {
      newRejected.add(id);
      newSelected.delete(id);
    }

    setSelectedInfluencers(newSelected);
    setRejectedInfluencers(newRejected);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Influencer Grid (70%) */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Suggested Influencers</h3>
            <Badge variant="outline">{influencers.length} Total</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="grid grid-cols-4 gap-3">
            {influencers.map((influencer) => {
              const isSelected = selectedInfluencers.has(influencer.id);
              const isRejected = rejectedInfluencers.has(influencer.id);

              return (
                <Card
                  key={influencer.id}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-200 hover:shadow-md",
                    isSelected && "ring-1 ring-green-500 bg-green-50/50",
                    isRejected && "ring-1 ring-red-500 bg-red-50/50 opacity-75"
                  )}
                >
                  <CardContent className="p-3">
                    {/* Profile Header */}
                    <div className="flex items-start gap-2 mb-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://picsum.photos/100/100?random=${influencer.id}`} />
                        <AvatarFallback className="text-xs">
                          {influencer.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">@{influencer.username}</p>
                          {influencer.verified && (
                            <CheckCircle2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{influencer.category}</span>
                          <span>•</span>
                          <span>{influencer.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium">
                            {(influencer.followers / 1000).toFixed(0)}K
                          </span>
                          <span className="text-muted-foreground ml-1">followers</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <span className="font-medium">{influencer.engagement}%</span>
                          <span className="text-muted-foreground">eng</span>
                          {influencer.recentPerformance === "rising" && (
                            <ArrowUp className="h-3 w-3 text-green-500" />
                          )}
                          {influencer.recentPerformance === "declining" && (
                            <ArrowDown className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>
                      <span className="font-medium">${influencer.costPerPost}</span>
                    </div>

                    {/* Recent Posts */}
                    <div className="flex gap-1 mb-2">
                      {influencer.topContent.map((content, idx) => (
                        <div
                          key={idx}
                          className="relative flex-1 aspect-square rounded overflow-hidden"
                        >
                          <img
                            src={content.thumbnail}
                            alt="Content"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "flex-1 h-8 transition-all",
                          isSelected && "bg-green-100 hover:bg-green-200 text-green-700"
                        )}
                        onClick={() => handleSelectInfluencer(influencer.id)}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected ? "border-green-600 bg-green-600" : "border-gray-400"
                        )}>
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "flex-1 h-8 transition-all",
                          isRejected && "bg-red-100 hover:bg-red-200 text-red-700"
                        )}
                        onClick={() => handleRejectInfluencer(influencer.id)}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                          isRejected ? "border-red-600 bg-red-600" : "border-gray-400"
                        )}>
                          {isRejected && <X className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Real-time Campaign Impact (30%) - Sticky */}
      <div className="w-[30%] border-l bg-background">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-medium mb-4">Selection Progress</h3>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Selected</span>
                  <span className="font-medium">{campaignImpact.selectedCount}/80</span>
                </div>
                <Progress
                  value={(campaignImpact.selectedCount / 80) * 100}
                  className="h-2"
                />
              </div>

              {/* Status Counts */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-lg font-semibold text-green-700">{campaignImpact.selectedCount}</p>
                  <p className="text-xs text-green-600">Selected</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-lg font-semibold text-red-700">{campaignImpact.rejectedCount}</p>
                  <p className="text-xs text-red-600">Rejected</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-lg font-semibold text-gray-700">{campaignImpact.pendingCount}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Campaign Metrics */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Estimated Reach</p>
                  <p className="text-sm font-semibold">
                    {campaignImpact.totalReach >= 1000000
                      ? `${(campaignImpact.totalReach / 1000000).toFixed(1)}M`
                      : `${(campaignImpact.totalReach / 1000).toFixed(0)}K`}
                  </p>
                </div>
                <Progress
                  value={Math.min(100, (campaignImpact.totalReach / 5000000) * 100)}
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Goal: 5M ({Math.min(100, (campaignImpact.totalReach / 5000000) * 100).toFixed(0)}%)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Engagements</p>
                  <p className="text-sm font-semibold">
                    {(campaignImpact.totalEngagements / 1000).toFixed(0)}K
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg rate: {campaignImpact.avgEngagementRate}%
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Campaign Cost</p>
                  <p className="text-sm font-semibold">
                    ${campaignImpact.totalCost.toLocaleString()}
                  </p>
                </div>
                <Progress
                  value={Math.min(100, (campaignImpact.totalCost / 25000) * 100)}
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Budget: $25K ({((campaignImpact.totalCost / 25000) * 100).toFixed(0)}%)
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium">Cost per 1K Reach</p>
                  <p className="text-sm font-semibold">
                    ${campaignImpact.totalReach > 0
                      ? ((campaignImpact.totalCost / campaignImpact.totalReach) * 1000).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Industry avg: $7.50</p>
              </div>
            </div>

            <Separator />

            {/* Recommendation */}
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-xs font-medium mb-1">AI Recommendation</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {campaignImpact.selectedCount < 10
                  ? "Select at least 10 influencers for optimal campaign reach. Consider diversifying across categories."
                  : campaignImpact.selectedCount > 20
                  ? "You've selected many influencers. Consider focusing on quality over quantity for better engagement."
                  : "Good selection size! Your campaign has balanced reach and engagement potential."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <Button
                className="w-full"
                disabled={campaignImpact.selectedCount === 0}
                onClick={() => {
                  toast.success(`${campaignImpact.selectedCount} influencers confirmed!`);
                }}
              >
                Confirm Selection ({campaignImpact.selectedCount})
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedInfluencers(new Set());
                  setRejectedInfluencers(new Set());
                }}
              >
                Reset All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}