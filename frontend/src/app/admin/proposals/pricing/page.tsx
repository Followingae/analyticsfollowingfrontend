'use client'

import { useState, useEffect } from "react"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  RefreshCw,
  Calculator,
  Settings,
  Crown,
  Diamond,
  Sparkles,
  Target,
  Zap
} from "lucide-react"

import {
  superadminApiService
} from "@/services/superadminApi"
import { toast } from "sonner"

interface InfluencerPricing {
  profile_id: string
  instagram_username: string
  full_name: string
  followers_count: number
  engagement_rate?: number
  story_price_usd_cents: number
  post_price_usd_cents: number
  reel_price_usd_cents: number
  ugc_video_price_usd_cents: number
  story_series_price_usd_cents: number
  carousel_post_price_usd_cents: number
  igtv_price_usd_cents: number
  pricing_tier: 'standard' | 'premium' | 'exclusive'
  negotiable: boolean
  minimum_campaign_value_usd_cents: number
  package_pricing?: {
    three_posts_discount_percent: number
    five_posts_discount_percent: number
    ten_posts_discount_percent: number
  }
  volume_discounts?: {
    large_campaign_threshold_usd_cents: number
    large_campaign_discount_percent: number
  }
  last_updated: string
  created_at: string
}

interface PricingFormData {
  profile_id?: string
  instagram_username: string
  story_price_usd_cents: number
  post_price_usd_cents: number
  reel_price_usd_cents: number
  ugc_video_price_usd_cents: number
  story_series_price_usd_cents: number
  carousel_post_price_usd_cents: number
  igtv_price_usd_cents: number
  pricing_tier: 'standard' | 'premium' | 'exclusive'
  negotiable: boolean
  minimum_campaign_value_usd_cents: number
  package_pricing: {
    three_posts_discount_percent: number
    five_posts_discount_percent: number
    ten_posts_discount_percent: number
  }
  volume_discounts: {
    large_campaign_threshold_usd_cents: number
    large_campaign_discount_percent: number
  }
}

