"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, Users, FileText, Eye, Trash2, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";

// Backend response interfaces
interface BackendCampaign {
  id: string;
  name: string;
  brand_name: string;
  brand_logo_url: string | null;
  status: "active" | "completed" | "draft";
  created_at: string;
  updated_at: string;
}

interface CampaignSummary {
  totalCampaigns: number;
  totalCreators: number;
  totalReach: number;
  avgEngagementRate: number;
}

interface CampaignsResponse {
  success: boolean;
  data: {
    campaigns: BackendCampaign[];
    summary: CampaignSummary;
    pagination: {
      limit: number;
      offset: number;
      total: number;
      has_more: boolean;
    };
  };
  message: string;
}

export default function CampaignsDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<BackendCampaign[]>([]);
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const { API_CONFIG, ENDPOINTS } = await import("@/config/api");
      const { fetchWithAuth } = await import("@/utils/apiInterceptor");

      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.list}`
      );

      if (!response.ok) {
        console.error("Failed to fetch campaigns:", response.status, response.statusText);
        // Don't throw error, just set empty data
        setCampaigns([]);
        setSummary({
          totalCampaigns: 0,
          totalCreators: 0,
          totalReach: 0,
          avgEngagementRate: 0,
        });
        return;
      }

      const result: CampaignsResponse = await response.json();
      setCampaigns(result.data?.campaigns || []);
      setSummary(result.data?.summary || {
        totalCampaigns: 0,
        totalCreators: 0,
        totalReach: 0,
        avgEngagementRate: 0,
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
      setSummary({
        totalCampaigns: 0,
        totalCreators: 0,
        totalReach: 0,
        avgEngagementRate: 0,
      });
    } finally {
      setIsLoading(false);
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

  const getStatusColor = (status: BackendCampaign["status"]) => {
    switch (status) {
      case "active":
        return "default" as const;
      case "completed":
        return "secondary" as const;
      case "draft":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="container mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and track your influencer marketing campaigns
                </p>
              </div>
              <Button onClick={() => router.push("/campaigns/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Campaign
              </Button>
            </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Campaigns
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalCampaigns || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaigns.filter((c) => c.status === "active").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalCreators || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary?.totalReach || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total impressions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Engagement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.avgEngagementRate.toFixed(1) || "0.0"}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Creators</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="text-right">Reach</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No campaigns found. Create your first campaign to get started.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.id.substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={campaign.brand_logo_url || ""} />
                          <AvatarFallback>
                            {campaign.brand_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{campaign.brand_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell>
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusColor(campaign.status)}
                        className={
                          campaign.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
                            : campaign.status === "completed"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300"
                        }
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        >
                          View Insights
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) return;

                                try {
                                  const { API_CONFIG, ENDPOINTS } = await import("@/config/api");
                                  const { tokenManager } = await import("@/utils/tokenManager");
                                  const { toast } = await import("sonner");

                                  const tokenResult = await tokenManager.getValidToken();
                                  if (!tokenResult.isValid || !tokenResult.token) {
                                    toast.error("Please log in again");
                                    return;
                                  }

                                  const response = await fetch(
                                    `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.delete(campaign.id)}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Authorization: `Bearer ${tokenResult.token}`,
                                      },
                                    }
                                  );

                                  if (!response.ok) {
                                    const error = await response.json().catch(() => ({}));
                                    throw new Error(error.detail || "Failed to delete campaign");
                                  }

                                  toast.success("Campaign deleted successfully");
                                  window.location.reload();
                                } catch (error) {
                                  const { toast } = await import("sonner");
                                  const message = error instanceof Error ? error.message : "Failed to delete campaign";
                                  toast.error(message);
                                }
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
