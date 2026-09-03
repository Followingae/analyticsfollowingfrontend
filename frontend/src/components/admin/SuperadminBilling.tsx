'use client';

/**
 * The client credit ledger.
 *
 * This screen used to describe a subscription business: MRR, ARR, growth against last month,
 * active subscriptions, revenue by tier. None of it existed. `/api/v1/admin/billing/revenue`
 * returns `{monthly_revenue, total_revenue, months_included}` and nothing else, so every one
 * of those figures read a field that was never on the wire and rendered a permanent dash,
 * while "By Tier" was three literal zeroes wired to nothing at all.
 *
 * The transactions table was the same story from the other end. `/billing/transactions`
 * returns `{transactions, total, total_amount}`, and each row carries `transaction_type`,
 * `action`, `credits`, `amount` and `balance_after`. The screen read `type`, `status`,
 * `currency` and `stripe_payment_id`, four fields that do not exist, so the type and status
 * badges were empty, both filters matched nothing, and the summary's "Revenue" was computed
 * as `status === 'completed' && type === 'payment'`, which is a guaranteed zero forever.
 *
 * Worst of all, `CreditTransaction.amount` is an integer credit count sitting beside
 * `balance_before` and `balance_after`. It was being rendered with a dirham sign. The screen
 * was not reporting revenue at all: it was reporting credits, in the wrong unit.
 *
 * So this is the ledger the endpoints actually serve, in the unit they actually hold. There
 * is no AED on this screen, because there is no AED in this data. Client invoice money lives
 * on the campaign timeline, against the instalment it settles.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart';
import { AlertCircle, Coins, Download, Receipt, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { superadminService } from '@/utils/superadminApi';
import { format } from 'date-fns';
import { Empty, PageHead, Panel, Stat, StatGrid, type Tone } from '@/components/console/primitives';

/** What `/billing/transactions` actually returns per row. */
interface Txn {
  id: string;
  user_email: string;
  transaction_type: string;
  action?: string | null;
  credits: number;
  amount: number;
  description?: string | null;
  balance_after?: number | null;
  created_at: string | null;
}

interface MonthRow {
  month: string | null;
  revenue: number;
  transaction_count: number;
}

const PAGE_SIZE = 50;

/* The four values `transaction_type` is actually written with, from the services that write
   them. The old filter offered payment, refund and credit_purchase, none of which the column
   has ever held, so every option except "all" returned an empty table. */
const TYPES: { value: string; label: string; tone: Tone }[] = [
  { value: 'purchase', label: 'Bought', tone: 'good' },
  { value: 'spend', label: 'Spent', tone: 'neutral' },
  { value: 'earned', label: 'Earned', tone: 'info' },
  { value: 'manual_adjust', label: 'Adjusted', tone: 'warn' },
];

const TYPE_SKIN: Record<Tone, string> = {
  good: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  info: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  warn: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  bad: 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  neutral: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
};

const typeOf = (v: string) => TYPES.find(t => t.value === v);

/** Credits, never money. Absent is a dash. */
const credits = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('en-AE');

const CHART: ChartConfig = {
  revenue: { label: 'Credits bought', color: 'var(--primary)' },
  transaction_count: { label: 'Transactions', color: 'var(--muted-foreground)' },
};

const monthLabel = (iso: string | null) =>
  !iso ? '—' : new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

