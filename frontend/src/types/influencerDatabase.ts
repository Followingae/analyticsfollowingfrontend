/**
 * Influencer Master Database — Type Definitions
 * Internal CRM module for managing influencer cost/sell pricing and access sharing.
 * Field names match the backend (app/models/influencer_database.py + DB schema).
 */

// ─── Category & Status Enums ──────────────────────────────────────────

export type InfluencerCategory =
  | 'fashion'
  | 'beauty'
  | 'lifestyle'
  | 'food'
  | 'travel'
  | 'fitness'
  | 'tech'
  | 'gaming'
  | 'business'
  | 'entertainment'
  | 'education'
  | 'automotive'
  | 'luxury'
  | 'family'
  | 'other'

export type InfluencerStatus = 'active' | 'inactive' | 'blacklisted' | 'pending'

export type PricingTier = 'standard' | 'premium' | 'exclusive'

export type ShareDuration = '7d' | '30d' | '90d' | '180d' | '365d' | 'indefinite'

export type AccessLevel = 'view' | 'full'

export type ExportFormat = 'csv' | 'json'

// ─── Cost Pricing (what we pay the influencer — INTERNAL) ──────────────

export interface CostPricing {
  cost_post_aed_cents: number | null
  cost_story_aed_cents: number | null
  cost_reel_aed_cents: number | null
  cost_carousel_aed_cents: number | null
  cost_video_aed_cents: number | null
  cost_bundle_aed_cents: number | null
  cost_monthly_aed_cents: number | null
}

// ─── Sell Pricing (what we charge brands — shown to clients) ───────────

export interface SellPricing {
  sell_post_aed_cents: number | null
  sell_story_aed_cents: number | null
  sell_reel_aed_cents: number | null
  sell_carousel_aed_cents: number | null
  sell_video_aed_cents: number | null
  sell_bundle_aed_cents: number | null
  sell_monthly_aed_cents: number | null
}

// ─── Master Influencer (unified type) ─────────────────────────────────

export interface MasterInfluencer {
  // Identity
  id: string
  username: string
  full_name: string | null
  biography: string | null
  profile_image_url: string | null
  is_verified: boolean
  is_private: boolean

  // Counts
  followers_count: number
  following_count: number
  posts_count: number

  // Analytics
  engagement_rate: number | null
  avg_likes: number
  avg_comments: number
  avg_views: number

  // Pricing (flat fields from backend)
  cost_post_aed_cents: number | null
  cost_story_aed_cents: number | null
  cost_reel_aed_cents: number | null
  cost_carousel_aed_cents: number | null
  cost_video_aed_cents: number | null
  cost_bundle_aed_cents: number | null
  cost_monthly_aed_cents: number | null

  sell_post_aed_cents: number | null
  sell_story_aed_cents: number | null
  sell_reel_aed_cents: number | null
  sell_carousel_aed_cents: number | null
  sell_video_aed_cents: number | null
  sell_bundle_aed_cents: number | null
  sell_monthly_aed_cents: number | null

  // Auto pricing settings
  auto_calculate_sell: boolean
  default_markup_percentage: number | null

  // JSON fields
  package_pricing: Record<string, any> | null
  volume_discounts: Array<Record<string, any>> | null
  platforms: Record<string, any> | null
  language_distribution: Record<string, number> | null

  // AI Analysis
  ai_content_categories: string[]
  ai_sentiment_score: number | null
  ai_audience_quality_score: number | null

  // Metadata
  tags: string[]
  categories: string[]
  internal_notes: string | null
  status: InfluencerStatus
  tier: string | null
  added_by: string | null
  last_analytics_refresh: string | null

  created_at: string
  updated_at: string
}

// ─── Deliverable definitions (for pricing UI) ────────────────────────

export interface DeliverableField {
  label: string
  costKey: keyof CostPricing
  sellKey: keyof SellPricing
}

