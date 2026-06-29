"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Target,
  FileText,
  Users,
  Clock,
  Archive,
  ClipboardList,
  LayoutList,
  LayoutGrid,
  Filter,
  ChevronRight,
  Gift,
  Banknote,
  BadgePercent,
  Video,
  PlayCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Pencil,
  Eye,
  TrendingUp,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { AuthGuard } from "@/components/AuthGuard";
import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { CampaignCard, type CampaignCardData } from "@/components/campaigns/CampaignCard";
// CampaignAnalyticsCards removed — aggregating KPIs across campaigns is not industry practice
import { unifiedCampaignApi, type ScopeCampaign } from "@/services/clientManagementApi";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Campaign type badge config
// ---------------------------------------------------------------------------
const CAMPAIGN_TYPE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  influencer: {
    label: "Influencer",
    color:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  },
  ugc: {
    label: "UGC",
    color:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  cashback: {
    label: "Cashback",
    color:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  paid_deal: {
    label: "Paid Deal",
    color:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  },
  barter: {
    label: "Barter",
    color:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  },
};

function getCampaignTypeBadge(type: string) {
  const config = CAMPAIGN_TYPE_CONFIG[type] || {
    label: type.replace(/_/g, " "),
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return config;
}

// ---------------------------------------------------------------------------
// Campaign type visual — big icon + label tile (leads each All Campaigns row)
// ---------------------------------------------------------------------------
const CAMPAIGN_TYPE_VISUAL: Record<
  string,
  { label: string; Icon: LucideIcon; tile: string; text: string }
> = {
  barter:     { label: "Barter",     Icon: Gift,         tile: "bg-pink-100 dark:bg-pink-900/30",     text: "text-pink-600 dark:text-pink-400" },
  paid_deal:  { label: "Paid",       Icon: Banknote,     tile: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
  cashback:   { label: "Cashback",   Icon: BadgePercent, tile: "bg-green-100 dark:bg-green-900/30",    text: "text-green-600 dark:text-green-400" },
  influencer: { label: "Influencer", Icon: Users,        tile: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  ugc:        { label: "UGC",        Icon: Video,        tile: "bg-blue-100 dark:bg-blue-900/30",      text: "text-blue-600 dark:text-blue-400" },
};
function getTypeVisual(type: string) {
  return (
    CAMPAIGN_TYPE_VISUAL[type] || {
      label: (type || "campaign").replace(/_/g, " "),
      Icon: Target,
      tile: "bg-muted",
      text: "text-muted-foreground",
    }
  );
}

// ---------------------------------------------------------------------------
// Status visual — big icon + label tile (used by the summary tiles / grid)
// ---------------------------------------------------------------------------
const CAMPAIGN_STATUS_VISUAL: Record<
  string,
  { label: string; Icon: LucideIcon; tile: string; text: string }
> = {
  active:    { label: "Active",    Icon: PlayCircle,  tile: "bg-green-100 dark:bg-green-900/30",   text: "text-green-600 dark:text-green-400" },
  completed: { label: "Completed", Icon: CheckCircle2, tile: "bg-slate-100 dark:bg-slate-800/40",  text: "text-slate-600 dark:text-slate-300" },
  draft:     { label: "Draft",     Icon: Pencil,      tile: "bg-gray-100 dark:bg-gray-800/40",     text: "text-gray-600 dark:text-gray-400" },
  paused:    { label: "Paused",    Icon: PauseCircle, tile: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-600 dark:text-amber-400" },
  cancelled: { label: "Cancelled", Icon: XCircle,     tile: "bg-red-100 dark:bg-red-900/30",       text: "text-red-600 dark:text-red-400" },
  archived:  { label: "Archived",  Icon: Archive,     tile: "bg-zinc-100 dark:bg-zinc-800/40",     text: "text-zinc-500 dark:text-zinc-400" },
};
function getStatusVisual(status: string) {
  return (
    CAMPAIGN_STATUS_VISUAL[(status || "").toLowerCase()] || {
      label: (status || "unknown").replace(/_/g, " "),
      Icon: Target,
      tile: "bg-muted",
      text: "text-muted-foreground",
    }
  );
}

// ---------------------------------------------------------------------------
// Payment status badge config
// ---------------------------------------------------------------------------
function getPaymentStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "paid":
      return {
        label: "Paid",
        className:
          "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      };
    case "partial":
      return {
        label: "Partial",
        className:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
      };
    case "unpaid":
      return {
        label: "Unpaid",
        className:
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
      };
    default:
      return {
        label: status || "N/A",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}

// ---------------------------------------------------------------------------
// Report status badge
// ---------------------------------------------------------------------------
function getReportStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
    case "delivered":
      return {
        label: status,
        className:
          "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      };
    case "in_progress":
    case "pending":
      return {
        label: status.replace(/_/g, " "),
        className:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
      };
    case "not_started":
      return {
        label: "Not Started",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
    default:
      return {
        label: status || "N/A",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}

// ---------------------------------------------------------------------------
// Status badge config (reused for scope table)
// ---------------------------------------------------------------------------
function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return {
        label: "Active",
        className:
          "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      };
    case "completed":
      return {
        label: "Completed",
        className:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400",
      };
    case "paused":
      return {
        label: "Paused",
        className:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
      };
    case "draft":
      return {
        label: "Draft",
        className:
          "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
      };
    case "deleted":
    case "archived":
      return {
        label: "Archived",
        className:
          "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-400",
      };
    default:
      return {
        label: status || "N/A",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}

// Format AED currency
function formatAED(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return `AED ${Number(amount).toLocaleString()}`;
}

// Small metric cell used inside the grid cards
function MiniStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm font-semibold leading-none tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ============================================================================
// ALL CAMPAIGNS TAB
// ============================================================================
function AllCampaignsTab({
  searchQuery,
  typeFilter,
  setTypeFilter,
}: {
  searchQuery: string;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [groupBy, setGroupBy] = useState<"type" | "status">("status");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Persist the chosen view (grid/list) across sessions
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("campaignsViewMode") : null;
    if (saved === "list" || saved === "grid") setViewMode(saved);
  }, []);
  const changeView = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("campaignsViewMode", mode);
    } catch {
      /* ignore */
    }
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 100 };
      if (typeFilter !== "all") params.campaign_type = typeFilter;
      if (searchQuery) params.search = searchQuery;

      // Use /api/v1/campaigns/ — it returns FA-aware per-campaign creators/posts/reach
      // counts. The /unified endpoint omits those, which made every row show 0.
      const { dedicatedApiCall } = await import("@/utils/apiDeduplication");
      const data: any = await dedicatedApiCall.campaignsList({ limit: 100 });
      const raw = data?.data?.campaigns || data?.campaigns || data?.data || [];
      const processed = (Array.isArray(raw) ? raw : []).map((c: any) => ({
        ...c,
        engagement_rate: c.engagement_rate || 0,
        total_reach: c.total_reach || 0,
        creators_count: c.creators_count || 0,
        posts_count: c.posts_count || 0,
        progress: c.progress || 0,
        content_delivered: c.content_delivered || 0,
        content_total: c.content_total || 0,
        created_by: c.created_by || "user",
        has_posts: c.has_posts || c.posts_count > 0,
        campaign_type: c.campaign_type || "influencer",
      }));
      setCampaigns(processed);
    } catch (error) {
      console.error('Failed to fetch campaigns, trying fallback:', error)
      // Fallback: try the old campaigns list API
      try {
        const { dedicatedApiCall } = await import("@/utils/apiDeduplication");
        const responseData = await dedicatedApiCall.campaignsList({
          limit: 100,
        });
        if (responseData.success && responseData.data) {
          const raw = responseData.data.campaigns || [];
          setCampaigns(
            (Array.isArray(raw) ? raw : []).map((c: any) => ({
              ...c,
              engagement_rate: c.engagement_rate || 0,
              total_reach: c.total_reach || 0,
              creators_count: c.creators_count || 0,
              posts_count: c.posts_count || 0,
              progress: c.progress || 0,
              content_delivered: c.content_delivered || 0,
              content_total: c.content_total || 0,
              created_by: c.created_by || "user",
              has_posts: c.has_posts || c.posts_count > 0,
              campaign_type: c.campaign_type || "influencer",
            }))
          );
        } else {
          setCampaigns([]);
        }
      } catch (fallbackError) {
        console.error('Campaign fallback API also failed:', fallbackError)
        setCampaigns([]);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCampaignAction = async (
    action: string,
    campaignId: string,
    campaignName: string
  ) => {
    try {
      const { campaignApi } = await import("@/services/campaignApiComplete");
      let response;
      switch (action) {
        case "pause":
          response = await campaignApi.updateCampaignStatus(campaignId, "paused");
          break;
        case "resume":
          response = await campaignApi.updateCampaignStatus(campaignId, "active");
          break;
        case "complete":
          response = await campaignApi.updateCampaignStatus(campaignId, "completed");
          break;
        case "delete":
          if (
            !confirm(
              `Are you sure you want to delete "${campaignName}"? This action cannot be undone.`
            )
          )
            return;
          response = await campaignApi.deleteCampaign(campaignId);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      if (response?.success) {
        toast.success(`Campaign "${campaignName}" ${action}d successfully`);
        await fetchCampaigns();
      } else {
        throw new Error(response?.error || `Failed to ${action} campaign`);
      }
    } catch (error) {
      console.error(`Campaign action '${action}' failed:`, error)
      toast.error(`Failed to ${action} campaign. Please try again.`);
    }
  };

  // Client-side filter (backup in case API doesn't filter)
  const filteredCampaigns = campaigns.filter((c) => {
    if (typeFilter !== "all") {
      const ct = (c as any).campaign_type || "influencer";
      if (ct !== typeFilter) return false;
    }
    if (statusFilter !== "all") {
      if ((c.status || "").toLowerCase() !== statusFilter) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.brand_name.toLowerCase().includes(q)
    );
  });

  // Counts for the summary tiles — computed over the full set so totals stay stable
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of campaigns) {
      const k = (c as any).campaign_type || "influencer";
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }, [campaigns]);
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of campaigns) {
      const k = (c.status || "unknown").toLowerCase();
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }, [campaigns]);

  // Active grouping dimension drives the tiles + which filter they set
  const counts = groupBy === "type" ? typeCounts : statusCounts;
  const activeFilter = groupBy === "type" ? typeFilter : statusFilter;
  const setActiveFilter = groupBy === "type" ? setTypeFilter : setStatusFilter;
  const visualFor = groupBy === "type" ? getTypeVisual : getStatusVisual;
  const tileKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  const openCampaign = (c: any) => {
    const ct = c.campaign_type || "influencer";
    const href = ct === "ugc" ? `/campaigns/${c.id}/ugc` : `/campaigns/${c.id}/posts`;
    router.push(href);
  };

  const fmtCompact = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : String(n || 0);

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Nothing at all (not merely filtered out)
  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="No campaigns yet"
        description={"Your campaigns will appear here when your account manager sends you a proposal."}
        icons={[Target, Users, FileText]}
      />
    );
  }

  const controls = (
    <div className="space-y-4">
      {/* Summary tiles \u2014 big icons by Type / Status; click to filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5">
          <span className="px-2 text-xs text-muted-foreground">View by</span>
          {(["type", "status"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                groupBy === g
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center rounded-lg border bg-card p-0.5">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => changeView("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => changeView("list")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm shrink-0 transition-all",
            activeFilter === "all"
              ? "border-primary bg-primary/5 text-foreground"
              : "bg-card text-muted-foreground hover:bg-muted/50"
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>All</span>
          <span className="text-xs tabular-nums opacity-70">{campaigns.length}</span>
        </button>
        {tileKeys.map((key) => {
          const v = visualFor(key);
          const active = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(active ? "all" : key)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm shrink-0 capitalize transition-all",
                active
                  ? "border-primary bg-primary/5 text-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", v.tile)}>
                <v.Icon className={cn("h-3 w-3", v.text)} />
              </span>
              <span>{v.label}</span>
              <span className="text-xs tabular-nums opacity-70">{counts[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (viewMode === "grid") {
    return (
      <div className="space-y-4">
        {controls}
        {filteredCampaigns.length === 0 ? (
          <EmptyState
            title="No campaigns match your filters"
            description="Try clearing the search or selecting a different tile."
            icons={[Target, Filter, Search]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCampaigns.map((campaign) => {
              const c = campaign as any;
              const v = getTypeVisual(c.campaign_type || "influencer");
              const statusBadge = getStatusBadge(campaign.status);
              return (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => openCampaign(c)}
                  className="group text-left"
                >
                  <Card className="h-full overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-md">
                    {/* Cover */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                      {c.hero_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.hero_image_url}
                          alt={campaign.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className={cn("flex h-full w-full items-center justify-center", v.tile)}>
                          <v.Icon className={cn("h-10 w-10 opacity-80", v.text)} />
                        </div>
                      )}
                      <span className={cn("absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur", v.text)}>
                        {v.label}
                      </span>
                      <Badge variant="outline" className={cn("absolute right-2 top-2 bg-background/85 text-[10px] backdrop-blur", statusBadge.className)}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <div className="truncate font-semibold leading-tight text-foreground">{campaign.name}</div>
                        <span className="truncate text-xs text-muted-foreground">{campaign.brand_name || "\u2014"}</span>
                      </div>
                      {c.master_name && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Layers className="h-3 w-3 shrink-0" /> Part of: <span className="truncate font-medium text-foreground">{c.master_name}</span>
                        </div>
                      )}
                      {c.is_master ? (
                        <div className="flex items-center gap-1.5 rounded-md bg-primary/5 px-2.5 py-2 text-[11px] text-muted-foreground">
                          <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
                          Master package \u00b7 {c.sub_count || 0} campaign{(c.sub_count || 0) === 1 ? "" : "s"}
                        </div>
                      ) : c.is_pre_platform ? (
                        <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-2 text-[11px] text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          Executed before platform \u2014 data limited
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 border-t pt-3">
                          <MiniStat icon={Users} value={c.creators_count || 0} label="Creators" />
                          <MiniStat icon={FileText} value={c.posts_count || 0} label="Posts" />
                          <MiniStat icon={Eye} value={fmtCompact(c.total_reach || 0)} label="Reach" />
                          <MiniStat
                            icon={TrendingUp}
                            value={c.engagement_rate ? `${Number(c.engagement_rate).toFixed(1)}%` : "\u2014"}
                            label="Eng."
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {controls}
      {filteredCampaigns.length === 0 ? (
        <EmptyState
          title="No campaigns match your filters"
          description="Try clearing the search or selecting a different tile."
          icons={[Target, Filter, Search]}
        />
      ) : (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Campaign</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="text-center min-w-[90px]">Creators</TableHead>
                <TableHead className="text-center min-w-[80px]">Posts</TableHead>
                <TableHead className="text-right min-w-[100px]">Reach</TableHead>
                <TableHead className="text-right min-w-[110px]">Engagement</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => {
                const c = campaign as any;
                const v = getTypeVisual(c.campaign_type || "influencer");
                const statusBadge = getStatusBadge(campaign.status);
                return (
                  <TableRow
                    key={campaign.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => {
                      const ct = c.campaign_type || "influencer";
                      // FA types (cashback / paid_deal / barter) use the same progress
                      // panel as superadmin (/posts → FaCampaignProgressPanel), which
                      // surfaces pending applicants and approves via the participant flow.
                      const href = ct === "ugc"
                        ? `/campaigns/${campaign.id}/ugc`
                        : `/campaigns/${campaign.id}/posts`;
                      router.push(href);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${v.tile}`}>
                          <v.Icon className={`h-5 w-5 ${v.text}`} />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${v.text}`}>
                            {v.label}
                          </span>
                          <div className="font-medium leading-tight truncate">{campaign.name}</div>
                          <div className="flex items-center gap-1.5">
                            {campaign.brand_name && (
                              <span className="text-xs text-muted-foreground truncate">{campaign.brand_name}</span>
                            )}
                            {c.is_pre_platform && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" /> Pre-platform
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusBadge.className}`}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground/70">{c.is_pre_platform ? "—" : (c.creators_count || 0)}</TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground/70">{c.is_pre_platform ? "—" : (c.posts_count || 0)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground/70">{c.is_pre_platform ? "—" : fmtCompact(c.total_reach || 0)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground/70">
                      {c.is_pre_platform ? "—" : (c.engagement_rate ? `${Number(c.engagement_rate).toFixed(1)}%` : "—")}
                    </TableCell>
                    <TableCell className="text-muted-foreground/50">
                      <ChevronRight className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      </Card>
      )}
    </div>
  );
}
// SCOPE TAB
// ============================================================================
function ScopeTabContent() {
  const [scopeData, setScopeData] = useState<ScopeCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>(
    String(new Date().getFullYear())
  );

  const fetchScope = useCallback(async () => {
    setLoading(true);
    try {
      const year = parseInt(yearFilter);
      const data = await unifiedCampaignApi.getScope(year);
      // The endpoint may return { campaigns: [...] } or { data: { campaigns: [...] } }
      const campaigns = data?.campaigns || data?.data?.campaigns || data?.data || [];
      setScopeData(campaigns);
    } catch (error) {
      console.error('Failed to load scope data:', error)
      setScopeData([]);
    } finally {
      setLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => {
    fetchScope();
  }, [fetchScope]);

  // Build year options: current year and 2 previous
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {scopeData.length} project{scopeData.length !== 1 ? "s" : ""}
        </span>
      </div>

      {scopeData.length === 0 ? (
        <EmptyState
          title="No projects in scope"
          description={`No campaigns found for ${yearFilter}. Try selecting a different year.`}
          icons={[ClipboardList, Target, FileText]}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Project Name</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[120px] text-right">
                    Budget (AED)
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    Payment Status
                  </TableHead>
                  <TableHead className="min-w-[80px] text-center">
                    Creators
                  </TableHead>
                  <TableHead className="min-w-[80px] text-center">
                    Posts
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    Report Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopeData.map((campaign) => {
                  const typeBadge = getCampaignTypeBadge(
                    campaign.campaign_type
                  );
                  const statusBadge = getStatusBadge(campaign.status);
                  const paymentBadge = getPaymentStatusBadge(
                    campaign.payment_status
                  );
                  const reportBadge = getReportStatusBadge(
                    campaign.report_status
                  );

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        {campaign.name}
                        {campaign.brand_name && (
                          <span className="text-xs text-muted-foreground block">
                            {campaign.brand_name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${typeBadge.color}`}
                        >
                          {typeBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatAED(campaign.budget)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${paymentBadge.className}`}
                        >
                          {paymentBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {campaign.total_creators ?? 0}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {campaign.total_posts ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${reportBadge.className}`}
                        >
                          {reportBadge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// ARCHIVE TAB (inline — simplified from ArchiveTab component)
// ============================================================================
function ArchiveTabContent({ searchQuery }: { searchQuery: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchived();
  }, []);

  const fetchArchived = async () => {
    try {
      setLoading(true);
      // Try unified API first with status=completed
      try {
        const data = await unifiedCampaignApi.list({
          status: "completed",
          limit: 100,
        });
        const raw = data?.campaigns || data?.data?.campaigns || data?.data || [];
        setCampaigns(
          (Array.isArray(raw) ? raw : []).map((c: any) => ({
            ...c,
            engagement_rate: c.engagement_rate || 0,
            total_reach: c.total_reach || 0,
            creators_count: c.creators_count || 0,
            posts_count: c.posts_count || 0,
            progress: c.progress || 0,
            content_delivered: c.content_delivered || 0,
            content_total: c.content_total || 0,
            created_by: c.created_by || "user",
            has_posts: c.has_posts || (c.posts_count > 0),
            campaign_type: c.campaign_type || "influencer",
          }))
        );
      } catch (error) {
        console.error('Failed to fetch completed campaigns, trying fallback:', error)
        // Fallback to old API
        const { dedicatedApiCall } = await import("@/utils/apiDeduplication");
        const responseData = await dedicatedApiCall.campaignsList({
          status: "completed,archived",
          limit: 100,
        });
        if (responseData.success && responseData.data) {
          const raw = responseData.data.campaigns || [];
          setCampaigns(
            (Array.isArray(raw) ? raw : []).map((c: any) => ({
              ...c,
              engagement_rate: c.engagement_rate || 0,
              total_reach: c.total_reach || 0,
              creators_count: c.creators_count || 0,
              posts_count: c.posts_count || 0,
              progress: c.progress || 0,
              content_delivered: c.content_delivered || 0,
              content_total: c.content_total || 0,
              created_by: c.created_by || "user",
              has_posts: c.has_posts || (c.posts_count > 0),
              campaign_type: c.campaign_type || "influencer",
            }))
          );
        } else {
          setCampaigns([]);
        }
      }
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return campaigns;
    const q = searchQuery.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.brand_name?.toLowerCase().includes(q)
    );
  }, [campaigns, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No archived campaigns"
        description={
          searchQuery
            ? "No archived campaigns match your search criteria."
            : "Completed campaigns will appear here once they wrap up."
        }
        icons={[Archive, Target, FileText]}
      />
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          showActions={false}
          onAction={async () => {}}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function UnifiedCampaignsDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pendingProposalCount, setPendingProposalCount] = useState(0);

  // Fetch pending proposal count for the banner
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const { brandProposalViewApi } = await import("@/services/adminProposalMasterApi");
        const result = await brandProposalViewApi.listProposals() as any;
        const proposals = result.proposals || [];
        const pending = proposals.filter((p: any) => !["approved", "rejected"].includes(p.status));
        setPendingProposalCount(pending.length);
      } catch (error) {
        console.error('Failed to fetch pending proposal count:', error)
      }
    };
    fetchPendingCount();
  }, []);

  return (
    <AuthGuard>
      <BrandUserInterface>
        <div className="flex flex-col min-h-screen bg-background">
          {/* Clean header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col gap-3 p-4 md:p-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                <p className="text-sm text-muted-foreground">Track performance across all your influencer campaigns</p>
              </div>
              {pendingProposalCount > 0 && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => router.push("/proposals")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {pendingProposalCount} proposal{pendingProposalCount !== 1 ? 's' : ''} waiting for your review
                    </p>
                    <p className="text-xs text-muted-foreground">Click to view and respond to proposals from your account manager</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-4"
            >
              {/* Top bar: Tabs + Search + Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <TabsList className="bg-muted/30 p-1 h-auto overflow-x-auto w-full sm:w-auto">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-1.5"
                  >
                    <LayoutList className="h-4 w-4" />
                    All Campaigns
                  </TabsTrigger>
                  <TabsTrigger
                    value="scope"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-1.5"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Scope
                  </TabsTrigger>
                  <TabsTrigger
                    value="archive"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-1.5"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 w-full sm:w-64"
                    />
                  </div>
                  {/* Campaign creation is managed by superadmin via proposals */}
                </div>
              </div>

              {/* Tab content */}
              <div className="mt-6 pb-8">
                <TabsContent value="all" className="mt-0">
                  <AllCampaignsTab
                    searchQuery={searchQuery}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                  />
                </TabsContent>

                <TabsContent value="scope" className="mt-0">
                  <ScopeTabContent />
                </TabsContent>

                <TabsContent value="archive" className="mt-0">
                  <ArchiveTabContent searchQuery={searchQuery} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </BrandUserInterface>
    </AuthGuard>
  );
}
