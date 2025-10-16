'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  Loader2,
  PlayCircle,
  Settings,
  Shield,
  TrendingUp,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  AnalyticsCompletenessRepairRequest,
  AnalyticsCompletenessRepairResponse,
  AnalyticsCompletenessRepairResult
} from '@/services/superadminApi'
import { toast } from 'sonner'

interface RepairProfilesInterfaceProps {
  onRepairComplete?: (results: AnalyticsCompletenessRepairResponse) => void
}

export default function RepairProfilesInterface({ onRepairComplete }: RepairProfilesInterfaceProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [results, setResults] = useState<AnalyticsCompletenessRepairResponse | null>(null)
  const [repairParams, setRepairParams] = useState<AnalyticsCompletenessRepairRequest>({
    max_profiles: 10,
    dry_run: true,
    force_repair: false
  })

  // Ensure hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRepair = async () => {
    setRepairing(true)

    try {
      console.log('🔧 Starting profile repair with params:', repairParams)

      const cleanParams: AnalyticsCompletenessRepairRequest = {
        ...(repairParams.max_profiles && { max_profiles: repairParams.max_profiles }),
        dry_run: repairParams.dry_run,
        force_repair: repairParams.force_repair
      }

      const response = await superadminApiService.repairAnalyticsCompleteness(cleanParams)

      if (response.success && response.data) {
        setResults(response.data)

        if (response.data.dry_run) {
          console.log(`✅ Dry run completed: ${response.data.profiles_to_repair} profiles would be repaired`)
          toast.success(`Dry run completed: ${response.data.profiles_to_repair} profiles would be repaired`)
        } else {
          console.log(`✅ Repair completed: ${response.data.summary?.successful_repairs}/${response.data.summary?.total_profiles} profiles repaired`)
          toast.success(`Repair completed: ${response.data.summary?.successful_repairs}/${response.data.summary?.total_profiles} profiles repaired`)
        }

        onRepairComplete?.(response.data)
      } else {
        console.log('❌ Repair failed:', response.error)
        toast.error(response.error || 'Repair operation failed')
      }
    } catch (err) {
      console.error('💥 Repair error:', err)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setRepairing(false)
    }
  }

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const getResultStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Profile Repair</h1>
          <p className="text-muted-foreground">
            Repair incomplete creator profiles with bulletproof analytics pipeline
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/superadmin/analytics/completeness')}
        >
          ← Back to Dashboard
        </Button>
      </div>

      {/* Safety Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Bulletproof Operation:</strong> All repair operations use the bulletproof creator search system
          with rate limiting (max 5 concurrent, 100 repairs/hour). Dry run mode is recommended for testing.
        </AlertDescription>
      </Alert>

      {/* Repair Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Repair Parameters
          </CardTitle>
          <CardDescription>
            Configure repair operation settings and safety options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_profiles">Max Profiles to Repair</Label>
              <Input
                id="max_profiles"
                type="number"
                value={repairParams.max_profiles || ''}
                onChange={(e) => setRepairParams(prev => ({
                  ...prev,
                  max_profiles: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                min="1"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of profiles to repair (1-100)
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dry_run"
                    checked={repairParams.dry_run || false}
                    onCheckedChange={(checked) => setRepairParams(prev => ({
                      ...prev,
                      dry_run: checked as boolean
                    }))}
                  />
                  <Label htmlFor="dry_run" className="text-sm">
                    Dry Run (simulation only)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Test repair operations without actually modifying profiles
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="force_repair"
                    checked={repairParams.force_repair || false}
                    onCheckedChange={(checked) => setRepairParams(prev => ({
                      ...prev,
                      force_repair: checked as boolean
                    }))}
                  />
                  <Label htmlFor="force_repair" className="text-sm">
                    Force Repair
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Repair profiles even if recently processed
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            {repairParams.dry_run ? (
              <Button
                onClick={handleRepair}
                disabled={repairing}
                className="flex items-center gap-2"
                variant="outline"
              >
                {repairing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Run Simulation
                  </>
                )}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={repairing}
                    className="flex items-center gap-2"
                  >
                    {repairing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Repairing...
                      </>
                    ) : (
                      <>
                        <Wrench className="w-4 h-4" />
                        Start Repair
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Profile Repair</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will repair up to {repairParams.max_profiles} incomplete profiles using
                      the bulletproof creator analytics pipeline. This action will modify profile data
                      and trigger APIFY + CDN + AI analysis. Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRepair}>
                      Yes, Start Repair
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {!repairParams.dry_run && (
              <Alert className="flex-1">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  ⚠️ Live repair mode - will modify profile data and trigger full analytics pipeline
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Repair Progress */}
      {repairing && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <h3 className="text-lg font-medium">
                {repairParams.dry_run ? 'Simulating Repair Operation' : 'Repairing Profiles'}
              </h3>
              <p className="text-muted-foreground">
                {repairParams.dry_run
                  ? 'Analyzing which profiles would be repaired...'
                  : 'Using bulletproof creator analytics pipeline with APIFY + CDN + AI analysis...'
                }
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Repair operations run in background and can take several minutes to complete
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repair Results */}
      {results && !repairing && (
        <div className="space-y-6">
          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.dry_run ? (
                  <>
                    <Info className="h-5 w-5" />
                    Simulation Results
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Repair Results
                  </>
                )}
              </CardTitle>
              <CardDescription>
                Operation ID: {results.operation_id}
                {results.execution_time_seconds && (
                  <> • Completed in {results.execution_time_seconds.toFixed(2)} seconds</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.dry_run ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Simulation Complete</h4>
                    </div>
                    <p className="text-blue-700">
                      Would repair <strong>{results.profiles_to_repair}</strong> incomplete profiles using
                      the bulletproof analytics pipeline (APIFY + CDN + AI analysis)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setRepairParams(prev => ({ ...prev, dry_run: false }))}
                      className="flex items-center gap-2"
                    >
                      <Wrench className="w-4 h-4" />
                      Execute Real Repair
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/superadmin/analytics/completeness/scan')}
                      className="flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Run Detailed Scan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Success/Failure Summary */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {results.summary?.total_profiles || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Profiles</div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {results.summary?.successful_repairs || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>

                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {results.summary?.failed_repairs || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>

                  {/* Success Rate */}
                  {results.summary && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Success Rate</span>
                        <span>{(results.summary.success_rate * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={results.summary.success_rate * 100} className="h-2" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results */}
          {results.repair_results && results.repair_results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Detailed Results ({results.repair_results.length})
                </CardTitle>
                <CardDescription>
                  Individual profile repair outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.repair_results.map((result, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            @{result.username}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getResultStatusIcon(result.status)}
                              <Badge
                                variant={result.status === 'success' ? 'default' : 'destructive'}
                                className="capitalize"
                              >
                                {result.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={getResultStatusColor(result.status)}>
                              {result.message || result.error || 'Completed'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Actions */}
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
                  onClick={() => router.push('/superadmin/analytics/completeness/scan')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Run New Scan
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
                  onClick={() => setResults(null)}
                  className="flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  Run Another Repair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Information Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Repair System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Safety Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Rate limited: Max 5 concurrent operations</li>
                <li>• Hourly limit: 100 profiles per hour</li>
                <li>• Dry run mode for safe testing</li>
                <li>• Bulletproof analytics pipeline</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Repair Process</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Triggers APIFY for complete Instagram data</li>
                <li>• Runs AI analysis on posts content</li>
                <li>• Processes CDN thumbnails and images</li>
                <li>• Updates analytics completeness status</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}