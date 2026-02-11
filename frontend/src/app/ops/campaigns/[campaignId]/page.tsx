/**
 * Operations OS - Campaign Operations Home
 * Central dashboard for campaign execution management
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOperations } from '@/contexts/OperationsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InternalOnly, ClientSafe } from '@/components/operations/RoleBasedContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileVideo,
  Users,
  Package,
  Activity,
  ChevronRight,
  Briefcase,
  Target,
  AlertTriangle,
  Film,
  CalendarDays,
  Link2,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { operationsApi } from '@/services/operationsApi';
import { getFilteredActivity } from '@/utils/operationsAccess';
import { useUserStore } from '@/stores/userStore';

interface CampaignOverview {
  summary: {
    total_workstreams: number;
    total_deliverables: number;
    completed_deliverables: number;
    in_production: number;
    pending_approval: number;
    overdue: number;
  };
  this_week: {
    shoots: Array<{ date: string; location: string; deliverables_count: number }>;
    deadlines: Array<{ date: string; deliverable: string; creator: string }>;
    events: Array<{ date: string; name: string; type: string }>;
  };
  blockers: {
    missing_scripts?: number;
    pending_approvals?: number;
    missing_frameio?: number;
    overdue_deliverables?: number;
    pending_your_approval?: number;
  };
  recent_activity: Array<{
    id: string;
    type: string;
    action: string;
    actor_name: string;
    timestamp: string;
  }>;
}

export default function CampaignOperationsHome() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const user = useUserStore(state => state.user);

  const {
    currentCampaign,
    workstreams,
    selectCampaign,
    uiState,
    userAccess,
    setViewMode
  } = useOperations();

  const [overview, setOverview] = useState<CampaignOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => {
    if (campaignId) {
      selectCampaign(campaignId);
      loadOverview();
    }
  }, [campaignId]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await operationsApi.getCampaignOverview(campaignId);
      setOverview(data);
    } catch (error) {
      console.error('Failed to load overview:', error);
    } finally {
      setLoadingOverview(false);
    }
  };

  const isInternal = userAccess.permissions.view_internal_notes;
  const isClientView = uiState.viewMode === 'client';

  const navigateToSection = (path: string) => {
    router.push(`/ops/campaigns/${campaignId}/${path}`);
  };

  if (uiState.isLoading || loadingOverview) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!currentCampaign) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campaign not found</AlertTitle>
          <AlertDescription>
            The requested campaign could not be loaded.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Briefcase className="h-4 w-4" />
            <span>{currentCampaign.brand_name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{currentCampaign.campaign_name}</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(currentCampaign.start_date), 'MMM d, yyyy')} -{' '}
            {format(new Date(currentCampaign.end_date), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isInternal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(isClientView ? 'internal' : 'client')}
            >
              {isClientView ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Switch to Internal
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Switch to Client
                </>
              )}
            </Button>
          )}
          <Badge variant={currentCampaign.status === 'active' ? 'default' : 'secondary'}>
            {currentCampaign.status}
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Progress</CardTitle>
            <CardDescription>
              Overall completion and deliverable status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {overview.summary.completed_deliverables} / {overview.summary.total_deliverables} completed
                  </span>
                </div>
                <Progress
                  value={(overview.summary.completed_deliverables / overview.summary.total_deliverables) * 100}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{overview.summary.total_workstreams}</p>
                  <p className="text-xs text-muted-foreground">Workstreams</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{overview.summary.in_production}</p>
                  <p className="text-xs text-muted-foreground">In Production</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-yellow-600">
                    {overview.summary.pending_approval}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-red-600">
                    {overview.summary.overdue}
                  </p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* This Week */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              This Week
            </CardTitle>
            <CardDescription>Upcoming shoots, deadlines, and events</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="shoots" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="shoots">
                  Shoots ({overview?.this_week.shoots.length || 0})
                </TabsTrigger>
                <TabsTrigger value="deadlines">
                  Deadlines ({overview?.this_week.deadlines.length || 0})
                </TabsTrigger>
                <TabsTrigger value="events">
                  Events ({overview?.this_week.events.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="shoots" className="space-y-2">
                {overview?.this_week.shoots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No shoots scheduled this week
                  </p>
                ) : (
                  overview?.this_week.shoots.map((shoot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{shoot.location}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(shoot.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {shoot.deliverables_count} deliverables
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="deadlines" className="space-y-2">
                {overview?.this_week.deadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No deadlines this week
                  </p>
                ) : (
                  overview?.this_week.deadlines.map((deadline, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{deadline.deliverable}</p>
                          <p className="text-sm text-muted-foreground">
                            {deadline.creator} • {format(new Date(deadline.date), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-2">
                {overview?.this_week.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No events this week
                  </p>
                ) : (
                  overview?.this_week.events.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Blockers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Blockers
            </CardTitle>
            <CardDescription>
              {isClientView ? 'Items requiring your attention' : 'Issues requiring resolution'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.blockers && (
              <div className="space-y-3">
                {isClientView ? (
                  <>
                    {overview.blockers.pending_your_approval && overview.blockers.pending_your_approval > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Pending Your Approval</AlertTitle>
                        <AlertDescription className="text-xs">
                          {overview.blockers.pending_your_approval} concepts awaiting approval
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <>
                    {overview.blockers.missing_scripts && overview.blockers.missing_scripts > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Missing Scripts</AlertTitle>
                        <AlertDescription className="text-xs">
                          {overview.blockers.missing_scripts} deliverables need scripts
                        </AlertDescription>
                      </Alert>
                    )}
                    {overview.blockers.pending_approvals && overview.blockers.pending_approvals > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Pending Approvals</AlertTitle>
                        <AlertDescription className="text-xs">
                          {overview.blockers.pending_approvals} items awaiting approval
                        </AlertDescription>
                      </Alert>
                    )}
                    {overview.blockers.missing_frameio && overview.blockers.missing_frameio > 0 && (
                      <Alert>
                        <Link2 className="h-4 w-4" />
                        <AlertTitle className="text-sm">Missing Frame.io Links</AlertTitle>
                        <AlertDescription className="text-xs">
                          {overview.blockers.missing_frameio} deliverables missing assets
                        </AlertDescription>
                      </Alert>
                    )}
                    {overview.blockers.overdue_deliverables && overview.blockers.overdue_deliverables > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Overdue Deliverables</AlertTitle>
                        <AlertDescription className="text-xs">
                          {overview.blockers.overdue_deliverables} deliverables past deadline
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {Object.values(overview.blockers).every(v => !v || v === 0) && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">No blockers</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workstreams Quick Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workstreams</CardTitle>
              <CardDescription>Quick access to campaign workstreams</CardDescription>
            </div>
            <Button onClick={() => navigateToSection('workstreams')}>
              View All
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workstreams.slice(0, 6).map(workstream => (
              <Card
                key={workstream.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigateToSection(`workstreams/${workstream.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">{workstream.type.replace('_', ' ')}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {workstream.completion_percentage}%
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-1">{workstream.name}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{workstream.deliverables_count} deliverables</span>
                    {workstream.pending_approvals > 0 && (
                      <span className="text-yellow-600">
                        {workstream.pending_approvals} pending
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateToSection('activity')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getFilteredActivity(overview?.recent_activity || [], user)
              .slice(0, 5)
              .map(activity => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.actor_name}</span>{' '}
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </p>
                    <InternalOnly>
                      {activity.type && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {activity.type}
                        </Badge>
                      )}
                    </InternalOnly>
                  </div>
                </div>
              ))}

            {(!overview?.recent_activity || getFilteredActivity(overview.recent_activity, user).length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToSection('workstreams')}
        >
          <Package className="h-6 w-6" />
          <span>Workstreams</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToSection('deliverables')}
        >
          <FileVideo className="h-6 w-6" />
          <span>Deliverables</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToSection('production')}
        >
          <Film className="h-6 w-6" />
          <span>Production</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToSection('events')}
        >
          <Calendar className="h-6 w-6" />
          <span>Events</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToSection('assets')}
        >
          <Link2 className="h-6 w-6" />
          <span>Assets</span>
        </Button>
        {!isClientView && isInternal && (
          <>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => navigateToSection('finance')}
            >
              <DollarSign className="h-6 w-6" />
              <span>Finance</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => navigateToSection('settings')}
            >
              <Target className="h-6 w-6" />
              <span>Settings</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}