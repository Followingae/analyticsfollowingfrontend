'use client'

import { useState } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  BarChart3
} from 'lucide-react'

export function FinancialDashboard() {
  const { hasPermission } = useEnhancedAuth()
  const [showCreditAdjustment, setShowCreditAdjustment] = useState(false)
  const [showBulkCredits, setShowBulkCredits] = useState(false)

  // Mock financial data
  const financialStats = {
    totalRevenue: 245670,
    monthlyRevenue: 45230,
    mrr: 38750,
    arpu: 127.50,
    totalCreditsIssued: 850000,
    totalCreditsSpent: 620000,
    creditUtilizationRate: 72.9,
    churnRate: 3.2,
    revenueGrowth: 12.5
  }

  const recentTransactions = [
    {
      id: '1',
      user_email: 'john@techcorp.com',
      type: 'subscription',
      amount: 99.00,
      description: 'Premium Plan - Monthly',
      status: 'completed',
      created_at: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      user_email: 'startup@brand.com',
      type: 'credits',
      amount: 49.99,
      description: '500 Credits Package',
      status: 'completed',
      created_at: '2024-01-20T12:15:00Z'
    },
    {
      id: '3',
      user_email: 'enterprise@corp.com',
      type: 'refund',
      amount: -199.00,
      description: 'Enterprise Plan Refund',
      status: 'processed',
      created_at: '2024-01-19T16:45:00Z'
    }
  ]

  const creditWallets = [
    {
      id: '1',
      user_email: 'john@techcorp.com',
      balance: 150,
      total_purchased: 500,
      total_spent: 350,
      subscription_tier: 'brand_premium'
    },
    {
      id: '2',
      user_email: 'startup@brand.com',
      balance: 75,
      total_purchased: 200,
      total_spent: 125,
      subscription_tier: 'brand_standard'
    },
    {
      id: '3',
      user_email: 'newbie@startup.com',
      balance: 5,
      total_purchased: 0,
      total_spent: 0,
      subscription_tier: 'brand_free'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">
            Revenue tracking, credit management, and financial analytics
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Credit Operations</DialogTitle>
                  <DialogDescription>
                    Grant or adjust credits for multiple users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Users</Label>
                    <Input placeholder="Enter email addresses separated by commas" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Operation</Label>
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
                    <div>
                      <Label>Amount</Label>
                      <Input type="number" placeholder="Credit amount" />
                    </div>
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea placeholder="Reason for credit adjustment..." />
                  </div>
                  <div className="flex space-x-2">
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

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              All-time platform revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              +{financialStats.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.mrr)}</div>
            <p className="text-xs text-muted-foreground">
              MRR from subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.arpu)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly ARPU
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Credit System Overview</CardTitle>
          <CardDescription>Platform-wide credit statistics and management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {financialStats.totalCreditsIssued.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Credits Issued</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {financialStats.totalCreditsSpent.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Credits Spent</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {financialStats.creditUtilizationRate}%
              </div>
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
            </div>
          </div>

          {/* Credit Wallets Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Credit Wallets</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
                <Dialog open={showCreditAdjustment} onOpenChange={setShowCreditAdjustment}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-3 w-3" />
                      Adjust Credits
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Credit Adjustment</DialogTitle>
                      <DialogDescription>
                        Adjust credits for a specific user
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>User Email</Label>
                        <Input placeholder="user@example.com" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Adjustment Type</Label>
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
                        <div>
                          <Label>Amount</Label>
                          <Input type="number" placeholder="Credit amount" />
                        </div>
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Textarea placeholder="Reason for adjustment..." />
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCreditAdjustment(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1">Apply Adjustment</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Purchased</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditWallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell className="font-medium">{wallet.user_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {wallet.subscription_tier.replace('brand_', '')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getBalanceBadgeVariant(wallet.balance)}>
                          {wallet.balance} credits
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {wallet.total_purchased.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {wallet.total_spent.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest financial transactions and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
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
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.user_email}</TableCell>
                    <TableCell>
                      <Badge variant={getTransactionBadgeVariant(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}