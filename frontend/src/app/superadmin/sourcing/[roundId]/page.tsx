import { redirect } from 'next/navigation'

// Moved out of /superadmin — see the note in ../page.tsx.
export default async function Moved({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params
  redirect(`/work/sourcing/${roundId}`)
}
