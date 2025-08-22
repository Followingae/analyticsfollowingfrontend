'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  Search, 
  Upload, 
  Download, 
  Edit, 
  Eye, 
  CheckCircle,
  Star,
  TrendingUp,
  Filter
} from 'lucide-react'

export function InfluencerDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')

  const influencerStats = {
    totalInfluencers: 45678,
    verifiedInfluencers: 12340,
    categorizedInfluencers: 38950,
    qualityScore: 87.5
  }

  const mockInfluencers = [
    {
      id: '1',
      username: 'fashionista_dubai',
      full_name: 'Sarah Al-Mansouri',
      category: 'Fashion',
      followers_count: 125000,
      engagement_rate: 0.045,
      is_verified: true,
      data_quality_score: 0.92,
      access_tier_required: 'premium',
      last_updated_at: '2024-01-20T10:30:00Z',
      profile_picture_url: null
    },
    {
      id: '2',
      username: 'tech_reviewer_ae',
      full_name: 'Ahmed Hassan',
      category: 'Technology',
      followers_count: 89000,
      engagement_rate: 0.067,
      is_verified: true,
      data_quality_score: 0.88,
      access_tier_required: 'standard',
      last_updated_at: '2024-01-19T15:45:00Z',
      profile_picture_url: null
    },
    {
      id: '3',
      username: 'fitness_motivation',
      full_name: 'Layla Ibrahim',
      category: 'Fitness',
      followers_count: 67000,
      engagement_rate: 0.082,
      is_verified: false,
      data_quality_score: 0.75,
      access_tier_required: 'free',
      last_updated_at: '2024-01-18T09:20:00Z',
      profile_picture_url: null
    }
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'premium': return 'default'
      case 'standard': return 'secondary'
      case 'free': return 'outline'
      default: return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Influencer Database</h1>
          <p className="text-muted-foreground">
            Manage and verify influencer profiles and data quality
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{influencerStats.totalInfluencers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Platform-wide database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Profiles</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{influencerStats.verifiedInfluencers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((influencerStats.verifiedInfluencers / influencerStats.totalInfluencers) * 100).toFixed(1)}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorized</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{influencerStats.categorizedInfluencers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((influencerStats.categorizedInfluencers / influencerStats.totalInfluencers) * 100).toFixed(1)}% categorized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{influencerStats.qualityScore}%</div>
            <p className="text-xs text-muted-foreground">
              Data quality rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Influencer Directory</CardTitle>
          <CardDescription>Search and manage influencer profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, name, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="food">Food & Drink</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Influencers Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Access Tier</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInfluencers.map((influencer) => (
                  <TableRow key={influencer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={influencer.profile_picture_url || undefined} />
                          <AvatarFallback>
                            {influencer.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">@{influencer.username}</span>
                            {influencer.is_verified && (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {influencer.full_name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {influencer.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(influencer.followers_count)}
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        {(influencer.engagement_rate * 100).toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={influencer.data_quality_score * 100} 
                          className="w-16 h-2" 
                        />
                        <span className="text-xs font-medium">
                          {(influencer.data_quality_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTierBadgeVariant(influencer.access_tier_required)}>
                        {influencer.access_tier_required}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(influencer.last_updated_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}