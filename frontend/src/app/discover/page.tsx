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

export default function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [location, setLocation] = useState("all")
  const [minFollowers, setMinFollowers] = useState([1000])
  const [maxFollowers, setMaxFollowers] = useState([1000000])
  const [minEngagement, setMinEngagement] = useState([1])
  const [maxEngagement, setMaxEngagement] = useState([10])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
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

            {/* Discovery Stats */}
            <SectionCards mode="discover" />

            {/* Prominent Search Section */}
            <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Search className="h-6 w-6" />
                  AI-Powered Creator Discovery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full text-lg py-6">
                      <Search className="h-5 w-5 mr-3" />
                      Start Advanced Creator Search
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl">Creator Discovery Search</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 mt-4">
                      {/* Basic Search */}
                      <div className="space-y-4">
                        <div>
                          <Input
                            placeholder="Search by username, name, niche, or brand keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Industries</SelectItem>
                              <SelectItem value="fashion">Fashion & Style</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="fitness">Fitness & Health</SelectItem>
                              <SelectItem value="food">Food & Cooking</SelectItem>
                              <SelectItem value="travel">Travel & Lifestyle</SelectItem>
                              <SelectItem value="beauty">Beauty & Skincare</SelectItem>
                              <SelectItem value="business">Business & Finance</SelectItem>
                              <SelectItem value="entertainment">Entertainment</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger>
                              <SelectValue placeholder="Market" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Global</SelectItem>
                              <SelectItem value="usa">United States</SelectItem>
                              <SelectItem value="uk">United Kingdom</SelectItem>
                              <SelectItem value="canada">Canada</SelectItem>
                              <SelectItem value="germany">Germany</SelectItem>
                              <SelectItem value="france">France</SelectItem>
                              <SelectItem value="italy">Italy</SelectItem>
                              <SelectItem value="spain">Spain</SelectItem>
                              <SelectItem value="india">India</SelectItem>
                              <SelectItem value="australia">Australia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Advanced Filters */}
                      <div className="grid gap-6">
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Audience Size</label>
                          <div className="px-3">
                            <Slider
                              value={minFollowers}
                              onValueChange={setMinFollowers}
                              max={5000000}
                              min={1000}
                              step={5000}
                              className="mb-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{formatNumber(minFollowers[0])}+</span>
                              <span>to {formatNumber(maxFollowers[0])}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Engagement Rate</label>
                          <div className="px-3">
                            <Slider
                              value={minEngagement}
                              onValueChange={setMinEngagement}
                              max={15}
                              min={1}
                              step={0.1}
                              className="mb-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{minEngagement[0]}%+</span>
                              <span>to {maxEngagement[0]}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Brand Safety Score</label>
                          <Select defaultValue="high">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Levels</SelectItem>
                              <SelectItem value="high">High (9-10)</SelectItem>
                              <SelectItem value="medium">Medium (7-8)</SelectItem>
                              <SelectItem value="basic">Basic (5-6)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Quick Filter Tags */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quick Filters</label>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">Rising Stars</Button>
                          <Button variant="outline" size="sm">Brand Safe</Button>
                          <Button variant="outline" size="sm">High ROI</Button>
                          <Button variant="outline" size="sm">Trending</Button>
                          <Button variant="outline" size="sm">Authentic Audience</Button>
                          <Button variant="outline" size="sm">Multi-Platform</Button>
                          <Button variant="outline" size="sm">UGC Creators</Button>
                          <Button variant="outline" size="sm">Micro-Influencers</Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setIsSearchOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={() => {
                          setShowResults(true)
                          setIsSearchOpen(false)
                          toast.success("Search completed! Found creators matching your criteria.")
                        }}
                        className="flex-1"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Confirm Search
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info("Browsing creators by niche categories...")}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Browse by Niche
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info("Showing trending creators right now...")}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info("Displaying highest-rated creators...")}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Top Rated
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {showResults && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {filteredCreators.length} creators matching your criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCreators.map((creator) => (
                    <Card key={creator.id} className="relative overflow-hidden">
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

                {/* Load More */}
                {filteredCreators.length > 0 && (
                  <div className="flex justify-center gap-4 pt-6">
                    <Button variant="outline">
                      Load More Creators
                    </Button>
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

            {/* AI-Powered Suggestions */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Smart Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Fashion Micro-Influencers</p>
                        <p className="text-xs text-muted-foreground">
                          23 creators with 50K-200K followers showing 6.8% avg engagement
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="ml-auto">
                        Explore
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Rising Stars</p>
                        <p className="text-xs text-muted-foreground">
                          12 emerging creators with rapid growth in your target demographic
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="ml-auto">
                        Explore
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">UGC Specialists</p>
                        <p className="text-xs text-muted-foreground">
                          31 creators specializing in authentic user-generated content
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="ml-auto">
                        Explore
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Your Creator Lists
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Summer Campaign 2024</p>
                        <p className="text-xs text-muted-foreground">12 creators • Fashion & Lifestyle</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Active</Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Tech Reviewers</p>
                        <p className="text-xs text-muted-foreground">8 creators • Technology</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Draft</Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Wishlist</p>
                        <p className="text-xs text-muted-foreground">24 creators • Mixed</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Personal</Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New List
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}