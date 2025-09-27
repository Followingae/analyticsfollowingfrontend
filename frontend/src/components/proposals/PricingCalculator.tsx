'use client'

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Star,
  Crown,
  Diamond,
  Info,
  Download,
  Share
} from "lucide-react"

import { superadminApiService } from "@/services/superadminApi"
import { toast } from "sonner"

interface Deliverable {
  type: 'story' | 'post' | 'reel' | 'ugc_video' | 'story_series' | 'carousel_post' | 'igtv'
  quantity: number
}

interface InfluencerSelection {
  profile_id: string
  username: string
  full_name: string
  followers_count: number
  tier: 'standard' | 'premium' | 'exclusive'
  pricing: {
    story_price_usd_cents: number
    post_price_usd_cents: number
    reel_price_usd_cents: number
    ugc_video_price_usd_cents: number
    story_series_price_usd_cents: number
    carousel_post_price_usd_cents: number
    igtv_price_usd_cents: number
  }
  package_pricing?: {
    three_posts_discount_percent: number
    five_posts_discount_percent: number
    ten_posts_discount_percent: number
  }
  volume_discounts?: {
    large_campaign_threshold_usd_cents: number
    large_campaign_discount_percent: number
  }
  negotiable: boolean
  minimum_campaign_value_usd_cents: number
}

