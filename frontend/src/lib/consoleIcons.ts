/**
 * The console's icon registry.
 *
 * THE RULE THIS FILE EXISTS FOR: icons carry data, not names. A nav item keeps its text label,
 * because an icon-only nav harms discoverability and nobody should have to learn 26 pictograms
 * to find Payables. What an icon is good at is the thing a label is bad at: being scanned down
 * a column of fifty rows. So the glyph earns its place on a row, a status mark, an entity tile
 * or a channel mark, where it tells you what KIND of thing you are looking at or WHERE a message
 * went before you have read a word.
 *
 * It is five maps rather than one because the five categories obey different rules, and putting
 * them in one bag is how a stage glyph ends up borrowed for a verb:
 *
 *   MODULE   where you are. Always beside a label. One glyph per module, never reused.
 *   ENTITY   what kind of thing. Carries a tint, and the tint means KIND, never STATE.
 *   STAGE    how far along. Carries a tone, and the tone always travels with the rung's word.
 *   ACTION   what a button does. One glyph per verb across every module.
 *   CHANNEL  how a message travels. Meaningful on its own, so it must be nameable.
 *
 * Every map is a `Record` over a closed union, so adding a module, a rung or a verb without
 * choosing a glyph is a compile error and not a blank space at 4pm on a Thursday.
 *
 * lucide-react only, imported by name so the bundle keeps just these. Brand marks and country
 * flags are the one thing lucide cannot supply and are out of scope here.
 */
