import type { Metadata, Viewport } from 'next'
import { BriefFlow } from '@/components/brief/BriefFlow'

/**
 * /brief/{token}: the campaign brief a brand fills in. Public, not indexable; the token is
 * the whole authorisation, so a wrong one shows one plain line and nothing else.
 */
export const metadata: Metadata = {
  title: 'Campaign brief · Following',
  description: '',
  robots: { index: false, follow: false, nocache: true },
}

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 }

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <BriefFlow token={token} />
}
