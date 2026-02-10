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
  DollarSign,
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
        superadminService.getRevenueSummary(selectedPeriod)
      ]);

      setTransactions(transactionData.transactions || []);
      setTotalPages(transactionData.pages || 1);
      setRevenueStats(revenueData.stats || null);
      setChartData(revenueData.chart_data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load billing data');
      console.error('Billing load error:', err);
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
- Total Revenue: $${revenueStats?.total_revenue?.toLocaleString() || 0}
- MRR: $${revenueStats?.mrr?.toLocaleString() || 0}
- ARR: $${revenueStats?.arr?.toLocaleString() || 0}
- Growth Rate: ${revenueStats?.growth_rate?.toFixed(2) || 0}%

Subscriptions:
- Active: ${revenueStats?.active_subscriptions || 0}
- Paying Users: ${revenueStats?.paying_users || 0}
- Trial Users: ${revenueStats?.trial_users || 0}

MRR Movement:
- New MRR: $${revenueStats?.new_mrr?.toLocaleString() || 0}
- Churn MRR: $${revenueStats?.churn_mrr?.toLocaleString() || 0}
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Revenue</h1>
          <p className="text-muted-foreground">Manage transactions and revenue analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportRevenue} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={loadBillingData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Revenue Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueStats?.total_revenue?.toLocaleString() || 0}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {revenueStats?.growth_rate && revenueStats.growth_rate > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{revenueStats.growth_rate.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{revenueStats?.growth_rate?.toFixed(1)}%</span>
                </>
              )}
              <span>vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueStats?.mrr?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              ARR: ${revenueStats?.arr?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueStats?.active_subscriptions || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {revenueStats?.paying_users || 0} paying users
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Movement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">New:</span>
                <span className="text-green-600 font-medium">
                  +${revenueStats?.new_mrr?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Churn:</span>
                <span className="text-red-600 font-medium">
                  -${revenueStats?.churn_mrr?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{summaryStats.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-lg font-bold text-green-600">
                    ${summaryStats.revenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refunds</p>
                  <p className="text-lg font-bold text-red-600">
                    ${summaryStats.refunds.toLocaleString()}
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
                            <ArrowDownRight className="h-4 w-4 mr-1 text-red-500" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
                          )}
                          <span className={transaction.type === 'refund' ? 'text-red-600' : ''}>
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
                        <TableCell>${data.revenue.toLocaleString()}</TableCell>
                        <TableCell>{data.subscriptions}</TableCell>
                        <TableCell className="text-red-600">-{data.churn}</TableCell>
                        <TableCell>
                          <span className={data.subscriptions - data.churn >= 0 ? 'text-green-600' : 'text-red-600'}>
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
              <div className="grid grid-cols-3 gap-6">
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
                    <div className="flex justify-between">
                      <span>Enterprise:</span>
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
                        ${revenueStats?.paying_users ?
                          (revenueStats.mrr / revenueStats.paying_users).toFixed(2) : 0}
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
    </div>
  );
}