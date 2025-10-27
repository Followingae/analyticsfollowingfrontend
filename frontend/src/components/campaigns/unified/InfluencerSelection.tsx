"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Calendar,
  DollarSign,
  Filter,
  Grid3X3,
  List,
  Search,
  Plus,
  Minus,
  BarChart3,
  Target,
  CheckCircle2,
  Star,
  Verified,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Influencer {
  id: string;
  username: string;
  full_name: string;
  profile_picture_url: string;
  follower_count: number;
  following_count: number;
  engagement_rate: number;
  avg_likes: number;
  avg_comments: number;
  location?: string;
  category: string;
  verified: boolean;
  recent_posts: number;
  estimated_rate: {
    min: number;
    max: number;
  };
  audience_demographics: {
    age_groups: Record<string, number>;
    gender: Record<string, number>;
    top_countries: Record<string, number>;
  };
  content_performance: {
    avg_reach: number;
    best_performing_type: string;
  };
}

interface InfluencerSelectionProps {
  campaignId: string;
  selectedInfluencers: string[];
  onSelectionChange: (selected: string[]) => void;
}

export function InfluencerSelection({
  campaignId,
  selectedInfluencers,
  onSelectionChange
}: InfluencerSelectionProps) {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    category: "all",
    minFollowers: "",
    maxFollowers: "",
    minEngagement: "",
    location: "all",
  });

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      setIsLoading(true);
      // Mock data for now - in production this would fetch from API
      const mockInfluencers: Influencer[] = [
        {
          id: "1",
          username: "foodie_sarah",
          full_name: "Sarah Johnson",
          profile_picture_url: "https://picsum.photos/200/200?random=1",
          follower_count: 125000,
          following_count: 2800,
          engagement_rate: 4.2,
          avg_likes: 5200,
          avg_comments: 180,
          location: "Los Angeles, CA",
          category: "Food & Lifestyle",
          verified: true,
          recent_posts: 24,
          estimated_rate: { min: 800, max: 1200 },
          audience_demographics: {
            age_groups: { "18-24": 30, "25-34": 45, "35-44": 20, "45+": 5 },
            gender: { "Female": 68, "Male": 32 },
            top_countries: { "US": 72, "Canada": 15, "UK": 8, "Australia": 5 }
          },
          content_performance: {
            avg_reach: 98000,
            best_performing_type: "Reels"
          }
        },
        {
          id: "2",
          username: "tech_mike",
          full_name: "Mike Chen",
          profile_picture_url: "https://picsum.photos/200/200?random=2",
          follower_count: 89000,
          following_count: 1200,
          engagement_rate: 5.8,
          avg_likes: 4100,
          avg_comments: 320,
          location: "San Francisco, CA",
          category: "Technology",
          verified: false,
          recent_posts: 18,
          estimated_rate: { min: 600, max: 900 },
          audience_demographics: {
            age_groups: { "18-24": 25, "25-34": 50, "35-44": 20, "45+": 5 },
            gender: { "Male": 75, "Female": 25 },
            top_countries: { "US": 65, "India": 12, "UK": 10, "Canada": 8, "Germany": 5 }
          },
          content_performance: {
            avg_reach: 75000,
            best_performing_type: "Posts"
          }
        },
        {
          id: "3",
          username: "fashion_emma",
          full_name: "Emma Rodriguez",
          profile_picture_url: "https://picsum.photos/200/200?random=3",
          follower_count: 234000,
          following_count: 3400,
          engagement_rate: 3.6,
          avg_likes: 8400,
          avg_comments: 280,
          location: "New York, NY",
          category: "Fashion & Beauty",
          verified: true,
          recent_posts: 32,
          estimated_rate: { min: 1200, max: 1800 },
          audience_demographics: {
            age_groups: { "18-24": 40, "25-34": 35, "35-44": 20, "45+": 5 },
            gender: { "Female": 82, "Male": 18 },
            top_countries: { "US": 55, "Brazil": 12, "Mexico": 10, "UK": 8, "France": 7, "Spain": 8 }
          },
          content_performance: {
            avg_reach: 187000,
            best_performing_type: "Stories"
          }
        },
      ];

      setInfluencers(mockInfluencers);
    } catch (error) {
      console.error("Error fetching influencers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleInfluencerToggle = (influencerId: string) => {
    const newSelection = selectedInfluencers.includes(influencerId)
      ? selectedInfluencers.filter(id => id !== influencerId)
      : [...selectedInfluencers, influencerId];

    onSelectionChange(newSelection);
  };

  const getSelectedInfluencersData = () => {
    const selected = influencers.filter(inf => selectedInfluencers.includes(inf.id));

    const totalReach = selected.reduce((sum, inf) => sum + inf.follower_count, 0);
    const avgEngagement = selected.length > 0
      ? selected.reduce((sum, inf) => sum + inf.engagement_rate, 0) / selected.length
      : 0;
    const totalBudget = selected.reduce((sum, inf) =>
      sum + ((inf.estimated_rate.min + inf.estimated_rate.max) / 2), 0);

    return { totalReach, avgEngagement, totalBudget, count: selected.length };
  };

  const selectedData = getSelectedInfluencersData();

  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = influencer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filters.category === "all" || influencer.category === filters.category;

    const matchesFollowers =
      (!filters.minFollowers || influencer.follower_count >= parseInt(filters.minFollowers)) &&
      (!filters.maxFollowers || influencer.follower_count <= parseInt(filters.maxFollowers));

    const matchesEngagement = !filters.minEngagement ||
      influencer.engagement_rate >= parseFloat(filters.minEngagement);

    return matchesSearch && matchesCategory && matchesFollowers && matchesEngagement;
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Influencer Selection</h2>
          <p className="text-muted-foreground">
            Select influencers for your campaign and see real-time analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search influencers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={filters.category} onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Food & Lifestyle">Food & Lifestyle</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Fashion & Beauty">Fashion & Beauty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Min Followers</label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={filters.minFollowers}
                      onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Followers</label>
                    <Input
                      type="number"
                      placeholder="1000000"
                      value={filters.maxFollowers}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Min Engagement Rate (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="2.0"
                    value={filters.minEngagement}
                    onChange={(e) => setFilters(prev => ({ ...prev, minEngagement: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Analytics Panel */}
      {selectedInfluencers.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Campaign Analytics Preview
              <Badge variant="secondary" className="ml-auto">
                {selectedData.count} Influencer{selectedData.count !== 1 ? 's' : ''} Selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(selectedData.totalReach)}
                </div>
                <div className="text-sm text-muted-foreground">Total Reach</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {selectedData.avgEngagement.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg. Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedData.totalBudget)}
                </div>
                <div className="text-sm text-muted-foreground">Est. Budget</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(selectedData.totalReach * selectedData.avgEngagement / 100)}
                </div>
                <div className="text-sm text-muted-foreground">Est. Engagement</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="flex-1">
                <Target className="mr-1 h-3 w-3" />
                Add to Campaign
              </Button>
              <Button size="sm" variant="outline">
                Request More Suggestions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Influencer Grid/List */}
      <div className={cn(
        "grid gap-6",
        viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {filteredInfluencers.map((influencer) => {
          const isSelected = selectedInfluencers.includes(influencer.id);

          return (
            <Card
              key={influencer.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                isSelected && "ring-2 ring-primary shadow-lg bg-primary/5",
                viewMode === "list" && "flex-row"
              )}
              onClick={() => handleInfluencerToggle(influencer.id)}
            >
              <CardHeader className={cn(
                "relative",
                viewMode === "list" && "flex-row items-center space-y-0 space-x-4 pb-3"
              )}>
                <div className="absolute top-4 right-4">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleInfluencerToggle(influencer.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </div>

                <div className={cn(
                  "flex items-center gap-4",
                  viewMode === "grid" && "flex-col text-center"
                )}>
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={influencer.profile_picture_url} />
                      <AvatarFallback>
                        {influencer.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {influencer.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                        <Verified className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "space-y-1",
                    viewMode === "grid" && "text-center"
                  )}>
                    <div className="font-semibold">@{influencer.username}</div>
                    <div className="text-sm text-muted-foreground">{influencer.full_name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {influencer.location}
                    </div>
                  </div>
                </div>

                <Badge variant="secondary" className="w-fit">
                  {influencer.category}
                </Badge>
              </CardHeader>

              <CardContent className={cn(
                "space-y-4",
                viewMode === "list" && "flex-1 pt-0"
              )}>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{formatNumber(influencer.follower_count)}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">{influencer.engagement_rate}%</div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-medium">{formatNumber(influencer.avg_likes)}</div>
                      <div className="text-xs text-muted-foreground">Avg. Likes</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">
                        {formatCurrency(influencer.estimated_rate.min)}-{formatCurrency(influencer.estimated_rate.max)}
                      </div>
                      <div className="text-xs text-muted-foreground">Rate</div>
                    </div>
                  </div>
                </div>

                {/* Engagement Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Reach Potential</span>
                    <span className="font-medium">
                      {Math.round(influencer.follower_count * influencer.engagement_rate / 100)} interactions
                    </span>
                  </div>
                  <Progress
                    value={Math.min((influencer.engagement_rate / 10) * 100, 100)}
                    className="h-1"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/creators/${influencer.username}`);
                    }}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInfluencerToggle(influencer.id);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Minus className="mr-1 h-3 w-3" />
                        Remove
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-3 w-3" />
                        Select
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInfluencers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No influencers found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Try adjusting your search criteria or filters to find influencers that match your campaign needs.
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setFilters({
                  category: "all",
                  minFollowers: "",
                  maxFollowers: "",
                  minEngagement: "",
                  location: "all",
                });
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}