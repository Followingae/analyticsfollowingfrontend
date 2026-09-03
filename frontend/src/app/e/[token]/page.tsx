import type { Metadata, Viewport } from 'next'
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

/**
 * The browser chrome, made to match the page.
 *
 * This page is near black edge to edge, and on a phone the strip above it (the notch bar in
 * Safari, the address bar in Chrome) was still painting white. A black page under a white
 * bar reads as broken rather than designed, and it is the first thing a creator sees.
 *
 * `themeColor` is what iOS and Android actually honour; `colorScheme: 'dark'` tells the
 * browser the page is dark so it also styles form controls, the scrollbar and any native
 * date picker to match, rather than dropping a white calendar onto a black card.
 *
 * In Next 15 both belong on `viewport`, not `metadata`: setting themeColor on metadata
 * builds fine and silently does nothing.
 */
export const viewport: Viewport = {
  themeColor: '#050506',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // The deck is swiped, and a double tap that zooms mid swipe makes the gesture feel
  // broken. The page has no content that needs pinching.
  maximumScale: 1,
}

// The link's state changes as the creator moves through it, so nothing here may be cached.
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <EnrolmentFlow token={token} />
}
