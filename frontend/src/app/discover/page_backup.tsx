"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  Users,
  Heart,
  MapPin,
  Star,
  ChevronDown,
  Unlock,
  Eye,
  TrendingUp,
  Globe,
  Target,
  Plus,
  X,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer"

export default function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [location, setLocation] = useState("all")
  const [tier, setTier] = useState("all")
  const [platform, setPlatform] = useState("all")
  const [minFollowers, setMinFollowers] = useState([1000])
  const [maxFollowers, setMaxFollowers] = useState([1000000])
  const [minEngagement, setMinEngagement] = useState([1])
  const [maxEngagement, setMaxEngagement] = useState([10])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isPlatformDrawerOpen, setIsPlatformDrawerOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [draggedCreator, setDraggedCreator] = useState<any>(null)
  
  const creators = [
    {
      id: 1,
      name: "Sarah Johnson",
      username: "fashionista_sarah",
      avatar: "/avatars/01.png",
      followers: 245000,
      engagement: 4.2,
      category: "Fashion",
      location: "New York, USA",
      verified: true,
      contentQuality: 9.1,
      influenceScore: 8.5,
      avgLikes: 10300,
      avgComments: 245,
      niche: "Fashion & Lifestyle",
      unlocked: false,
      trending: true,
    },
    {
      id: 2,
      name: "Mike Chen",
      username: "tech_reviewer_mike",
      avatar: "/avatars/02.png",
      followers: 186000,
      engagement: 5.8,
      category: "Technology",
      location: "San Francisco, USA",
      verified: true,
      contentQuality: 8.7,
      influenceScore: 9.2,
      avgLikes: 8500,
      avgComments: 380,
      niche: "Tech Reviews & Gadgets",
      unlocked: true,
      trending: false,
    },
    {
      id: 3,
      name: "Anna Rodriguez",
      username: "fitness_queen_anna",
      avatar: "/avatars/03.png",
      followers: 320000,
      engagement: 3.9,
      category: "Fitness",
      location: "Miami, USA",
      verified: false,
      contentQuality: 8.9,
      influenceScore: 7.8,
      avgLikes: 12500,
      avgComments: 195,
      niche: "Fitness & Wellness",
      unlocked: false,
      trending: true,
    },
    {
      id: 4,
      name: "Elena Rossi",
      username: "travel_with_elena",
      avatar: "/avatars/04.png",
      followers: 156000,
      engagement: 6.3,
      category: "Travel",
      location: "Rome, Italy",
      verified: true,
      contentQuality: 9.4,
      influenceScore: 8.1,
      avgLikes: 9800,
      avgComments: 420,
      niche: "Travel & Photography",
      unlocked: false,
      trending: true,
    },
    {
      id: 5,
      name: "James Wilson",
      username: "foodie_james",
      avatar: "/avatars/05.png",
      followers: 290000,
      engagement: 4.8,
      category: "Food",
      location: "London, UK",
      verified: false,
      contentQuality: 8.3,
      influenceScore: 7.6,
      avgLikes: 13900,
      avgComments: 312,
      niche: "Food & Restaurants",
      unlocked: false,
      trending: false,
    },
    {
      id: 6,
      name: "Maya Patel",
      username: "beauty_by_maya",
      avatar: "/avatars/06.png",
      followers: 425000,
      engagement: 5.1,
      category: "Beauty",
      location: "Mumbai, India",
      verified: true,
      contentQuality: 9.0,
      influenceScore: 8.8,
      avgLikes: 21700,
      avgComments: 586,
      niche: "Beauty & Skincare",
      unlocked: false,
      trending: true,
    }
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.niche.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = category === "all" || creator.category.toLowerCase() === category.toLowerCase()
    const matchesLocation = location === "all" || creator.location.toLowerCase().includes(location.toLowerCase())
    const matchesFollowers = creator.followers >= minFollowers[0] && creator.followers <= maxFollowers[0]
    const matchesEngagement = creator.engagement >= minEngagement[0] && creator.engagement <= maxEngagement[0]
    
    return matchesSearch && matchesCategory && matchesLocation && matchesFollowers && matchesEngagement
  })

  // Pagination variables (must be after filteredCreators)
  const resultsPerPage = 24 // 4 columns × 6 rows
  const totalPages = Math.ceil(filteredCreators.length / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const endIndex = startIndex + resultsPerPage
  const currentResults = filteredCreators.slice(startIndex, endIndex)

  return (
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
                <h1 className="text-3xl font-bold">Creator Discovery</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Saved Creators
                </Button>
                <Button variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Bulk Analysis
                </Button>
              </div>
            </div>


            {/* Main Layout: 85% Search Component + 15% Creator Lists */}
            <div className="flex gap-4">
              {/* Main Search Component - 85% width */}
              <div className="w-[85%]">
                <Card>
                  <CardHeader>
                    <CardDescription>Search and filter creators to find the perfect match for your campaign</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* All 5 elements in one row: 4 selectors with headers + search button */}
                    <div className="grid grid-cols-5 gap-3 w-full">
                    
                  {/* All elements with explicit width constraints */}
                  {/* Country Select with Flags */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold">Country</label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="uae">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇦🇪</span>
                          <span>UAE</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="saudi">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇸🇦</span>
                          <span>Saudi Arabia</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="kuwait">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇰🇼</span>
                          <span>Kuwait</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="qatar">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇶🇦</span>
                          <span>Qatar</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bahrain">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇧🇭</span>
                          <span>Bahrain</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                    </Select>
                  </div>

                  {/* Category Select */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="fashion">Fashion & Style</SelectItem>
                      <SelectItem value="beauty">Beauty & Skincare</SelectItem>
                      <SelectItem value="fitness">Fitness & Health</SelectItem>
                      <SelectItem value="food">Food & Cooking</SelectItem>
                      <SelectItem value="travel">Travel & Lifestyle</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="business">Business & Finance</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                    </Select>
                  </div>

                  {/* Tier Select */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold">Tier</label>
                    <Select value={tier} onValueChange={setTier}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="nano">Nano (1K-10K)</SelectItem>
                      <SelectItem value="micro">Micro (10K-100K)</SelectItem>
                      <SelectItem value="mid">Mid-tier (100K-1M)</SelectItem>
                      <SelectItem value="macro">Macro (1M-10M)</SelectItem>
                      <SelectItem value="mega">Mega (10M+)</SelectItem>
                    </SelectContent>
                    </Select>
                  </div>

                  {/* Platform Drawer */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold">Platform</label>
                    <Drawer open={isPlatformDrawerOpen} onOpenChange={setIsPlatformDrawerOpen}>
                      <DrawerTrigger asChild>
                        <Button variant="outline" className="justify-between w-full font-normal">
                        <span>{platform === "all" ? "Select Platform" : platform === "tiktok" ? "TikTok" : platform === "instagram" ? "Instagram" : platform === "snapchat" ? "Snapchat" : "Select Platform"}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="h-[80vh]">
                      <DrawerHeader>
                        <DrawerTitle className="text-center text-2xl">Select Platform</DrawerTitle>
                      </DrawerHeader>
                      <div className="flex-1 p-8">
                        <div className="grid grid-cols-4 gap-4 h-full">
                          
                          {/* TikTok */}
                          <Card 
                            className={`cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center p-8 ${platform === "tiktok" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => {
                              setPlatform("tiktok")
                              setIsPlatformDrawerOpen(false)
                            }}
                          >
                            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                              <span className="text-white text-3xl font-bold">T</span>
                            </div>
                            <h3 className="text-xl font-semibold">TikTok</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2">Short-form video creators</p>
                          </Card>

                          {/* Instagram */}
                          <Card 
                            className={`cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center p-8 ${platform === "instagram" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => {
                              setPlatform("instagram")
                              setIsPlatformDrawerOpen(false)
                            }}
                          >
                            <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                              <div className="w-8 h-8 border-2 border-white rounded-lg"></div>
                            </div>
                            <h3 className="text-xl font-semibold">Instagram</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2">Photos, Stories & Reels</p>
                          </Card>

                          {/* Snapchat */}
                          <Card 
                            className={`cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center p-8 ${platform === "snapchat" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => {
                              setPlatform("snapchat")
                              setIsPlatformDrawerOpen(false)
                            }}
                          >
                            <div className="w-16 h-16 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                              <div className="w-8 h-8 bg-white rounded-full"></div>
                            </div>
                            <h3 className="text-xl font-semibold">Snapchat</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2">Ephemeral content creators</p>
                          </Card>

                          {/* LinkedIn Coming Soon */}
                          <Card className="opacity-50 cursor-not-allowed flex flex-col items-center justify-center p-8 bg-muted/30 relative">
                            <Badge variant="secondary" className="absolute top-4 right-4 text-xs">Coming Soon</Badge>
                            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                              <span className="text-white text-2xl font-bold">in</span>
                            </div>
                            <h3 className="text-xl font-semibold">LinkedIn</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2">Professional network creators</p>
                          </Card>

                        </div>
                      </div>
                      <DrawerFooter>
                        <DrawerClose asChild>
                          <Button variant="outline">Close</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                    </Drawer>
                  </div>

                    {/* Search Button */}
                    <div className="w-full flex items-end">
                      <Button 
                        onClick={() => {
                          setShowResults(true)
                          toast.success("Search completed! Found creators matching your criteria.")
                        }}
                        className="w-full h-16"
                        size="lg"
                      >
                        <Search className="h-5 w-5 mr-2" />
                        Search Creators
                      </Button>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              </div>

              {/* Creator Lists Component - 15% width, sticky */}
              <div className="w-[15%]">
                <div className="sticky top-4 h-[calc(100vh-8rem)]">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4" />
                        Your Creator Lists
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-3">
                      <div className="space-y-2">
                        <div 
                          className="flex items-center justify-between p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors min-h-[60px] drop-zone"
                          data-list="summer-campaign"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                            if (draggedCreator) {
                              toast.success(`${draggedCreator.name} added to Summer Campaign 2024!`)
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Summer Campaign 2024</p>
                            <p className="text-xs text-muted-foreground">12 creators</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <div 
                          className="flex items-center justify-between p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors min-h-[60px] drop-zone"
                          data-list="tech-reviewers"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                            if (draggedCreator) {
                              toast.success(`${draggedCreator.name} added to Tech Reviewers!`)
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Tech Reviewers</p>
                            <p className="text-xs text-muted-foreground">8 creators</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <div 
                          className="flex items-center justify-between p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors min-h-[60px] drop-zone"
                          data-list="wishlist"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                            if (draggedCreator) {
                              toast.success(`${draggedCreator.name} added to Wishlist!`)
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Wishlist</p>
                            <p className="text-xs text-muted-foreground">24 creators</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button className="w-full h-8 mt-auto" variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Create New List
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Results Section */}
                {showResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Search Results</CardTitle>
                    <CardDescription>
                      Found {filteredCreators.length} creators matching your criteria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                      {currentResults.map((creator) => (
                        <Card 
                          key={creator.id} 
                          className="relative overflow-hidden cursor-move hover:shadow-lg transition-shadow"
                          draggable
                          onDragStart={(e) => {
                            setDraggedCreator(creator)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => setDraggedCreator(null)}
                        >
                          <div className="absolute top-2 left-2 right-2 z-10 flex justify-between">
                            {creator.trending && (
                              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                            {creator.unlocked && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 ml-auto">
                                <Unlock className="h-3 w-3 mr-1" />
                                Unlocked
                              </Badge>
                            )}
                          </div>
                          
                          <CardHeader className="pb-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={creator.avatar} alt={creator.name} />
                                <AvatarFallback>
                                  {creator.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold truncate">{creator.name}</h3>
                                  {creator.verified && (
                                    <Badge variant="secondary" className="px-1 py-0">
                                      ✓
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  @{creator.username}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {creator.location}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="text-center p-2 bg-muted rounded-md">
                                <div className="text-lg font-bold">{formatNumber(creator.followers)}</div>
                                <div className="text-xs text-muted-foreground">Followers</div>
                              </div>
                              <div className="text-center p-2 bg-muted rounded-md">
                                <div className="text-lg font-bold">{creator.engagement}%</div>
                                <div className="text-xs text-muted-foreground">Engagement</div>
                              </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Content Quality</span>
                                  <span className="font-medium">{creator.contentQuality}/10</span>
                                </div>
                                <Progress value={creator.contentQuality * 10} className="h-2" />
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Influence Score</span>
                                  <span className="font-medium">{creator.influenceScore}/10</span>
                                </div>
                                <Progress value={creator.influenceScore * 10} className="h-2" />
                              </div>
                            </div>

                            {/* Category and Niche */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">{creator.category}</Badge>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-muted-foreground">Premium</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{creator.niche}</p>
                            </div>

                            {/* Engagement Stats */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span>{formatNumber(creator.avgLikes)} avg likes</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-blue-500" />
                                <span>{formatNumber(creator.avgComments)} comments</span>
                              </div>
                            </div>

                            {/* Brand Safety & ROI Indicators */}
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-muted-foreground">Brand Safe</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Est. ROI: <span className="font-medium text-green-600">+275%</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-3">
                              {creator.unlocked ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => toast.success("Opening full analytics for " + creator.name)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Full Analytics
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => toast.success(creator.name + " added to campaign!")}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add to Campaign
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => toast.info(creator.name + " saved to favorites!")}
                                  >
                                    <Star className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => toast.success("Profile unlocked! " + creator.name + " is now available for analysis.")}
                                  >
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Unlock Profile
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => toast.info(creator.name + " saved to favorites!")}
                                  >
                                    <Star className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {filteredCreators.length === 0 && (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search criteria or filters to discover more creators.
                        </p>
                      </div>
                    )}

                    {/* Pagination */}
                    {filteredCreators.length > 0 && totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 pt-6">
                        <Button 
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                          {totalPages > 5 && (
                            <>
                              {currentPage < totalPages - 2 && <span>...</span>}
                              {currentPage < totalPages - 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(totalPages)}
                                >
                                  {totalPages}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                        <Button 
                          variant="outline"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {filteredCreators.length > 0 && (
                      <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Bulk Select
                        </Button>
                        <Button>
                          <Target className="h-4 w-4 mr-2" />
                          Create Campaign
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}
            </div>

            {/* Results Section - Full Width */}
            <div className="mt-6">
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}