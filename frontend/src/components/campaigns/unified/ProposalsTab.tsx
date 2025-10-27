"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Filter,
  ChevronDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { FeatureLockedCard } from "@/components/proposals/FeatureLockedCard";

interface Proposal {
  id: string;
  title: string;
  campaign_name: string;
  status: "draft" | "sent" | "approved" | "rejected" | "in_review";
  total_budget: number;
  influencer_count: number;
  created_at: string;
  updated_at: string;
  expected_reach?: number;
  avg_engagement_rate?: number;
  proposal_type: "influencer_list" | "campaign_package";
}

interface ProposalsTabProps {
  searchQuery: string;
}

export function ProposalsTab({ searchQuery }: ProposalsTabProps) {
  const router = useRouter();
  const { user } = useEnhancedAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("all");

  // Simple feature flag - can be made dynamic later
  const isAgencyClient = user?.role === 'premium' || user?.role === 'enterprise' || false;

  useEffect(() => {
    if (isAgencyClient) {
      fetchProposals();
    } else {
      setIsLoading(false);
    }
  }, [isAgencyClient]);

  const fetchProposals = async () => {
    try {
      setIsLoading(true);

      // Mock data for frontend demo
      const mockProposals: Proposal[] = [
        {
          id: "1",
          title: "Summer Fashion Campaign",
          campaign_name: "Summer Collection 2024",
          status: "sent",
          total_budget: 15000,
          influencer_count: 8,
          created_at: "2024-10-20T00:00:00Z",
          updated_at: "2024-10-25T00:00:00Z",
          expected_reach: 2500000,
          avg_engagement_rate: 4.2,
          proposal_type: "campaign_package"
        },
        {
          id: "2",
          title: "Lifestyle Influencer List",
          campaign_name: "Brand Awareness Q4",
          status: "approved",
          total_budget: 8500,
          influencer_count: 5,
          created_at: "2024-10-18T00:00:00Z",
          updated_at: "2024-10-24T00:00:00Z",
          expected_reach: 1200000,
          avg_engagement_rate: 3.8,
          proposal_type: "influencer_list"
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProposals(mockProposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: {
        label: "Draft",
        icon: FileText,
        className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
      },
      sent: {
        label: "Sent",
        icon: Clock,
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
      },
      in_review: {
        label: "In Review",
        icon: AlertCircle,
        className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
      },
      approved: {
        label: "Approved",
        icon: CheckCircle,
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
      },
      rejected: {
        label: "Rejected",
        icon: XCircle,
        className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.campaign_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeSubTab === "all" || proposal.status === activeSubTab;

    return matchesSearch && matchesTab;
  });

  if (!isAgencyClient) {
    return (
      <div className="flex-1 overflow-auto">
        <FeatureLockedCard feature="proposals" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
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
            <h2 className="text-2xl font-semibold tracking-tight">Proposals</h2>
            <p className="text-muted-foreground">
              Review and manage influencer campaign proposals from your agency team
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveSubTab("all")}>
                  All Proposals
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSubTab("sent")}>
                  Pending Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSubTab("approved")}>
                  Approved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSubTab("rejected")}>
                  Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => router.push("/campaigns/request-proposal")}>
              <Plus className="mr-2 h-4 w-4" />
              Request Proposal
            </Button>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({proposals.length})</TabsTrigger>
            <TabsTrigger value="sent">
              Pending ({proposals.filter(p => p.status === 'sent').length})
            </TabsTrigger>
            <TabsTrigger value="in_review">
              In Review ({proposals.filter(p => p.status === 'in_review').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({proposals.filter(p => p.status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({proposals.filter(p => p.status === 'rejected').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Proposals Grid */}
        {filteredProposals.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProposals.map((proposal) => {
              const statusConfig = getStatusConfig(proposal.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={proposal.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                  onClick={() => router.push(`/campaigns/proposals/${proposal.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={statusConfig.className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(proposal.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {proposal.title}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Campaign: {proposal.campaign_name}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="text-sm font-medium">
                              {formatCurrency(proposal.total_budget)}
                            </div>
                            <div className="text-xs text-muted-foreground">Budget</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium">
                              {proposal.influencer_count}
                            </div>
                            <div className="text-xs text-muted-foreground">Influencers</div>
                          </div>
                        </div>
                      </div>

                      {/* Expected Performance */}
                      {(proposal.expected_reach || proposal.avg_engagement_rate) && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          {proposal.expected_reach && (
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-purple-600" />
                              <div>
                                <div className="text-sm font-medium">
                                  {formatNumber(proposal.expected_reach)}
                                </div>
                                <div className="text-xs text-muted-foreground">Est. Reach</div>
                              </div>
                            </div>
                          )}
                          {proposal.avg_engagement_rate && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-orange-600" />
                              <div>
                                <div className="text-sm font-medium">
                                  {proposal.avg_engagement_rate.toFixed(1)}%
                                </div>
                                <div className="text-xs text-muted-foreground">Avg. Eng.</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons for different statuses */}
                      <div className="flex gap-2 pt-3 border-t">
                        {proposal.status === 'sent' && (
                          <>
                            <Button size="sm" className="flex-1">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <MessageSquare className="mr-1 h-3 w-3" />
                              Comment
                            </Button>
                          </>
                        )}
                        {proposal.status === 'approved' && (
                          <Button size="sm" className="w-full" variant="outline">
                            <Eye className="mr-1 h-3 w-3" />
                            View Campaign
                          </Button>
                        )}
                        {(proposal.status === 'draft' || proposal.status === 'rejected') && (
                          <Button size="sm" className="w-full" variant="outline">
                            <FileText className="mr-1 h-3 w-3" />
                            View Details
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
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No proposals found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchQuery
                  ? "No proposals match your search criteria. Try adjusting your search or filters."
                  : "You don't have any proposals yet. Your agency team will create proposals for you to review and approve."
                }
              </p>
              {!searchQuery && (
                <Button
                  className="mt-4"
                  onClick={() => router.push("/campaigns/request-proposal")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Request a Proposal
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}