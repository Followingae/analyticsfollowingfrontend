"use client";

import { useState } from "react";
import {
  Camera,
  Video,
  FileText,
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Eye,
  Download,
  Share2,
  MessageSquare,
  Heart,
  TrendingUp,
  Image,
  Film,
  FileImage,
  Plus,
  MoreVertical,
  Star,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ContentCreationHubProps {
  campaign: any;
  stage: any;
}

export function ContentCreationHub({ campaign, stage }: ContentCreationHubProps) {
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

  // Mock content data
  const contentPieces = [
    {
      id: "1",
      type: "image",
      title: "Summer Collection Hero Shot",
      creator: {
        name: "Sarah Johnson",
        username: "lifestyle_maven",
        avatar: "https://picsum.photos/100/100?random=1",
      },
      thumbnail: "https://picsum.photos/400/400?random=1",
      status: "approved",
      scheduledDate: "2024-10-28",
      engagement: {
        likes: 5200,
        comments: 180,
        shares: 45,
      },
      platform: "Instagram",
      contentType: "Post",
    },
    {
      id: "2",
      type: "video",
      title: "Behind the Scenes Reel",
      creator: {
        name: "Mike Chen",
        username: "tech_innovator",
        avatar: "https://picsum.photos/100/100?random=2",
      },
      thumbnail: "https://picsum.photos/400/400?random=2",
      status: "in_review",
      scheduledDate: "2024-10-29",
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
      platform: "Instagram",
      contentType: "Reel",
    },
    {
      id: "3",
      type: "carousel",
      title: "Product Showcase Carousel",
      creator: {
        name: "Emma Rodriguez",
        username: "fashion_forward",
        avatar: "https://picsum.photos/100/100?random=3",
      },
      thumbnail: "https://picsum.photos/400/400?random=3",
      status: "draft",
      scheduledDate: "2024-10-30",
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
      platform: "Instagram",
      contentType: "Carousel",
    },
    {
      id: "4",
      type: "story",
      title: "24-Hour Flash Sale Story",
      creator: {
        name: "Alex Kim",
        username: "fitness_guru",
        avatar: "https://picsum.photos/100/100?random=4",
      },
      thumbnail: "https://picsum.photos/400/600?random=4",
      status: "scheduled",
      scheduledDate: "2024-10-31",
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
      platform: "Instagram",
      contentType: "Story",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: {
        label: "Approved",
        className: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle2,
      },
      in_review: {
        label: "In Review",
        className: "bg-orange-100 text-orange-700 border-orange-200",
        icon: Clock,
      },
      draft: {
        label: "Draft",
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: Edit2,
      },
      scheduled: {
        label: "Scheduled",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Calendar,
      },
      rejected: {
        label: "Needs Revision",
        className: "bg-red-100 text-red-700 border-red-200",
        icon: AlertCircle,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return Film;
      case "carousel":
        return FileImage;
      case "story":
        return Camera;
      default:
        return Image;
    }
  };

  return (
    <div className="space-y-6">
      {/* Content Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs text-muted-foreground">Total Content</div>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Camera className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">6</div>
                <div className="text-xs text-muted-foreground">In Review</div>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">10</div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-1 h-3 w-3" />
              Calendar View
            </Button>
            <Button size="sm">
              <Plus className="mr-1 h-3 w-3" />
              Upload Content
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {contentPieces.map((content) => {
              const ContentIcon = getContentIcon(content.type);

              return (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                    <div className="relative aspect-square">
                      <img
                        src={content.thumbnail}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay on Hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Content Type Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-black/50 text-white border-0 backdrop-blur">
                          <ContentIcon className="mr-1 h-3 w-3" />
                          {content.contentType}
                        </Badge>
                      </div>

                      {/* Platform Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white/90 text-black border-0">
                          {content.platform}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      {/* Creator Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={content.creator.avatar} />
                          <AvatarFallback>{content.creator.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">
                          @{content.creator.username}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-medium text-sm mb-2 line-clamp-2">{content.title}</h4>

                      {/* Status and Date */}
                      <div className="flex items-center justify-between mb-3">
                        {getStatusBadge(content.status)}
                      </div>

                      {/* Schedule Date */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(content.scheduledDate).toLocaleDateString()}
                      </div>

                      {/* Engagement Preview (if available) */}
                      {content.status === "approved" && content.engagement.likes > 0 && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            {content.engagement.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-blue-500" />
                            {content.engagement.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3 text-green-500" />
                            {content.engagement.shares}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">6 Items Pending Review</h3>
                      <p className="text-sm text-muted-foreground">
                        Average review time: 2-4 hours
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">
                    Review All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">8 Approved Content Pieces</h3>
            <p className="text-muted-foreground mb-4">
              Ready to be scheduled and published
            </p>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Publishing
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Content Calendar</h3>
            <p className="text-muted-foreground mb-4">
              View and manage your scheduled content
            </p>
            <Button>
              <Eye className="mr-2 h-4 w-4" />
              Open Calendar
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}