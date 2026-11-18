import type { Metadata } from 'next'
import { SetPassword } from './SetPassword'

/**
 * /merchant/welcome/{token}: the merchant sets a password and lands on their home.
 *
 * Public, not indexable. The token is the only authorisation, so a link pasted
 * somewhere must not render a preview that says whose account it opens.
 */
export const metadata: Metadata = {
  title: 'Following',
  description: '',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <SetPassword token={token} />
}
