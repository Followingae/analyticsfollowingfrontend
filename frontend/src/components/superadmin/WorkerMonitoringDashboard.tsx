'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Loader2,
  Monitor,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
  Zap,
  Square
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  WorkerOverview,
  WorkerSummary,
  QueueStatus,
  WorkerDetails,
  IncompleteProfile,
  IncompleteProfilesResponse,
  WorkerActivityLog,
  WorkerActivityResponse,
  DiscoveryQueueStatus,
  UnprocessedProfile,
  ProcessAllUnprocessedResponse
} from '@/services/superadminApi'
import { toast } from 'sonner'
import { useUserStore } from '@/stores/userStore'

// Analytics Completeness Section Component
function AnalyticsCompletenessSection({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const [stats, setStats] = useState<any>(null)
  const [scanResults, setScanResults] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)

  useEffect(() => {
    getAnalyticsStats().then(setStats)

    // Listen for stats refresh events from child components
    const handleRefresh = () => {
      getAnalyticsStats().then(setStats)
    }

    window.addEventListener('refreshAnalyticsStats', handleRefresh)
    return () => window.removeEventListener('refreshAnalyticsStats', handleRefresh)
  }, [])

  const getAnalyticsStats = async () => {
    try {
      const response = await superadminApiService.getAnalyticsCompletenessStats()
      if (response.success && response.data) {
        return response.data
      } else {
        console.error('Failed to fetch analytics stats:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to fetch analytics stats:', error)
      return null
    }
  }

  const scanIncompleteProfiles = async () => {
    try {
      const response = await superadminApiService.scanAnalyticsCompleteness({
        limit: 100,
        include_complete: false
      })
      if (response.success && response.data) {
        return response.data
      } else {
        console.error('Scan failed:', response.error)
        toast.error(response.error || 'Scan failed')
        return null
      }
    } catch (error) {
      console.error('Failed to scan profiles:', error)
      toast.error('Network error during scan')
      return null
    }
  }

  const repairProfiles = async (dryRun = true) => {
    try {
      const response = await superadminApiService.repairAnalyticsCompleteness({
        max_profiles: 50,
        dry_run: dryRun
      })
      if (response.success && response.data) {
        return response.data
      } else {
        console.error('Repair failed:', response.error)
        toast.error(response.error || 'Repair failed')
        return null
      }
    } catch (error) {
      console.error('Failed to repair profiles:', error)
      toast.error('Network error during repair')
      return null
    }
  }

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const results = await scanIncompleteProfiles()
      if (results) {
        setScanResults(results)
        toast.success(`Scan completed: Found ${results.summary?.incomplete_profiles || 0} incomplete profiles`)
      }
    } finally {
      setIsScanning(false)
    }
  }

  const handleRepair = async () => {
    setIsRepairing(true)
    try {
      const results = await repairProfiles(false) // Live repair
      if (results) {
        toast.success(`Repair completed: ${results.summary?.successful_repairs || 0} profiles fixed`)
        // Refresh stats
        getAnalyticsStats().then(setStats)
      }
    } finally {
      setIsRepairing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Analytics Completeness
            </CardTitle>
            <CardDescription>Monitor and manage creator analytics completeness system</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground">Total Profiles</div>
              <div className="text-2xl font-bold">{stats.total_profiles?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground">Complete Profiles</div>
              <div className="text-2xl font-bold text-green-600">{stats.complete_profiles?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground">Completeness %</div>
              <div className="text-2xl font-bold">{stats.completeness_percentage?.toFixed(1) || 0}%</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground">Profiles Today</div>
              <div className="text-2xl font-bold">{stats.profiles_created_24h || 0}</div>
            </div>
          </div>
        )}


        {/* Scan Results */}
        {scanResults && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Scan Results</div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>Total Scanned: <span className="font-medium">{scanResults.summary?.total_profiles || 0}</span></div>
                  <div>Incomplete: <span className="font-medium text-red-600">{scanResults.summary?.incomplete_profiles || 0}</span></div>
                  <div>Need Posts: <span className="font-medium text-yellow-600">{scanResults.summary?.needs_posts || 0}</span></div>
                  <div>Need AI: <span className="font-medium text-blue-600">{scanResults.summary?.needs_ai_analysis || 0}</span></div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        </CardContent>
      )}
    </Card>
  )
}

