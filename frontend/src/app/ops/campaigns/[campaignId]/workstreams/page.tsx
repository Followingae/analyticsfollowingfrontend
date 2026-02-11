/**
 * Operations OS - Workstreams Management Page
 * Manage and organize campaign workstreams by type
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOperations } from '@/contexts/OperationsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Plus,
  Package,
  Video,
  Camera,
  Calendar,
  Users,
  DollarSign,
  Gift,
  Layers,
  ChevronRight,
  AlertCircle,
  Target,
  Clock,
  CheckCircle2,
  Archive
} from 'lucide-react';
import { WorkstreamType, Workstream } from '@/types/operations';
import { toast } from 'sonner';

const WORKSTREAM_ICONS: Record<WorkstreamType, any> = {
  ugc: Video,
  influencer_paid: DollarSign,
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
    userAccess
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
      console.error('Failed to create workstream:', error);
    } finally {
      setCreating(false);
    }
  };

  const navigateToWorkstream = (workstreamId: string) => {
    router.push(`/ops/campaigns/${campaignId}/workstreams/${workstreamId}`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      draft: { variant: 'secondary', icon: Clock },
      active: { variant: 'default', icon: CheckCircle2 },
      completed: { variant: 'outline', icon: CheckCircle2 },
      archived: { variant: 'secondary', icon: Archive }
    };

    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (uiState.isLoading && workstreams.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button
              onClick={() => router.push(`/ops/campaigns/${campaignId}`)}
              className="hover:underline"
            >
              {currentCampaign?.campaign_name || 'Campaign'}
            </button>
            <ChevronRight className="h-4 w-4" />
            <span>Workstreams</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Workstreams</h1>
          <p className="text-muted-foreground mt-1">
            Organize deliverables by execution type
          </p>
        </div>
        <div className="flex items-center gap-2">
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
                  <DialogTitle>Create Workstream</DialogTitle>
                  <DialogDescription>
                    Create a new workstream to organize deliverables
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newWorkstream.type}
                      onValueChange={(value) => setNewWorkstream(prev => ({
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
                  </div>
                  <div>
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
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
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
                  <div>
                    <Label htmlFor="status">Initial Status</Label>
                    <Select
                      value={newWorkstream.status}
                      onValueChange={(value) => setNewWorkstream(prev => ({
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWorkstream} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Workstream'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All Types
              {filterType === 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {workstreams.length}
                </Badge>
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
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workstreams Grid */}
      {filteredWorkstreams.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <Package className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">No workstreams found</h3>
              <p className="text-sm text-muted-foreground">
                {workstreams.length === 0
                  ? 'Create your first workstream to organize deliverables'
                  : 'No workstreams match your current filter'}
              </p>
              {canCreate && workstreams.length === 0 && (
                <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Workstream
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkstreams.map((workstream) => {
            const Icon = WORKSTREAM_ICONS[workstream.type];
            return (
              <Card
                key={workstream.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigateToWorkstream(workstream.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workstream.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {WORKSTREAM_LABELS[workstream.type]}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(workstream.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {workstream.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {workstream.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{workstream.completion_percentage}%</span>
                    </div>
                    <Progress value={workstream.completion_percentage} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Deliverables</p>
                      <p className="font-semibold">{workstream.deliverables_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending</p>
                      <p className="font-semibold text-yellow-600">
                        {workstream.pending_approvals}
                      </p>
                    </div>
                  </div>

                  {/* Next Milestone */}
                  {workstream.next_milestone && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div className="text-xs">
                          <p className="font-medium">
                            Next: {workstream.next_milestone.description}
                          </p>
                          <p className="text-muted-foreground">
                            {new Date(workstream.next_milestone.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hybrid Badge */}
                  {workstream.type === 'hybrid' && (
                    <Alert className="mt-4">
                      <Layers className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Contains multiple execution types
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {workstreams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold">{workstreams.length}</p>
                <p className="text-sm text-muted-foreground">Total Workstreams</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {workstreams.reduce((sum, ws) => sum + ws.deliverables_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Deliverables</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {workstreams.reduce((sum, ws) => sum + ws.pending_approvals, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(
                    workstreams.reduce((sum, ws) => sum + ws.completion_percentage, 0) /
                    workstreams.length
                  )}%
                </p>
                <p className="text-sm text-muted-foreground">Average Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}