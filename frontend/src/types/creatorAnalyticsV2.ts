/**
 * Creator Analytics v2 — the rebuilt pipeline's payload.
 * Mirrors app/services/creator_analytics/derive.py + content_analysis.py.
 *
 * THE RULE: every block carries its own `source`. A block whose source is
 * 'unavailable' has NO data and must NOT be rendered — no placeholder card, no
 * dash, no "connect for more". If every block in a tab is unavailable, the tab
 * doesn't exist. The old page filled those gaps with fabricated numbers; we
 * neither invent data nor decorate the hole.
 */

export type Provenance = 'measured' | 'inferred' | 'unavailable'

/** Narrowing helper: `if (isPresent(a.engagement))` gives you the real block. */
export function isPresent<T extends { source: Provenance }>(
  block: T | null | undefined
): block is Exclude<T, { source: 'unavailable' }> {
  return !!block && block.source !== 'unavailable'
}

interface Unavailable {
  source: 'unavailable'
  reason?: string
}

// ─── Profile ──────────────────────────────────────────────────────────

export interface RelatedProfile {
  username: string
  full_name: string | null
  is_verified: boolean | null
}

export interface ProfileBlock {
  source: 'measured'
  username: string
  /** Stable numeric IG id. Usernames change; this doesn't. */
  instagram_id: string | null
  full_name: string | null
  biography: string | null
  followers_count: number | null
  /** Real now. The old pipeline stored 0 for every creator. */
  following_count: number | null
  posts_count: number | null
  is_verified: boolean | null
  is_private: boolean | null
  is_business: boolean | null
  business_category: string | null
  profile_pic_url: string | null
  external_urls: string[]
  related_profiles: RelatedProfile[]
}

// ─── Engagement ───────────────────────────────────────────────────────

export interface EngagementByType {
  /** Null when this content type has no posts with a usable denominator. */
  engagement_rate: number | null
  engagement_rate_by_view: number | null
  sample_size: number
}

/** Which denominator actually describes this creator. Chosen by the backend from
 *  measured reach — never guessed here. */
export type HeadlineMetric = 'engagement_rate' | 'engagement_rate_by_view'

export interface EngagementBlock {
  source: 'measured'
  sample_size: number
  /** MEDIAN of (likes + comments) / FOLLOWERS. Only meaningful when reach is roughly
   *  the follower base — see `headline_metric`. Null if no post had a usable value. */
  engagement_rate: number | null
  /** Shown for contrast only. Never the headline. */
  engagement_rate_mean: number | null
  /** MEDIAN of (likes + comments) / VIEWS — the share of people who actually SAW the
   *  post and engaged. Stays meaningful however far the post travels. */
  engagement_rate_by_view: number | null
  view_sample_size: number
  /** Median views / followers. >1 means the typical post reaches beyond the follower
   *  base, which is normal for reels and makes the follower rate meaningless. */
  reach_ratio: number | null
  reach_exceeds_followers: boolean
  /** The field to LEAD WITH. Read this rather than defaulting to `engagement_rate`:
   *  on reel-led accounts the follower rate is arithmetically true and absurd
   *  (@_ssaeeedd: 248 followers, 16,841 median views -> 98.79% of followers vs 1.45%
   *  of viewers). The backend picks from measured reach; the UI just obeys. */
  headline_metric: HeadlineMetric
  /** reel / carousel / video / image — reels routinely out-engage stills ~1.7x,
   *  which a blended rate hides entirely. */
  by_content_type: Record<string, EngagementByType>
}

/** The engagement figure to display, with the reason for its denominator.
 *  Single source of truth for every render site. */
export function headlineEngagement(e: EngagementBlock): {
  value: number | null
  byView: boolean
} {
  const byView = e.headline_metric === 'engagement_rate_by_view'
  return { value: byView ? e.engagement_rate_by_view : e.engagement_rate, byView }
}

export interface PostBrief {
  url: string | null
  shortcode: string | null
  type: string
  likes: number | null
  comments: number | null
  views: number | null
  engagement_rate: number
  timestamp: string | null
}

export interface PerformanceBlock {
  source: 'measured'
  /** Which ratio best_post/worst_post were ranked and reported by — always the same
   *  one the Engagement card headlines, so "best post" can't quote a denominator the
   *  rest of the page isn't using. */
  ranked_by: HeadlineMetric
  median_likes: number | null
  median_comments: number | null
  median_views: number | null
  mean_likes: number | null
  mean_comments: number | null
  posts_with_views: number
  best_post: PostBrief | null
  worst_post: PostBrief | null
}

// ─── Format ───────────────────────────────────────────────────────────

export interface ContentMixBlock {
  source: 'measured'
  sample_size: number
  distribution: Record<string, number>
  counts: Record<string, number>
  primary_format: string
}

export interface FormatDetailBlock {
  source: 'measured'
  median_video_seconds: number | null
  videos_measured: number
  median_carousel_slides: number | null
  carousels_measured: number
  aspect_ratios: Record<string, number> | null
  audio: {
    posts_with_audio: number
    original_audio_share: number | null
    top_tracks: { track: string; count: number }[]
  } | null
}

export interface CadenceBlock {
  source: 'measured'
  sample_size: number
  first_post: string
  last_post: string
  span_days: number
  posts_per_week: number | null
  median_gap_days: number | null
  /** UTC — we don't know the creator's timezone, so don't imply local time. */
  most_active_hour_utc: number
  most_active_weekday: string
}

// ─── Hashtags, brands, locations ──────────────────────────────────────

export interface HashtagBlock {
  source: 'measured'
  unique_count: number
  posts_using_hashtags: number
  top: { tag: string; count: number }[]
  note?: string
}

