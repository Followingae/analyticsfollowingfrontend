import { redirect } from 'next/navigation'

// Moved out of /superadmin, like the rest of these screens: the manual is the whole team's,
// not the founders'. Kept as a redirect so links already sent in messages still land.
export default function Moved() { redirect('/work/guide') }
