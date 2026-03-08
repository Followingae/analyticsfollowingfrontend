"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Eye,
  CheckCircle,
  MessageSquare,
  Filter,
  ChevronDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { FeatureLockedCard } from "@/components/proposals/FeatureLockedCard";
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
import { formatCount, formatCurrency, proposalMotion } from "@/components/proposals/proposal-utils";
import { motion } from "motion/react";
import { EmptyState } from "@/components/ui/empty-state";

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

      const { campaignApi } = await import('@/services/campaignApiComplete');
      const response = await campaignApi.listProposals({ limit: 100 });

      if (response.success && response.data) {
        setProposals(response.data.proposals || []);
      } else {
        throw new Error(response.error || 'Failed to fetch proposals');
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
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
          <motion.div
            variants={proposalMotion.staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredProposals.map((proposal) => {
              return (
                <motion.div key={proposal.id} variants={proposalMotion.staggerItem} whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 17 } }}>
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
                  onClick={() => router.push(`/campaigns/proposals/${proposal.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <ProposalStatusBadge status={proposal.status} />
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
                                  {formatCount(proposal.expected_reach)}
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
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <EmptyState
            title="No proposals yet"
            description={searchQuery
              ? "No proposals match your search criteria. Try adjusting your search or filters."
              : "Proposals will appear here once created."}
            icons={[FileText, Users, MessageSquare]}
            action={!searchQuery ? {
              label: "Request a Proposal",
              onClick: () => router.push("/campaigns/request-proposal"),
            } : undefined}
          />
        )}
      </div>
    </div>
  );
}