'use client'

import { useState } from 'react'
import { BrandProposal } from '@/services/proposalsApi'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Edit,
  Plus,
  X,
  AlertTriangle
} from 'lucide-react'

interface ProposalResponseDialogProps {
  proposal: BrandProposal
  onClose: () => void
  onSubmit: (proposalId: string, responseData: {
    response: 'approved' | 'rejected' | 'request_changes' | 'needs_discussion'
    feedback?: string
    requested_changes?: string[]
  }) => Promise<void>
}

export function ProposalResponseDialog({ proposal, onClose, onSubmit }: ProposalResponseDialogProps) {
  const [response, setResponse] = useState<'approved' | 'rejected' | 'request_changes' | 'needs_discussion'>('approved')
  const [feedback, setFeedback] = useState('')
  const [requestedChanges, setRequestedChanges] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim() && response !== 'approved') {
      alert('Please provide feedback for your response')
      return
    }

    setIsSubmitting(true)
    
    try {
      const responseData = {
        response,
        feedback: feedback.trim() || undefined,
        requested_changes: response === 'request_changes' 
          ? requestedChanges.filter(change => change.trim()) 
          : undefined
      }
      
      await onSubmit(proposal.id, responseData)
    } catch (error) {
      console.error('Failed to submit response:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addRequestedChange = () => {
    setRequestedChanges([...requestedChanges, ''])
  }

  const updateRequestedChange = (index: number, value: string) => {
    setRequestedChanges(requestedChanges.map((change, i) => i === index ? value : change))
  }

  const removeRequestedChange = (index: number) => {
    setRequestedChanges(requestedChanges.filter((_, i) => i !== index))
  }

  const getResponseIcon = (responseType: string) => {
    switch (responseType) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      case 'request_changes': return <Edit className="h-4 w-4 text-yellow-600" />
      case 'needs_discussion': return <MessageSquare className="h-4 w-4 text-blue-600" />
      default: return null
    }
  }

  const getResponseColor = (responseType: string) => {
    switch (responseType) {
      case 'approved': return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
      case 'rejected': return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      case 'request_changes': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
      case 'needs_discussion': return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
      default: return ''
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

  const isOverdue = () => {
    if (!proposal.response_due_date) return false
    return new Date(proposal.response_due_date) < new Date()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          Respond to Proposal
          {isOverdue() && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          Provide your response to "{proposal.proposal_title}" - {formatCurrency(proposal.total_campaign_budget_usd_cents)}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        {/* Response Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Your Response *</label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { 
                value: 'approved', 
                label: 'Approve Proposal', 
                description: 'Accept the proposal as presented'
              },
              { 
                value: 'request_changes', 
                label: 'Request Changes', 
                description: 'Request specific modifications to the proposal'
              },
              { 
                value: 'needs_discussion', 
                label: 'Needs Discussion', 
                description: 'Would like to discuss details before deciding'
              },
              { 
                value: 'rejected', 
                label: 'Reject Proposal', 
                description: 'Decline the proposal'
              }
            ].map((option) => (
              <div 
                key={option.value}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  response === option.value 
                    ? getResponseColor(option.value) 
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
                onClick={() => setResponse(option.value as any)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getResponseIcon(option.value)}
                    <input
                      type="radio"
                      name="response"
                      value={option.value}
                      checked={response === option.value}
                      onChange={() => setResponse(option.value as any)}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requested Changes (if applicable) */}
        {response === 'request_changes' && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Specific Changes Requested *</label>
            <div className="space-y-2">
              {requestedChanges.map((change, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Change request ${index + 1}`}
                    value={change}
                    onChange={(e) => updateRequestedChange(index, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRequestedChange(index)}
                    disabled={requestedChanges.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRequestedChange}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Change Request
              </Button>
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {response === 'approved' ? 'Additional Comments (Optional)' : 'Feedback *'}
          </label>
          <Textarea
            placeholder={
              response === 'approved' 
                ? 'Any additional comments about this proposal...'
                : response === 'rejected'
                ? 'Please explain why you are rejecting this proposal...'
                : response === 'request_changes'
                ? 'Provide context for your requested changes...'
                : 'What would you like to discuss about this proposal?'
            }
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This feedback will be shared with the Following team to help them understand your perspective.
          </p>
        </div>

        {/* Summary */}
        <div className={`p-4 rounded-lg border-2 ${getResponseColor(response)}`}>
          <div className="flex items-center gap-2 mb-2">
            {getResponseIcon(response)}
            <span className="font-medium">Response Summary</span>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Action:</strong> {
              response === 'approved' ? 'Approve this proposal'
              : response === 'rejected' ? 'Reject this proposal'
              : response === 'request_changes' ? 'Request changes to this proposal'
              : 'Request discussion about this proposal'
            }</p>
            {response === 'request_changes' && requestedChanges.filter(c => c.trim()).length > 0 && (
              <p><strong>Changes requested:</strong> {requestedChanges.filter(c => c.trim()).length} item(s)</p>
            )}
            {feedback.trim() && (
              <p><strong>Feedback provided:</strong> Yes</p>
            )}
          </div>
        </div>

        {isOverdue() && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">This response is overdue</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              This proposal was due for response on {proposal.response_due_date ? new Date(proposal.response_due_date).toLocaleDateString() : 'N/A'}. 
              Please respond as soon as possible.
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (!feedback.trim() && response !== 'approved')}
          style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
          className="hover:opacity-90"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Response'}
        </Button>
      </div>
    </>
  )
}