export default function SuperadminBilling() {
  const [ledger, setLedger] = useState<Txn[]>([]);
  const [series, setSeries] = useState<MonthRow[]>([]);
  const [bought, setBought] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [months, setMonths] = useState<string>('6');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadBillingData(); }, [currentPage, months]);

  const loadBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [transactionData, revenueData] = await Promise.all([
        superadminService.getTransactions(currentPage),
        superadminService.getRevenueSummary(Number(months)),
      ]);
      setLedger(transactionData.transactions || []);
      setCount(typeof transactionData.total === 'number' ? transactionData.total : null);
      setSeries(revenueData.monthly_revenue || []);
      setBought(typeof revenueData.total_revenue === 'number' ? revenueData.total_revenue : null);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not read the ledger');
    } finally {
      setLoading(false);
    }
  };

  /* One page of results with the search box and the type filter applied. It is labelled as
     exactly that below, because the old screen called the same subtotal "Revenue" and put it
     beside figures covering the whole business. */
  const shown = useMemo(() => ledger.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q
      || (t.user_email || '').toLowerCase().includes(q)
      || (t.description || '').toLowerCase().includes(q);
    return matchesSearch && (filterType === 'all' || t.transaction_type === filterType);
  }), [ledger, searchTerm, filterType]);

  const totalPages = count == null ? 1 : Math.max(1, Math.ceil(count / PAGE_SIZE));

  /* Real arithmetic on a real series: which month sold the most. Null when the series did
     not come back, rather than the first row of an empty array. */
  const busiest = useMemo(() => {
    if (!series.length) return null;
    return series.reduce((a, b) => (b.revenue > a.revenue ? b : a));
  }, [series]);

  const chartRows = useMemo(
    () => [...series].reverse().map(m => ({ ...m, label: monthLabel(m.month) })),
    [series],
  );

  const exportLedger = () => {
    const head = ['Date', 'Client', 'Type', 'What for', 'Credits', 'Balance after', 'Description'];
    const rows = shown.map(t => [
      t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd HH:mm') : '',
      t.user_email, typeOf(t.transaction_type)?.label || t.transaction_type,
      t.action || '', t.credits, t.balance_after ?? '', t.description || '',
    ]);
    const csv = [head, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** The monthly series as a file. Every figure is one the endpoint sent. */
  const exportSeries = () => {
    const head = ['Month', 'Credits bought', 'Transactions'];
    const rows = series.map(m => [m.month || '', m.revenue, m.transaction_count]);
    const csv = [head, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `credits-by-month-${format(new Date(), 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin" />Reading the ledger...
      </div>
    );
  }

  return (
    <div className="space-y-ds-5">
      <PageHead
        title="Client credits"
        sub="Every credit bought and spent, and who moved it."
        action={
          <Button onClick={loadBillingData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />Refresh
          </Button>
        }
      />

      {/* An error is not a quiet month. Nothing below could be read, so nothing below is
          drawn: no figures, no chart, no empty ledger that reads as an all clear. */}
      {error ? (
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Nothing below could be read, so no figure is shown. This is not a quiet month.
          </p>
          <Button variant="outline" size="sm" onClick={loadBillingData}>Try again</Button>
        </div>
      ) : (
        <>
          <StatGrid cols={3}>
            <Stat
              label="Credits bought"
              value={credits(bought)}
              icon={Coins}
              tone={bought == null ? 'neutral' : 'good'}
              hint={`Across the last ${months} months`} />
            <Stat
              label="Transactions"
              value={credits(count)}
              icon={Receipt}
              hint="Everything on the books, not just this page" />
            <Stat
              label="Busiest month"
              value={busiest ? monthLabel(busiest.month) : '—'}
              icon={TrendingUp}
              hint={busiest
                ? `${credits(busiest.revenue)} credits over ${busiest.transaction_count} transactions`
                : 'The monthly series did not come back'} />
          </StatGrid>

          <Tabs defaultValue="ledger" className="space-y-ds-4">
            <TabsList>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
              <TabsTrigger value="months">By month</TabsTrigger>
            </TabsList>

            <TabsContent value="ledger" className="space-y-ds-3">
              <div className="flex flex-wrap items-center gap-ds-2">
                <div className="relative w-full max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by client or description"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any type</SelectItem>
                    {TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={exportLedger} variant="outline" size="sm" disabled={!shown.length}>
                  <Download className="mr-2 h-4 w-4" />Export
                </Button>
              </div>

              {/* The grey box that used to sit here held four figures, two of which were
                  named Revenue and Refunds and were structurally always zero. This is the
                  same idea as one caption, and it says what it counts. */}
              <p className="text-ds-caption text-muted-foreground">
                {shown.length} of {ledger.length} on this page
                {count != null && `, ${credits(count)} in total`}
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>What for</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Balance after</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((t) => {
                    const kind = typeOf(t.transaction_type);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.created_at ? format(new Date(t.created_at), 'd MMM yyyy, HH:mm') : '—'}
                        </TableCell>
                        <TableCell>{t.user_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={TYPE_SKIN[kind?.tone ?? 'neutral']}>
                            {kind?.label || t.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate text-muted-foreground">
                          {t.description || t.action || '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.credits > 0 ? `+${credits(t.credits)}` : credits(t.credits)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {credits(t.balance_after)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {shown.length === 0 && (
                <Empty>
                  {searchTerm || filterType !== 'all'
                    ? 'Nothing on this page matches those filters.'
                    : 'Nothing on this page.'}
                </Empty>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-ds-caption tabular-nums text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="months">
              {/* A shape over time is the one thing a figure cannot carry: whether a strong
                  month was many clients topping up or one large purchase. Bars are credits
                  bought, the line is how many transactions carried them, so the two together
                  say which it was. */}
              <Panel
                title="Credits bought by month"
                description="Bars are credits. The line is how many transactions carried them."
                action={
                  <div className="flex items-center gap-2">
                    <Select value={months} onValueChange={setMonths}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={exportSeries} variant="outline" size="sm" disabled={!series.length}>
                      <Download className="mr-2 h-4 w-4" />Export
                    </Button>
                  </div>
                }
              >
                {chartRows.length === 0 ? (
                  <Empty>Nothing was bought in this period.</Empty>
                ) : (
                  <ChartContainer config={CHART} className="h-[280px] w-full">
                    <ComposedChart data={chartRows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10}
                             className="text-xs" />
                      <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8}
                             allowDecimals={false} className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false}
                             tickMargin={8} allowDecimals={false} className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar yAxisId="left" dataKey="revenue" fill="var(--color-revenue)"
                           radius={[4, 4, 0, 0]} maxBarSize={54} />
                      <Line yAxisId="right" dataKey="transaction_count" dot={false} strokeWidth={2}
                            stroke="var(--color-transaction_count)" />
                    </ComposedChart>
                  </ChartContainer>
                )}
              </Panel>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