export const DELIVERABLES: DeliverableField[] = [
  { label: 'IG Post', costKey: 'cost_post_aed_cents', sellKey: 'sell_post_aed_cents' },
  { label: 'IG Story', costKey: 'cost_story_aed_cents', sellKey: 'sell_story_aed_cents' },
  { label: 'IG Reel', costKey: 'cost_reel_aed_cents', sellKey: 'sell_reel_aed_cents' },
  { label: 'IG Carousel', costKey: 'cost_carousel_aed_cents', sellKey: 'sell_carousel_aed_cents' },
  { label: 'Video', costKey: 'cost_video_aed_cents', sellKey: 'sell_video_aed_cents' },
  { label: 'Bundle', costKey: 'cost_bundle_aed_cents', sellKey: 'sell_bundle_aed_cents' },
  { label: 'Monthly', costKey: 'cost_monthly_aed_cents', sellKey: 'sell_monthly_aed_cents' },
]

// ─── Table Column Definitions ─────────────────────────────────────────

export type ColumnKey =
  | 'select'
  | 'profile'
  | 'followers'
  | 'engagement'
  | 'categories'
  | 'tier'
  | 'ig_post_cost'
  | 'ig_post_sell'
  | 'ig_reel_cost'
  | 'ig_reel_sell'
  | 'ig_story_cost'
  | 'video_cost'
  | 'video_sell'
  | 'margin'
  | 'status'
  | 'verified'
  | 'added'
  | 'last_refresh'
  | 'analytics_status'
  | 'actions'

export interface ColumnDefinition {
  key: ColumnKey
  label: string
  defaultVisible: boolean
  sortable: boolean
  sortKey?: string
}

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { key: 'select', label: '', defaultVisible: true, sortable: false },
  { key: 'profile', label: 'Profile', defaultVisible: true, sortable: true, sortKey: 'username' },
  { key: 'followers', label: 'Followers', defaultVisible: true, sortable: true, sortKey: 'followers_count' },
  { key: 'engagement', label: 'Engagement', defaultVisible: true, sortable: true, sortKey: 'engagement_rate' },
  { key: 'categories', label: 'Categories', defaultVisible: true, sortable: false },
  { key: 'tier', label: 'Tier', defaultVisible: true, sortable: true, sortKey: 'tier' },
  { key: 'ig_post_cost', label: 'Post Cost', defaultVisible: true, sortable: false },
  { key: 'ig_post_sell', label: 'Post Sell', defaultVisible: true, sortable: false },
  { key: 'ig_reel_cost', label: 'Reel Cost', defaultVisible: false, sortable: false },
  { key: 'ig_reel_sell', label: 'Reel Sell', defaultVisible: false, sortable: false },
  { key: 'ig_story_cost', label: 'Story Cost', defaultVisible: false, sortable: false },
  { key: 'video_cost', label: 'Video Cost', defaultVisible: false, sortable: false },
  { key: 'video_sell', label: 'Video Sell', defaultVisible: false, sortable: false },
  { key: 'margin', label: 'Margin %', defaultVisible: false, sortable: false },
  { key: 'status', label: 'Status', defaultVisible: true, sortable: true, sortKey: 'status' },
  { key: 'verified', label: 'Verified', defaultVisible: false, sortable: false },
  { key: 'added', label: 'Added', defaultVisible: false, sortable: true, sortKey: 'created_at' },
  { key: 'last_refresh', label: 'Last Refresh', defaultVisible: false, sortable: false },
  { key: 'analytics_status', label: 'Analytics', defaultVisible: true, sortable: false },
  { key: 'actions', label: 'Actions', defaultVisible: true, sortable: false },
]

// ─── Filters ──────────────────────────────────────────────────────────