// Incomplete Profiles Table Component
function IncompleteProfilesTable({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const [profiles, setProfiles] = useState<IncompleteProfile[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(0)

  // Bulk selection state
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [bulkRepairStatus, setBulkRepairStatus] = useState<string>('')

  useEffect(() => {
    fetchIncompleteProfiles()
  }, [page])

  // Reset selections when profiles change
  useEffect(() => {
    setSelectedProfiles([])
    setSelectAll(false)
  }, [profiles])

  const fetchIncompleteProfiles = async () => {
    setLoading(true)
    try {
      const response = await superadminApiService.getIncompleteProfiles(page, 50)
      if (response.success && response.data) {
        setProfiles(response.data.profiles || [])
        setTotal(response.data.total_count || 0)
        setTotalPages(response.data.total_pages || 0)
      } else {
        // Handle backend calculation errors gracefully
        const errorMsg = response.error || 'Failed to fetch incomplete profiles'
        if (errorMsg.includes('division by zero')) {
          toast.error('Backend error: Invalid completeness calculation. Please contact support.')
          console.error('Backend division by zero error in profile completeness scan')
        } else {
          toast.error(errorMsg)
        }
        // Set empty state on error
        setProfiles([])
        setTotal(0)
        setTotalPages(0)
      }
    } catch (error) {
      console.error('Failed to fetch incomplete profiles:', error)
      toast.error('Network error loading profiles')
      // Set empty state on network error
      setProfiles([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const repairProfile = async (username: string) => {
    try {
      const response = await superadminApiService.repairSingleAnalyticsCompletenessProfile(username)
      if (response.success) {
        toast.success(`Profile repair started for @${username}!`)
        fetchIncompleteProfiles() // Refresh the list

        // Trigger analytics stats refresh
        window.dispatchEvent(new CustomEvent('refreshAnalyticsStats'))
      } else {
        toast.error(response.error || 'Failed to start repair')
      }
    } catch (error) {
      console.error('Failed to repair profile:', error)
      toast.error('Network error during repair')
    }
  }

  // Bulk selection handlers
  const handleSelectProfile = (profileId: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProfiles([])
      setSelectAll(false)
    } else {
      const allProfileIds = profiles.map(p => p.id)
      setSelectedProfiles(allProfileIds)
      setSelectAll(true)
    }
  }

  const handleBulkRepairSelected = async () => {
    if (selectedProfiles.length === 0) {
      toast.error('No profiles selected')
      return
    }

    if (!confirm(`Are you sure you want to repair ${selectedProfiles.length} selected profiles? This will use the bulletproof creator search pipeline.`)) {
      return
    }

    setBulkRepairStatus('Starting bulk repair...')

    try {
      const response = await superadminApiService.repairAnalyticsCompleteness({
        profile_ids: selectedProfiles,
        max_profiles: selectedProfiles.length,
        dry_run: false
      })

      if (response.success) {
        setBulkRepairStatus(`Bulk repair completed! ${response.data?.summary?.successful_repairs || 0} profiles repaired successfully.`)
        setSelectedProfiles([])
        setSelectAll(false)
        fetchIncompleteProfiles() // Refresh the list
        toast.success(`Bulk repair completed! ${response.data?.summary?.successful_repairs || 0} profiles repaired.`)

        // Trigger analytics stats refresh
        window.dispatchEvent(new CustomEvent('refreshAnalyticsStats'))
      } else {
        setBulkRepairStatus(`Bulk repair failed: ${response.error || 'Unknown error'}`)
        toast.error(response.error || 'Bulk repair failed')
      }
    } catch (error) {
      console.error('Bulk repair failed:', error)
      setBulkRepairStatus('Bulk repair failed: Network error')
      toast.error('Network error during bulk repair')
    }

    // Clear status after 10 seconds
    setTimeout(() => setBulkRepairStatus(''), 10000)
  }

  const handleBulkScan = async () => {
    setBulkRepairStatus('Scanning all profiles for completeness issues...')

    try {
      const response = await superadminApiService.scanAnalyticsCompleteness({
        limit: 100,
        include_complete: false
      })

      if (response.success) {
        setBulkRepairStatus(`Scan completed! Found ${response.data?.summary?.incomplete_profiles || 0} incomplete profiles.`)
        fetchIncompleteProfiles() // Refresh from current page
        toast.success(`Scan completed! Found ${response.data?.summary?.incomplete_profiles || 0} incomplete profiles.`)

        // Trigger analytics stats refresh in parent component
        window.dispatchEvent(new CustomEvent('refreshAnalyticsStats'))
      } else {
        setBulkRepairStatus(`Scan failed: ${response.error || 'Unknown error'}`)
        toast.error(response.error || 'Scan failed')
      }
    } catch (error) {
      console.error('Bulk scan failed:', error)
      setBulkRepairStatus('Scan failed: Network error')
      toast.error('Network error during scan')
    }

    // Clear status after 10 seconds
    setTimeout(() => setBulkRepairStatus(''), 10000)
  }

  const handleBulkRepair = async () => {
    if (!confirm('Are you sure you want to repair ALL incomplete profiles? This is a powerful operation that will use significant resources.')) {
      return
    }

    setBulkRepairStatus('Starting bulk repair of ALL incomplete profiles...')

    try {
      const response = await superadminApiService.repairAnalyticsCompleteness({
        max_profiles: 50, // Safety limit
        dry_run: false
      })

      if (response.success) {
        setBulkRepairStatus(`Bulk repair completed! ${response.data?.summary?.successful_repairs || 0} profiles repaired successfully.`)
        fetchIncompleteProfiles() // Refresh the list
        toast.success(`Bulk repair completed! ${response.data?.summary?.successful_repairs || 0} profiles repaired.`)

        // Trigger analytics stats refresh
        window.dispatchEvent(new CustomEvent('refreshAnalyticsStats'))
      } else {
        setBulkRepairStatus(`Bulk repair failed: ${response.error || 'Unknown error'}`)
        toast.error(response.error || 'Bulk repair failed')
      }
    } catch (error) {
      console.error('Bulk repair failed:', error)
      setBulkRepairStatus('Bulk repair failed: Network error')
      toast.error('Network error during bulk repair')
    }

    // Clear status after 10 seconds
    setTimeout(() => setBulkRepairStatus(''), 10000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Incomplete Profiles ({total})
            </CardTitle>
            <CardDescription>
              Profiles that need fixing - see exactly what&apos;s wrong with each one
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedProfiles.length > 0 && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-muted-foreground">Selected:</span>
                <Badge variant="secondary" className="ml-2">
                  {selectedProfiles.length} profiles
                </Badge>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
        {/* Status Banner */}
        {bulkRepairStatus && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">{bulkRepairStatus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-muted-foreground">Showing:</span>
              <Badge variant="destructive" className="ml-2">
                {profiles.length} incomplete profiles
              </Badge>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => fetchIncompleteProfiles()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleBulkScan}
              variant="outline"
              size="sm"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Scan All
            </Button>
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            >
              {selectAll ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              onClick={handleBulkRepairSelected}
              disabled={selectedProfiles.length === 0}
              size="sm"
              className={`${
                selectedProfiles.length > 0
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 mr-2" />
              Repair Selected ({selectedProfiles.length})
            </Button>
            <Button
              onClick={handleBulkRepair}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Repair All
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>AI Posts</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProfiles.includes(profile.id)}
                        onChange={() => handleSelectProfile(profile.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <strong>@{profile.username}</strong>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{width: `${profile.completeness_score * 100}%`}}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {Math.round(profile.completeness_score * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-xs">
                        {profile.issues.map((issue, i) => (
                          <div key={i} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            {issue}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{profile.posts_count}</TableCell>
                    <TableCell>{profile.ai_posts_count}</TableCell>
                    <TableCell>{profile.followers_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => repairProfile(profile.username)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        Fix Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total profiles)
              </span>
              <Button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages || loading}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </>
        )}
        </CardContent>
      )}
    </Card>
  )
}

// Discovery Control Panel Component
function DiscoveryControlPanel({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const [queueStatus, setQueueStatus] = useState<DiscoveryQueueStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [processResults, setProcessResults] = useState<ProcessAllUnprocessedResponse | null>(null)

  useEffect(() => {
    fetchQueueStatus()

    if (autoRefresh) {
      const interval = setInterval(fetchQueueStatus, 30000) // Poll every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchQueueStatus = async () => {
    setLoading(true)
    try {
      const response = await superadminApiService.getDiscoveryQueueStatus()
      if (response.success && response.data) {
        setQueueStatus(response.data)
      } else {
        console.error('Failed to fetch discovery queue status:', response.error)
      }
    } catch (error) {
      console.error('Failed to fetch discovery queue status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessAll = async () => {
    if (!queueStatus) return

    const count = queueStatus.discovery_stats.unprocessed_count
    const estimatedMinutes = Math.round(count * 4) // 3-5 min per profile, use 4 as average

    const confirmed = confirm(
      `Process ${count} unprocessed profiles?\n\n` +
      `⏱️ Estimated time: ${estimatedMinutes}-${Math.round(count * 5)} minutes\n` +
      `⚠️ This is a long-running operation. Please don't close this page.\n\n` +
      `Click OK to proceed.`
    )

    if (!confirmed) return

    setProcessing(true)
    setProcessResults(null)

    try {
      const response = await superadminApiService.processAllUnprocessed(count)
      if (response.success && response.data) {
        setProcessResults(response.data)
        toast.success(
          `Processing complete! ${response.data.summary.successful} succeeded, ${response.data.summary.failed} failed`
        )
        // Refresh queue status
        await fetchQueueStatus()
      } else {
        toast.error(response.error || 'Failed to process profiles')
      }
    } catch (error) {
      console.error('Failed to process profiles:', error)
      toast.error('Network error during processing')
    } finally {
      setProcessing(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const getProcessingPercent = () => {
    if (!queueStatus) return 0
    const { processed_count, total_discovered } = queueStatus.discovery_stats
    if (total_discovered === 0) return 0
    return Math.round((processed_count / total_discovered) * 100)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🔍 Discovery Background Worker Status
            </CardTitle>
            <CardDescription>
              Real-time monitoring and control of profile discovery processing
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-refresh (30s)</span>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQueueStatus}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-6">
          {loading && !queueStatus ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : queueStatus ? (
            <>
              {/* Worker Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Background Processor:</span>
                      <Badge
                        variant="secondary"
                        className={
                          queueStatus.processor_running
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {queueStatus.processor_running ? '🟢 Running' : '🔴 Not Running'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Current Activity:</span>
                      <span className="text-sm text-muted-foreground">
                        {queueStatus.worker_active ? 'Currently Processing' : 'Idle'}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Discovery Statistics */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">📊 Discovery Statistics</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Total Discovered</div>
                      <div className="text-2xl font-bold">
                        {queueStatus.discovery_stats.total_discovered}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">profiles found</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">✅ Processed</div>
                      <div className="text-2xl font-bold text-green-600">
                        {queueStatus.discovery_stats.processed_count}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ({getProcessingPercent()}% complete)
                      </div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">❌ Unprocessed</div>
                      <div className="text-2xl font-bold text-red-600">
                        {queueStatus.discovery_stats.unprocessed_count}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">need processing</div>
                    </div>
                  </div>
                </div>

                {/* Action Required Alert */}
                {queueStatus.action_required && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <div className="font-semibold text-red-900">
                          ⚠️ Action Required: Background worker not processing
                        </div>
                        <Button
                          onClick={handleProcessAll}
                          disabled={processing}
                          size="lg"
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing profiles... This may take several minutes
                            </>
                          ) : (
                            <>
                              🔴 PROCESS ALL UNPROCESSED ({queueStatus.discovery_stats.unprocessed_count})
                            </>
                          )}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Processing Results */}
                {processResults && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold text-green-900">
                          ✅ Processing Complete
                        </div>
                        <div className="text-sm text-green-800">
                          {processResults.message}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                          <div>
                            Total: <span className="font-medium">{processResults.summary.total_processed}</span>
                          </div>
                          <div>
                            Successful: <span className="font-medium text-green-600">{processResults.summary.successful}</span>
                          </div>
                          <div>
                            Failed: <span className="font-medium text-red-600">{processResults.summary.failed}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Triggered by: {processResults.triggered_by}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Unprocessed Profiles Table */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    📋 Unprocessed Profiles ({queueStatus.unprocessed_profiles.length})
                  </h3>
                  {queueStatus.unprocessed_profiles.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Discovered</TableHead>
                            <TableHead>Followers</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queueStatus.unprocessed_profiles.slice(0, 20).map((profile, idx) => (
                            <TableRow key={`${profile.related_username}-${idx}`}>
                              <TableCell className="font-medium">
                                @{profile.related_username}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={
                                    profile.similarity_score >= 90
                                      ? 'bg-green-100 text-green-800'
                                      : profile.similarity_score >= 80
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {profile.similarity_score}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  {profile.processing_status}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatTimeAgo(profile.discovered_at)}
                              </TableCell>
                              <TableCell>
                                {profile.related_followers_count.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {queueStatus.unprocessed_profiles.length > 20 && (
                        <div className="p-4 text-center text-sm text-muted-foreground bg-muted">
                          Showing top 20 of {queueStatus.unprocessed_profiles.length} unprocessed profiles
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>All discovered profiles have been processed!</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Failed to load discovery queue status</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Worker Activity Feed Component
function WorkerActivityFeed({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const [logs, setLogs] = useState<WorkerActivityLog[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<{
    discovery_activities: number
    similar_profile_activities: number
    cdn_activities: number
  } | null>(null)

  useEffect(() => {
    fetchActivityLogs()

    if (autoRefresh) {
      const interval = setInterval(fetchActivityLogs, 10000) // Every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchActivityLogs = async () => {
    setLoading(true)
    try {
      const response = await superadminApiService.getWorkerActivityLogs(1, 50)
      if (response.success && response.data) {
        setLogs(response.data.activity_logs)
        setSummary(response.data.summary)
      } else {
        console.error('Failed to fetch activity logs:', response.error)
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityColor = (worker: string) => {
    const colors = {
      'Discovery Worker': 'bg-blue-100 text-blue-800',
      'Similar Profiles Processor': 'bg-green-100 text-green-800',
      'CDN Processor': 'bg-purple-100 text-purple-800'
    }
    return colors[worker as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time Worker Activity
            </CardTitle>
            <CardDescription>
              Live feed of what workers are doing right now
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {summary && (
              <div className="flex gap-2 text-xs">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Discovery: {summary.discovery_activities}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Similar: {summary.similar_profile_activities}
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  CDN: {summary.cdn_activities}
                </span>
              </div>
            )}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-refresh</span>
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-2">
          {loading && logs.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="bg-card border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getActivityColor(log.worker)} variant="secondary">
                        {log.worker}
                      </Badge>
                      <span className="font-medium text-sm">{log.activity}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">{log.details}</div>
                  </div>
                  <Badge className={getStatusColor(log.status)} variant="secondary">
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent worker activity</p>
              <p className="text-xs">Workers will appear here when they start processing</p>
            </div>
          )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function WorkerMonitoringDashboard() {
  const router = useRouter()
  const { user } = useUserStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [workerOverview, setWorkerOverview] = useState<WorkerOverview | null>(null)
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<WorkerDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [liveUpdates, setLiveUpdates] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Collapsible sections state
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    systemOverview: false,
    backgroundWorkers: false,
    discoveryControl: false,
    workerActivity: false,
    analyticsCompleteness: false,
    incompleteProfiles: false,
    systemResources: false
  })

  const toggleSection = (section: keyof typeof sectionsCollapsed) => {
    setSectionsCollapsed(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Ensure hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load initial data
  useEffect(() => {
    if (mounted) {
      loadDashboardData()
    }
  }, [mounted])

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  // 30-second polling for worker updates (as per specification)
  useEffect(() => {
    if (!mounted || liveUpdates) return // Skip polling when live updates are active

    const interval = setInterval(() => {
      loadDashboardData(false) // Don't show loading spinner for auto-refresh
    }, 30000) // 30 seconds = 30,000ms

    return () => clearInterval(interval)
  }, [mounted, liveUpdates])

  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    try {
      console.log('Loading worker monitoring data...')
      console.log('Current User:', user?.email, 'Role:', user?.role)
      console.log('User Has Superadmin Role:', user?.role === 'super_admin' || user?.role === 'superadmin')

      // Check the actual JWT token payload
      const authTokens = localStorage.getItem('auth_tokens')
      if (authTokens) {
        try {
          const tokenData = JSON.parse(authTokens)
          const accessToken = tokenData.access_token
          if (accessToken) {
            const payload = JSON.parse(atob(accessToken.split('.')[1]))
            console.log('JWT Token Payload:', payload)
            console.log('JWT Role Field:', payload.role)
            console.log('JWT User ID:', payload.sub || payload.user_id)
            console.log('JWT Email:', payload.email)
          }
        } catch (e) {
          console.log('Could not decode JWT token:', e)
        }
      } else {
        console.log('No auth_tokens found in localStorage')
      }

      const [overviewResponse, queueResponse] = await Promise.all([
        superadminApiService.getWorkerOverview(),
        superadminApiService.getQueueStatus()
      ])

      if (overviewResponse.success && overviewResponse.data) {
        setWorkerOverview(overviewResponse.data)
        console.log('Worker overview loaded')
      } else {
        console.log('Worker overview failed:', overviewResponse.error)
        // Check for permission errors
        if (overviewResponse.error?.includes('403') || overviewResponse.error?.includes('Forbidden')) {
          setError('Insufficient permissions. Worker monitoring requires superadmin access.')
          return
        }
      }

      if (queueResponse.success && queueResponse.data) {
        setQueueStatus(queueResponse.data)
        console.log('Queue status loaded')
      } else {
        console.log('Queue status failed:', queueResponse.error)
        // Check for permission errors
        if (queueResponse.error?.includes('403') || queueResponse.error?.includes('Forbidden')) {
          setError('Insufficient permissions. Worker monitoring requires superadmin access.')
          return
        }
      }

      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      console.error('Worker monitoring error:', err)
      toast.error('Failed to load worker monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const toggleLiveUpdates = () => {
    if (liveUpdates) {
      // Stop live updates
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setLiveUpdates(false)
      toast.info('Live updates disabled')
    } else {
      // Start live updates
      try {
        const eventSource = superadminApiService.createWorkerLiveStream()

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('Live update received:', data)

            // Update the dashboard with live data
            if (data.overview) {
              setWorkerOverview(data.overview)
            }
            if (data.queue_status) {
              setQueueStatus(data.queue_status)
            }
            setLastUpdated(new Date())
          } catch (err) {
            console.error('Failed to parse live update:', err)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error)
          setLiveUpdates(false)
          if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
          }
          toast.error('Live updates connection lost')
        }

        eventSourceRef.current = eventSource
        setLiveUpdates(true)
        toast.success('Live updates enabled')
      } catch (err) {
        console.error('Failed to start live updates:', err)
        toast.error('Failed to start live updates')
      }
    }
  }


  const getWorkerStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'  // Worker processing in last 24h
      case 'idle': return 'bg-yellow-100 text-yellow-800'  // No activity in last 24h
      case 'error': return 'bg-red-100 text-red-800'       // Database/system errors
      case 'failed': return 'bg-red-100 text-red-800'
      case 'stopped': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkerStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Processing'  // Based on 24h activity
      case 'idle': return 'Waiting'       // No activity in last 24h
      case 'error': return 'Error'        // Database/system errors
      case 'failed': return 'Error'
      case 'stopped': return 'Stopped'
      default: return 'Unknown'
    }
  }

  const getWorkerStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />
      case 'idle': return <Clock className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      case 'stopped': return <Square className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  const formatProcessingTime = (seconds: number) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${Math.round(seconds)}s`
    return `${Math.round(seconds / 60)}m`
  }

  const formatLastActivity = (timestamp: string) => {
    if (!timestamp) return 'Never'
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    } catch {
      return 'Invalid'
    }
  }

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Superadmin Dashboard</h1>
            <p className="text-muted-foreground">Real-time worker monitoring and analytics completeness management</p>
          </div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !workerOverview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Superadmin Dashboard</h1>
            <p className="text-muted-foreground">Real-time worker monitoring and analytics completeness management</p>
          </div>
          <Button onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load worker monitoring data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground">
            Monitor worker performance, manage incomplete profiles, and oversee analytics completeness
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={liveUpdates ? "default" : "outline"}
            size="sm"
            onClick={toggleLiveUpdates}
          >
            {liveUpdates ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Live Updates
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 mr-2" />
                Enable Live Updates
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>


      {/* System Overview */}
      {(workerOverview.system_overview || workerOverview.total_workers) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Overview
                </CardTitle>
                <CardDescription>
                  Overall worker system health and performance metrics
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('systemOverview')}
                className="h-8 w-8 p-0"
              >
                {sectionsCollapsed.systemOverview ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {!sectionsCollapsed.systemOverview && (
            <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-medium">Total Workers</span>
                <span className="text-2xl font-bold">
                  {workerOverview.system_overview?.total_workers || workerOverview.total_workers}
                </span>
              </div>

              <div className="flex flex-col space-y-2">
                <span className="text-sm font-medium">Active Workers</span>
                <span className="text-2xl font-bold text-green-600">
                  {workerOverview.system_overview?.active_workers || workerOverview.active_workers}
                </span>
                <span className="text-xs text-muted-foreground">Last 24h activity</span>
              </div>

              {workerOverview.system_overview?.overall_health && (
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium">System Health</span>
                  <Badge
                    className={
                      workerOverview.system_overview.overall_health === 'healthy'
                        ? 'bg-green-100 text-green-800'
                        : workerOverview.system_overview.overall_health === 'degraded'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                    variant="secondary"
                  >
                    {workerOverview.system_overview.overall_health.toUpperCase()}
                  </Badge>
                </div>
              )}

              {workerOverview.system_overview?.total_tasks_processed && (
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium">Tasks Processed</span>
                  <span className="text-2xl font-bold">
                    {formatNumber(workerOverview.system_overview.total_tasks_processed)}
                  </span>
                  <span className="text-xs text-muted-foreground">All time</span>
                </div>
              )}
            </div>

            {workerOverview.system_overview?.avg_system_response_time && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Response Time</span>
                  <span className="font-medium">
                    {workerOverview.system_overview.avg_system_response_time.toFixed(1)}s
                  </span>
                </div>
              </div>
            )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Worker Table - Live Data Only */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Background Workers ({workerOverview.workers.length})
              </CardTitle>
              <CardDescription>Live worker status and activity from database</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('backgroundWorkers')}
              className="h-8 w-8 p-0"
            >
              {sectionsCollapsed.backgroundWorkers ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!sectionsCollapsed.backgroundWorkers && (
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Job</TableHead>
                <TableHead>Today's Activity</TableHead>
                <TableHead>Total Processed</TableHead>
                <TableHead>Avg Time</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workerOverview.workers.map((worker, idx) => (
                <TableRow key={`${worker.worker_name}-${idx}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getWorkerStatusIcon(worker.status)}
                      <strong>{worker.worker_name}</strong>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getWorkerStatusColor(worker.status)} variant="secondary">
                      {worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{worker.current_job}</span>
                  </TableCell>
                  <TableCell>
                    {worker.worker_name === "Discovery Worker" && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-green-600">
                          {worker.profiles_created_24h || 0} profiles
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {worker.posts_processed_24h || 0} posts
                        </div>
                      </div>
                    )}
                    {worker.worker_name === "Similar Profiles Processor" && (
                      <div className="text-sm font-medium text-purple-600">
                        {worker.related_profiles_24h || 0} discoveries
                      </div>
                    )}
                    {worker.worker_name === "CDN Processor" && (
                      <div className="text-sm font-medium text-orange-600">
                        {worker.cdn_jobs_24h || 0} CDN jobs
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {worker.tasks_processed.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatProcessingTime(worker.avg_processing_time)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatLastActivity(worker.last_activity)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
        )}
      </Card>

      {/* Discovery Control Panel - NEW */}
      <DiscoveryControlPanel
        isCollapsed={sectionsCollapsed.discoveryControl}
        onToggle={() => toggleSection('discoveryControl')}
      />

      {/* Real-Time Worker Activity Feed */}
      <WorkerActivityFeed
        isCollapsed={sectionsCollapsed.workerActivity}
        onToggle={() => toggleSection('workerActivity')}
      />

      {/* Analytics Completeness Section */}
      <AnalyticsCompletenessSection
        isCollapsed={sectionsCollapsed.analyticsCompleteness}
        onToggle={() => toggleSection('analyticsCompleteness')}
      />

      {/* Incomplete Profiles Management */}
      <IncompleteProfilesTable
        isCollapsed={sectionsCollapsed.incompleteProfiles}
        onToggle={() => toggleSection('incompleteProfiles')}
      />

      {/* System Load */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Resources
              </CardTitle>
              <CardDescription>Real-time system performance metrics</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('systemResources')}
              className="h-8 w-8 p-0"
            >
              {sectionsCollapsed.systemResources ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!sectionsCollapsed.systemResources && (
          <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  CPU Usage
                </span>
                <span className="font-medium">
                  {workerOverview.system_load?.cpu_percent?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <Progress value={workerOverview.system_load?.cpu_percent || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Memory
                </span>
                <span className="font-medium">
                  {workerOverview.system_load?.memory_percent?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <Progress value={workerOverview.system_load?.memory_percent || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Disk Usage
                </span>
                <span className="font-medium">
                  {workerOverview.system_load?.disk_percent?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <Progress value={workerOverview.system_load?.disk_percent || 0} className="h-2" />
            </div>
          </div>
          </CardContent>
        )}
      </Card>

    </div>
  )
}