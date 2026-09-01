/**
 * Operations — one campaign, where it has got to.
 *
 * Density tier: WORKING. Groups sit 40px apart, a panel keeps its 24px, and the figures
 * lose their borders: a count of workstreams is not an object you could click, move or
 * delete, so it never was a card.
 *
 * Three dishonest states lived on this screen and all three are fixed:
 *
 *   1. `!currentCampaign` rendered "Campaign not found" for every failure, including a 500
 *      and a 403. A campaign that could not be read has not been deleted, and telling an
 *      operator it does not exist is the worst answer available.
 *   2. The whole page waited on `overview`, then drew the tabs and the blockers panel from
 *      `overview?.…`, so a failed overview fetch produced a calm, empty, entirely wrong
 *      screen: no shoots, no deadlines, no blockers.
 *   3. Every blocker was gated on `x && x > 0`, which is the case the plan calls the worst
 *      one: when the number does not arrive, no warning shows at all. The blockers panel now
 *      says it could not read them rather than saying there are none.
 *
 * The progress bar also divided by `total_deliverables` with no guard, so a campaign with
 * nothing in it yet rendered NaN.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOperations } from '@/contexts/OperationsContext';
import { Button } from '@/components/ui/button';
import { InternalOnly } from '@/components/operations/RoleBasedContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Page, Sections, Group, PageHead, SectionHead,
  Figure, Figures, State, Failed, Empty, Waiting, Note, DASH,
} from '@/components/campaigns/surface';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileVideo,
  Package,
  Activity,
  ChevronRight,
  Target,
  Film,
  Link2,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { operationsApi } from '@/services/operationsApi';
import { getFilteredActivity } from '@/utils/operationsAccess';
import { useUserStore } from '@/stores/userStore';

/** A date we do not have is a dash, not a guess and not today. */
const safeDate = (value?: string | null, fmt = 'MMM d, yyyy'): string => {
  if (!value) return DASH;
  const d = new Date(value);
  return isValid(d) ? format(d, fmt) : DASH;
};

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

