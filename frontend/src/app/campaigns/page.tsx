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
  Filter,
} from "lucide-react";

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
import { CampaignAnalyticsCards } from "@/components/campaigns/CampaignAnalyticsCards";
import { ProposalOverviewCard } from "@/components/proposals/ProposalOverviewCard";
import { brandProposalViewApi } from "@/services/adminProposalMasterApi";
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

// ---------------------------------------------------------------------------
// Proposal types
// ---------------------------------------------------------------------------
interface ProposalListItem {
  id: string;
  title: string;
  campaign_name: string;
  description?: string;
  status: string;
  total_influencers: number;
  selected_count: number;
  total_sell_amount?: number;
  deadline_at?: string;
  cover_image_url?: string;
  created_at: string;
  sent_at?: string;
  responded_at?: string;
  more_added_at?: string;
}

// ============================================================================
// ALL CAMPAIGNS TAB
// ============================================================================
function AllCampaignsTab({
  searchQuery,
  typeFilter,
}: {
  searchQuery: string;
  typeFilter: string;
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 100 };
      if (typeFilter !== "all") params.campaign_type = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await unifiedCampaignApi.list(params as any);

      // The unified endpoint returns { success, data: [...], total, ... }
      const raw = data?.campaigns || data?.data?.campaigns || data?.data || [];
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
    } catch {
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
      } catch {
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
    } catch {
      toast.error(`Failed to ${action} campaign. Please try again.`);
    }
  };

  // Client-side filter (backup in case API doesn't filter)
  const filteredCampaigns = campaigns.filter((c) => {
    if (typeFilter !== "all") {
      const ct = (c as any).campaign_type || "influencer";
      if (ct !== typeFilter) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.brand_name.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
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

  if (filteredCampaigns.length === 0) {
    return (
      <EmptyState
        title="No campaigns found"
        description={
          searchQuery || typeFilter !== "all"
            ? "No campaigns match your filters. Try adjusting your search or type filter."
            : "No campaigns yet \u2014 your campaigns will appear here when your account manager sends you a proposal."
        }
        icons={[Target, Users, FileText]}
      />
    );
  }

  return (
    <div className="space-y-2">
      {filteredCampaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          showActions={true}
          onAction={handleCampaignAction}
        />
      ))}
    </div>
  );
}

// ============================================================================
// PROPOSALS TAB
// ============================================================================
function ProposalsTabContent({ searchQuery }: { searchQuery: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useEnhancedAuth();

  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadProposals();
    }
  }, [user, authLoading]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const result = await brandProposalViewApi.listProposals();
      const data = result as any;
      setProposals(data.proposals || []);
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const activeProposals = useMemo(
    () =>
      proposals.filter(
        (p) => !["approved", "rejected"].includes(p.status)
      ),
    [proposals]
  );

  const archivedProposals = useMemo(
    () =>
      proposals.filter((p) =>
        ["approved", "rejected"].includes(p.status)
      ),
    [proposals]
  );

  const filteredActive = useMemo(() => {
    if (!searchQuery) return activeProposals;
    const q = searchQuery.toLowerCase();
    return activeProposals.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.campaign_name.toLowerCase().includes(q)
    );
  }, [activeProposals, searchQuery]);

  const filteredArchived = useMemo(() => {
    if (!searchQuery) return archivedProposals;
    const q = searchQuery.toLowerCase();
    return archivedProposals.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.campaign_name.toLowerCase().includes(q)
    );
  }, [archivedProposals, searchQuery]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <EmptyState
        title="No proposals yet"
        description={
          "Your agency team hasn't sent any proposals yet.\nYou'll see them here once they curate influencer lists for your campaigns."
        }
        icons={[FileText, Users, Clock]}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Active proposals */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">Active Proposals</h3>
          {filteredActive.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {filteredActive.length}
            </Badge>
          )}
        </div>
        {filteredActive.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No active proposals
            {searchQuery ? " matching your search" : ""}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredActive.map((proposal) => (
              <ProposalOverviewCard
                key={proposal.id}
                proposal={proposal}
                onClick={() => router.push(`/proposals/${proposal.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived proposals */}
      {filteredArchived.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Archived Proposals
            </h3>
            <Badge variant="outline" className="text-xs">
              {filteredArchived.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredArchived.map((proposal) => (
              <ProposalOverviewCard
                key={proposal.id}
                proposal={proposal}
                archived
                onClick={() => router.push(`/proposals/${proposal.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
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
    } catch {
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
      } catch {
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

  const TYPE_FILTER_OPTIONS = [
    { value: "all", label: "All Types" },
    { value: "influencer", label: "Influencer" },
    { value: "ugc", label: "UGC" },
    { value: "cashback", label: "Cashback" },
    { value: "paid_deal", label: "Paid Deal" },
    { value: "barter", label: "Barter" },
  ];

  return (
    <AuthGuard>
      <BrandUserInterface>
        <div className="flex flex-col min-h-screen bg-background">
          {/* Header with analytics */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              <CampaignAnalyticsCards className="mt-6" />
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
                    value="proposals"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    Proposals
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

              {/* Type filter pills — only visible on "All Campaigns" tab */}
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-muted-foreground mr-1">
                    Type:
                  </span>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_FILTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tab content */}
              <div className="mt-6 pb-8">
                <TabsContent value="all" className="mt-0">
                  <AllCampaignsTab
                    searchQuery={searchQuery}
                    typeFilter={typeFilter}
                  />
                </TabsContent>

                <TabsContent value="proposals" className="mt-0">
                  <ProposalsTabContent searchQuery={searchQuery} />
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
