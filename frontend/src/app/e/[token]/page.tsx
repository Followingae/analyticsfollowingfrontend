import type { Metadata } from 'next'
import EnrolmentFlow from './EnrolmentFlow'

/**
 * /e/{token} — the creator's enrolment link.
 *
 * Deliberately NOT indexable and deliberately without a rich preview. The token is the
 * only authorisation on this page, and a link pasted into a group chat renders a card from
 * whatever the metadata says. A card reading "Your AED 4,500 deal with Nourishing Co." is
 * the rate leaking to everyone in the chat before the creator has even opened it, so the
 * title says nothing and the crawlers are told to stay out.
 */
export const metadata: Metadata = {
  title: 'Following',
  description: '',
  robots: { index: false, follow: false, nocache: true },
  openGraph: { title: 'Following', description: '' },
}

// The link's state changes as the creator moves through it, so nothing here may be cached.
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <EnrolmentFlow token={token} />
}
