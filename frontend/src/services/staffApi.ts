/**
 * Staff workspace API — self-service (scoped to the logged-in staff member)
 * + superadmin staff management.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = API_CONFIG.BASE_URL

async function jget(path: string) {
  const res = await fetchWithAuth(`${BASE}${path}`)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `API ${res.status}`)
  return res.json()
}
async function jpost(path: string, body: unknown) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `API ${res.status}`)
  return res.json()
}

export interface StaffMe { staff_role: string | null; full_access: boolean; modules: string[] | null }
export interface StaffTask { proposal_id: string; campaign_name?: string; title?: string; status: string; task_type: 'curate' | 'approve'; label: string; step_name?: string }
export interface StaffClient { team_id: string; name: string; logo_url?: string | null; campaigns: number }

export const staffApi = {
  me: () => jget('/api/v1/staff/me').then(r => r.data as StaffMe),
  myTasks: () => jget('/api/v1/staff/my-tasks').then(r => r.data as { tasks: StaffTask[]; count: number }),
  myClients: () => jget('/api/v1/staff/my-clients').then(r => r.data as StaffClient[]),
}

// ── Superadmin staff management ──────────────────────────────────────────
export interface StaffMember { id: string; email: string; full_name?: string; staff_role: string; admin_modules?: string[] | null; client_count: number }
export interface StaffDetail {
  id: string; email: string; full_name?: string; staff_role: string
  modules_override?: string[] | null; default_modules: string[]
  clients: { team_id: string; name: string }[]
}

export const staffAdminApi = {
  list: () => jget('/api/v1/admin/staff').then(r => r.data as StaffMember[]),
  get: (id: string) => jget(`/api/v1/admin/staff/${id}`).then(r => r.data as StaffDetail),
  setClients: (id: string, teamIds: string[]) => jpost(`/api/v1/admin/staff/${id}/clients`, { team_ids: teamIds }),
  setModules: (id: string, modules: string[] | null) => jpost(`/api/v1/admin/staff/${id}/modules`, { modules }),
}

export const ALL_MODULES = ['dashboard', 'operations', 'clients', 'users', 'campaigns', 'proposals', 'influencers', 'fa', 'system', 'billing'] as const
