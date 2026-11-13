/**
 * A moment is one thing somebody did in the product, shaped for the wall.
 *
 * The pulse feed hands the screen raw events (a kind, a line of text, a face). This file
 * shapes them and decides how loudly the wall should react. Nothing is pushed by hand:
 *
 *   celebrate  the whole stage, confetti: a creator signed, the client said yes, a proposal
 *              was confirmed, a post went live
 *   stage      the whole stage without confetti: a client asked for something
 *   card       a highlighted card at the head of the feed for a minute: a client request,
 *              a note, a proposal or agreement sent, a creator replying, a deal moving
 *   quiet      a normal card: roster bursts, briefs, packages, content moving along
 *
 * Nothing here is money. The feed never carries an amount.
 */
import type { Event } from './Pulse'

export type Tier = 'celebrate' | 'stage' | 'card' | 'quiet'

/** Business development and founder work stays off the TV (founder, 13 Nov 2026). */
export const OFF_TV = new Set(['deal', 'money', 'cleared', 'proposal', 'shortlist'])

/** One or two words for the chip on a campaign row. */
export function verbOf(e: { kind: string; text: string }): string {
  const t = e.text
  const n = (t.match(/\d+/) || ['1'])[0]
  switch (e.kind) {
    case 'live': return 'Live'
    case 'approved': return 'Approved'
    case 'confirmed': return 'Confirmed'
    case 'content': return 'Content in'
    case 'review': return 'To client'
    case 'received': return 'Filming'
    case 'dispatched': return 'Shipped'
    case 'briefed': return 'Briefed'
    case 'signed': return 'Signed'
    case 'agreement': return 'Agreement sent'
    case 'applied': return 'Applied'
    case 'reply': return 'Replied'
    case 'roster': return /^opened/i.test(t) ? 'Roster opened' : `+${n} to roster`
    case 'rate': return `Rates · ${n}`
    case 'request': return t.replace(/^raised:\s*/i, '')
    case 'done': return t.replace(/^done:\s*/i, '')
    case 'note': return t.replace(/^(noted on|on:)\s*/i, '')
    default: return t
  }
}

export type Moment = {
  id: string
  at: string
  tier: Tier
  kind: string
  /** two words on the pill */
  label: string
  /** pill colour; lime is a surface, never text */
  tone: string
  /** the name on the card: the creator, or the staff member who pressed the button */
  name: string
  /** what they did, in a few words */
  line: string
  quote?: string | null
  avatar?: string | null
  logo?: string | null
  client?: string | null
  campaign?: string | null
  /** one or two words for a chip */
  verb: string
  /** the staff member who pressed the button, if it was staff */
  actor?: string | null
  /** celebration copy */
  cheer?: { title: string; sub: string }
}

export const LIME = '#D3FF02'
const SOFT = '#EEF0EA'
const BLUE = '#CFE8FF'
const SAND = '#FFF0C7'
const LILAC = '#E9E4FF'
const MINT = '#E4F7EA'
const ROSE = '#FFE3DD'

const LABEL: Record<string, [string, string]> = {
  live: ['Live', LIME], approved: ['Approved', LIME], confirmed: ['Confirmed', LIME], signed: ['Signed', LIME], cleared: ['Cleared', LIME],
  content: ['Content in', MINT], review: ['To client', MINT], done: ['Done', MINT], money: ['Paid', MINT],
  received: ['Filming', SOFT], dispatched: ['Shipped', SOFT], briefed: ['Briefed', SOFT], roster: ['Roster', SOFT], rate: ['Rates', SOFT], shortlist: ['Shortlist', SOFT],
  note: ['Note', SAND], request: ['Request', SAND], proposal: ['Proposal', SAND], agreement: ['Agreement', SAND],
  deal: ['Deal', LILAC], reply: ['Reply', BLUE], applied: ['Applied', BLUE],
}

const first = (s?: string | null) => String(s ?? '').replace(/^@/, '').split(' ')[0]

/** The client's mark, by exact name or by the start of it ("Barakat" finds "Barakat Fresh"). */
export function logoFor(client: string | null | undefined, logos: Record<string, string>): string | undefined {
  if (!client) return undefined
  if (logos[client]) return logos[client]
  const k = Object.keys(logos).find(k => k.toLowerCase().startsWith(client.toLowerCase()) || client.toLowerCase().startsWith(k.toLowerCase()))
  return k ? logos[k] : undefined
}

export function tierOf(e: Event): Tier {
  if (e.kind === 'signed' || e.kind === 'confirmed' || e.kind === 'live') return 'celebrate'
  if (e.kind === 'approved' && /^client/i.test(e.text)) return 'celebrate'
  if (e.kind === 'request') return 'stage'
  if (['note', 'proposal', 'agreement', 'reply', 'applied', 'deal', 'done', 'approved'].includes(e.kind)) return 'card'
  if (e.kind === 'roster' && /^opened/i.test(e.text)) return 'card'
  return 'quiet'
}

export function toMoment(e: Event & { id?: string; actor?: string | null; quote?: string | null }, logos: Record<string, string>): Moment {
  const tier = tierOf(e)
  const [label, tone] = LABEL[e.kind] ?? ['Moved', SOFT]
  const name = e.actor ?? e.who ?? e.client ?? e.campaign ?? 'Following'
  let line = e.text
  if (e.actor && e.who) line = `${e.text} · ${e.who}`
  const logo = logoFor(e.client, logos)
  let cheer: Moment['cheer']
  if (tier === 'stage') cheer = { title: `${e.client ?? 'A client'} asked`, sub: e.text.replace(/^raised:\s*/i, '') }
  if (tier === 'celebrate') {
    const where = [e.campaign, e.client].filter(Boolean).join(' · ')
    if (e.kind === 'signed') cheer = { title: `${first(e.who) || 'A creator'} signed`, sub: where || 'on board' }
    else if (e.kind === 'live') cheer = { title: `${first(e.who) || 'A post'} is live`, sub: where }
    else if (e.kind === 'approved') cheer = { title: `${e.client ?? 'The client'} said yes`, sub: e.campaign ?? 'content approved' }
    else if (e.kind === 'confirmed') cheer = { title: `${e.campaign ?? 'The proposal'} is on`, sub: 'the client confirmed the proposal' }
    else cheer = { title: e.text, sub: [e.campaign, e.client].filter(Boolean).join(' · ') }
  }
  return {
    id: e.id ?? `${e.kind}-${e.at}-${e.who ?? ''}-${e.text}`, at: e.at, tier, kind: e.kind, label, tone, name, line, verb: verbOf(e), actor: e.actor,
    quote: e.quote, avatar: e.avatar, logo, client: e.client, campaign: e.campaign, cheer,
  }
}
