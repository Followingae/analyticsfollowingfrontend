import type { Metadata } from 'next'
import { FeedbackBoard } from '@/components/board/FeedbackBoard'

/**
 * /b/{slug}: the team feedback board. Public, not indexable.
 *
 * The slug is the only authorisation, so the page must not render a preview or a title
 * that says what sits behind it. A wrong slug shows one plain line and nothing else.
 */
export const metadata: Metadata = {
  title: 'Following',
  description: '',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <FeedbackBoard slug={slug} />
}
