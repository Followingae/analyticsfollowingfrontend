"use client"
import { tokenManager } from '@/utils/tokenManager'

import { useState, useEffect } from "react"
import Link from "next/link"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, Trash2, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.following.ae"

interface StuckJob {
  id: string
  user_id: string
  job_type: string
  status: string
  priority: number
  created_at: string
  started_at: string | null
  minutes_stuck: number
}

export default function JobQueuePage() {
  const [stuckJobs, setStuckJobs] = useState<StuckJob[]>([])
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)

  const getToken = () => (tokenManager.getTokenSync() || localStorage.getItem("access_token")) || ""

  const fetchStuckJobs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/jobs/stuck`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStuckJobs(data.data?.jobs || data.jobs || [])
      }
    } catch {
      toast.error("Failed to fetch stuck jobs")
    } finally {
      setLoading(false)
    }
  }

  const cleanupJobs = async () => {
    setCleaning(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/jobs/cleanup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Cleaned ${data.cleaned_count || 0} stuck jobs`)
        fetchStuckJobs()
      } else {
        toast.error("Failed to cleanup jobs")
      }
    } catch {
      toast.error("Failed to cleanup jobs")
    } finally {
      setCleaning(false)
    }
  }

  useEffect(() => { fetchStuckJobs() }, [])

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div>
          <Link href="/superadmin/system" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to System
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Job Queue Management</h1>
              <p className="text-muted-foreground text-sm">View and clean up stuck post analytics jobs</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchStuckJobs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="destructive" size="sm" onClick={cleanupJobs} disabled={cleaning || stuckJobs.length === 0}>
                <Trash2 className="h-4 w-4 mr-1" /> {cleaning ? "Cleaning..." : `Cleanup ${stuckJobs.length} Jobs`}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stuckJobs.length}</p>
                <p className="text-xs text-muted-foreground">Stuck Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stuckJobs.filter(j => j.status === 'processing').length}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stuckJobs.filter(j => j.status === 'queued').length}</p>
                <p className="text-xs text-muted-foreground">Queued</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading stuck jobs...</p>
            </CardContent>
          </Card>
        ) : stuckJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">All Clear</h3>
              <p className="text-muted-foreground">No stuck jobs found. The system is healthy.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Stuck Jobs ({stuckJobs.length})</CardTitle>
              <CardDescription>Jobs that have been processing or queued for too long</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stuckJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{job.id.slice(0, 8)}...</code>
                        <Badge variant={job.status === 'processing' ? 'default' : 'secondary'}>{job.status}</Badge>
                        <Badge variant="outline">{job.job_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(job.created_at).toLocaleString()} · Stuck for {Math.round(job.minutes_stuck || 0)} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperadminLayout>
  )
}