interface CalculationResult {
  influencer_id: string
  base_cost: number
  package_discount: number
  volume_discount: number
  final_cost: number
  deliverables_breakdown: Array<{
    type: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

interface PricingCalculatorProps {
  preselectedInfluencers?: InfluencerSelection[]
  preselectedDeliverables?: Deliverable[]
  onCalculationComplete?: (results: CalculationResult[]) => void
}

const DELIVERABLE_TYPES = [
  { value: 'story', label: 'Instagram Story' },
  { value: 'post', label: 'Feed Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'ugc_video', label: 'UGC Video' },
  { value: 'story_series', label: 'Story Series' },
  { value: 'carousel_post', label: 'Carousel Post' },
  { value: 'igtv', label: 'IGTV' }
]

export function PricingCalculator({
  preselectedInfluencers = [],
  preselectedDeliverables = [],
  onCalculationComplete
}: PricingCalculatorProps) {
  const [selectedInfluencers, setSelectedInfluencers] = useState<InfluencerSelection[]>(preselectedInfluencers)
  const [deliverables, setDeliverables] = useState<Deliverable[]>(
    preselectedDeliverables.length > 0 ? preselectedDeliverables : [{ type: 'post', quantity: 1 }]
  )
  const [availableInfluencers, setAvailableInfluencers] = useState<InfluencerSelection[]>([])
  const [calculations, setCalculations] = useState<CalculationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [applyPackageDiscounts, setApplyPackageDiscounts] = useState(true)
  const [applyVolumeDiscounts, setApplyVolumeDiscounts] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Load available influencers with pricing
  useEffect(() => {
    const loadInfluencers = async () => {
      try {
        // Mock data - replace with actual API call
        setAvailableInfluencers([
          {
            profile_id: '1',
            username: 'fashionista_uae',
            full_name: 'Layla Al-Rashid',
            followers_count: 125000,
            tier: 'premium',
            pricing: {
              story_price_usd_cents: 25000, // $250
              post_price_usd_cents: 50000,  // $500
              reel_price_usd_cents: 75000,  // $750
              ugc_video_price_usd_cents: 100000, // $1000
              story_series_price_usd_cents: 150000, // $1500
              carousel_post_price_usd_cents: 60000, // $600
              igtv_price_usd_cents: 80000 // $800
            },
            package_pricing: {
              three_posts_discount_percent: 5,
              five_posts_discount_percent: 10,
              ten_posts_discount_percent: 15
            },
            volume_discounts: {
              large_campaign_threshold_usd_cents: 1500000, // $15,000
              large_campaign_discount_percent: 12
            },
            negotiable: true,
            minimum_campaign_value_usd_cents: 750000 // $7,500
          },
          {
            profile_id: '2',
            username: 'tech_reviewer_dubai',
            full_name: 'Omar Khalil',
            followers_count: 89000,
            tier: 'standard',
            pricing: {
              story_price_usd_cents: 20000, // $200
              post_price_usd_cents: 40000,  // $400
              reel_price_usd_cents: 60000,  // $600
              ugc_video_price_usd_cents: 80000, // $800
              story_series_price_usd_cents: 120000, // $1200
              carousel_post_price_usd_cents: 45000, // $450
              igtv_price_usd_cents: 65000 // $650
            },
            package_pricing: {
              three_posts_discount_percent: 5,
              five_posts_discount_percent: 10,
              ten_posts_discount_percent: 15
            },
            volume_discounts: {
              large_campaign_threshold_usd_cents: 1000000, // $10,000
              large_campaign_discount_percent: 10
            },
            negotiable: true,
            minimum_campaign_value_usd_cents: 500000 // $5,000
          },
          {
            profile_id: '3',
            username: 'luxury_lifestyle_me',
            full_name: 'Sophia Martinez',
            followers_count: 250000,
            tier: 'exclusive',
            pricing: {
              story_price_usd_cents: 40000, // $400
              post_price_usd_cents: 80000,  // $800
              reel_price_usd_cents: 120000, // $1200
              ugc_video_price_usd_cents: 150000, // $1500
              story_series_price_usd_cents: 200000, // $2000
              carousel_post_price_usd_cents: 100000, // $1000
              igtv_price_usd_cents: 130000 // $1300
            },
            package_pricing: {
              three_posts_discount_percent: 3,
              five_posts_discount_percent: 7,
              ten_posts_discount_percent: 12
            },
            volume_discounts: {
              large_campaign_threshold_usd_cents: 2000000, // $20,000
              large_campaign_discount_percent: 15
            },
            negotiable: false,
            minimum_campaign_value_usd_cents: 1000000 // $10,000
          }
        ])
      } catch (error) {
        console.error('Failed to load influencers:', error)
      }
    }

    loadInfluencers()
  }, [])

  // Calculate pricing when inputs change
  useEffect(() => {
    if (selectedInfluencers.length > 0 && deliverables.length > 0) {
      calculatePricing()
    }
  }, [selectedInfluencers, deliverables, applyPackageDiscounts, applyVolumeDiscounts])

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
      case 'standard': return <Star className="h-3 w-3 text-gray-500" />
      case 'premium': return <Crown className="h-3 w-3 text-yellow-500" />
      case 'exclusive': return <Diamond className="h-3 w-3 text-purple-500" />
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

  const addDeliverable = () => {
    setDeliverables([...deliverables, { type: 'post', quantity: 1 }])
  }

  const updateDeliverable = (index: number, updates: Partial<Deliverable>) => {
    setDeliverables(prev => prev.map((d, i) => i === index ? { ...d, ...updates } : d))
  }

  const removeDeliverable = (index: number) => {
    if (deliverables.length > 1) {
      setDeliverables(prev => prev.filter((_, i) => i !== index))
    }
  }

  const addInfluencer = (influencer: InfluencerSelection) => {
    if (!selectedInfluencers.some(i => i.profile_id === influencer.profile_id)) {
      setSelectedInfluencers([...selectedInfluencers, influencer])
    }
  }

  const removeInfluencer = (profileId: string) => {
    setSelectedInfluencers(prev => prev.filter(i => i.profile_id !== profileId))
  }

  const calculatePricing = async () => {
    setLoading(true)
    try {
      const results: CalculationResult[] = []

      for (const influencer of selectedInfluencers) {
        let baseCost = 0
        const deliverablesBreakdown: CalculationResult['deliverables_breakdown'] = []

        // Calculate base cost for each deliverable
        deliverables.forEach(deliverable => {
          const priceKey = `${deliverable.type}_price_usd_cents` as keyof typeof influencer.pricing
          const unitPrice = influencer.pricing[priceKey] || 0
          const totalPrice = unitPrice * deliverable.quantity

          baseCost += totalPrice
          deliverablesBreakdown.push({
            type: deliverable.type,
            quantity: deliverable.quantity,
            unit_price: unitPrice,
            total_price: totalPrice
          })
        })

        // Apply package discounts if enabled
        let packageDiscount = 0
        if (applyPackageDiscounts && influencer.package_pricing) {
          const totalPosts = deliverables
            .filter(d => d.type === 'post' || d.type === 'carousel_post')
            .reduce((sum, d) => sum + d.quantity, 0)

          if (totalPosts >= 10) {
            packageDiscount = baseCost * (influencer.package_pricing.ten_posts_discount_percent / 100)
          } else if (totalPosts >= 5) {
            packageDiscount = baseCost * (influencer.package_pricing.five_posts_discount_percent / 100)
          } else if (totalPosts >= 3) {
            packageDiscount = baseCost * (influencer.package_pricing.three_posts_discount_percent / 100)
          }
        }

        // Apply volume discounts if enabled
        let volumeDiscount = 0
        if (applyVolumeDiscounts && influencer.volume_discounts && baseCost >= influencer.volume_discounts.large_campaign_threshold_usd_cents) {
          volumeDiscount = (baseCost - packageDiscount) * (influencer.volume_discounts.large_campaign_discount_percent / 100)
        }

        const finalCost = Math.max(
          baseCost - packageDiscount - volumeDiscount,
          influencer.minimum_campaign_value_usd_cents
        )

        results.push({
          influencer_id: influencer.profile_id,
          base_cost: baseCost,
          package_discount: packageDiscount,
          volume_discount: volumeDiscount,
          final_cost: finalCost,
          deliverables_breakdown: deliverablesBreakdown
        })
      }

      setCalculations(results)
      if (onCalculationComplete) {
        onCalculationComplete(results)
      }
    } catch (error) {
      console.error('Failed to calculate pricing:', error)
      toast.error('Failed to calculate pricing')
    } finally {
      setLoading(false)
    }
  }

  const totalCost = calculations.reduce((sum, calc) => sum + calc.final_cost, 0)
  const totalSavings = calculations.reduce((sum, calc) => sum + calc.package_discount + calc.volume_discount, 0)

  const filteredInfluencers = availableInfluencers.filter(inf =>
    !selectedInfluencers.some(sel => sel.profile_id === inf.profile_id) &&
    (inf.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inf.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Campaign Pricing Calculator</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Quote
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share Calculation
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Influencers</span>
            </div>
            <div className="text-2xl font-bold">{selectedInfluencers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Cost</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Savings</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalSavings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Deliverables</span>
            </div>
            <div className="text-2xl font-bold">{deliverables.reduce((sum, d) => sum + d.quantity, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Deliverables */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Campaign Deliverables</CardTitle>
                <Button onClick={addDeliverable} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Select
                    value={deliverable.type}
                    onValueChange={(value: any) => updateDeliverable(index, { type: value })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERABLE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    value={deliverable.quantity}
                    onChange={(e) => updateDeliverable(index, { quantity: parseInt(e.target.value) || 1 })}
                    className="w-20"
                    min="1"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDeliverable(index)}
                    disabled={deliverables.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Discount Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Discount Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="package-discounts">Apply Package Discounts</Label>
                  <p className="text-sm text-muted-foreground">Bulk discounts for multiple posts</p>
                </div>
                <Switch
                  id="package-discounts"
                  checked={applyPackageDiscounts}
                  onCheckedChange={setApplyPackageDiscounts}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="volume-discounts">Apply Volume Discounts</Label>
                  <p className="text-sm text-muted-foreground">Discounts for high-value campaigns</p>
                </div>
                <Switch
                  id="volume-discounts"
                  checked={applyVolumeDiscounts}
                  onCheckedChange={setApplyVolumeDiscounts}
                />
              </div>
            </CardContent>
          </Card>

          {/* Influencer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Influencers</CardTitle>
              <CardDescription>Search and add influencers to your calculation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search influencers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredInfluencers.map(influencer => (
                    <div key={influencer.profile_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">@{influencer.username}</div>
                        <div className="text-sm text-muted-foreground">{influencer.full_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {influencer.followers_count.toLocaleString()} followers
                          </Badge>
                          <Badge className={`text-xs ${getTierColor(influencer.tier)}`}>
                            <div className="flex items-center gap-1">
                              {getTierIcon(influencer.tier)}
                              {influencer.tier}
                            </div>
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addInfluencer(influencer)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {filteredInfluencers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No influencers available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Selected Influencers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Influencers ({selectedInfluencers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedInfluencers.map(influencer => (
                  <div key={influencer.profile_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">@{influencer.username}</div>
                      <div className="text-sm text-muted-foreground">{influencer.full_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {influencer.followers_count.toLocaleString()} followers
                        </Badge>
                        <Badge className={`text-xs ${getTierColor(influencer.tier)}`}>
                          <div className="flex items-center gap-1">
                            {getTierIcon(influencer.tier)}
                            {influencer.tier}
                          </div>
                        </Badge>
                        {influencer.negotiable && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Negotiable
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeInfluencer(influencer.profile_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {selectedInfluencers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Add influencers to see pricing calculation</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calculation Results */}
          {calculations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing Breakdown</CardTitle>
                <CardDescription>Detailed cost analysis for each influencer</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Base Cost</TableHead>
                      <TableHead>Discounts</TableHead>
                      <TableHead>Final Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((calc) => {
                      const influencer = selectedInfluencers.find(i => i.profile_id === calc.influencer_id)
                      if (!influencer) return null

                      return (
                        <TableRow key={calc.influencer_id}>
                          <TableCell>
                            <div className="font-medium">@{influencer.username}</div>
                          </TableCell>
                          <TableCell>{formatCurrency(calc.base_cost)}</TableCell>
                          <TableCell>
                            {calc.package_discount > 0 || calc.volume_discount > 0 ? (
                              <div className="text-sm">
                                {calc.package_discount > 0 && (
                                  <div className="text-blue-600">
                                    -{formatCurrency(calc.package_discount)} (package)
                                  </div>
                                )}
                                {calc.volume_discount > 0 && (
                                  <div className="text-green-600">
                                    -{formatCurrency(calc.volume_discount)} (volume)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(calc.final_cost)}
                            </div>
                            {calc.final_cost === influencer.minimum_campaign_value_usd_cents && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Minimum reached
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Campaign Cost:</span>
                  <span className="text-green-600">{formatCurrency(totalCost)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                    <span>Total Savings:</span>
                    <span className="text-blue-600">-{formatCurrency(totalSavings)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}