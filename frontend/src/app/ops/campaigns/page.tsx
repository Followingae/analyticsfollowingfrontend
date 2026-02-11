/**
 * Operations OS - Campaigns List Page
 * Entry point to operations management system
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOperations } from '@/contexts/OperationsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Filter,
  RefreshCcw,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';

export default function OperationsCampaignsPage() {
  const router = useRouter();
  const { campaigns, loadCampaigns, uiState, userAccess } = useOperations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    loadCampaigns().finally(() => setIsInitialLoad(false));
  }, [loadCampaigns]);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      planning: { variant: 'secondary', icon: Calendar },
      active: { variant: 'default', icon: CheckCircle },
      completed: { variant: 'outline', icon: CheckCircle },
      archived: { variant: 'secondary', icon: Clock }
    };

    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const navigateToCampaign = (campaignId: string) => {
    router.push(`/ops/campaigns/${campaignId}`);
  };

  if (isInitialLoad && uiState.isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
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
          <h1 className="text-3xl font-bold tracking-tight">Operations OS</h1>
          <p className="text-muted-foreground mt-1">
            Campaign execution and deliverables management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {userAccess.viewMode === 'internal' ? 'Internal View' : 'Client View'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCampaigns()}
            disabled={uiState.isLoading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${uiState.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaigns</CardTitle>
          <CardDescription>
            Select a campaign to manage workstreams and deliverables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
              <Input
                placeholder="Search campaigns or brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Table */}
          {filteredCampaigns.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {campaigns.length === 0
                  ? 'No campaigns available. Contact your administrator to get started.'
                  : 'No campaigns match your search criteria.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Deliverables</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Overdue</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigateToCampaign(campaign.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {campaign.campaign_name}
                        </div>
                      </TableCell>
                      <TableCell>{campaign.brand_name}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {(campaign as any).total_deliverables || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {(campaign as any).pending_approvals > 0 && (
                          <Badge variant="outline" className="bg-yellow-50">
                            {(campaign as any).pending_approvals}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {(campaign as any).overdue_posts > 0 && (
                          <Badge variant="destructive">
                            {(campaign as any).overdue_posts}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(campaign.start_date), 'MMM d')} -{' '}
                        {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Quick Stats */}
          {campaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{campaigns.length}</div>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {campaigns.filter(c => c.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Active Campaigns</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + ((c as any).total_deliverables || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Deliverables</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + ((c as any).pending_approvals || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending Approvals</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}