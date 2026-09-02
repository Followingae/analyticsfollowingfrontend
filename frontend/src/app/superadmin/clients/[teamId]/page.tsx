'use client'
import { tokenManager } from '@/utils/tokenManager';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  ArrowLeft, Boxes, Building2, Coins, FileText, Users, Video,
  Calendar, Activity, TrendingUp, AlertCircle, CheckCircle2,
  Clock, XCircle, ChevronRight, Upload, Loader2, ShieldCheck, Mail, Handshake
} from 'lucide-react';
import { ClientAccessDialog } from '@/components/clients/ClientAccessDialog';
import { CampaignBriefingDialog } from '@/components/clients/CampaignBriefingDialog';
import { CampaignUpdateDialog } from '@/components/clients/CampaignUpdateDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { clientApi, type ScopeCampaign, type FinanceSummary } from '@/services/clientManagementApi';
import { QuotaProgressCard } from '@/components/clients/QuotaProgressCard';
import { ClientCommercialTab } from '@/components/clients/ClientCommercialTab';
import { ClientModulesTab } from '@/components/clients/ClientModulesTab';
import { ClientManagementTermsTab } from '@/components/clients/ClientManagementTermsTab';
import { Aed, Panel, Stat, StatGrid } from '@/components/console/primitives';

/**
 * A figure we were never given is a dash, not a zero.
 *
 * This read `if (!amount) return 'AED 0'`, which catches null and undefined alongside a
 * genuine zero, so a client whose budget the endpoint did not carry read as a client who has
 * never spent anything, on the record their account manager quotes from. It also spelled that
 * case "AED 0" in Latin while every real figure used the dirham mark, so the absent case was
 * formatted differently as well as meaning something different.
 *
 * The number only; the mark is the `Aed` primitive's job, in the one font that carries it.
 */
const formatAED = (amount: number | null | undefined) =>
  amount == null ? null : Number(amount).toLocaleString('en-AE', { minimumFractionDigits: 0 });

/** Money on screen: the mark and the figure, or a dash where we were told nothing. */
const Money = ({ value }: { value: number | null | undefined }) => {
  const n = formatAED(value);
  return n === null ? <>—</> : <Aed>{n}</Aed>;
};

/**
 * One figure in a summary strip: a caption, and the number under it.
 *
 * Smaller than a `Stat` because these sit inside a tab rather than at the top of a page, but
 * built the same way — grouped by the gap, tone carried by a dot beside the caption so the
 * state reads without the colour.
 */
const SCOPE_DOT: Record<string, string> = {
  good: 'bg-[var(--tone-good-dot)]',
  warn: 'bg-[var(--tone-warn-dot)]',
  bad: 'bg-[var(--tone-bad-dot)]',
  info: 'bg-[var(--tone-info-dot)]',
};
const ScopeFigure = ({ label, value, tone, money }: {
  label: string; value: number | null | undefined; tone?: keyof typeof SCOPE_DOT; money?: boolean
}) => (
  <div className="px-ds-2 py-ds-2">
    <div className="flex items-center gap-ds-2">
      {tone && value ? <span className={`h-1.5 w-1.5 flex-none rounded-full ${SCOPE_DOT[tone]}`} aria-hidden /> : null}
      <p className="text-ds-caption font-medium text-muted-foreground">{label}</p>
    </div>
    <p className="mt-ds-2 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
      {value == null ? '—' : money ? <Money value={value} /> : value}
    </p>
  </div>
);


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

/* The skins below were hand-picked Tailwind palette steps — emerald-500/10 for paid,
   amber-500/10 for partial, and five more for the campaign types. That is a fifth set of
   greens and ambers beside the ones the console decides once, which is how "paid" here ends
   up a different green from "healthy" two screens away. They name the console tone tokens
   now. Campaign type is not a state, so it carries no colour at all: colour is status. */
const TONE_BADGE = {
  good: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  warn: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  bad: 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  info: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
} as const;

