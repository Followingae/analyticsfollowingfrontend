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
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
  Filter,
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Users,
  TrendingUp,
  Calendar,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface BackendCampaign {
  id: string;
  name: string;
  brand_name: string;
  brand_logo_url: string | null;
  status: "active" | "completed" | "draft" | "proposal_pending";
  created_at: string;
  updated_at: string;
  engagement_rate?: number;
  total_reach?: number;
  creators_count?: number;
}

interface ActiveCampaignsProps {
  searchQuery: string;
}

export function ActiveCampaigns({ searchQuery }: ActiveCampaignsProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<BackendCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    setGlobalFilter(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);

      // Mock data for frontend demo
      const mockCampaigns: BackendCampaign[] = [
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
          creators_count: 12
        },
        {
          id: "2",
          name: "Brand Awareness Q4",
          brand_name: "Tech Innovators",
          brand_logo_url: "https://picsum.photos/100/100?random=2",
          status: "active",
          created_at: "2024-10-15T00:00:00Z",
          updated_at: "2024-10-22T00:00:00Z",
          engagement_rate: 3.9,
          total_reach: 650000,
          creators_count: 8
        },
        {
          id: "3",
          name: "Product Launch",
          brand_name: "Lifestyle Co",
          brand_logo_url: "https://picsum.photos/100/100?random=3",
          status: "proposal_pending",
          created_at: "2024-10-24T00:00:00Z",
          updated_at: "2024-10-24T00:00:00Z",
          engagement_rate: 0,
          total_reach: 0,
          creators_count: 0
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaign: BackendCampaign) => {
    if (!confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // TEMPORARILY COMMENTED OUT API CALLS FOR DEMO - NO BACKEND DEPENDENCY
      /*
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
      */

      // Mock delete for demo
      await new Promise(resolve => setTimeout(resolve, 800));

      // Remove from local list
      setCampaigns(prev => prev.filter(c => c.id !== campaign.id));

      toast.success("Campaign deleted successfully (Demo Mode)");
      // await fetchCampaigns(); // Commented out for demo
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

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        label: "Active",
        icon: Circle,
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
      },
      completed: {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
      },
      draft: {
        label: "Draft",
        icon: XCircle,
        className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
      },
      proposal_pending: {
        label: "Proposal Pending",
        icon: Clock,
        className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const columns: ColumnDef<BackendCampaign>[] = [
    {
      accessorKey: "name",
      header: "Campaign",
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div className="flex items-center space-x-3">
            {campaign.brand_logo_url && (
              <img
                src={campaign.brand_logo_url}
                alt={campaign.brand_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-medium">{campaign.name}</div>
              <div className="text-sm text-muted-foreground">{campaign.brand_name}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        const config = getStatusConfig(status);
        const Icon = config.icon;

        return (
          <Badge variant="outline" className={config.className}>
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "creators_count",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3 h-8 data-[state=open]:bg-accent"
        >
          <Users className="mr-2 h-4 w-4" />
          Creators
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
      accessorKey: "total_reach",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3 h-8 data-[state=open]:bg-accent"
        >
          <Eye className="mr-2 h-4 w-4" />
          Reach
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
      accessorKey: "engagement_rate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3 h-8 data-[state=open]:bg-accent"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Engagement
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const engagementRate = row.getValue<number | undefined>("engagement_rate");
        return (
          <div className="font-medium">
            {engagementRate !== undefined ? `${Math.min(engagementRate, 100).toFixed(1)}%` : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3 h-8 data-[state=open]:bg-accent"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Active Campaigns</h2>
            <p className="text-muted-foreground">
              Manage your ongoing influencer marketing campaigns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border-0">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-b">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="h-12">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
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
                          <TableCell key={cell.id} className="py-4">
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
                        {globalFilter
                          ? "No campaigns match your search."
                          : "No campaigns yet. Create your first campaign to get started."
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 p-4 border-t">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}