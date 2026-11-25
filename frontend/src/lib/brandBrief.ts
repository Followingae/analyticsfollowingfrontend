/**
 * The brand campaign brief: one set structure every brief follows.
 *
 * The backend's single definition is app/services/brand_briefs/schema.py. The two must say
 * the same thing; `briefGaps` here mirrors `gaps` there, so what the brand sees as missing
 * is exactly what the team is told is missing.
 */
import type { LucideIcon } from 'lucide-react'
import {
  Megaphone, Rocket, Store, ShoppingBag, Smartphone, Camera, PartyPopper, Heart,
  Eye, Play, MousePointerClick, ShoppingCart, Footprints, UserPlus, Images,
  Clapperboard, CircleDashed, Image as ImageIcon, GalleryHorizontal, Radio, Video, Zap,
  Brush, Car, UtensilsCrossed, PackageOpen, Star, Clock, ListOrdered, MessageCircle, ArrowLeftRight,
  TrendingUp, BookOpen, Users, MapPin, Gem, Crown, Sun, Circle, GraduationCap, Feather, Flame,
  Home, Trees, Camera as CameraIcon, Shuffle, Shirt, Coffee, Dumbbell, Baby, Plane, Gamepad2, Sofa,
  HeartPulse, Sparkles,
} from 'lucide-react'

export type Platform = 'instagram' | 'tiktok' | 'snapchat' | 'youtube'

export interface Deliverable { platform: Platform; format: string; quantity: number }
export interface BarterItem { name: string; value_aed?: number | null; description?: string }
export interface Location { name?: string; address?: string; map_url?: string }

export interface BriefAnswers {
  contact?: { name?: string; role?: string; email?: string; phone?: string }
  campaign?: { name?: string; product?: string; objectives?: string[]; background?: string; key_messages?: string }
  audience?: { markets?: string[]; cities?: string; age_ranges?: string[]; genders?: string[]; languages?: string[]; notes?: string }
  creators?: {
    tiers?: string[]; categories?: string[]; count?: number | null; creator_gender?: string
    creator_languages?: string[]; liked_handles?: string[]; avoid_handles?: string[]
    avoid_brands?: string[]; exclusivity_days?: number | null; notes?: string
  }
  platforms?: Platform[]
  deliverables?: Deliverable[]
  tagging?: {
    accounts?: string[]; hashtags?: string[]; promo_code?: string; link?: string
    collab_post?: boolean; link_sticker?: boolean; notes?: string
  }
  visit?: {
    needed?: boolean | null; locations?: Location[]; details?: string; booking?: string
    when?: string; guests?: number | null
  }
  compensation?: {
    mode?: 'paid' | 'barter' | 'both'; budget_aed?: number | null; budget_kind?: 'campaign' | 'monthly'
    budget_notes?: string; barter_items?: BarterItem[]; fulfilment_mode?: 'delivery' | 'dine_in' | 'pickup'
  }
  usage?: { rights?: 'organic' | 'paid_ads' | 'full_buyout'; days?: number | null; raw_footage?: boolean }
  content?: {
    styles?: string[]; shoot_locations?: string[]; shoot_notes?: string
    dos?: string; donts?: string; tones?: string[]; references?: string[]
    approval_required?: boolean; guidelines_link?: string; notes?: string
  }
  timeline?: { proposal_by?: string; live_from?: string; live_to?: string; dates_firm?: boolean; key_dates?: string }
  success?: { kpis?: string[]; reporting?: string; anything_else?: string }
}

export interface Composed {
  title: string
  summary: string
  sections: { title: string; points: string[] }[]
  open_questions: string[]
}

export interface Gap { step: StepKey; key: string; label: string }

export type StepKey =
  | 'contact' | 'campaign' | 'audience' | 'creators' | 'content' | 'visit'
  | 'budget' | 'creative' | 'timeline'

export const STEPS: { key: StepKey; title: string; short: string; hint: string }[] = [
  /* No contact step: a brief goes to a brand account we already know (founder, 25 Nov 2026). */
  { key: 'campaign', title: 'The campaign', short: 'Campaign', hint: 'Rough notes are fine.' },
  { key: 'audience', title: 'Who to reach', short: 'Audience', hint: 'Your audience, not the creators.' },
  { key: 'creators', title: 'Which creators', short: 'Creators', hint: 'Not sure? Leave it to us.' },
  { key: 'content', title: 'Platforms and posts', short: 'Content', hint: 'Instagram is standard.' },
  { key: 'visit', title: 'Visit', short: 'Visit', hint: 'Do creators come to you?' },
  { key: 'budget', title: 'Budget', short: 'Budget', hint: 'Paid, barter or both.' },
  { key: 'creative', title: 'Creative', short: 'Creative', hint: 'What to show, what to avoid.' },
  { key: 'timeline', title: 'Timing', short: 'Timing', hint: 'When it goes live.' },
]