export interface InfluencerDatabaseFilters {
  search: string
  categories: InfluencerCategory[]
  tags: string[]
  pricing_tier: PricingTier[]
  status: InfluencerStatus[]
  followers_min: number | null
  followers_max: number | null
  engagement_min: number | null
  engagement_max: number | null
  is_verified: boolean | null
  has_pricing: boolean | null
  sort_by: string
  sort_order: 'asc' | 'desc'
  page: number
  page_size: number
}

export const DEFAULT_FILTERS: InfluencerDatabaseFilters = {
  search: '',
  categories: [],
  tags: [],
  pricing_tier: [],
  status: [],
  followers_min: null,
  followers_max: null,
  engagement_min: null,
  engagement_max: null,
  is_verified: null,
  has_pricing: null,
  sort_by: 'created_at',
  sort_order: 'desc',
  page: 1,
  page_size: 25,
}

// ─── Access Sharing ───────────────────────────────────────────────────

export interface SharedWithUser {
  user_id: string
  user_email: string
  user_name: string
  granted_at: string
  expires_at: string | null
  access_level: AccessLevel
}

export interface VisibleFields {
  show_analytics: boolean
  show_sell_pricing: boolean
  show_engagement: boolean
  show_audience: boolean
  show_content_analysis: boolean
  show_contact_info: boolean
}

export interface InfluencerAccessShare {
  id: string
  name: string
  description: string | null
  influencer_ids: string[]
  shared_with_users: SharedWithUser[]
  visible_fields: VisibleFields
  duration: string | null
  is_active: boolean
  created_by: string
  access_count: number
  last_accessed_at: string | null
  created_at: string
  expires_at: string | null
}

// ─── Export ───────────────────────────────────────────────────────────

export interface ExportParams {
  format: ExportFormat
  fields: {
    profile_info: boolean
    analytics: boolean
    cost_pricing: boolean
    sell_pricing: boolean
    margins: boolean
    ai_analysis: boolean
    internal_notes: boolean
    tags: boolean
  }
  scope: 'all' | 'filtered' | 'selected'
  selected_ids?: string[]
  filters?: Partial<InfluencerDatabaseFilters>
}

// ─── Bulk Operations ──────────────────────────────────────────────────

export interface BulkPricingUpdate {
  influencer_id: string
  cost_pricing?: Partial<CostPricing>
  sell_pricing?: Partial<SellPricing>
}

export interface BulkTagOperation {
  influencer_ids: string[]
  tags: string[]
  action: 'add' | 'remove'
}

// ─── API Response Types ───────────────────────────────────────────────

