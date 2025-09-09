'use client'

import { useState, useEffect } from "react"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Wallet,
  Users,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Download,
  DollarSign
} from "lucide-react"

import { 
  superadminApiService, 
  CreditOverview,
  Transaction
} from "@/services/superadminApi"

export default function CreditsPage() {
  // State Management
  const [creditOverview, setCreditOverview] = useState<CreditOverview | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Load credit data
  const loadCreditData = async () => {
    setLoading(true)
    try {
      const [creditResult, transactionResult] = await Promise.all([
        superadminApiService.getCreditOverview(),
        superadminApiService.getTransactions({ limit: 100 })
      ])
      
      if (creditResult.success && creditResult.data) {
        setCreditOverview(creditResult.data)
      }
      if (transactionResult.success && transactionResult.data) {
        setTransactions(transactionResult.data.transactions || [])
      }
    } catch (error) {
      console.warn('Credits API not available - superadmin endpoints not implemented')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCreditData()
  }, [])

  // Utility functions
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <SuperadminSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading credits data...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 66)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SuperadminSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Credits & Billing</h1>
                <p className="text-muted-foreground">Monitor platform credits, transactions, and financial health</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => loadCreditData()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>

            {/* Credit Overview Cards */}
            {creditOverview && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                    <Wallet className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(creditOverview.overview.total_credits_in_system)}</div>
                    <p className="text-xs text-muted-foreground">
                      System circulation
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(creditOverview.overview.total_spent_all_time)}</div>
                    <p className="text-xs text-muted-foreground">
                      All-time spending
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(creditOverview.overview.total_earned_all_time)}</div>
                    <p className="text-xs text-muted-foreground">
                      All-time earnings
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(creditOverview.overview.active_wallets)}</div>
                    <p className="text-xs text-muted-foreground">
                      Users with credits
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Top Spenders & System Health */}
            {creditOverview && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Spenders</CardTitle>
                    <CardDescription>Users with highest credit spending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {creditOverview.top_spenders.slice(0, 5).map((spender, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{spender.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{spender.full_name}</div>
                              <div className="text-xs text-muted-foreground">{spender.email}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{formatNumber(spender.total_spent)} spent</div>
                            <div className="text-xs text-muted-foreground">{formatNumber(spender.current_balance)} balance</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Credit System Health</CardTitle>
                    <CardDescription>Overall system credit flow metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Credit Flow Ratio</span>
                        <Badge variant="secondary">{creditOverview.system_health.credit_flow_ratio.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Average Wallet Balance</span>
                        <span className="font-medium">{formatNumber(creditOverview.system_health.average_wallet_balance)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Recent Transactions (24h)</span>
                        <Badge variant="secondary">{creditOverview.overview.recent_transactions_24h}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest credit transactions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 15).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{transaction.user.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{transaction.user.full_name}</div>
                              <div className="text-xs text-muted-foreground">{transaction.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {transaction.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={transaction.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {transaction.amount > 0 ? '+' : ''}{formatNumber(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatNumber(transaction.current_balance)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(transaction.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {transactions.length === 0 && (
                  <div className="py-12 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                    <p className="text-muted-foreground">
                      Transaction data will appear here once available from the backend.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Rules */}
            {creditOverview && creditOverview.pricing_rules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Rules</CardTitle>
                  <CardDescription>Current credit pricing structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {creditOverview.pricing_rules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <div className="font-medium capitalize">{rule.action_type.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.free_monthly_allowance > 0 && `${rule.free_monthly_allowance} free per month`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{rule.cost_per_action} credits</div>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}