export const OBJECTIVES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'awareness', label: 'Awareness', icon: Megaphone },
  { key: 'launch', label: 'Launch', icon: Rocket },
  { key: 'footfall', label: 'Footfall', icon: Store },
  { key: 'sales', label: 'Sales', icon: ShoppingBag },
  { key: 'app_installs', label: 'App installs', icon: Smartphone },
  { key: 'content', label: 'Content', icon: Camera },
  { key: 'event', label: 'Event', icon: PartyPopper },
  { key: 'engagement', label: 'Engagement', icon: Heart },
]

export const MARKETS = ['UAE', 'KSA', 'Qatar', 'Kuwait', 'Bahrain', 'Oman']
export const AGES = ['13-17', '18-24', '25-34', '35-44', '45+']
export const GENDERS = [{ key: 'women', label: 'Women' }, { key: 'men', label: 'Men' }]
export const LANGUAGES = ['English', 'Arabic']
export const CATEGORIES = ['Food', 'Beauty', 'Fashion', 'Lifestyle', 'Fitness', 'Family',
  'Tech', 'Travel', 'Auto', 'Gaming', 'Home', 'Health']
type Opt = { key: string; label: string; icon: LucideIcon }

/** How the content is made. The formats creators actually pitch, in their words. */
export const STYLES: Opt[] = [
  { key: 'GRWM', label: 'GRWM', icon: Brush },
  { key: 'Car mukbang', label: 'Car mukbang', icon: Car },
  { key: 'Mukbang / taste test', label: 'Taste test', icon: UtensilsCrossed },
  { key: 'Unboxing', label: 'Unboxing', icon: PackageOpen },
  { key: 'Honest review', label: 'Review', icon: Star },
  { key: 'Day in my life', label: 'Day in my life', icon: Clock },
  { key: 'Tutorial / how to', label: 'Tutorial', icon: ListOrdered },
  { key: 'Vlog', label: 'Vlog', icon: Video },
  { key: 'Talking to camera', label: 'Talking to camera', icon: MessageCircle },
  { key: 'Before and after', label: 'Before and after', icon: ArrowLeftRight },
  { key: 'Haul', label: 'Haul', icon: ShoppingBag },
  { key: 'Trend / challenge', label: 'Trend', icon: TrendingUp },
  { key: 'Behind the scenes', label: 'Behind the scenes', icon: Clapperboard },
  { key: 'Storytelling', label: 'Storytelling', icon: BookOpen },
  { key: 'Couple / family', label: 'Couple or family', icon: Users },
  { key: 'Experience / visit', label: 'Experience', icon: MapPin },
]

export const TONE_OPTS: Opt[] = [
  { key: 'Luxury', label: 'Luxury', icon: Gem },
  { key: 'Premium', label: 'Premium', icon: Crown },
  { key: 'Fun', label: 'Fun', icon: PartyPopper },
  { key: 'Warm', label: 'Warm', icon: Sun },
  { key: 'Bold', label: 'Bold', icon: Zap },
  { key: 'Minimal', label: 'Minimal', icon: Circle },
  { key: 'Elegant', label: 'Elegant', icon: Feather },
  { key: 'Edgy', label: 'Edgy', icon: Flame },
  { key: 'Family', label: 'Family', icon: Users },
  { key: 'Educational', label: 'Educational', icon: GraduationCap },
]

export const SHOOT: Opt[] = [
  { key: 'At our venue', label: 'At our venue', icon: Store },
  { key: 'At home', label: 'At home', icon: Home },
  { key: 'In the car', label: 'In the car', icon: Car },
  { key: 'Outdoors', label: 'Outdoors', icon: Trees },
  { key: 'Studio', label: 'Studio', icon: CameraIcon },
  { key: "Creator's choice", label: "Creator's choice", icon: Shuffle },
]

export const CATEGORY_OPTS: Opt[] = [
  { key: 'Food', label: 'Food', icon: UtensilsCrossed },
  { key: 'Beauty', label: 'Beauty', icon: Sparkles },
  { key: 'Fashion', label: 'Fashion', icon: Shirt },
  { key: 'Lifestyle', label: 'Lifestyle', icon: Coffee },
  { key: 'Fitness', label: 'Fitness', icon: Dumbbell },
  { key: 'Family', label: 'Family', icon: Baby },
  { key: 'Tech', label: 'Tech', icon: Smartphone },
  { key: 'Travel', label: 'Travel', icon: Plane },
  { key: 'Auto', label: 'Auto', icon: Car },
  { key: 'Gaming', label: 'Gaming', icon: Gamepad2 },
  { key: 'Home', label: 'Home', icon: Sofa },
  { key: 'Health', label: 'Health', icon: HeartPulse },
]

export const TONES = ['Fun', 'Premium', 'Warm', 'Educational', 'Bold', 'Minimal', 'Family', 'Luxury']

