'use client'
import { tokenManager } from '@/utils/tokenManager';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, Building2, Coins, FileText, Users, Video,
  Calendar, Activity, TrendingUp, AlertCircle, CheckCircle2,
  Clock, XCircle, ChevronRight
} from 'lucide-react';
import { clientApi, type ScopeCampaign, type FinanceSummary } from '@/services/clientManagementApi';

const formatAED = (amount: number | null) => {
  if (!amount) return 'AED 0';
  return `AED ${Number(amount).toLocaleString('en-AE', { minimumFractionDigits: 0 })}`;
};

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    completed: { variant: 'secondary', label: 'Complete' },
    draft: { variant: 'outline', label: 'Draft' },
    paused: { variant: 'outline', label: 'Paused' },
    archived: { variant: 'secondary', label: 'Archived' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
    planning: { variant: 'outline', label: 'Planning' },
  };
  const m = map[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

const paymentBadge = (status: string) => {
  switch (status) {
    case 'complete': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Paid</Badge>;
    case 'partial': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Partial</Badge>;
    case 'not_paid': return <Badge variant="destructive">Unpaid</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const reportBadge = (status: string) => {
  switch (status) {
    case 'received': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Received</Badge>;
    case 'sent': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Sent</Badge>;
    case 'not_sent': return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Not Sent</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const typeBadge = (type: string) => {
  const colors: Record<string, string> = {
    influencer: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    ugc: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    cashback: 'bg-green-500/10 text-green-600 border-green-500/20',
    paid_deal: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    barter: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  };
  return <Badge className={colors[type] || ''}>{type.replace('_', ' ')}</Badge>;
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [client, setClient] = useState<any>(null);
  const [scope, setScope] = useState<ScopeCampaign[]>([]);
  const [scopeSummary, setScopeSummary] = useState<any>({});
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [ugcData, setUgcData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scope');
  const [scopeYear, setScopeYear] = useState<string>('all');

  useEffect(() => {
    if (!teamId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [detailRes, scopeRes, financeRes] = await Promise.all([
          clientApi.getDetail(teamId),
          clientApi.getScope(teamId, scopeYear && scopeYear !== 'all' ? parseInt(scopeYear) : undefined),
          clientApi.getFinance(teamId),
        ]);
        setClient(detailRes.data);
        setScope(scopeRes.data || []);
        setScopeSummary(scopeRes.summary || {});
        setFinance(financeRes.data || null);
      } catch (err) {
        console.error('Failed to load client:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, scopeYear]);

  const loadTabData = async (tab: string) => {
    setActiveTab(tab);
    if (tab === 'ugc' && !ugcData) {
      try {
        const res = await clientApi.getUgc(teamId);
        setUgcData(res.data);
      } catch (err) { console.error(err); }
    }
    if (tab === 'barter' && events.length === 0) {
      try {
        const res = await clientApi.getEvents(teamId);
        setEvents(res.data || []);
      } catch (err) { console.error(err); }
    }
    if (tab === 'activity' && activity.length === 0) {
      try {
        const res = await clientApi.getActivity(teamId, 100);
        setActivity(res.data || []);
      } catch (err) { console.error(err); }
    }
  };

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="flex-1 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </SuperadminLayout>
    );
  }

  if (!client) {
    return (
      <SuperadminLayout>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-muted-foreground">Client not found</p>
        </div>
      </SuperadminLayout>
    );
  }

  return (
    <SuperadminLayout><div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/superadmin/clients')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-16 w-16 border-2 border-border">
          <AvatarImage src={client.logo_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {(client.company_name || client.name || '?').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{client.company_name || client.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{client.subscription_tier}</Badge>
            {client.industry && <Badge variant="secondary">{client.industry}</Badge>}
            <span className="text-sm text-muted-foreground">
              {client.total_campaigns} campaigns
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold">{formatAED(client.total_budget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">{formatAED(client.total_spent)}</p>
            {client.total_budget > 0 && (
              <Progress value={(client.total_spent / client.total_budget) * 100} className="mt-2 h-1.5" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Campaigns</p>
            <p className="text-2xl font-bold">{client.active_campaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-destructive">
              {formatAED(finance?.outstanding_amount || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={loadTabData}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="scope"><FileText className="mr-1.5 h-3.5 w-3.5" />Scope</TabsTrigger>
          <TabsTrigger value="campaigns"><Building2 className="mr-1.5 h-3.5 w-3.5" />Campaigns</TabsTrigger>
          <TabsTrigger value="proposals"><Users className="mr-1.5 h-3.5 w-3.5" />Proposals</TabsTrigger>
          <TabsTrigger value="barter"><Calendar className="mr-1.5 h-3.5 w-3.5" />Barter & Events</TabsTrigger>
          <TabsTrigger value="ugc"><Video className="mr-1.5 h-3.5 w-3.5" />UGC</TabsTrigger>
          <TabsTrigger value="finance"><TrendingUp className="mr-1.5 h-3.5 w-3.5" />Finance</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="mr-1.5 h-3.5 w-3.5" />Activity</TabsTrigger>
        </TabsList>

        {/* SCOPE TAB — The "All Scope" spreadsheet replacement */}
        <TabsContent value="scope" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Project Scope</h2>
              <Badge variant="outline">{scope.length} projects</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select value={scopeYear} onValueChange={setScopeYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const token = (tokenManager.getTokenSync() || localStorage.getItem('access_token'));
                  const yearParam = scopeYear && scopeYear !== 'all' ? `?year=${scopeYear}` : '';
                  window.open(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/admin/clients/${teamId}/export${yearParam}`,
                    '_blank'
                  );
                }}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Export Excel
              </Button>
            </div>
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-5 gap-3">
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="font-bold">{scopeSummary.total_campaigns || 0}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="font-bold text-blue-600">{scopeSummary.active_count || 0}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Complete</p><p className="font-bold text-emerald-600">{scopeSummary.complete_count || 0}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Budget</p><p className="font-bold">{formatAED(scopeSummary.total_budget || 0)}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Unpaid</p><p className="font-bold text-destructive">{scopeSummary.not_paid_count || 0}</p></CardContent></Card>
          </div>

          {/* Scope Table */}
          <Card>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Project Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Creators</TableHead>
                    <TableHead className="text-right">Posts</TableHead>
                    <TableHead>Carry Fwd</TableHead>
                    <TableHead>Report</TableHead>
                    <TableHead className="min-w-[200px]">Client Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scope.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No campaigns found for this client
                      </TableCell>
                    </TableRow>
                  ) : (
                    scope.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/campaigns/${c.id}`)}
                      >
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{typeBadge(c.campaign_type)}</TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                        <TableCell className="text-right font-mono">{formatAED(c.budget)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={c.payment_status}
                            onValueChange={async (val) => {
                              try {
                                await clientApi.updateScope(teamId, c.id, { payment_status: val });
                                setScope(prev => prev.map(s => s.id === c.id ? { ...s, payment_status: val } : s));
                              } catch (err) { console.error(err); }
                            }}
                          >
                            <SelectTrigger className="h-7 w-[100px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_paid">Unpaid</SelectItem>
                              <SelectItem value="partial">Partial</SelectItem>
                              <SelectItem value="complete">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">{c.total_creators}</TableCell>
                        <TableCell className="text-right">{c.total_posts}</TableCell>
                        <TableCell>
                          {c.carried_forward_count > 0 ? (
                            <Badge variant="secondary">{c.carried_forward_count} fwd</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={c.report_status}
                            onValueChange={async (val) => {
                              try {
                                await clientApi.updateScope(teamId, c.id, { report_status: val });
                                setScope(prev => prev.map(s => s.id === c.id ? { ...s, report_status: val } : s));
                              } catch (err) { console.error(err); }
                            }}
                          >
                            <SelectTrigger className="h-7 w-[100px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_sent">Not Sent</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="received">Received</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {c.client_feedback || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="space-y-4">
          <h2 className="text-lg font-semibold">All Campaigns</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scope.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/campaigns/${c.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {typeBadge(c.campaign_type)}
                    {statusBadge(c.status)}
                  </div>
                  <h3 className="font-semibold truncate">{c.name}</h3>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{c.total_creators} creators</span>
                    <span>{formatAED(c.budget)}</span>
                  </div>
                  {c.budget && c.spent ? (
                    <Progress value={(Number(c.spent) / Number(c.budget)) * 100} className="mt-2 h-1.5" />
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PROPOSALS TAB */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Proposals</h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/superadmin/proposals/create')}>
              Create Proposal
            </Button>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-muted-foreground">
                View all proposals for this client at{' '}
                <span
                  className="text-primary cursor-pointer hover:underline"
                  onClick={() => router.push('/superadmin/proposals')}
                >
                  Proposals Management
                </span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BARTER & EVENTS TAB */}
        <TabsContent value="barter" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Barter & Events</h2>
            <Badge variant="outline">{events.length} events</Badge>
          </div>
          {events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-muted-foreground">No events yet. Create events from the Operations module.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Barter</TableHead>
                      <TableHead className="text-right">Inventory</TableHead>
                      <TableHead className="text-right">Allocated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap">{e.date ? new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}</TableCell>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell><Badge variant="secondary">{e.event_category || e.type || '-'}</Badge></TableCell>
                        <TableCell>{e.event_genre || '-'}</TableCell>
                        <TableCell>{statusBadge(e.status)}</TableCell>
                        <TableCell><Badge variant="outline">{e.barter_type || '-'}</Badge></TableCell>
                        <TableCell className="text-right">{e.barter_inventory || 0}</TableCell>
                        <TableCell className="text-right">{e.barter_allocated || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>

        {/* UGC TAB */}
        <TabsContent value="ugc" className="space-y-4">
          <h2 className="text-lg font-semibold">UGC Overview</h2>
          {ugcData ? (
            <>
              {/* UGC Summary Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Concepts</p><p className="font-bold">{ugcData.summary.total_concepts}</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Consumed</p><p className="font-bold text-emerald-600">{ugcData.summary.consumed_concepts}</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Videos</p><p className="font-bold">{ugcData.summary.total_videos}</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Ready</p><p className="font-bold text-blue-600">{ugcData.summary.ready_videos}</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Budget Used</p><p className="font-bold">{formatAED(ugcData.summary.total_budget_consumed)}</p></CardContent></Card>
              </div>

              {/* Concepts Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Concepts</CardTitle>
                </CardHeader>
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Concept</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ugcData.concepts.slice(0, 50).map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.concept_number}</TableCell>
                          <TableCell className="font-medium">{c.concept_name}</TableCell>
                          <TableCell className="text-muted-foreground">{c.campaign_name}</TableCell>
                          <TableCell>{c.product_group || '-'}</TableCell>
                          <TableCell>{statusBadge(c.status)}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">{c.brand_feedback || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Skeleton className="h-48 w-full" />
            </div>
          )}
        </TabsContent>

        {/* FINANCE TAB */}
        <TabsContent value="finance" className="space-y-4">
          <h2 className="text-lg font-semibold">Financial Summary</h2>
          {finance && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Budget Overview</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Budget</span><span className="font-bold">{formatAED(finance.total_budget)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Spent</span><span className="font-bold">{formatAED(finance.total_spent)}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="font-bold text-destructive">{formatAED(finance.outstanding_amount)}</span></div>
                  {finance.carry_forward_value_cents > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Carry Forward Value</span><span className="font-bold">{formatAED(finance.carry_forward_value_cents / 100)}</span></div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">Paid</span><Badge className="bg-emerald-500/10 text-emerald-600">{finance.paid_campaigns}</Badge></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">Partial</span><Badge className="bg-amber-500/10 text-amber-600">{finance.partial_campaigns}</Badge></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">Unpaid</span><Badge variant="destructive">{finance.unpaid_campaigns}</Badge></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Campaigns</span><span className="font-bold">{finance.total_campaigns}</span></div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4">
          <h2 className="text-lg font-semibold">Activity Timeline</h2>
          {activity.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No activity recorded yet</p>
          ) : (
            <Card>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 p-4">
                  {activity.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{a.actor_name || 'System'}</span>
                          {' '}{a.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </SuperadminLayout>
  );
}
