"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  TrendingUp,
  Eye,
  Star,
  MapPin,
  DollarSign,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Target,
  Award,
  Heart,
  MessageCircle,
  BarChart3,
  Verified,
  UserPlus,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ModernInfluencerSelectionProps {
  campaign: any;
  stage: any;
}

export function ModernInfluencerSelection({ campaign, stage }: ModernInfluencerSelectionProps) {
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact");

  // Mock influencer data
  const influencers = [
    {
      id: "1",
      username: "lifestyle_maven",
      name: "Sarah Johnson",
      avatar: "https://picsum.photos/200/200?random=1",
      followers: 125000,
      engagement: 4.2,
      category: "Lifestyle",
      location: "Los Angeles, CA",
      verified: true,
      rate: "$800-1200",
      avgLikes: 5200,
      avgComments: 180,
      audienceMatch: 92,
      status: "selected",
      recentPosts: 24,
      topContent: ["Fashion", "Travel", "Beauty"],
    },
    {
      id: "2",
      username: "tech_innovator",
      name: "Mike Chen",
      avatar: "https://picsum.photos/200/200?random=2",
      followers: 89000,
      engagement: 5.8,
      category: "Technology",
      location: "San Francisco, CA",
      verified: false,
      rate: "$600-900",
      avgLikes: 4100,
      avgComments: 320,
      audienceMatch: 85,
      status: "selected",
      recentPosts: 18,
      topContent: ["Tech Reviews", "Gadgets", "Apps"],
    },
    {
      id: "3",
      username: "fashion_forward",
      name: "Emma Rodriguez",
      avatar: "https://picsum.photos/200/200?random=3",
      followers: 234000,
      engagement: 3.6,
      category: "Fashion",
      location: "New York, NY",
      verified: true,
      rate: "$1200-1800",
      avgLikes: 8400,
      avgComments: 280,
      audienceMatch: 88,
      status: "pending",
      recentPosts: 32,
      topContent: ["Fashion", "Style", "OOTD"],
    },
    {
      id: "4",
      username: "fitness_guru",
      name: "Alex Kim",
      avatar: "https://picsum.photos/200/200?random=4",
      followers: 156000,
      engagement: 4.8,
      category: "Fitness",
      location: "Miami, FL",
      verified: true,
      rate: "$900-1400",
      avgLikes: 6200,
      avgComments: 410,
      audienceMatch: 78,
      status: "available",
      recentPosts: 28,
      topContent: ["Fitness", "Nutrition", "Wellness"],
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "selected":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getMatchColor = (match: number) => {
    if (match >= 90) return "text-green-600";
    if (match >= 75) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Campaign Match Summary */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">8/10</div>
              <div className="text-sm text-muted-foreground">Influencers Selected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">2.5M</div>
              <div className="text-sm text-muted-foreground">Total Reach</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">4.5%</div>
              <div className="text-sm text-muted-foreground">Avg. Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">$8.5K</div>
              <div className="text-sm text-muted-foreground">Est. Budget</div>
            </div>
          </div>
          <Progress value={80} className="mt-4 h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>80% of target reached</span>
            <span>2 more influencers needed</span>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search influencers by name, category, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Suggestions
        </Button>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="selected" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="selected" className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Selected (2)
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending (1)
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Suggestions (12)
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            All (25)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selected" className="mt-6">
          <div className="grid gap-4">
            {influencers
              .filter((inf) => inf.status === "selected")
              .map((influencer) => (
                <motion.div
                  key={influencer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex items-center p-6 gap-6">
                        {/* Avatar Section */}
                        <div className="relative">
                          <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                            <AvatarImage src={influencer.avatar} />
                            <AvatarFallback>{influencer.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          {influencer.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                              <Verified className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 grid grid-cols-3 gap-6">
                          {/* Basic Info */}
                          <div>
                            <div className="font-semibold text-lg">@{influencer.username}</div>
                            <div className="text-sm text-muted-foreground">{influencer.name}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{influencer.category}</Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {influencer.location}
                              </span>
                            </div>
                          </div>

                          {/* Engagement Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-2xl font-bold">{formatNumber(influencer.followers)}</div>
                              <div className="text-xs text-muted-foreground">Followers</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">{influencer.engagement}%</div>
                              <div className="text-xs text-muted-foreground">Engagement</div>
                            </div>
                          </div>

                          {/* Performance & Actions */}
                          <div className="flex items-center justify-end gap-3">
                            <div className="text-right">
                              <div className={cn("text-2xl font-bold", getMatchColor(influencer.audienceMatch))}>
                                {influencer.audienceMatch}%
                              </div>
                              <div className="text-xs text-muted-foreground">Audience Match</div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="mr-1 h-3 w-3" />
                                Profile
                              </Button>
                              <Button size="sm" variant="default">
                                <MessageCircle className="mr-1 h-3 w-3" />
                                Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Stats Bar */}
                      <div className="bg-muted/30 px-6 py-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-6">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            {formatNumber(influencer.avgLikes)} avg. likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3 text-blue-500" />
                            {formatNumber(influencer.avgComments)} avg. comments
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            {influencer.rate}
                          </span>
                        </div>
                        <Badge className={getStatusColor(influencer.status)}>
                          {influencer.status === "selected" ? "Confirmed" : influencer.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-4">
            {influencers
              .filter((inf) => inf.status === "pending")
              .map((influencer) => (
                <Card key={influencer.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={influencer.avatar} />
                          <AvatarFallback>{influencer.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">@{influencer.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(influencer.followers)} followers • {influencer.engagement}% engagement
                          </div>
                          <Badge variant="outline" className="mt-1">
                            Awaiting Response
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <X className="mr-1 h-3 w-3" />
                          Cancel
                        </Button>
                        <Button size="sm">
                          <UserPlus className="mr-1 h-3 w-3" />
                          Follow Up
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI-Powered Suggestions</h3>
            <p className="text-muted-foreground mb-4">
              Based on your campaign objectives and target audience
            </p>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              View AI Recommendations
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Browse All Influencers</h3>
            <p className="text-muted-foreground mb-4">
              Discover and add more influencers to your campaign
            </p>
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Browse Influencers
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}