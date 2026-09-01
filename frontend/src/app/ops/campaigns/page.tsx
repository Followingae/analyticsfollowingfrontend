/**
 * Operations — the campaign list.
 *
 * Density tier: SCANNING. This is the screen an operator opens twenty times a day to find
 * one campaign, so the rows stay at the table floor and the air goes around the table, not
 * inside it. The page used to wrap the whole thing in a card, put the filters in a second
 * card inside it, and finish with four metric cards; that is three boxes to cross before
 * the first row. The boxes are gone and nothing else changed.
 *
 * The figures are a band, not four tiles: a count is not an object you can click, move or
 * delete, so it does not get a card.
 *
 * And "no campaigns" now means no campaigns. A failed read says so and offers the retry,
 * because an empty list over a 500 tells an operator their work has disappeared.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOperations } from '@/contexts/OperationsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Page, Sections, Group, PageHead, SectionHead,
  Figure, Figures, Ledger, LedgerHead, Cell, State, Failed, Empty, Waiting, DASH,
  type StateTone,
} from '@/components/campaigns/surface';
import { Search, ChevronRight, Filter, RefreshCcw, Briefcase } from 'lucide-react';
import { format, isValid } from 'date-fns';

/** Format a date defensively. A date we do not have is a dash, never a guess. */
const safeDate = (value?: string | null, fmt = 'MMM d, yyyy'): string => {
  if (!value) return DASH;
  const d = new Date(value);
  return isValid(d) ? format(d, fmt) : DASH;
};

const STATUS_TONE: Record<string, StateTone> = {
  planning: 'info',
  active: 'good',
  completed: 'neutral',
  archived: 'neutral',
};

/** A count we were given, or a dash. `undefined` is not zero. */
function Count({ n, tone }: { n: unknown; tone?: 'warn' | 'bad' }) {
  if (typeof n !== 'number' || Number.isNaN(n)) {
    return <span className="text-muted-foreground/70">{DASH}</span>;
  }
  if (n === 0) return <span className="text-muted-foreground/70">0</span>;
  return (
    <span
      className={
        tone === 'bad' ? 'font-medium text-red-600 dark:text-red-400'
        : tone === 'warn' ? 'font-medium text-amber-700 dark:text-amber-400'
        : 'font-medium'
      }
    >
      {n}
    </span>
  );
}

export default function OperationsCampaignsPage() {
  const router = useRouter();
  const { campaigns, loadCampaigns, uiState, loadErrors } = useOperations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    loadCampaigns().finally(() => setIsInitialLoad(false));
  }, [loadCampaigns]);

  const failed = loadErrors.campaigns;

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const navigateToCampaign = (campaignId: string) => {
    router.push(`/ops/campaigns/${campaignId}`);
  };

  /* A total built from a list we could not read is not a total. When the read failed every
     figure is a dash, rather than the zero a `.reduce` would happily produce. */
  const sum = (get: (c: any) => unknown) =>
    failed ? null : campaigns.reduce((acc, c) => acc + (typeof get(c) === 'number' ? (get(c) as number) : 0), 0);

  if (isInitialLoad && uiState.isLoading) {
    return (
      <Page width="wide">
        <Sections>
          <PageHead title="Operations" sub="Campaign execution and deliverables." />
          <Waiting lines={6} />
        </Sections>
      </Page>
    );
  }

  return (
    <Page width="wide">
      <Sections>
        <PageHead
          title="Operations"
          sub="Campaign execution and deliverables."
          action={
            <>
              {/* This read `userAccess.viewMode`, which does not exist on UserAccess, so the
                  badge said "Client View" to everyone including an operator sitting in
                  internal mode. The mode lives on `uiState`. */}
              <State tone="neutral">
                {uiState.viewMode === 'internal' ? 'Internal view' : 'Client view'}
              </State>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadCampaigns()}
                disabled={uiState.isLoading}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${uiState.isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          }
        />

        <Figures cols={4}>
          <Figure label="Campaigns" value={failed ? null : campaigns.length} />
          <Figure
            label="Active"
            value={failed ? null : campaigns.filter(c => c.status === 'active').length}
          />
          <Figure label="Deliverables" value={sum((c: any) => c.total_deliverables)} />
          <Figure label="Pending approval" value={sum((c: any) => c.pending_approvals)} />
        </Figures>

        <Group>
          <SectionHead
            title="Campaigns"
            sub="Open one to manage its workstreams and deliverables."
          />

          <div className="flex flex-wrap items-center gap-ds-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

          {failed ? (
            <Failed
              what="The campaign list did not load"
              detail={`${failed} Nothing has changed on the campaigns themselves, we just could not read them.`}
              onRetry={() => loadCampaigns()}
            />
          ) : filteredCampaigns.length === 0 ? (
            <Empty>
              {campaigns.length === 0
                ? 'No campaigns have been set up yet. An administrator adds the first one.'
                : 'No campaign matches this search.'}
            </Empty>
          ) : (
            <Ledger>
              <LedgerHead
                cols={[
                  { key: 'campaign', label: 'Campaign' },
                  { key: 'brand', label: 'Brand' },
                  { key: 'status', label: 'Status' },
                  { key: 'deliverables', label: 'Deliverables', align: 'right' },
                  { key: 'pending', label: 'Pending', align: 'right' },
                  { key: 'overdue', label: 'Overdue', align: 'right' },
                  { key: 'period', label: 'Period' },
                  { key: 'go', label: '' },
                ]}
              />
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="cursor-pointer border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/50"
                    onClick={() => navigateToCampaign(campaign.id)}
                  >
                    <Cell className="font-medium">
                      <span className="flex items-center gap-ds-2">
                        <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {campaign.campaign_name}
                      </span>
                    </Cell>
                    <Cell>{campaign.brand_name}</Cell>
                    <Cell>
                      <State tone={STATUS_TONE[campaign.status] || 'neutral'}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </State>
                    </Cell>
                    <Cell align="right"><Count n={(campaign as any).total_deliverables} /></Cell>
                    <Cell align="right"><Count n={(campaign as any).pending_approvals} tone="warn" /></Cell>
                    <Cell align="right"><Count n={(campaign as any).overdue_posts} tone="bad" /></Cell>
                    <Cell className="whitespace-nowrap text-muted-foreground">
                      {safeDate(campaign.start_date, 'MMM d')} to {safeDate(campaign.end_date)}
                    </Cell>
                    <Cell className="w-10">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Cell>
                  </tr>
                ))}
              </tbody>
            </Ledger>
          )}
        </Group>
      </Sections>
    </Page>
  );
}
