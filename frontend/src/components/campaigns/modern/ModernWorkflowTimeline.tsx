"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Stage {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "completed" | "active" | "pending" | "blocked";
  progress: number;
  startDate?: string;
  endDate?: string;
  estimatedDuration: string;
  tasks?: {
    completed: number;
    total: number;
  };
}

interface ModernWorkflowTimelineProps {
  stages: Stage[];
  selectedStageId: string;
  onStageSelect: (stageId: string) => void;
}

export function ModernWorkflowTimeline({
  stages,
  selectedStageId,
  onStageSelect,
}: ModernWorkflowTimelineProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle2;
      case "active":
        return Circle;
      case "blocked":
        return Lock;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";
      case "active":
        return "text-primary bg-primary/10 border-primary/30";
      case "blocked":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
      default:
        return "text-muted-foreground bg-muted/30 border-border";
    }
  };

  const getConnectorColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-b from-green-500 to-green-400";
      case "active":
        return "bg-gradient-to-b from-primary/50 to-primary/20";
      default:
        return "bg-gradient-to-b from-border to-border/50";
    }
  };

  return (
    <div className="relative px-6 pb-6">
      {stages.map((stage, index) => {
        const StatusIcon = getStatusIcon(stage.status);
        const StageIcon = stage.icon;
        const isSelected = selectedStageId === stage.id;
        const isHovered = hoveredStage === stage.id;
        const isLast = index === stages.length - 1;
        const isClickable = stage.status !== "blocked";

        return (
          <div key={stage.id} className="relative">
            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-6 top-12 w-0.5 h-24 transition-all duration-300",
                  getConnectorColor(stage.status),
                  stage.status === "active" && "animate-pulse"
                )}
              />
            )}

            {/* Stage Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={isClickable ? { x: 4 } : {}}
              className={cn(
                "relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer",
                isSelected && "bg-primary/5 ring-2 ring-primary/20",
                isHovered && isClickable && "bg-muted/50",
                !isClickable && "opacity-50 cursor-not-allowed"
              )}
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
              onClick={() => isClickable && onStageSelect(stage.id)}
            >
              {/* Stage Icon Circle */}
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-200",
                    getStatusColor(stage.status),
                    stage.status === "active" && "ring-4 ring-primary/20 animate-pulse",
                    isSelected && "scale-110"
                  )}
                >
                  {stage.status === "completed" ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : stage.status === "active" ? (
                    <StageIcon className="h-5 w-5" />
                  ) : stage.status === "blocked" ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <StageIcon className="h-5 w-5 opacity-50" />
                  )}
                </div>

                {/* Active Stage Pulse */}
                {stage.status === "active" && (
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                )}

                {/* Stage Number */}
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border text-xs font-medium">
                  {index + 1}
                </div>
              </div>

              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">{stage.title}</h3>
                  {stage.status === "active" && (
                    <Badge variant="default" className="text-xs px-1.5 py-0">
                      Active
                    </Badge>
                  )}
                  {stage.status === "completed" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                  {stage.description}
                </p>

                {/* Progress Bar for Active Stage */}
                {stage.status === "active" && stage.progress > 0 && (
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{stage.progress}%</span>
                    </div>
                    <Progress value={stage.progress} className="h-1.5" />
                  </div>
                )}

                {/* Stage Meta Info */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {stage.status === "completed" && stage.endDate && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {new Date(stage.endDate).toLocaleDateString()}
                    </span>
                  )}
                  {stage.status === "active" && stage.startDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Started {new Date(stage.startDate).toLocaleDateString()}
                    </span>
                  )}
                  {stage.status === "pending" && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Est. {stage.estimatedDuration}
                    </span>
                  )}
                  {stage.tasks && (
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {stage.tasks.completed}/{stage.tasks.total} tasks
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron for Selected */}
              {isSelected && isClickable && (
                <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-3" />
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}