/**
 * Operations — the workstreams on one campaign.
 *
 * Density tier: WORKING. A workstream genuinely is an object you can open, so it keeps its
 * card; the type filter above it was a card wrapped around a row of buttons, which is a box
 * around a control, and it is now just the row of buttons. The summary at the bottom was
 * four numbers in a card and is now a band with no borders at all.
 *
 * Honesty: "No workstreams found. Create your first one" was shown over a failed campaign
 * read as well as over a genuinely empty campaign, which invites an operator to build a
 * second copy of work that already exists. The two now read differently, and the average
 * completion figure no longer divides by a length that can be zero.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOperations } from '@/contexts/OperationsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Page, Sections, Group, PageHead, SectionHead,
  Figure, Figures, State, Failed, Empty, Waiting, Note, DASH,
  type StateTone,
} from '@/components/campaigns/surface';
import {
  Plus,
  Video,
  Camera,
  Calendar,
  Coins,
  Gift,
  Layers,
  ChevronRight,
  Target
} from 'lucide-react';
import { WorkstreamType, Workstream } from '@/types/operations';
import { toast } from 'sonner';

const WORKSTREAM_ICONS: Record<WorkstreamType, any> = {
  ugc: Video,
  influencer_paid: Coins,
  influencer_barter: Gift,
  video_shoot: Video,
  photo_shoot: Camera,
  event_activation: Calendar,
  hybrid: Layers
};

const WORKSTREAM_LABELS: Record<WorkstreamType, string> = {
  ugc: 'UGC Content',
  influencer_paid: 'Paid Influencer',
  influencer_barter: 'Barter Influencer',
  video_shoot: 'Video Shoot',
  photo_shoot: 'Photo Shoot',
  event_activation: 'Event Activation',
  hybrid: 'Hybrid Campaign'
};

// Per-type guidance shown in the create flow so operators know what each
// workstream models (UGC is just one of several execution types).
const WORKSTREAM_DESCRIPTIONS: Record<WorkstreamType, string> = {
  ugc: 'Creator-produced content: concepts, scripts, videos, client review.',
  influencer_paid: 'Paid influencer deliverables with fees, briefs and posting deadlines.',
  influencer_barter: 'Gifted collaborations exchanged for content deliverables.',
  video_shoot: 'In-house or studio video production days, call sheets and edits.',
  photo_shoot: 'Photography production days, shot lists and asset delivery.',
  event_activation: 'On-ground activations and events: invites, attendance and coverage.',
  hybrid: 'A mix of execution types managed under one workstream.'
};

const STATUS_TONE: Record<string, StateTone> = {
  draft: 'neutral',
  active: 'good',
  completed: 'info',
  archived: 'neutral',
};

export default function WorkstreamsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const {
    currentCampaign,
    workstreams,
    selectCampaign,
    createWorkstream,
    uiState,
    userAccess,
    loadErrors,
  } = useOperations();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkstream, setNewWorkstream] = useState<Partial<Workstream>>({
    type: 'ugc',
    name: '',
    description: '',
    status: 'draft'
  });
  const [creating, setCreating] = useState(false);
  const [filterType, setFilterType] = useState<WorkstreamType | 'all'>('all');

  useEffect(() => {
    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
  }, [campaignId, currentCampaign, selectCampaign]);

  const isInternal = userAccess.permissions.view_internal_notes;
  const canCreate = userAccess.permissions.create_workstreams;
  const failed = loadErrors.campaign;

  const filteredWorkstreams = workstreams.filter(ws =>
    filterType === 'all' || ws.type === filterType
  );

  const handleCreateWorkstream = async () => {
    if (!newWorkstream.name) {
      toast.error('Please enter a workstream name');
      return;
    }

    setCreating(true);
    try {
      await createWorkstream({
        ...newWorkstream,
        campaign_id: campaignId
      });
      setCreateDialogOpen(false);
      setNewWorkstream({ type: 'ugc', name: '', description: '', status: 'draft' });
      toast.success('Workstream created successfully');
    } catch (error) {
      console.error('Failed to create workstream:', error)
    } finally {
      setCreating(false);
    }
  };

  const navigateToWorkstream = (workstreamId: string) => {
    router.push(`/ops/campaigns/${campaignId}/workstreams/${workstreamId}`);
  };

  /* An average over a list we could not read is not an average. */
  const totalDeliverables = failed
    ? null
    : workstreams.reduce((sum, ws) => sum + (ws.deliverables_count || 0), 0);
  const totalPending = failed
    ? null
    : workstreams.reduce((sum, ws) => sum + (ws.pending_approvals || 0), 0);
  const averageCompletion =
    failed || workstreams.length === 0
      ? null
      : Math.round(
          workstreams.reduce((sum, ws) => sum + (ws.completion_percentage || 0), 0) /
          workstreams.length
        );

  if (uiState.isLoading && workstreams.length === 0) {
    return (
      <Page width="wide">
        <Sections>
          <PageHead title="Workstreams" sub="Deliverables, organised by how they get made." />
          <Waiting lines={4} />
        </Sections>
      </Page>
    );
  }

  return (
    <Page width="wide">
      <Sections>
        <PageHead
          back={
            <button
              onClick={() => router.push(`/ops/campaigns/${campaignId}`)}
              className="flex w-fit items-center gap-ds-1 text-ds-caption text-muted-foreground hover:text-foreground"
            >
              {currentCampaign?.campaign_name || 'Campaign'}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          }
          title="Workstreams"
          sub="Deliverables, organised by how they get made."
          action={
            <>
              {/* UGC is one of the workstream types but keeps its dedicated rich studio. */}
              <Button variant="outline" onClick={() => router.push(`/campaigns/${campaignId}/ugc`)}>
                <Video className="h-4 w-4 mr-2" />
                UGC Studio
              </Button>
              {canCreate && (
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Workstream
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create workstream</DialogTitle>
                      <DialogDescription>
                        A workstream groups deliverables that get made the same way.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-ds-4 py-ds-3">
                      <div className="flex flex-col gap-ds-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={newWorkstream.type}
                          onValueChange={(value: string) => setNewWorkstream(prev => ({
                            ...prev,
                            type: value as WorkstreamType
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(WORKSTREAM_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newWorkstream.type && (
                          <p className="max-w-prose text-ds-caption text-muted-foreground">
                            {WORKSTREAM_DESCRIPTIONS[newWorkstream.type as WorkstreamType]}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-ds-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={newWorkstream.name}
                          onChange={(e) => setNewWorkstream(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                          placeholder="e.g., Q1 UGC Campaign"
                        />
                      </div>
                      <div className="flex flex-col gap-ds-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                          id="description"
                          value={newWorkstream.description}
                          onChange={(e) => setNewWorkstream(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          placeholder="Brief description of this workstream..."
                          rows={3}
                        />
                      </div>
                      <div className="flex flex-col gap-ds-2">
                        <Label htmlFor="status">Initial status</Label>
                        <Select
                          value={newWorkstream.status}
                          onValueChange={(value: string) => setNewWorkstream(prev => ({
                            ...prev,
                            status: value as 'draft' | 'active'
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {isInternal && (
                        <div className="flex flex-col gap-ds-2">
                          <Label htmlFor="internal_notes">Internal notes (optional)</Label>
                          <Textarea
                            id="internal_notes"
                            value={newWorkstream.internal_notes || ''}
                            onChange={(e) => setNewWorkstream(prev => ({
                              ...prev,
                              internal_notes: e.target.value
                            }))}
                            placeholder="Internal context, never shown to clients..."
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateWorkstream} disabled={creating}>
                        {creating ? 'Creating...' : 'Create workstream'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </>
          }
        />

        {workstreams.length > 0 && !failed && (
          <Figures cols={4}>
            <Figure label="Workstreams" value={workstreams.length} emphasis="quiet" />
            <Figure label="Deliverables" value={totalDeliverables} emphasis="quiet" />
            <Figure label="Pending approval" value={totalPending} emphasis="quiet" />
            <Figure
              label="Average completion"
              value={averageCompletion == null ? null : `${averageCompletion}%`}
              emphasis="quiet"
            />
          </Figures>
        )}

        <Group>
          <SectionHead title="By type" sub="Filter the list below." rule={false} />
          <div className="flex flex-wrap gap-ds-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All types
              {filterType === 'all' && (
                <span className="ml-ds-2 tabular-nums opacity-70">{workstreams.length}</span>
              )}
            </Button>
            {Object.entries(WORKSTREAM_LABELS).map(([value, label]) => {
              const Icon = WORKSTREAM_ICONS[value as WorkstreamType];
              const count = workstreams.filter(ws => ws.type === value).length;
              return (
                <Button
                  key={value}
                  variant={filterType === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(value as WorkstreamType)}
                  disabled={count === 0}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                  {count > 0 && <span className="ml-ds-2 tabular-nums opacity-70">{count}</span>}
                </Button>
              );
            })}
          </div>
        </Group>

        {failed ? (
          <Failed
            what="The workstreams did not load"
            detail={`${failed} This campaign has not been emptied, we could not read it.`}
            onRetry={() => selectCampaign(campaignId)}
          />
        ) : filteredWorkstreams.length === 0 ? (
          <div className="flex flex-col items-start gap-ds-3">
            <Empty>
              {workstreams.length === 0
                ? 'No workstreams on this campaign yet. The first one is how the work gets organised.'
                : 'No workstream of that type on this campaign.'}
            </Empty>
            {canCreate && workstreams.length === 0 && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create first workstream
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-ds-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkstreams.map((workstream) => {
              const Icon = WORKSTREAM_ICONS[workstream.type];
              return (
                <button
                  key={workstream.id}
                  type="button"
                  onClick={() => navigateToWorkstream(workstream.id)}
                  className="flex flex-col gap-ds-3 rounded-ds-surface border border-border bg-card p-ds-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-ds-3">
                    <div className="flex min-w-0 items-center gap-ds-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-ds-label">{workstream.name}</p>
                        <p className="text-ds-caption text-muted-foreground">
                          {WORKSTREAM_LABELS[workstream.type]}
                        </p>
                      </div>
                    </div>
                    <State tone={STATUS_TONE[workstream.status] || 'neutral'}>
                      {workstream.status}
                    </State>
                  </div>

                  {workstream.description && (
                    <p className="line-clamp-2 text-ds-caption text-muted-foreground">
                      {workstream.description}
                    </p>
                  )}

                  <div className="flex flex-col gap-ds-2">
                    <div className="flex items-baseline justify-between text-ds-caption">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium tabular-nums">
                        {workstream.completion_percentage == null
                          ? DASH
                          : `${workstream.completion_percentage}%`}
                      </span>
                    </div>
                    <Progress value={workstream.completion_percentage ?? 0} className="h-1.5" />
                  </div>

                  <div className="flex items-center gap-ds-5 text-ds-caption">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground tabular-nums">
                        {workstream.deliverables_count ?? DASH}
                      </span>{' '}
                      deliverables
                    </span>
                    <span className="text-muted-foreground">
                      <span
                        className={
                          (workstream.pending_approvals ?? 0) > 0
                            ? 'font-medium tabular-nums text-amber-700 dark:text-amber-400'
                            : 'font-medium tabular-nums text-foreground'
                        }
                      >
                        {workstream.pending_approvals ?? DASH}
                      </span>{' '}
                      pending
                    </span>
                  </div>

                  {workstream.next_milestone && (
                    <div className="flex items-center gap-ds-2 border-t border-border/70 pt-ds-3 text-ds-caption">
                      <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate">
                        <span className="font-medium">
                          Next: {workstream.next_milestone.description}
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {new Date(workstream.next_milestone.date).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  )}

                  {workstream.type === 'hybrid' && (
                    <Note>Contains more than one execution type.</Note>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Sections>
    </Page>
  );
}
