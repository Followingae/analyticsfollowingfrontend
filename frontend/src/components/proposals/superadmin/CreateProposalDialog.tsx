'use client'

import { useState } from 'react'
import { superadminProposalsApi, Deliverable } from '@/services/proposalsApi'
import { toast } from 'sonner'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X } from 'lucide-react'

interface CreateProposalDialogProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateProposalDialog({ onClose, onSuccess }: CreateProposalDialogProps) {
  const [formData, setFormData] = useState({
    assigned_brand_users: [''],
    brand_company_name: '',
    proposal_title: '',
    proposal_description: '',
    total_campaign_budget_usd_cents: 0,
    deliverables: [{ type: 'post' as const, quantity: 1, description: '' }],
    campaign_timeline: {
      start_date: '',
      end_date: '',
      key_milestones: [{ date: '', description: '' }]
    },
    priority_level: 'medium' as 'high' | 'medium' | 'low',
    admin_notes: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (!formData.proposal_title.trim() || formData.assigned_brand_users.filter(u => u.trim()).length === 0) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      const proposalData = {
        ...formData,
        assigned_brand_users: formData.assigned_brand_users.filter(u => u.trim()),
        deliverables: formData.deliverables.filter(d => d.quantity > 0),
        campaign_timeline: {
          ...formData.campaign_timeline,
          key_milestones: formData.campaign_timeline.key_milestones?.filter(m => m.description.trim())
        }
      }
      
      const result = await superadminProposalsApi.createBrandProposal(proposalData)
      
      if (result.success) {
        toast.success('Proposal created successfully')
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || 'Failed to create proposal')
      }
    } catch (error) {
      toast.error('Network error while creating proposal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addBrandUser = () => {
    setFormData(prev => ({
      ...prev,
      assigned_brand_users: [...prev.assigned_brand_users, '']
    }))
  }

  const updateBrandUser = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_brand_users: prev.assigned_brand_users.map((user, i) => i === index ? value : user)
    }))
  }

  const removeBrandUser = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_brand_users: prev.assigned_brand_users.filter((_, i) => i !== index)
    }))
  }

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { type: 'post', quantity: 1, description: '' }]
    }))
  }

  const updateDeliverable = (index: number, field: keyof Deliverable, value: any) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }))
  }

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      campaign_timeline: {
        ...prev.campaign_timeline,
        key_milestones: [...(prev.campaign_timeline.key_milestones || []), { date: '', description: '' }]
      }
    }))
  }

  const updateMilestone = (index: number, field: 'date' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      campaign_timeline: {
        ...prev.campaign_timeline,
        key_milestones: prev.campaign_timeline.key_milestones?.map((milestone, i) => 
          i === index ? { ...milestone, [field]: value } : milestone
        ) || []
      }
    }))
  }

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      campaign_timeline: {
        ...prev.campaign_timeline,
        key_milestones: prev.campaign_timeline.key_milestones?.filter((_, i) => i !== index) || []
      }
    }))
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Brand Proposal</DialogTitle>
        <DialogDescription>
          Create a proposal to send to brand users for review and approval
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Proposal Title *</label>
              <Input
                placeholder="Enter proposal title"
                value={formData.proposal_title}
                onChange={(e) => setFormData(prev => ({ ...prev, proposal_title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Brand Company Name</label>
              <Input
                placeholder="Enter brand name"
                value={formData.brand_company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_company_name: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Priority Level</label>
              <Select 
                value={formData.priority_level} 
                onValueChange={(value: 'high' | 'medium' | 'low') => 
                  setFormData(prev => ({ ...prev, priority_level: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Budget (USD)</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.total_campaign_budget_usd_cents / 100}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  total_campaign_budget_usd_cents: parseInt(e.target.value) * 100 || undefined 
                }))}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Proposal Description</label>
            <Textarea
              placeholder="Detailed description of the campaign proposal..."
              value={formData.proposal_description}
              onChange={(e) => setFormData(prev => ({ ...prev, proposal_description: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Brand Users */}
        <div className="space-y-4">
          <h4 className="font-medium">Assigned Brand Users *</h4>
          <div className="space-y-2">
            {formData.assigned_brand_users.map((user, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Enter brand contact email"
                  value={user}
                  onChange={(e) => updateBrandUser(index, e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeBrandUser(index)}
                  disabled={formData.assigned_brand_users.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBrandUser}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Brand User
            </Button>
          </div>
        </div>

        {/* Deliverables */}
        <div className="space-y-4">
          <h4 className="font-medium">Deliverables</h4>
          <div className="space-y-3">
            {formData.deliverables.map((deliverable, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={deliverable.type} 
                    onValueChange={(value: any) => updateDeliverable(index, 'type', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="ugc">UGC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={deliverable.quantity}
                    onChange={(e) => updateDeliverable(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Description..."
                    value={deliverable.description || ''}
                    onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDeliverable(index)}
                  disabled={formData.deliverables.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDeliverable}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Deliverable
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h4 className="font-medium">Campaign Timeline</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={formData.campaign_timeline.start_date}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  campaign_timeline: { ...prev.campaign_timeline, start_date: e.target.value }
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={formData.campaign_timeline.end_date}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  campaign_timeline: { ...prev.campaign_timeline, end_date: e.target.value }
                }))}
                className="mt-1"
              />
            </div>
          </div>
          
          {/* Key Milestones */}
          <div>
            <label className="text-sm font-medium">Key Milestones</label>
            <div className="space-y-2 mt-1">
              {formData.campaign_timeline.key_milestones?.map((milestone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                    className="w-40"
                  />
                  <Input
                    placeholder="Milestone description"
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMilestone(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMilestone}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="text-sm font-medium">Admin Notes</label>
          <Textarea
            placeholder="Internal notes for this proposal..."
            value={formData.admin_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
            className="mt-1"
            rows={2}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
          className="hover:opacity-90"
        >
          {isSubmitting ? 'Creating...' : 'Create Proposal'}
        </Button>
      </div>
    </>
  )
}