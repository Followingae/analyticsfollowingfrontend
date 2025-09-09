'use client'

import { useState, useEffect } from 'react'
import { BrandProposal, ProposalInfluencer, superadminProposalsApi } from '@/services/proposalsApi'
import { toast } from 'sonner'
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
  Send, 
  MessageSquare, 
  Eye, 
  CheckCircle,
  Target,
  Clock,
  User,
  Instagram
} from 'lucide-react'

interface ProposalDetailsDialogProps {
  proposal: BrandProposal
  onClose: () => void
  onUpdate: () => void
}

export function ProposalDetailsDialog({ proposal, onClose, onUpdate }: ProposalDetailsDialogProps) {
  const [influencers, setInfluencers] = useState<ProposalInfluencer[]>([])
  const [loadingInfluencers, setLoadingInfluencers] = useState(false)
  const [communications, setCommunications] = useState([])
  const [currentTab, setCurrentTab] = useState('overview')

  useEffect(() => {
    loadInfluencers()
  }, [proposal.id])

  const loadInfluencers = async () => {
    setLoadingInfluencers(true)
    try {
      const result = await superadminProposalsApi.getProposalInfluencers(proposal.id)
      if (result.success && result.data) {
        setInfluencers(result.data.influencers || [])
      }
    } catch (error) {
      console.error('Failed to load influencers:', error)
    } finally {
      setLoadingInfluencers(false)
    }
  }

  const handleSendProposal = async () => {
    try {
      const result = await superadminProposalsApi.sendProposalToBrands(proposal.id, {
        response_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        send_notifications: true
      })

      if (result.success) {
        toast.success('Proposal sent to brand users successfully')
        onUpdate()
        onClose()
      } else {
        toast.error(result.error || 'Failed to send proposal')
      }
    } catch (error) {
      toast.error('Network error while sending proposal')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'needs_discussion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-muted-foreground'
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            {proposal.priority_level && (
              <div className={`text-sm font-medium ${getPriorityColor(proposal.priority_level)}`}>
                {proposal.priority_level} priority
              </div>
            )}
          </div>
        </DialogTitle>
        <DialogDescription>
          Created {formatDate(proposal.created_at)} • {proposal.brand_company_name || 'Brand Proposal'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="influencers">Influencers ({influencers.length})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Budget</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(proposal.total_campaign_budget_usd_cents)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Brand Users</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {proposal.assigned_brand_users.length}
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
                    {proposal.deliverables.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Proposal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {proposal.proposal_description || 'No description provided'}
                    </p>
                  </div>
                  
                  {proposal.admin_notes && (
                    <div>
                      <label className="text-sm font-medium">Admin Notes</label>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {proposal.admin_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  
                  {proposal.campaign_timeline?.key_milestones && proposal.campaign_timeline.key_milestones.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Key Milestones</label>
                      <div className="space-y-2 mt-1">
                        {proposal.campaign_timeline.key_milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
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
            </div>

            {/* Deliverables */}
            <Card>
              <CardHeader>
                <CardTitle>Required Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proposal.deliverables.map((deliverable, index) => (
                    <div key={index} className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {deliverable.type}
                        </Badge>
                        <span className="text-sm font-medium">
                          {deliverable.quantity}x
                        </span>
                      </div>
                      {deliverable.description && (
                        <p className="text-sm text-muted-foreground">
                          {deliverable.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Brand Response */}
            {proposal.brand_response && (
              <Card>
                <CardHeader>
                  <CardTitle>Brand Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(proposal.brand_response)}>
                        {proposal.brand_response.replace('_', ' ')}
                      </Badge>
                      {proposal.brand_responded_at && (
                        <span className="text-sm text-muted-foreground">
                          Responded {formatDate(proposal.brand_responded_at)}
                        </span>
                      )}
                    </div>
                    
                    {proposal.brand_feedback && (
                      <div>
                        <label className="text-sm font-medium">Feedback</label>
                        <div className="bg-muted/50 p-3 rounded-lg mt-1">
                          <p className="text-sm">{proposal.brand_feedback}</p>
                        </div>
                      </div>
                    )}
                    
                    {proposal.brand_requested_changes && proposal.brand_requested_changes.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Requested Changes</label>
                        <ul className="space-y-1 mt-1">
                          {proposal.brand_requested_changes.map((change, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-yellow-500" />
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                {influencers.map((influencer) => (
                  <Card key={influencer.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">@{influencer.instagram_username}</h4>
                            <Badge variant="outline">
                              {influencer.followers_count.toLocaleString()} followers
                            </Badge>
                          </div>
                          
                          {influencer.selection_reason && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Selection Reason:</strong> {influencer.selection_reason}
                            </p>
                          )}
                          
                          <div>
                            <label className="text-sm font-medium">Assigned Deliverables:</label>
                            <div className="flex gap-2 mt-1">
                              {influencer.assigned_deliverables.map((deliverable, index) => (
                                <Badge key={index} variant="outline" className="capitalize">
                                  {deliverable.quantity}x {deliverable.type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(influencer.total_influencer_budget_usd_cents)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Budget</p>
                        </div>
                      </div>
                      
                      {influencer.admin_price_adjustments && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <label className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Custom Pricing Applied
                          </label>
                          {influencer.admin_price_adjustments.adjustment_reason && (
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Reason: {influencer.admin_price_adjustments.adjustment_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Influencers Added</h3>
                  <p className="text-muted-foreground text-center">
                    Add influencers to this proposal to show detailed information here.
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

          {/* Communications Tab */}
          <TabsContent value="communications" className="mt-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Communications</h3>
                <p className="text-muted-foreground text-center">
                  Communication history and messaging coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center gap-2">
          {proposal.sent_to_brands_at && (
            <span className="text-sm text-muted-foreground">
              Sent {formatDate(proposal.sent_to_brands_at)}
            </span>
          )}
          {proposal.response_due_date && (
            <span className="text-sm text-muted-foreground">
              Due {formatDate(proposal.response_due_date)}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {proposal.status === 'draft' && (
            <Button 
              onClick={handleSendProposal}
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
              className="hover:opacity-90"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Brands
            </Button>
          )}
        </div>
      </div>
    </>
  )
}