/** collab = a formal Instagram Collab (the brand accepted co-authorship — strongest
 *  evidence of a deal). tagged = tagged in the image. mention = an @ in the caption. */
export type BrandConfidence = 'collab' | 'tagged' | 'mention'

export interface Brand {
  username: string
  name: string | null
  /** The brand's real IG avatar, free from the payload. Mirror to R2 before
   *  serving — raw IG URLs expire and hotlink-block. */
  avatar_url: string | null
  is_verified: boolean | null
  post_count: number
  signals: BrandConfidence[]
  confidence: BrandConfidence
}

export interface BrandsBlock {
  source: 'measured'
  brand_collab_detected: boolean
  collab_count: number
  brands: Brand[]
  tagged_by: { username: string; post_count: number }[]
  /** Always false — Instagram's paid-partnership label is not obtainable.
   *  Never present these as verified sponsorships. */
  paid_partnership_label_available: boolean
}

export interface LocationsBlock {
  source: 'measured'
  posts_with_location: number
  unique_locations: number
  /** The CREATOR's tagged venues — not audience geography. */
  top: { name: string; post_count: number; share: number; location_id: number | null }[]
}

// ─── Commenters ───────────────────────────────────────────────────────

/** Engagement quality from the accounts actually commenting. NOT the audience —
 *  commenters are a tiny self-selecting slice. Never label this "audience". */
export interface CommentersBlock {
  source: 'measured'
  comments_analysed: number
  unique_commenters: number
  repeat_commenter_share: number | null
  top_commenters: { username: string; comments: number }[]
  signals: {
    /** empty or emoji-only */
    low_effort_share: number
    numeric_username_share: number
    no_avatar_share: number
  }
}

// ─── Ads ──────────────────────────────────────────────────────────────

/** Caption heuristic on the creator's own words (#ad, sponsored, بالتعاون).
 *  NOT Instagram's disclosure label, which the scraper does not expose. */
export interface SelfDeclaredAdsBlock {
  source: 'measured'
  method: 'caption_heuristic'
  /** Denominator behind both rates below — the page's headline metric, so ads vs
   *  organic is like-for-like. Absent when no declared ads were found. */
  measured_by?: HeadlineMetric
  declared_ad_posts: number
  organic_posts?: number
  declared_ad_engagement_rate?: number | null
  organic_engagement_rate?: number | null
  note?: string
}

// ─── Content analysis (LLM) ───────────────────────────────────────────

export interface VisualBlock {
  source: 'inferred'
  method: 'instagram_alt_text'
  images_described: number
  subjects: string[]
  shot_style: string | null
  people_presence: string | null
}

export interface ContentAnalysisBlock {
  source: 'inferred'
  method: string
  sample: { captions: number; transcripts: number; images: number }
  categories: { category: string; share: number }[]
  category_distribution: Record<string, number>
  primary_category: string
  /** Includes 'arabizi' — Arabic in Latin script. No OSS detector has that label;
   *  the old pipeline called it English at 0.0 confidence. */
  languages: { language: string; share: number }[]
  language_distribution: Record<string, number>
  primary_language: string
  tone: string
  audience_register: string
  themes: string[]
  brand_affinity: string[]
  promotional_share: number | null
  visual: VisualBlock | Unavailable
  notes: string | null
  usage?: { input_tokens: number; output_tokens: number }
}

// ─── Envelope ─────────────────────────────────────────────────────────

export interface AnalyticsMeta {
  pipeline_version: string
  /** 'partial' means some sources failed — source_errors says which. Not smoothed over. */
  status: 'complete' | 'partial' | 'failed'
  source_errors: Record<string, string>
  collected_at: string | null
  updated_at: string | null
}

export interface Provenance_ {
  collected_at: string | null
  sources: Record<string, { actor: string; ok: boolean; count: number; error: string | null }>
  post_count: number
  reel_count: number
  mention_count: number
  partial: boolean
}

export interface CreatorAnalyticsV2 {
  profile: ProfileBlock
  engagement: EngagementBlock | Unavailable
  performance: PerformanceBlock | Unavailable
  content_mix: ContentMixBlock | Unavailable
  format_detail: FormatDetailBlock | Unavailable
  cadence: CadenceBlock | Unavailable
  hashtags: HashtagBlock | Unavailable
  brands: BrandsBlock | Unavailable
  locations: LocationsBlock | Unavailable
  commenters: CommentersBlock | Unavailable
  self_declared_ads: SelfDeclaredAdsBlock | Unavailable
  content_analysis: ContentAnalysisBlock | Unavailable
  /** Withheld unless first-party (creator OAuth'd and Meta returned
   *  follower_demographics). Follower sampling was dropped. */
  audience: Unavailable | Record<string, unknown>
  _provenance: Provenance_
  _meta?: AnalyticsMeta
}

// ─── Display helpers ──────────────────────────────────────────────────

export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  arabizi: 'Arabizi',
  hi: 'Hindi',
  ur: 'Urdu',
  tl: 'Tagalog',
  ru: 'Russian',
  fr: 'French',
  es: 'Spanish',
  fa: 'Persian',
  tr: 'Turkish',
  other: 'Other',
}

export const BRAND_CONFIDENCE_LABELS: Record<BrandConfidence, string> = {
  collab: 'Collab',
  tagged: 'Tagged',
  mention: 'Mentioned',
}

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  reel: 'Reels',
  carousel: 'Carousels',
  video: 'Videos',
  image: 'Photos',
}

export function formatPct(v: number | null | undefined, digits = 2): string {
  return v == null ? '—' : `${v.toFixed(digits)}%`
}

export function formatCount(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
