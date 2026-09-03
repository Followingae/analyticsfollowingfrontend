'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Building2, TrendingUp, AlertCircle, RefreshCw, LayoutGrid, Table2 } from 'lucide-react';
import { clientApi, type Client } from '@/services/clientManagementApi';
import { ClientsHubHeader } from '@/components/console/ClientsHubHeader';
import { Aed, CARD } from '@/components/console/primitives';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  /**
   * A book of twenty clients is a list, not a wall.
   *
   * The grid gave every client a card the size of a small poster with three big figures on
   * it, so finding one name meant scrolling three screens. A table puts the same facts in
   * columns that line up down the page. The cards are kept, because the logos are how some
   * people recognise a client, and they are one click away.
   */
  const [view, setView] = useState<'table' | 'cards'>('table');

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clientApi.list({
        search: search || undefined,
        industry: industry && industry !== 'all' ? industry : undefined,
      });
      setClients(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [industry]);

  useEffect(() => {
    const timeout = setTimeout(fetchClients, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  /**
   * A budget we were never told is a dash, not a zero.
   *
   * This read `if (!amount) return 'AED 0'`, which catches null and undefined alongside a
   * genuine zero — so a client whose budget the list endpoint did not carry read as a
   * client who has never spent anything. It also spelled that case "AED 0" in Latin while
   * every real figure used the dirham mark, so the absent case was formatted differently
   * as well as meaning something different. Absent returns null and the caller renders an
   * em dash; a real zero formats like any other number.
   */
  const formatAED = (amount: number | null | undefined) => {
    if (amount == null) return null;
    return Number(amount).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SuperadminLayout>
    <div className="flex-1 space-y-ds-5">
      {/* Header — shared with Prospects, Proposals and Sourcing */}
      <ClientsHubHeader
        showStats
        action={
          <Button variant="outline" size="sm" onClick={fetchClients}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-ds-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Any industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any industry</SelectItem>
            <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
            <SelectItem value="Fashion">Fashion</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Entertainment">Entertainment</SelectItem>
            <SelectItem value="Beauty">Beauty</SelectItem>
            <SelectItem value="Sports">Sports</SelectItem>
            <SelectItem value="Real Estate">Real Estate</SelectItem>
            <SelectItem value="Automotive">Automotive</SelectItem>
            <SelectItem value="Travel">Travel</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup type="single" size="sm" variant="outline" value={view}
                     className="ml-auto"
                     onValueChange={(v: string) => { if (v) setView(v as 'table' | 'cards'); }}>
          <ToggleGroupItem value="table" aria-label="As a table"><Table2 className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="As cards"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* A failed read is not an empty agency.
          The banner used to sit ABOVE the grid, and the grid still rendered — with
          `clients` at [] it drew "No clients found. Clients appear here when you create
          brand user accounts", which told an agency with a full book that it had none, and
          then explained how to get started. The error now replaces everything below it, so
          the only claim on screen is the one we can stand behind. */}
      {error ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4 flex-none" />
            <span>{error}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The client list could not be read, so nothing is known here. This is not an
            empty book.
          </p>
          <Button variant="outline" size="sm" onClick={fetchClients}>Try again</Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-ds-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${CARD} bg-[var(--tone-neutral-wash)] p-ds-4`}>
              <div className="flex items-center gap-ds-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-ds-2">
                  <Skeleton className="h-4 w-[120px] rounded-ds-sm" />
                  <Skeleton className="h-3 w-[80px] rounded-ds-sm" />
                </div>
              </div>
              <div className="mt-ds-4 space-y-ds-2">
                <Skeleton className="h-3 w-full rounded-ds-sm" />
                <Skeleton className="h-3 w-2/3 rounded-ds-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">
            {search || industry !== 'all' ? 'No client matches that' : 'No clients yet'}
          </h3>
          <p className="text-muted-foreground">
            A brand becomes a client once you create its account, it pays, or it has been
            sent a proposal. Everyone we are still only talking to is on Brands.
          </p>
        </div>
      ) : view === 'table' ? (
        /* The same facts the cards carry, in columns that line up down the page. "Total"
           campaigns leaves the primary view: the record itself holds the history, and what
           an account manager is scanning for is who is live, who owes money and who has a
           quote sitting with them. */
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead className="text-right">Live</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Unpaid</TableHead>
                <TableHead>Quotes out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/work/clients/${client.id}`)}
                >
                  <TableCell>
                    <span className="flex items-center gap-ds-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.logo_url || undefined} alt={client.company_name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                          {getInitials(client.company_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{client.company_name}</span>
                        {client.owner_name && (
                          <span className="block truncate text-ds-caption text-muted-foreground">
                            {client.owner_name}
                          </span>
                        )}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.industry || client.subscription_tier}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {client.active_campaigns ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAED(client.total_budget) === null
                      ? '—'
                      : <Aed>{formatAED(client.total_budget)}</Aed>}
                  </TableCell>
                  <TableCell>
                    {client.unpaid_campaigns > 0
                      ? <Badge variant="destructive">{client.unpaid_campaigns}</Badge>
                      : <span className="text-muted-foreground">–</span>}
                  </TableCell>
                  <TableCell>
                    {client.pending_proposals > 0
                      ? <Badge variant="secondary">{client.pending_proposals}</Badge>
                      : <span className="text-muted-foreground">–</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-ds-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clients.map((client) => (
            /* One card per client is the right number of boxes: each is a genuinely
               different subject. What was wrong was the boxes inside it — Active and Total
               each sat in its own tinted, rounded, padded panel, so two small numbers on a
               card that already had an edge were wrapped in two more. They are plain
               figures now, separated by the gap, which is the only thing those panels were
               communicating. The numbers grow into the padding the panels were using. */
            <button
              key={client.id}
              type="button"
              className={`${CARD} group cursor-pointer bg-[var(--tone-neutral-wash)] p-ds-4 text-left transition-shadow
                          hover:shadow-[0_2px_4px_rgba(16,20,12,0.05),0_18px_36px_-18px_rgba(16,20,12,0.24)]
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              onClick={() => router.push(`/work/clients/${client.id}`)}
            >
              {/* Client Header */}
              <div className="flex items-center gap-ds-3">
                <Avatar className="h-14 w-14 border-2 border-border">
                  <AvatarImage src={client.logo_url || undefined} alt={client.company_name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(client.company_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
                    {client.company_name}
                  </h3>
                  {client.owner_name && (
                    <p className="text-ds-caption text-muted-foreground truncate">
                      {client.owner_name}
                    </p>
                  )}
                  <p className="text-ds-caption text-muted-foreground/70 truncate">
                    {client.industry || client.subscription_tier}
                  </p>
                </div>
              </div>

              {/* Campaigns and budget: three figures in a row, grouped by space */}
              <div className="mt-ds-4 flex flex-wrap gap-x-ds-5 gap-y-ds-3">
                <div>
                  <p className="text-ds-caption font-medium text-muted-foreground">Live</p>
                  <p className="mt-ds-1 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                    {client.active_campaigns ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-ds-caption font-medium text-muted-foreground">Campaigns</p>
                  <p className="mt-ds-1 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                    {client.total_campaigns ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-ds-caption font-medium text-muted-foreground">Budget</p>
                  <p className="mt-ds-1 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                    {/* The dirham mark is dropped from an absent figure rather than left
                        sitting beside a dash. */}
                    {formatAED(client.total_budget) === null
                      ? '—'
                      : <Aed>{formatAED(client.total_budget)}</Aed>}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="mt-ds-3 flex flex-wrap gap-ds-1">
                {client.pending_proposals > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {client.pending_proposals} pending
                  </Badge>
                )}
                {client.unpaid_campaigns > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {client.unpaid_campaigns} unpaid
                  </Badge>
                )}
                {client.active_campaigns > 0 && client.unpaid_campaigns === 0 && client.pending_proposals === 0 && (
                  <Badge className="border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)] text-xs">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
    </SuperadminLayout>
  );
}
