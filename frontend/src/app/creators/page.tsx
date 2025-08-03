"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService, UnlockedProfile, UnlockedProfilesResponse } from "@/services/instagramApi"
import {
  Plus,
  Users,
  Eye,
  Heart,
  BarChart3,
  Download,
  Search,
  X,
  Building,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ReactCountryFlag from "react-country-flag"
import { getCountryCode } from "@/lib/countryUtils"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function CreatorsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [bulkUsernames, setBulkUsernames] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [analyzingCreators, setAnalyzingCreators] = useState<{[key: string]: {status: 'analyzing' | 'completed' | 'failed', progress: number, error?: string}}>({})
  const [unlockedCreators, setUnlockedCreators] = useState<UnlockedProfile[]>([])
  const [unlockedLoading, setUnlockedLoading] = useState(true)
  const [unlockedError, setUnlockedError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{page: number, totalPages: number, hasNext: boolean}>({
    page: 1,
    totalPages: 1,
    hasNext: false
  })
  const router = useRouter()
  // Note: URL param analysis temporarily disabled for production build
  // TODO: Implement proper Suspense boundary for useSearchParams
  
  // Load unlocked profiles from backend
  const loadUnlockedProfiles = async (page: number = 1) => {
    console.log('👥 Loading unlocked profiles, page:', page)
    setUnlockedLoading(true)
    setUnlockedError(null)
    
    try {
      const result = await instagramApiService.getUnlockedProfiles(page, 20)
      
      if (result.success && result.data) {
        console.log('✅ Unlocked profiles loaded:', result.data)
        setUnlockedCreators(result.data.profiles)
        setPagination({
          page: result.data.pagination.page,
          totalPages: result.data.pagination.total_pages,
          hasNext: result.data.pagination.has_next
        })
        setUnlockedError(null)
      } else {
        console.error('❌ Failed to load unlocked profiles:', result.error)
        setUnlockedError(result.error || 'Failed to load unlocked profiles')
      }
    } catch (error) {
      console.error('❌ Error loading unlocked profiles:', error)
      setUnlockedError('Network error while loading profiles')
    } finally {
      setUnlockedLoading(false)
    }
  }

  // Load unlocked profiles on component mount
  useEffect(() => {
    loadUnlockedProfiles()
  }, [])

  const creators: UnlockedProfile[] = unlockedCreators

  const startAnalysis = async (username: string) => {
    const cleanUsername = username.trim().replace('@', '')
    
    // Add to analyzing list
    setAnalyzingCreators(prev => ({
      ...prev,
      [cleanUsername]: { status: 'analyzing', progress: 0 }
    }))

    // Show success message
    toast.success(`Started analyzing @${cleanUsername}...`)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalyzingCreators(prev => {
          const current = prev[cleanUsername]
          if (current && current.status === 'analyzing' && current.progress < 90) {
            return {
              ...prev,
              [cleanUsername]: { ...current, progress: current.progress + 10 }
            }
          }
          return prev
        })
      }, 1000)

      console.log(`🔍 Starting profile search for @${cleanUsername}...`)
      const result = await instagramApiService.searchProfile(cleanUsername)
      
      clearInterval(progressInterval)
      console.log('📊 Analysis result:', result)
      
      if (result.success && result.data && result.data.profile) {
        // Complete the progress
        setAnalyzingCreators(prev => ({
          ...prev,
          [cleanUsername]: { status: 'completed', progress: 100 }
        }))
        
        // Transform the backend data to creator card format
        const newCreator = {
          id: `creator-${cleanUsername}-${Date.now()}`,
          username: result.data.profile.username,
          full_name: result.data.profile.full_name,
          profile_pic_url: result.data.profile.profile_pic_url,
          followers: result.data.profile.followers_count, // Fixed: use followers_count from API
          engagement_rate: result.data.profile.engagement_rate,
          is_verified: result.data.profile.is_verified,
          bio: result.data.profile.biography, // Fixed: use biography from API
          categories: [
            result.data.profile.business_category_name || 'Lifestyle', // Fixed: use business_category_name from API
            'Social Media',
            'Content Creator'
          ],
          location: result.data.demographics?.location_distribution ? Object.keys(result.data.demographics.location_distribution)[0] : 'Global', // Fixed: use demographics data
          influence_score: result.data.profile.influence_score,
          content_quality_score: result.data.profile.content_quality_score,
          unlocked_at: new Date().toISOString()
        }
        
        console.log('✅ Adding creator to unlocked list:', newCreator)
        
        // Add to unlocked creators
        setUnlockedCreators(prev => {
          // Check if already exists
          const exists = prev.find(c => c.username === cleanUsername)
          if (exists) {
            console.log('⚠️ Creator already exists, updating data')
            return prev.map(c => c.username === cleanUsername ? newCreator : c)
          }
          return [newCreator, ...prev]
        })
        
        toast.success(`Successfully analyzed @${cleanUsername}! Added to your unlocked creators.`)
        
        // Remove from analyzing list after 2 seconds to show completion state briefly
        setTimeout(() => {
          setAnalyzingCreators(prev => {
            const newState = { ...prev }
            delete newState[cleanUsername]
            return newState
          })
        }, 2000)
      } else {
        // Enhanced error handling with specific messages
        let errorMessage = result.error || 'Analysis failed'
        
        // Map common backend errors to user-friendly messages
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          errorMessage = 'Analysis is taking longer than expected. This can happen with large profiles. Please try again in a moment.'
        } else if (errorMessage.includes('Authentication required') || errorMessage.includes('Not authenticated') || errorMessage.includes('401')) {
          errorMessage = 'Please log in again to continue analyzing profiles.'
        } else if (errorMessage.includes('No access to this profile')) {
          errorMessage = 'This profile requires premium access. Click to unlock 30-day access.'
        } else if (errorMessage.includes('Profile not found')) {
          errorMessage = 'Instagram profile not found. Please check the username and try again.'
        } else if (errorMessage.includes('Rate limit exceeded')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.'
        } else if (errorMessage.includes('Server error')) {
          errorMessage = 'Backend service is experiencing issues. Please try again in a few minutes.'
        }
        
        setAnalyzingCreators(prev => ({
          ...prev,
          [cleanUsername]: { status: 'failed', progress: 0, error: errorMessage }
        }))
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Analysis error for @' + cleanUsername + ':', error)
      
      // Enhanced catch block error handling
      let errorMessage = 'Network error occurred'
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorMessage = 'Request timed out. The backend may be busy processing large profiles. Please try again.'
        } else if (error.message.includes('Cannot connect to server')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection and ensure the backend is running.'
        } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network connection failed. Please check your internet connection.'
        } else {
          errorMessage = error.message
        }
      }
      
      setAnalyzingCreators(prev => ({
        ...prev,
        [cleanUsername]: { status: 'failed', progress: 0, error: errorMessage }
      }))
      
      toast.error(`Error analyzing @${cleanUsername}: ${errorMessage}`)
    }
  }

  const handleSearchCreator = async () => {
    if (!searchUsername.trim()) {
      toast.error("Please enter an Instagram username")
      return
    }

    const cleanUsername = searchUsername.trim().replace('@', '')
    setIsSearchOpen(false)
    setSearchUsername("")
    
    // Start analysis
    await startAnalysis(cleanUsername)
  }

  const handleBulkAnalysis = async () => {
    if (!bulkUsernames.trim()) {
      toast.error("Please enter usernames for bulk analysis")
      return
    }

    const usernames = bulkUsernames
      .split(/[,\n]/)
      .map(u => u.trim().replace('@', ''))
      .filter(u => u.length > 0)

    if (usernames.length === 0) {
      toast.error("No valid usernames found")
      return
    }

    if (usernames.length > 10) {
      toast.error("Maximum 10 usernames allowed for bulk analysis")
      return
    }

    setBulkLoading(true)
    toast.info(`Starting bulk analysis for ${usernames.length} creators...`)

    try {
      const results = await Promise.allSettled(
        usernames.map(username => instagramApiService.searchProfile(username))
      )

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.length - successful

      if (successful > 0) {
        toast.success(`Successfully analyzed ${successful} creators${failed > 0 ? `, ${failed} failed` : ''}`)
        // For now, navigate to the first successful result
        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          if (result.status === 'fulfilled' && result.value.success) {
            setIsSearchOpen(false)
            setBulkUsernames("")
            router.push(`/analytics/${usernames[i]}`)
            break
          }
        }
      } else {
        toast.error("All bulk analyses failed. Please check the usernames and try again.")
      }
    } catch (error) {
      console.error('Bulk analysis error:', error)
      toast.error("Bulk analysis failed. Please try again.")
    } finally {
      setBulkLoading(false)
    }
  }

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }


  // Calculate real stats from unlocked creators
  const totalFollowers = unlockedCreators.reduce((sum, creator) => sum + (creator.followers_count || 0), 0)
  const avgEngagement = unlockedCreators.length > 0 
    ? unlockedCreators.reduce((sum, creator) => sum + (creator.engagement_rate || 0), 0) / unlockedCreators.length 
    : undefined

  const creatorsData = {
    unlockedCreators: unlockedCreators.length,
    portfolioReach: totalFollowers > 0 ? totalFollowers.toString() : undefined,
    avgEngagement: avgEngagement ? avgEngagement.toFixed(1) + '%' : undefined,
    inCampaigns: 0 // TODO: Implement campaigns tracking
  }

  return (
    <AuthGuard requireAuth={true}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
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
                <h1 className="text-3xl font-bold">Unlocked Creators</h1>
              </div>
              <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search for Creators
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[450px] sm:w-[600px] p-8">
                  <SheetHeader>
                    <SheetTitle>Add New Creators</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    {/* Manual Username Entry */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Instagram Username</label>
                        <Input
                          placeholder="Enter Instagram username (e.g., @influencer_name)"
                          className="mt-2"
                          value={searchUsername}
                          onChange={(e) => setSearchUsername(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearchCreator()}
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={handleSearchCreator}
                        disabled={searchLoading || !searchUsername.trim()}
                      >
                        {searchLoading ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {searchLoading ? "Analyzing..." : "Analyze & Add Creator"}
                      </Button>
                    </div>

                    {/* Bulk Analysis */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Bulk Analysis</label>
                        <textarea
                          placeholder="Enter multiple usernames separated by commas or new lines..."
                          className="mt-2 w-full min-h-[100px] p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                          value={bulkUsernames}
                          onChange={(e) => setBulkUsernames(e.target.value)}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleBulkAnalysis}
                        disabled={bulkLoading || !bulkUsernames.trim()}
                      >
                        {bulkLoading ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <BarChart3 className="h-4 w-4 mr-2" />
                        )}
                        {bulkLoading ? "Processing..." : "Bulk Analyze"}
                      </Button>
                    </div>

                    {/* Upload CSV */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Upload Creator List</label>
                        <div className="mt-2 flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 dark:border-gray-600">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Download className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Click to upload</span> CSV file
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">CSV with usernames (MAX. 100)</p>
                            </div>
                            <input type="file" className="hidden" accept=".csv" />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Search Filters */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Discovery Filters</label>
                      <div className="grid gap-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="fashion">Fashion & Style</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="fitness">Fitness & Health</SelectItem>
                            <SelectItem value="food">Food & Cooking</SelectItem>
                            <SelectItem value="beauty">Beauty & Skincare</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Follower Range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="micro">Micro (1K-100K)</SelectItem>
                            <SelectItem value="mid">Mid-tier (100K-1M)</SelectItem>
                            <SelectItem value="macro">Macro (1M+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => toast.info("Finding similar creators based on your criteria...")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Find Similar Creators
                      </Button>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>💡 Pro tips:</p>
                        <p>• Use @username format for best results</p>
                        <p>• Bulk analysis supports up to 50 usernames</p>
                        <p>• CSV upload allows up to 100 creators</p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>


            {/* Overview Cards */}
            <SectionCards mode="creators" creatorsData={creatorsData} />


            {/* Creators Portfolio */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Creator Portfolio</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* Currently Analyzing Creators */}
                  {Object.entries(analyzingCreators).map(([username, analysis]) => (
                    <Card key={`analyzing-${username}`} className="relative overflow-hidden hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-800">
                      {/* Status Indicator */}
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className={`text-xs ${
                          analysis.status === 'analyzing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                          analysis.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                        }`}>
                          {analysis.status === 'analyzing' ? 'Analyzing...' :
                           analysis.status === 'completed' ? 'Ready!' :
                           'Failed'}
                        </Badge>
                      </div>
                      
                      <CardHeader className="pb-3">
                        {/* Avatar Placeholder */}
                        <div className="flex justify-center mb-3">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                            {analysis.status === 'analyzing' ? (
                              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            ) : analysis.status === 'completed' ? (
                              <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </div>

                        {/* Username */}
                        <div className="text-center space-y-1">
                          <h3 className="font-semibold text-lg">@{username}</h3>
                          <p className="text-sm text-muted-foreground">
                            {analysis.status === 'analyzing' ? 'Fetching profile data...' :
                             analysis.status === 'completed' ? 'Analysis complete!' :
                             analysis.error || 'Analysis failed'}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Progress Bar */}
                        {analysis.status === 'analyzing' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{analysis.progress}%</span>
                            </div>
                            <Progress value={analysis.progress} className="h-2" />
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-2">
                          {analysis.status === 'completed' ? (
                            <Button 
                              className="w-full" 
                              size="sm"
                              onClick={() => router.push(`/analytics/${username}`)}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </Button>
                          ) : analysis.status === 'failed' ? (
                            <Button 
                              className="w-full" 
                              size="sm"
                              variant="outline"
                              onClick={() => startAnalysis(username)}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Retry Analysis
                            </Button>
                          ) : (
                            <Button 
                              className="w-full" 
                              size="sm"
                              disabled
                            >
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Analyzing...
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Loading State */}
                  {unlockedLoading && (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-muted-foreground">Loading your unlocked creators...</p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {unlockedError && !unlockedLoading && (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <p className="text-red-600 dark:text-red-400">{unlockedError}</p>
                        <Button variant="outline" onClick={() => loadUnlockedProfiles()}>
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!unlockedLoading && !unlockedError && creators.length === 0 && (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-semibold">No unlocked creators yet</h3>
                          <p className="text-muted-foreground">Start by searching for creators to analyze</p>
                        </div>
                        <Button onClick={() => setIsSearchOpen(true)}>
                          <Search className="h-4 w-4 mr-2" />
                          Search for Creators
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing Creators */}
                  {!unlockedLoading && creators.map((creator) => (
                    <Card key={creator.username} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Status Indicator */}
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                          Unlocked
                        </Badge>
                      </div>
                      
                      <CardHeader className="pb-3">
                        {/* Avatar */}
                        <div className="flex justify-center mb-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={creator.proxied_profile_pic_url || creator.profile_pic_url} alt={creator.full_name} />
                            <AvatarFallback>
                              {creator.full_name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Name and Username */}
                        <div className="text-center space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <h3 className="font-semibold text-lg">{creator.full_name}</h3>
                            {creator.is_verified && (
                              <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            @{creator.username}
                          </p>
                        </div>

                        {/* Content Category Badges */}
                        <div className="flex flex-wrap justify-center gap-1 mt-3">
                          {creator.business_category_name && (
                            <Badge variant="outline" className="text-xs">
                              {creator.business_category_name}
                            </Badge>
                          )}
                          {creator.is_business_account && (
                            <Badge variant="outline" className="text-xs">
                              Business
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Creator
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Followers and Engagement */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-muted rounded-md">
                            <div className="text-lg font-bold">{formatNumber(creator.followers_count)}</div>
                            <div className="text-xs text-muted-foreground">Followers</div>
                          </div>
                          <div className="text-center p-2 bg-muted rounded-md">
                            <div className="text-lg font-bold">{creator.engagement_rate ? `${creator.engagement_rate}%` : 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">Engagement</div>
                          </div>
                        </div>

                        {/* Access Info */}
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {creator.days_remaining} days remaining
                          </span>
                        </div>


                        {/* Action Button */}
                        <div className="pt-2">
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => router.push(`/analytics/${creator.username}`)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </Button>
                        </div>

                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {!unlockedLoading && !unlockedError && creators.length > 0 && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUnlockedProfiles(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUnlockedProfiles(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {creators.length} creators shown
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}