'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  brandProposalsApi,
  BrandProposal
} from '@/services/proposalsApi'
import {
  Clock,
  CheckCircle,
  Users,
  MapPin,
  TrendingUp,
  Instagram,
  Grid3X3,
  List,
  ArrowLeft,
  Target,
  Heart,
  MessageCircle,
  Share2,
  UserCheck,
  UserX,
  Globe,
  Calendar,
  DollarSign,
  BarChart3
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { InfluencerAnalyticsDialog } from './InfluencerAnalyticsDialog'

export const dynamic = 'force-dynamic'

interface Influencer {
  id: string
  instagram_username: string
  followers_count: number
  engagement_rate: number
  avg_likes: number
  avg_comments: number
  profile_picture_url?: string
  location?: string
  gender_split?: {
    male: number
    female: number
  }
  age_groups?: {
    '18-24': number
    '25-34': number
    '35-44': number
    '45-54': number
    '55+': number
  }
  assigned_deliverables: Array<{
    type: string
    quantity: number
    description?: string
  }>
  estimated_reach?: number
  cost_per_post?: number
}

interface UserProposalDetailProps {
  proposalId: string
}

export function UserProposalDetail({ proposalId }: UserProposalDetailProps) {
  const router = useRouter()
  const [proposal, setProposal] = useState<BrandProposal | null>(null)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFeatureLocked, setIsFeatureLocked] = useState(false)
  const [lockedFeature, setLockedFeature] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedInfluencerForAnalytics, setSelectedInfluencerForAnalytics] = useState<Influencer | null>(null)
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)

  // Load proposal and influencers data
  const loadProposalData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [proposalResult, influencersResult] = await Promise.all([
        brandProposalsApi.getProposal(proposalId),
        brandProposalsApi.getProposalInfluencers(proposalId)
      ])

      if (proposalResult.success && proposalResult.data) {
        setProposal(proposalResult.data)
      } else {
        throw new Error(proposalResult.error || 'Failed to load proposal')
      }

      if (influencersResult.success && influencersResult.data) {
        setInfluencers(influencersResult.data.influencers || [])
      } else {
        console.warn('Failed to load influencers:', influencersResult.error)
        setInfluencers([])
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load proposal data')
      console.error('Proposal load error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProposalData()
  }, [proposalId])

  // Calculate real-time KPIs based on selected influencers
  const selectedKPIs = useMemo(() => {
    const selected = influencers.filter(inf => selectedInfluencers.has(inf.id))

    if (selected.length === 0) {
      return {
        totalFollowers: 0,
        avgEngagementRate: 0,
        avgLocation: 'No location data',
        genderSplit: { male: 50, female: 50 },
        estimatedReach: 0,
        totalCost: 0
      }
    }

    const totalFollowers = selected.reduce((sum, inf) => sum + inf.followers_count, 0)
    const avgEngagementRate = selected.reduce((sum, inf) => sum + inf.engagement_rate, 0) / selected.length
    const estimatedReach = selected.reduce((sum, inf) => sum + (inf.estimated_reach || inf.followers_count * 0.1), 0)
    const totalCost = selected.reduce((sum, inf) => sum + (inf.cost_per_post || 0), 0)

    // Calculate average gender split
    const genderData = selected.filter(inf => inf.gender_split)
    const avgGenderSplit = genderData.length > 0
      ? {
          male: genderData.reduce((sum, inf) => sum + (inf.gender_split?.male || 50), 0) / genderData.length,
          female: genderData.reduce((sum, inf) => sum + (inf.gender_split?.female || 50), 0) / genderData.length
        }
      : { male: 50, female: 50 }

    // Get most common location
    const locations = selected.map(inf => inf.location).filter(Boolean)
    const locationCounts = locations.reduce((acc, loc) => {
      acc[loc!] = (acc[loc!] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const avgLocation = Object.keys(locationCounts).length > 0
      ? Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'Various locations'

    return {
      totalFollowers,
      avgEngagementRate,
      avgLocation,
      genderSplit: avgGenderSplit,
      estimatedReach,
      totalCost
    }
  }, [influencers, selectedInfluencers])

  const handleInfluencerToggle = (influencerId: string) => {
    setSelectedInfluencers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(influencerId)) {
        newSet.delete(influencerId)
      } else {
        newSet.add(influencerId)
      }
      return newSet
    })
  }

  const handleOpenAnalytics = (influencer: Influencer, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedInfluencerForAnalytics(influencer)
    setIsAnalyticsDialogOpen(true)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
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
              <p className="text-muted-foreground">Loading proposal...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !proposal) {
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
              <p className="text-red-600 dark:text-red-400">{error || 'Proposal not found'}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
                <Button variant="outline" onClick={() => loadProposalData()}>
                  Try Again
                </Button>
              </div>
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
        <div className="flex flex-1 flex-col h-full">
          {/* Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4 p-4 md:p-6">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Proposals
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{proposal.proposal_title}</h1>
                <p className="text-muted-foreground">
                  Budget: {formatCurrency(proposal.total_campaign_budget_usd_cents)} •
                  {influencers.length} Influencers Available
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedInfluencers.size} of {influencers.length} selected
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side - Influencers */}
            <div className="w-1/2 border-r bg-background flex flex-col">
              <div className="border-b p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Available Influencers</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Select influencers to see real-time analytics on the right
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {influencers.map((influencer) => (
                      <Card
                        key={influencer.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedInfluencers.has(influencer.id)
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleInfluencerToggle(influencer.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={influencer.profile_picture_url} />
                              <AvatarFallback>
                                {influencer.instagram_username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <h3 className="font-semibold">@{influencer.instagram_username}</h3>
                              <p className="text-sm text-muted-foreground">
                                {formatNumber(influencer.followers_count)} followers
                              </p>
                            </div>

                            <div className="w-full space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Engagement</span>
                                <span className="font-medium">{influencer.engagement_rate.toFixed(1)}%</span>
                              </div>
                              <Progress value={influencer.engagement_rate} className="h-1" />
                            </div>

                            {influencer.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {influencer.location}
                              </div>
                            )}

                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                {selectedInfluencers.has(influencer.id) ? (
                                  <UserCheck className="h-4 w-4 text-primary" />
                                ) : (
                                  <UserX className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-xs font-medium">
                                  {selectedInfluencers.has(influencer.id) ? 'Selected' : 'Click to select'}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={(e) => handleOpenAnalytics(influencer, e)}
                              >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Analytics
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {influencers.map((influencer) => (
                      <Card
                        key={influencer.id}
                        className={`cursor-pointer transition-all hover:shadow-sm ${
                          selectedInfluencers.has(influencer.id)
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleInfluencerToggle(influencer.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={influencer.profile_picture_url} />
                              <AvatarFallback>
                                {influencer.instagram_username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold truncate">@{influencer.instagram_username}</h3>
                                {selectedInfluencers.has(influencer.id) ? (
                                  <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
                                ) : (
                                  <UserX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2">
                                <div className="grid grid-cols-3 gap-4 text-sm flex-1">
                                  <div>
                                    <span className="text-muted-foreground">Followers</span>
                                    <p className="font-medium">{formatNumber(influencer.followers_count)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Engagement</span>
                                    <p className="font-medium">{influencer.engagement_rate.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Location</span>
                                    <p className="font-medium truncate">{influencer.location || 'N/A'}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-3"
                                  onClick={(e) => handleOpenAnalytics(influencer, e)}
                                >
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  Analytics
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {influencers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No influencers available</h3>
                    <p className="text-muted-foreground">
                      Following Agency will add influencers to this proposal.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Real-time KPIs with animated background */}
            <div className="w-1/2 bg-gradient-to-br from-background via-background to-primary/5 flex flex-col relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-primary/10 animate-pulse"></div>
                <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-primary/5 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full bg-primary/10 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 right-10 w-12 h-12 rounded-full bg-primary/5 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>

              <div className="relative z-10 border-b p-4">
                <h2 className="text-lg font-semibold">Live Campaign Analytics</h2>
                <p className="text-sm text-muted-foreground">
                  Real-time metrics based on your selection
                </p>
              </div>

              <div className="relative z-10 flex-1 overflow-y-auto p-4">
                {selectedInfluencers.size === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Target className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Select Influencers</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Choose influencers from the left panel to see real-time campaign analytics and projections.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Selected Influencers Avatars */}
                    <Card className="border-primary/20 bg-background/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Selected Team ({selectedInfluencers.size})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex -space-x-2 overflow-hidden">
                          {influencers
                            .filter(inf => selectedInfluencers.has(inf.id))
                            .slice(0, 8)
                            .map((influencer, index) => (
                              <Avatar
                                key={influencer.id}
                                className="inline-block border-2 border-background h-10 w-10"
                                style={{ zIndex: 8 - index }}
                              >
                                <AvatarImage src={influencer.profile_picture_url} />
                                <AvatarFallback className="text-xs">
                                  {influencer.instagram_username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          {selectedInfluencers.size > 8 && (
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted border-2 border-background text-xs font-medium">
                              +{selectedInfluencers.size - 8}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-primary/20 bg-background/80 backdrop-blur">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Total Reach</span>
                          </div>
                          <div className="text-2xl font-bold text-primary mt-2">
                            {formatNumber(selectedKPIs.totalFollowers)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Combined followers
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-primary/20 bg-background/80 backdrop-blur">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Avg. Engagement</span>
                          </div>
                          <div className="text-2xl font-bold text-primary mt-2">
                            {selectedKPIs.avgEngagementRate.toFixed(1)}%
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Average rate
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-primary/20 bg-background/80 backdrop-blur">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Primary Location</span>
                          </div>
                          <div className="text-lg font-bold text-primary mt-2">
                            {selectedKPIs.avgLocation}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Most common
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-primary/20 bg-background/80 backdrop-blur">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Est. Reach</span>
                          </div>
                          <div className="text-2xl font-bold text-primary mt-2">
                            {formatNumber(selectedKPIs.estimatedReach)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Projected views
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Gender Split */}
                    <Card className="border-primary/20 bg-background/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-base">Audience Demographics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Male</span>
                              <span>{selectedKPIs.genderSplit.male.toFixed(0)}%</span>
                            </div>
                            <Progress value={selectedKPIs.genderSplit.male} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Female</span>
                              <span>{selectedKPIs.genderSplit.female.toFixed(0)}%</span>
                            </div>
                            <Progress value={selectedKPIs.genderSplit.female} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Campaign Summary */}
                    <Card className="border-primary/20 bg-background/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-base">Campaign Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Budget</span>
                          <span className="font-semibold">{formatCurrency(proposal.total_campaign_budget_usd_cents)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Selected Influencers</span>
                          <span className="font-semibold">{selectedInfluencers.size} of {influencers.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Estimated Total Reach</span>
                          <span className="font-semibold">{formatNumber(selectedKPIs.estimatedReach)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-primary font-semibold">
                          <span>Cost per 1K Reach</span>
                          <span>
                            {selectedKPIs.estimatedReach > 0
                              ? `$${((proposal.total_campaign_budget_usd_cents / 100) / (selectedKPIs.estimatedReach / 1000)).toFixed(2)}`
                              : '$0'
                            }
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 bg-gradient-to-t from-background to-transparent pt-6">
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">
                          Save Selection
                        </Button>
                        <Button className="flex-1" disabled={selectedInfluencers.size === 0}>
                          Approve Campaign
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Influencer Analytics Dialog */}
        <InfluencerAnalyticsDialog
          influencer={selectedInfluencerForAnalytics}
          isOpen={isAnalyticsDialogOpen}
          onClose={() => {
            setIsAnalyticsDialogOpen(false)
            setSelectedInfluencerForAnalytics(null)
          }}
          onSelect={handleInfluencerToggle}
          isSelected={selectedInfluencerForAnalytics ? selectedInfluencers.has(selectedInfluencerForAnalytics.id) : false}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}