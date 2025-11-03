"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  DollarSign,
  Filter,
  Grid3X3,
  List,
  Search,
  Plus,
  Minus,
  Target,
  CheckCircle2,
  Verified,
  ChevronRight,
  Info,
  Sparkles,
  X
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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

interface InfluencerSelectionV2Props {
  campaignId: string;
  selectedInfluencers: string[];
  onSelectionChange: (selected: string[]) => void;
}

export function InfluencerSelectionV2({
  campaignId,
  selectedInfluencers,
  onSelectionChange
}: InfluencerSelectionV2Props) {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
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
      // Mock data for now
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
        {
          id: "4",
          username: "fitness_alex",
          full_name: "Alex Thompson",
          profile_picture_url: "https://picsum.photos/200/200?random=4",
          follower_count: 78000,
          following_count: 890,
          engagement_rate: 6.2,
          avg_likes: 4800,
          avg_comments: 260,
          location: "Miami, FL",
          category: "Health & Fitness",
          verified: false,
          recent_posts: 36,
          estimated_rate: { min: 500, max: 800 },
          audience_demographics: {
            age_groups: { "18-24": 35, "25-34": 40, "35-44": 20, "45+": 5 },
            gender: { "Female": 60, "Male": 40 },
            top_countries: { "US": 80, "Canada": 10, "UK": 5, "Australia": 5 }
          },
          content_performance: {
            avg_reach: 65000,
            best_performing_type: "Reels"
          }
        },
        {
          id: "5",
          username: "travel_diana",
          full_name: "Diana Martinez",
          profile_picture_url: "https://picsum.photos/200/200?random=5",
          follower_count: 156000,
          following_count: 2100,
          engagement_rate: 4.8,
          avg_likes: 7500,
          avg_comments: 340,
          location: "Barcelona, Spain",
          category: "Travel & Adventure",
          verified: true,
          recent_posts: 28,
          estimated_rate: { min: 1000, max: 1500 },
          audience_demographics: {
            age_groups: { "18-24": 28, "25-34": 42, "35-44": 25, "45+": 5 },
            gender: { "Female": 65, "Male": 35 },
            top_countries: { "Spain": 30, "US": 25, "UK": 15, "France": 10, "Germany": 10, "Italy": 10 }
          },
          content_performance: {
            avg_reach: 125000,
            best_performing_type: "Stories"
          }
        }
      ];

      setInfluencers(mockInfluencers);
    } catch (error) {
      console.error("Error fetching influencers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
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

  const activeFiltersCount = [
    filters.category !== "all",
    filters.minFollowers !== "",
    filters.maxFollowers !== "",
    filters.minEngagement !== "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search & Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px] p-0">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="font-semibold">Filter Influencers</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={filters.category} onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Food & Lifestyle">Food & Lifestyle</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Fashion & Beauty">Fashion & Beauty</SelectItem>
                        <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                        <SelectItem value="Travel & Adventure">Travel & Adventure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Follower Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minFollowers}
                        onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxFollowers}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min. Engagement Rate</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 2.5"
                      value={filters.minEngagement}
                      onChange={(e) => setFilters(prev => ({ ...prev, minEngagement: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setFilters({
                        category: "all",
                        minFollowers: "",
                        maxFollowers: "",
                        minEngagement: "",
                        location: "all",
                      });
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex border rounded-lg bg-muted/30">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none h-11 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none h-11 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedInfluencers.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Campaign Projection</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedData.count} creator{selectedData.count !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onSelectionChange([])}>
                Clear Selection
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Reach</p>
                <p className="text-2xl font-semibold">{formatNumber(selectedData.totalReach)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Engagement</p>
                <p className="text-2xl font-semibold">{selectedData.avgEngagement.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Est. Budget</p>
                <p className="text-2xl font-semibold">{formatCurrency(selectedData.totalBudget)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Est. Impressions</p>
                <p className="text-2xl font-semibold">
                  {formatNumber(Math.round(selectedData.totalReach * selectedData.avgEngagement / 100))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Influencer Cards */}
      <div className={cn(
        "grid gap-4",
        viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {filteredInfluencers.map((influencer) => {
          const isSelected = selectedInfluencers.includes(influencer.id);

          return (
            <Card
              key={influencer.id}
              className={cn(
                "group relative overflow-hidden transition-all duration-200",
                "hover:shadow-lg hover:-translate-y-0.5",
                isSelected && "ring-2 ring-primary shadow-lg",
                viewMode === "list" && "flex"
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity",
                  isSelected && "opacity-100"
                )}
              />

              <CardContent className={cn(
                "p-6",
                viewMode === "list" && "flex items-center gap-6 flex-1"
              )}>
                {/* Profile Section */}
                <div className={cn(
                  "flex items-center gap-4",
                  viewMode === "grid" && "mb-4"
                )}>
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-2 ring-background">
                      <AvatarImage src={influencer.profile_picture_url} />
                      <AvatarFallback className="text-xs">
                        {influencer.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {influencer.verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                        <Verified className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -top-1 -left-1 bg-primary rounded-full p-1">
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">@{influencer.username}</div>
                    <div className="text-sm text-muted-foreground truncate">{influencer.full_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {influencer.category}
                      </Badge>
                      {influencer.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {influencer.location.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className={cn(
                  "grid grid-cols-2 gap-3",
                  viewMode === "list" && "grid-cols-4 flex-1"
                )}>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Followers</p>
                    <p className="text-sm font-semibold">{formatNumber(influencer.follower_count)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Engagement</p>
                    <p className="text-sm font-semibold">{influencer.engagement_rate}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Avg. Likes</p>
                    <p className="text-sm font-semibold">{formatNumber(influencer.avg_likes)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Est. Rate</p>
                    <p className="text-sm font-semibold">
                      ${influencer.estimated_rate.min}-{influencer.estimated_rate.max}
                    </p>
                  </div>
                </div>

                {/* Engagement Bar */}
                {viewMode === "grid" && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Performance Score</span>
                      <span className="font-medium">
                        {Math.min((influencer.engagement_rate / 10) * 100, 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min((influencer.engagement_rate / 10) * 100, 100)}
                      className="h-1.5"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className={cn(
                  "flex gap-2 mt-4 pt-4 border-t",
                  viewMode === "list" && "mt-0 pt-0 border-t-0 ml-auto"
                )}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/creators/${influencer.username}`);
                    }}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View
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
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Selected
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
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

      {/* Empty State */}
      {filteredInfluencers.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No creators found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Try adjusting your search or filters to find creators that match your campaign requirements.
            </p>
            <Button
              variant="outline"
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