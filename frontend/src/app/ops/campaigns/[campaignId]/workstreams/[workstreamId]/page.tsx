/**
 * Operations — one workstream, and everything being made inside it.
 *
 * Density tier: WORKING for the page, SCANNING for the deliverables table inside it. The
 * progress panel was a card wrapped around a progress bar and two numbers, which is a box
 * around a fact; it is now a group with a hairline under its heading. The concepts were one
 * card per concept with a bordered actions strip inside each; a concept IS an object you can
 * open and approve, so it keeps its card, but the internal borders come off and the reading
 * text gets a measure.
 *
 * Honesty, and there was a lot of it to fix:
 *
 *   - Every tab caught its fetch, fired a toast, and left an empty array behind, so a 500
 *     rendered as "No deliverables. Create your first deliverable to get started" and "No
 *     concepts found". That invites an operator to rebuild work that already exists. Error,
 *     empty and loading are now three different answers on both tabs.
 *   - The page itself waited on `uiState.isLoading || !currentWorkstream`, so a workstream
 *     that failed to read showed skeletons forever, with no error and no way back.
 *   - The select-all checkbox was checked whenever `selected.length === filtered.length`,
 *     which is true of two empty lists, so it read as checked with nothing selected.
 *
 * Cost: the payouts tab stays internal-only. Payouts are what we pay a creator, and a brand
 * never sees cost.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Page, Sections, Group, PageHead, SectionHead,
  Ledger, Cell, State, Failed, Empty, Waiting, DASH,
  type StateTone,
} from '@/components/campaigns/surface';
import {
  Plus,
  MoreVertical,
  UserPlus,
  ChevronRight,
  Trash,
  CheckCircle,
  XCircle,
  Link2,
  Filter,
  ExternalLink,
  Edit,
} from 'lucide-react';
import {
  Deliverable,
  DeliverableStatus,
  Concept,
  ConceptApprovalStatus,
} from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { useOperations } from '@/contexts/OperationsContext';
import { ProductionTab } from '@/components/operations/ProductionTab';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';

// Full deliverable lifecycle (matches DeliverableStatus). Used for inline +
// bulk status changes, wired to the bulkUpdateDeliverables endpoint.
const DELIVERABLE_STATUSES: { value: DeliverableStatus; label: string }[] = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'DRAFTING', label: 'Drafting' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'EDITING', label: 'Editing' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'REVISION_REQUIRED', label: 'Revision Required' },
  { value: 'READY_TO_POST', label: 'Ready to Post' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_TONE: Record<string, StateTone> = {
  IDEA: 'neutral',
  DRAFTING: 'info',
  AWAITING_APPROVAL: 'warn',
  APPROVED: 'good',
  SCHEDULED: 'info',
  IN_PRODUCTION: 'info',
  EDITING: 'info',
  IN_REVIEW: 'warn',
  REVISION_REQUIRED: 'bad',
  READY_TO_POST: 'info',
  POSTED: 'good',
  ARCHIVED: 'neutral',
};

const say = (status: string) => status.replace(/_/g, ' ').toLowerCase();

/** A due date, or a dash. Red only when it is genuinely past. */
function DueDate({ due }: { due?: string | null }) {
  if (!due) return <span className="text-muted-foreground/70">{DASH}</span>;
  const d = new Date(due);
  if (!isValid(d)) return <span className="text-muted-foreground/70">{DASH}</span>;
  const overdue = d < new Date();
  return (
    <span className={overdue ? 'font-medium text-red-600 dark:text-red-400' : undefined}>
      {format(d, 'MMM d')}
    </span>
  );
}

// ── Deliverables ─────────────────────────────────────────────────────────────────────────

