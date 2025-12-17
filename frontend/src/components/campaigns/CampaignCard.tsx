"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  Eye,
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Sparkles
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import the exact backend Campaign interface
import type { Campaign } from '@/services/campaignApiComplete';

// Use the exact backend interface
export type CampaignCardData = Campaign & {
  // Add optional frontend-only fields that may not come from backend
  has_posts?: boolean;
  deadline?: string;
};

interface CampaignCardProps {
  campaign: CampaignCardData;
  showActions?: boolean;
  onAction?: (action: string, campaignId: string, campaignName: string) => Promise<void>;
}

export function CampaignCard({
  campaign,
  showActions = true,
  onAction
}: CampaignCardProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  // Helper functions (extracted from ActiveCampaignsV2)
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

  const isUserCampaign = (campaign: CampaignCardData): boolean => {
    return campaign.created_by === 'user';
  };

  const isSuperadminCampaign = (campaign: CampaignCardData): boolean => {
    return campaign.created_by === 'superadmin';
  };

  const getCampaignFlowActions = (campaign: CampaignCardData) => {
    if (isUserCampaign(campaign)) {
      return {
        canAddPosts: true,
        canViewAnalytics: campaign.has_posts,
        canExport: campaign.has_posts,
        canManageInfluencers: false,
        showWorkflowStage: false,
        primaryAction: campaign.has_posts ? 'view_analytics' : 'add_posts',
      };
    } else {
      return {
        canAddPosts: false,
        canViewAnalytics: true,
        canExport: true,
        canManageInfluencers: true,
        showWorkflowStage: true,
        primaryAction: 'manage_workflow',
      };
    }
  };

  const getWorkflowStageDisplay = (campaign: CampaignCardData) => {
    if (!isSuperadminCampaign(campaign)) return null;

    // Default workflow stage for superadmin campaigns
    return {
      label: "Planning",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      icon: "📋"
    };
  };

  const getCampaignTypeDisplay = (campaign: CampaignCardData) => {
    if (isUserCampaign(campaign)) {
      return {
        label: "Self-managed",
        color: "bg-muted text-muted-foreground" // Subtle shadcn styling
      };
    } else {
      return {
        label: "Managed",
        color: "bg-muted text-muted-foreground" // Subtle shadcn styling
      };
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        label: "Active",
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        dot: "bg-green-500"
      },
      draft: {
        label: "Draft",
        color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
        dot: "bg-gray-500"
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
    };
    return configs[status as keyof typeof configs] || configs.active;
  };

  const handleCampaignAction = async (campaignId: string, action: string, campaignName: string) => {
    if (onAction) {
      setActionLoading(prev => ({ ...prev, [campaignId]: action }));
      try {
        await onAction(action, campaignId, campaignName);
      } finally {
        setActionLoading(prev => ({ ...prev, [campaignId]: '' }));
      }
    }
  };

  const duplicateCampaign = async (campaign: CampaignCardData) => {
    try {
      setActionLoading(prev => ({ ...prev, [campaign.id]: 'duplicate' }));

      const { campaignApi } = await import('@/services/campaignApiComplete');
      const duplicateData = {
        name: `${campaign.name} (Copy)`,
        brand_name: campaign.brand_name,
        brand_logo_url: campaign.brand_logo_url,
        description: `Duplicate of ${campaign.name}`,
        budget: campaign.budget,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
      };

      const response = isUserCampaign(campaign)
        ? await campaignApi.createUserCampaign(duplicateData)
        : await campaignApi.createSuperadminCampaign(duplicateData);

      if (response.success) {
        console.log(`Campaign "${campaign.name}" has been duplicated`);
        toast.success(`"${campaign.name}" duplicated successfully`);

        // Refresh the page to show the new campaign
        window.location.reload();
      } else {
        throw new Error(response.error || 'Failed to duplicate campaign');
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate campaign';
      toast.error(`Duplication failed: ${errorMessage}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [campaign.id]: '' }));
    }
  };

  // Calculate derived values
  const statusConfig = getStatusConfig(campaign.status);
  const daysRemaining = campaign.deadline ? getDaysRemaining(campaign.deadline) : 0;
  const isUrgent = campaign.deadline ? daysRemaining <= 7 && campaign.status === "active" : false;
  const flowActions = getCampaignFlowActions(campaign);
  const workflowStage = getWorkflowStageDisplay(campaign);
  const campaignType = getCampaignTypeDisplay(campaign);


  return (
    <Card
      className={cn(
        "group border border-border bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer",
        isUrgent && "ring-2 ring-amber-500/20"
      )}
      onClick={() => {
        // FIXED ROUTING: User campaigns go to simple interface, superadmin campaigns go to workflow
        const userCampaign = isUserCampaign(campaign);
        const targetRoute = userCampaign ? `/campaigns/${campaign.id}/posts` : `/campaigns/${campaign.id}`;

        console.log(`🚨 DEBUG: CAMPAIGN CARD CLICK - "${campaign.name}":`, {
          campaign_id: campaign.id,
          created_by: campaign.created_by,
          isUserCampaign: userCampaign,
          targetRoute: targetRoute,
          about_to_navigate_to: targetRoute
        });

        router.push(targetRoute);
      }}
    >
      <CardContent className="px-6 py-4">
        <div className="flex items-start gap-4">
          {/* Brand Logo - Background Image to ELIMINATE white borders */}
          <div
            className="h-24 w-24 flex-shrink-0 rounded-xl flex items-center justify-center text-xl font-semibold"
            style={{
              backgroundImage: campaign.brand_logo_url ? `url(${campaign.brand_logo_url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: campaign.brand_logo_url ? 'transparent' : 'hsl(var(--muted))',
              color: campaign.brand_logo_url ? 'transparent' : 'hsl(var(--muted-foreground))',
              width: '96px',
              height: '96px'
            }}
          >
            {!campaign.brand_logo_url && campaign.brand_name.slice(0, 2).toUpperCase()}
          </div>

          {/* Campaign Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {campaign.name}
                    </h3>

                    {/* Campaign Type Badge - Subtle */}
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {campaignType.label}
                    </Badge>

                    {/* Workflow Stage Badge (Superadmin campaigns only) */}
                    {flowActions.showWorkflowStage && workflowStage && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {workflowStage.label}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Urgency Badge */}
                    {isUrgent && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {daysRemaining} days left
                      </Badge>
                    )}

                    {/* Status Badge - Green and on the right */}
                    <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusConfig.dot)} />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {campaign.brand_name} • {campaign.budget ? `$${campaign.budget.toLocaleString()}` : 'Budget TBD'}
                </p>
              </div>

              {/* Action Menu */}
              {showActions && (
                <div className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
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
              )}
            </div>

            {/* Metrics Grid - Show meaningful data for campaigns */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Reach</p>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {campaign.total_reach ? formatNumber(campaign.total_reach) : '—'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Creators</p>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {campaign.creators_count > 0 ? campaign.creators_count : 'None'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Content</p>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {campaign.posts_count > 0
                      ? `${campaign.posts_count} posts`
                      : campaign.has_posts ? 'Added' : 'Pending'
                    }
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
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
            {(campaign.content_total && campaign.content_total > 0 || campaign.has_posts) && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {campaign.content_total && campaign.content_total > 0 ? 'Content Progress' : 'Campaign Status'}
                  </span>
                  <span className="font-medium">
                    {campaign.content_total && campaign.content_total > 0
                      ? `${Math.round(((campaign.content_delivered || 0) / campaign.content_total) * 100)}%`
                      : campaign.has_posts ? '✓ Active' : 'Started'
                    }
                  </span>
                </div>
                {campaign.content_total && campaign.content_total > 0 && (
                  <Progress
                    value={((campaign.content_delivered || 0) / campaign.content_total) * 100}
                    className="h-2"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}