'use client'

import { useState, useEffect } from 'react'
import { BrandProposal, brandProposalsApi } from '@/services/proposalsApi'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Target,
  Clock,
  User,
  Instagram,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface BrandProposalDetailsDialogProps {
  proposal: BrandProposal
  onClose: () => void
}

export function BrandProposalDetailsDialog({ proposal, onClose }: BrandProposalDetailsDialogProps) {
  const [influencers, setInfluencers] = useState<any[]>([])
  const [loadingInfluencers, setLoadingInfluencers] = useState(false)
  const [currentTab, setCurrentTab] = useState('overview')

  useEffect(() => {
    loadInfluencers()
  }, [proposal.id])

  const loadInfluencers = async () => {
    setLoadingInfluencers(true)
    try {
      const result = await brandProposalsApi.getProposalInfluencers(proposal.id)
      if (result.success && result.data) {
        setInfluencers(result.data.influencers || [])
      }
    } catch (error) {
      console.error('Failed to load influencers:', error)
    } finally {
      setLoadingInfluencers(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'needs_discussion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = () => {
    if (!proposal.response_due_date) return false
    return new Date(proposal.response_due_date) < new Date() && proposal.status === 'sent'
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>{proposal.proposal_title}</span>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(proposal.status)}>
              {proposal.status.replace('_', ' ')}
            </Badge>
            {isOverdue() && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </DialogTitle>
        <DialogDescription>
          Received {proposal.sent_at ? formatDate(proposal.sent_at) : 'Recently'}
          {proposal.response_due_date && (
            <> • Response due {formatDate(proposal.response_due_date)}</>
          )}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="influencers">Influencers ({influencers.length})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Budget</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(proposal.total_campaign_budget_usd_cents)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Influencers</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {influencers.length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Deliverables</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {proposal.deliverables.reduce((total, d) => total + d.quantity, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Proposal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {proposal.proposal_description}
                </p>
              </CardContent>
            </Card>

            {/* Campaign Timeline */}
            {(proposal.campaign_timeline?.start_date || proposal.campaign_timeline?.end_date) && (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proposal.campaign_timeline?.start_date && (
                      <div>
                        <label className="text-sm font-medium">Start Date</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(proposal.campaign_timeline.start_date)}
                        </p>
                      </div>
                    )}
                    
                    {proposal.campaign_timeline?.end_date && (
                      <div>
                        <label className="text-sm font-medium">End Date</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(proposal.campaign_timeline.end_date)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {proposal.campaign_timeline?.key_milestones && proposal.campaign_timeline.key_milestones.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Key Milestones</label>
                      <div className="space-y-2 mt-2">
                        {proposal.campaign_timeline.key_milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {formatDate(milestone.date)}: {milestone.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Deliverables */}
            <Card>
              <CardHeader>
                <CardTitle>Required Deliverables</CardTitle>
                <CardDescription>Content that will be created for your brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proposal.deliverables.map((deliverable, index) => (
                    <div key={index} className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {deliverable.type}
                        </Badge>
                        <span className="text-lg font-semibold">
                          {deliverable.quantity}x
                        </span>
                      </div>
                      {deliverable.description && (
                        <p className="text-sm text-muted-foreground">
                          {deliverable.description}
                        </p>
                      )}
                      {deliverable.requirements && deliverable.requirements.length > 0 && (
                        <div className="mt-2">
                          <label className="text-xs font-medium text-muted-foreground">Requirements:</label>
                          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                            {deliverable.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Your Previous Response (if any) */}
            {proposal.brand_feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(proposal.brand_decision || proposal.status)}>
                        {(proposal.brand_decision || proposal.status).replace('_', ' ')}
                      </Badge>
                      {proposal.responded_at && (
                        <span className="text-sm text-muted-foreground">
                          Responded {formatDate(proposal.responded_at)}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Your Feedback</label>
                      <div className="bg-muted/50 p-3 rounded-lg mt-1">
                        <p className="text-sm">{proposal.brand_feedback}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Influencers Tab */}
          <TabsContent value="influencers" className="space-y-4 mt-4">
            {loadingInfluencers ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
                <p className="text-muted-foreground">Loading influencers...</p>
              </div>
            ) : influencers.length > 0 ? (
              <div className="space-y-4">
                {influencers.map((influencer, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">@{influencer.instagram_username}</h4>
                            <Badge variant="outline">
                              {influencer.followers_count.toLocaleString()} followers
                            </Badge>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Assigned Content:</label>
                            <div className="flex gap-2 mt-1">
                              {influencer.assigned_deliverables.map((deliverable: any, deliverableIndex: number) => (
                                <Badge key={deliverableIndex} variant="outline" className="capitalize">
                                  {deliverable.quantity}x {deliverable.type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <Instagram className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Curated by Following
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Influencers Listed</h3>
                  <p className="text-muted-foreground text-center">
                    Influencer details will be added by the Following team.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Timeline View</h3>
                <p className="text-muted-foreground text-center">
                  Detailed timeline view coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-end items-center pt-4 border-t">
        <div className="flex items-center gap-2">
          {proposal.response_due_date && (
            <span className="text-sm text-muted-foreground">
              Response due {formatDate(proposal.response_due_date)}
            </span>
          )}
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  )
}