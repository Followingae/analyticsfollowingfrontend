'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  brandProposalsApi,
  BrandProposal,
  BrandDashboard
} from '@/services/proposalsApi'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  MessageSquare,
  DollarSign,
  Eye,
  ArrowRight
} from 'lucide-react'

import { AppSidebar } from '@/components/app-sidebar'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { FeatureLockedCard } from '../FeatureLockedCard'

export const dynamic = 'force-dynamic'

export function UserProposalsOverview() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<BrandDashboard | null>(null)
  const [proposals, setProposals] = useState<BrandProposal[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFeatureLocked, setIsFeatureLocked] = useState(false)
  const [lockedFeature, setLockedFeature] = useState<string | null>(null)

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    setIsFeatureLocked(false)

    try {
      console.log('🔍 UserProposals: Starting API calls...')
      const [dashboardResult, proposalsResult] = await Promise.all([
        brandProposalsApi.getDashboard(),
        brandProposalsApi.getAssignedProposals({ limit: 50 })
      ])

      console.log('🔍 UserProposals: Dashboard result:', dashboardResult)
      console.log('🔍 UserProposals: Proposals result:', proposalsResult)

      // Check for feature lock in either response
      if (dashboardResult.isFeatureLocked || proposalsResult.isFeatureLocked) {
        setIsFeatureLocked(true)
        setLockedFeature(dashboardResult.lockedFeature || proposalsResult.lockedFeature || 'proposals')
        return
      }

      if (dashboardResult.success && dashboardResult.data) {
        setDashboardData(dashboardResult.data)
        setProposals(dashboardResult.data.assigned_proposals || [])
      } else if (!dashboardResult.isFeatureLocked) {
        throw new Error(dashboardResult.error || 'Failed to load dashboard')
      }

      if (proposalsResult.success && proposalsResult.data) {
        setProposals(proposalsResult.data.proposals || [])
      } else if (!proposalsResult.isFeatureLocked) {
        console.warn('Failed to load proposals list:', proposalsResult.error)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data'
      setError(errorMessage)
      console.error('Dashboard load error:', error)
      console.error('Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : null
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'needs_discussion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'needs_discussion': return <MessageSquare className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatCurrency = (amountCents: number) => {
    const amountUsd = amountCents / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amountUsd)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (proposal: BrandProposal) => {
    if (!proposal.response_due_date) return false
    return new Date(proposal.response_due_date) < new Date() && proposal.status === 'sent'
  }

  const handleViewProposal = (proposalId: string) => {
    router.push(`/proposals/${proposalId}`)
  }

  if (loading) {
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
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading proposals...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Show feature locked UI if proposals are locked
  if (isFeatureLocked) {
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
          <FeatureLockedCard
            feature={lockedFeature || 'proposals'}
            onContactSupport={() => {
              console.log('User requested agency access for proposals')
            }}
          />
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
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
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button variant="outline" onClick={() => loadDashboardData()}>
                Try Again
              </Button>
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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Campaign Proposals</h1>
                <p className="text-muted-foreground">Review and manage your marketing campaign proposals</p>
              </div>
            </div>

            {/* Dashboard Stats */}
            {dashboardData && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.total_proposals_received}</div>
                    <p className="text-xs text-muted-foreground">
                      Received from Following Agency
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.pending_responses}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.overdue_responses} overdue
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.approved_proposals}</div>
                    <p className="text-xs text-muted-foreground">
                      {((dashboardData.approved_proposals / dashboardData.total_proposals_received) * 100).toFixed(0)}% approval rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(dashboardData.response_rate * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {dashboardData.average_response_time_days} days
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Proposals List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Proposals</CardTitle>
                <CardDescription>Click on any proposal to review and select influencers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(proposals || []).map((proposal) => (
                    <Card
                      key={proposal.id}
                      className={`group cursor-pointer transition-all hover:shadow-md ${
                        isOverdue(proposal) ? 'border-red-200 dark:border-red-800' : ''
                      }`}
                      onClick={() => handleViewProposal(proposal.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{proposal.proposal_title}</h3>
                                  {isOverdue(proposal) && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Overdue
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {proposal.proposal_description}
                                </p>
                              </div>
                              <Badge className={getStatusColor(proposal.status)}>
                                {getStatusIcon(proposal.status)}
                                <span className="ml-1">{proposal.status.replace('_', ' ')}</span>
                              </Badge>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(proposal.total_campaign_budget_usd_cents)}</span>
                              </div>
                              {proposal.sent_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Received {formatDate(proposal.sent_at)}</span>
                                </div>
                              )}
                              {proposal.response_due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>Due {formatDate(proposal.response_due_date)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewProposal(proposal.id)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review Proposal
                                </Button>
                              </div>

                              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                                <span className="text-sm">View Details</span>
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(proposals || []).length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                      <p className="text-muted-foreground">
                        Following Agency will send you campaign proposals to review here.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}