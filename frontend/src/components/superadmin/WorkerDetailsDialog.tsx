'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Loader2,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Server,
  Square,
  TrendingUp,
  X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/lib/utils'
import {
  superadminApiService,
  WorkerDetails
} from '@/services/superadminApi'
import { toast } from 'sonner'

interface WorkerDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workerName: string | null
  onWorkerControl?: (workerName: string, action: string) => void
}

export default function WorkerDetailsDialog({
  open,
  onOpenChange,
  workerName,
  onWorkerControl
}: WorkerDetailsDialogProps) {
  const [workerDetails, setWorkerDetails] = useState<WorkerDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && workerName) {
      loadWorkerDetails()
    }
  }, [open, workerName])

  const loadWorkerDetails = async () => {
    if (!workerName) return

    setLoading(true)
    setError(null)

    try {
      const response = await superadminApiService.getWorkerDetails(workerName)

      if (response.success && response.data) {
        setWorkerDetails(response.data)
      } else {
        setError(response.error || 'Failed to load worker details')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      console.error('Worker details error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWorkerControl = async (action: 'start' | 'stop' | 'restart' | 'pause' | 'resume') => {
    if (!workerName) return

    try {
      const response = await superadminApiService.controlWorker(workerName, action)

      if (response.success && response.data) {
        toast.success(`Worker ${action} completed: ${response.data.message}`)
        // Refresh worker details
        loadWorkerDetails()
        // Notify parent component
        onWorkerControl?.(workerName, action)
      } else {
        toast.error(response.error || `Failed to ${action} worker`)
      }
    } catch (err) {
      console.error(`Worker control error (${action}):`, err)
      toast.error(`Network error while ${action}ing worker`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'idle': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'stopped': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    return `${(durationMs / 1000).toFixed(1)}s`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Worker Details: {workerName}
          </DialogTitle>
          <DialogDescription>
            Detailed information and controls for this worker
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading worker details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Worker Details</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={loadWorkerDetails}>
              Try Again
            </Button>
          </div>
        ) : workerDetails ? (
          <div className="space-y-6">
            {/* Worker Status & Controls */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className={getStatusColor(workerDetails.status)} variant="secondary">
                      {workerDetails.status}
                    </Badge>
                  </div>

                  {workerDetails.pid && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Process ID:</span>
                      <span className="text-sm font-mono">{workerDetails.pid}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime:</span>
                    <span className="text-sm">{formatUptime(workerDetails.uptime_seconds)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Started:</span>
                    <span className="text-sm">{formatTimestamp(workerDetails.started_at)}</span>
                  </div>

                  {workerDetails.current_job && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-2">Current Job:</div>
                      <div className="text-sm space-y-1">
                        <div><strong>ID:</strong> {workerDetails.current_job.id}</div>
                        <div><strong>Type:</strong> {workerDetails.current_job.type}</div>
                        <div><strong>Started:</strong> {formatTimestamp(workerDetails.current_job.started_at)}</div>
                        {workerDetails.current_job.progress !== undefined && (
                          <div className="space-y-1">
                            <div><strong>Progress:</strong> {workerDetails.current_job.progress}%</div>
                            <Progress value={workerDetails.current_job.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Health & Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Health:</span>
                    <Badge className={getHealthColor(workerDetails.health.status)} variant="outline">
                      {workerDetails.health.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        CPU Usage
                      </span>
                      <span className="font-medium">{workerDetails.health.cpu_percent.toFixed(1)}%</span>
                    </div>
                    <Progress value={workerDetails.health.cpu_percent} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Memory
                      </span>
                      <span className="font-medium">{workerDetails.health.memory_mb} MB</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Jobs Processed:</span>
                      <span className="font-medium">{formatNumber(workerDetails.stats.jobs_processed)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Jobs Failed:</span>
                      <span className="font-medium text-red-600">{formatNumber(workerDetails.stats.jobs_failed)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Processing:</span>
                      <span className="font-medium">{workerDetails.stats.avg_processing_time_ms}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Worker Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Worker Controls
                </CardTitle>
                <CardDescription>
                  Control worker operations and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWorkerControl('start')}
                    disabled={workerDetails.status === 'active'}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-3 w-3" />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWorkerControl('pause')}
                    disabled={workerDetails.status !== 'active'}
                    className="flex items-center gap-2"
                  >
                    <Pause className="h-3 w-3" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWorkerControl('restart')}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restart
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleWorkerControl('stop')}
                    disabled={workerDetails.status === 'stopped'}
                    className="flex items-center gap-2"
                  >
                    <Square className="h-3 w-3" />
                    Stop
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            {workerDetails.recent_jobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Jobs ({workerDetails.recent_jobs.length})
                  </CardTitle>
                  <CardDescription>
                    Latest job executions and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workerDetails.recent_jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-sm">{job.id}</TableCell>
                          <TableCell>{job.type}</TableCell>
                          <TableCell>
                            <Badge
                              className={job.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                              variant="secondary"
                            >
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{job.processing_time_ms}ms</TableCell>
                          <TableCell className="text-sm">
                            {formatTimestamp(job.completed_at)}
                          </TableCell>
                          <TableCell className="text-sm text-red-600">
                            {job.error || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Server className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Worker Selected</h3>
            <p className="text-muted-foreground">
              Select a worker to view detailed information
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}