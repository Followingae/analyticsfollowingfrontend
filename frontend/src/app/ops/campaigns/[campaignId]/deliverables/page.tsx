/**
 * Operations — every deliverable on the campaign, in one list.
 *
 * Density tier: SCANNING, and this is the screen the tier was written for. It had a card
 * around the filters, a card around the table, a border inside that card around the table
 * again, and a strip of small cards for the status counts. Four boxes, none of which carried
 * information. The rows now sit on hairlines at the table floor, and the air is at the page
 * margin where it belongs.
 *
 * Honesty: the deliverables are fetched workstream by workstream in a loop, and one failed
 * request abandoned the whole loop, kept whatever had been collected, and rendered it as the
 * complete list. A partial answer is now said out loud rather than presented as the truth,
 * and a total failure is a failure rather than "no deliverables found".
 */

'use client';

import type * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Page, Sections, Group, PageHead, SectionHead,
  Figure, Ledger, Cell, State, Failed, Empty, Waiting, Note, DASH,
  type StateTone,
} from '@/components/campaigns/surface';
import {
  Filter,
  Search,
  ChevronRight,
  Download,
} from 'lucide-react';
import { Deliverable, DeliverableStatus } from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { useOperations } from '@/contexts/OperationsContext';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';

const DELIVERABLE_STATUSES: DeliverableStatus[] = [
  'IDEA', 'DRAFTING', 'AWAITING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PRODUCTION',
  'EDITING', 'IN_REVIEW', 'REVISION_REQUIRED', 'READY_TO_POST', 'POSTED', 'ARCHIVED',
];

/** Status colour, said as a word first and a tone second. */
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

