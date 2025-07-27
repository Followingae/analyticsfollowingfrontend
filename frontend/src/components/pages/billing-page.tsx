"use client"

import * as React from "react"
import { useState } from "react"
import { 
  CreditCard, 
  Download, 
  Calendar,
  DollarSign,
  Zap,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  Crown,
  Star,
  Users,
  Eye
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MetricCard } from "@/components/analytics-cards"

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  credits: number
  isPopular?: boolean
  isCurrent?: boolean
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  description: string
  downloadUrl?: string
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    interval: "monthly",
    credits: 500,
    features: [
      "500 creator unlocks per month",
      "Basic analytics dashboard",
      "Email support",
      "Export to PDF/Excel"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    interval: "monthly",
    credits: 2000,
    features: [
      "2,000 creator unlocks per month",
      "Advanced analytics & insights",
      "Campaign management",
      "Priority support",
      "Custom branding",
      "API access"
    ],
    isPopular: true,
    isCurrent: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    interval: "monthly",
    credits: 10000,
    features: [
      "10,000 creator unlocks per month",
      "White-label solution",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced reporting",
      "24/7 phone support"
    ]
  }
]

const sampleInvoices: Invoice[] = [
  {
    id: "INV-2024-001",
    date: "2024-01-15",
    amount: 99,
    status: "paid",
    description: "Professional Plan - January 2024",
    downloadUrl: "#"
  },
  {
    id: "INV-2023-012",
    date: "2023-12-15",
    amount: 99,
    status: "paid",
    description: "Professional Plan - December 2023",
    downloadUrl: "#"
  },
  {
    id: "INV-2023-011",
    date: "2023-11-15",
    amount: 99,
    status: "paid",
    description: "Professional Plan - November 2023",
    downloadUrl: "#"
  }
]

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("subscription")
  const [invoices] = useState<Invoice[]>(sampleInvoices)

  const currentPlan = subscriptionPlans.find(plan => plan.isCurrent)
  const creditsUsed = 1550
  const creditsRemaining = (currentPlan?.credits || 0) - creditsUsed
  const usagePercentage = ((creditsUsed / (currentPlan?.credits || 1)) * 100)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3" />
      case 'pending': return <AlertCircle className="h-3 w-3" />
      case 'failed': return <AlertCircle className="h-3 w-3" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-muted-foreground">Manage your subscription and view billing history</p>
        </div>
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Customer Portal
        </Button>
      </div>

      {/* Usage Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Current Plan"
          value={currentPlan?.name || "No Plan"}
          icon={<Crown className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Credits Used"
          value={`${creditsUsed.toLocaleString()}`}
          change={15}
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Credits Remaining"
          value={`${creditsRemaining.toLocaleString()}`}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Monthly Spend"
          value={formatCurrency(currentPlan?.price || 0)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Credit Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Credit Usage
          </CardTitle>
          <CardDescription>
            Track your monthly credit usage and remaining balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Credits Used This Month</span>
              <span className="font-medium">
                {creditsUsed.toLocaleString()} / {(currentPlan?.credits || 0).toLocaleString()}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Resets on February 15, 2024</span>
              <span>{usagePercentage.toFixed(1)}% used</span>
            </div>
          </div>
          
          {usagePercentage > 80 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/10 dark:border-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                You're approaching your credit limit. Consider upgrading your plan.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="usage">Usage Details</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan */}
          {currentPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {currentPlan.name}
                      {currentPlan.isPopular && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          Popular
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(currentPlan.price)}/{currentPlan.interval}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Next billing date</p>
                    <p className="font-medium">February 15, 2024</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Plan Features</h4>
                  <ul className="space-y-1">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Plans */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Plans</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.isPopular ? 'border-blue-500' : ''}`}>
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      {plan.name}
                      {plan.isCurrent && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </CardTitle>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold">{formatCurrency(plan.price)}</p>
                      <p className="text-sm text-muted-foreground">per {plan.interval}</p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {plan.credits.toLocaleString()} credits/month
                      </p>
                    </div>
                    
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      variant={plan.isCurrent ? "outline" : "default"}
                      disabled={plan.isCurrent}
                    >
                      {plan.isCurrent ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice History
              </CardTitle>
              <CardDescription>
                Download and view your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.downloadUrl && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Creator Unlocks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium">1,550 unlocks</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Month</span>
                    <span className="font-medium">1,345 unlocks</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Average/Month</span>
                    <span className="font-medium">1,420 unlocks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  API Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium">45,230 calls</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Month</span>
                    <span className="font-medium">42,100 calls</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate Limit</span>
                    <span className="font-medium">100,000/month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}