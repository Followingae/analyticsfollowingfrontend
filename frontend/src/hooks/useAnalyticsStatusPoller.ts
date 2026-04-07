"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { superadminApiService } from "@/services/superadminApi"

export interface AnalyticsStatus {
  status: "pending" | "queued" | "processing" | "completed" | "failed" | "skipped"
  progress: number
  progressMessage?: string
  error?: string
  completedAt?: string
}

export interface AnalyticsStatusMap {
  [influencerId: string]: AnalyticsStatus
}

const TERMINAL_STATUSES = new Set(["completed", "failed", "skipped"])
const POLL_INTERVAL_MS = 5000

export function useAnalyticsStatusPoller(
  influencerIds: string[],
  enabled: boolean = true
) {
  const [statusMap, setStatusMap] = useState<AnalyticsStatusMap>({})
  const [isPolling, setIsPolling] = useState(false)
  const [completedSinceMount, setCompletedSinceMount] = useState<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const previouslyActiveRef = useRef<Set<string>>(new Set())

  const hasActiveJobs = Object.values(statusMap).some(
    (s) => !TERMINAL_STATUSES.has(s.status)
  )

  const fetchStatuses = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return

    // Cancel any in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const response = await superadminApiService.getAnalyticsStatus(ids)
      if (!mountedRef.current) return

      if (response.success && response.data) {
        const rows: any[] = Array.isArray(response.data) ? response.data : response.data?.data || []
        const newMap: AnalyticsStatusMap = {}
        const newCompleted: string[] = []

        for (const row of rows) {
          const id = String(row.id)
          newMap[id] = {
            status: row.analytics_status || "pending",
            progress: row.analytics_progress || 0,
            progressMessage: row.analytics_progress_message || undefined,
            error: row.analytics_error || undefined,
            completedAt: row.analytics_completed_at || undefined,
          }

          // Track newly completed IDs
          if (
            TERMINAL_STATUSES.has(row.analytics_status) &&
            previouslyActiveRef.current.has(id)
          ) {
            newCompleted.push(id)
            previouslyActiveRef.current.delete(id)
          }

          if (!TERMINAL_STATUSES.has(row.analytics_status)) {
            previouslyActiveRef.current.add(id)
          }
        }

        setStatusMap((prev) => ({ ...prev, ...newMap }))
        if (newCompleted.length > 0) {
          setCompletedSinceMount((prev) => [...prev, ...newCompleted])
        }
      }
    } catch (error) {
      console.error('Analytics status poll failed (will retry):', error)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    // Clear interval on any change
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!enabled || influencerIds.length === 0) {
      setIsPolling(false)
      return
    }

    // Determine which IDs need polling
    const activeIds = influencerIds.filter((id) => {
      const s = statusMap[id]
      return !s || !TERMINAL_STATUSES.has(s.status)
    })

    if (activeIds.length === 0) {
      setIsPolling(false)
      return
    }

    setIsPolling(true)

    // Initial fetch
    fetchStatuses(activeIds)

    // Visibility-aware polling
    const poll = () => {
      if (document.hidden) return
      fetchStatuses(activeIds)
    }

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (!document.hidden && activeIds.length > 0) {
        fetchStatuses(activeIds)
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [enabled, influencerIds.join(","), hasActiveJobs, fetchStatuses])

  return { statusMap, isPolling, hasActiveJobs, completedSinceMount }
}