/** One line in the week: a hairline between siblings, not a border around each. */
function WeekRow({
  icon: Icon, title, meta, trailing,
}: { icon: any; title: string; meta?: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-ds-3 border-b border-border/70 py-ds-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-ds-3">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-ds-label">{title}</p>
          {meta && <p className="text-ds-caption text-muted-foreground">{meta}</p>}
        </div>
      </div>
      {trailing}
    </div>
  );
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
    setViewMode,
    loadErrors,
  } = useOperations();

  const [overview, setOverview] = useState<CampaignOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

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
      setOverviewError(null);
    } catch (error: any) {
      console.error('Failed to load campaign overview:', error)
      setOverviewError(error?.message || 'The campaign summary could not be read.');
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
      <Page>
        <Sections>
          <Waiting lines={2} />
          <Waiting lines={4} />
        </Sections>
      </Page>
    );
  }

  /* A read that failed and a campaign that is not there are two different answers. */
  if (!currentCampaign) {
    return (
      <Page width="form">
        {loadErrors.campaign ? (
          <Failed
            what="This campaign did not load"
            detail={`${loadErrors.campaign} It has not gone anywhere, we could not read it just now.`}
            onRetry={() => selectCampaign(campaignId)}
          />
        ) : (
          <Sections>
            <PageHead
              title="This campaign is not here"
              sub="The link may be out of date, or the campaign may have been archived."
              action={
                <Button variant="outline" onClick={() => router.push('/ops/campaigns')}>
                  All campaigns
                </Button>
              }
            />
          </Sections>
        )}
      </Page>
    );
  }

  const summary = overview?.summary;
  const totalDeliverables = summary?.total_deliverables;
  const completed = summary?.completed_deliverables;
  /* Guarded: this divided by zero on a campaign with nothing in it yet and rendered NaN. */
  const progressPct =
    typeof totalDeliverables === 'number' && totalDeliverables > 0 && typeof completed === 'number'
      ? Math.round((completed / totalDeliverables) * 100)
      : null;

  const blockers = overview?.blockers;
  const blockerLines: { key: string; icon: any; label: string; detail: string; bad?: boolean }[] = [];
  if (blockers) {
    if (isClientView) {
      if ((blockers.pending_your_approval ?? 0) > 0) {
        blockerLines.push({
          key: 'pending_your_approval', icon: AlertCircle, label: 'Waiting on you',
          detail: `${blockers.pending_your_approval} concepts need your approval`,
        });
      }
    } else {
      if ((blockers.missing_scripts ?? 0) > 0) {
        blockerLines.push({
          key: 'missing_scripts', icon: AlertCircle, label: 'Missing scripts',
          detail: `${blockers.missing_scripts} deliverables need scripts`,
        });
      }
      if ((blockers.pending_approvals ?? 0) > 0) {
        blockerLines.push({
          key: 'pending_approvals', icon: Clock, label: 'Pending approvals',
          detail: `${blockers.pending_approvals} items awaiting approval`,
        });
      }
      if ((blockers.missing_frameio ?? 0) > 0) {
        blockerLines.push({
          key: 'missing_frameio', icon: Link2, label: 'Missing Frame.io links',
          detail: `${blockers.missing_frameio} deliverables missing assets`,
        });
      }
      if ((blockers.overdue_deliverables ?? 0) > 0) {
        blockerLines.push({
          key: 'overdue_deliverables', icon: AlertCircle, label: 'Overdue deliverables',
          detail: `${blockers.overdue_deliverables} deliverables past deadline`, bad: true,
        });
      }
    }
  }

  const activity = getFilteredActivity(overview?.recent_activity || [], user);

  return (
    <Page>
      <Sections>
        <PageHead
          eyebrow={currentCampaign.brand_name}
          title={currentCampaign.campaign_name}
          sub={`${safeDate(currentCampaign.start_date)} to ${safeDate(currentCampaign.end_date)}`}
          action={
            <>
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
              <State tone={currentCampaign.status === 'active' ? 'good' : 'neutral'}>
                {currentCampaign.status}
              </State>
            </>
          }
        />

        {/* ── where the campaign has got to ─────────────────────────────────────────── */}
        <Group>
          <SectionHead
            title="Progress"
            sub="Deliverables completed, and where the rest of them are."
          />

          {overviewError ? (
            <Failed
              what="The campaign summary did not load"
              detail={`${overviewError} These figures are missing, not zero.`}
              onRetry={loadOverview}
            />
          ) : (
            <div className="flex flex-col gap-ds-4">
              <div className="flex flex-col gap-ds-2">
                <div className="flex items-baseline justify-between gap-ds-3">
                  <span className="text-ds-label">
                    {progressPct == null ? DASH : `${progressPct}%`} complete
                  </span>
                  <span className="text-ds-caption text-muted-foreground">
                    {completed ?? DASH} of {totalDeliverables ?? DASH} deliverables
                  </span>
                </div>
                <Progress value={progressPct ?? 0} className="h-2" />
              </div>

              <Figures cols={4}>
                <Figure label="Workstreams" value={summary?.total_workstreams ?? null} emphasis="quiet" />
                <Figure label="In production" value={summary?.in_production ?? null} emphasis="quiet" />
                <Figure label="Pending approval" value={summary?.pending_approval ?? null} emphasis="quiet" />
                <Figure label="Overdue" value={summary?.overdue ?? null} emphasis="quiet" />
              </Figures>
            </div>
          )}
        </Group>

        {/* ── the week, and what is in the way ──────────────────────────────────────── */}
        <div className="grid gap-ds-5 lg:grid-cols-3">
          <Group className="lg:col-span-2">
            <SectionHead title="This week" sub="Shoots, deadlines and events in the next seven days." />

            {overviewError ? (
              <Failed
                what="This week did not load"
                detail="An empty week here would be a guess, so nothing is shown."
                onRetry={loadOverview}
              />
            ) : (
              <Tabs defaultValue="shoots" className="w-full">
                <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-3">
                  <TabsTrigger value="shoots">
                    Shoots ({overview?.this_week.shoots.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="deadlines">
                    Deadlines ({overview?.this_week.deadlines.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="events">
                    Events ({overview?.this_week.events.length ?? 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="shoots" className="mt-ds-3">
                  {!overview?.this_week.shoots.length ? (
                    <Empty>No shoots are scheduled this week.</Empty>
                  ) : (
                    overview.this_week.shoots.map((shoot, idx) => (
                      <WeekRow
                        key={idx}
                        icon={Film}
                        title={shoot.location}
                        meta={safeDate(shoot.date)}
                        trailing={
                          <span className="shrink-0 text-ds-caption text-muted-foreground">
                            {shoot.deliverables_count} deliverables
                          </span>
                        }
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="deadlines" className="mt-ds-3">
                  {!overview?.this_week.deadlines.length ? (
                    <Empty>Nothing is due this week.</Empty>
                  ) : (
                    overview.this_week.deadlines.map((deadline, idx) => (
                      <WeekRow
                        key={idx}
                        icon={Clock}
                        title={deadline.deliverable}
                        meta={`${deadline.creator} · ${safeDate(deadline.date, 'MMM d')}`}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="events" className="mt-ds-3">
                  {!overview?.this_week.events.length ? (
                    <Empty>No events are scheduled this week.</Empty>
                  ) : (
                    overview.this_week.events.map((event, idx) => (
                      <WeekRow
                        key={idx}
                        icon={Calendar}
                        title={event.name}
                        meta={safeDate(event.date)}
                        trailing={<State tone="neutral">{event.type}</State>}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </Group>

          <Group>
            <SectionHead
              title="Blockers"
              sub={isClientView ? 'Waiting on you.' : 'Waiting on someone.'}
            />

            {/* The old version showed "No blockers" whenever the numbers were missing,
                which is the one case where an operator most needs to be told otherwise. */}
            {overviewError || !blockers ? (
              <Note tone="warn">
                We could not read the blockers for this campaign. There may well be some, so
                this is not an all clear.
              </Note>
            ) : blockerLines.length === 0 ? (
              <div className="flex items-center gap-ds-2 py-ds-3 text-ds-body text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Nothing is blocked.
              </div>
            ) : (
              <div className="flex flex-col">
                {blockerLines.map(b => (
                  <WeekRow
                    key={b.key}
                    icon={b.icon}
                    title={b.label}
                    meta={b.detail}
                    trailing={b.bad ? <State tone="bad">Overdue</State> : undefined}
                  />
                ))}
              </div>
            )}
          </Group>
        </div>

        {/* ── workstreams ───────────────────────────────────────────────────────────── */}
        <Group>
          <SectionHead
            title="Workstreams"
            sub="How the work is split up."
            action={
              <Button variant="outline" size="sm" onClick={() => navigateToSection('workstreams')}>
                View all
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            }
          />

          {loadErrors.campaign ? (
            <Failed
              what="The workstreams did not load"
              detail={loadErrors.campaign}
              onRetry={() => selectCampaign(campaignId)}
            />
          ) : workstreams.length === 0 ? (
            <Empty>No workstreams have been set up on this campaign yet.</Empty>
          ) : (
            <div className="grid gap-ds-3 md:grid-cols-2 lg:grid-cols-3">
              {/* A workstream IS an object you can open, so it keeps its card. */}
              {workstreams.slice(0, 6).map(workstream => (
                <button
                  key={workstream.id}
                  type="button"
                  onClick={() => navigateToSection(`workstreams/${workstream.id}`)}
                  className="flex flex-col gap-ds-2 rounded-ds-surface border border-border bg-card p-ds-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-ds-2">
                    <State tone="neutral">{workstream.type.replace('_', ' ')}</State>
                    <span className="text-ds-caption tabular-nums text-muted-foreground">
                      {workstream.completion_percentage ?? DASH}%
                    </span>
                  </div>
                  <p className="text-ds-label">{workstream.name}</p>
                  <div className="flex items-center gap-ds-3 text-ds-caption text-muted-foreground">
                    <span>{workstream.deliverables_count ?? DASH} deliverables</span>
                    {(workstream.pending_approvals ?? 0) > 0 && (
                      <span className="text-amber-700 dark:text-amber-400">
                        {workstream.pending_approvals} pending
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Group>

        {/* ── activity ──────────────────────────────────────────────────────────────── */}
        <Group>
          <SectionHead title="Recent activity" sub="The last few things that happened." />
          {/* "View All" removed — the activity route was retired (May 2026)
              and the inline feed below already shows recent activity. */}

          {overviewError ? (
            <Failed
              what="The activity feed did not load"
              detail="This is a display problem. Nothing has been undone."
              onRetry={loadOverview}
            />
          ) : activity.length === 0 ? (
            <Empty>Nothing has happened on this campaign yet.</Empty>
          ) : (
            <div className="flex flex-col">
              {activity.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-ds-3 border-b border-border/70 py-ds-3 last:border-b-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-full bg-muted">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-ds-1">
                    <p className="text-ds-body">
                      <span className="font-medium">{item.actor_name}</span> {item.action}
                    </p>
                    <p className="text-ds-caption text-muted-foreground">
                      {safeDate(item.timestamp, 'MMM d, h:mm a')}
                    </p>
                    <InternalOnly>
                      {item.type && (
                        <span className="text-ds-overline uppercase text-muted-foreground">
                          {item.type}
                        </span>
                      )}
                    </InternalOnly>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Group>

        {/* ── where to go next ──────────────────────────────────────────────────────── */}
        <Group>
          <SectionHead title="Go to" rule={false} />
          <div className="flex flex-wrap gap-ds-3">
            <Button variant="outline" onClick={() => navigateToSection('workstreams')}>
              <Package className="h-4 w-4 mr-2" />
              Workstreams
            </Button>
            <Button variant="outline" onClick={() => navigateToSection('deliverables')}>
              <FileVideo className="h-4 w-4 mr-2" />
              Deliverables
            </Button>
            {!isClientView && isInternal && (
              <Button variant="outline" onClick={() => navigateToSection('settings')}>
                <Target className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </Group>
      </Sections>
    </Page>
  );
}
