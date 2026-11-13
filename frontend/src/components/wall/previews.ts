/**
 * Previews: what each team action looks like on the wall, without anyone doing it.
 *
 * /work/tv has a button per row of this list; it opens the wall with ?preview=<key> and the
 * wall plays that one moment as if it had just landed (stage or feed), marked "preview".
 * The names are made up. Nothing here is written anywhere, and nothing on the wall is ever
 * pushed by hand: every row is something the product records on its own.
 */
import { logoFor, type Moment } from './moments'

export type Preview = { key: string; does: string; where: string; tv: string; moment: Omit<Moment, 'id' | 'at'> }

const SAND = '#FFF0C7', MINT = '#E4F7EA', LIME = '#D3FF02', SOFT = '#EEF0EA', BLUE = '#CFE8FF'

export const PREVIEWS: Preview[] = [
  { key: 'request', does: 'Account manager logs a client request', where: 'the request queue at /work/inbox, or from a deal on /work/pipeline', tv: 'the whole stage, no confetti: "Barakat asked", then a ringed chip on the campaign row',
    moment: { tier: 'stage', kind: 'request', label: 'Request', tone: SAND, name: 'Sana', actor: 'Sana', line: 'raised: Rimal shortlist by Monday', verb: 'Rimal shortlist by Monday', client: 'Barakat', campaign: 'The Standard of Fresh', cheer: { title: 'Barakat asked', sub: 'Rimal shortlist by Monday' } } },
  { key: 'note', does: 'Account manager writes a client note', where: 'the client record on /work/brands, Record tab', tv: 'a chip on the client row carrying the note itself (a note is text on the client record, nothing more)',
    moment: { tier: 'card', kind: 'note', label: 'Note', tone: SAND, name: 'Sana', actor: 'Sana', line: 'noted on Barakat', verb: 'Call moved to Tuesday, they want reels only', quote: 'Call moved to Tuesday, they want reels only', client: 'Barakat' } },
  { key: 'agreement', does: 'Agreement sent to a creator', where: '/work/enrolments, new agreement', tv: 'a chip on the campaign row: Agreement sent',
    moment: { tier: 'card', kind: 'agreement', label: 'Agreement', tone: SAND, name: 'Layla', line: 'sent an agreement to Layla', verb: 'Agreement sent', client: 'Barakat', campaign: 'The Standard of Fresh' } },
  { key: 'signed', does: 'Creator signs the agreement', where: 'the creator, on their own link', tv: 'the whole stage: confetti, ripples, "Layla signed"',
    moment: { tier: 'celebrate', kind: 'signed', label: 'Signed', tone: LIME, name: 'Layla', line: 'signed the agreement', verb: 'Signed', client: 'Barakat', campaign: 'The Standard of Fresh', cheer: { title: 'Layla signed', sub: 'The Standard of Fresh · Barakat' } } },
  { key: 'roster', does: 'Talent opens a roster or adds creators', where: 'the roster sheet on /work/areas', tv: 'Roster opened as a chip; adds collapse to "+6 to roster"',
    moment: { tier: 'quiet', kind: 'roster', label: 'Roster', tone: SOFT, name: 'Talent', actor: 'Talent', line: 'added 6 creators to the roster', verb: '+6 to roster', client: 'Minimalist', campaign: 'Minimalist White Friday 2026' } },
  { key: 'rates', does: 'Talent agrees rates with creators', where: 'the roster sheet, two prices per creator', tv: 'a chip: Rates · 4',
    moment: { tier: 'quiet', kind: 'rate', label: 'Rates', tone: SOFT, name: 'Talent', actor: 'Talent', line: 'agreed rates with 4 creators', verb: 'Rates · 4', client: 'Minimalist', campaign: 'Minimalist White Friday 2026' } },
  { key: 'briefed', does: 'Creator briefed, package shipped, filming', where: 'the campaign roster stamps', tv: 'a face with one word: Briefed, Shipped, Filming',
    moment: { tier: 'quiet', kind: 'briefed', label: 'Briefed', tone: SOFT, name: 'Omar', line: 'was briefed', verb: 'Briefed', client: 'Imagine', campaign: 'Imagine Winter' } },
  { key: 'content', does: 'Content sent to the client', where: 'the campaign Content tab', tv: 'a chip: To client',
    moment: { tier: 'card', kind: 'review', label: 'To client', tone: MINT, name: 'Sana', actor: 'Sana', line: 'sent content to the client', verb: 'To client', client: 'Imagine', campaign: 'Imagine Winter' } },
  { key: 'approved', does: 'Client approves a piece', where: "the client's review link", tv: 'the whole stage: "Imagine said yes"',
    moment: { tier: 'celebrate', kind: 'approved', label: 'Approved', tone: LIME, name: 'Imagine', line: 'client approved a piece', verb: 'Approved', client: 'Imagine', campaign: 'Imagine Winter', cheer: { title: 'Imagine said yes', sub: 'Imagine Winter · content approved' } } },
  { key: 'confirmed', does: 'Client confirms a proposal', where: "the client's proposal link", tv: 'the whole stage: "Imagine Winter is on"',
    moment: { tier: 'celebrate', kind: 'confirmed', label: 'Confirmed', tone: LIME, name: 'Imagine Winter', line: 'client confirmed the proposal', verb: 'Confirmed', client: 'Imagine', campaign: 'Imagine Winter', cheer: { title: 'Imagine Winter is on', sub: 'the client confirmed the proposal' } } },
  { key: 'live', does: 'A post goes live', where: 'the post link on the campaign roster', tv: 'the whole stage: "Omar is live"',
    moment: { tier: 'celebrate', kind: 'live', label: 'Live', tone: LIME, name: 'Omar', line: 'post is live', verb: 'Live', client: 'Imagine', campaign: 'Imagine Winter', cheer: { title: 'Omar is live', sub: 'Imagine Winter · Imagine' } } },
  { key: 'applied', does: 'A creator applies or replies to Scout', where: 'WhatsApp, the app, or Instagram', tv: 'a face on the "Creators coming in" row',
    moment: { tier: 'card', kind: 'applied', label: 'Applied', tone: BLUE, name: 'noor.eats', line: 'applied on WhatsApp', verb: 'Applied' } },
]

export function previewMoment(key: string, logos: Record<string, string>): Moment | null {
  const p = PREVIEWS.find(x => x.key === key)
  if (!p) return null
  const m = p.moment
  return { ...m, id: `preview-${key}`, at: new Date().toISOString(), logo: logoFor(m.client, logos),
  }
}
