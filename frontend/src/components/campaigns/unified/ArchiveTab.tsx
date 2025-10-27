"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Calendar,
  Eye,
  Users,
  TrendingUp,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Download,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ArchivedCampaign {
  id: string;
  name: string;
  brand_name: string;
  brand_logo_url: string | null;
  status: "completed" | "cancelled" | "archived";
  archived_at: string;
  completed_at?: string;
  total_reach?: number;
  engagement_rate?: number;
  creators_count?: number;
  campaign_duration_days?: number;
  final_report_url?: string;
}

interface ArchiveTabProps {
  searchQuery: string;
}

export function ArchiveTab({ searchQuery }: ArchiveTabProps) {
  const router = useRouter();
  const [archivedCampaigns, setArchivedCampaigns] = useState<ArchivedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled" | "archived">("all");

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    fetchArchivedCampaigns();
  }, []);

  const fetchArchivedCampaigns = async () => {
    try {
      setIsLoading(true);

      // TEMPORARILY COMMENTED OUT API CALLS FOR DEMO - NO BACKEND DEPENDENCY
      /*
      const { API_CONFIG, ENDPOINTS } = await import("@/config/api");
      const { fetchWithAuth } = await import("@/utils/apiInterceptor");

      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.archived}`
      );

      if (response.ok) {
        const result = await response.json();
        setArchivedCampaigns(result.data?.campaigns || []);
      }
      */

      // Mock archived campaigns for demo
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockArchivedCampaigns: ArchivedCampaign[] = [
        {
          id: "archived1",
          name: "Summer Fashion Week 2024",
          brand_name: "StyleCorp",
          brand_logo_url: "https://picsum.photos/100/100?random=201",
          status: "completed",
          archived_at: "2024-09-15T00:00:00Z",
          completed_at: "2024-09-10T00:00:00Z",
          total_reach: 1200000,
          engagement_rate: 4.2,
          creators_count: 8,
          campaign_duration_days: 30,
          final_report_url: "#mock-report-1"
        },
        {
          id: "archived2",
          name: "Product Launch Campaign",
          brand_name: "TechFlow",
          brand_logo_url: "https://picsum.photos/100/100?random=202",
          status: "completed",
          archived_at: "2024-08-20T00:00:00Z",
          completed_at: "2024-08-15T00:00:00Z",
          total_reach: 850000,
          engagement_rate: 3.8,
          creators_count: 5,
          campaign_duration_days: 21,
          final_report_url: "#mock-report-2"
        },
        {
          id: "archived3",
          name: "Holiday Collection",
          brand_name: "WinterWear Co",
          brand_logo_url: "https://picsum.photos/100/100?random=203",
          status: "cancelled",
          archived_at: "2024-07-10T00:00:00Z",
          total_reach: 0,
          engagement_rate: 0,
          creators_count: 0,
          campaign_duration_days: 0
        }
      ];

      setArchivedCampaigns(mockArchivedCampaigns);
    } catch (error) {
      console.error("Error fetching archived campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreCampaign = async (campaign: ArchivedCampaign) => {
    try {
      // TEMPORARILY COMMENTED OUT API CALLS FOR DEMO - NO BACKEND DEPENDENCY
      /*
      const { API_CONFIG, ENDPOINTS } = await import("@/config/api");
      const { fetchWithAuth } = await import("@/utils/apiInterceptor");

      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.restore(campaign.id)}`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Campaign restored successfully");
        fetchArchivedCampaigns();
      } else {
        throw new Error("Failed to restore campaign");
      }
      */

      // Mock restore for demo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove from archived list (simulate restore)
      setArchivedCampaigns(prev => prev.filter(c => c.id !== campaign.id));

      toast.success("Campaign restored successfully (Demo Mode)");
    } catch (error) {
      toast.error("Failed to restore campaign");
    }
  };

  const handlePermanentDelete = async (campaign: ArchivedCampaign) => {
    if (!confirm(`Are you sure you want to permanently delete "${campaign.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // TEMPORARILY COMMENTED OUT API CALLS FOR DEMO - NO BACKEND DEPENDENCY
      /*
      const { API_CONFIG, ENDPOINTS } = await import("@/config/api");
      const { fetchWithAuth } = await import("@/utils/apiInterceptor");

      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.permanentDelete(campaign.id)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Campaign permanently deleted");
        fetchArchivedCampaigns();
      } else {
        throw new Error("Failed to delete campaign");
      }
      */

      // Mock delete for demo
      await new Promise(resolve => setTimeout(resolve, 800));

      // Remove from archived list
      setArchivedCampaigns(prev => prev.filter(c => c.id !== campaign.id));

      toast.success("Campaign permanently deleted (Demo Mode)");
    } catch (error) {
      toast.error("Failed to delete campaign");
    }
  };

  const handleDownloadReport = async (campaign: ArchivedCampaign) => {
    if (!campaign.final_report_url) {
      toast.error("No report available for this campaign");
      return;
    }

    try {
      // Mock download for demo - no actual file download
      /*
      // Create a temporary link to download the report
      const link = document.createElement('a');
      link.href = campaign.final_report_url;
      link.download = `${campaign.name}-final-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      */

      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success("Report download started (Demo Mode - No actual file)");
    } catch (error) {
      toast.error("Failed to download report");
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      completed: {
        label: "Completed",
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
      },
      archived: {
        label: "Archived",
        className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
      },
    };
    return configs[status as keyof typeof configs] || configs.archived;
  };

  const filteredCampaigns = archivedCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      campaign.brand_name.toLowerCase().includes(localSearchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Archive</h2>
            <p className="text-muted-foreground">
              View completed and archived campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search archived campaigns..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-9 w-80"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Status <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
                  Cancelled
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("archived")}>
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Archive Grid */}
        {filteredCampaigns.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => {
              const statusConfig = getStatusConfig(campaign.status);

              return (
                <Card
                  key={campaign.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {campaign.final_report_url && (
                            <DropdownMenuItem
                              onClick={() => handleDownloadReport(campaign)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Report
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRestoreCampaign(campaign)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePermanentDelete(campaign)}
                            className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {campaign.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {campaign.brand_logo_url && (
                        <img
                          src={campaign.brand_logo_url}
                          alt={campaign.brand_name}
                          className="h-4 w-4 rounded-full object-cover"
                        />
                      )}
                      <span>{campaign.brand_name}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        {campaign.total_reach && (
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="text-sm font-medium">
                                {formatNumber(campaign.total_reach)}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Reach</div>
                            </div>
                          </div>
                        )}
                        {campaign.creators_count && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="text-sm font-medium">
                                {campaign.creators_count}
                              </div>
                              <div className="text-xs text-muted-foreground">Creators</div>
                            </div>
                          </div>
                        )}
                        {campaign.engagement_rate && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-orange-600" />
                            <div>
                              <div className="text-sm font-medium">
                                {campaign.engagement_rate.toFixed(1)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Avg. Engagement</div>
                            </div>
                          </div>
                        )}
                        {campaign.campaign_duration_days && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="text-sm font-medium">
                                {campaign.campaign_duration_days} days
                              </div>
                              <div className="text-xs text-muted-foreground">Duration</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="pt-3 border-t space-y-1">
                        {campaign.completed_at && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Completed:</span>
                            <span>{new Date(campaign.completed_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Archived:</span>
                          <span>{new Date(campaign.archived_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        {campaign.final_report_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleDownloadReport(campaign)}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Report
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Archive className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No archived campaigns</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {localSearchQuery
                  ? "No archived campaigns match your search criteria."
                  : "You don't have any archived campaigns yet. Completed campaigns will appear here."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}