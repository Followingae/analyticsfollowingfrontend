"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { AuthGuard } from "@/components/AuthGuard"
import { brandProposalsApiService, BrandProposal, CounterProposal } from "@/services/adminProposalsApi"
import {
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Send,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function BrandProposalsPage() {
  const [proposals, setProposals] = useState<BrandProposal[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(true)
  const [proposalsError, setProposalsError] = useState<string | null>(null)
  
  const [selectedProposal, setSelectedProposal] = useState<BrandProposal | null>(null)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
  const [isViewingProposal, setIsViewingProposal] = useState(false)
  
  // Response form state
  const [responseForm, setResponseForm] = useState({
    decision: 'approved' as 'approved' | 'rejected' | 'counter_proposal' | 'needs_clarification',
    feedback: '',
    counter_proposal: {
      requested_budget_usd: 0,
      requested_timeline_days: 0,
      requested_changes: [''],
      additional_requirements: ''
    }
  })

  const router = useRouter()

  // Load brand proposals
  const loadProposals = async () => {
    setProposalsLoading(true)
    setProposalsError(null)
    try {
      const result = await brandProposalsApiService.getBrandProposals()
      if (result.success && result.data) {
        setProposals(result.data.proposals || [])
      } else {
        setProposalsError(result.error || 'Failed to load proposals')
      }
    } catch (error) {
      setProposalsError('Network error while loading proposals')
    } finally {
      setProposalsLoading(false)
    }
  }

  useEffect(() => {
    loadProposals()
  }, [])

  // Submit response
  const handleSubmitResponse = async () => {
    if (!selectedProposal) return

    try {
      const responseData: any = {
        decision: responseForm.decision,
        feedback: responseForm.feedback.trim() || undefined
      }

      if (responseForm.decision === 'counter_proposal') {
        responseData.counter_proposal = {
          ...responseForm.counter_proposal,
          requested_changes: responseForm.counter_proposal.requested_changes.filter(c => c.trim())
        }
      }

      const result = await brandProposalsApiService.submitResponse(selectedProposal.id, responseData)
      if (result.success) {
        await loadProposals() // Refresh proposals
        setIsResponseDialogOpen(false)
        resetResponseForm()
        toast.success("Response submitted successfully")
      } else {
        toast.error(result.error || 'Failed to submit response')
      }
    } catch (error) {
      toast.error('Network error while submitting response')
    }
  }

  // Reset response form
  const resetResponseForm = () => {
    setResponseForm({
      decision: 'approved',
      feedback: '',
      counter_proposal: {
        requested_budget_usd: 0,
        requested_timeline_days: 0,
        requested_changes: [''],
        additional_requirements: ''
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'under_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'negotiation': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'closed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const addCounterProposalChange = () => {
    setResponseForm(prev => ({
      ...prev,
      counter_proposal: {
        ...prev.counter_proposal,
        requested_changes: [...prev.counter_proposal.requested_changes, '']
      }
    }))
  }

  const updateCounterProposalChange = (index: number, value: string) => {
    setResponseForm(prev => ({
      ...prev,
      counter_proposal: {
        ...prev.counter_proposal,
        requested_changes: prev.counter_proposal.requested_changes.map((change, i) => 
          i === index ? value : change
        )
      }
    }))
  }

  const removeCounterProposalChange = (index: number) => {
    setResponseForm(prev => ({
      ...prev,
      counter_proposal: {
        ...prev.counter_proposal,
        requested_changes: prev.counter_proposal.requested_changes.filter((_, i) => i !== index)
      }
    }))
  }

  // Categorize proposals
  const activeProposals = proposals.filter(p => ['sent', 'under_review', 'negotiation'].includes(p.status))
  const respondedProposals = proposals.filter(p => ['approved', 'rejected', 'closed'].includes(p.status))
  const needsResponse = proposals.filter(p => p.status === 'sent' && p.brand_response_due_date && new Date(p.brand_response_due_date) > new Date())

  return (
    <AuthGuard requireAuth={true}>
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
                  <h1 className="text-3xl font-bold">Marketing Proposals</h1>
                  <p className="text-muted-foreground">Review and respond to marketing service proposals</p>
                </div>
              </div>

              <Tabs defaultValue="active" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="active" className="relative">
                    Active Proposals
                    {needsResponse.length > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {needsResponse.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="responded">Previous Responses</TabsTrigger>
                </TabsList>

                {/* Active Proposals Tab */}
                <TabsContent value="active" className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Response</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{needsResponse.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Require your decision
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Negotiation</CardTitle>
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {proposals.filter(p => p.status === 'negotiation').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ongoing discussions
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(activeProposals.reduce((sum, p) => sum + p.proposed_budget_usd, 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Active proposals
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Loading State */}
                  {proposalsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-muted-foreground">Loading proposals...</p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {proposalsError && !proposalsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <p className="text-red-600 dark:text-red-400">{proposalsError}</p>
                        <Button variant="outline" onClick={() => loadProposals()}>
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Active Proposals List */}
                  {!proposalsLoading && !proposalsError && (
                    <div className="space-y-4">
                      {activeProposals.map((proposal) => (
                        <Card key={proposal.id} className={`group hover:shadow-md transition-shadow ${
                          proposal.status === 'sent' && proposal.brand_response_due_date && 
                          new Date(proposal.brand_response_due_date) < new Date() ? 'border-red-200 dark:border-red-800' : ''
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-1">
                                <h3 className="font-semibold text-lg">{proposal.proposal_title}</h3>
                                <p className="text-sm text-muted-foreground">{proposal.service_type.replace('_', ' ')}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(proposal.status)}>
                                  {proposal.status.replace('_', ' ')}
                                </Badge>
                                {proposal.status === 'sent' && proposal.brand_response_due_date && 
                                 new Date(proposal.brand_response_due_date) < new Date() && (
                                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {proposal.proposal_description}
                              </p>

                              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-medium">{formatCurrency(proposal.proposed_budget_usd)}</span>
                                </div>
                                {proposal.sent_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Received {formatDate(proposal.sent_at)}</span>
                                  </div>
                                )}
                                {proposal.brand_response_due_date && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Due {formatDate(proposal.brand_response_due_date)}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProposal(proposal)
                                    setIsViewingProposal(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>

                                {(proposal.status === 'sent' || proposal.status === 'under_review') && (
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProposal(proposal)
                                        setResponseForm(prev => ({ ...prev, decision: 'rejected' }))
                                        setIsResponseDialogOpen(true)
                                      }}
                                    >
                                      <ThumbsDown className="h-4 w-4 mr-1" />
                                      Decline
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProposal(proposal)
                                        setResponseForm(prev => ({ ...prev, decision: 'counter_proposal' }))
                                        setIsResponseDialogOpen(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Counter
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProposal(proposal)
                                        setResponseForm(prev => ({ ...prev, decision: 'approved' }))
                                        setIsResponseDialogOpen(true)
                                      }}
                                      style={{ backgroundColor: '#5100f3', color: 'white' }} 
                                      className="hover:opacity-90"
                                    >
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {activeProposals.length === 0 && (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center space-y-4">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div>
                              <h3 className="text-lg font-semibold">No active proposals</h3>
                              <p className="text-muted-foreground">
                                You'll see marketing proposals from service providers here
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Previous Responses Tab */}
                <TabsContent value="responded" className="space-y-6">
                  <div className="space-y-4">
                    {respondedProposals.map((proposal) => (
                      <Card key={proposal.id} className="group">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                              <h3 className="font-semibold">{proposal.proposal_title}</h3>
                              <p className="text-sm text-muted-foreground">{proposal.service_type.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(proposal.status)}>
                                {proposal.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{formatCurrency(proposal.proposed_budget_usd)}</span>
                            </div>
                            {proposal.responded_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Responded {formatDate(proposal.responded_at)}</span>
                              </div>
                            )}
                          </div>

                          {proposal.brand_feedback && (
                            <div className="bg-muted/50 p-3 rounded-lg mb-3">
                              <p className="text-sm">
                                <span className="font-medium">Your response:</span> {proposal.brand_feedback}
                              </p>
                            </div>
                          )}

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProposal(proposal)
                              setIsViewingProposal(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}

                    {respondedProposals.length === 0 && (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                          <div>
                            <h3 className="text-lg font-semibold">No responses yet</h3>
                            <p className="text-muted-foreground">
                              Your responded proposals will appear here
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Proposal Details Dialog */}
              <Dialog open={isViewingProposal} onOpenChange={setIsViewingProposal}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedProposal?.proposal_title}</DialogTitle>
                    <DialogDescription>
                      Proposal details and specifications
                    </DialogDescription>
                  </DialogHeader>
                  {selectedProposal && (
                    <div className="space-y-6 py-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(selectedProposal.status)}>
                          {selectedProposal.status.replace('_', ' ')}
                        </Badge>
                        <div className="text-lg font-semibold">
                          {formatCurrency(selectedProposal.proposed_budget_usd)}
                        </div>
                      </div>

                      {selectedProposal.executive_summary && (
                        <div>
                          <h4 className="font-medium mb-2">Executive Summary</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedProposal.executive_summary}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Service Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedProposal.service_description}
                        </p>
                      </div>

                      {selectedProposal.deliverables && selectedProposal.deliverables.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Deliverables</h4>
                          <ul className="space-y-1">
                            {selectedProposal.deliverables.map((deliverable, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedProposal.expected_results && (
                        <div>
                          <h4 className="font-medium mb-2">Expected Results</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedProposal.expected_results}
                          </p>
                        </div>
                      )}

                      {selectedProposal.success_metrics && selectedProposal.success_metrics.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Success Metrics</h4>
                          <ul className="space-y-1">
                            {selectedProposal.success_metrics.map((metric, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#5100f3] rounded-full flex-shrink-0" />
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <h4 className="font-medium mb-1">Service Type</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {selectedProposal.service_type.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Payment Terms</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {selectedProposal.payment_terms?.replace('_', ' ') || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      {selectedProposal.brand_feedback && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Your Previous Response</h4>
                          <p className="text-sm">{selectedProposal.brand_feedback}</p>
                          {selectedProposal.brand_decision && (
                            <p className="text-sm mt-2">
                              <span className="font-medium">Decision:</span> 
                              <Badge className={`ml-2 ${getStatusColor(selectedProposal.brand_decision)}`}>
                                {selectedProposal.brand_decision.replace('_', ' ')}
                              </Badge>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setIsViewingProposal(false)}>
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Response Dialog */}
              <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Respond to Proposal</DialogTitle>
                    <DialogDescription>
                      {selectedProposal?.proposal_title}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">Decision</label>
                      <Select value={responseForm.decision} onValueChange={(value: any) => setResponseForm(prev => ({ ...prev, decision: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approve Proposal</SelectItem>
                          <SelectItem value="rejected">Decline Proposal</SelectItem>
                          <SelectItem value="counter_proposal">Counter Proposal</SelectItem>
                          <SelectItem value="needs_clarification">Request Clarification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Your Message</label>
                      <Textarea
                        placeholder="Add your feedback or comments..."
                        value={responseForm.feedback}
                        onChange={(e) => setResponseForm(prev => ({ ...prev, feedback: e.target.value }))}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    {responseForm.decision === 'counter_proposal' && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium">Counter Proposal Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Requested Budget (USD)</label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={responseForm.counter_proposal.requested_budget_usd}
                              onChange={(e) => setResponseForm(prev => ({
                                ...prev,
                                counter_proposal: {
                                  ...prev.counter_proposal,
                                  requested_budget_usd: parseInt(e.target.value) || 0
                                }
                              }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Requested Timeline (Days)</label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={responseForm.counter_proposal.requested_timeline_days}
                              onChange={(e) => setResponseForm(prev => ({
                                ...prev,
                                counter_proposal: {
                                  ...prev.counter_proposal,
                                  requested_timeline_days: parseInt(e.target.value) || 0
                                }
                              }))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Requested Changes</label>
                          <div className="space-y-2 mt-1">
                            {responseForm.counter_proposal.requested_changes.map((change, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  placeholder={`Change ${index + 1}`}
                                  value={change}
                                  onChange={(e) => updateCounterProposalChange(index, e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeCounterProposalChange(index)}
                                  disabled={responseForm.counter_proposal.requested_changes.length <= 1}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addCounterProposalChange}
                            >
                              Add Change Request
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Additional Requirements</label>
                          <Textarea
                            placeholder="Any additional requirements or conditions..."
                            value={responseForm.counter_proposal.additional_requirements}
                            onChange={(e) => setResponseForm(prev => ({
                              ...prev,
                              counter_proposal: {
                                ...prev.counter_proposal,
                                additional_requirements: e.target.value
                              }
                            }))}
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setIsResponseDialogOpen(false)
                      resetResponseForm()
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitResponse} style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                      <Send className="h-4 w-4 mr-2" />
                      Submit Response
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}