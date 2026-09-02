/**
 * The sourcing brief: one vocabulary, one sentence, one list of what is still missing.
 *
 * A brief is what a founder writes when they release a brand, and it is the entire handover
 * a talent manager gets. Until now it said eight things, all of them about who to look for
 * and none of them about what to offer or what to ask back, so "350 · food creators · in
 * UAE · 20k-500k · reel, story" was the whole instruction. Everything a manager actually
 * needs before she can send a first message, the package on a barter deal, what it is worth,
 * when it goes live, what we do with the content afterwards, who she must avoid, she had to
 * go and ask for.
 *
 * Two rules hold this file together.
 *
 * The vocabulary is borrowed, never invented. Barter is `barter_items` with `value_aed` and
 * a `fulfilment_mode` of delivery or dine_in, which is exactly what the FA barter campaign
 * already stores (campaigns.barter_items, campaigns.fulfilment_mode). Platforms are
 * instagram, tiktok, snapchat, which is exactly fa_deliverables.platform. A second name for
 * the same thing is how two halves of a product stop being able to talk to each other.
 *
 * An empty field is stated, not dropped. `briefLine` reads what is there; `briefGaps` names
 * what is not. A sentence that quietly omits the budget looks identical to a brief that had
 * no budget to omit, and the manager cannot tell which she is holding.
 */
import type { AreaBrief, BriefDeliverable, BriefPlatform } from '@/services/imdListsApi'

/* Platforms.
   The three the business is actually built for. `fa_deliverables.platform` is
   'instagram' | 'tiktok' | 'snapchat' and the FA campaign form offers exactly those, so a
   brief says the same words the deliverable row will say later. YouTube is deliberately
   absent: it exists in one unpersisted Operations shape and nowhere else, and a platform we
   cannot measure or price is a promise we cannot keep. */
export const PLATFORM_LABEL: Record<BriefPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
}

export const PLATFORMS: BriefPlatform[] = ['instagram', 'tiktok', 'snapchat']

/**
 * What each platform can be asked for.
 *
 * Instagram carries the four priced content formats from the master database's own pricing
 * columns (post, story, reel, carousel; bundle and monthly are commercial packagings, not
 * things a creator films). TikTok and Snapchat carry the one format each that the FA
 * deliverable vocabulary knows, because that is what we can verify when it lands.
 */
export const PLATFORM_FORMATS: Record<BriefPlatform, string[]> = {
  instagram: ['reel', 'story', 'post', 'carousel'],
  tiktok: ['video'],
  snapchat: ['story'],
}

const PLURAL: Record<string, string> = {
  reel: 'reels', story: 'stories', post: 'posts', carousel: 'carousels', video: 'videos',
}

/** "2 Instagram reels", "1 TikTok video". The unit a manager quotes to a creator. */
export function deliverableLabel(d: BriefDeliverable): string {
  const n = Math.max(1, Number(d.quantity) || 1)
  const noun = n === 1 ? d.format : (PLURAL[d.format] || `${d.format}s`)
  return `${n} ${PLATFORM_LABEL[d.platform] || d.platform} ${noun}`
}

/**
 * The deliverables of a brief, old shape or new.
 *
 * Areas released before this existed hold `deliverables: ['reel', 'story']` with no platform
 * and no quantity. They were all Instagram, because Instagram was all we asked for, so they
 * read as one Instagram unit each. Nothing is rewritten in the database: the old array is
 * still written alongside the new one, so a reader that has not been updated keeps working.
 */
export function briefDeliverables(b?: AreaBrief | null): BriefDeliverable[] {
  if (!b) return []
  if (b.deliverable_specs?.length) return b.deliverable_specs
  return (b.deliverables || []).map(f => ({
    platform: 'instagram' as BriefPlatform, format: String(f), quantity: 1,
  }))
}

/** The legacy mirror, so every existing reader of `deliverables` keeps reading. */
export function legacyDeliverables(specs: BriefDeliverable[]): string[] {
  return Array.from(new Set(specs.map(s => s.format)))
}

/** Cash unless told otherwise. Every area that exists today was a cash area. */
export function compMode(b?: AreaBrief | null): 'cash' | 'barter' | 'both' {
  return b?.comp_mode || 'cash'
}

export const USAGE_LABEL: Record<string, string> = {
  organic: 'organic only',
  paid_ads: 'we may run it as an ad',
  full_buyout: 'full buyout',
}

export const FULFILMENT_LABEL: Record<string, string> = {
  delivery: 'delivered to them',
  dine_in: 'they visit',
}

/** The total of a barter package, per creator. Derived, never stored: an item's value can
 *  change and a stored total would keep quoting the old one. */
export function barterValue(b?: AreaBrief | null): number {
  return (b?.barter_items || []).reduce((sum, it) => sum + (Number(it.value_aed) || 0), 0)
}

