'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  ArrowLeft,
  Plus,
  Search,
  Users,
  DollarSign,
  Building,
  Mail,
  Check,
  ChevronsUpDown,
  Send,
  Eye,
  Trash2,
  Edit3,
  Star,
  MapPin,
  UserCheck,
  Instagram,
  Camera,
  Video,
  Film,
  FileText,
  Save
} from "lucide-react"

import { superadminApiService } from '@/services/superadminApi'
import { toast } from 'sonner'

// Clean interfaces for the new system
interface Brand {
  id: string
  company_name: string
  primary_contact_email: string
  industry?: string
  budget_range?: string
}

interface Influencer {
  id: string
  username: string
  full_name: string
  followers_count: number
  engagement_rate?: number
  category?: string
  verified?: boolean
  profile_picture_url?: string
  location?: string
}

interface DeliverableItem {
  type: 'story' | 'post' | 'reel' | 'ugc_video'
  quantity: number
  price_usd_cents: number
  description?: string
}

interface InfluencerProposal {
  influencer: Influencer
  deliverables: DeliverableItem[]
  total_cost_usd_cents: number
  notes?: string
}

interface ProposalData {
  brand_id: string
  brand_company_name: string
  primary_contact_email: string
  proposal_title: string
  proposal_description: string
  campaign_brief: string
  proposed_start_date: string
  proposed_end_date: string
  priority_level: 'low' | 'medium' | 'high'
  influencer_proposals: InfluencerProposal[]
  total_budget_usd_cents: number
}

const deliverableTypes = [
  { value: 'story', label: 'Instagram Story', icon: Camera, color: 'bg-pink-100 text-pink-600' },
  { value: 'post', label: 'Feed Post', icon: Instagram, color: 'bg-blue-100 text-blue-600' },
  { value: 'reel', label: 'Reel', icon: Video, color: 'bg-purple-100 text-purple-600' },
  { value: 'ugc_video', label: 'UGC Video', icon: Film, color: 'bg-orange-100 text-orange-600' }
]