export default function GlobalDeliverablesPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const {
    currentCampaign,
    workstreams,
    selectCampaign,
    userAccess,
    loadErrors,
  } = useOperations();

  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  /** How many workstreams we asked for, and how many answered. */
  const [readFailure, setReadFailure] = useState<{ failed: number; total: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<DeliverableStatus | 'all'>('all');
  const [filterWorkstream, setFilterWorkstream] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const isInternal = userAccess.permissions.view_internal_notes;

  useEffect(() => {
    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
    loadAllDeliverables();
    // Reload once workstreams populate (deliverables are fetched per-workstream).
  }, [campaignId, workstreams.length]);

  const loadAllDeliverables = async () => {
    setLoading(true);
    try {
      /* One workstream throwing used to abandon the loop and leave whatever had been
         collected on screen as if it were the whole campaign. Each is now asked for
         separately and the ones that failed are counted, so the page can say the list is
         incomplete instead of quietly being wrong. */
      const results = await Promise.allSettled(
        workstreams.map(ws => operationsApi.getDeliverables(ws.id))
      );
      const collected: Deliverable[] = [];
      let failedCount = 0;
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          collected.push(...((r.value?.deliverables as Deliverable[]) || []));
        } else {
          failedCount += 1;
        }
      });
      setDeliverables(collected);
      setReadFailure(failedCount > 0 ? { failed: failedCount, total: workstreams.length } : null);
      if (failedCount > 0) toast.error('Some deliverables failed to load');
    } catch (error) {
      setReadFailure({ failed: workstreams.length || 1, total: workstreams.length || 1 });
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

  const allFilteredIds = filteredDeliverables.map(d => d.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedDeliverables.includes(id));

  const everythingFailed = readFailure != null && readFailure.failed >= readFailure.total && readFailure.total > 0;
  const partlyFailed = readFailure != null && !everythingFailed;

  const handleExport = () => {
    const header = ['Title', 'Workstream', 'Status', 'Due Date', 'Type', 'Assigned'];
    const rows = filteredDeliverables.map(d => {
      const ws = workstreams.find(w => w.id === d.workstream_id);
      return [d.title, ws?.name || '', d.status, d.due_date || '', d.type, d.assignment_id ? 'Yes' : 'No'];
    });
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `deliverables-${campaignId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulk = async (action: 'status_change' | 'delete') => {
    if (selectedDeliverables.length === 0) return;
    if (action === 'status_change' && !bulkStatus) { toast.error('Pick a status'); return; }
    setBusy(true);
    try {
      await operationsApi.bulkUpdateDeliverables({
        type: action as any,
        target_ids: selectedDeliverables,
        params: action === 'status_change' ? { status: bulkStatus } : {},
      });
      toast.success(`${selectedDeliverables.length} deliverable(s) updated`);
      setSelectedDeliverables([]);
      setBulkStatus('');
      loadAllDeliverables();
    } catch {
      toast.error('Bulk action failed');
    } finally {
      setBusy(false);
    }
  };

  const dueCell = (due?: string | null) => {
    if (!due) return <span className="text-muted-foreground/70">{DASH}</span>;
    const d = new Date(due);
    if (!isValid(d)) return <span className="text-muted-foreground/70">{DASH}</span>;
    const overdue = d < new Date();
    return (
      <span className={overdue ? 'font-medium text-red-600 dark:text-red-400' : undefined}>
        {format(d, 'MMM d')}
      </span>
    );
  };

  if (loading) {
    return (
      <Page width="wide">
        <Sections>
          <PageHead title="All deliverables" sub="Everything being made on this campaign." />
          <Waiting lines={8} />
        </Sections>
      </Page>
    );
  }

  return (
    <Page width="wide">
      <Sections>
        <PageHead
          back={
            <button
              onClick={() => router.push(`/ops/campaigns/${campaignId}`)}
              className="flex w-fit items-center gap-ds-1 text-ds-caption text-muted-foreground hover:text-foreground"
            >
              {currentCampaign?.campaign_name || 'Campaign'}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          }
          title="All deliverables"
          sub="Everything being made on this campaign, across every workstream."
          action={
            /* Bulk extraction is internal-only: a CSV cannot enforce field visibility once it
               has left the screen, and there is no server endpoint to refuse it — the file is
               built here, so this gate IS the access control.
               It deliberately rides on `isInternal` (view_internal_notes) rather than the
               `export_campaigns` permission it should read, because that permission is
               declared and never enforced — see the header of utils/operationsAccess.ts. Both
               resolve to super_admin today, so this is correct now; move it to a real
               `export_campaigns` check when the matrix is wired up. */
            isInternal ? (
              <Button variant="outline" onClick={handleExport} disabled={filteredDeliverables.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            ) : undefined
          }
        />

        {partlyFailed && (
          <Note tone="warn">
            {readFailure!.failed} of {readFailure!.total} workstreams did not answer, so this
            list is incomplete. The counts below cover only what loaded.
          </Note>
        )}

        {/* Status counts: a count is not an object, so it is a row of figures on one
            hairline rather than a strip of little cards. */}
        {!everythingFailed && Object.keys(statusCounts).length > 0 && (
          <div className="flex flex-wrap gap-x-ds-5 gap-y-ds-3 border-b pb-ds-4">
            {(Object.entries(statusCounts) as [string, number][]).map(([status, count]) => (
              <button
                key={status}
                type="button"
                aria-label={`Show only ${say(status)}`}
                onClick={() => setFilterStatus(status as DeliverableStatus)}
                className="min-w-[92px] text-left transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="capitalize">
                  <Figure label={say(status)} value={count} emphasis="quiet" />
                </span>
              </button>
            ))}
          </div>
        )}

        <Group>
          <SectionHead
            title="Deliverables"
            sub="Open one to work on it inside its workstream."
          />

          <div className="flex flex-wrap items-center gap-ds-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search deliverables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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

          {/* The bulk bar is a tint, the third rung of the ladder: set apart, not boxed. */}
          {isInternal && selectedDeliverables.length > 0 && (
            <div className="flex flex-wrap items-center gap-ds-2 rounded-ds-lg bg-muted px-ds-3 py-ds-2">
              <span className="text-ds-label">{selectedDeliverables.length} selected</span>
              <div className="ml-auto flex flex-wrap items-center gap-ds-2">
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Set status…" /></SelectTrigger>
                  <SelectContent>
                    {DELIVERABLE_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={busy || !bulkStatus} onClick={() => handleBulk('status_change')}>Apply</Button>
                <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => handleBulk('delete')}>Delete</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedDeliverables([])}>Clear</Button>
              </div>
            </div>
          )}

          {everythingFailed || (loadErrors.campaign && deliverables.length === 0) ? (
            <Failed
              what="The deliverables did not load"
              detail="Nothing has been deleted. We could not read this campaign's workstreams just now."
              onRetry={loadAllDeliverables}
            />
          ) : filteredDeliverables.length === 0 ? (
            <Empty>
              {deliverables.length === 0
                ? 'Nothing has been added to this campaign yet.'
                : 'No deliverable matches these filters.'}
            </Empty>
          ) : (
            <Ledger>
              {/* Written out rather than using `LedgerHead`, because the select-all control
                  belongs in the header cell it has always been in. The classes are that
                  component's, so the two tables still read as one table. */}
              <thead>
                <tr className="border-b">
                  {isInternal && (
                    <th scope="col" className="w-10 px-ds-3 pb-ds-2 text-left">
                      <Checkbox
                        aria-label="Select every deliverable shown"
                        checked={allSelected}
                        onCheckedChange={(checked: boolean) =>
                          setSelectedDeliverables(checked ? allFilteredIds : [])
                        }
                      />
                    </th>
                  )}
                  {[
                    { key: 'title', label: 'Deliverable', align: 'left' },
                    { key: 'workstream', label: 'Workstream', align: 'left' },
                    { key: 'status', label: 'Status', align: 'left' },
                    { key: 'due', label: 'Due', align: 'right' },
                    { key: 'creator', label: 'Creator', align: 'left' },
                    { key: 'type', label: 'Type', align: 'left' },
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
                </tr>
              </thead>
              <tbody>
                {filteredDeliverables.map(deliverable => {
                  const ws = workstreams.find(w => w.id === deliverable.workstream_id);
                  return (
                    <tr
                      key={deliverable.id}
                      className="cursor-pointer border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/50"
                      onClick={() => router.push(
                        `/ops/campaigns/${campaignId}/workstreams/${deliverable.workstream_id}`
                      )}
                    >
                      {/* Selection only exists to feed the internal-only bulk bar. */}
                      {isInternal && (
                        <Cell className="w-10">
                          <Checkbox
                            checked={selectedDeliverables.includes(deliverable.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedDeliverables(prev => [...prev, deliverable.id]);
                              } else {
                                setSelectedDeliverables(prev =>
                                  prev.filter(id => id !== deliverable.id)
                                );
                              }
                            }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                        </Cell>
                      )}
                      <Cell className="font-medium">{deliverable.title}</Cell>
                      <Cell className="text-muted-foreground">
                        {ws?.name || DASH}
                      </Cell>
                      <Cell>
                        <State tone={STATUS_TONE[deliverable.status] || 'neutral'}>
                          <span className="capitalize">{say(deliverable.status)}</span>
                        </State>
                      </Cell>
                      <Cell align="right">{dueCell(deliverable.due_date)}</Cell>
                      <Cell>
                        {deliverable.assignment_id
                          ? <State tone="neutral">Assigned</State>
                          : <span className="text-muted-foreground/70">Unassigned</span>}
                      </Cell>
                      <Cell className="capitalize text-muted-foreground">{deliverable.type}</Cell>
                    </tr>
                  );
                })}
              </tbody>
            </Ledger>
          )}
        </Group>
      </Sections>
    </Page>
  );
}
