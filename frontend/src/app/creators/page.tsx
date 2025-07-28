"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Users,
  Eye,
  Heart,
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
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ReactCountryFlag from "react-country-flag"
import { getCountryCode } from "@/lib/countryUtils"

export default function CreatorsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  
  const creators = [
    {
      id: 1,
      username: "fashionista_sarah",
      full_name: "Sarah Johnson",
      profile_pic_url: "/avatars/01.png",
      followers: 245000,
      engagement_rate: 4.2,
      categories: ["Fashion", "Lifestyle", "Beauty"],
      location: "New York, USA",
      is_verified: true,
      unlocked: true,
      lastPost: "2 hours ago",
      trend: 12.5
    },
    {
      id: 2,
      username: "tech_reviewer_mike",
      full_name: "Mike Chen",
      profile_pic_url: "/avatars/02.png",
      followers: 186000,
      engagement_rate: 5.8,
      categories: ["Technology", "Reviews"],
      location: "San Francisco, USA",
      is_verified: true,
      unlocked: true,
      lastPost: "1 day ago",
      trend: -2.1
    },
    {
      id: 3,
      username: "fitness_queen_anna",
      full_name: "Anna Rodriguez",
      profile_pic_url: "/avatars/03.png",
      followers: 320000,
      engagement_rate: 3.9,
      categories: ["Fitness", "Wellness", "Health"],
      location: "Miami, USA",
      is_verified: false,
      unlocked: true,
      lastPost: "4 hours ago",
      trend: 8.3
    },
    {
      id: 4,
      username: "food_explorer_david",
      full_name: "David Kim",
      profile_pic_url: "/avatars/04.png",
      followers: 125000,
      engagement_rate: 6.2,
      categories: ["Food", "Travel", "Culture"],
      location: "Los Angeles, USA",
      is_verified: false,
      unlocked: true,
      lastPost: "6 hours ago",
      trend: 15.7
    },
    {
      id: 5,
      username: "beauty_guru_emma",
      full_name: "Emma Wilson",
      profile_pic_url: "/avatars/05.png",
      followers: 410000,
      engagement_rate: 4.8,
      categories: ["Beauty", "Skincare", "Fashion"],
      location: "London, UK",
      is_verified: true,
      unlocked: true,
      lastPost: "3 hours ago",
      trend: 7.2
    }
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }


  const totalReach = creators.reduce((sum, creator) => sum + creator.followers, 0)
  const avgEngagement = creators.reduce((sum, creator) => sum + creator.engagement_rate, 0) / creators.length

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
                  {creators.map((creator) => (
                    <Card key={creator.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
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
                            <AvatarImage src={creator.profile_pic_url} alt={creator.full_name} />
                            <AvatarFallback>
                              {creator.full_name.split(' ').map(n => n[0]).join('')}
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
                          {creator.categories.slice(0, 3).map((category, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Followers and Engagement */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-muted rounded-md">
                            <div className="text-lg font-bold">{formatNumber(creator.followers)}</div>
                            <div className="text-xs text-muted-foreground">Followers</div>
                          </div>
                          <div className="text-center p-2 bg-muted rounded-md">
                            <div className="text-lg font-bold">{creator.engagement_rate}%</div>
                            <div className="text-xs text-muted-foreground">Engagement</div>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center justify-center gap-2">
                          <ReactCountryFlag
                            countryCode={getCountryCode(creator.location)}
                            svg
                            style={{
                              width: '16px',
                              height: '12px',
                            }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {creator.location}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}