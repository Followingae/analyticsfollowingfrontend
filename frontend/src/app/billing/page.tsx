"use client"

import { useState, useEffect } from "react"
import {
  CreditCard,
  DollarSign,
  Calendar,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Zap,
  Star,
  Settings,
  Shield,
  Receipt,
  AlertTriangle,
  TrendingUp,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { creditsApiService } from "@/services/creditsApi"
import { CreditDashboard, CreditTransaction, PricingRule } from "@/types"
import { formatCredits, formatCreditDate, getCreditBalanceStatus } from "@/utils/creditUtils"
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal"
import { toast } from "sonner"

export default function BillingPage() {
  // State for real data
  const [creditDashboard, setCreditDashboard] = useState<CreditDashboard | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [pricing, setPricing] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // Load credit dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const [dashboardResult, pricingResult] = await Promise.all([
          creditsApiService.getDashboard(),
          creditsApiService.getAllPricing()
        ])

        if (dashboardResult.success && dashboardResult.data) {
          setCreditDashboard(dashboardResult.data)
        }

        if (pricingResult.success && pricingResult.data) {
          setPricing(pricingResult.data)
        }

        if (!dashboardResult.success) {
          setError(dashboardResult.error || 'Failed to load dashboard data')
        }
      } catch (err) {
        setError('Network error loading billing data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setTransactionsLoading(true)
        const result = await creditsApiService.getTransactions(20, 0)

        if (result.success && result.data) {
          setTransactions(result.data.transactions || [])
        }
      } catch (err) {
        console.error('Failed to load transactions:', err)
      } finally {
        setTransactionsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  // Handle credit purchase
  const handlePurchaseCredits = async (credits: number) => {
    try {
      // For now, show modal - payment integration will come later
      setShowPurchaseModal(true)
      toast.info('Payment integration coming soon!')
    } catch (error) {
      toast.error('Failed to process purchase')
    }
  }

  // Mock invoices for billing history (until payment system is integrated)
  const invoices = [
    {
      id: "INV-001",
      date: "2024-07-01",
      amount: 5505,
      status: "paid",
      description: "Monthly subscription - Pro Plan",
      dueDate: "2024-07-15",
    },
    {
      id: "INV-002",
      date: "2024-06-01",
      amount: 5505,
      status: "paid",
      description: "Monthly subscription - Pro Plan",
      dueDate: "2024-06-15",
    },
    {
      id: "INV-003",
      date: "2024-05-01",
      amount: 4404,
      status: "paid",
      description: "Credit package - 5000 credits",
      dueDate: "2024-05-15",
    },
    {
      id: "INV-004",
      date: "2024-04-01",
      amount: 5505,
      status: "overdue",
      description: "Monthly subscription - Pro Plan",
      dueDate: "2024-04-15",
    },
  ]

  const plans = [
    {
      name: "Starter",
      price: 180,
      period: "month",
      features: [
        "1,000 creator unlocks",
        "Basic analytics",
        "Email support",
        "5 active campaigns",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: 547,
      period: "month",
      features: [
        "5,000 creator unlocks",
        "Advanced analytics",
        "Priority support",
        "25 active campaigns",
        "Custom reporting",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: 1831,
      period: "month",
      features: [
        "Unlimited creator unlocks",
        "Enterprise analytics",
        "Dedicated support",
        "Unlimited campaigns",
        "White-label solution",
        "API access",
      ],
      popular: false,
    },
  ]

  const formatCurrency = (amount: number) => {
    const formattedAmount = new Intl.NumberFormat('ar-AE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return (
      <>
        <span className="aed-currency">AED</span> {formattedAmount}
      </>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Billing & Subscription Hub</h1>
                <p className="text-muted-foreground">
                  Manage your subscription plans, credits usage, and billing with comprehensive analytics
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Payment Methods
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoices
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Credits
                </Button>
              </div>
            </div>

            {/* Current Plan Overview - Now using real data */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({length: 4}).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                      <div className="h-8 w-3/4 bg-muted animate-pulse rounded mb-1" />
                      <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-red-600">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {creditDashboard?.wallet.package_name || 'Free'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {creditDashboard?.wallet.wallet_status === 'active' ? 'Active' : 'Inactive'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {creditDashboard ? formatCredits(creditDashboard.wallet.current_balance) : '--'}
                    </div>
                    {creditDashboard && (
                      <>
                        <Progress 
                          value={
                            creditDashboard.wallet.monthly_allowance > 0 
                              ? (creditDashboard.wallet.current_balance / creditDashboard.wallet.monthly_allowance) * 100 
                              : 0
                          } 
                          className="mt-2" 
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          of {formatCredits(creditDashboard.wallet.monthly_allowance)} monthly allowance
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {creditDashboard ? formatCredits(creditDashboard.monthly_usage.total_spent) : '--'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {creditDashboard ? `${creditDashboard.monthly_usage.actions_performed} actions` : '--'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unlocked Profiles</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {creditDashboard?.unlocked_influencers_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total analyzed
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Alert for overdue payments */}
            {invoices.some(invoice => invoice.status === 'overdue') && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="flex items-center gap-4 pt-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-200">Payment Required</h3>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      You have overdue invoices that require immediate attention.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tabs for different sections */}
            <Tabs defaultValue="plans" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
                <TabsTrigger value="billing">Billing History</TabsTrigger>
                <TabsTrigger value="credits">Credits & Usage</TabsTrigger>
              </TabsList>
              
              <TabsContent value="plans" className="space-y-6">
                {/* Pricing Plans */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                    <CardDescription>
                      Choose the plan that best fits your Instagram analytics needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      {plans.map((plan) => (
                        <div
                          key={plan.name}
                          className={`relative rounded-lg border p-6 ${
                            plan.popular ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          {plan.popular && (
                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                              Most Popular
                            </Badge>
                          )}
                          <div className="text-center">
                            <h3 className="text-lg font-semibold">{plan.name}</h3>
                            <div className="mt-2">
                              <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                              <span className="text-muted-foreground">/{plan.period}</span>
                            </div>
                          </div>
                          <ul className="mt-6 space-y-3">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button
                            className="mt-6 w-full"
                            variant={plan.popular ? "default" : "outline"}
                          >
                            {plan.name === "Pro" ? "Current Plan" : "Upgrade"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                {/* Billing History */}
                <Card>
                  <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                      <CardTitle>Billing History</CardTitle>
                      <CardDescription>
                        Your recent invoices and payment history
                      </CardDescription>
                    </div>
                    <Button size="sm" className="ml-auto gap-1">
                      <Download className="h-4 w-4" />
                      Download All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{invoice.id}</div>
                                <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                                  {invoice.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(invoice.status)}
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Receipt className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {invoice.status === 'overdue' && (
                                    <DropdownMenuItem>
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Pay Now
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credits" className="space-y-6">
                {/* Credits and Usage - Now with real data */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Credit Usage
                      </CardTitle>
                      <CardDescription>
                        Track your monthly credit consumption
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {creditDashboard ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Used this month</span>
                            <span className="font-medium">{formatCredits(creditDashboard.monthly_usage.total_spent)} credits</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Remaining</span>
                            <span className="font-medium">{formatCredits(creditDashboard.wallet.current_balance)} credits</span>
                          </div>
                          <Progress 
                            value={
                              creditDashboard.wallet.monthly_allowance > 0 
                                ? (creditDashboard.monthly_usage.total_spent / creditDashboard.wallet.monthly_allowance) * 100 
                                : 0
                            } 
                            className="h-3" 
                          />
                          <div className="text-xs text-muted-foreground">
                            {Math.round((creditDashboard.monthly_usage.total_spent / creditDashboard.wallet.monthly_allowance) * 100)}% of monthly allowance used
                          </div>
                          
                          <div className="pt-4 space-y-2">
                            <h4 className="text-sm font-medium">Credit Usage Breakdown</h4>
                            <div className="space-y-1 text-sm">
                              {creditDashboard.monthly_usage.top_actions.map((action, index) => (
                                <div key={action} className="flex justify-between">
                                  <span className="text-muted-foreground capitalize">
                                    {action.replace(/_/g, ' ')}
                                  </span>
                                  <span>{Math.round(creditDashboard.monthly_usage.total_spent * (0.7 - index * 0.2))} credits</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="h-4 bg-muted animate-pulse rounded" />
                          <div className="h-4 bg-muted animate-pulse rounded" />
                          <div className="h-2 bg-muted animate-pulse rounded" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Buy Additional Credits
                      </CardTitle>
                      <CardDescription>
                        Purchase credit packages for extended usage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <div className="font-medium">1,000 Credits</div>
                            <div className="text-sm text-muted-foreground">Basic package</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(180)}</div>
                            <Button size="sm" variant="outline" onClick={() => handlePurchaseCredits(1000)}>
                              Buy
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <div className="font-medium">5,000 Credits</div>
                            <div className="text-sm text-muted-foreground">Popular choice</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(730)}</div>
                            <Button size="sm" onClick={() => handlePurchaseCredits(5000)}>
                              Buy
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <div className="font-medium">10,000 Credits</div>
                            <div className="text-sm text-muted-foreground">Best value</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(1281)}</div>
                            <Button size="sm" variant="outline" onClick={() => handlePurchaseCredits(10000)}>
                              Buy
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Real Transaction History */}
                      {transactions.length > 0 && (
                        <div className="pt-4 space-y-2">
                          <h4 className="text-sm font-medium">Recent Transactions</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {transactions.slice(0, 5).map((transaction) => (
                              <div key={transaction.id} className="flex justify-between text-xs p-2 bg-muted rounded">
                                <span className="capitalize">
                                  {transaction.action_type.replace(/_/g, ' ')}
                                </span>
                                <span className={transaction.transaction_type === 'debit' ? 'text-red-600' : 'text-green-600'}>
                                  {transaction.transaction_type === 'debit' ? '-' : '+'}{formatCredits(Math.abs(transaction.amount))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Pricing Rules Display */}
                {pricing.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Pricing</CardTitle>
                      <CardDescription>
                        Credit costs for premium features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        {pricing.map((rule) => (
                          <div key={rule.action_type} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium capitalize">
                                {rule.action_type.replace(/_/g, ' ')}
                              </div>
                              {rule.free_allowance_per_month > 0 && (
                                <div className="text-sm text-green-600">
                                  {rule.free_allowance_per_month} free/month
                                </div>
                              )}
                            </div>
                            <Badge variant="outline">
                              {formatCredits(rule.credits_per_action)} credits
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Usage Analytics & Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Usage Analytics & Cost Optimization
                </CardTitle>
                <CardDescription>
                  Track your spending patterns and get recommendations to optimize your subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Monthly Usage Trends</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Peak Usage Month</p>
                          <p className="text-xs text-muted-foreground">July 2024 - {formatCurrency(694)} spent</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          +23%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Average Monthly Cost</p>
                          <p className="text-xs text-muted-foreground">Based on last 6 months</p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(573)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Cost per Analysis</p>
                          <p className="text-xs text-muted-foreground">Creator profile analysis</p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(9.2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Optimization Recommendations</h4>
                    <div className="space-y-3">
                      <div className="p-3 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Consider upgrading to Enterprise
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-300">
                              Save {formatCurrency(165)}/month with unlimited creator unlocks
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Bulk credit purchase discount
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              Buy 10,000 credits and save 15% on your next purchase
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                              Annual billing savings
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-300">
                              Switch to annual billing and save {formatCurrency(1314)} per year
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Purchase Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        actionName="purchase credits"
        message="Payment integration coming soon! Contact support for custom packages."
      />
    </SidebarProvider>
  )
}