const money = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`
const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))

const shortDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * The brief in one sentence, the thing the alert carries and the thing everyone reads.
 *
 * Ordered the way the work is done: who to find, what we are offering them, what we need
 * back, and when. It is allowed to be long, because the alternative is a manager opening
 * four screens to assemble the same sentence herself.
 */
export function briefLine(b?: AreaBrief | null): string {
  if (!b) return ''
  const bits: string[] = []

  /* Who to find. One clause, not five fragments: "350 food creators in UAE, 20k-500k". */
  const who: string[] = []
  const head = [b.target_count ? String(b.target_count) : '',
                (b.categories || []).filter(Boolean).join(', '),
                'creators'].filter(Boolean).join(' ')
  who.push(head)
  if (b.market) who.push(`in ${b.market}`)
  const size = b.followers_min && b.followers_max ? `${k(b.followers_min)}-${k(b.followers_max)}`
    : b.followers_min ? `${k(b.followers_min)}+`
    : b.followers_max ? `up to ${k(b.followers_max)}` : ''
  /* An empty brief must produce an empty sentence, so the caller can say "no brief written
     yet" instead of sending out the single word "creators" and calling it a handover. */
  const cats = (b.categories || []).filter(Boolean)
  if (cats.length || b.target_count || b.market || size) {
    bits.push(who.join(' ') + (size ? `, ${size}` : ''))
  }
  /* Who the brand wants reached, which is not the same question as how big the creator is.
     A 300k account whose audience is teenage boys is the wrong answer to "mothers in Dubai",
     and follower count will never say so. */
  if (b.audience) bits.push(`reaching ${b.audience}`)

  /* What we are offering. */
  const mode = compMode(b)
  const pay: string[] = []
  if (mode !== 'barter' && b.budget_per_creator) {
    pay.push(`${money(Number(b.budget_per_creator))} each`)
  }
  if (mode !== 'cash') {
    const items = (b.barter_items || []).map(i => i.name).filter(Boolean)
    const total = barterValue(b)
    const barter = ['barter']
    if (items.length) barter.push(`(${items.join(', ')})`)
    if (total > 0) barter.push(`worth ${money(total)}`)
    let clause = barter.join(' ')
    // A comma, or "worth AED 300 they visit" runs two facts into one phrase.
    if (b.fulfilment_mode) clause += `, ${FULFILMENT_LABEL[b.fulfilment_mode] || b.fulfilment_mode}`
    pay.push(clause)
  }
  if (pay.length) bits.push(pay.join(' plus '))

  /* What we need back. */
  const delivs = briefDeliverables(b)
  if (delivs.length) bits.push(delivs.map(deliverableLabel).join(', '))
  if (b.usage_rights) {
    const u = USAGE_LABEL[b.usage_rights] || b.usage_rights
    bits.push(b.usage_days ? `${u}, ${b.usage_days} days` : u)
  }
  if (b.exclusivity_days || b.avoid_brands?.length) {
    const ex: string[] = []
    if (b.avoid_brands?.length) ex.push(`nothing for ${b.avoid_brands.join(', ')}`)
    else ex.push('exclusive')
    if (b.exclusivity_days) ex.push(`for ${b.exclusivity_days} days`)
    bits.push(ex.join(' '))
  }

  /* When. `dates_firm` is the difference between a manager who can offer a creator next
     week and one who has to come back and ask, so it rides in the sentence. */
  /* Only dates that actually parsed. A date we could not read is the same as no date, and
     "live by " with nothing after it is a sentence that has lost an answer. */
  const from = shortDate(b.live_from), to = shortDate(b.live_to)
  if (from || to) {
    const when = from && to
      ? (from === to ? from : `${from} to ${to}`)
      : (from ? `from ${from}` : `by ${to}`)
    bits.push(`live ${when}${b.dates_firm ? ', fixed' : ''}`)
  }

  return bits.filter(Boolean).join(' · ')
}

/**
 * What the brief does not say, in the manager's words.
 *
 * Only the answers she needs before a first message goes out. A brief missing the budget and
 * a brief with no budget produce the same sentence, and she cannot tell them apart, so the
 * sentence has to admit it. Notes and audience are not here: they help, but nobody is
 * blocked on them.
 */
export function briefGaps(b?: AreaBrief | null): string[] {
  const gaps: string[] = []
  const c = b || {}
  if (!(c.categories || []).length) gaps.push('what kind of creator')
  const mode = compMode(c)
  if (mode === 'cash' && !c.budget_per_creator) gaps.push('what we pay')
  if (mode === 'barter' && !(c.barter_items || []).length) gaps.push('what they get')
  if (mode === 'both' && !c.budget_per_creator && !(c.barter_items || []).length) gaps.push('what we pay')
  if (!briefDeliverables(c).length) gaps.push('what we need back')
  if (!c.usage_rights) gaps.push('usage rights')
  if (!c.live_from && !c.live_to) gaps.push('when it goes live')
  return gaps
}