import {
  AlarmClock,
  BadgeCheck,
  Ban,
  Banknote,
  Bell,
  BellRing,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarPlus,
  CircleArrowOutUpRight,
  CircleCheck,
  ClipboardCheck,
  Coins,
  Compass,
  CreditCard,
  Database,
  FileSignature,
  FileText,
  Film,
  FolderInput,
  Forward,
  Gauge,
  Hand,
  HandCoins,
  Handshake,
  IdCard,
  ImageUp,
  Instagram,
  LayoutDashboard,
  Link2,
  Mail,
  Map as MapIcon,
  Megaphone,
  MessageCircle,
  MessageCircleQuestion,
  MonitorPlay,
  PencilLine,
  PhoneOutgoing,
  ReceiptText,
  Rocket,
  RotateCw,
  ScanEye,
  Send,
  Settings2,
  Share2,
  Signature,
  Smartphone,
  Store,
  TabletSmartphone,
  Tag,
  Target,
  Trash2,
  Undo2,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  UserRound,
  UserRoundPlus,
  UsersRound,
  Video,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import type { AdminModule } from '@/hooks/useAdminAccess'
import type { Tone } from '@/components/console/primitives'
// The ladder's own union. Stage keys live there, not here, so the two cannot disagree.
import type { Stage } from '@/services/ladderApi'

/** A creator who has left the ladder. Not a rung, and never drawn as progress. */
export const DROPPED_ICON = UserMinus

/* ── Sizes and strokes ─────────────────────────────────────────────────────────────────── */

/**
 * The only icon sizes the console draws. Nothing else is allowed, and `Glyph` takes a KEY of
 * this object rather than a number so an 18-and-a-half cannot be typed by accident.
 * Salesforce Lightning: "do not scale outside the standard sizes". An icon drawn off its native
 * grid blurs its strokes, and two off-grid sizes on one screen read as a mistake even when
 * nobody can say why.
 *
 *   glyph    12  inline with a caption, inside a lozenge
 *   row      14  a dense list row, a table cell
 *   default  16  buttons, menu items, anywhere nothing else was decided
 *   tile     18  the glyph inside a tinted entity tile
 *   hero     24  a section header or a landing card
 */
export const ICON_SIZE = { glyph: 12, row: 14, default: 16, tile: 18, hero: 24 } as const
export type IconSize = keyof typeof ICON_SIZE

/**
 * Stroke width, matched to the weight of the text the icon sits beside. From
 * `make-interfaces-feel-better/icons.md`, "Match Icon Stroke to Text Weight": an icon next to
 * text should carry the same optical weight as the text. Regular (400) 14 to 16px text takes
 * 1.5, medium or semibold (500 to 600) takes 2, bold (700) or an emphasized standalone glyph
 * takes 2.5. lucide defaults to 2, so only `regular` differs from the default, and we write it
 * out anyway: a default that happens to be right is not a decision.
 */
export const STROKE = { regular: 1.5, medium: 2, bold: 2.5 } as const
export type StrokeWeight = keyof typeof STROKE

/* ── 1. MODULE ─────────────────────────────────────────────────────────────────────────── */

/**
 * One glyph per admin module, keyed off the real `AdminModule` union so the map cannot drift
 * from what the access model grants. Used in the sidebar and in section headers, always beside
 * the module's name. Never reused: two modules sharing a glyph is how a screen becomes
 * unrecognisable at a glance.
 */
export const MODULE_ICON: Record<AdminModule, LucideIcon> = {
  dashboard: LayoutDashboard,
  operations: Workflow,
  clients: Building2,
  users: IdCard,
  campaigns: Megaphone,
  proposals: FileText,
  influencers: Database,
  fa: Smartphone,
  system: Settings2,
  billing: CreditCard,
  content: Film,
  share: Share2,
  chasing: PhoneOutgoing,
  approvals: BadgeCheck,
  areas: MapIcon,
  coverage: Compass,
  goals: Target,
  reliability: Gauge,
  enrolments: Signature,
  payables: Banknote,
  finance: Coins,
  team: UsersRound,
  displays: MonitorPlay,
  staff: Briefcase,
  notifications: Bell,
  whatsapp: MessageCircle,
}

/* ── 2. ENTITY ─────────────────────────────────────────────────────────────────────────── */

export type EntityKind =
  | 'client' | 'brand' | 'campaign' | 'proposal' | 'creator' | 'booking'
  | 'payout' | 'enrolment' | 'merchant' | 'deliverable' | 'staff'

/**
 * Which `.console-shell` tone family tints an entity's tile. Entity colour means "what kind of
 * thing", never "what state", so a tile is NOT a status mark even though it borrows a status
 * family: those are the only tokens the shell defines. `bad` is deliberately never assigned,
 * because a red tile on a calm row reads as an error whatever it is carrying. If kind-colours
 * outgrow this, add dedicated `--entity-*` tokens rather than stretching these.
 */
export type EntityTint = Exclude<Tone, 'bad'>

export interface EntityMeta {
  icon: LucideIcon
  label: string
  tint: EntityTint
}

/**
 * An entity glyph is only drawn where the entity appears OUTSIDE its own module. Inside
 * Campaigns every row is a campaign, and a megaphone on each one is noise. Client and brand
 * share a glyph on purpose: they are the same building seen from the agency side and from the
 * advertiser side.
 */
export const ENTITY_ICON: Record<EntityKind, EntityMeta> = {
  client: { icon: Building2, label: 'Client', tint: 'neutral' },
  brand: { icon: Building2, label: 'Brand', tint: 'neutral' },
  campaign: { icon: Megaphone, label: 'Campaign', tint: 'info' },
  proposal: { icon: FileText, label: 'Proposal', tint: 'info' },
  creator: { icon: UserRound, label: 'Creator', tint: 'good' },
  booking: { icon: CalendarClock, label: 'Booking', tint: 'warn' },
  payout: { icon: Banknote, label: 'Payout', tint: 'good' },
  enrolment: { icon: FileSignature, label: 'Enrolment', tint: 'neutral' },
  merchant: { icon: Store, label: 'Merchant', tint: 'warn' },
  deliverable: { icon: ImageUp, label: 'Deliverable', tint: 'info' },
  staff: { icon: Briefcase, label: 'Staff member', tint: 'neutral' },
}

/* ── 3. STAGE ──────────────────────────────────────────────────────────────────────────── */

/** The eight rungs of the delivery ladder, spelled exactly as the product spells them. */
/**
 * Keyed on the STAGE KEY the database stores, not on the label a human reads.
 *
 * This map was first written keyed on labels ('Enrolled', 'Rate agreed'), which looks tidier
 * and can never match a row: `campaign_creators.stage` holds `enrolled`, `rate_agreed`,
 * `contracted`, `briefed`, `content_in`, `content_approved`, `posted`, `paid`. A chip keyed on
 * the label would have rendered blank for every creator in the product.
 *
 * The labels are NOT restated here. `STAGES` in `@/services/ladderApi` is the one list, it
 * already pairs each key with its label and the role that owns it, and a second copy is how
 * two names for one rung would start. Look the label up there; take the glyph from here.
 */
/* Derived from the real union rather than retyped, so adding a stage in `ladderApi` is a
 * compile error here until it has a glyph. `dropped` is a Stage but NOT a rung: a dropped
 * creator has left the ladder rather than reached a step on it, so it is handled separately
 * by `StageChip` and deliberately has no place in `STAGE_ORDER`. */
export type StageRung = Exclude<Stage, 'dropped'>

/** Where a creator stands on a rung. Done is ink, current is lime, late is bad, not yet is neutral. */
export type StageState = 'done' | 'current' | 'late' | 'todo'

export interface StageMeta {
  icon: LucideIcon
  /** The tone this rung carries by default, as a lozenge. */
  tone: Tone
}

/**
 * Lateness is NOT a rung and never borrows a rung's glyph: a creator can be on Content in and
 * late, and one glyph cannot say both. That is why `StageState` is separate and
 * `STAGE_STATE_TONE` overrides the tone while the rung's own glyph stays put.
 */
export const STAGE_ICON: Record<StageRung, StageMeta> = {
  enrolled: { icon: UserPlus, tone: 'neutral' },
  rate_agreed: { icon: Handshake, tone: 'neutral' },
  contracted: { icon: FileSignature, tone: 'neutral' },
  briefed: { icon: Send, tone: 'neutral' },
  content_in: { icon: ImageUp, tone: 'info' },
  content_approved: { icon: ClipboardCheck, tone: 'good' },
  posted: { icon: Link2, tone: 'good' },
  paid: { icon: Wallet, tone: 'good' },
}

/** The ladder in order, so a screen never re-types the sequence. */
export const STAGE_ORDER: readonly StageRung[] = [
  'enrolled', 'rate_agreed', 'contracted', 'briefed',
  'content_in', 'content_approved', 'posted', 'paid',
]

export const STAGE_STATE_TONE: Record<StageState, Tone> = {
  done: 'neutral',
  current: 'info',
  late: 'bad',
  todo: 'neutral',
}

/** The mark that sits beside a rung when it is late. Separate from the rung on purpose. */
export const LATE_ICON: LucideIcon = AlarmClock

/* ── 4. ACTION ─────────────────────────────────────────────────────────────────────────── */

export type ActionVerb =
  | 'getRate' | 'confirmRate' | 'setPrice' | 'sendBrief' | 'chase' | 'extend'
  | 'reviewContent' | 'askEdit' | 'recordPostLink' | 'approve' | 'reject' | 'pay'
  | 'releasePayout' | 'fileDocument' | 'sendQuote' | 'confirmForClient'
  | 'openCampaign' | 'addCreators' | 'import' | 'giveTo' | 'nudge' | 'retry'
  | 'revoke' | 'takeOff' | 'delete'

export interface ActionMeta {
  icon: LucideIcon
  /** Verb-first, as the button reads. "Send quote", never "Submit". */
  label: string
  /** Destructive verbs render in the destructive colour and sit last in any menu. */
  destructive?: boolean
}

/** One glyph per verb across all 26 modules, so a verb that means the same thing looks the same. */
export const ACTION_ICON: Record<ActionVerb, ActionMeta> = {
  getRate: { icon: MessageCircleQuestion, label: 'Get a rate' },
  confirmRate: { icon: Handshake, label: 'Confirm rate' },
  setPrice: { icon: Tag, label: 'Set price' },
  sendBrief: { icon: Send, label: 'Send guide' },
  chase: { icon: BellRing, label: 'Chase' },
  extend: { icon: CalendarPlus, label: 'Grant extension' },
  reviewContent: { icon: ScanEye, label: 'Review content' },
  askEdit: { icon: PencilLine, label: 'Ask for an edit' },
  recordPostLink: { icon: Link2, label: 'Record post link' },
  approve: { icon: CircleCheck, label: 'Approve' },
  reject: { icon: Ban, label: 'Reject' },
  pay: { icon: HandCoins, label: 'Pay' },
  releasePayout: { icon: CircleArrowOutUpRight, label: 'Release payout' },
  fileDocument: { icon: FolderInput, label: 'File document' },
  sendQuote: { icon: ReceiptText, label: 'Send quote' },
  confirmForClient: { icon: UserCheck, label: 'Confirm for client' },
  openCampaign: { icon: Rocket, label: 'Open campaign' },
  addCreators: { icon: UserRoundPlus, label: 'Add creators' },
  import: { icon: Upload, label: 'Import' },
  giveTo: { icon: Forward, label: 'Give to someone' },
  nudge: { icon: Hand, label: 'Nudge' },
  retry: { icon: RotateCw, label: 'Retry' },
  revoke: { icon: Undo2, label: 'Revoke', destructive: true },
  takeOff: { icon: UserMinus, label: 'Take off campaign', destructive: true },
  delete: { icon: Trash2, label: 'Delete', destructive: true },
}

/* ── 5. CHANNEL ────────────────────────────────────────────────────────────────────────── */

export type ChannelKind =
  | 'email' | 'whatsapp' | 'instagram' | 'tiktok' | 'platform' | 'client' | 'push'

export interface ChannelMeta {
  icon: LucideIcon
  label: string
  tone: Tone
}

/**
 * A channel mark is MEANINGFUL: nothing else on a row says the message went by WhatsApp, so it
 * is never decorative and `ChannelChip` always names it. Tone is kept quiet; only WhatsApp (a
 * live conversation) and our own surfaces (platform, push) take a wash. Lucide has no TikTok
 * mark, so `Video` stands in until the brand-icon file exists.
 */
export const CHANNEL_ICON: Record<ChannelKind, ChannelMeta> = {
  email: { icon: Mail, label: 'Email', tone: 'neutral' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', tone: 'good' },
  instagram: { icon: Instagram, label: 'Instagram', tone: 'neutral' },
  tiktok: { icon: Video, label: 'TikTok', tone: 'neutral' },
  platform: { icon: Bell, label: 'Platform', tone: 'info' },
  client: { icon: Building2, label: 'Client', tone: 'neutral' },
  push: { icon: TabletSmartphone, label: 'Push', tone: 'info' },
}
