/**
 * Operations OS - Global Deliverables Page
 * Cross-workstream deliverables management
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
  FileVideo,
  Filter,
  Search,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Package,
  Download,
  BarChart3
} from 'lucide-react';
import { Deliverable, DeliverableStatus, WorkstreamType } from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { useOperations } from '@/contexts/OperationsContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GlobalDeliverablesPage() {
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

  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<DeliverableStatus | 'all'>('all');
  const [filterWorkstream, setFilterWorkstream] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);

  useEffect(() => {
    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
    loadAllDeliverables();
  }, [campaignId]);

  const loadAllDeliverables = async () => {
    setLoading(true);
    try {
      // Load deliverables from all workstreams
      const allDeliverables: Deliverable[] = [];
      for (const ws of workstreams) {
        const data = await operationsApi.getDeliverables(ws.id);
        allDeliverables.push(...(data.deliverables || []));
      }
      setDeliverables(allDeliverables);
    } catch (error) {
      toast.error('Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliverables = deliverables.filter(d => {
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchesWorkstream = filterWorkstream === 'all' || d.workstream_id === filterWorkstream;
    const matchesSearch = !searchTerm ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesWorkstream && matchesSearch;
  });

  const statusCounts = deliverables.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: DeliverableStatus) => {
    const colors: Record<string, string> = {
      IDEA: 'bg-gray-100',
      DRAFTING: 'bg-blue-100',
      AWAITING_APPROVAL: 'bg-yellow-100',
      APPROVED: 'bg-green-100',
      IN_PRODUCTION: 'bg-purple-100',
      POSTED: 'bg-green-200'
    };
    return colors[status] || 'bg-gray-100';
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
            <span>All Deliverables</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">All Deliverables</h1>
          <p className="text-muted-foreground mt-1">
            Manage deliverables across all workstreams
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status} className="cursor-pointer hover:shadow-md">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">
                  {status.replace('_', ' ')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                  placeholder="Search deliverables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.keys(statusCounts).map(status => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
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

      {/* Deliverables Table */}
      {filteredDeliverables.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            No deliverables found matching your filters
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Workstream</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliverables.map(deliverable => {
                    const ws = workstreams.find(w => w.id === deliverable.workstream_id);
                    return (
                      <TableRow
                        key={deliverable.id}
                        className="cursor-pointer"
                        onClick={() => router.push(
                          `/ops/campaigns/${campaignId}/workstreams/${deliverable.workstream_id}`
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedDeliverables.includes(deliverable.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDeliverables(prev => [...prev, deliverable.id]);
                              } else {
                                setSelectedDeliverables(prev =>
                                  prev.filter(id => id !== deliverable.id)
                                );
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {deliverable.title}
                        </TableCell>
                        <TableCell>
                          {ws?.name || 'Unknown'}
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
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {deliverable.assignment_id ? (
                            <Badge variant="secondary">Assigned</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{deliverable.type}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}