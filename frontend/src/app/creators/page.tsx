"use client"

import { useState } from "react"
import {
  Plus,
  Users,
  Eye,
  Heart,
  TrendingUp,
  MoreHorizontal,
  BarChart3,
  Download,
  Search,
  X,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function CreatorsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  const creators = [
    {
      id: 1,
      name: "Sarah Johnson",
      username: "fashionista_sarah",
      avatar: "/avatars/01.png",
      followers: 245000,
      engagement: 4.2,
      category: "Fashion",
      verified: true,
      lastPost: "2 hours ago",
      trend: 12.5,
      location: "New York, USA",
      niche: "Fashion & Lifestyle"
    },
    {
      id: 2,
      name: "Mike Chen",
      username: "tech_reviewer_mike",
      avatar: "/avatars/02.png",
      followers: 186000,
      engagement: 5.8,
      category: "Technology",
      verified: true,
      lastPost: "1 day ago",
      trend: -2.1,
      location: "San Francisco, USA",
      niche: "Tech Reviews"
    },
    {
      id: 3,
      name: "Anna Rodriguez",
      username: "fitness_queen_anna",
      avatar: "/avatars/03.png",
      followers: 320000,
      engagement: 3.9,
      category: "Fitness",
      verified: false,
      lastPost: "4 hours ago",
      trend: 8.3,
      location: "Miami, USA",
      niche: "Fitness & Wellness"
    },
    {
      id: 4,
      name: "David Kim",
      username: "food_explorer_david",
      avatar: "/avatars/04.png",
      followers: 125000,
      engagement: 6.2,
      category: "Food",
      verified: false,
      lastPost: "6 hours ago",
      trend: 15.7,
      location: "Los Angeles, USA",
      niche: "Food & Travel"
    },
    {
      id: 5,
      name: "Emma Wilson",
      username: "beauty_guru_emma",
      avatar: "/avatars/05.png",
      followers: 410000,
      engagement: 4.8,
      category: "Beauty",
      verified: true,
      lastPost: "3 hours ago",
      trend: 7.2,
      location: "London, UK",
      niche: "Beauty & Skincare"
    }
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }


  const totalReach = creators.reduce((sum, creator) => sum + creator.followers, 0)
  const avgEngagement = creators.reduce((sum, creator) => sum + creator.engagement, 0) / creators.length

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
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => toast.success("Creator analysis started! Results will be available shortly.")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Analyze & Add Creator
                      </Button>
                    </div>

                    {/* Bulk Analysis */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Bulk Analysis</label>
                        <textarea
                          placeholder="Enter multiple usernames separated by commas or new lines..."
                          className="mt-2 w-full min-h-[100px] p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => toast.success("Bulk analysis started! Processing creators...")}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Bulk Analyze
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
            <SectionCards mode="creators" />


            {/* Creators Portfolio */}
            <Card>
              <CardHeader>
                <CardTitle>Your Creator Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {creators.map((creator) => (
                    <Card key={creator.id} className="relative overflow-hidden">
                      {/* Status Indicator */}
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                          Unlocked
                        </Badge>
                      </div>
                      
                      <CardContent className="p-4">
                        {/* Creator Header */}
                        <div className="flex items-start gap-3 mb-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={creator.avatar} alt={creator.name} />
                            <AvatarFallback>
                              {creator.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{creator.name}</h3>
                              {creator.verified && (
                                <Badge variant="secondary" className="px-1 py-0 text-xs">
                                  ✓
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">@{creator.username}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-xs text-muted-foreground">Active {creator.lastPost}</span>
                            </div>
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
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
                        <div className="space-y-3 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Performance</span>
                              <span className={`font-medium ${creator.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {creator.trend > 0 ? '+' : ''}{creator.trend}%
                              </span>
                            </div>
                            <Progress value={Math.abs(creator.trend) * 5} className="h-2" />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Brand Fit Score</span>
                              <span className="font-medium text-blue-600">85/100</span>
                            </div>
                            <Progress value={85} className="h-2" />
                          </div>
                        </div>

                        {/* Category & Location */}
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline" className="text-xs">{creator.category}</Badge>
                          <span className="text-xs text-muted-foreground">{creator.location.split(',')[0]}</span>
                        </div>

                        {/* Campaign Status */}
                        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Campaign Status</span>
                            <Badge variant="outline" className="text-xs">
                              Active (2)
                            </Badge>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button className="w-full" size="sm">
                            <BarChart3 className="h-3 w-3 mr-2" />
                            Detailed Insights
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm">
                              <Plus className="h-3 w-3 mr-1" />
                              Add to Campaign
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-3 w-3 mr-1" />
                                  More
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Contact Creator
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Export Data
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Remove from Portfolio
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Avg. Likes: {formatNumber(Math.floor(creator.followers * (creator.engagement / 100) * 0.9))}</span>
                            <span>Est. Rate: ${Math.floor(creator.followers / 1000 * 12)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}