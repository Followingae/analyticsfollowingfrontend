'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Zap,
  TrendingUp
} from 'lucide-react';
import { AnalysisStatusResponse } from '@/types/creator';

interface AnalysisStatusCardProps {
  status: AnalysisStatusResponse;
  onRetry?: () => void;
  className?: string;
}

/**
 * 📊 ANALYSIS STATUS CARD - Real-time AI analysis progress
 * Shows current status, progress, and estimated completion time
 */
export function AnalysisStatusCard({ status, onRetry, className }: AnalysisStatusCardProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'processing':
        return <Brain className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'not_found':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'processing':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'not_found':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const getStatusLabel = () => {
    switch (status.status) {
      case 'processing':
        return 'AI Analysis in Progress';
      case 'completed':
        return 'Analysis Complete';
      case 'failed':
        return 'Analysis Failed';
      case 'not_found':
        return 'Profile Not Found';
      default:
        return 'Unknown Status';
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {getStatusLabel()}
              <Badge className={getStatusColor()}>
                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {status.message}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Processing Status */}
        {status.status === 'processing' && (
          <>
            {/* Progress Bar */}
            {status.completion_percentage !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Analysis Progress</span>
                  <span className="text-muted-foreground">
                    {Math.round(status.completion_percentage)}%
                  </span>
                </div>
                <Progress 
                  value={status.completion_percentage} 
                  className="h-3"
                />
              </div>
            )}

            {/* Time Remaining */}
            {status.estimated_completion && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Clock className="h-4 w-4 text-blue-500" />
                <div className="text-sm">
                  <span className="font-medium">Estimated completion: </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatTimeRemaining(status.estimated_completion)}
                  </span>
                </div>
              </div>
            )}

            {/* Processing Animation */}
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-blue-600">
                <TrendingUp className="h-4 w-4 animate-bounce" />
                <span className="text-sm font-medium animate-pulse">
                  Analyzing creator content...
                </span>
              </div>
            </div>
          </>
        )}

        {/* Completed Status */}
        {status.status === 'completed' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Zap className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <span className="font-medium text-green-700 dark:text-green-400">
                  AI analysis completed successfully!
                </span>
              </div>
            </div>
            
            {status.last_analyzed && (
              <div className="text-xs text-muted-foreground">
                Analyzed on {new Date(status.last_analyzed).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Failed Status */}
        {status.status === 'failed' && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-sm text-red-700 dark:text-red-400">
                <span className="font-medium">Analysis failed. </span>
                This can happen due to network issues, rate limits, or profile restrictions.
              </div>
            </div>
            
            {onRetry && (
              <Button 
                onClick={onRetry}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Analysis
              </Button>
            )}
          </div>
        )}

        {/* Not Found Status */}
        {status.status === 'not_found' && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="text-sm text-yellow-700 dark:text-yellow-400">
              <span className="font-medium">Profile not found. </span>
              Make sure to run the initial creator search before checking analysis status.
            </div>
          </div>
        )}

        {/* Additional Info */}
        {(status.status === 'processing' || status.status === 'completed') && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>• AI models analyze content categories, sentiment, and languages</p>
            <p>• Analysis includes 20+ content categories with confidence scores</p>
            <p>• Results are cached for improved performance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}