export const TIERS: { key: string; label: string; range: string; dots: number }[] = [
  { key: 'nano', label: 'Nano', range: '1k to 10k', dots: 1 },
  { key: 'micro', label: 'Micro', range: '10k to 50k', dots: 2 },
  { key: 'mid', label: 'Mid', range: '50k to 250k', dots: 3 },
  { key: 'macro', label: 'Macro', range: '250k to 1M', dots: 4 },
  { key: 'mega', label: 'Mega', range: '1M and up', dots: 5 },
  { key: 'celebrity', label: 'Celebrity', range: 'Household names', dots: 6 },
]

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', snapchat: 'Snapchat', youtube: 'YouTube',
}
export const PLATFORM_ORDER: Platform[] = ['instagram', 'tiktok', 'snapchat', 'youtube']

export const FORMATS: Record<Platform, { key: string; label: string; icon: LucideIcon }[]> = {
  instagram: [
    { key: 'reel', label: 'Reel', icon: Clapperboard },
    { key: 'story', label: 'Story', icon: CircleDashed },
    { key: 'post', label: 'Post', icon: ImageIcon },
    { key: 'carousel', label: 'Carousel', icon: GalleryHorizontal },
    { key: 'live', label: 'Live', icon: Radio },
  ],
  tiktok: [
    { key: 'video', label: 'Video', icon: Video },
    { key: 'live', label: 'Live', icon: Radio },
  ],
  snapchat: [
    { key: 'story', label: 'Story', icon: CircleDashed },
    { key: 'spotlight', label: 'Spotlight', icon: Zap },
  ],
  youtube: [
    { key: 'short', label: 'Short', icon: Clapperboard },
    { key: 'video', label: 'Video', icon: Video },
  ],
}

export const KPIS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'reach', label: 'Reach', icon: Eye },
  { key: 'views', label: 'Views', icon: Play },
  { key: 'engagement', label: 'Engagement', icon: Heart },
  { key: 'clicks', label: 'Clicks', icon: MousePointerClick },
  { key: 'sales', label: 'Sales', icon: ShoppingCart },
  { key: 'footfall', label: 'Footfall', icon: Footprints },
  { key: 'followers', label: 'Followers', icon: UserPlus },
  { key: 'content', label: 'Content to reuse', icon: Images },
]

export const USAGE = [
  { key: 'organic', label: 'Organic only', sub: 'Lives on the creator’s page' },
  { key: 'paid_ads', label: 'Paid ads too', sub: 'You boost it or run it as ads' },
  { key: 'full_buyout', label: 'Full buyout', sub: 'Use it anywhere, any time' },
] as const

const filled = (v: unknown) =>
  v != null && (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : true)

/** What the brief still does not say. Mirrors `gaps` in schema.py. */
export function briefGaps(a: BriefAnswers): Gap[] {
  const out: Gap[] = []
  const need = (step: StepKey, key: string, label: string, ok: boolean) => { if (!ok) out.push({ step, key, label }) }
  need('campaign', 'campaign.name', 'Campaign name', filled(a.campaign?.name))
  need('campaign', 'campaign.product', 'What we are promoting', filled(a.campaign?.product))
  need('campaign', 'campaign.objectives', 'The goal of the campaign', filled(a.campaign?.objectives))
  need('audience', 'audience.markets', 'Which countries', filled(a.audience?.markets))
  need('creators', 'creators.categories', 'What kind of creators',
    filled(a.creators?.categories) || filled(a.creators?.tiers))
  need('content', 'deliverables', 'What each creator posts', filled(a.deliverables))
  need('content', 'tagging.accounts', 'Accounts to tag', filled(a.tagging?.accounts))
  need('visit', 'visit.needed', 'Whether creators visit you', a.visit?.needed != null)
  if (a.visit?.needed === true) need('visit', 'visit.locations', 'Where they visit', filled(a.visit?.locations?.filter(l => l.name || l.address)))
  const mode = a.compensation?.mode
  need('budget', 'compensation.mode', 'Paid, barter or both', filled(mode))
  if (mode === 'paid' || mode === 'both') need('budget', 'compensation.budget_aed', 'The budget', filled(a.compensation?.budget_aed))
  if (mode === 'barter' || mode === 'both') need('budget', 'compensation.barter_items', 'What creators receive',
    filled(a.compensation?.barter_items?.filter(i => i.name)))
  need('budget', 'usage.rights', 'How you will use the content', filled(a.usage?.rights))
  need('timeline', 'timeline.live_from', 'When content goes live', filled(a.timeline?.live_from) || filled(a.timeline?.live_to))
  return out
}

/** Set a value at a dotted path, returning a new object. */
export function setPath<T extends object>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.')
  const o = { ...(obj as Record<string, unknown>) }
  o[head] = rest.length ? setPath((o[head] as object) || {}, rest.join('.'), value) : value
  return o as T
}

export const aed = (n?: number | null) =>
  n == null || Number.isNaN(Number(n)) ? '' : `AED ${Number(n).toLocaleString('en')}`
