"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Copy,
  Archive,
  Trash2,
  ChevronRight,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  brand_name: string;
  brand_logo_url: string | null;
  status: "active" | "completed" | "draft" | "in_review" | "paused";
  created_at: string;
  updated_at: string;
  engagement_rate: number;
  total_reach: number;
  creators_count: number;
  progress: number;
  budget: string;
  deadline: string;
  content_delivered: number;
  content_total: number;
}

interface ActiveCampaignsProps {
  searchQuery: string;
}

export function ActiveCampaignsV2({ searchQuery }: ActiveCampaignsProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);

      const mockCampaigns: Campaign[] = [
        {
          id: "1",
          name: "Summer Collection Launch",
          brand_name: "Fashion Forward",
          brand_logo_url: "https://picsum.photos/100/100?random=1",
          status: "active",
          created_at: "2024-10-20T00:00:00Z",
          updated_at: "2024-10-25T00:00:00Z",
          engagement_rate: 4.8,
          total_reach: 850000,
          creators_count: 12,
          progress: 65,
          budget: "$25,000",
          deadline: "2024-11-15",
          content_delivered: 18,
          content_total: 28
        },
        {
          id: "2",
          name: "Brand Awareness Q4",
          brand_name: "TechNova",
          brand_logo_url: "https://picsum.photos/100/100?random=2",
          status: "active",
          created_at: "2024-10-15T00:00:00Z",
          updated_at: "2024-10-22T00:00:00Z",
          engagement_rate: 3.9,
          total_reach: 650000,
          creators_count: 8,
          progress: 40,
          budget: "$18,500",
          deadline: "2024-12-01",
          content_delivered: 10,
          content_total: 25
        },
        {
          id: "3",
          name: "Holiday Campaign 2024",
          brand_name: "Lifestyle Co",
          brand_logo_url: "https://picsum.photos/100/100?random=3",
          status: "in_review",
          created_at: "2024-10-24T00:00:00Z",
          updated_at: "2024-10-24T00:00:00Z",
          engagement_rate: 0,
          total_reach: 0,
          creators_count: 15,
          progress: 0,
          budget: "$32,000",
          deadline: "2024-12-20",
          content_delivered: 0,
          content_total: 45
        },
        {
          id: "4",
          name: "Product Launch - Series X",
          brand_name: "Innovation Labs",
          brand_logo_url: "https://picsum.photos/100/100?random=4",
          status: "active",
          created_at: "2024-10-18T00:00:00Z",
          updated_at: "2024-10-26T00:00:00Z",
          engagement_rate: 5.2,
          total_reach: 1200000,
          creators_count: 20,
          progress: 85,
          budget: "$45,000",
          deadline: "2024-10-30",
          content_delivered: 38,
          content_total: 45
        },
        {
          id: "5",
          name: "Sustainability Initiative",
          brand_name: "EcoForward",
          brand_logo_url: "https://picsum.photos/100/100?random=5",
          status: "paused",
          created_at: "2024-09-15T00:00:00Z",
          updated_at: "2024-10-10T00:00:00Z",
          engagement_rate: 3.5,
          total_reach: 420000,
          creators_count: 6,
          progress: 30,
          budget: "$15,000",
          deadline: "2024-11-30",
          content_delivered: 6,
          content_total: 20
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 800));
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        label: "Active",
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        dot: "bg-green-500"
      },
      in_review: {
        label: "In Review",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        dot: "bg-blue-500"
      },
      paused: {
        label: "Paused",
        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        dot: "bg-amber-500"
      },
      completed: {
        label: "Completed",
        color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
        dot: "bg-slate-500"
      },
      draft: {
        label: "Draft",
        color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
        dot: "bg-gray-500"
      }
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const getDaysRemaining = (deadline: string): number => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(query) ||
      campaign.brand_name.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredCampaigns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No active campaigns</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            {searchQuery
              ? "No campaigns match your search criteria"
              : "Start your first campaign to engage with creators"}
          </p>
          <Button onClick={() => router.push('/campaigns/new')}>
            Create Campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredCampaigns.map((campaign) => {
        const statusConfig = getStatusConfig(campaign.status);
        const daysRemaining = getDaysRemaining(campaign.deadline);
        const isUrgent = daysRemaining <= 7 && campaign.status === "active";

        return (
          <Card
            key={campaign.id}
            className={cn(
              "group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
              isUrgent && "ring-2 ring-amber-500/20"
            )}
            onClick={() => router.push(`/campaigns/${campaign.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Brand Logo */}
                <Avatar className="h-12 w-12 rounded-lg">
                  <AvatarImage src={campaign.brand_logo_url || ""} />
                  <AvatarFallback className="rounded-lg text-xs">
                    {campaign.brand_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Campaign Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {campaign.name}
                        </h3>
                        <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusConfig.dot)} />
                          {statusConfig.label}
                        </Badge>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {daysRemaining} days left
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.brand_name} • {campaign.budget}
                      </p>
                    </div>

                    {/* Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/campaigns/${campaign.id}`);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/campaigns/${campaign.id}/edit`);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status === "active" && (
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-amber-600">
                            <Clock className="mr-2 h-4 w-4" />
                            Pause Campaign
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "paused" && (
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-green-600">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Resume Campaign
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Creators</p>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{campaign.creators_count}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reach</p>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatNumber(campaign.total_reach)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{campaign.engagement_rate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Content</p>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {campaign.content_delivered}/{campaign.content_total}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(campaign.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Campaign Progress</span>
                      <span className="font-medium">{campaign.progress}%</span>
                    </div>
                    <Progress value={campaign.progress} className="h-2" />
                  </div>

                  {/* Quick Actions */}
                  {campaign.status === "active" && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/campaigns/${campaign.id}/influencers`);
                        }}
                      >
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        Manage Creators
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/campaigns/${campaign.id}/content`);
                        }}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View Content
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/campaigns/${campaign.id}`);
                        }}
                        className="ml-auto"
                      >
                        View Details
                        <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}