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
import { Badge } from '@/components/ui/badge'
import { Plus, X, Link2, Copy, Check } from 'lucide-react'

interface InviteCampaignManagerProps {
  onClose: () => void
  onSuccess: () => void
}

export function InviteCampaignManager({ onClose, onSuccess }: InviteCampaignManagerProps) {
  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_description: '',
    campaign_type: 'paid' as 'paid' | 'barter' | 'hybrid',
    deliverables: [{ type: 'post' as const, quantity: 1, description: '' }],
    eligible_follower_range: {
      min: 1000,
      max: 100000
    },
    eligible_categories: [''],
    terms_and_conditions: '',
    expires_at: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdCampaign, setCreatedCampaign] = useState<any>(null)
  const [inviteUrl, setInviteUrl] = useState<string>('')
  const [urlCopied, setUrlCopied] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (!formData.campaign_name.trim() || !formData.campaign_description.trim()) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      const campaignData = {
        ...formData,
        deliverables: formData.deliverables.filter(d => d.quantity > 0),
        eligible_categories: formData.eligible_categories.filter(c => c.trim())
      }
      
      const result = await superadminProposalsApi.createInviteCampaign(campaignData)
      
      if (result.success && result.data) {
        setCreatedCampaign(result.data)
        toast.success('Invite campaign created successfully')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to create invite campaign')
      }
    } catch (error) {
      toast.error('Network error while creating campaign')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublishCampaign = async () => {
    if (!createdCampaign) return

    try {
      const result = await superadminProposalsApi.publishInviteCampaign(createdCampaign.id)
      
      if (result.success && result.data) {
        setInviteUrl(result.data.invite_url)
        toast.success('Campaign published successfully!')
      } else {
        toast.error(result.error || 'Failed to publish campaign')
      }
    } catch (error) {
      toast.error('Network error while publishing campaign')
    }
  }

  const handleCopyUrl = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl)
      setUrlCopied(true)
      toast.success('Invite URL copied to clipboard')
      setTimeout(() => setUrlCopied(false), 2000)
    }
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

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      eligible_categories: [...prev.eligible_categories, '']
    }))
  }

  const updateCategory = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      eligible_categories: prev.eligible_categories.map((cat, i) => i === index ? value : cat)
    }))
  }

  const removeCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      eligible_categories: prev.eligible_categories.filter((_, i) => i !== index)
    }))
  }

  // If campaign is published, show success screen
  if (inviteUrl) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>🎉 Campaign Published Successfully!</DialogTitle>
          <DialogDescription>
            Your invite campaign is now live and ready to receive applications
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Campaign Details
            </h4>
            <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
              <p><strong>Name:</strong> {createdCampaign.campaign_name}</p>
              <p><strong>Type:</strong> <Badge variant="outline">{createdCampaign.campaign_type}</Badge></p>
              <p><strong>Deliverables:</strong> {formData.deliverables.length} types</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Public Invite URL</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={inviteUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {urlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Share this URL with influencers to receive applications
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              What happens next?
            </h4>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>• Influencers can now visit the invite URL and submit applications</li>
              <li>• Applications will appear in your dashboard for review</li>
              <li>• Approved influencers can be added to brand proposals</li>
              <li>• You can pause or close the campaign at any time</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
          <Button 
            onClick={() => window.open(inviteUrl, '_blank')}
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
            className="hover:opacity-90"
          >
            <Link2 className="h-4 w-4 mr-2" />
            View Public Page
          </Button>
        </div>
      </>
    )
  }

  // If campaign is created but not published
  if (createdCampaign && !inviteUrl) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Publish Invite Campaign</DialogTitle>
          <DialogDescription>
            Campaign created successfully. Publish it to make it live and generate the invite URL.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{createdCampaign.campaign_name}</h4>
            <p className="text-sm text-muted-foreground">{createdCampaign.campaign_description}</p>
          </div>
          
          <p className="text-sm">
            Once published, influencers will be able to visit the unique invite URL and submit applications.
            You can review and approve applications from your dashboard.
          </p>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Save as Draft
          </Button>
          <Button 
            onClick={handlePublishCampaign}
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
            className="hover:opacity-90"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Publish Campaign
          </Button>
        </div>
      </>
    )
  }

  // Campaign creation form
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Invite Campaign</DialogTitle>
        <DialogDescription>
          Create a dynamic invite campaign for influencers to apply and join your proposals
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium">Campaign Information</h4>
          <div>
            <label className="text-sm font-medium">Campaign Name *</label>
            <Input
              placeholder="e.g. Fashion Influencers Q1 2024"
              value={formData.campaign_name}
              onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Campaign Type</label>
              <Select 
                value={formData.campaign_type} 
                onValueChange={(value: 'paid' | 'barter' | 'hybrid') => 
                  setFormData(prev => ({ ...prev, campaign_type: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid Campaign</SelectItem>
                  <SelectItem value="barter">Barter/Exchange</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Paid + Barter)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Expires On</label>
              <Input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Campaign Description *</label>
            <Textarea
              placeholder="Describe the campaign, brand, and what you're looking for..."
              value={formData.campaign_description}
              onChange={(e) => setFormData(prev => ({ ...prev, campaign_description: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div className="space-y-4">
          <h4 className="font-medium">Eligibility Criteria</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Min Followers</label>
              <Input
                type="number"
                placeholder="1000"
                value={formData.eligible_follower_range.min}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eligible_follower_range: {
                    ...prev.eligible_follower_range,
                    min: parseInt(e.target.value) || 0
                  }
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Followers</label>
              <Input
                type="number"
                placeholder="100000"
                value={formData.eligible_follower_range.max}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eligible_follower_range: {
                    ...prev.eligible_follower_range,
                    max: parseInt(e.target.value) || 0
                  }
                }))}
                className="mt-1"
              />
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <label className="text-sm font-medium">Eligible Categories</label>
            <div className="space-y-2 mt-1">
              {formData.eligible_categories.map((category, index) => (
                <div key={index} className="flex gap-2">
                  <Select value={category} onValueChange={(value) => updateCategory(index, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="beauty">Beauty</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCategory(index)}
                    disabled={formData.eligible_categories.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCategory}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="space-y-4">
          <h4 className="font-medium">Required Deliverables</h4>
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

        {/* Terms and Conditions */}
        <div>
          <label className="text-sm font-medium">Terms and Conditions</label>
          <Textarea
            placeholder="Terms that influencers must agree to when applying..."
            value={formData.terms_and_conditions}
            onChange={(e) => setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
            className="mt-1"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            These terms will be displayed to influencers during the application process
          </p>
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
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </>
  )
}