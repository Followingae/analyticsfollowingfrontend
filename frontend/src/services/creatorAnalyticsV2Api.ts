"use client"

import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import type { CreatorAnalyticsV2 } from "@/types/creatorAnalyticsV2"

const BASE = `${API_CONFIG.BASE_URL}/api/v2/creator-analytics`

/** 404 means we have never analysed this creator — NOT that they have no
 *  engagement. Callers must distinguish the two; conflating them is how the old
 *  page ended up showing zeros as if they were measurements. */
export class NotAnalysedError extends Error {
  constructor(public username: string) {
    super(`No analytics for @${username} yet`)
    this.name = "NotAnalysedError"
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.detail || body?.message || fallback
  } catch {
    return fallback
  }
}

export const creatorAnalyticsV2Api = {
  /** Stored analytics. Throws NotAnalysedError on 404. */
  async get(username: string): Promise<CreatorAnalyticsV2> {
    const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(username)}`, {
      headers: getAuthHeaders(),
    })
    if (res.status === 404) throw new NotAnalysedError(username)
    if (!res.ok) throw new Error(await readError(res, "Failed to load analytics"))
    const body = await res.json()
    return body.data as CreatorAnalyticsV2
  },

  /** Run the pipeline now. Superadmin only — it spends Apify + LLM budget.
   *  Synchronous and slow (~1-2 min for 90 posts); show a real progress state. */
  async refresh(username: string, postLimit = 90): Promise<CreatorAnalyticsV2> {
    const res = await fetchWithAuth(
      `${BASE}/${encodeURIComponent(username)}/refresh?post_limit=${postLimit}`,
      { method: "POST", headers: getAuthHeaders() }
    )
    if (!res.ok) throw new Error(await readError(res, "Analysis failed"))
    const body = await res.json()
    return body.data as CreatorAnalyticsV2
  },
}
