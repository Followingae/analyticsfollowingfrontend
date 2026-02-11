/**
 * Operations OS - Assets & Frame.io Management
 * Cross-workstream assets hub with Frame.io integration
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Link2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  Copy,
  Folder,
  Film,
  Image,
  FileVideo,
  Plus,
  Filter,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Clock,
  User,
  Package,
  PlayCircle,
  Share2,
  HardDrive,
  AlertTriangle,
  Search
} from 'lucide-react';
import { Deliverable, DeliverableAssets, WorkstreamType } from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { useOperations } from '@/contexts/OperationsContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AssetItem {
  deliverable_id: string;
  deliverable_title: string;
  workstream_id: string;
  workstream_name: string;
  workstream_type: WorkstreamType;
  creator_name?: string;
  assets: DeliverableAssets;
  status: 'missing' | 'partial' | 'complete' | 'hd_ready';
  last_updated?: string;
}

export default function AssetsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const {
    currentCampaign,
    workstreams,
    selectCampaign,
    uiState,
    userAccess
  } = useOperations();

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWorkstream, setFilterWorkstream] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState({
    frame_io_folder: '',
    frame_io_share_link: '',
    hd_updated: false
  });

  useEffect(() => {
    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
    loadAssets();
  }, [campaignId]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockAssets: AssetItem[] = [
        {
          deliverable_id: 'd1',
          deliverable_title: 'Product Showcase Reel',
          workstream_id: 'ws1',
          workstream_name: 'UGC Content',
          workstream_type: 'ugc',
          creator_name: '@creator1',
          assets: {
            frame_io_folder: 'https://app.frame.io/folder1',
            frame_io_share_link: 'https://app.frame.io/share1',
            hd_updated: true,
            hd_updated_at: '2025-01-15T10:00:00Z',
            versions: [
              {
                version: 'v1',
                url: 'https://app.frame.io/v1',
                uploaded_at: '2025-01-10T10:00:00Z',
                uploaded_by: 'editor1'
              },
              {
                version: 'v2',
                url: 'https://app.frame.io/v2',
                uploaded_at: '2025-01-14T10:00:00Z',
                uploaded_by: 'editor1',
                notes: 'Color correction applied'
              }
            ]
          },
          status: 'hd_ready',
          last_updated: '2025-01-15T10:00:00Z'
        },
        {
          deliverable_id: 'd2',
          deliverable_title: 'Behind the Scenes',
          workstream_id: 'ws1',
          workstream_name: 'UGC Content',
          workstream_type: 'ugc',
          creator_name: '@creator2',
          assets: {
            frame_io_folder: 'https://app.frame.io/folder2',
            hd_updated: false
          },
          status: 'partial',
          last_updated: '2025-01-14T10:00:00Z'
        },
        {
          deliverable_id: 'd3',
          deliverable_title: 'Event Coverage',
          workstream_id: 'ws2',
          workstream_name: 'Event Activation',
          workstream_type: 'event_activation',
          assets: {
            hd_updated: false
          },
          status: 'missing',
          last_updated: null
        }
      ];
      setAssets(mockAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!selectedDeliverable) return;

    try {
      await operationsApi.updateDeliverableAssets(selectedDeliverable, linkForm);
      toast.success('Assets updated');
      loadAssets();
      setAddLinkDialogOpen(false);
      setLinkForm({
        frame_io_folder: '',
        frame_io_share_link: '',
        hd_updated: false
      });
    } catch (error) {
      toast.error('Failed to update assets');
    }
  };

  const handleMarkHDUpdated = async (deliverableId: string) => {
    const notes = prompt('Add notes about HD update (optional):');
    try {
      await operationsApi.markHDUpdated(
        deliverableId,
        new Date().toISOString(),
        notes || undefined
      );
      toast.success('Marked as HD updated');
      loadAssets();
    } catch (error) {
      toast.error('Failed to update HD status');
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  };

  const openInFrameIO = (link: string) => {
    window.open(link, '_blank');
  };

  const isInternal = userAccess.permissions.view_internal_notes;

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    const matchesWorkstream = filterWorkstream === 'all' || asset.workstream_id === filterWorkstream;
    const matchesSearch = !searchTerm ||
      asset.deliverable_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesWorkstream && matchesSearch;
  });

  // Group assets by creator for better organization
  const assetsByCreator = filteredAssets.reduce((acc, asset) => {
    const creator = asset.creator_name || 'Unassigned';
    if (!acc[creator]) acc[creator] = [];
    acc[creator].push(asset);
    return acc;
  }, {} as Record<string, AssetItem[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hd_ready':
        return <Badge className="bg-green-100 text-green-800">HD Ready</Badge>;
      case 'complete':
        return <Badge className="bg-blue-100 text-blue-800">Complete</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'missing':
        return <Badge className="bg-red-100 text-red-800">Missing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
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
              {currentCampaign?.campaign_name}
            </button>
            <ChevronRight className="h-4 w-4" />
            <span>Assets</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Assets & Frame.io</h1>
          <p className="text-muted-foreground mt-1">
            Manage deliverable assets across all workstreams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAssets}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{assets.length}</p>
                <p className="text-xs text-muted-foreground">Total Deliverables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {assets.filter(a => a.status === 'hd_ready').length}
                </p>
                <p className="text-xs text-muted-foreground">HD Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {assets.filter(a => a.status === 'partial').length}
                </p>
                <p className="text-xs text-muted-foreground">Partial Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {assets.filter(a => a.status === 'missing').length}
                </p>
                <p className="text-xs text-muted-foreground">Missing Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                  placeholder="Search deliverables or creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="hd_ready">HD Ready</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterWorkstream} onValueChange={setFilterWorkstream}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by workstream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workstreams</SelectItem>
                {workstreams.map(ws => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets by View */}
      <Tabs defaultValue="by-creator">
        <TabsList>
          <TabsTrigger value="by-creator">By Creator</TabsTrigger>
          <TabsTrigger value="by-status">By Status</TabsTrigger>
          <TabsTrigger value="all">All Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="by-creator" className="mt-4 space-y-4">
          {Object.entries(assetsByCreator).map(([creator, creatorAssets]) => (
            <Card key={creator}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{creator}</CardTitle>
                    <Badge variant="secondary">{creatorAssets.length} deliverables</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInFrameIO(`https://app.frame.io/projects/${campaignId}/folders/${creator}`)}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Open Folder
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {creatorAssets.map(asset => (
                    <div
                      key={asset.deliverable_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileVideo className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{asset.deliverable_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.workstream_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(asset.status)}
                        <div className="flex items-center gap-1">
                          {asset.assets.frame_io_folder && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openInFrameIO(asset.assets.frame_io_folder!)}
                            >
                              <Folder className="h-4 w-4" />
                            </Button>
                          )}
                          {asset.assets.frame_io_share_link && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyLink(asset.assets.frame_io_share_link!)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          )}
                          {asset.assets.hd_updated && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        {isInternal && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedDeliverable(asset.deliverable_id);
                                  setAddLinkDialogOpen(true);
                                }}
                              >
                                <Link2 className="h-4 w-4 mr-2" />
                                Add/Edit Links
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMarkHDUpdated(asset.deliverable_id)}
                              >
                                <HardDrive className="h-4 w-4 mr-2" />
                                Mark HD Updated
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="by-status" className="mt-4 space-y-4">
          {['hd_ready', 'complete', 'partial', 'missing'].map(status => {
            const statusAssets = filteredAssets.filter(a => a.status === status);
            if (statusAssets.length === 0) return null;

            return (
              <Card key={status}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {status.replace('_', ' ')}
                    </CardTitle>
                    <Badge variant="secondary">{statusAssets.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statusAssets.map(asset => (
                      <div
                        key={asset.deliverable_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{asset.deliverable_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.creator_name} • {asset.workstream_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {asset.assets.frame_io_folder && (
                            <Link2 className="h-4 w-4 text-blue-600" />
                          )}
                          {asset.assets.hd_updated && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isInternal && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedAssets.length === filteredAssets.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAssets(filteredAssets.map(a => a.deliverable_id));
                              } else {
                                setSelectedAssets([]);
                              }
                            }}
                          />
                        </TableHead>
                      )}
                      <TableHead>Deliverable</TableHead>
                      <TableHead>Workstream</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assets</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map(asset => (
                      <TableRow key={asset.deliverable_id}>
                        {isInternal && (
                          <TableCell>
                            <Checkbox
                              checked={selectedAssets.includes(asset.deliverable_id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAssets(prev => [...prev, asset.deliverable_id]);
                                } else {
                                  setSelectedAssets(prev =>
                                    prev.filter(id => id !== asset.deliverable_id)
                                  );
                                }
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {asset.deliverable_title}
                        </TableCell>
                        <TableCell>{asset.workstream_name}</TableCell>
                        <TableCell>{asset.creator_name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {asset.assets.frame_io_folder && (
                              <Folder className="h-4 w-4 text-blue-600" />
                            )}
                            {asset.assets.frame_io_share_link && (
                              <Share2 className="h-4 w-4 text-blue-600" />
                            )}
                            {asset.assets.hd_updated && (
                              <HardDrive className="h-4 w-4 text-green-600" />
                            )}
                            {asset.assets.versions && asset.assets.versions.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                v{asset.assets.versions.length}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {asset.last_updated ? (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(asset.last_updated), 'MMM d, h:mm a')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (asset.assets.frame_io_folder) {
                                openInFrameIO(asset.assets.frame_io_folder);
                              }
                            }}
                            disabled={!asset.assets.frame_io_folder}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Link Dialog */}
      <Dialog open={addLinkDialogOpen} onOpenChange={setAddLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add/Edit Asset Links</DialogTitle>
            <DialogDescription>
              Add Frame.io links and update HD status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Frame.io Folder Link</Label>
              <Input
                value={linkForm.frame_io_folder}
                onChange={(e) => setLinkForm(prev => ({
                  ...prev,
                  frame_io_folder: e.target.value
                }))}
                placeholder="https://app.frame.io/..."
              />
            </div>
            <div>
              <Label>Frame.io Share Link</Label>
              <Input
                value={linkForm.frame_io_share_link}
                onChange={(e) => setLinkForm(prev => ({
                  ...prev,
                  frame_io_share_link: e.target.value
                }))}
                placeholder="https://app.frame.io/share/..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hd-updated"
                checked={linkForm.hd_updated}
                onCheckedChange={(checked) => setLinkForm(prev => ({
                  ...prev,
                  hd_updated: checked as boolean
                }))}
              />
              <Label htmlFor="hd-updated">HD files have been updated</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLink}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Frame.io Quick Links</CardTitle>
          <CardDescription>Quick access to Frame.io project structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              onClick={() => openInFrameIO(`https://app.frame.io/projects/${campaignId}`)}
            >
              <Folder className="h-4 w-4 mr-2" />
              Campaign Project
            </Button>
            {workstreams.map(ws => (
              <Button
                key={ws.id}
                variant="outline"
                onClick={() => openInFrameIO(`https://app.frame.io/projects/${campaignId}/workstreams/${ws.id}`)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {ws.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}