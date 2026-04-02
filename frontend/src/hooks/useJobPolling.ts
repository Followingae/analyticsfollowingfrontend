/**
 * useJobPolling - Shared hook for polling async 202 job responses
 *
 * When backend returns 202 + job_id, this hook polls /api/v1/jobs/{job_id}/status
 * until the job completes or fails, then fetches the final result from
 * /api/v1/jobs/{job_id}/result.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

export interface JobStatus {
  job_id: string
  job_type?: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying' | 'cancelled'
  progress_percent: number
  progress_message: string | null
  created_at?: string
  started_at?: string
  completed_at?: string
  queue_position?: number
  estimated_remaining_seconds?: number
  elapsed_seconds?: number
  estimated_start_seconds?: number
  result?: any
  error_details?: any
  retry_count?: number
}

export interface JobAcceptedResponse {
  success: boolean
  job_id: string
  status: string
  message: string
  queue_position: number
  estimated_completion_seconds: number
  polling_url: string
  websocket_url?: string
  timestamp: string
}

export interface UseJobPollingOptions {
  /** Polling interval in ms (default: 3000) */
  pollInterval?: number
  /** Max poll attempts before timeout (default: 120 = 6 minutes at 3s) */
  maxAttempts?: number
  /** Callback on each progress update */
  onProgress?: (status: JobStatus) => void
  /** Callback when job completes */
  onComplete?: (result: any) => void
  /** Callback when job fails */
  onError?: (error: string, details?: any) => void
  /** Suppress Sonner toasts (default false) */
  silent?: boolean
}

export interface JobPollingState {
  isPolling: boolean
  jobId: string | null
  status: JobStatus | null
  result: any | null
  error: string | null
}

/**
 * Build a user-friendly toast message from a job result.
 */
function getCompletionToastMessage(result: any): string {
  // Creator search / profile analysis — result has profile.username
  const username = result?.profile?.username || result?.username
  if (username) {
    if (result?.unlocked) {
      return `Profile unlocked: @${username}`
    }
    return `Analytics ready for @${username}`
  }

  // Bulk operations — profiles_processed or successful_analyses count
  const bulkCount =
    result?.profiles_processed ||
    result?.successful_analyses ||
    result?.successful_unlocks
  if (bulkCount) {
    return `Bulk analysis complete: ${bulkCount} profiles`
  }

  // Post analytics — check for post_analytics or data.results
  if (result?.data?.results || result?.post_analytics) {
    return 'Post analysis complete'
  }

  return 'Background task completed'
}

/**
 * Emit a window event so React contexts (NotificationContext) can react
 * to job completion without being directly imported here.
 */
function emitJobCompleted(jobType: string | undefined, result: any): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('job-completed', {
        detail: { jobType, result },
      })
    )
  }
}

/**
 * Emit a window event on job failure/timeout so ProcessingToastContext
 * can remove the infinite "processing" toast and show an error.
 */
function emitJobFailed(jobType: string | undefined, error: string, details?: any): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('job-failed', {
        detail: {
          jobType,
          error,
          username: details?.username || details?.error_details?.username,
        },
      })
    )
  }
}

/**
 * React hook for polling job status
 */