export interface InfluencerDatabaseResponse {
  influencers: MasterInfluencer[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

export interface BulkImportResult {
  added: Array<{ username: string; id: string }>
  skipped: Array<{ username: string; reason: string }>
  failed: Array<{ username: string; reason: string }>
}

export interface ExcelImportResult {
  imported: number
  updated: number
  analytics_queued: number
  analytics_skipped: number
  analytics_failures: Array<{ username: string; reason: string }>
  errors: Array<{ row: number; error: string }>
  total_processed: number
  imported_ids: string[]
  imported_usernames: string[]
  queue_status: { depth: number; max_depth: number; utilization_percent: number }
}

// ─── View State ───────────────────────────────────────────────────────

export type ViewMode = 'table' | 'card'

// ─── Helper Constants ─────────────────────────────────────────────────

export const CATEGORY_OPTIONS: { label: string; value: InfluencerCategory }[] = [
  { label: 'Fashion', value: 'fashion' },
  { label: 'Beauty', value: 'beauty' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Food', value: 'food' },
  { label: 'Travel', value: 'travel' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Tech', value: 'tech' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Business', value: 'business' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Education', value: 'education' },
  { label: 'Automotive', value: 'automotive' },
  { label: 'Luxury', value: 'luxury' },
  { label: 'Family', value: 'family' },
  { label: 'Other', value: 'other' },
]

export const STATUS_OPTIONS: { label: string; value: InfluencerStatus; color: string }[] = [
  { label: 'Active', value: 'active', color: 'text-green-600' },
  { label: 'Inactive', value: 'inactive', color: 'text-gray-500' },
  { label: 'Blacklisted', value: 'blacklisted', color: 'text-red-600' },
  { label: 'Pending', value: 'pending', color: 'text-yellow-600' },
]

export const TIER_OPTIONS: { label: string; value: PricingTier; color: string }[] = [
  { label: 'Standard', value: 'standard', color: 'bg-gray-100 text-gray-700' },
  { label: 'Premium', value: 'premium', color: 'bg-purple-100 text-purple-700' },
  { label: 'Exclusive', value: 'exclusive', color: 'bg-amber-100 text-amber-700' },
]

export const DURATION_OPTIONS: { label: string; value: ShareDuration }[] = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '6 Months', value: '180d' },
  { label: '1 Year', value: '365d' },
  { label: 'Indefinite', value: 'indefinite' },
]

// ─── Utility Functions ────────────────────────────────────────────────

/** Format AED cents (fils) to dirham string */
export function formatCents(cents: number | null): string {
  if (cents === null || cents === undefined) return '—'
  return `د.إ${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Parse currency string to cents (fils) */
export function parseToCents(dollarString: string): number | null {
  const num = parseFloat(dollarString.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return null
  return Math.round(num * 100)
}

/** Compute margin % between cost and sell */
export function computeMarginPercent(costCents: number | null, sellCents: number | null): number | null {
  if (!costCents || !sellCents || sellCents === 0) return null
  return ((sellCents - costCents) / sellCents) * 100
}

/** Format number with K/M suffix */
export function formatCount(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

/** Get engagement rate color class */
export function getEngagementColor(rate: number): string {
  if (rate >= 5) return 'text-green-600'
  if (rate >= 2) return 'text-yellow-600'
  return 'text-red-600'
}

/** Get default empty cost pricing */
export function getEmptyCostPricing(): CostPricing {
  return {
    cost_post_aed_cents: null,
    cost_story_aed_cents: null,
    cost_reel_aed_cents: null,
    cost_carousel_aed_cents: null,
    cost_video_aed_cents: null,
    cost_bundle_aed_cents: null,
    cost_monthly_aed_cents: null,
  }
}

/** Get default empty sell pricing */
export function getEmptySellPricing(): SellPricing {
  return {
    sell_post_aed_cents: null,
    sell_story_aed_cents: null,
    sell_reel_aed_cents: null,
    sell_carousel_aed_cents: null,
    sell_video_aed_cents: null,
    sell_bundle_aed_cents: null,
    sell_monthly_aed_cents: null,
  }
}

/** Extract cost pricing fields from a flat influencer record */
export function extractCostPricing(inf: MasterInfluencer): CostPricing {
  return {
    cost_post_aed_cents: inf.cost_post_aed_cents,
    cost_story_aed_cents: inf.cost_story_aed_cents,
    cost_reel_aed_cents: inf.cost_reel_aed_cents,
    cost_carousel_aed_cents: inf.cost_carousel_aed_cents,
    cost_video_aed_cents: inf.cost_video_aed_cents,
    cost_bundle_aed_cents: inf.cost_bundle_aed_cents,
    cost_monthly_aed_cents: inf.cost_monthly_aed_cents,
  }
}

/** Extract sell pricing fields from a flat influencer record */
export function extractSellPricing(inf: MasterInfluencer): SellPricing {
  return {
    sell_post_aed_cents: inf.sell_post_aed_cents,
    sell_story_aed_cents: inf.sell_story_aed_cents,
    sell_reel_aed_cents: inf.sell_reel_aed_cents,
    sell_carousel_aed_cents: inf.sell_carousel_aed_cents,
    sell_video_aed_cents: inf.sell_video_aed_cents,
    sell_bundle_aed_cents: inf.sell_bundle_aed_cents,
    sell_monthly_aed_cents: inf.sell_monthly_aed_cents,
  }
}
