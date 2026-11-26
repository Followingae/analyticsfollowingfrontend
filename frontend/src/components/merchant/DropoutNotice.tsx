'use client'

/**
 * Creators who will not make it, one line each, with the way to fill the spot.
 *
 * The visit agent learns this on WhatsApp: a creator says they cannot come, backs
 * out, or never confirms by the reply-by. The server lists only the ones whose spot
 * has not been filled again, so the notice goes away by itself once it has.
 */
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { CampaignDropout } from '@/services/merchantApi'
import { Face } from './bits'

function who(d: CampaignDropout): string {
  return d.handle ? `@${d.handle.replace(/^@/, '')}` : d.name || 'A creator'
}

function line(d: CampaignDropout, manual: boolean): string {
  const name = who(d)
  if (d.reason === 'no_reply') return manual ? `${name} hasn't confirmed their visit. You can choose someone else.` : `${name} hasn't confirmed their visit.`
  const lead = d.reason === 'backed_out' ? `${name} has dropped out.` : `${name} can't make it.`
  return manual ? `${lead} Their spot is free, choose a replacement.` : `${lead} Their spot is free again.`
}

export function DropoutNotice({
  dropouts,
  manual,
  href,
}: {
  dropouts: CampaignDropout[] | null | undefined
  /** Only a merchant who approves each creator has a list to choose from. */
  manual: boolean
  /** Where the applicants list is. */
  href: string
}) {
  if (!dropouts?.length) return null
  return (
    <div role="status" className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
      {dropouts.map((d) => (
        <div key={d.participant_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Face name={d.name || d.handle || 'Creator'} src={d.avatar_url} className="size-9" />
          <p className="m-0 min-w-0 flex-1 text-[13px] leading-snug">{line(d, manual)}</p>
          {manual ? (
            <Link
              href={href}
              className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              {d.reason === 'no_reply' ? 'Choose someone' : 'Choose a replacement'}
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  )
}