export function useJobPolling(options: UseJobPollingOptions = {}) {
  const {
    pollInterval = 3000,
    maxAttempts = 120,
    onProgress,
    onComplete,
    onError,
    silent = false,
  } = options

  const [state, setState] = useState<JobPollingState>({
    isPolling: false,
    jobId: null,
    status: null,
    result: null,
    error: null,
  })

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const attemptRef = useRef(0)
  const abortRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
    abortRef.current = true
    setState(prev => ({ ...prev, isPolling: false }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
      abortRef.current = true
    }
  }, [])

  const startPolling = useCallback(async (jobId: string): Promise<any> => {
    abortRef.current = false
    attemptRef.current = 0

    setState({
      isPolling: true,
      jobId,
      status: null,
      result: null,
      error: null,
    })

    return new Promise((resolve, reject) => {
      const poll = async () => {
        if (abortRef.current) {
          reject(new Error('Polling cancelled'))
          return
        }

        attemptRef.current++

        if (attemptRef.current > maxAttempts) {
          const timeoutError = 'Job polling timed out. The operation may still be processing in the background.'
          setState(prev => ({ ...prev, isPolling: false, error: timeoutError }))
          if (!silent) {
            toast.error(timeoutError)
          }
          emitJobFailed(undefined, timeoutError)
          onError?.(timeoutError)
          reject(new Error(timeoutError))
          return
        }

        try {
          const statusUrl = `${API_CONFIG.BASE_URL}/api/v1/jobs/${jobId}/status`
          const response = await fetchWithAuth(statusUrl)
          const statusData: JobStatus = await response.json()

          setState(prev => ({ ...prev, status: statusData }))
          onProgress?.(statusData)

          if (statusData.status === 'completed') {
            // Fetch the full result
            try {
              const resultUrl = `${API_CONFIG.BASE_URL}/api/v1/jobs/${jobId}/result`
              const resultResponse = await fetchWithAuth(resultUrl)
              const resultData = await resultResponse.json()

              setState(prev => ({
                ...prev,
                isPolling: false,
                result: resultData,
              }))

              if (!silent) {
                toast.success(getCompletionToastMessage(resultData))
              }
              emitJobCompleted(statusData.job_type, resultData)

              onComplete?.(resultData)
              resolve(resultData)
            } catch (resultErr) {
              // If result fetch fails but status says completed, use status result
              if (statusData.result) {
                setState(prev => ({
                  ...prev,
                  isPolling: false,
                  result: statusData.result,
                }))

                if (!silent) {
                  toast.success(getCompletionToastMessage(statusData.result))
                }
                emitJobCompleted(statusData.job_type, statusData.result)

                onComplete?.(statusData.result)
                resolve(statusData.result)
              } else {
                const msg = 'Failed to fetch job result'
                setState(prev => ({ ...prev, isPolling: false, error: msg }))
                if (!silent) {
                  toast.error(msg)
                }
                onError?.(msg)
                reject(new Error(msg))
              }
            }
            return
          }

          if (statusData.status === 'failed' || statusData.status === 'cancelled') {
            const errorMsg = statusData.error_details?.error || `Job ${statusData.status}`
            setState(prev => ({
              ...prev,
              isPolling: false,
              error: errorMsg,
            }))
            if (!silent) {
              toast.error(`Processing failed: ${errorMsg}`)
            }
            emitJobFailed(statusData.job_type, errorMsg, statusData)
            onError?.(errorMsg, statusData.error_details)
            reject(new Error(errorMsg))
            return
          }

          // Still processing - schedule next poll
          if (pollingRef.current) clearTimeout(pollingRef.current)
          pollingRef.current = setTimeout(poll, pollInterval)
        } catch (fetchErr) {
          // Network error during poll - retry unless too many failures
          if (pollingRef.current) clearTimeout(pollingRef.current)
          if (attemptRef.current > 3) {
            // After 3 consecutive network errors, keep trying but with backoff
            pollingRef.current = setTimeout(poll, pollInterval * 2)
          } else {
            pollingRef.current = setTimeout(poll, pollInterval)
          }
        }
      }

      // Start first poll
      poll()
    })
  }, [maxAttempts, pollInterval, onProgress, onComplete, onError, silent])

  return {
    ...state,
    startPolling,
    stopPolling,
  }
}

/**
 * Standalone async function for polling a job to completion.
 * Use this in service layers (non-React contexts).
 */
export async function pollJobToCompletion(
  jobId: string,
  options: {
    pollInterval?: number
    maxAttempts?: number
    onProgress?: (status: JobStatus) => void
    /** Suppress Sonner toasts (default false) */
    silent?: boolean
  } = {}
): Promise<any> {
  const { pollInterval = 3000, maxAttempts = 120, onProgress, silent = false } = options
  let attempts = 0
  let lastJobType: string | undefined

  while (attempts < maxAttempts) {
    attempts++

    try {
      const statusUrl = `${API_CONFIG.BASE_URL}/api/v1/jobs/${jobId}/status`
      const response = await fetchWithAuth(statusUrl)
      const statusData: JobStatus = await response.json()

      if (statusData.job_type) lastJobType = statusData.job_type
      onProgress?.(statusData)

      if (statusData.status === 'completed') {
        const resultUrl = `${API_CONFIG.BASE_URL}/api/v1/jobs/${jobId}/result`
        const resultResponse = await fetchWithAuth(resultUrl)
        const resultData = await resultResponse.json()

        if (!silent) {
          toast.success(getCompletionToastMessage(resultData))
        }
        emitJobCompleted(lastJobType, resultData)

        return resultData
      }

      if (statusData.status === 'failed' || statusData.status === 'cancelled') {
        const errorMsg = statusData.error_details?.error || `Job ${statusData.status}`
        if (!silent) {
          toast.error(`Processing failed: ${errorMsg}`)
        }
        emitJobFailed(statusData.job_type, errorMsg, statusData)
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      if (err.message?.includes('Job failed') || err.message?.includes('Job cancelled') || err.message?.includes('Processing failed')) {
        throw err
      }
      // Network error - continue polling
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  emitJobFailed(lastJobType, 'Job polling timed out')
  throw new Error('Job polling timed out')
}

/**
 * Check if a fetch Response is a 202 async job acceptance.
 * Returns the parsed JobAcceptedResponse if yes, null if not.
 */
export function isAsyncJobResponse(response: Response): boolean {
  return response.status === 202
}

/**
 * Parse a 202 response body into a JobAcceptedResponse.
 */
export async function parseJobAcceptedResponse(response: Response): Promise<JobAcceptedResponse> {
  const data = await response.json()
  return data as JobAcceptedResponse
}
