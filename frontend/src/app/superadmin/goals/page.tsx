import { redirect } from 'next/navigation'

// Moved out of /superadmin: these screens are the whole team's, not the founders'.
// Kept as a redirect so links already sent in alerts and emails still land.
export default function Moved() { redirect('/work/goals') }
