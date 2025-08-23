"use client"

import * as React from "react"
import { useState } from "react"
import { 
  Search, 
  Filter, 
  Users, 
  Eye, 
  Heart, 
  TrendingUp,
  MapPin,
  Unlock,
  Star,
  Instagram,
  ExternalLink,
  Zap
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Creator {
  id: string
  username: string
  fullName: string
  profilePic: string
  followers: number
  engagementRate: number
  avgLikes: number
  category: string
  location: string
  isVerified: boolean
  contentQuality: number
  unlockCost: number
  isUnlocked: boolean
}

const sampleCreators: Creator[] = [
  {
    id: "1",
    username: "fashionista_sarah",
    fullName: "Sarah Johnson",
    profilePic: "/avatars/creator1.jpg",
    followers: 245000,
    engagementRate: 4.2,
    avgLikes: 10300,
    category: "Fashion",
    location: "New York, USA",
    isVerified: true,
    contentQuality: 9.1,
    unlockCost: 50,
    isUnlocked: false
  },
  {
    id: "2", 
    username: "tech_reviewer_mike",
    fullName: "Mike Chen",
    profilePic: "/avatars/creator2.jpg",
    followers: 186000,
    engagementRate: 5.8,
    avgLikes: 8200,
    category: "Technology",
    location: "San Francisco, USA",
    isVerified: true,
    contentQuality: 8.7,
    unlockCost: 75,
    isUnlocked: true
  },
  {
    id: "3",
    username: "fitness_queen_anna",
    fullName: "Anna Rodriguez",
    profilePic: "/avatars/creator3.jpg",
    followers: 320000,
    engagementRate: 3.9,
    avgLikes: 12500,
    category: "Fitness",
    location: "Miami, USA",
    isVerified: false,
    contentQuality: 8.9,
    unlockCost: 60,
    isUnlocked: false
  }
]

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [loading, setLoading] = useState(false)
  const [creators, setCreators] = useState<Creator[]>(sampleCreators)

  const handleUnlockCreator = async (creatorId: string) => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setCreators(prev => 
      prev.map(creator => 
        creator.id === creatorId 
          ? { ...creator, isUnlocked: true }
          : creator
      )
    )
    setLoading(false)
  }

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         creator.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || creator.category.toLowerCase() === selectedCategory
    const matchesLocation = selectedLocation === "all" || creator.location.includes(selectedLocation)
    
    return matchesSearch && matchesCategory && matchesLocation
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discover Creators</h1>
          <p className="text-muted-foreground">Find and unlock Instagram creators for your campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <Zap className="h-3 w-3 mr-1" />
            2,450 credits
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Creators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-search-input
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCreators.map((creator) => (
          <Card key={creator.id} className="relative overflow-hidden">
            {creator.isUnlocked && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <Unlock className="h-3 w-3 mr-1" />
                  Unlocked
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={creator.profilePic} alt={creator.username} />
                  <AvatarFallback>
                    <Users className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{creator.fullName}</h3>
                    {creator.isVerified && (
                      <Badge variant="secondary" className="px-1 py-0">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">@{creator.username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{creator.location}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  <p className="font-semibold">{formatNumber(creator.followers)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-muted-foreground">Avg Likes</span>
                  </div>
                  <p className="font-semibold">{formatNumber(creator.avgLikes)}</p>
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Engagement Rate</span>
                  <span className="font-medium">{creator.engagementRate}%</span>
                </div>
                <Progress value={creator.engagementRate} className="h-2" />
              </div>

              {/* Content Quality */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content Quality</span>
                  <span className="font-medium">{creator.contentQuality}/10</span>
                </div>
                <Progress value={creator.contentQuality * 10} className="h-2" />
              </div>

              {/* Category */}
              <div className="flex items-center justify-between">
                <Badge variant="outline">{creator.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Instagram className="h-3 w-3" />
                  <span>Instagram</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {creator.isUnlocked ? (
                  <>
                    <Button size="sm" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View Analytics
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Visit Profile</DialogTitle>
                          <DialogDescription>
                            Visit @{creator.username} on Instagram
                          </DialogDescription>
                        </DialogHeader>
                        <Button asChild>
                          <a 
                            href={`https://instagram.com/${creator.username}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Open Instagram Profile
                          </a>
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleUnlockCreator(creator.id)}
                    disabled={loading}
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    Unlock ({creator.unlockCost} credits)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCreators.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground">Try adjusting your search filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}