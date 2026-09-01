"use client"
import { tokenManager } from '@/utils/tokenManager'
import { useState, useEffect } from "react"
import Link from "next/link"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { PageHead, Panel, Stat, StatGrid } from "@/components/console/primitives"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, RefreshCw, Trash2, AlertTriangle, CheckCircle2, Clock, Loader2, Lock, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useAdminAccess } from "@/hooks/useAdminAccess"
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
/** What went wrong, so the screen can say which — never "All Clear" over a failed read. */
type LoadFailure = { kind: "forbidden" | "error"; detail: string } | null
export default function JobQueuePage() {
  const [stuckJobs, setStuckJobs] = useState<StuckJob[]>([])
  const [failure, setFailure] = useState<LoadFailure>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  // Cleanup force-fails every stuck job in one press, and there is no undo: a job it kills
  // that was merely slow has to be re-queued by hand. It went straight through on a single
  // click. It now names how many jobs it is about to fail, and what that costs.
  const [confirmCleanup, setConfirmCleanup] = useState(false)
  // Force-failing every queued job is destructive. Scoped staff operate; they do not destroy.
  const { canDestroy, loading: accessLoading } = useAdminAccess()
  const getToken = () => (tokenManager.getTokenSync() || localStorage.getItem("access_token")) || ""
  const fetchStuckJobs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/jobs/stuck`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (!res.ok) {
        // A refused or broken read is not an empty queue. Say which one it was, and keep the
        // list empty rather than reporting a count we do not have.
        const body = await res.json().catch(() => null)
        const detail = (body?.detail && String(body.detail)) || res.statusText || `HTTP ${res.status}`
        setStuckJobs([])
        setFailure(res.status === 401 || res.status === 403
          ? { kind: "forbidden", detail }
          : { kind: "error", detail: `${res.status} · ${detail}` })
        return
      }
      const data = await res.json()
      // The route answers { success, data: [...], count }. Older shapes kept as fallbacks.
      const jobs = Array.isArray(data?.data) ? data.data : (data?.data?.jobs || data?.jobs || [])
      setStuckJobs(jobs)
      setFailure(null)
    } catch (e) {
      setStuckJobs([])
      setFailure({ kind: "error", detail: (e as Error)?.message || "The request did not complete" })
      toast.error("Could not load the job queue")
    } finally {
      setLoading(false)
    }
  }
  const cleanupJobs = async () => {
    setConfirmCleanup(false)
    setCleaning(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/jobs/cleanup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }
      })
      if (res.ok) {
        const data = await res.json()
        // This read `data.cleaned_count || 0`, so a response that did not carry a count
        // announced "Cleaned 0 stuck jobs" after a cleanup that may have cleared dozens.
        toast.success(typeof data?.cleaned_count === "number"
          ? `Cleaned ${data.cleaned_count} stuck jobs`
          : "Cleanup ran. The server did not say how many jobs it cleared.")
        fetchStuckJobs()
      } else {
        const body = await res.json().catch(() => null)
        toast.error(res.status === 401 || res.status === 403
          ? "You do not have permission to clean up jobs"
          : `Could not clean up jobs — ${body?.detail || res.statusText || res.status}`)
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
      <div className="space-y-ds-5">
        <div>
          <Link href="/superadmin/system" className="inline-flex items-center gap-2 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground mb-ds-3">
            <ArrowLeft className="h-4 w-4" /> System
          </Link>
          <PageHead
            title="Job queue"
            sub="Post analytics jobs that have been processing or queued for too long. Failing them clears the queue, it does not produce the analytics."
            action={
              <>
              <Button variant="outline" size="sm" onClick={fetchStuckJobs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              {!accessLoading && canDestroy && (
                <Button variant="destructive" size="sm" onClick={() => setConfirmCleanup(true)}
                        disabled={cleaning || !!failure || stuckJobs.length === 0}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  {cleaning
                    ? "Failing them…"
                    : `Fail ${stuckJobs.length} stuck job${stuckJobs.length === 1 ? "" : "s"}`}
                </Button>
              )}
              </>
            }
          />
        </div>
        {/* Summary. A failed read has no counts, so it shows an em-dash — a 0 here would
            read as "nothing is stuck", which is exactly the lie this screen used to tell. */}
        {/* Three cards for three counts of the same list, each with a large coloured icon
            competing with the figure beside it. The console Stat band instead: the tone
            arrives as a dot next to the caption, and the number is the biggest thing. */}
        <StatGrid cols={3}>
          {/* Tone is warn only when something IS stuck. A permanently amber "Stuck Jobs"
              caption would be decoration, and colour on this console is only ever state. */}
          <Stat label="Stuck jobs" tone={!failure && stuckJobs.length > 0 ? "warn" : "neutral"}
                value={failure ? "—" : stuckJobs.length} icon={AlertTriangle} />
          <Stat label="Processing"
                value={failure ? "—" : stuckJobs.filter(j => j.status === 'processing').length} icon={Clock} />
          <Stat label="Queued"
                value={failure ? "—" : stuckJobs.filter(j => j.status === 'queued').length} icon={CheckCircle2} />
        </StatGrid>
        {/* Jobs List */}
        {loading ? (
          <div className="py-ds-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-ds-body text-muted-foreground">Loading the queue…</p>
          </div>
        ) : failure?.kind === "forbidden" ? (
          <div className="py-ds-6 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-ds-3" />
              <h3 className="text-ds-subheading">You do not have permission to see the job queue</h3>
              <p className="text-muted-foreground">
                The server refused this read, so nothing here is known — not that the queue is empty.
              </p>
              <p className="text-xs text-muted-foreground mt-2">{failure.detail}</p>
          </div>
        ) : failure ? (
          <div className="py-ds-6 text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-ds-3" />
              <h3 className="text-ds-subheading">Could not load the job queue</h3>
              <p className="text-muted-foreground">
                This is not an all-clear. The queue may be full of stuck jobs we cannot see.
              </p>
              <p className="text-xs text-muted-foreground mt-2">{failure.detail}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={fetchStuckJobs}>
                <RefreshCw className="h-4 w-4 mr-1" /> Try again
              </Button>
          </div>
        ) : stuckJobs.length === 0 ? (
          <div className="py-ds-6 text-center">
              {/* text-green-500 was a raw palette step with no dark-mode answer. The console
                  decides "good" once, and this is that token. */}
              <CheckCircle2 className="h-12 w-12 text-[var(--tone-good-ink)] mx-auto mb-ds-3" />
              <h3 className="text-ds-subheading">Nothing is stuck</h3>
              <p className="text-ds-body text-muted-foreground">
                The queue answered, and no job has been processing or queued for too long.
              </p>
          </div>
        ) : (
          <Panel title={`Stuck Jobs (${stuckJobs.length})`}
                 description="Jobs that have been processing or queued for too long">
              {/* Each job was a bordered tinted box inside the card - a row in a list, given
                  the same weight as the list itself. They are rows now, separated by a
                  hairline the way any list of the same thing is. */}
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                {stuckJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-ds-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="rounded-ds-xs bg-black/[0.05] px-1.5 py-0.5 text-xs dark:bg-white/[0.07]">{job.id.slice(0, 8)}...</code>
                        <Badge variant={job.status === 'processing' ? 'default' : 'secondary'}>{job.status}</Badge>
                        <Badge variant="outline">{job.job_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {/* The route does not return minutes_stuck; printing 0 would claim
                            the job just got stuck, so it is simply left out when absent. */}
                        Created: {new Date(job.created_at).toLocaleString()}
                        {typeof job.minutes_stuck === "number"
                          ? ` · Stuck for ${Math.round(job.minutes_stuck)} min`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
          </Panel>
        )}

        {/* The confirmation names the number and says what survives it, because "Cleanup"
            on its own does not tell you that a job which was only slow dies with the rest. */}
        <AlertDialog open={confirmCleanup} onOpenChange={(o: boolean) => !o && setConfirmCleanup(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Fail {stuckJobs.length} stuck job{stuckJobs.length === 1 ? "" : "s"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Every job listed here is marked failed. Any of them that was merely slow rather
                than stuck dies with the rest, and has to be queued again by hand. The post
                analytics those jobs were producing will be missing until they are re-run.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Leave them running</AlertDialogCancel>
              <AlertDialogAction onClick={cleanupJobs}>
                Fail {stuckJobs.length} job{stuckJobs.length === 1 ? "" : "s"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SuperadminLayout>
  )
}
