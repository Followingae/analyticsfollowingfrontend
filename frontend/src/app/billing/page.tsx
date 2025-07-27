"use client"

import { useState } from "react"
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

export default function BillingPage() {
  const invoices = [
    {
      id: "INV-001",
      date: "2024-07-01",
      amount: 1500,
      status: "paid",
      description: "Monthly subscription - Pro Plan",
      dueDate: "2024-07-15",
    },
    {
      id: "INV-002",
      date: "2024-06-01",
      amount: 1500,
      status: "paid",
      description: "Monthly subscription - Pro Plan",
      dueDate: "2024-06-15",
    },
    {
      id: "INV-003",
      date: "2024-05-01",
      amount: 1200,
      status: "paid",
      description: "Credit package - 5000 credits",
      dueDate: "2024-05-15",
    },
    {
      id: "INV-004",
      date: "2024-04-01",
      amount: 1500,
      status: "overdue",
      description: "Monthly subscription - Pro Plan",
      dueDate: "2024-04-15",
    },
  ]

  const plans = [
    {
      name: "Starter",
      price: 49,
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
      price: 149,
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
      price: 499,
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
          "--sidebar-width": "calc(var(--spacing) * 72)",
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

            {/* Current Plan Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Pro Plan</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(149)}/month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,450</div>
                  <Progress value={49} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    51% of monthly allowance used
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Aug 1</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(149)} will be charged
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(5700)}</div>
                  <p className="text-xs text-muted-foreground">
                    This year
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alert for overdue payments */}
            {invoices.some(invoice => invoice.status === 'overdue') && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="flex items-center gap-4 pt-6">
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
                {/* Credits and Usage */}
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
                      <div className="flex justify-between text-sm">
                        <span>Used this month</span>
                        <span className="font-medium">2,550 credits</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining</span>
                        <span className="font-medium">2,450 credits</span>
                      </div>
                      <Progress value={51} className="h-3" />
                      <div className="text-xs text-muted-foreground">
                        51% of monthly allowance used
                      </div>
                      
                      <div className="pt-4 space-y-2">
                        <h4 className="text-sm font-medium">Credit Usage Breakdown</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profile Analytics</span>
                            <span>1,850 credits</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Campaign Tracking</span>
                            <span>450 credits</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Creator Discovery</span>
                            <span>250 credits</span>
                          </div>
                        </div>
                      </div>
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
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">1,000 Credits</div>
                            <div className="text-sm text-muted-foreground">Basic package</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(49)}</div>
                            <Button size="sm" variant="outline">Buy</Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">5,000 Credits</div>
                            <div className="text-sm text-muted-foreground">Popular choice</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(199)}</div>
                            <Button size="sm">Buy</Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">10,000 Credits</div>
                            <div className="text-sm text-muted-foreground">Best value</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(349)}</div>
                            <Button size="sm" variant="outline">Buy</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                          <p className="text-xs text-muted-foreground">July 2024 - {formatCurrency(189)} spent</p>
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
                        <span className="text-sm font-medium">{formatCurrency(156)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Cost per Analysis</p>
                          <p className="text-xs text-muted-foreground">Creator profile analysis</p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(2.5)}</span>
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
                              Save {formatCurrency(45)}/month with unlimited creator unlocks
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
                              Switch to annual billing and save {formatCurrency(358)} per year
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
    </SidebarProvider>
  )
}