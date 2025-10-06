"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Plus,
  TrendingUp,
  Users,
  FileText,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
  Search,
  Circle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";
import { toast } from "sonner";

// Backend response interfaces
interface BackendCampaign {
  id: string;
  name: string;
  brand_name: string;
  brand_logo_url: string | null;
  status: "active" | "completed" | "draft";
  created_at: string;
  updated_at: string;
  engagement_rate?: number;
  total_reach?: number;
  creators_count?: number;
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

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

  const handleDeleteCampaign = async (campaign: BackendCampaign) => {
    if (!confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { API_CONFIG, ENDPOINTS } = await import("@/config/api");
      const { tokenManager } = await import("@/utils/tokenManager");

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
      await fetchCampaigns(); // Refresh the list
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete campaign";
      toast.error(message);
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

  // Helper to format column names for display
  const formatColumnName = (columnId: string): string => {
    const columnNames: Record<string, string> = {
      'id': 'ID',
      'name': 'Campaign Name',
      'brand_name': 'Brand',
      'engagement_rate': 'Engagement',
      'total_reach': 'Reach',
      'creators_count': 'Creators',
      'status': 'Status',
      'created_at': 'Created Date',
      'actions': 'Actions'
    };
    return columnNames[columnId] || columnId;
  };

  const columns: ColumnDef<BackendCampaign>[] = [
    {
      accessorKey: "id",
      header: () => <div className="w-[100px]">Campaign ID</div>,
      cell: ({ row }) => (
        <div className="font-medium w-[100px]">
          {row.getValue<string>("id").substring(0, 8).toUpperCase()}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Campaign Name",
      cell: ({ row }) => row.getValue("name"),
    },
    {
      accessorKey: "brand_name",
      header: "Brand",
      cell: ({ row }) => row.getValue("brand_name"),
    },
    {
      accessorKey: "engagement_rate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            Engagement
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const engagementRate = row.getValue<number | undefined>("engagement_rate");
        return (
          <div className="font-medium">
            {engagementRate !== undefined ? `${Math.min(engagementRate, 100).toFixed(2)}%` : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "total_reach",
      header: "Reach",
      cell: ({ row }) => {
        const reach = row.getValue<number | undefined>("total_reach");
        return (
          <div className="font-medium">
            {reach !== undefined ? formatNumber(reach) : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "creators_count",
      header: "Creators",
      cell: ({ row }) => {
        const count = row.getValue<number | undefined>("creators_count");
        return (
          <div className="font-medium">
            {count !== undefined ? count : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");

        const statusConfig = {
          active: {
            label: "Active",
            icon: Circle,
            variant: "default" as const,
            className: "bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/30 border-0",
          },
          completed: {
            label: "Completed",
            icon: CheckCircle2,
            variant: "secondary" as const,
            className: "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/30 border-0",
          },
          draft: {
            label: "Draft",
            icon: XCircle,
            variant: "outline" as const,
            className: "bg-gray-50 text-gray-700 hover:bg-gray-50 dark:bg-gray-800/30 dark:text-gray-400 dark:hover:bg-gray-800/30 border-0",
          },
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;

        return (
          <Badge
            variant={config.variant}
            className={config.className}
          >
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-muted-foreground">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const campaign = row.original;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                >
                  View campaign
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(campaign.id)}
                >
                  Copy campaign ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
                >
                  Edit campaign
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteCampaign(campaign)}
                  className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  Delete campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: campaigns,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  if (isLoading) {
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
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
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
              <Button
                onClick={() => router.push("/campaigns/new")}
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
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
            <div className="w-full">
              {/* Table Controls */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      value={globalFilter}
                      onChange={(event) => setGlobalFilter(event.target.value)}
                      className="pl-8 max-w-sm"
                    />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {formatColumnName(column.id)}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            // Only navigate if not clicking on interactive elements
                            const target = e.target as HTMLElement;
                            if (
                              !target.closest('button') &&
                              !target.closest('input')
                            ) {
                              router.push(`/campaigns/${row.original.id}`);
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          {globalFilter ? "No results found." : "No campaigns yet. Create your first campaign to get started."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}