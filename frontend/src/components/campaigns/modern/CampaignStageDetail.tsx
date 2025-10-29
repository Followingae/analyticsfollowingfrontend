"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  Target,
  TrendingUp,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Flag,
  MessageSquare,
  Paperclip,
  Download,
  Eye,
  BarChart3,
  Filter,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Import specialized stage components
import { ModernInfluencerSelection } from "./ModernInfluencerSelection";
import { ContentCreationHub } from "./ContentCreationHub";
import { CampaignAnalyticsView } from "./CampaignAnalyticsView";

interface StageDetailProps {
  stage: any;
  campaign: any;
  onAction: (stageId: string, action: string) => void;
}

export function CampaignStageDetail({ stage, campaign, onAction }: StageDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  if (!stage) return null;

  const StageIcon = stage.icon;

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-muted-foreground bg-muted/30 border-border";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
      case "active":
        return <Badge className="bg-primary/10 text-primary border-primary/30">In Progress</Badge>;
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  // Render stage-specific content based on stage ID
  const renderStageSpecificContent = () => {
    switch (stage.id) {
      case "influencer_selection":
        return <ModernInfluencerSelection campaign={campaign} stage={stage} />;
      case "content_creation":
        return <ContentCreationHub campaign={campaign} stage={stage} />;
      case "reporting":
        return <CampaignAnalyticsView campaign={campaign} stage={stage} />;
      default:
        return renderDefaultStageContent();
    }
  };

  const renderDefaultStageContent = () => (
    <div className="space-y-6">
      {/* Tasks Section */}
      {stage.tasks && stage.tasks.items && stage.tasks.items.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Stage Tasks
                <Badge variant="secondary" className="ml-2">
                  {stage.tasks.completed}/{stage.tasks.total}
                </Badge>
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-3 w-3" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {stage.tasks.items.map((task: any) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors",
                    task.completed && "opacity-60"
                  )}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => {}}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                      {task.priority && (
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getPriorityColor(task.priority))}
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit2 className="mr-2 h-3 w-3" />
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="mr-2 h-3 w-3" />
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      {stage.metrics && stage.metrics.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stage.metrics.map((metric: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                    {metric.trend && (
                      <TrendingUp
                        className={cn(
                          "h-3 w-3",
                          metric.trend === "up" ? "text-green-600" : "text-red-600"
                        )}
                      />
                    )}
                  </div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Team Members */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Avatar key={i} className="border-2 border-background">
                <AvatarImage src={`https://picsum.photos/100/100?random=${i}`} />
                <AvatarFallback>TM</AvatarFallback>
              </Avatar>
            ))}
            <Button
              size="icon"
              variant="outline"
              className="rounded-full h-10 w-10 ml-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Card className="border-0 shadow-lg h-full">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                stage.status === "completed" && "bg-green-100 text-green-700",
                stage.status === "active" && "bg-primary/10 text-primary",
                stage.status === "pending" && "bg-muted text-muted-foreground",
                stage.status === "blocked" && "bg-red-100 text-red-700"
              )}>
                <StageIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">{stage.title}</CardTitle>
                <CardDescription>{stage.description}</CardDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(stage.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Stage
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Flag Issue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stage Progress */}
        {stage.status === "active" && stage.progress >= 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stage Progress</span>
              <span className="font-medium">{stage.progress}%</span>
            </div>
            <Progress value={stage.progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Started {stage.startDate && new Date(stage.startDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Est. {stage.estimatedDuration}
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {stage.status === "blocked" ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Stage Blocked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This stage cannot proceed until the previous stages are completed.
            </p>
            <Button variant="outline" size="sm">
              View Requirements
            </Button>
          </div>
        ) : stage.status === "pending" ? (
          <div className="p-6 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">Stage Not Started</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This stage will begin once the current active stage is completed.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm">
                View Prerequisites
              </Button>
              <Button size="sm">
                <Eye className="mr-1 h-3 w-3" />
                Preview Stage
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 p-0">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {renderStageSpecificContent()}
              </TabsContent>

              <TabsContent value="details" className="mt-0 space-y-6">
                {renderDefaultStageContent()}
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">Jane Doe</div>
                      <div className="text-muted-foreground">
                        Updated stage progress to 65% • 2 hours ago
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3 text-sm">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>MK</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">Mike Kim</div>
                      <div className="text-muted-foreground">
                        Completed task "Review influencer portfolios" • 5 hours ago
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}