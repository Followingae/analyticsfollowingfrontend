'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Download,
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Users,
  Package
} from 'lucide-react';
import { superadminService } from '@/utils/superadminApi';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Aed, PageHead, Stat, StatGrid } from '@/components/console/primitives';

/**
 * Money on screen.
 *
 * Every figure here was written as a bare U+20C3 in JSX. No system font carries that
 * codepoint, and only the `Aed` primitive names the face that does, so the mark rendered as
 * an empty box beside every revenue number on the screen leadership reads first.
 *
 * Absent is a dash. These all read `x?.toLocaleString() || 0` before, so a response that did
 * not carry `mrr` printed a confident zero MRR. A real zero still prints 0.
 */
const Aed2 = ({ value }: { value: number | null | undefined }) =>
  value == null ? <>—</> : <Aed>{Number(value).toLocaleString('en-AE')}</Aed>;

interface Transaction {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'credit_purchase';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  created_at: string;
  stripe_payment_id?: string;
}

interface RevenueStats {
  total_revenue: number;
  mrr: number;
  arr: number;
  new_mrr: number;
  churn_mrr: number;
  growth_rate: number;
  active_subscriptions: number;
  trial_users: number;
  paying_users: number;
}

interface RevenueChartData {
  date: string;
  revenue: number;
  subscriptions: number;
  churn: number;
}

