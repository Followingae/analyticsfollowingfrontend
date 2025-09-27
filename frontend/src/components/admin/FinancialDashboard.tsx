'use client'

import { useState, useEffect } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { superadminApiService, CreditOverview, Transaction } from '@/services/superadminApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Coins,
  CreditCard,
  Users,
  Download,
  Plus,
  Minus,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  Calendar,
  FileText
} from 'lucide-react'

export function FinancialDashboard() {
  const { hasPermission } = useEnhancedAuth()
  const { formatAmount, currencyInfo } = useCurrency()
  const [showCreditAdjustment, setShowCreditAdjustment] = useState(false)
  const [showBulkCredits, setShowBulkCredits] = useState(false)
  const [creditOverview, setCreditOverview] = useState<CreditOverview | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load financial data from superadmin API
  const loadFinancialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [creditResult, transactionsResult] = await Promise.all([
        superadminApiService.getCreditOverview(),
        superadminApiService.getTransactions({ limit: 10 })
      ])

      if (creditResult.success && creditResult.data) {
        setCreditOverview(creditResult.data)
      } else {
        console.warn('Credit overview API failed:', creditResult.error)
      }

      if (transactionsResult.success && transactionsResult.data) {
        setTransactions(transactionsResult.data.transactions || [])
      } else {
        console.warn('Transactions API failed:', transactionsResult.error)
      }
    } catch (error) {
      setError('Failed to load financial data')
      console.error('Financial data error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinancialData()
  }, [])


  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--primary))'
    },
    growth: {
      label: 'Growth %',
      color: 'hsl(var(--muted-foreground))'
    },
    amount: {
      label: 'Amount',
      color: 'hsl(var(--primary))'
    }
  }




  const formatCurrency = (amountCents: number) => {
    return formatAmount(amountCents)
  }

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'subscription': return 'default'
      case 'credits': return 'secondary'
      case 'refund': return 'destructive'
      default: return 'outline'
    }
  }

  const getBalanceBadgeVariant = (balance: number) => {
    if (balance > 100) return 'default'
    if (balance > 20) return 'secondary'
    return 'destructive'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-muted rounded w-48 animate-pulse" />
              <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
            </div>
            <div className="flex space-x-2">
              <div className="h-10 bg-muted rounded w-32 animate-pulse" />
              <div className="h-10 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded animate-pulse" />
            <div className="h-96 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={loadFinancialData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
          <p className="text-muted-foreground">
            Revenue tracking, credit management, and financial insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          {hasPermission('can_adjust_credits') && (
            <Dialog open={showBulkCredits} onOpenChange={setShowBulkCredits}>
              <DialogTrigger asChild>
                <Button>
                  <Coins className="mr-2 h-4 w-4" />
                  Bulk Credits
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Bulk Credit Operations</DialogTitle>
                  <DialogDescription>
                    Grant or adjust credits for multiple users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="users">Select Users</Label>
                    <Input
                      id="users"
                      placeholder="Enter email addresses separated by commas"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operation">Operation</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grant">Grant Credits</SelectItem>
                          <SelectItem value="deduct">Deduct Credits</SelectItem>
                          <SelectItem value="bonus">Bonus Credits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input id="amount" type="number" placeholder="Credit amount" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea id="reason" placeholder="Reason for credit adjustment..." />
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowBulkCredits(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1">Execute Operation</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(creditOverview?.overview?.total_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" />
              All-time platform revenue
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(creditOverview?.overview?.monthly_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" />
              Current month revenue
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency((creditOverview?.overview?.active_wallets || 0) * 100)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              MRR from subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Revenue Per User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency((creditOverview?.overview?.total_revenue ?? 0) / Math.max(creditOverview?.overview?.active_wallets ?? 1, 1))}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly ARPU
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Monthly revenue growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={creditOverview?.overview ? [creditOverview.overview] : []}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const symbol = currencyInfo?.symbol || '$'
                      return `${symbol}${(value / 1000).toFixed(0)}k`
                    }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [
                      formatCurrency(value as number),
                      name === 'revenue' ? 'Revenue' : 'Growth %'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Subscription Tiers
            </CardTitle>
            <CardDescription>Revenue distribution by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={creditOverview?.overview ? [{ name: 'Active Wallets', value: creditOverview.overview.active_wallets }] : []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {(creditOverview?.overview ? [{ name: 'Active Wallets', value: creditOverview.overview.active_wallets }] : []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => [
                      formatCurrency(value as number),
                      `${props.payload.tier} (${props.payload.count} users)`
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => `${entry.payload.tier} (${entry.payload.count})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Transaction Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Transaction Volume
          </CardTitle>
          <CardDescription>Daily transaction amounts for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditOverview?.overview ? [{ name: 'Transactions', value: creditOverview.overview.recent_transactions_24h }] : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const symbol = currencyInfo?.symbol || '$'
                    return `${symbol}${(value / 1000).toFixed(1)}k`
                  }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value) => [formatCurrency(value as number), 'Amount']}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Credit System Overview */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Credit Overview</TabsTrigger>
          <TabsTrigger value="wallets">User Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credits Issued</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {creditOverview?.overview ? creditOverview.overview.total_credits_in_system.toLocaleString() : '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total credits distributed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credits Spent</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {creditOverview?.overview ? creditOverview.overview.total_spent_all_time.toLocaleString() : '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform usage credits
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Utilization Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {creditOverview?.overview ? Math.round((creditOverview.overview.total_spent_all_time / creditOverview.overview.total_credits_in_system) * 100) : 0}%
                </div>
                <Progress value={creditOverview?.overview ? Math.round((creditOverview.overview.total_spent_all_time / creditOverview.overview.total_credits_in_system) * 100) : 0} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Credits actively used
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">User Credit Wallets</h3>
              <p className="text-sm text-muted-foreground">Manage individual user credit balances</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={loadFinancialData}>
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
              {hasPermission('can_adjust_credits') && (
                <Dialog open={showCreditAdjustment} onOpenChange={setShowCreditAdjustment}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-3 w-3" />
                      Adjust Credits
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Credit Adjustment</DialogTitle>
                      <DialogDescription>
                        Adjust credits for a specific user
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-email">User Email</Label>
                        <Input id="user-email" placeholder="Enter user email address" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="adjustment-type">Adjustment Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grant">Grant Credits</SelectItem>
                              <SelectItem value="deduct">Deduct Credits</SelectItem>
                              <SelectItem value="refund">Refund Credits</SelectItem>
                              <SelectItem value="bonus">Bonus Credits</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="credit-amount">Amount</Label>
                          <Input id="credit-amount" type="number" placeholder="Credit amount" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustment-reason">Reason</Label>
                        <Textarea id="adjustment-reason" placeholder="Reason for adjustment..." />
                      </div>
                      <div className="flex space-x-2 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCreditAdjustment(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1">Apply Adjustment</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Purchased</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(creditOverview?.top_spenders || []).map((wallet) => (
                  <TableRow key={wallet.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{wallet.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        Premium
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getBalanceBadgeVariant(wallet.current_balance)}>
                        {wallet.current_balance} credits
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {wallet.total_spent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {wallet.total_spent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost">
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <p className="text-sm text-muted-foreground">Latest financial transactions and payments</p>
            </div>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-3 w-3" />
              View All
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(creditOverview?.top_spenders || []).slice(0, 3).map((transaction, index) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{transaction.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="capitalize">
                        spending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">Total spending activity</TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      -{formatCurrency(transaction.total_spent)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="capitalize">
                        completed
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}