const paymentBadge = (status: string) => {
  switch (status) {
    case 'complete': return <Badge variant="outline" className={TONE_BADGE.good}>Paid</Badge>;
    case 'partial': return <Badge variant="outline" className={TONE_BADGE.warn}>Partial</Badge>;
    case 'not_paid': return <Badge variant="outline" className={TONE_BADGE.bad}>Unpaid</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const reportBadge = (status: string) => {
  switch (status) {
    case 'received': return <Badge variant="outline" className={TONE_BADGE.good}><CheckCircle2 className="mr-1 h-3 w-3" />Received</Badge>;
    case 'sent': return <Badge variant="outline" className={TONE_BADGE.info}>Sent</Badge>;
    case 'not_sent': return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Not Sent</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const typeBadge = (type: string) => (
  <Badge variant="outline" className="capitalize">{type.replace('_', ' ')}</Badge>
);

/** Reading the query needs a boundary in Next 15; the record itself is unchanged. */
export default function ClientDetailPageWrapper() {
  return <Suspense fallback={null}><ClientDetailPage /></Suspense>
}

function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [client, setClient] = useState<any>(null);
  const [scope, setScope] = useState<ScopeCampaign[]>([]);
  const [scopeSummary, setScopeSummary] = useState<any>({});
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [ugcData, setUgcData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [commercialCampaign, setCommercialCampaign] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  // Every deep link into a client — chase the agreement, chase the invoice — landed on
  // Scope, because the record ignored where it was asked to open.
  const search = useSearchParams();
  // 'management' renders below but was missing here, so ?tab=management silently opened Scope.
  const TABS = ['scope','campaigns','proposals','barter','ugc','commercial','modules','management','finance','activity'];
  const asked = search?.get('tab') || '';
  const [activeTab, setActiveTab] = useState(TABS.includes(asked) ? asked : 'scope');
  const [scopeYear, setScopeYear] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);

  const handleAssignAM = async (value: string) => {
    const amId = value === 'unassigned' ? null : value;
    try {
      await clientApi.update(teamId, { account_manager_id: amId });
      setClient((prev: any) =>
        prev
          ? { ...prev, account_manager_id: amId, account_manager_name: staff.find((s) => s.id === amId)?.full_name || null }
          : prev,
      );
    } catch (err) {
      console.error('Failed to assign account manager:', err);
      alert(err instanceof Error ? err.message : 'Failed to assign account manager');
    }
  };

  const handleLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await clientApi.uploadLogo(teamId, file);
      const url = res?.data?.logo_url;
      if (url) setClient((prev: any) => (prev ? { ...prev, logo_url: url } : prev));
    } catch (err) {
      console.error('Logo upload failed:', err);
      alert(err instanceof Error ? err.message : 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * "Client not found" was what a failed read said.
   *
   * The catch logged to the console and left `client` at null, and null rendered the
   * not-found screen. So a 500, an expired token or a dropped connection all told an
   * account manager that the client they were looking at does not exist. Failure is held
   * separately from absence.
   */
  const [failure, setFailure] = useState<string | null>(null);
  /** Bumped by "Try again", so a retry re-runs the same read without changing the filters. */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!teamId) return;
    const load = async () => {
      setLoading(true);
      setFailure(null);
      try {
        const [detailRes, scopeRes, financeRes, staffRes] = await Promise.all([
          clientApi.getDetail(teamId),
          clientApi.getScope(teamId, scopeYear && scopeYear !== 'all' ? parseInt(scopeYear) : undefined),
          clientApi.getFinance(teamId),
          clientApi.listStaff('account_manager').catch(() => ({ data: [] })),
        ]);
        setClient(detailRes.data);
        setScope(scopeRes.data || []);
        setScopeSummary(scopeRes.summary || {});
        setFinance(financeRes.data || null);
        setStaff(staffRes.data || []);
      } catch (err) {
        console.error('Failed to load client:', err);
        setFailure(err instanceof Error ? err.message : 'The client record could not be read');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, scopeYear, reloadKey]);

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
    if (tab === 'proposals' && proposals.length === 0) {
      try {
        const res = await clientApi.getProposals(teamId);
        setProposals(res.data || []);
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
        <div className="flex-1 space-y-ds-5">
          <Skeleton className="h-9 w-48 rounded-ds-lg" />
          {/* The band this stands in for no longer draws a box per figure, so neither does
              the skeleton: label, number and hint at the gap the real StatGrid uses. */}
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-ds-2 px-ds-2 py-ds-2">
                <Skeleton className="h-3 w-24 rounded-ds-sm" />
                <Skeleton className="h-9 w-28 rounded-ds-sm" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-ds-2xl" />
        </div>
      </SuperadminLayout>
    );
  }

  /* A read that failed and a client that does not exist are different facts and must not
     render the same sentence. Only the second one is "not found". */
  if (failure) {
    return (
      <SuperadminLayout>
        <div className="flex-1 space-y-3">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5"
                  onClick={() => router.push('/superadmin/clients')}>
            <ArrowLeft className="h-4 w-4" />Back to clients
          </Button>
          <p className="text-sm font-medium">Could not open this client.</p>
          <p className="text-sm text-muted-foreground">
            {failure}. The record may well be fine: this says the read failed, not that the
            client is gone.
          </p>
          <Button variant="outline" size="sm" onClick={() => setReloadKey(k => k + 1)}>Try again</Button>
        </div>
      </SuperadminLayout>
    );
  }

  if (!client) {
    return (
      <SuperadminLayout>
        <div className="flex-1 space-y-3">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5"
                  onClick={() => router.push('/superadmin/clients')}>
            <ArrowLeft className="h-4 w-4" />Back to clients
          </Button>
          <p className="text-sm text-muted-foreground">
            There is no client with this address.
          </p>
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
        <div className="relative group">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={client.logo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {(client.company_name || client.name || '?').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingLogo}
            title="Upload / replace logo"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
          >
            {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleLogoSelected}
          />
        </div>
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
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAccessOpen(true)}>
            <ShieldCheck className="h-4 w-4" /> Manage access
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBriefingOpen(true)}>
            <Mail className="h-4 w-4" /> Campaign briefing
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setUpdateOpen(true)}>
            <Mail className="h-4 w-4" /> Campaign update
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">Account Manager</span>
          <Select value={client.account_manager_id || 'unassigned'} onValueChange={handleAssignAM}>
            <SelectTrigger className="h-8 w-52 text-sm">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.full_name || s.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ClientAccessDialog teamId={teamId} open={accessOpen} onOpenChange={setAccessOpen} />
      <CampaignBriefingDialog
        teamId={teamId}
        open={briefingOpen}
        onOpenChange={setBriefingOpen}
        defaultEmail={client.owner_email || undefined}
        defaultName={(client.owner_name || '').split(' ')[0]}
      />
      <CampaignUpdateDialog
        teamId={teamId}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        defaultEmail={client.owner_email || undefined}
        defaultName={(client.owner_name || '').split(' ')[0]}
      />

      {/* The four figures that open the record. They were four bordered cards; the border
          said only "these are four of the same kind of thing in a row", which is what the
          gap already says. The numbers take the room the padding was using. */}
      <StatGrid>
        <Stat label="Total budget" value={<Money value={client.total_budget} />} icon={Coins}
              hint="What they have committed with us" />
        <Stat label="Total spent" value={<Money value={client.total_spent} />} icon={TrendingUp}
              hint={client.total_budget > 0 && client.total_spent != null
                ? `${Math.round((client.total_spent / client.total_budget) * 100)}% of the budget`
                : 'Against the budget above'} />
        <Stat label="Live campaigns" value={client.active_campaigns ?? '—'} icon={Activity}
              tone={client.active_campaigns ? 'good' : 'neutral'}
              hint="Running for them right now" />
        {/* Outstanding was `finance?.outstanding_amount || 0`, so a finance read that did not
            answer printed a confident "nothing owed" on the client's own record. */}
        <Stat label="Outstanding" value={<Money value={finance?.outstanding_amount} />}
              icon={AlertCircle}
              tone={finance?.outstanding_amount ? 'bad' : 'neutral'}
              hint={finance == null
                ? 'The finance read did not answer, so this is unknown'
                : 'Invoiced and not yet paid'} />
      </StatGrid>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={loadTabData}>
        <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-10">
          <TabsTrigger value="scope"><FileText className="mr-1.5 h-3.5 w-3.5" />What we agreed</TabsTrigger>
          <TabsTrigger value="campaigns"><Building2 className="mr-1.5 h-3.5 w-3.5" />Campaigns</TabsTrigger>
          <TabsTrigger value="proposals"><Users className="mr-1.5 h-3.5 w-3.5" />Proposals</TabsTrigger>
          <TabsTrigger value="barter"><Calendar className="mr-1.5 h-3.5 w-3.5" />Barter & Events</TabsTrigger>
          <TabsTrigger value="ugc"><Video className="mr-1.5 h-3.5 w-3.5" />UGC</TabsTrigger>
          <TabsTrigger value="commercial"><Coins className="mr-1.5 h-3.5 w-3.5" />Agreement &amp; invoices</TabsTrigger>
          <TabsTrigger value="modules"><Boxes className="mr-1.5 h-3.5 w-3.5" />What they can use</TabsTrigger>
          <TabsTrigger value="management"><Handshake className="mr-1.5 h-3.5 w-3.5" />Management deal</TabsTrigger>
          <TabsTrigger value="finance"><TrendingUp className="mr-1.5 h-3.5 w-3.5" />Money in</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="mr-1.5 h-3.5 w-3.5" />Activity</TabsTrigger>
        </TabsList>

        {/* SCOPE TAB - The "All Scope" spreadsheet replacement */}
        <TabsContent value="scope" className="space-y-4">
          <QuotaProgressCard teamId={teamId} editable />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-ds-subheading">Project Scope</h2>
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

          {/* Five figures for the year in view. Each was a centred box the width of a
              two-digit number; the boxes are gone and the figures reflect what the year
              filter has selected, not a blanket total.

              They also read `x || 0`: a summary block the endpoint did not send printed
              five confident zeroes over a table that might have twenty rows in it. */}
          <div className="-mx-ds-2 grid grid-cols-2 gap-x-ds-5 gap-y-ds-4 sm:grid-cols-3 lg:grid-cols-5">
            <ScopeFigure label="Projects" value={scopeSummary.total_campaigns} />
            <ScopeFigure label="Active" value={scopeSummary.active_count} tone="info" />
            <ScopeFigure label="Complete" value={scopeSummary.complete_count} tone="good" />
            <ScopeFigure label="Budget" value={scopeSummary.total_budget} money />
            <ScopeFigure label="Unpaid" value={scopeSummary.not_paid_count} tone="bad" />
          </div>

          {/* Scope Table */}
          <Card className="overflow-hidden">
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
                        <TableCell className="text-right tabular-nums"><Money value={c.budget} /></TableCell>
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
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center justify-between gap-2">
                            <span className="max-w-[160px] truncate">{c.client_feedback || '-'}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              title="Download report"
                              onClick={(e) => {
                                e.stopPropagation();
                                clientApi.downloadCampaignReport(teamId, c.id, c.name).catch((err) => alert(err instanceof Error ? err.message : 'Download failed'));
                              }}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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
          <h2 className="text-ds-subheading">All Campaigns</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scope.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2 gap-1">
                    {typeBadge(c.campaign_type)}
                    <div className="flex items-center gap-1.5">
                      {paymentBadge(c.payment_status)}
                      {statusBadge(c.status)}
                    </div>
                  </div>
                  <h3 className="font-semibold truncate">{c.name}</h3>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{c.total_creators} creators</span>
                    <span className="tabular-nums"><Money value={c.budget} /></span>
                  </div>
                  {c.budget && c.spent ? (
                    <Progress value={(Number(c.spent) / Number(c.budget)) * 100} className="mt-2 h-1.5" />
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/campaigns/${c.id}`)}>Open</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setCommercialCampaign({ id: c.id, name: c.name })}>
                      <Coins className="mr-1 h-3.5 w-3.5" />Commercial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PROPOSALS TAB */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-ds-subheading">Proposals</h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/superadmin/proposals/create')}>
              Create Proposal
            </Button>
          </div>
          {proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No proposals for this client yet.</p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Influencers</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">Approval</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((p) => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/40"
                        onClick={() => router.push(`/superadmin/proposals/${p.id}`)}>
                        <TableCell className="font-medium">{p.campaign_name || p.title}</TableCell>
                        <TableCell><Badge variant="outline">{String(p.status).replace(/_/g, ' ')}</Badge></TableCell>
                        <TableCell>{p.influencer_count}</TableCell>
                        <TableCell className="tabular-nums"><Money value={p.total_sell_amount ?? p.total_budget} /></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); router.push(`/superadmin/proposals/${p.id}/approval`); }}>
                            Workflow <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* BARTER & EVENTS TAB */}
        <TabsContent value="barter" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-ds-subheading">Barter & Events</h2>
            <Badge variant="outline">{events.length} events</Badge>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet. Events are created in Operations.</p>
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
          <h2 className="text-ds-subheading">UGC Overview</h2>
          {ugcData ? (
            <>
              {/* The same five-figure strip as the scope tab, so the two tabs read as one
                  record rather than two dashboards. */}
              <div className="-mx-ds-2 grid grid-cols-2 gap-x-ds-5 gap-y-ds-4 sm:grid-cols-3 lg:grid-cols-5">
                <ScopeFigure label="Concepts" value={ugcData.summary.total_concepts} />
                <ScopeFigure label="Consumed" value={ugcData.summary.consumed_concepts} tone="good" />
                <ScopeFigure label="Videos" value={ugcData.summary.total_videos} />
                <ScopeFigure label="Ready" value={ugcData.summary.ready_videos} tone="info" />
                <ScopeFigure label="Budget used" value={ugcData.summary.total_budget_consumed} money />
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

        {/* COMMERCIAL TAB */}
        <TabsContent value="commercial" className="space-y-4">
          <ClientCommercialTab teamId={teamId} />
        </TabsContent>

        {/* MODULES TAB: which of the four products this client holds, and how each is billed */}
        <TabsContent value="modules" className="space-y-4">
          <ClientModulesTab teamId={teamId} clientName={client.company_name || client.name} />
        </TabsContent>

        {/* MANAGEMENT TAB: the retainer and the service charge we run this client on, and
            what having a deal at all means for what they are charged elsewhere */}
        <TabsContent value="management" className="space-y-4">
          <ClientManagementTermsTab teamId={teamId} clientName={client.company_name || client.name} />
        </TabsContent>

        {/* FINANCE TAB */}
        <TabsContent value="finance" className="space-y-4">
          {/* No finance figures means the section is not drawn at all: no placeholder card,
              no row of zeroes standing in for money nobody has told us about. */}
          {finance ? (
            <div className="grid grid-cols-1 items-start gap-ds-4 md:grid-cols-2">
              <Panel title="Budget" description="Committed against spent">
                <div className="space-y-ds-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total budget</span><span className="font-semibold tabular-nums"><Money value={finance.total_budget} /></span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total spent</span><span className="font-semibold tabular-nums"><Money value={finance.total_spent} /></span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="font-semibold tabular-nums text-[var(--tone-bad-ink)]"><Money value={finance.outstanding_amount} /></span></div>
                  {finance.carry_forward_value_cents > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Carried forward</span><span className="font-semibold tabular-nums"><Money value={finance.carry_forward_value_cents / 100} /></span></div>
                  )}
                </div>
              </Panel>
              <Panel title="Payment" description="Where each campaign stands">
                <div className="space-y-ds-3">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Paid</span><Badge variant="outline" className={TONE_BADGE.good}>{finance.paid_campaigns}</Badge></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Partial</span><Badge variant="outline" className={TONE_BADGE.warn}>{finance.partial_campaigns}</Badge></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Unpaid</span><Badge variant="outline" className={TONE_BADGE.bad}>{finance.unpaid_campaigns}</Badge></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">Campaigns in total</span><span className="font-semibold tabular-nums">{finance.total_campaigns}</span></div>
                </div>
              </Panel>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The finance figures did not come back. Nothing here is known, including whether
              anything is owed.
            </p>
          )}
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4">
          <h2 className="text-ds-subheading">Activity Timeline</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing has happened on this client yet.</p>
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

      {/* Per-campaign commercial (agreement + invoices) */}
      <Dialog open={!!commercialCampaign} onOpenChange={(o) => !o && setCommercialCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commercial - {commercialCampaign?.name}</DialogTitle>
          </DialogHeader>
          {commercialCampaign && (
            <ClientCommercialTab teamId={teamId} campaignId={commercialCampaign.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
    </SuperadminLayout>
  );
}