export default function SuperadminBilling() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [chartData, setChartData] = useState<RevenueChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load data on mount
  useEffect(() => {
    loadBillingData();
  }, [currentPage, selectedPeriod]);

  const loadBillingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [transactionData, revenueData] = await Promise.all([
        superadminService.getTransactions(currentPage),
        superadminService.getRevenueSummary(selectedPeriod === 'yearly' ? 12 : selectedPeriod === 'quarterly' ? 3 : 6)
      ]);

      setTransactions(transactionData.transactions || []);
      setTotalPages(transactionData.pages || 1);
      setRevenueStats(revenueData.stats || null);
      setChartData(revenueData.chart_data || []);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  // Export transactions to CSV
  const handleExportTransactions = () => {
    const csv = [
      ['Date', 'User', 'Amount', 'Type', 'Status', 'Description', 'Payment ID'],
      ...filteredTransactions.map(t => [
        format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
        t.user_email,
        `${t.currency} ${t.amount}`,
        t.type,
        t.status,
        t.description,
        t.stripe_payment_id || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Export revenue report
  const handleExportRevenue = () => {
    const report = `
Revenue Report - ${format(new Date(), 'MMMM yyyy')}
=====================================

Key Metrics:
- Total Revenue: AED ${revenueStats?.total_revenue?.toLocaleString() ?? "not reported"}
- MRR: AED ${revenueStats?.mrr?.toLocaleString() ?? "not reported"}
- ARR: AED ${revenueStats?.arr?.toLocaleString() ?? "not reported"}
- Growth Rate: ${revenueStats?.growth_rate?.toFixed(2) || 0}%

Subscriptions:
- Active: ${revenueStats?.active_subscriptions || 0}
- Paying Users: ${revenueStats?.paying_users || 0}
- Trial Users: ${revenueStats?.trial_users || 0}

MRR Movement:
- New MRR: AED ${revenueStats?.new_mrr?.toLocaleString() ?? "not reported"}
- Churn MRR: AED ${revenueStats?.churn_mrr?.toLocaleString() ?? "not reported"}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${format(new Date(), 'yyyy-MM')}.txt`;
    a.click();
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary stats
  const summaryStats = {
    total: filteredTransactions.length,
    revenue: filteredTransactions
      .filter(t => t.status === 'completed' && t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0),
    refunds: filteredTransactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0),
    pending: filteredTransactions.filter(t => t.status === 'pending').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading billing data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-ds-5">
      {/* The money hub's own header sits directly above this, carrying the destination's
          name. This is the screen's name inside it, which is how the restyled hubs pair a
          header with a tab. */}
      <PageHead
        title="Client invoices"
        sub="What we invoiced against what landed, and every transaction behind it."
        action={
          <>
            <Button onClick={handleExportRevenue} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export report
            </Button>
            <Button onClick={loadBillingData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </>
        }
      />

      {/* An error is not a month with no revenue.
          The alert used to sit above the figures and the figures still rendered — every one
          of them `|| 0`, so a failed read printed "0 revenue, 0 MRR, 0 subscriptions" on the
          screen that answers how the business is doing. The error replaces the rest. */}
      {error ? (
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Nothing below could be read, so no figure is shown. This is not a month with no
            revenue.
          </p>
          <Button variant="outline" size="sm" onClick={loadBillingData}>Try again</Button>
        </div>
      ) : (
      <>
      {/* Four bordered cards became four figures with room around them. Each read `|| 0`,
          which turned a missing field into a confident zero; absent is a dash now. */}
      <StatGrid>
        <Stat
          label="Total revenue"
          value={<Aed2 value={revenueStats?.total_revenue} />}
          icon={Coins}
          hint={revenueStats?.growth_rate == null
            ? 'Growth against last month did not come back'
            : `${revenueStats.growth_rate > 0 ? '+' : ''}${revenueStats.growth_rate.toFixed(1)}% against last month`}
          tone={revenueStats?.growth_rate == null ? 'neutral'
            : revenueStats.growth_rate > 0 ? 'good' : 'bad'} />

        <Stat
          label="MRR"
          value={<Aed2 value={revenueStats?.mrr} />}
          icon={CreditCard}
          hint={<>ARR <Aed2 value={revenueStats?.arr} /></>} />

        <Stat
          label="Active subscriptions"
          value={revenueStats?.active_subscriptions ?? '—'}
          icon={Package}
          hint={revenueStats?.paying_users == null
            ? 'How many are paying did not come back'
            : `${revenueStats.paying_users.toLocaleString()} paying`} />

        <Stat
          label="MRR movement"
          value={<Aed2 value={revenueStats?.new_mrr} />}
          icon={Users}
          tone={revenueStats?.new_mrr ? 'good' : 'neutral'}
          hint={<>new this month, <Aed2 value={revenueStats?.churn_mrr} /> churned</>} />
      </StatGrid>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center space-x-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="refund">Refunds</SelectItem>
                    <SelectItem value="credit_purchase">Credits</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExportTransactions} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{summaryStats.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-lg font-bold text-[var(--tone-good-ink)]">
                    <Aed2 value={summaryStats.revenue} />
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refunds</p>
                  <p className="text-lg font-bold text-[var(--tone-bad-ink)]">
                    <Aed2 value={summaryStats.refunds} />
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold text-yellow-600">{summaryStats.pending}</p>
                </div>
              </div>

              {/* Transactions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{transaction.user_email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.type === 'payment' ? 'default' :
                          transaction.type === 'refund' ? 'destructive' : 'secondary'
                        }>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {transaction.type === 'refund' ? (
                            <ArrowDownRight className="h-4 w-4 mr-1 text-[var(--tone-bad-dot)]" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 mr-1 text-[var(--tone-good-dot)]" />
                          )}
                          <span className={transaction.type === 'refund' ? 'text-[var(--tone-bad-ink)]' : ''}>
                            {transaction.currency} {transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.stripe_payment_id || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Period Selector */}
              <div className="mb-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chart Data Table */}
              {chartData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>New Subscriptions</TableHead>
                      <TableHead>Churn</TableHead>
                      <TableHead>Net Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((data) => (
                      <TableRow key={data.date}>
                        <TableCell className="font-medium">{data.date}</TableCell>
                        <TableCell className="tabular-nums"><Aed2 value={data.revenue} /></TableCell>
                        <TableCell>{data.subscriptions}</TableCell>
                        <TableCell className="tabular-nums text-[var(--tone-bad-ink)]">-{data.churn}</TableCell>
                        <TableCell>
                          <span className={data.subscriptions - data.churn >= 0 ? 'text-[var(--tone-good-ink)]' : 'text-[var(--tone-bad-ink)]'}>
                            {data.subscriptions - data.churn >= 0 ? '+' : ''}{data.subscriptions - data.churn}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No analytics data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">By Tier</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Free:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standard:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">By Status</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="font-medium">{revenueStats?.active_subscriptions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trial:</span>
                      <span className="font-medium">{revenueStats?.trial_users || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paying:</span>
                      <span className="font-medium">{revenueStats?.paying_users || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Key Metrics</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Avg. Revenue/User:</span>
                      <span className="font-medium">
                        {revenueStats?.paying_users
                          ? <Aed2 value={Number((revenueStats.mrr / revenueStats.paying_users).toFixed(2))} />
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Churn Rate:</span>
                      <span className="font-medium">
                        {revenueStats?.mrr ?
                          ((revenueStats.churn_mrr / revenueStats.mrr) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  );
}