const DeliverablesTab = ({
  workstreamId,
  isInternal,
  selectedDeliverables,
  onToggleSelection,
  onSelectAll,
  onClearSelection
}: any) => {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState<Partial<Deliverable>>({
    title: '',
    type: 'video',
    status: 'IDEA',
    description: ''
  });
  const [bulkAction, setBulkAction] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [filterStatus, setFilterStatus] = useState<DeliverableStatus | 'all'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  // Assign-creator dialog (creates an ops_assignments row linked to the deliverable)
  const [assignTarget, setAssignTarget] = useState<Deliverable | null>(null);
  const [assignUsername, setAssignUsername] = useState('');
  const [assignName, setAssignName] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);

  useEffect(() => {
    loadDeliverables();
  }, [workstreamId]);

  const loadDeliverables = async () => {
    setLoading(true);
    try {
      const data = await operationsApi.getDeliverables(workstreamId);
      setDeliverables(data.deliverables || []);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error?.message || 'The deliverables could not be read.');
      toast.error('Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeliverable = async () => {
    if (!newDeliverable.title) {
      toast.error('Please enter a deliverable title');
      return;
    }

    try {
      const created = await operationsApi.createDeliverable(workstreamId, {
        ...newDeliverable,
        workstream_id: workstreamId
      });
      setDeliverables(prev => [...prev, created]);
      setCreateDialogOpen(false);
      setNewDeliverable({ title: '', type: 'video', status: 'IDEA', description: '' });
      toast.success('Deliverable created');
    } catch (error) {
      toast.error('Failed to create deliverable');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedDeliverables.length === 0) {
      toast.error('Select deliverables and an action');
      return;
    }
    if (bulkAction === 'status_change' && !bulkStatus) {
      toast.error('Pick a status to change to');
      return;
    }

    try {
      const results = await operationsApi.bulkUpdateDeliverables({
        type: bulkAction as any,
        target_ids: selectedDeliverables,
        params: bulkAction === 'status_change' ? { status: bulkStatus } : {},
      });

      const successCount = (results || []).filter((r: any) => r.success).length;
      toast.success(`${successCount} deliverable(s) updated`);
      setBulkStatus('');
      setBulkAction('');
      loadDeliverables();
      onClearSelection();
    } catch (error) {
      toast.error('Bulk operation failed');
    }
  };

  // Single-row status change + delete, wired to the same bulk endpoint.
  const handleRowStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await operationsApi.bulkUpdateDeliverables({
        type: 'status_change' as any, target_ids: [id], params: { status },
      });
      setDeliverables(prev => prev.map(d => (d.id === id ? { ...d, status: status as DeliverableStatus } : d)));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const handleRowDelete = async (id: string) => {
    setBusyId(id);
    try {
      await operationsApi.bulkUpdateDeliverables({ type: 'delete' as any, target_ids: [id], params: {} });
      setDeliverables(prev => prev.filter(d => d.id !== id));
      toast.success('Deliverable deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  const handleAssignCreator = async () => {
    if (!assignTarget || !assignUsername.trim()) {
      toast.error('Enter the creator username');
      return;
    }
    setAssignBusy(true);
    try {
      await operationsApi.createAssignment(workstreamId, {
        creator_username: assignUsername.trim().replace(/^@/, ''),
        creator_name: assignName.trim() || undefined,
        deliverable_id: assignTarget.id,
      });
      toast.success(`Assigned @${assignUsername.trim().replace(/^@/, '')}`);
      setAssignTarget(null);
      setAssignUsername('');
      setAssignName('');
      loadDeliverables();
    } catch {
      toast.error('Failed to assign creator');
    } finally {
      setAssignBusy(false);
    }
  };

  const filteredDeliverables = deliverables.filter(d =>
    filterStatus === 'all' || d.status === filterStatus
  );

  /* Two empty lists satisfy `selected.length === filtered.length`, so this box used to
     render checked with nothing in it. */
  const allSelected =
    filteredDeliverables.length > 0 &&
    filteredDeliverables.every((d: Deliverable) => selectedDeliverables.includes(d.id));

  if (loading) {
    return <Waiting lines={6} />;
  }

  return (
    <div className="flex flex-col gap-ds-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div className="flex flex-wrap items-center gap-ds-2">
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="IDEA">Idea</SelectItem>
              <SelectItem value="DRAFTING">Drafting</SelectItem>
              <SelectItem value="AWAITING_APPROVAL">Awaiting Approval</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="IN_PRODUCTION">In Production</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="READY_TO_POST">Ready to Post</SelectItem>
              <SelectItem value="POSTED">Posted</SelectItem>
            </SelectContent>
          </Select>

          {selectedDeliverables.length > 0 && isInternal && (
            <>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Bulk actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status_change">Change Status</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              {bulkAction === 'status_change' && (
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="New status" />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERABLE_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={handleBulkAction} size="sm">
                Apply to {selectedDeliverables.length}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                Clear
              </Button>
            </>
          )}
        </div>

        {isInternal && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create deliverable</DialogTitle>
                <DialogDescription>Add something to be made in this workstream.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-ds-4 py-ds-3">
                <div className="flex flex-col gap-ds-2">
                  <Label>Title</Label>
                  <Input
                    value={newDeliverable.title}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Product Showcase Reel"
                  />
                </div>
                <div className="flex flex-col gap-ds-2">
                  <Label>Type</Label>
                  <Select
                    value={newDeliverable.type}
                    onValueChange={(v: string) => setNewDeliverable(prev => ({ ...prev, type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="story_set">Story Set</SelectItem>
                      <SelectItem value="photo_set">Photo Set</SelectItem>
                      <SelectItem value="event_content">Event Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-ds-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newDeliverable.description}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-ds-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={newDeliverable.due_date}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDeliverable}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Assign Creator Dialog */}
      <Dialog open={!!assignTarget} onOpenChange={(open: boolean) => { if (!open) setAssignTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign creator</DialogTitle>
            <DialogDescription>
              {assignTarget ? `Link a creator to "${assignTarget.title}"` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-ds-4">
            <div className="flex flex-col gap-ds-2">
              <Label htmlFor="assign-username">Instagram username</Label>
              <Input
                id="assign-username"
                placeholder="@creator"
                value={assignUsername}
                onChange={(e) => setAssignUsername(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-ds-2">
              <Label htmlFor="assign-name">Display name</Label>
              <Input
                id="assign-name"
                placeholder="Creator full name (optional)"
                value={assignName}
                onChange={(e) => setAssignName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignTarget(null)} disabled={assignBusy}>Cancel</Button>
            <Button onClick={handleAssignCreator} disabled={assignBusy || !assignUsername.trim()}>
              {assignBusy ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliverables */}
      {loadError ? (
        <Failed
          what="The deliverables did not load"
          detail={`${loadError} Nothing has been deleted, we could not read this workstream.`}
          onRetry={loadDeliverables}
        />
      ) : filteredDeliverables.length === 0 ? (
        <Empty>
          {deliverables.length === 0
            ? 'Nothing has been added to this workstream yet.'
            : 'No deliverable matches this filter.'}
        </Empty>
      ) : (
        <Ledger>
          <thead>
            <tr className="border-b">
              {isInternal && (
                <th scope="col" className="w-10 px-ds-3 pb-ds-2 text-left">
                  <Checkbox
                    aria-label="Select every deliverable shown"
                    checked={allSelected}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        onSelectAll();
                      } else {
                        onClearSelection();
                      }
                    }}
                  />
                </th>
              )}
              {[
                { key: 'title', label: 'Deliverable', align: 'left' },
                { key: 'type', label: 'Type', align: 'left' },
                { key: 'status', label: 'Status', align: 'left' },
                { key: 'due', label: 'Due', align: 'right' },
                { key: 'creator', label: 'Creator', align: 'left' },
                { key: 'assets', label: 'Assets', align: 'left' },
              ].map(c => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-ds-3 pb-ds-2 text-ds-overline font-semibold uppercase text-muted-foreground ${
                    c.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {c.label}
                </th>
              ))}
              {/* Row actions (assign creator, delete) are internal-only. */}
              {isInternal && <th scope="col" className="w-10 px-ds-3 pb-ds-2" />}
            </tr>
          </thead>
          <tbody>
            {filteredDeliverables.map((deliverable) => (
              <tr key={deliverable.id} className="border-b border-border/70 last:border-b-0">
                {isInternal && (
                  <Cell className="w-10">
                    <Checkbox
                      aria-label={`Select ${deliverable.title}`}
                      checked={selectedDeliverables.includes(deliverable.id)}
                      onCheckedChange={() => onToggleSelection(deliverable.id)}
                    />
                  </Cell>
                )}
                <Cell>
                  <div className="flex flex-col gap-ds-1">
                    <span className="font-medium">{deliverable.title}</span>
                    {deliverable.description && (
                      <span className="line-clamp-1 text-ds-caption text-muted-foreground">
                        {deliverable.description}
                      </span>
                    )}
                  </div>
                </Cell>
                <Cell className="capitalize text-muted-foreground">{deliverable.type}</Cell>
                <Cell>
                  {isInternal ? (
                    <Select
                      value={deliverable.status}
                      onValueChange={(v: string) => handleRowStatus(deliverable.id, v)}
                    >
                      <SelectTrigger className="h-7 w-40 text-ds-caption" disabled={busyId === deliverable.id}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERABLE_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value} className="text-ds-caption">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <State tone={STATUS_TONE[deliverable.status] || 'neutral'}>
                      <span className="capitalize">{say(deliverable.status)}</span>
                    </State>
                  )}
                </Cell>
                <Cell align="right"><DueDate due={deliverable.due_date} /></Cell>
                <Cell>
                  {deliverable.assignment_id
                    ? <State tone="neutral">Assigned</State>
                    : <span className="text-muted-foreground/70">Unassigned</span>}
                </Cell>
                <Cell>
                  <div className="flex items-center gap-ds-1">
                    {deliverable.assets?.frame_io_folder && (
                      <Link2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-label="Frame.io folder linked" />
                    )}
                    {deliverable.assets?.hd_updated && (
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-label="HD delivered" />
                    )}
                    {deliverable.posting_proof && (
                      <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-label="Posting proof" />
                    )}
                  </div>
                </Cell>
                {isInternal && (
                  <Cell className="w-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setAssignTarget(deliverable)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign creator
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={busyId === deliverable.id}
                          onClick={() => handleRowDelete(deliverable.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Cell>
                )}
              </tr>
            ))}
          </tbody>
        </Ledger>
      )}
    </div>
  );
};

// ── Concepts ─────────────────────────────────────────────────────────────────────────────

const CONCEPT_TONE: Record<string, StateTone> = {
  NOT_SENT: 'neutral',
  SENT_TO_CLIENT: 'info',
  APPROVED: 'good',
  CHANGES_REQUESTED: 'warn',
};

const ConceptsTab = ({ workstreamId, isInternal, isClient }: any) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ConceptApprovalStatus | 'all'>('all');
  const [newConcept, setNewConcept] = useState({ title: '', hook: '', script: '' });
  const [creatingConcept, setCreatingConcept] = useState(false);

  const handleCreateConcept = async () => {
    if (!newConcept.title.trim()) {
      toast.error('Please enter a concept title');
      return;
    }
    setCreatingConcept(true);
    try {
      await operationsApi.createConcept(workstreamId, {
        title: newConcept.title,
        hook: newConcept.hook || undefined,
        script: newConcept.script || undefined,
      } as any);
      setEditDialogOpen(false);
      setNewConcept({ title: '', hook: '', script: '' });
      loadConcepts();
      toast.success('Concept created');
    } catch {
      toast.error('Failed to create concept');
    } finally {
      setCreatingConcept(false);
    }
  };

  useEffect(() => {
    loadConcepts();
  }, [workstreamId]);

  const loadConcepts = async () => {
    setLoading(true);
    try {
      const data = await operationsApi.getConcepts(workstreamId);
      setConcepts(data.concepts || []);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error?.message || 'The concepts could not be read.');
      toast.error('Failed to load concepts');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (conceptId: string, decision: 'approve' | 'request_changes') => {
    try {
      await operationsApi.approveOrRejectConcept(conceptId, decision);
      loadConcepts();
      toast.success(decision === 'approve' ? 'Concept approved' : 'Changes requested');
    } catch (error) {
      toast.error('Failed to update approval');
    }
  };

  if (loading) {
    return <Waiting lines={4} />;
  }

  const filteredConcepts = concepts.filter(c =>
    filterStatus === 'all' || c.approval_status === filterStatus
  );

  return (
    <div className="flex flex-col gap-ds-4">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Concepts</SelectItem>
            <SelectItem value="NOT_SENT">Not Sent</SelectItem>
            <SelectItem value="SENT_TO_CLIENT">Sent to Client</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="CHANGES_REQUESTED">Changes Requested</SelectItem>
          </SelectContent>
        </Select>

        {isInternal && (
          <Button onClick={() => { setSelectedConcept(null); setEditDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Concept
          </Button>
        )}
      </div>

      {loadError ? (
        <Failed
          what="The concepts did not load"
          detail={`${loadError} Any concepts already written are still there.`}
          onRetry={loadConcepts}
        />
      ) : filteredConcepts.length === 0 ? (
        <Empty>
          {concepts.length === 0
            ? 'No concepts have been written for this workstream yet.'
            : 'No concept is at that stage.'}
        </Empty>
      ) : (
        <div className="flex flex-col gap-ds-3">
          {/* A concept is a real object: it gets written, sent, approved. It keeps its card,
              and the card keeps the 24px padding a card ships with. */}
          {filteredConcepts.map((concept) => (
            <article
              key={concept.id}
              className="flex flex-col gap-ds-4 rounded-ds-surface border border-border bg-card p-ds-4"
            >
              <div className="flex items-start justify-between gap-ds-3">
                <div className="min-w-0 flex flex-col gap-ds-1">
                  <h3 className="text-ds-subheading">{concept.title}</h3>
                  <p className="text-ds-caption text-muted-foreground">
                    {concept.deliverable_ids.length} deliverable(s) linked
                  </p>
                </div>
                <State tone={CONCEPT_TONE[concept.approval_status] || 'neutral'}>
                  <span className="capitalize">{say(concept.approval_status)}</span>
                </State>
              </div>

              <div className="flex flex-col gap-ds-3">
                {concept.hook && (
                  <div className="flex flex-col gap-ds-1">
                    <p className="text-ds-overline uppercase text-muted-foreground">Hook</p>
                    <p className="max-w-prose text-ds-body">{concept.hook}</p>
                  </div>
                )}
                {concept.script && (
                  <div className="flex flex-col gap-ds-1">
                    <p className="text-ds-overline uppercase text-muted-foreground">Script</p>
                    <p className="max-w-prose whitespace-pre-wrap text-ds-body text-muted-foreground">
                      {concept.script}
                    </p>
                  </div>
                )}
                {concept.key_messages && concept.key_messages.length > 0 && (
                  <div className="flex flex-col gap-ds-1">
                    <p className="text-ds-overline uppercase text-muted-foreground">Key messages</p>
                    <ul className="max-w-prose list-inside list-disc text-ds-body text-muted-foreground">
                      {concept.key_messages.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {concept.comments && concept.comments.length > 0 && (
                <div className="flex flex-col gap-ds-2">
                  <p className="text-ds-overline uppercase text-muted-foreground">Comments</p>
                  <div className="flex flex-col">
                    {concept.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex flex-col gap-ds-1 border-b border-border/70 py-ds-2 last:border-b-0"
                      >
                        <p className="text-ds-label">{comment.user_name}</p>
                        <p className="max-w-prose text-ds-body text-muted-foreground">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-ds-2">
                {(isClient || isInternal) && concept.approval_status === 'SENT_TO_CLIENT' && (
                  <>
                    <Button
                      onClick={() => handleApproval(concept.id, 'approve')}
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleApproval(concept.id, 'request_changes')}
                      size="sm"
                      variant="outline"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                  </>
                )}
                {isInternal && (
                  <Button
                    onClick={() => {
                      setSelectedConcept(concept);
                      setEditDialogOpen(true);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    View
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / view concept dialog (no update endpoint yet → existing concepts are read-only) */}
      <Dialog open={editDialogOpen} onOpenChange={(o: boolean) => { setEditDialogOpen(o); if (!o) setSelectedConcept(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedConcept ? 'Concept' : 'Create concept'}</DialogTitle>
            <DialogDescription>
              {selectedConcept ? 'Read only for now, editing is not built yet.' : 'Add a creative concept for client approval.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-ds-4 py-ds-2">
            <div className="flex flex-col gap-ds-2">
              <Label>Title</Label>
              <Input
                value={selectedConcept ? selectedConcept.title : newConcept.title}
                disabled={!!selectedConcept}
                onChange={(e) => setNewConcept(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Unboxing hook + product demo"
              />
            </div>
            <div className="flex flex-col gap-ds-2">
              <Label>Hook</Label>
              <Textarea
                value={selectedConcept ? (selectedConcept.hook || '') : newConcept.hook}
                disabled={!!selectedConcept}
                onChange={(e) => setNewConcept(p => ({ ...p, hook: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-ds-2">
              <Label>Script</Label>
              <Textarea
                value={selectedConcept ? (selectedConcept.script || '') : newConcept.script}
                disabled={!!selectedConcept}
                onChange={(e) => setNewConcept(p => ({ ...p, script: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditDialogOpen(false); setSelectedConcept(null); }}>Close</Button>
            {!selectedConcept && (
              <Button onClick={handleCreateConcept} disabled={creatingConcept}>
                {creatingConcept ? 'Creating…' : 'Create concept'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── The page ─────────────────────────────────────────────────────────────────────────────

export default function WorkstreamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const workstreamId = params.workstreamId as string;

  const {
    currentCampaign,
    currentWorkstream,
    selectedDeliverables,
    selectCampaign,
    selectWorkstream,
    toggleDeliverableSelection,
    selectAllDeliverables,
    clearDeliverableSelection,
    uiState,
    userAccess,
    loadErrors,
  } = useOperations();

  const [activeTab, setActiveTab] = useState('deliverables');

  useEffect(() => {
    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
    if (workstreamId) {
      selectWorkstream(workstreamId);
    }
  }, [campaignId, workstreamId]);

  const isInternal = userAccess.permissions.view_internal_notes;
  const isClient = userAccess.role === 'client' || userAccess.role === 'brand';

  // Per-type production tab: shoots (video/photo), events (activation), payouts (paid).
  const wsType = currentWorkstream?.type;
  // Payouts are what we pay creators — cost. Brand-side users never see cost, and the
  // /payouts endpoints are superadmin-only anyway, so the tab would only ever 403 for them.
  const prodMode: 'shoots' | 'events' | 'payouts' | null =
    wsType === 'video_shoot' || wsType === 'photo_shoot' ? 'shoots'
    : wsType === 'event_activation' ? 'events'
    : wsType === 'influencer_paid' ? (isInternal ? 'payouts' : null)
    : null;
  const prodLabel = prodMode === 'shoots' ? 'Shoots' : prodMode === 'events' ? 'Events' : prodMode === 'payouts' ? 'Payouts' : '';

  const failed = loadErrors.workstream || loadErrors.campaign;

  /* A workstream that failed to read used to sit under skeletons forever, because the
     guard was `isLoading || !currentWorkstream` and nothing ever set the second one. */
  if (!currentWorkstream && failed) {
    return (
      <Page width="form">
        <Failed
          what="This workstream did not load"
          detail={`${failed} It has not been removed, we could not read it just now.`}
          onRetry={() => { selectCampaign(campaignId); selectWorkstream(workstreamId); }}
        />
      </Page>
    );
  }

  if (uiState.isLoading || !currentWorkstream) {
    return (
      <Page>
        <Sections>
          <Waiting lines={2} />
          <Waiting lines={8} />
        </Sections>
      </Page>
    );
  }

  return (
    <Page>
      <Sections>
        <PageHead
          back={
            <div className="flex flex-wrap items-center gap-ds-1 text-ds-caption text-muted-foreground">
              <button
                onClick={() => router.push(`/ops/campaigns/${campaignId}`)}
                className="hover:text-foreground"
              >
                {currentCampaign?.campaign_name || 'Campaign'}
              </button>
              <ChevronRight className="h-3.5 w-3.5" />
              <button
                onClick={() => router.push(`/ops/campaigns/${campaignId}/workstreams`)}
                className="hover:text-foreground"
              >
                Workstreams
              </button>
            </div>
          }
          title={currentWorkstream.name}
          sub={currentWorkstream.description || 'Deliverables and production for this workstream.'}
        />

        <Group>
          <SectionHead title="Progress" />
          <div className="flex flex-col gap-ds-3">
            <div className="flex items-baseline justify-between gap-ds-3">
              <span className="text-ds-label tabular-nums">
                {currentWorkstream.completion_percentage == null
                  ? DASH
                  : `${currentWorkstream.completion_percentage}%`} complete
              </span>
              <span className="flex items-center gap-ds-4 text-ds-caption text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground tabular-nums">
                    {currentWorkstream.deliverables_count ?? DASH}
                  </span>{' '}
                  deliverables
                </span>
                {(currentWorkstream.pending_approvals ?? 0) > 0 && (
                  <span>
                    <span className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                      {currentWorkstream.pending_approvals}
                    </span>{' '}
                    pending approval
                  </span>
                )}
              </span>
            </div>
            <Progress value={currentWorkstream.completion_percentage ?? 0} className="h-2" />
          </div>
        </Group>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${prodMode ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="concepts">Concepts</TabsTrigger>
            {prodMode && <TabsTrigger value="production">{prodLabel}</TabsTrigger>}
          </TabsList>

          <TabsContent value="deliverables" className="mt-ds-5">
            <DeliverablesTab
              workstreamId={workstreamId}
              isInternal={isInternal}
              selectedDeliverables={selectedDeliverables}
              onToggleSelection={toggleDeliverableSelection}
              onSelectAll={selectAllDeliverables}
              onClearSelection={clearDeliverableSelection}
            />
          </TabsContent>

          <TabsContent value="concepts" className="mt-ds-5">
            <ConceptsTab
              workstreamId={workstreamId}
              isInternal={isInternal}
              isClient={isClient}
            />
          </TabsContent>

          {prodMode && (
            <TabsContent value="production" className="mt-ds-5">
              <ProductionTab
                mode={prodMode}
                workstreamId={workstreamId}
                campaignId={campaignId}
                isInternal={isInternal}
              />
            </TabsContent>
          )}
        </Tabs>
      </Sections>
    </Page>
  );
}