export default function CreateProposalPage() {
  const router = useRouter()

  // Core state
  const [step, setStep] = useState(1) // 1: Proposal Details, 2: Add Influencers, 3: Review & Send
  const [loading, setLoading] = useState(false)

  // Proposal data
  const [proposalData, setProposalData] = useState<ProposalData>({
    brand_id: '',
    brand_company_name: '',
    primary_contact_email: '',
    proposal_title: '',
    proposal_description: '',
    campaign_brief: '',
    proposed_start_date: '',
    proposed_end_date: '',
    priority_level: 'medium',
    influencer_proposals: [],
    total_budget_usd_cents: 0
  })

  // Data from API
  const [brands, setBrands] = useState<Brand[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingInfluencers, setLoadingInfluencers] = useState(false)

  // UI state
  const [brandSearchOpen, setBrandSearchOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [showAddInfluencer, setShowAddInfluencer] = useState(false)
  const [editingInfluencer, setEditingInfluencer] = useState<string | null>(null)

  // Load brands from API
  const loadBrands = async () => {
    try {
      setLoadingBrands(true)
      const result = await superadminApiService.getAvailableBrands({ limit: 100 })

      if (result.success && result.data) {
        const brandsData = result.data.data?.brands || result.data.brands || []
        const transformedBrands: Brand[] = brandsData.map((brand: any) => ({
          id: brand.id,
          company_name: brand.company || brand.email.split('@')[1] || 'Unknown Company',
          primary_contact_email: brand.email,
          industry: brand.role === 'brand_user' ? 'Brand Marketing' : 'Business',
          budget_range: brand.subscription_tier === 'enterprise' ? '$10,000+' :
                       brand.subscription_tier === 'premium' ? '$5,000-$10,000' :
                       '$1,000-$5,000'
        }))
        setBrands(transformedBrands)
      }
    } catch (error) {
      console.error('Failed to load brands:', error)
      toast.error('Failed to load brands')
    } finally {
      setLoadingBrands(false)
    }
  }

  // Load influencers from API
  const loadInfluencers = async (search?: string) => {
    try {
      setLoadingInfluencers(true)
      const params: any = { limit: 50, offset: 0 }
      if (search?.trim()) {
        params.search = search.trim()
      }

      const result = await superadminApiService.getInfluencers(params)

      if (result.success && result.data) {
        const influencersData = result.data.influencers || []
        const transformedInfluencers: Influencer[] = influencersData.map((inf: any) => {
          const analytics = inf.analytics || {}
          const aiAnalysis = analytics.ai_analysis || {}

          return {
            id: inf.id,
            username: inf.username,
            full_name: inf.full_name || inf.username,
            followers_count: inf.followers_count || 0,
            engagement_rate: analytics.engagement_rate || 0,
            category: aiAnalysis.primary_content_type || 'general',
            verified: inf.is_verified || false,
            profile_picture_url: inf.profile_image_url ||
              `https://ui-avatars.com/api/?name=${inf.username}&size=150&background=6366f1&color=fff`,
            location: inf.location || 'Location not available'
          }
        })
        setInfluencers(transformedInfluencers)
      }
    } catch (error) {
      console.error('Failed to load influencers:', error)
      // Check if it's a database connection error
      if (error instanceof Error && error.message.includes('prepared statement')) {
        toast.error('Database connection issue. Please try again in a moment.')
      } else {
        toast.error('Failed to load influencers')
      }
    } finally {
      setLoadingInfluencers(false)
    }
  }

  // Initialize data
  useEffect(() => {
    loadBrands()
    loadInfluencers()
  }, [])

  // Search influencers with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadInfluencers(searchQuery)
    }, 300)
    return () => clearTimeout(delayedSearch)
  }, [searchQuery])

  // Utility functions
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${Math.floor(count / 1000)}K`
    return count.toString()
  }

  // Add influencer to proposal
  const addInfluencerToProposal = (influencer: Influencer) => {
    // Check if already added
    if (proposalData.influencer_proposals.some(ip => ip.influencer.id === influencer.id)) {
      toast.error('Influencer already added to this proposal')
      return
    }

    const newInfluencerProposal: InfluencerProposal = {
      influencer,
      deliverables: [],
      total_cost_usd_cents: 0,
      notes: ''
    }

    setProposalData(prev => ({
      ...prev,
      influencer_proposals: [...prev.influencer_proposals, newInfluencerProposal]
    }))

    setShowAddInfluencer(false)
    toast.success(`@${influencer.username} added to proposal`)
  }

  // Remove influencer from proposal
  const removeInfluencerFromProposal = (influencerId: string) => {
    setProposalData(prev => ({
      ...prev,
      influencer_proposals: prev.influencer_proposals.filter(ip => ip.influencer.id !== influencerId),
      total_budget_usd_cents: prev.influencer_proposals
        .filter(ip => ip.influencer.id !== influencerId)
        .reduce((sum, ip) => sum + ip.total_cost_usd_cents, 0)
    }))
    toast.success('Influencer removed from proposal')
  }

  // Update influencer deliverables
  const updateInfluencerDeliverables = (influencerId: string, deliverables: DeliverableItem[]) => {
    const totalCost = deliverables.reduce((sum, d) => sum + (d.price_usd_cents * d.quantity), 0)

    setProposalData(prev => {
      const updatedProposals = prev.influencer_proposals.map(ip =>
        ip.influencer.id === influencerId
          ? { ...ip, deliverables, total_cost_usd_cents: totalCost }
          : ip
      )

      return {
        ...prev,
        influencer_proposals: updatedProposals,
        total_budget_usd_cents: updatedProposals.reduce((sum, ip) => sum + ip.total_cost_usd_cents, 0)
      }
    })
  }

  // Submit proposal
  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Validate
      if (!selectedBrand) {
        toast.error('Please select a brand')
        return
      }
      if (!proposalData.proposal_title.trim()) {
        toast.error('Please enter a proposal title')
        return
      }
      if (!proposalData.proposal_description.trim()) {
        toast.error('Please enter a proposal description')
        return
      }
      if (proposalData.influencer_proposals.length === 0) {
        toast.error('Please add at least one influencer')
        return
      }
      if (proposalData.influencer_proposals.some(ip => ip.deliverables.length === 0)) {
        toast.error('Please add deliverables for all influencers')
        return
      }

      // Prepare API data - exact structure to match backend expectations
      const apiData = {
        assigned_brand_users: [selectedBrand.id], // Array of UUIDs as expected by backend
        brand_company_name: selectedBrand.company_name || selectedBrand.name || 'Unknown Company',
        proposal_title: proposalData.proposal_title.trim(),
        deliverables: proposalData.influencer_proposals.flatMap(ip =>
          ip.deliverables.map(d => d.type)
        ), // Array of strings as expected by backend
        total_campaign_budget_usd_cents: proposalData.total_budget_usd_cents,
        proposal_description: proposalData.proposal_description.trim()
      }

      console.log('Sending proposal data:', JSON.stringify(apiData, null, 2))

      const result = await superadminApiService.createBrandProposal(apiData)

      if (result.success) {
        toast.success('Proposal created successfully!')
        router.push('/admin/proposals')
      } else {
        toast.error(result.error || 'Failed to create proposal')
      }
    } catch (error) {
      console.error('Failed to create proposal:', error)
      toast.error('Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  // Save proposal as draft
  const handleSaveDraft = async () => {
    try {
      setLoading(true)

      // Basic validation - only require brand and title for draft
      if (!selectedBrand) {
        toast.error('Please select a brand before saving draft')
        return
      }
      if (!proposalData.proposal_title.trim()) {
        toast.error('Please enter a proposal title before saving draft')
        return
      }

      // Prepare draft data - same structure as proposal but for draft endpoint
      const draftData = {
        brand_user_id: selectedBrand.id,
        proposal_title: proposalData.proposal_title,
        proposal_description: proposalData.proposal_description,
        campaign_brief: proposalData.campaign_brief,
        proposed_start_date: proposalData.proposed_start_date,
        proposed_end_date: proposalData.proposed_end_date,
        priority_level: proposalData.priority_level,
        total_budget_usd_cents: proposalData.total_budget_usd_cents,
        influencer_selections: proposalData.influencer_proposals.map(ip => ({
          influencer_id: ip.influencer.id,
          deliverables: ip.deliverables.map(d => ({
            deliverable_type: d.type,
            quantity: d.quantity,
            cost_per_deliverable_usd_cents: d.price_usd_cents,
            total_cost_usd_cents: d.price_usd_cents * d.quantity,
            description: d.description || ''
          })),
          notes: ip.notes || ''
        }))
      }

      const result = await superadminApiService.saveBrandProposalDraft(draftData)

      if (result.success) {
        toast.success('Draft saved successfully!')
      } else {
        toast.error(result.error || 'Failed to save draft')
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error)
      toast.error('Network error while saving draft')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 66)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <SuperadminSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-6 md:p-8">

            {/* Header */}
            <div className="space-y-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/admin/proposals" className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Proposals
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Create Proposal</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Create Brand Proposal</h1>
                  <p className="text-muted-foreground">Create a custom proposal for a brand client</p>
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  Step {step} of 3
                </Badge>
              </div>
            </div>

            {/* Step 1: Proposal Details */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Proposal Details
                  </CardTitle>
                  <CardDescription>
                    Select the brand client and define the campaign basics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Brand Selection */}
                  <div className="space-y-2">
                    <Label>Brand Client</Label>
                    <Popover open={brandSearchOpen} onOpenChange={setBrandSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={brandSearchOpen}
                          className="w-full justify-between h-12"
                        >
                          {selectedBrand ? (
                            <div className="flex items-center gap-3">
                              <Building className="h-4 w-4" />
                              <div className="text-left">
                                <div className="font-medium">{selectedBrand.company_name}</div>
                                <div className="text-xs text-muted-foreground">{selectedBrand.primary_contact_email}</div>
                              </div>
                            </div>
                          ) : (
                            "Select a brand client..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <Command>
                          <CommandInput placeholder="Search brands..." />
                          <CommandEmpty>No brands found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-64">
                              {brands.map((brand) => (
                                <CommandItem
                                  key={brand.id}
                                  value={brand.company_name}
                                  onSelect={() => {
                                    setSelectedBrand(brand)
                                    setProposalData(prev => ({
                                      ...prev,
                                      brand_id: brand.id,
                                      brand_company_name: brand.company_name,
                                      primary_contact_email: brand.primary_contact_email
                                    }))
                                    setBrandSearchOpen(false)
                                  }}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <Building className="h-4 w-4" />
                                    <div className="flex-1">
                                      <div className="font-medium">{brand.company_name}</div>
                                      <div className="text-xs text-muted-foreground">{brand.primary_contact_email}</div>
                                    </div>
                                    <Check
                                      className={`ml-auto h-4 w-4 ${
                                        selectedBrand?.id === brand.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                  </div>
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Basic Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="proposal_title">Proposal Title</Label>
                      <Input
                        id="proposal_title"
                        value={proposalData.proposal_title}
                        onChange={(e) => setProposalData(prev => ({ ...prev, proposal_title: e.target.value }))}
                        placeholder="Q1 2024 Influencer Campaign"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority_level">Priority Level</Label>
                      <Select
                        value={proposalData.priority_level}
                        onValueChange={(value: 'low' | 'medium' | 'high') =>
                          setProposalData(prev => ({ ...prev, priority_level: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proposal_description">Campaign Overview</Label>
                    <Textarea
                      id="proposal_description"
                      value={proposalData.proposal_description}
                      onChange={(e) => setProposalData(prev => ({ ...prev, proposal_description: e.target.value }))}
                      placeholder="Brief overview of the campaign objectives and strategy..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign_brief">Detailed Campaign Brief</Label>
                    <Textarea
                      id="campaign_brief"
                      value={proposalData.campaign_brief}
                      onChange={(e) => setProposalData(prev => ({ ...prev, campaign_brief: e.target.value }))}
                      placeholder="Detailed brief including brand guidelines, content requirements, messaging tone, and specific deliverable expectations..."
                      rows={5}
                    />
                  </div>

                  {/* Timeline */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Campaign Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={proposalData.proposed_start_date}
                        onChange={(e) => setProposalData(prev => ({ ...prev, proposed_start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">Campaign End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={proposalData.proposed_end_date}
                        onChange={(e) => setProposalData(prev => ({ ...prev, proposed_end_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedBrand || !proposalData.proposal_title}
                    >
                      Next: Add Influencers
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Step 2: Add Influencers & Set Individual Deliverables */}
            {step === 2 && (
              <div className="space-y-6">

                {/* Current Influencers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Selected Influencers ({proposalData.influencer_proposals.length})
                      </div>
                      <Button onClick={() => setShowAddInfluencer(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Influencer
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Manage influencers and set individual deliverables with pricing for each
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {proposalData.influencer_proposals.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No influencers added</h3>
                        <p className="text-muted-foreground mb-4">Add influencers to start building your proposal</p>
                        <Button onClick={() => setShowAddInfluencer(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Influencer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {proposalData.influencer_proposals.map((ip, index) => (
                          <InfluencerCard
                            key={ip.influencer.id}
                            influencerProposal={ip}
                            onUpdate={(deliverables) => updateInfluencerDeliverables(ip.influencer.id, deliverables)}
                            onRemove={() => removeInfluencerFromProposal(ip.influencer.id)}
                            isEditing={editingInfluencer === ip.influencer.id}
                            onEdit={() => setEditingInfluencer(editingInfluencer === ip.influencer.id ? null : ip.influencer.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Budget Summary */}
                {proposalData.influencer_proposals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Budget Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary mb-4">
                        {formatCurrency(proposalData.total_budget_usd_cents)}
                      </div>
                      <div className="space-y-2">
                        {proposalData.influencer_proposals.map(ip => (
                          <div key={ip.influencer.id} className="flex justify-between text-sm">
                            <span>@{ip.influencer.username}</span>
                            <span className="font-medium">{formatCurrency(ip.total_cost_usd_cents)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Previous
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={proposalData.influencer_proposals.length === 0 ||
                             proposalData.influencer_proposals.some(ip => ip.deliverables.length === 0)}
                  >
                    Next: Review & Send
                  </Button>
                </div>

              </div>
            )}

            {/* Step 3: Review & Send */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Review & Send Proposal
                  </CardTitle>
                  <CardDescription>
                    Final review before sending to {selectedBrand?.company_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Summary */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-medium mb-3">Proposal Details</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Title:</strong> {proposalData.proposal_title}</div>
                        <div><strong>Client:</strong> {selectedBrand?.company_name}</div>
                        <div><strong>Contact:</strong> {selectedBrand?.primary_contact_email}</div>
                        <div><strong>Timeline:</strong> {proposalData.proposed_start_date} - {proposalData.proposed_end_date}</div>
                        <div><strong>Priority:</strong> {proposalData.priority_level}</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Campaign Budget</h3>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {formatCurrency(proposalData.total_budget_usd_cents)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {proposalData.influencer_proposals.length} influencers • {' '}
                        {proposalData.influencer_proposals.reduce((sum, ip) =>
                          sum + ip.deliverables.reduce((dSum, d) => dSum + d.quantity, 0), 0
                        )} total deliverables
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Influencers Summary */}
                  <div>
                    <h3 className="font-medium mb-4">Influencer Breakdown</h3>
                    <div className="space-y-3">
                      {proposalData.influencer_proposals.map(ip => (
                        <div key={ip.influencer.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={ip.influencer.profile_picture_url}
                                alt={ip.influencer.username}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-medium">@{ip.influencer.username}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatFollowers(ip.influencer.followers_count)} followers
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(ip.total_cost_usd_cents)}</div>
                              <div className="text-sm text-muted-foreground">
                                {ip.deliverables.reduce((sum, d) => sum + d.quantity, 0)} deliverables
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {ip.deliverables.map((d, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {d.quantity}× {d.type.replace('_', ' ')} • {formatCurrency(d.price_usd_cents * d.quantity)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Draft'}
                      </Button>
                      <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Proposal'}
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Add Influencer Dialog */}
            <Dialog open={showAddInfluencer} onOpenChange={setShowAddInfluencer}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Add Influencer to Proposal</DialogTitle>
                  <DialogDescription>
                    Search and select influencers from our database
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Results */}
                  <ScrollArea className="h-96">
                    {loadingInfluencers ? (
                      <div className="text-center py-8">Loading influencers...</div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {influencers
                          .filter(inf => !proposalData.influencer_proposals.some(ip => ip.influencer.id === inf.id))
                          .map(influencer => (
                            <Card key={influencer.id} className="cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => addInfluencerToProposal(influencer)}>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={influencer.profile_picture_url}
                                    alt={influencer.username}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">@{influencer.username}</span>
                                      {influencer.verified && <UserCheck className="h-4 w-4 text-blue-500" />}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{influencer.full_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatFollowers(influencer.followers_count)} followers • {influencer.engagement_rate?.toFixed(1)}% engagement
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Influencer Card Component for managing individual deliverables
function InfluencerCard({
  influencerProposal,
  onUpdate,
  onRemove,
  isEditing,
  onEdit
}: {
  influencerProposal: InfluencerProposal
  onUpdate: (deliverables: DeliverableItem[]) => void
  onRemove: () => void
  isEditing: boolean
  onEdit: () => void
}) {
  const { influencer, deliverables } = influencerProposal
  const [localDeliverables, setLocalDeliverables] = useState<DeliverableItem[]>(deliverables)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${Math.floor(count / 1000)}K`
    return count.toString()
  }

  const addDeliverable = () => {
    const newDeliverable: DeliverableItem = {
      type: 'post',
      quantity: 1,
      price_usd_cents: 0,
      description: ''
    }
    setLocalDeliverables([...localDeliverables, newDeliverable])
  }

  const updateDeliverable = (index: number, updates: Partial<DeliverableItem>) => {
    const updated = localDeliverables.map((d, i) => i === index ? { ...d, ...updates } : d)
    setLocalDeliverables(updated)
  }

  const removeDeliverable = (index: number) => {
    setLocalDeliverables(localDeliverables.filter((_, i) => i !== index))
  }

  const saveChanges = () => {
    onUpdate(localDeliverables)
    onEdit()
  }

  const cancelChanges = () => {
    setLocalDeliverables(deliverables)
    onEdit()
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={influencer.profile_picture_url}
              alt={influencer.username}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">@{influencer.username}</span>
                {influencer.verified && <UserCheck className="h-4 w-4 text-blue-500" />}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatFollowers(influencer.followers_count)} followers • {influencer.engagement_rate?.toFixed(1)}% engagement
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-medium">{formatCurrency(influencerProposal.total_cost_usd_cents)}</div>
              <div className="text-sm text-muted-foreground">
                {deliverables.reduce((sum, d) => sum + d.quantity, 0)} deliverables
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Deliverables Section */}
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Deliverables & Pricing</h4>
              <Button variant="outline" size="sm" onClick={addDeliverable}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </div>

            {localDeliverables.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No deliverables added</p>
                <Button variant="outline" size="sm" onClick={addDeliverable} className="mt-2">
                  Add First Deliverable
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {localDeliverables.map((deliverable, index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-5 p-3 border rounded-lg">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={deliverable.type}
                        onValueChange={(value) => updateDeliverable(index, { type: value as any })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {deliverableTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={deliverable.quantity}
                        onChange={(e) => updateDeliverable(index, { quantity: parseInt(e.target.value) || 1 })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={deliverable.price_usd_cents / 100}
                        onChange={(e) => updateDeliverable(index, { price_usd_cents: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Total</Label>
                      <div className="h-8 flex items-center text-sm font-medium">
                        {formatCurrency(deliverable.price_usd_cents * deliverable.quantity)}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" size="sm" onClick={() => removeDeliverable(index)} className="h-8 w-8 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelChanges}>Cancel</Button>
              <Button onClick={saveChanges}>Save Changes</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {deliverables.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No deliverables set. Click edit to add deliverables.
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {deliverables.map((d, i) => (
                  <Badge key={i} variant="outline" className="text-sm">
                    {d.quantity}× {d.type.replace('_', ' ')} • {formatCurrency(d.price_usd_cents * d.quantity)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}