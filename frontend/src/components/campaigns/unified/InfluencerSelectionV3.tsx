"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  Search,
  Filter,
  Check,
  Plus,
  ChevronRight,
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  Verified,
  Info,
  Sparkles,
  BarChart3
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";

interface Influencer {
  id: string;
  username: string;
  full_name: string;
  profile_picture_url: string;
  follower_count: number;
  engagement_rate: number;
  avg_likes: number;
  avg_comments: number;
  location?: string;
  category: string;
  verified: boolean;
  estimated_rate: {
    min: number;
    max: number;
  };
}

interface InfluencerSelectionV3Props {
  campaignId: string;
  selectedInfluencers: string[];
  onSelectionChange: (selected: string[]) => void;
}

export function InfluencerSelectionV3({
  campaignId,
  selectedInfluencers = [],
  onSelectionChange
}: InfluencerSelectionV3Props) {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedInfluencers);
  const [filters, setFilters] = useState({
    category: "all",
    minFollowers: "",
    maxFollowers: "",
    minEngagement: "",
  });

  // Sync local state with props
  useEffect(() => {
    setLocalSelected(selectedInfluencers);
  }, [selectedInfluencers]);

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      setIsLoading(true);

      const mockInfluencers: Influencer[] = [
        {
          id: "1",
          username: "sarah.creates",
          full_name: "Sarah Johnson",
          profile_picture_url: "https://picsum.photos/400/400?random=1",
          follower_count: 125000,
          engagement_rate: 4.2,
          avg_likes: 5200,
          avg_comments: 180,
          location: "Los Angeles",
          category: "Lifestyle",
          verified: true,
          estimated_rate: { min: 800, max: 1200 }
        },
        {
          id: "2",
          username: "mike.tech",
          full_name: "Mike Chen",
          profile_picture_url: "https://picsum.photos/400/400?random=2",
          follower_count: 89000,
          engagement_rate: 5.8,
          avg_likes: 4100,
          avg_comments: 320,
          location: "San Francisco",
          category: "Technology",
          verified: false,
          estimated_rate: { min: 600, max: 900 }
        },
        {
          id: "3",
          username: "emma.style",
          full_name: "Emma Rodriguez",
          profile_picture_url: "https://picsum.photos/400/400?random=3",
          follower_count: 234000,
          engagement_rate: 3.6,
          avg_likes: 8400,
          avg_comments: 280,
          location: "New York",
          category: "Fashion",
          verified: true,
          estimated_rate: { min: 1200, max: 1800 }
        },
        {
          id: "4",
          username: "alex.fitness",
          full_name: "Alex Thompson",
          profile_picture_url: "https://picsum.photos/400/400?random=4",
          follower_count: 78000,
          engagement_rate: 6.2,
          avg_likes: 4800,
          avg_comments: 260,
          location: "Miami",
          category: "Fitness",
          verified: false,
          estimated_rate: { min: 500, max: 800 }
        },
        {
          id: "5",
          username: "diana.travel",
          full_name: "Diana Martinez",
          profile_picture_url: "https://picsum.photos/400/400?random=5",
          follower_count: 156000,
          engagement_rate: 4.8,
          avg_likes: 7500,
          avg_comments: 340,
          location: "Barcelona",
          category: "Travel",
          verified: true,
          estimated_rate: { min: 1000, max: 1500 }
        },
        {
          id: "6",
          username: "james.food",
          full_name: "James Wilson",
          profile_picture_url: "https://picsum.photos/400/400?random=6",
          follower_count: 198000,
          engagement_rate: 5.1,
          avg_likes: 9800,
          avg_comments: 420,
          location: "Chicago",
          category: "Food",
          verified: true,
          estimated_rate: { min: 1100, max: 1600 }
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 600));
      setInfluencers(mockInfluencers);
    } catch (error) {
      console.error("Error fetching influencers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const handleInfluencerToggle = (influencerId: string) => {
    console.log("Toggle influencer:", influencerId);
    console.log("Current selection:", localSelected);

    let newSelection: string[];
    if (localSelected.includes(influencerId)) {
      newSelection = localSelected.filter(id => id !== influencerId);
    } else {
      newSelection = [...localSelected, influencerId];
    }

    console.log("New selection:", newSelection);
    setLocalSelected(newSelection);
    onSelectionChange(newSelection);
  };

  const getSelectedData = () => {
    const selected = influencers.filter(inf => localSelected.includes(inf.id));
    const totalReach = selected.reduce((sum, inf) => sum + inf.follower_count, 0);
    const avgEngagement = selected.length > 0
      ? selected.reduce((sum, inf) => sum + inf.engagement_rate, 0) / selected.length
      : 0;
    const totalBudget = selected.reduce((sum, inf) =>
      sum + ((inf.estimated_rate.min + inf.estimated_rate.max) / 2), 0);

    // Calculate estimated impressions
    const estImpressions = selected.reduce((sum, inf) =>
      sum + (inf.follower_count * inf.engagement_rate / 100), 0);

    return {
      totalReach,
      avgEngagement,
      totalBudget,
      count: selected.length,
      estImpressions,
      avgCostPerPost: selected.length > 0 ? totalBudget / selected.length : 0,
      costPer1000: totalReach > 0 ? (totalBudget / totalReach) * 1000 : 0
    };
  };

  const selectedData = getSelectedData();

  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = !searchQuery ||
      influencer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filters.category === "all" ||
      influencer.category === filters.category;

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
    <div className="relative">
      <div className="flex gap-8">
        {/* Main Content - Scrollable */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-sm"
              />
            </div>

            <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 min-w-[100px]">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[320px] p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={filters.category} onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Fitness">Fitness</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Food">Food</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Follower Range</label>
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

                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Engagement Rate</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 2.5%"
                      value={filters.minEngagement}
                      onChange={(e) => setFilters(prev => ({ ...prev, minEngagement: e.target.value }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setFilters({
                          category: "all",
                          minFollowers: "",
                          maxFollowers: "",
                          minEngagement: "",
                        });
                        setShowFilters(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Influencer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInfluencers.map((influencer) => {
              const isSelected = localSelected.includes(influencer.id);

              return (
                <Card
                  key={influencer.id}
                  className={cn(
                    "relative group overflow-hidden transition-all duration-200",
                    "hover:shadow-lg border-0 shadow-sm cursor-pointer",
                    isSelected && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleInfluencerToggle(influencer.id)}
                >
                  {/* Selection Indicator */}
                  <div className="absolute top-4 right-4 z-10">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        "border-2 shadow-sm",
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-white border-gray-300"
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  <CardContent className="p-0">
                    {/* Profile Section */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={influencer.profile_picture_url} />
                          <AvatarFallback>
                            {influencer.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base truncate">
                              {influencer.full_name}
                            </h3>
                            {influencer.verified && (
                              <Verified className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{influencer.username}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {influencer.category}
                            </Badge>
                            {influencer.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {influencer.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics - Bold and Prominent */}
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Followers</p>
                          <p className="text-xl font-bold">
                            {formatNumber(influencer.follower_count)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                          <p className="text-xl font-bold text-green-600">
                            {influencer.engagement_rate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Rate</p>
                          <p className="text-xl font-bold">
                            ${influencer.estimated_rate.min}-{influencer.estimated_rate.max}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Details */}
                    <div className="px-6 pb-6 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {formatNumber(influencer.avg_likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {formatNumber(influencer.avg_comments)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/creators/${influencer.username}`);
                          }}
                        >
                          View Profile
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredInfluencers.length === 0 && !isLoading && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                  Try adjusting your search or filters
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
                    });
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Sticky with Real-time Analytics */}
        <div className="w-80 lg:w-96 shrink-0">
          <div className="sticky top-0 space-y-6">
            {/* Campaign Summary Card */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg">Campaign Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Real-time projections
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                </div>

                {localSelected.length === 0 ? (
                  <>
                    <div className="p-8 rounded-lg bg-muted/30 text-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-2">Start Building Your Campaign</p>
                      <p className="text-xs text-muted-foreground">
                        Select creators to see real-time analytics
                      </p>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex gap-3">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-900 dark:text-blue-100">
                          <p className="font-medium mb-1">Selection Tips</p>
                          <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                            <li>• Click on cards to select creators</li>
                            <li>• Mix engagement rates for balance</li>
                            <li>• Consider location demographics</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Selection Count */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 mb-4">
                      <span className="text-sm font-medium">Selected Creators</span>
                      <Badge className="bg-primary text-primary-foreground">
                        {selectedData.count}
                      </Badge>
                    </div>

                    {/* Real-time Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between mb-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-green-600 font-medium">
                            +{formatNumber(selectedData.totalReach)}
                          </span>
                        </div>
                        <p className="text-2xl font-bold">
                          {formatNumber(selectedData.totalReach)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Reach</p>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between mb-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-green-600 font-medium">
                            {selectedData.avgEngagement > 4 ? "High" : "Avg"}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedData.avgEngagement.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between mb-1">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">
                          {formatNumber(Math.round(selectedData.estImpressions))}
                        </p>
                        <p className="text-xs text-muted-foreground">Est. Impressions</p>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between mb-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">
                          ${selectedData.totalBudget.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Budget</p>
                      </div>
                    </div>

                    {/* Advanced Analytics */}
                    <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Performance Metrics</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cost per Post</span>
                          <span className="font-medium">
                            ${Math.round(selectedData.avgCostPerPost)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cost per 1K Reach</span>
                          <span className="font-medium">
                            ${selectedData.costPer1000.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Engagement Value</span>
                          <span className="font-medium">
                            {selectedData.avgEngagement > 4 ? "Excellent" :
                             selectedData.avgEngagement > 3 ? "Good" : "Average"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => router.push(`/campaigns/${campaignId}/content`)}
                      >
                        Continue with {selectedData.count} Creators
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setLocalSelected([]);
                          onSelectionChange([]);
                        }}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}