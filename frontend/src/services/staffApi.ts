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

export type AccessLevel = 'view' | 'write' | 'full'
/** Module key -> level. `null` means unrestricted (superadmin, or a full-access founder). */
export type AccessMap = Record<string, AccessLevel>

export interface StaffMe {
  staff_role: string | null
  full_access: boolean
  /** The keys only. Kept because the sidebar and route guard still ask "can they open it". */
  modules: string[] | null
  /** The same grant with a level against each module. null = unrestricted. */
  access: AccessMap | null
}
export interface StaffTask {
  proposal_id?: string; campaign_name?: string; title?: string; status?: string;
  task_type: 'curate' | 'approve' | 'upload_content'; label: string; step_name?: string;
  // upload_content tasks (team-suggested FA creators needing content):
  campaign_id?: string; campaign_type?: string; creator_count?: number; updated_at?: string | null;
}
export interface StaffClient {
  team_id: string; name: string; logo_url?: string | null;
  campaigns: number; active_campaigns?: number; open_proposals?: number; last_activity?: string | null;
}

export interface StaffBrandCampaign { id: string; name: string; status: string; campaign_type?: string; updated_at?: string | null }
export interface StaffBrandProposal { id: string; name: string; status: string; updated_at?: string | null }
export interface StaffBrandDetail {
  brand: { team_id: string; name: string; logo_url?: string | null };
  campaigns: StaffBrandCampaign[];
  proposals: StaffBrandProposal[];
}

export const staffApi = {
  me: () => jget('/api/v1/staff/me').then(r => r.data as StaffMe),
  myTasks: () => jget('/api/v1/staff/my-tasks').then(r => r.data as { tasks: StaffTask[]; count: number }),
  myClients: () => jget('/api/v1/staff/my-clients').then(r => r.data as StaffClient[]),
  clientDetail: (teamId: string) => jget(`/api/v1/staff/clients/${teamId}`).then(r => r.data as StaffBrandDetail),
}

// ── Superadmin staff management ──────────────────────────────────────────
export interface StaffMember { id: string; email: string; full_name?: string; staff_role: string; admin_modules?: string[] | null; client_count: number }
export interface StaffDetail {
  id: string; email: string; full_name?: string; staff_role: string
  /** What a superadmin explicitly set, or null if nobody ever has. */
  access: AccessMap | null
  /** Which preset it came from, or 'custom' once hand-edited. */
  preset_key: string | null
  /** What this person's job title would give them. */
  role_preset: AccessMap
  /** What they can ACTUALLY do, once inheritance is applied. The honest answer. */
  effective: AccessMap
  modules_override?: string[] | null; default_modules: string[]
  clients: { team_id: string; name: string }[]
}

/** The module catalogue, served rather than hard-coded so this screen cannot fall behind
 *  the console. The old screen offered ten checkboxes for twenty-six areas. */
export interface AccessModule {
  key: string; label: string; group: string; hint: string
  write_means: string; full_means: string | null
  can_delete: boolean; sensitive: boolean
  inherits_from: string | null; inherit_ceiling: AccessLevel | null
  open_by_default: AccessLevel | null
}
export interface AccessPreset { key: string; label: string; hint: string; access: AccessMap }
export interface AccessCatalogue {
  modules: AccessModule[]
  presets: AccessPreset[]
  levels: { key: AccessLevel; label: string; hint: string }[]
  groups: string[]
}

export const staffAdminApi = {
  list: () => jget('/api/v1/admin/staff').then(r => r.data as StaffMember[]),
  get: (id: string) => jget(`/api/v1/admin/staff/${id}`).then(r => r.data as StaffDetail),
  setClients: (id: string, teamIds: string[]) => jpost(`/api/v1/admin/staff/${id}/clients`, { team_ids: teamIds }),
  setModules: (id: string, modules: string[] | null) => jpost(`/api/v1/admin/staff/${id}/modules`, { modules }),
  catalogue: () => jget('/api/v1/admin/access-catalogue').then(r => r.data as AccessCatalogue),
  setAccess: (id: string, access: AccessMap | null, preset?: string | null) =>
    jpost(`/api/v1/admin/staff/${id}/access`, { access, preset }),
}

/** Rank, so "at least write" is a comparison rather than a lookup. Mirrors
 *  app/core/console_modules.py; the server refuses regardless, this only stops us drawing a
 *  button that always 403s. */
const RANK: Record<string, number> = { view: 1, write: 2, full: 3 }
export function atLeast(level: AccessLevel | null | undefined, required: AccessLevel): boolean {
  return (RANK[level ?? ''] ?? 0) >= RANK[required]
}

export const ALL_MODULES = ['dashboard', 'operations', 'clients', 'users', 'campaigns', 'proposals', 'influencers', 'fa', 'system', 'billing'] as const
