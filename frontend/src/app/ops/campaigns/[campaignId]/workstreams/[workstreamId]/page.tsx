/**
 * Operations OS - Workstream Detail Page
 * Complete workstream management with all tabs and functionality
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Plus,
  MoreVertical,
  ChevronRight,
  FileVideo,
  Edit,
  Trash,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Link2,
  Coins,
  Activity,
  Filter,
  Download,
  Upload,
  Copy,
  ExternalLink,
  Film,
  Camera,
  MessageSquare,
  RefreshCw,
  Package,
  Target,
  Users,
  Briefcase,
  Hash,
  Type,
  AlignLeft,
  LinkIcon,
  Key
} from 'lucide-react';
import {
  Deliverable,
  DeliverableStatus,
  Concept,
  ConceptApprovalStatus,
  ProductionBatch,
  Assignment,
  AssignmentStatus,
  WorkstreamType,
  ProductionChecklistStatus,
  ActivityEvent
} from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { useOperations } from '@/contexts/OperationsContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Component for Deliverables Tab
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState<Partial<Deliverable>>({
    title: '',
    type: 'video',
    status: 'IDEA',
    description: ''
  });
  const [bulkAction, setBulkAction] = useState('');
  const [filterStatus, setFilterStatus] = useState<DeliverableStatus | 'all'>('all');

  useEffect(() => {
    loadDeliverables();
  }, [workstreamId]);

  const loadDeliverables = async () => {
    setLoading(true);
    try {
      const data = await operationsApi.getDeliverables(workstreamId);
      setDeliverables(data.deliverables || []);
    } catch (error) {

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

    try {
      const results = await operationsApi.bulkUpdateDeliverables({
        type: bulkAction as any,
        target_ids: selectedDeliverables,
        params: {}
      });

      const successCount = results.filter(r => r.success).length;
      toast.success(`${successCount} deliverables updated`);
      loadDeliverables();
      onClearSelection();
    } catch (error) {
      toast.error('Bulk operation failed');
    }
  };

  const filteredDeliverables = deliverables.filter(d =>
    filterStatus === 'all' || d.status === filterStatus
  );

  const getStatusColor = (status: DeliverableStatus) => {
    const colors: Record<string, string> = {
      IDEA: 'bg-gray-100',
      DRAFTING: 'bg-blue-100',
      AWAITING_APPROVAL: 'bg-yellow-100',
      APPROVED: 'bg-green-100',
      IN_PRODUCTION: 'bg-purple-100',
      IN_REVIEW: 'bg-orange-100',
      REVISION_REQUIRED: 'bg-red-100',
      READY_TO_POST: 'bg-indigo-100',
      POSTED: 'bg-green-200',
      ARCHIVED: 'bg-gray-200'
    };
    return colors[status] || 'bg-gray-100';
  };

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Bulk actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status_change">Change Status</SelectItem>
                  <SelectItem value="assign_creator">Assign Creator</SelectItem>
                  <SelectItem value="schedule_batch">Schedule to Batch</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
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
                <DialogTitle>Create Deliverable</DialogTitle>
                <DialogDescription>Add a new deliverable to this workstream</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newDeliverable.title}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Product Showcase Reel"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newDeliverable.type}
                    onValueChange={(v) => setNewDeliverable(prev => ({ ...prev, type: v as any }))}
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
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newDeliverable.description}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newDeliverable.due_date}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDeliverable}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Deliverables Table */}
      {filteredDeliverables.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>No deliverables</AlertTitle>
          <AlertDescription>
            {deliverables.length === 0
              ? 'Create your first deliverable to get started'
              : 'No deliverables match your filter'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {isInternal && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDeliverables.length === filteredDeliverables.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectAll();
                        } else {
                          onClearSelection();
                        }
                      }}
                    />
                  </TableHead>
                )}
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliverables.map((deliverable) => (
                <TableRow key={deliverable.id}>
                  {isInternal && (
                    <TableCell>
                      <Checkbox
                        checked={selectedDeliverables.includes(deliverable.id)}
                        onCheckedChange={() => onToggleSelection(deliverable.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div>
                      <p>{deliverable.title}</p>
                      {deliverable.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {deliverable.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{deliverable.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(deliverable.status)}>
                      {deliverable.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {deliverable.due_date ? (
                      <span className={
                        new Date(deliverable.due_date) < new Date() ? 'text-red-600' : ''
                      }>
                        {format(new Date(deliverable.due_date), 'MMM d')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deliverable.assignment_id ? (
                      <Badge variant="secondary">Assigned</Badge>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {deliverable.assets?.frame_io_folder && (
                        <Link2 className="h-4 w-4 text-green-600" />
                      )}
                      {deliverable.assets?.hd_updated && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {deliverable.posting_proof && (
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Concept</DropdownMenuItem>
                        <DropdownMenuItem>Assign Creator</DropdownMenuItem>
                        <DropdownMenuItem>Add Assets</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// Component for Concepts Tab
const ConceptsTab = ({ workstreamId, isInternal, isClient }: any) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ConceptApprovalStatus | 'all'>('all');

  useEffect(() => {
    loadConcepts();
  }, [workstreamId]);

  const loadConcepts = async () => {
    setLoading(true);
    try {
      const data = await operationsApi.getConcepts(workstreamId);
      setConcepts(data.concepts || []);
    } catch (error) {
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
    return <Skeleton className="h-96" />;
  }

  const filteredConcepts = concepts.filter(c =>
    filterStatus === 'all' || c.approval_status === filterStatus
  );

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
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
          <Button onClick={() => setEditDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Concept
          </Button>
        )}
      </div>

      {/* Concepts Grid */}
      {filteredConcepts.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No concepts found</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {filteredConcepts.map((concept) => (
            <Card key={concept.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{concept.title}</CardTitle>
                    <CardDescription>
                      {concept.deliverable_ids.length} deliverable(s) linked
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      concept.approval_status === 'APPROVED' ? 'default' :
                      concept.approval_status === 'CHANGES_REQUESTED' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {concept.approval_status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Concept Details */}
                <div className="grid gap-3">
                  {concept.hook && (
                    <div>
                      <p className="text-sm font-medium mb-1">Hook</p>
                      <p className="text-sm text-muted-foreground">{concept.hook}</p>
                    </div>
                  )}
                  {concept.script && (
                    <div>
                      <p className="text-sm font-medium mb-1">Script</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {concept.script}
                      </p>
                    </div>
                  )}
                  {concept.key_messages && concept.key_messages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Key Messages</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {concept.key_messages.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  {(isClient || isInternal) && concept.approval_status === 'SENT_TO_CLIENT' && (
                    <>
                      <Button
                        onClick={() => handleApproval(concept.id, 'approve')}
                        size="sm"
                        variant="default"
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
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>

                {/* Comments */}
                {concept.comments && concept.comments.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Comments</p>
                    <div className="space-y-2">
                      {concept.comments.map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <p className="font-medium">{comment.user_name}</p>
                          <p className="text-muted-foreground">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Workstream Detail Page
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
    userAccess
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

  if (uiState.isLoading || !currentWorkstream) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <button
            onClick={() => router.push(`/ops/campaigns/${campaignId}`)}
            className="hover:underline"
          >
            {currentCampaign?.campaign_name}
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => router.push(`/ops/campaigns/${campaignId}/workstreams`)}
            className="hover:underline"
          >
            Workstreams
          </button>
          <ChevronRight className="h-4 w-4" />
          <span>{currentWorkstream.name}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{currentWorkstream.name}</h1>
        <p className="text-muted-foreground mt-1">
          {currentWorkstream.description || 'Manage deliverables and production'}
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Workstream Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentWorkstream.completion_percentage}% complete
            </span>
          </div>
          <Progress value={currentWorkstream.completion_percentage} className="h-2" />
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div>
              <span className="font-medium">{currentWorkstream.deliverables_count}</span>
              <span className="text-muted-foreground ml-1">deliverables</span>
            </div>
            {currentWorkstream.pending_approvals > 0 && (
              <div>
                <span className="font-medium text-yellow-600">
                  {currentWorkstream.pending_approvals}
                </span>
                <span className="text-muted-foreground ml-1">pending approval</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
        </TabsList>

        <TabsContent value="deliverables" className="mt-6">
          <DeliverablesTab
            workstreamId={workstreamId}
            isInternal={isInternal}
            selectedDeliverables={selectedDeliverables}
            onToggleSelection={toggleDeliverableSelection}
            onSelectAll={selectAllDeliverables}
            onClearSelection={clearDeliverableSelection}
          />
        </TabsContent>

        <TabsContent value="concepts" className="mt-6">
          <ConceptsTab
            workstreamId={workstreamId}
            isInternal={isInternal}
            isClient={isClient}
          />
        </TabsContent>

        {/* Production / Talent / Assets / Finance / Activity tabs removed in May 2026 audit —
            no backend implementation. */}
      </Tabs>
    </div>
  );
}