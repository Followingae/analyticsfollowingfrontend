"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  Camera,
  CheckCircle2,
  BarChart3,
  Clock,
  ChevronRight,
  Play,
  Pause,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface CampaignStage {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "completed" | "active" | "pending" | "blocked";
  progress: number;
  estimatedDays?: number;
  actualDays?: number;
  startDate?: string;
  completedDate?: string;
}

interface CampaignWorkflowProps {
  campaignId: string;
  currentStage: string;
  isAgencyClient: boolean;
}

export function CampaignWorkflow({ campaignId, currentStage, isAgencyClient }: CampaignWorkflowProps) {
  const router = useRouter();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [stages, setStages] = useState<CampaignStage[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (progressBarRef.current) {
        const scrolled = window.scrollY > 120;
        setIsScrolled(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    initializeStages();
  }, [currentStage, isAgencyClient]);

  const initializeStages = () => {
    const baseStages: CampaignStage[] = [
      {
        id: "proposal",
        title: "Proposal",
        description: "Campaign proposal review and approval",
        icon: FileText,
        status: "completed",
        progress: 100,
        estimatedDays: 2,
        actualDays: 1,
        startDate: "2024-10-20",
        completedDate: "2024-10-21",
      },
      {
        id: "influencer_selection",
        title: "Influencer Selection",
        description: "Sourcing and vetting influencers",
        icon: Users,
        status: currentStage === "influencer_selection" ? "active" :
                currentStage === "proposal" ? "pending" : "completed",
        progress: currentStage === "influencer_selection" ? 65 :
                 currentStage === "proposal" ? 0 : 100,
        estimatedDays: 5,
        actualDays: currentStage === "influencer_selection" ? 3 : undefined,
        startDate: "2024-10-21",
      },
      {
        id: "content_creation",
        title: "Content Creation",
        description: "Influencers create campaign content",
        icon: Camera,
        status: ["proposal", "influencer_selection"].includes(currentStage) ? "pending" :
                currentStage === "content_creation" ? "active" : "completed",
        progress: currentStage === "content_creation" ? 40 :
                 ["proposal", "influencer_selection"].includes(currentStage) ? 0 : 100,
        estimatedDays: 7,
        startDate: currentStage === "content_creation" ? "2024-10-25" : undefined,
      },
      {
        id: "content_approval",
        title: "Content Approval",
        description: "Review and approve influencer content",
        icon: CheckCircle2,
        status: ["proposal", "influencer_selection", "content_creation"].includes(currentStage) ? "pending" :
                currentStage === "content_approval" ? "active" : "completed",
        progress: currentStage === "content_approval" ? 20 :
                 ["proposal", "influencer_selection", "content_creation"].includes(currentStage) ? 0 : 100,
        estimatedDays: 3,
      },
      {
        id: "reporting",
        title: "Reporting",
        description: "Campaign performance analysis",
        icon: BarChart3,
        status: currentStage === "reporting" ? "active" :
                currentStage === "completed" ? "completed" : "pending",
        progress: currentStage === "reporting" ? 80 :
                 currentStage === "completed" ? 100 : 0,
        estimatedDays: 2,
      },
    ];

    if (!isAgencyClient) {
      // Remove proposal stage for self-serve users
      setStages(baseStages.filter(stage => stage.id !== "proposal"));
    } else {
      setStages(baseStages);
    }
  };

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.status === "active");
  };

  const getOverallProgress = () => {
    const completedStages = stages.filter(stage => stage.status === "completed").length;
    const activeStage = stages.find(stage => stage.status === "active");
    const activeProgress = activeStage ? activeStage.progress / 100 : 0;

    return ((completedStages + activeProgress) / stages.length) * 100;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
      active: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
      pending: "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
      blocked: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Adaptive Progress Bar */}
      <div
        ref={progressBarRef}
        className={cn(
          "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b transition-all duration-300",
          isScrolled ? "py-2 shadow-sm" : "py-4"
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/campaigns")}
                className={cn(
                  "transition-all duration-300",
                  isScrolled ? "p-1" : "p-2"
                )}
              >
                <ArrowLeft className={cn("transition-all duration-300", isScrolled ? "h-4 w-4" : "h-5 w-5")} />
              </Button>
              <div className="space-y-1">
                <h1 className={cn(
                  "font-semibold transition-all duration-300",
                  isScrolled ? "text-lg" : "text-2xl"
                )}>
                  Campaign Workflow
                </h1>
                {!isScrolled && (
                  <p className="text-sm text-muted-foreground">
                    Track your campaign progress from proposal to completion
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={cn(
                  "font-medium transition-all duration-300",
                  isScrolled ? "text-sm" : "text-base"
                )}>
                  {getOverallProgress().toFixed(0)}% Complete
                </div>
                {!isScrolled && (
                  <div className="text-xs text-muted-foreground">
                    Stage {getCurrentStageIndex() + 1} of {stages.length}
                  </div>
                )}
              </div>
              <div className={cn(
                "transition-all duration-300",
                isScrolled ? "w-32" : "w-48"
              )}>
                <Progress value={getOverallProgress()} className="h-2" />
              </div>
            </div>
          </div>

          {/* Mini Stage Indicators (when scrolled) */}
          {isScrolled && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                      getStatusColor(stage.status),
                      stage.status === "active" && "ring-2 ring-primary/20"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{stage.title}</span>
                    {stage.status === "active" && stage.progress < 100 && (
                      <span className="text-xs opacity-75">({stage.progress}%)</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Workflow Content */}
      <div className="container mx-auto px-6 space-y-8">
        {/* Stage Cards */}
        <div className="grid gap-6">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="relative">
                <Card className={cn(
                  "transition-all duration-300 hover:shadow-lg",
                  stage.status === "active" && "ring-2 ring-primary/20 shadow-lg",
                  stage.status === "completed" && "bg-green-50/50 dark:bg-green-950/10"
                )}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-full transition-all duration-300",
                          stage.status === "completed" && "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400",
                          stage.status === "active" && "bg-primary/10 text-primary",
                          stage.status === "pending" && "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                          stage.status === "blocked" && "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {stage.title}
                            <Badge variant="outline" className={getStatusColor(stage.status)}>
                              {stage.status === "active" && <Play className="mr-1 h-3 w-3" />}
                              {stage.status === "completed" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                              {stage.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                              {stage.status === "blocked" && <AlertCircle className="mr-1 h-3 w-3" />}
                              {stage.status ? stage.status.charAt(0).toUpperCase() + stage.status.slice(1) : 'Pending'}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {stage.estimatedDays} days estimated
                        </div>
                        {stage.actualDays && (
                          <div className="text-xs text-muted-foreground">
                            {stage.actualDays} days actual
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar for Active Stage */}
                      {stage.status === "active" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{stage.progress}%</span>
                          </div>
                          <Progress value={stage.progress} className="h-2" />
                        </div>
                      )}

                      {/* Timeline Information */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          {stage.startDate && (
                            <div>
                              <span className="text-muted-foreground">Started: </span>
                              <span className="font-medium">
                                {new Date(stage.startDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {stage.completedDate && (
                            <div>
                              <span className="text-muted-foreground">Completed: </span>
                              <span className="font-medium">
                                {new Date(stage.completedDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        {stage.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (stage.id === "influencer_selection") {
                                router.push(`/campaigns/${campaignId}/influencers`);
                              } else if (stage.id === "proposal") {
                                router.push(`/campaigns/${campaignId}/proposal`);
                              } else if (stage.id === "content_creation") {
                                router.push(`/campaigns/${campaignId}/content`);
                              } else if (stage.id === "content_approval") {
                                router.push(`/campaigns/${campaignId}/approval`);
                              } else if (stage.id === "reporting") {
                                router.push(`/campaigns/${campaignId}?tab=stats`);
                              }
                            }}
                          >
                            View Details
                            <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex justify-center py-4">
                    <div className={cn(
                      "w-0.5 h-8 transition-colors duration-300",
                      stage.status === "completed" ? "bg-green-300 dark:bg-green-700" : "bg-border"
                    )} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Campaign Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {getOverallProgress().toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stages.filter(s => s.status === "completed").length}
                </div>
                <div className="text-sm text-muted-foreground">Stages Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stages.reduce((acc, stage) => acc + (stage.actualDays || stage.estimatedDays || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  On Track
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}