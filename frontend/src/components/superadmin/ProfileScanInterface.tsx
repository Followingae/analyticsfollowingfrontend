'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wrench,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
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
  AnalyticsCompletenessScanRequest,
  AnalyticsCompletenessScanResponse,
  AnalyticsCompletenessProfile
} from '@/services/superadminApi'
import { toast } from 'sonner'

interface ProfileScanInterfaceProps {
  onScanComplete?: (results: AnalyticsCompletenessScanResponse) => void
}

export default function ProfileScanInterface({ onScanComplete }: ProfileScanInterfaceProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<AnalyticsCompletenessScanResponse | null>(null)
  const [scanParams, setScanParams] = useState<AnalyticsCompletenessScanRequest>({
    limit: undefined,
    username_filter: '',
    include_complete: false
  })

  // Ensure hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleScan = async () => {
    setScanning(true)

    try {
      console.log('🔍 Starting profile scan with params:', scanParams)

      const cleanParams: AnalyticsCompletenessScanRequest = {
        ...(scanParams.limit && { limit: scanParams.limit }),
        ...(scanParams.username_filter && { username_filter: scanParams.username_filter }),
        include_complete: scanParams.include_complete
      }

      const response = await superadminApiService.scanAnalyticsCompleteness(cleanParams)

      if (response.success && response.data) {
        setResults(response.data)
        console.log(`✅ Scan completed: ${response.data.summary.total_profiles} profiles analyzed`)
        toast.success(`Scan completed: ${response.data.summary.total_profiles} profiles analyzed`)
        onScanComplete?.(response.data)
      } else {
        console.log('❌ Scan failed:', response.error)
        toast.error(response.error || 'Scan failed')
      }
    } catch (err) {
      console.error('💥 Scan error:', err)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setScanning(false)
    }
  }

  const handleRepairProfile = async (profile: AnalyticsCompletenessProfile) => {
    try {
      toast.loading(`Repairing ${profile.username}...`)

      const response = await superadminApiService.repairSingleAnalyticsCompletenessProfile(profile.username)

      if (response.success) {
        toast.success(`Successfully repaired ${profile.username}`)
        // Refresh scan results
        handleScan()
      } else {
        toast.error(response.error || `Failed to repair ${profile.username}`)
      }
    } catch (err) {
      console.error('Repair error:', err)
      toast.error('Network error during repair')
    }
  }

  const getCompletenessColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompletenessBarColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-500'
    if (score >= 0.7) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-32 w-full bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Scanning</h1>
          <p className="text-muted-foreground">
            Analyze creator profiles for analytics completeness
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/superadmin/analytics/completeness')}
        >
          ← Back to Dashboard
        </Button>
      </div>

      {/* Scan Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Scan Parameters
          </CardTitle>
          <CardDescription>
            Configure scan settings and filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="limit">Limit (optional)</Label>
              <Input
                id="limit"
                type="number"
                value={scanParams.limit || ''}
                onChange={(e) => setScanParams(prev => ({
                  ...prev,
                  limit: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                placeholder="All profiles"
                min="1"
                max="10000"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of profiles to scan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username_filter">Username Filter</Label>
              <Input
                id="username_filter"
                value={scanParams.username_filter || ''}
                onChange={(e) => setScanParams(prev => ({
                  ...prev,
                  username_filter: e.target.value
                }))}
                placeholder="e.g., ola"
              />
              <p className="text-xs text-muted-foreground">
                Filter by username pattern
              </p>
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_complete"
                  checked={scanParams.include_complete || false}
                  onCheckedChange={(checked) => setScanParams(prev => ({
                    ...prev,
                    include_complete: checked as boolean
                  }))}
                />
                <Label htmlFor="include_complete" className="text-sm">
                  Include complete profiles
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Show profiles that are already 100% complete
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Start Scan
                </>
              )}
            </Button>

            {results && (
              <Button
                variant="outline"
                onClick={handleScan}
                disabled={scanning}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scan Progress */}
      {scanning && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <h3 className="text-lg font-medium">Scanning Profiles</h3>
              <p className="text-muted-foreground">
                Analyzing creator profiles for completeness...
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Scan operations can take 30-60 seconds for full database analysis
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Results */}
      {results && !scanning && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Scan Results
              </CardTitle>
              <CardDescription>
                Completed in {results.execution_time_seconds.toFixed(2)} seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {formatNumber(results.summary.total_profiles)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Profiles</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(results.summary.complete_profiles)}
                  </div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatNumber(results.summary.incomplete_profiles)}
                  </div>
                  <div className="text-sm text-muted-foreground">Incomplete</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.summary.completeness_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completeness</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Overall Completeness</span>
                  <span>{results.summary.completeness_percentage.toFixed(1)}%</span>
                </div>
                <Progress value={results.summary.completeness_percentage} className="h-2" />
              </div>

              {/* Detailed Breakdown */}
              {(results.summary.needs_posts || results.summary.needs_ai_analysis || results.summary.needs_cdn_processing) && (
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {results.summary.needs_posts !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium">Needs Posts</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {formatNumber(results.summary.needs_posts)}
                      </span>
                    </div>
                  )}
                  {results.summary.needs_ai_analysis !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">Needs AI Analysis</span>
                      <span className="text-lg font-bold text-purple-600">
                        {formatNumber(results.summary.needs_ai_analysis)}
                      </span>
                    </div>
                  )}
                  {results.summary.needs_cdn_processing !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Needs CDN Processing</span>
                      <span className="text-lg font-bold text-orange-600">
                        {formatNumber(results.summary.needs_cdn_processing)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incomplete Profiles Table */}
          {results.incomplete_profiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Incomplete Profiles ({results.incomplete_profiles.length})
                </CardTitle>
                <CardDescription>
                  Profiles that need repair to achieve 100% completeness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Followers</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead>Missing Components</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.incomplete_profiles.slice(0, 25).map((profile) => (
                        <TableRow key={profile.profile_id}>
                          <TableCell className="font-medium">
                            @{profile.username}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getCompletenessColor(profile.completeness_score)}`}>
                                {(profile.completeness_score * 100).toFixed(1)}%
                              </span>
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getCompletenessBarColor(profile.completeness_score)}`}
                                  style={{ width: `${profile.completeness_score * 100}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {profile.followers_count ? formatNumber(profile.followers_count) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Stored: {profile.stored_posts_count}</div>
                              <div className="text-muted-foreground">
                                AI: {profile.ai_analyzed_posts_count} | CDN: {profile.cdn_processed_posts_count}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {profile.missing_components.slice(0, 3).map((component, idx) => (
                                <Badge key={idx} variant="destructive" className="text-xs">
                                  {component.replace('_', ' ')}
                                </Badge>
                              ))}
                              {profile.missing_components.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{profile.missing_components.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRepairProfile(profile)}
                              className="flex items-center gap-1"
                            >
                              <Wrench className="w-3 h-3" />
                              Repair
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {results.incomplete_profiles.length > 25 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Showing first 25 incomplete profiles.
                      {results.incomplete_profiles.length - 25} more available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Complete Message */}
          {results.incomplete_profiles.length === 0 && results.summary.total_profiles > 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                  <h3 className="text-lg font-medium">All Profiles Complete!</h3>
                  <p className="text-muted-foreground">
                    All scanned profiles have 100% analytics completeness.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Next Actions</CardTitle>
              <CardDescription>
                What would you like to do next?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={() => router.push('/superadmin/analytics/completeness/repair')}
                  disabled={results.incomplete_profiles.length === 0}
                  className="flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  Repair All Incomplete ({results.incomplete_profiles.length})
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/superadmin/analytics/completeness')}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  View Dashboard
                </Button>

                <Button
                  variant="outline"
                  onClick={handleScan}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Run New Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}