export default function InfluencerPricingPage() {
  const [pricingData, setPricingData] = useState<InfluencerPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPricing, setEditingPricing] = useState<InfluencerPricing | null>(null)
  const [formData, setFormData] = useState<PricingFormData>({
    instagram_username: '',
    story_price_usd_cents: 25000, // $250
    post_price_usd_cents: 50000,  // $500
    reel_price_usd_cents: 75000,  // $750
    ugc_video_price_usd_cents: 100000, // $1000
    story_series_price_usd_cents: 150000, // $1500
    carousel_post_price_usd_cents: 60000, // $600
    igtv_price_usd_cents: 80000, // $800
    pricing_tier: 'standard',
    negotiable: true,
    minimum_campaign_value_usd_cents: 500000, // $5000
    package_pricing: {
      three_posts_discount_percent: 5,
      five_posts_discount_percent: 10,
      ten_posts_discount_percent: 15
    },
    volume_discounts: {
      large_campaign_threshold_usd_cents: 1000000, // $10,000
      large_campaign_discount_percent: 10
    }
  })

  const loadPricingData = async () => {
    setLoading(true)
    try {
      // This would be the real API call
      // const result = await superadminApiService.getInfluencersPricing()

      // Mock data for development
      setPricingData([
        {
          profile_id: '1',
          instagram_username: 'fashionista_uae',
          full_name: 'Layla Al-Rashid',
          followers_count: 125000,
          engagement_rate: 4.2,
          story_price_usd_cents: 25000,
          post_price_usd_cents: 50000,
          reel_price_usd_cents: 75000,
          ugc_video_price_usd_cents: 100000,
          story_series_price_usd_cents: 150000,
          carousel_post_price_usd_cents: 60000,
          igtv_price_usd_cents: 80000,
          pricing_tier: 'premium',
          negotiable: true,
          minimum_campaign_value_usd_cents: 750000,
          package_pricing: {
            three_posts_discount_percent: 5,
            five_posts_discount_percent: 10,
            ten_posts_discount_percent: 15
          },
          volume_discounts: {
            large_campaign_threshold_usd_cents: 1500000,
            large_campaign_discount_percent: 12
          },
          last_updated: '2024-01-15T10:30:00Z',
          created_at: '2024-01-01T08:00:00Z'
        },
        {
          profile_id: '2',
          instagram_username: 'tech_reviewer_dubai',
          full_name: 'Omar Khalil',
          followers_count: 89000,
          engagement_rate: 3.8,
          story_price_usd_cents: 20000,
          post_price_usd_cents: 40000,
          reel_price_usd_cents: 60000,
          ugc_video_price_usd_cents: 80000,
          story_series_price_usd_cents: 120000,
          carousel_post_price_usd_cents: 45000,
          igtv_price_usd_cents: 65000,
          pricing_tier: 'standard',
          negotiable: true,
          minimum_campaign_value_usd_cents: 500000,
          last_updated: '2024-01-14T15:20:00Z',
          created_at: '2024-01-02T12:30:00Z'
        },
        {
          profile_id: '3',
          instagram_username: 'luxury_lifestyle_me',
          full_name: 'Sophia Martinez',
          followers_count: 250000,
          engagement_rate: 5.1,
          story_price_usd_cents: 40000,
          post_price_usd_cents: 80000,
          reel_price_usd_cents: 120000,
          ugc_video_price_usd_cents: 150000,
          story_series_price_usd_cents: 200000,
          carousel_post_price_usd_cents: 100000,
          igtv_price_usd_cents: 130000,
          pricing_tier: 'exclusive',
          negotiable: false,
          minimum_campaign_value_usd_cents: 1000000,
          package_pricing: {
            three_posts_discount_percent: 3,
            five_posts_discount_percent: 7,
            ten_posts_discount_percent: 12
          },
          volume_discounts: {
            large_campaign_threshold_usd_cents: 2000000,
            large_campaign_discount_percent: 15
          },
          last_updated: '2024-01-13T09:45:00Z',
          created_at: '2024-01-03T14:15:00Z'
        }
      ])
    } catch (error) {
      console.error('Failed to load pricing data:', error)
      toast.error('Failed to load pricing data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPricingData()
  }, [])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'standard': return <Star className="h-4 w-4 text-gray-500" />
      case 'premium': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'exclusive': return <Diamond className="h-4 w-4 text-purple-500" />
      default: return null
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'standard': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'premium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'exclusive': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPricing = pricingData.filter(pricing => {
    const matchesSearch = pricing.instagram_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pricing.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = tierFilter === 'all' || pricing.pricing_tier === tierFilter
    return matchesSearch && matchesTier
  })

  const openEditDialog = (pricing: InfluencerPricing) => {
    setEditingPricing(pricing)
    setFormData({
      profile_id: pricing.profile_id,
      instagram_username: pricing.instagram_username,
      story_price_usd_cents: pricing.story_price_usd_cents,
      post_price_usd_cents: pricing.post_price_usd_cents,
      reel_price_usd_cents: pricing.reel_price_usd_cents,
      ugc_video_price_usd_cents: pricing.ugc_video_price_usd_cents,
      story_series_price_usd_cents: pricing.story_series_price_usd_cents,
      carousel_post_price_usd_cents: pricing.carousel_post_price_usd_cents,
      igtv_price_usd_cents: pricing.igtv_price_usd_cents,
      pricing_tier: pricing.pricing_tier,
      negotiable: pricing.negotiable,
      minimum_campaign_value_usd_cents: pricing.minimum_campaign_value_usd_cents,
      package_pricing: pricing.package_pricing || formData.package_pricing,
      volume_discounts: pricing.volume_discounts || formData.volume_discounts
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (editingPricing) {
        // Update existing pricing
        const result = await superadminApiService.setInfluencerPricing(editingPricing.profile_id, formData)
        if (result.success) {
          toast.success('Pricing updated successfully')
          loadPricingData()
        } else {
          toast.error('Failed to update pricing: ' + (result.error || 'Unknown error'))
        }
      } else {
        // Create new pricing
        const result = await superadminApiService.setInfluencerPricing('new', formData)
        if (result.success) {
          toast.success('Pricing created successfully')
          loadPricingData()
        } else {
          toast.error('Failed to create pricing: ' + (result.error || 'Unknown error'))
        }
      }
      setDialogOpen(false)
      setEditingPricing(null)
    } catch (error) {
      console.error('Failed to save pricing:', error)
      toast.error('Failed to save pricing')
    } finally {
      setLoading(false)
    }
  }

  const calculatePackagePrice = (basePrice: number, quantity: number) => {
    const discounts = formData.package_pricing
    if (quantity >= 10) return basePrice * quantity * (1 - discounts.ten_posts_discount_percent / 100)
    if (quantity >= 5) return basePrice * quantity * (1 - discounts.five_posts_discount_percent / 100)
    if (quantity >= 3) return basePrice * quantity * (1 - discounts.three_posts_discount_percent / 100)
    return basePrice * quantity
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
      <SuperadminSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Influencer Pricing Management</h1>
                <p className="text-muted-foreground">Set and manage pricing tiers for influencer collaborations</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={loadPricingData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => {
                  setEditingPricing(null)
                  setFormData({
                    instagram_username: '',
                    story_price_usd_cents: 25000,
                    post_price_usd_cents: 50000,
                    reel_price_usd_cents: 75000,
                    ugc_video_price_usd_cents: 100000,
                    story_series_price_usd_cents: 150000,
                    carousel_post_price_usd_cents: 60000,
                    igtv_price_usd_cents: 80000,
                    pricing_tier: 'standard',
                    negotiable: true,
                    minimum_campaign_value_usd_cents: 500000,
                    package_pricing: {
                      three_posts_discount_percent: 5,
                      five_posts_discount_percent: 10,
                      ten_posts_discount_percent: 15
                    },
                    volume_discounts: {
                      large_campaign_threshold_usd_cents: 1000000,
                      large_campaign_discount_percent: 10
                    }
                  })
                  setDialogOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pricing
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pricingData.length}</div>
                  <p className="text-xs text-muted-foreground">With pricing data</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Post Price</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(pricingData.reduce((sum, p) => sum + p.post_price_usd_cents, 0) / Math.max(pricingData.length, 1))}
                  </div>
                  <p className="text-xs text-muted-foreground">Per post</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Premium Tier</CardTitle>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {pricingData.filter(p => p.pricing_tier === 'premium').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Premium influencers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Negotiable</CardTitle>
                  <Target className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {pricingData.filter(p => p.negotiable).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Flexible pricing</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search influencers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Calculator className="h-4 w-4 mr-2" />
                  Bulk Calculator
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Import/Export
                </Button>
              </div>
            </div>

            {/* Pricing Table */}
            <Card>
              <CardHeader>
                <CardTitle>Influencer Pricing Overview</CardTitle>
                <CardDescription>Manage pricing for all content types and tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Story</TableHead>
                      <TableHead>Post</TableHead>
                      <TableHead>Reel</TableHead>
                      <TableHead>Min Campaign</TableHead>
                      <TableHead>Negotiable</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPricing.map((pricing) => (
                      <TableRow key={pricing.profile_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">@{pricing.instagram_username}</div>
                            <div className="text-sm text-muted-foreground">{pricing.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {pricing.followers_count.toLocaleString()} followers
                              {pricing.engagement_rate && ` • ${pricing.engagement_rate}% ER`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTierColor(pricing.pricing_tier)}>
                            <div className="flex items-center gap-1">
                              {getTierIcon(pricing.pricing_tier)}
                              {pricing.pricing_tier}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(pricing.story_price_usd_cents)}</TableCell>
                        <TableCell>{formatCurrency(pricing.post_price_usd_cents)}</TableCell>
                        <TableCell>{formatCurrency(pricing.reel_price_usd_cents)}</TableCell>
                        <TableCell>{formatCurrency(pricing.minimum_campaign_value_usd_cents)}</TableCell>
                        <TableCell>
                          {pricing.negotiable ? (
                            <Badge variant="outline" className="text-green-600">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(pricing)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Pricing
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calculator className="h-4 w-4 mr-2" />
                                Price Calculator
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Pricing
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredPricing.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pricing data found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No influencers match your search criteria.' : 'Start by adding pricing for your influencers.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Form Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPricing ? 'Edit Pricing' : 'Add New Pricing'}
                  </DialogTitle>
                  <DialogDescription>
                    Set comprehensive pricing structure for influencer collaborations
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Pricing</TabsTrigger>
                    <TabsTrigger value="packages">Package Deals</TabsTrigger>
                    <TabsTrigger value="discounts">Volume Discounts</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="username">Instagram Username</Label>
                        <Input
                          id="username"
                          value={formData.instagram_username}
                          onChange={(e) => setFormData(prev => ({ ...prev, instagram_username: e.target.value }))}
                          placeholder="@username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Pricing Tier</Label>
                        <Select
                          value={formData.pricing_tier}
                          onValueChange={(value: any) => setFormData(prev => ({ ...prev, pricing_tier: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Story Price</Label>
                        <Input
                          type="number"
                          value={formData.story_price_usd_cents / 100}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            story_price_usd_cents: Math.round(parseFloat(e.target.value) * 100) || 0
                          }))}
                          placeholder="250"
                        />
                        <p className="text-xs text-muted-foreground">USD per story</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Post Price</Label>
                        <Input
                          type="number"
                          value={formData.post_price_usd_cents / 100}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            post_price_usd_cents: Math.round(parseFloat(e.target.value) * 100) || 0
                          }))}
                          placeholder="500"
                        />
                        <p className="text-xs text-muted-foreground">USD per post</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Reel Price</Label>
                        <Input
                          type="number"
                          value={formData.reel_price_usd_cents / 100}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            reel_price_usd_cents: Math.round(parseFloat(e.target.value) * 100) || 0
                          }))}
                          placeholder="750"
                        />
                        <p className="text-xs text-muted-foreground">USD per reel</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>UGC Video Price</Label>
                        <Input
                          type="number"
                          value={formData.ugc_video_price_usd_cents / 100}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            ugc_video_price_usd_cents: Math.round(parseFloat(e.target.value) * 100) || 0
                          }))}
                          placeholder="1000"
                        />
                        <p className="text-xs text-muted-foreground">USD per UGC video</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Minimum Campaign Value</Label>
                        <Input
                          type="number"
                          value={formData.minimum_campaign_value_usd_cents / 100}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            minimum_campaign_value_usd_cents: Math.round(parseFloat(e.target.value) * 100) || 0
                          }))}
                          placeholder="5000"
                        />
                        <p className="text-xs text-muted-foreground">Minimum total campaign value</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="negotiable"
                        checked={formData.negotiable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, negotiable: checked }))}
                      />
                      <Label htmlFor="negotiable">Pricing is negotiable</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="packages" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-4">Package Discount Tiers</h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>3+ Posts Discount</Label>
                          <Input
                            type="number"
                            value={formData.package_pricing.three_posts_discount_percent}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              package_pricing: {
                                ...prev.package_pricing,
                                three_posts_discount_percent: parseInt(e.target.value) || 0
                              }
                            }))}
                            placeholder="5"
                          />
                          <p className="text-xs text-muted-foreground">Percentage discount</p>
                        </div>

                        <div className="space-y-2">
                          <Label>5+ Posts Discount</Label>
                          <Input
                            type="number"
                            value={formData.package_pricing.five_posts_discount_percent}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              package_pricing: {
                                ...prev.package_pricing,
                                five_posts_discount_percent: parseInt(e.target.value) || 0
                              }
                            }))}
                            placeholder="10"
                          />
                          <p className="text-xs text-muted-foreground">Percentage discount</p>
                        </div>

                        <div className="space-y-2">
                          <Label>10+ Posts Discount</Label>
                          <Input
                            type="number"
                            value={formData.package_pricing.ten_posts_discount_percent}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              package_pricing: {
                                ...prev.package_pricing,
                                ten_posts_discount_percent: parseInt(e.target.value) || 0
                              }
                            }))}
                            placeholder="15"
                          />
                          <p className="text-xs text-muted-foreground">Percentage discount</p>
                        </div>
                      </div>
                    </div>

                    {/* Package Pricing Preview */}
                    <div>
                      <h4 className="font-semibold mb-4">Package Pricing Preview</h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardContent className="p-4">
                            <h5 className="font-medium mb-2">3 Posts Package</h5>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(calculatePackagePrice(formData.post_price_usd_cents, 3))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Save {formatCurrency(formData.post_price_usd_cents * 3 - calculatePackagePrice(formData.post_price_usd_cents, 3))}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <h5 className="font-medium mb-2">5 Posts Package</h5>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(calculatePackagePrice(formData.post_price_usd_cents, 5))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Save {formatCurrency(formData.post_price_usd_cents * 5 - calculatePackagePrice(formData.post_price_usd_cents, 5))}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <h5 className="font-medium mb-2">10 Posts Package</h5>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(calculatePackagePrice(formData.post_price_usd_cents, 10))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Save {formatCurrency(formData.post_price_usd_cents * 10 - calculatePackagePrice(formData.post_price_usd_cents, 10))}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="discounts" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-4">Volume Discount Settings</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Large Campaign Threshold</Label>
                          <Input
                            type="number"
                            value={formData.volume_discounts.large_campaign_threshold_usd_cents / 100}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              volume_discounts: {
                                ...prev.volume_discounts,
                                large_campaign_threshold_usd_cents: Math.round(parseFloat(e.target.value) * 100) || 0
                              }
                            }))}
                            placeholder="10000"
                          />
                          <p className="text-xs text-muted-foreground">Campaign value threshold for volume discount</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Volume Discount Percentage</Label>
                          <Input
                            type="number"
                            value={formData.volume_discounts.large_campaign_discount_percent}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              volume_discounts: {
                                ...prev.volume_discounts,
                                large_campaign_discount_percent: parseInt(e.target.value) || 0
                              }
                            }))}
                            placeholder="10"
                          />
                          <p className="text-xs text-muted-foreground">Additional discount for large campaigns</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : (editingPricing ? 'Update Pricing' : 'Create Pricing')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}