"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { superadminApiService, CreditOverview, Transaction } from "@/services/superadminApi"
import { SiteHeader } from "@/components/site-header"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RefreshCw, DollarSign, CreditCard, TrendingUp, Users, Search } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function SuperadminCreditsPage() {
  const [creditOverview, setCreditOverview] = useState<CreditOverview | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdjustCreditsOpen, setIsAdjustCreditsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [creditAdjustment, setCreditAdjustment] = useState({
    operation: 'add' as 'add' | 'deduct',
    amount: 0,
    reason: '',
    transaction_type: 'admin_adjustment'
  })

  // Filters
  const [transactionFilters, setTransactionFilters] = useState({
    transaction_type: 'all',
    user_email: '',
    limit: 50
  })

  const loadCreditsData = async () => {
    try {
      setLoading(true)

      // Load credit overview with error handling
      try {
        const overviewResult = await superadminApiService.getCreditOverview()
        if (overviewResult.success && overviewResult.data) {
          setCreditOverview(overviewResult.data)
        } else {
          console.warn('Credits overview API returned error:', overviewResult.error)
        }
      } catch (error) {
        console.error('Failed to load credits overview:', error)
      }

      // Load transactions with error handling
      try {
        const transactionsResult = await superadminApiService.getTransactions({ limit: 50 })
        if (transactionsResult.success && transactionsResult.data) {
          setTransactions(transactionsResult.data.transactions || [])
        } else {
          console.warn('Transactions API returned error:', transactionsResult.error)
        }
      } catch (error) {
        console.error('Failed to load transactions:', error)
      }

      // Load revenue analytics with error handling
      try {
        const revenueResult = await superadminApiService.getRevenueAnalytics('30d')
        if (revenueResult.success && revenueResult.data) {
          setRevenueAnalytics(revenueResult.data)
        } else {
          console.warn('Revenue analytics API returned error:', revenueResult.error)
        }
      } catch (error) {
        console.error('Failed to load revenue analytics:', error)
      }
    } catch (error) {
      toast.error('Failed to load credits data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const filters: any = { limit: transactionFilters.limit }
      if (transactionFilters.transaction_type !== 'all') {
        filters.transaction_type = transactionFilters.transaction_type
      }
      if (transactionFilters.user_email.trim()) {
        filters.user_email = transactionFilters.user_email.trim()
      }

      const result = await superadminApiService.getTransactions(filters)
      if (result.success && result.data) {
        setTransactions(result.data.transactions || [])
      }
    } catch (error) {
      toast.error('Failed to load transactions')
    }
  }

  const handleAdjustCredits = async () => {
    if (!selectedUserId || !creditAdjustment.amount || !creditAdjustment.reason.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const result = await superadminApiService.adjustUserCredits(selectedUserId, creditAdjustment)
      if (result.success) {
        toast.success(`Credits ${creditAdjustment.operation === 'add' ? 'added' : 'deducted'} successfully`)
        setIsAdjustCreditsOpen(false)
        setCreditAdjustment({ operation: 'add', amount: 0, reason: '', transaction_type: 'admin_adjustment' })
        setSelectedUserId("")
        loadCreditsData() // Refresh data
      } else {
        toast.error(result.error || 'Failed to adjust credits')
      }
    } catch (error) {
      toast.error('Network error while adjusting credits')
    }
  }

  useEffect(() => {
    loadCreditsData()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [transactionFilters])

  const formatNumber = (num: any) => {
    if (num === undefined || num === null || num === '' || typeof num !== 'number' || isNaN(num)) {
      return '0'
    }
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100) // Convert cents to dollars
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AuthGuard requireAuth={true} requireSuperAdmin={true}>
      <SidebarProvider>
        <SuperadminSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Credits & Billing</h1>
                  <p className="text-muted-foreground">Manage credit system and billing operations</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadCreditsData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={isAdjustCreditsOpen} onOpenChange={setIsAdjustCreditsOpen}>
                    <DialogTrigger asChild>
                      <Button style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Adjust Credits
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust User Credits</DialogTitle>
                        <DialogDescription>Manually adjust a user's credit balance</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium">User ID</label>
                          <Input
                            placeholder="Enter user ID"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Operation</label>
                          <Select value={creditAdjustment.operation} onValueChange={(value: any) =>
                            setCreditAdjustment(prev => ({ ...prev, operation: value }))
                          }>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="add">Add Credits</SelectItem>
                              <SelectItem value="deduct">Deduct Credits</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Amount</label>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={creditAdjustment.amount || ''}
                            onChange={(e) => setCreditAdjustment(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Reason</label>
                          <Input
                            placeholder="Reason for adjustment"
                            value={creditAdjustment.reason}
                            onChange={(e) => setCreditAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAdjustCreditsOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAdjustCredits} style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                          Adjust Credits
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4 md:grid-cols-4">
                  {[1,2,3,4].map(i => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      </CardHeader>
                      <CardContent>
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : creditOverview ? (
                <>
                  {/* Credit Overview Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                        <DollarSign className="h-4 w-4 text-[hsl(var(--primary))]" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatNumber(creditOverview.overview.total_credits_in_system)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          In circulation
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))]" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatNumber(creditOverview.overview.total_spent_all_time)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          All time
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                        <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatNumber(creditOverview.overview.active_wallets)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          With credits
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
                        <CreditCard className="h-4 w-4 text-[hsl(var(--primary))]" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatNumber(creditOverview.overview.recent_transactions_24h)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last 24 hours
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Spenders */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Credit Spenders</CardTitle>
                      <CardDescription>Users with highest credit expenditure</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {creditOverview.top_spenders.slice(0, 5).map((spender, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{spender.full_name}</p>
                              <p className="text-xs text-muted-foreground">{spender.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatNumber(spender.total_spent)} spent</p>
                              <p className="text-xs text-muted-foreground">{formatNumber(spender.current_balance)} current</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Rules */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Credit Pricing Rules</CardTitle>
                      <CardDescription>Current pricing for platform actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {creditOverview.pricing_rules.map((rule, index) => (
                          <div key={index} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{rule.action_type.replace('_', ' ')}</h4>
                              <Badge variant={rule.is_active ? "default" : "secondary"}>
                                {rule.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Cost per action:</span>
                                <span>{formatNumber(rule.cost_per_action)} credits</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Free monthly:</span>
                                <span>{formatNumber(rule.free_monthly_allowance)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Credits Data Unavailable</h3>
                  <p className="text-muted-foreground mb-4">
                    Unable to load credit system data. This could be due to:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-6 max-w-md mx-auto">
                    <li>• Backend API endpoints not yet implemented</li>
                    <li>• Network connectivity issues</li>
                    <li>• Insufficient permissions</li>
                  </ul>
                  <Button variant="outline" onClick={loadCreditsData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Latest credit transactions across the platform</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search by email..."
                          value={transactionFilters.user_email}
                          onChange={(e) => setTransactionFilters(prev => ({ ...prev, user_email: e.target.value }))}
                          className="w-[200px] pl-10"
                        />
                      </div>
                      <Select value={transactionFilters.transaction_type} onValueChange={(value) =>
                        setTransactionFilters(prev => ({ ...prev, transaction_type: value }))
                      }>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="spend">Spend</SelectItem>
                          <SelectItem value="refund">Refund</SelectItem>
                          <SelectItem value="admin_adjustment">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{transaction.user.full_name}</p>
                              <p className="text-xs text-muted-foreground">{transaction.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {transaction.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-medium ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{formatNumber(transaction.amount)}
                          </TableCell>
                          <TableCell>{formatNumber(transaction.current_balance)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(transaction.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}