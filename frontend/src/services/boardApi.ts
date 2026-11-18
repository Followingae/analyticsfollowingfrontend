/**
 * The team feedback board at /b/{slug}.
 *
 * No auth header on purpose: nobody logs in to this page, the unguessable slug in the path is
 * the whole authorisation, and the backend answers 404 to any other slug. Every call goes
 * straight to fetch, so this file never touches the authenticated client or its redirects.
 */
import { API_CONFIG } from '@/config/api'

export type LaneKey = 'talent' | 'account_manager' | 'business_dev'
export type CardStatus = 'open' | 'planned' | 'done'

export interface Lane {
  key: LaneKey
  label: string
}

export interface Card {
  id: string
  lane: LaneKey
  author: string
  title: string
  body: string | null
  status: CardStatus
  created_at: string | null
  updated_at: string | null
}

export interface Board {
  authors: string[]
  lanes: Lane[]
  cards: Card[]
}

export class BoardError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const base = (slug: string) => `${API_CONFIG.BASE_URL}/api/v1/board/${encodeURIComponent(slug)}`

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      if (typeof data?.detail === 'string') detail = data.detail
    } catch {
      /* no body */
    }
    throw new BoardError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const boardApi = {
  read: (slug: string) => call<Board>(base(slug)),

  create: (slug: string, input: { lane: LaneKey; author: string; title: string; body?: string | null }) =>
    call<Card>(`${base(slug)}/cards`, { method: 'POST', body: JSON.stringify(input) }),

  patch: (slug: string, id: string, input: { status?: CardStatus; title?: string; body?: string | null }) =>
    call<Card>(`${base(slug)}/cards/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),

  remove: (slug: string, id: string) =>
    call<void>(`${base(slug)}/cards/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
