import { redirect } from 'next/navigation'

// "Creator Analytics" is the breadcrumb above every creator's page, and it led to an
// address with nothing at it (a 404, and a failed prefetch on every analytics page).
// The list of creators an account has is /creators, so the crumb goes there.
export default function CreatorAnalyticsIndex() {
  redirect('/creators')
}
