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
  Sparkles,
  Plus
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
  // CRITICAL: Campaign flow type identifier
  created_by: 'user' | 'superadmin';
  proposal_id?: string;
  // Flow-specific data
  workflow_stage?: 'influencer_selection' | 'content_creation' | 'review' | 'published';
  has_posts: boolean;
}

interface ActiveCampaignsProps {
  searchQuery: string;
}

export function ActiveCampaignsV2({ searchQuery }: ActiveCampaignsProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);

      const { campaignApi } = await import('@/services/campaignApiComplete');

      const response = await campaignApi.listCampaigns({ status: 'active', limit: 100 });

      if (response.success && response.data) {
        const campaigns = response.data.campaigns || [];

        // Process campaigns to ensure proper data handling
        const processedCampaigns = campaigns.map(campaign => ({
          ...campaign,
          // Ensure numeric fields are properly handled
          engagement_rate: campaign.engagement_rate || 0,
          total_reach: campaign.total_reach || 0,
          creators_count: campaign.creators_count || 0,
          progress: campaign.progress || 0,
          content_delivered: campaign.content_delivered || 0,
          content_total: campaign.content_total || 0,
          // Handle missing created_by field
          created_by: campaign.created_by || 'user',
          has_posts: campaign.has_posts || false
        }));

        setCampaigns(processedCampaigns);
      } else {
        throw new Error(response.error || 'Failed to fetch campaigns');
      }
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
    return configs[status as keyof typeof configs] || configs.active;
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

  // ==================== DYNAMIC CAMPAIGN FLOW HELPERS ====================

  const isUserCampaign = (campaign: Campaign): boolean => {
    // User campaigns are created by regular users (self-managed)
    return campaign.created_by === 'user';
  };

  const isSuperadminCampaign = (campaign: Campaign): boolean => {
    return campaign.created_by === 'superadmin';
  };

  const getCampaignFlowActions = (campaign: Campaign) => {
    if (isUserCampaign(campaign)) {
      // USER FLOW: Simple campaign management
      return {
        canAddPosts: true,
        canViewAnalytics: campaign.has_posts,
        canExport: campaign.has_posts,
        canManageInfluencers: false, // Users don't manage influencers directly
        showWorkflowStage: false,
        primaryAction: campaign.has_posts ? 'view_analytics' : 'add_posts',
        flowType: 'USER_SIMPLE' as const
      };
    } else {
      // SUPERADMIN FLOW: Full workflow management
      return {
        canAddPosts: campaign.workflow_stage === 'published',
        canViewAnalytics: campaign.status === 'active' || campaign.status === 'completed',
        canExport: campaign.status === 'active' || campaign.status === 'completed',
        canManageInfluencers: true,
        showWorkflowStage: true,
        primaryAction: getWorkflowPrimaryAction(campaign),
        flowType: 'SUPERADMIN_WORKFLOW' as const
      };
    }
  };

  const getWorkflowPrimaryAction = (campaign: Campaign) => {
    if (campaign.status === 'draft') return 'select_influencers';
    if (campaign.workflow_stage === 'influencer_selection') return 'manage_influencers';
    if (campaign.workflow_stage === 'content_creation') return 'review_content';
    if (campaign.workflow_stage === 'review') return 'approve_content';
    if (campaign.workflow_stage === 'published') return 'view_analytics';
    return 'manage_campaign';
  };

  const getWorkflowStageDisplay = (campaign: Campaign) => {
    if (!isSuperadminCampaign(campaign)) return null;

    const stageConfig = {
      influencer_selection: { label: 'Selecting Influencers', color: 'bg-blue-100 text-blue-700', icon: '👥' },
      content_creation: { label: 'Content Creation', color: 'bg-purple-100 text-purple-700', icon: '✍️' },
      review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: '👀' },
      published: { label: 'Published', color: 'bg-green-100 text-green-700', icon: '🚀' }
    };

    return stageConfig[campaign.workflow_stage || 'influencer_selection'];
  };

  const getCampaignTypeDisplay = (campaign: Campaign) => {
    return isUserCampaign(campaign)
      ? { label: 'Self-Managed', color: 'bg-slate-100 text-slate-600', icon: '👤' }
      : { label: 'Managed Campaign', color: 'bg-indigo-100 text-indigo-700', icon: '🏢' };
  };

  const handleCampaignAction = async (
    campaignId: string,
    action: 'pause' | 'resume' | 'complete' | 'delete',
    campaignName: string
  ) => {
    try {
      setActionLoading(prev => ({ ...prev, [campaignId]: action }));

      const { campaignApi } = await import('@/services/campaignApiComplete');

      let response;
      let successMessage = '';

      switch (action) {
        case 'pause':
          response = await campaignApi.updateCampaignStatus(campaignId, 'paused');
          successMessage = `Campaign "${campaignName}" has been paused`;
          break;
        case 'resume':
          response = await campaignApi.updateCampaignStatus(campaignId, 'active');
          successMessage = `Campaign "${campaignName}" has been resumed`;
          break;
        case 'complete':
          response = await campaignApi.updateCampaignStatus(campaignId, 'completed');
          successMessage = `Campaign "${campaignName}" has been marked as completed`;
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
            return;
          }
          response = await campaignApi.deleteCampaign(campaignId);
          successMessage = `Campaign "${campaignName}" has been deleted`;
          break;
      }

      if (response.success) {
        // Show success message (you might want to use a toast notification here)
        console.log(successMessage);

        // Refresh campaigns list
        await fetchCampaigns();
      } else {
        throw new Error(response.error || `Failed to ${action} campaign`);
      }
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
      alert(`Failed to ${action} campaign. Please try again.`);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[campaignId];
        return newState;
      });
    }
  };

  const duplicateCampaign = async (campaign: Campaign) => {
    try {
      setActionLoading(prev => ({ ...prev, [campaign.id]: 'duplicate' }));

      const { campaignApi } = await import('@/services/campaignApiComplete');

      const duplicateData = {
        name: `${campaign.name} (Copy)`,
        brand_name: campaign.brand_name,
        brand_logo_url: campaign.brand_logo_url || undefined,
        description: `Duplicate of ${campaign.name}`,
      };

      const response = await campaignApi.createUserCampaign(duplicateData);

      if (response.success && response.data) {
        console.log(`Campaign "${campaign.name}" has been duplicated`);
        // Refresh campaigns list
        await fetchCampaigns();
      } else {
        throw new Error(response.error || 'Failed to duplicate campaign');
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      alert('Failed to duplicate campaign. Please try again.');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[campaign.id];
        return newState;
      });
    }
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

        // DYNAMIC FLOW CONFIGURATION
        const flowActions = getCampaignFlowActions(campaign);
        const workflowStage = getWorkflowStageDisplay(campaign);
        const campaignType = getCampaignTypeDisplay(campaign);

        return (
          <Card
            key={campaign.id}
            className={cn(
              "group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
              isUrgent && "ring-2 ring-amber-500/20"
            )}
            onClick={() => {
              // FIXED ROUTING: User campaigns go to simple interface, superadmin campaigns go to workflow
              const userCampaign = isUserCampaign(campaign);
              const targetRoute = userCampaign ? `/campaigns/${campaign.id}/posts` : `/campaigns/${campaign.id}`;

              console.log(`🚨 DEBUG: MAIN CARD CLICK - "${campaign.name}":`, {
                campaign_id: campaign.id,
                created_by: campaign.created_by,
                isUserCampaign: userCampaign,
                targetRoute: targetRoute,
                about_to_navigate_to: targetRoute
              });

              router.push(targetRoute);
            }}
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

                        {/* Campaign Type Badge */}
                        <Badge variant="outline" className={cn("text-xs", campaignType.color)}>
                          <span className="mr-1">{campaignType.icon}</span>
                          {campaignType.label}
                        </Badge>

                        {/* Status Badge */}
                        <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusConfig.dot)} />
                          {statusConfig.label}
                        </Badge>

                        {/* Workflow Stage Badge (Superadmin campaigns only) */}
                        {flowActions.showWorkflowStage && workflowStage && (
                          <Badge variant="outline" className={cn("text-xs", workflowStage.color)}>
                            <span className="mr-1">{workflowStage.icon}</span>
                            {workflowStage.label}
                          </Badge>
                        )}

                        {/* Urgency Badge */}
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
                          // FIXED ROUTING: User campaigns go to simple interface
                          if (isUserCampaign(campaign)) {
                            router.push(`/campaigns/${campaign.id}/posts`);
                          } else {
                            router.push(`/campaigns/${campaign.id}`);
                          }
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateCampaign(campaign);
                          }}
                          disabled={actionLoading[campaign.id] === 'duplicate'}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {actionLoading[campaign.id] === 'duplicate' ? 'Duplicating...' : 'Duplicate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status === "active" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCampaignAction(campaign.id, 'pause', campaign.name);
                            }}
                            disabled={actionLoading[campaign.id] === 'pause'}
                            className="text-amber-600"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            {actionLoading[campaign.id] === 'pause' ? 'Pausing...' : 'Pause Campaign'}
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "paused" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCampaignAction(campaign.id, 'resume', campaign.name);
                            }}
                            disabled={actionLoading[campaign.id] === 'resume'}
                            className="text-green-600"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {actionLoading[campaign.id] === 'resume' ? 'Resuming...' : 'Resume Campaign'}
                          </DropdownMenuItem>
                        )}
                        {(campaign.status === "active" || campaign.status === "paused") && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCampaignAction(campaign.id, 'complete', campaign.name);
                            }}
                            disabled={actionLoading[campaign.id] === 'complete'}
                            className="text-blue-600"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {actionLoading[campaign.id] === 'complete' ? 'Completing...' : 'Mark Complete'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignAction(campaign.id, 'delete', campaign.name);
                          }}
                          disabled={actionLoading[campaign.id] === 'delete'}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {actionLoading[campaign.id] === 'delete' ? 'Deleting...' : 'Delete Campaign'}
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
                        <span className="text-sm font-medium">
                          {campaign.creators_count > 0 ? campaign.creators_count : '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reach</p>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {campaign.total_reach > 0 ? formatNumber(campaign.total_reach) : '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {campaign.engagement_rate > 0 ? `${campaign.engagement_rate}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Content</p>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {campaign.content_total > 0
                            ? `${campaign.content_delivered}/${campaign.content_total}`
                            : campaign.has_posts ? 'Added' : '—'
                          }
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Created</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(campaign.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar - Only show if there's real progress data */}
                  {(campaign.content_total > 0 || campaign.has_posts) && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">
                          {campaign.content_total > 0 ? 'Content Progress' : 'Campaign Status'}
                        </span>
                        <span className="font-medium">
                          {campaign.content_total > 0
                            ? `${Math.round((campaign.content_delivered / campaign.content_total) * 100)}%`
                            : campaign.has_posts ? '✓ Active' : 'Started'
                          }
                        </span>
                      </div>
                      {campaign.content_total > 0 && (
                        <Progress
                          value={(campaign.content_delivered / campaign.content_total) * 100}
                          className="h-2"
                        />
                      )}
                    </div>
                  )}

                  {/* Dynamic Quick Actions Based on Flow Type */}
                  {(campaign.status === "active" || campaign.status === "draft") && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      {/* USER FLOW: Simple Actions */}
                      {flowActions.flowType === 'USER_SIMPLE' && (
                        <>
                          {flowActions.canAddPosts && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/campaigns/${campaign.id}/posts`);
                              }}
                            >
                              <Plus className="mr-1.5 h-3.5 w-3.5" />
                              {campaign.has_posts ? 'Manage Posts' : 'Add Posts'}
                            </Button>
                          )}
                          {flowActions.canViewAnalytics && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/campaigns/${campaign.id}/analytics`);
                              }}
                            >
                              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                              Analytics
                            </Button>
                          )}
                        </>
                      )}

                      {/* SUPERADMIN FLOW: Workflow Actions */}
                      {flowActions.flowType === 'SUPERADMIN_WORKFLOW' && (
                        <>
                          {flowActions.canManageInfluencers && (
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
                          )}
                          {flowActions.canAddPosts && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/campaigns/${campaign.id}/posts`);
                              }}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View Content
                            </Button>
                          )}
                          {flowActions.canViewAnalytics && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/campaigns/${campaign.id}/analytics`);
                              }}
                            >
                              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                              Analytics
                            </Button>
                          )}
                        </>
                      )}

                      {/* Common Actions */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          // FIXED ROUTING: User campaigns go to simple interface
                          if (isUserCampaign(campaign)) {
                            router.push(`/campaigns/${campaign.id}/posts`);
                          } else {
                            router.push(`/campaigns/${campaign.id}`);
                          }
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