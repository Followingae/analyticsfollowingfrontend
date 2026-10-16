#!/usr/bin/env node
/**
 * THE CLIENT SIDE IS NOT PART OF THE INTERNAL REDESIGN.
 *
 * The internal staff console is being rebuilt from scratch against an external agency's
 * design, with its own tokens and its own components. The brand-facing app - the thing our
 * paying clients log into - is NOT being touched, and the owner's condition for the rebuild
 * was a guarantee to that effect.
 *
 * A promise is not a guarantee. This is the guarantee: the rebuild may not modify any file
 * the client app depends on, and this script refuses the change if it does.
 *
 * Run it against a branch, a commit range, or the working tree:
 *
 *     node scripts/check-client-untouched.mjs                 # staged + unstaged
 *     node scripts/check-client-untouched.mjs main..HEAD      # a range
 *
 * If you have a legitimate reason to touch a protected path (a genuine shared bug fix, not
 * a redesign change), say so explicitly:
 *
 *     ALLOW_CLIENT_CHANGES="src/components/ui/button.tsx" node scripts/check-client-untouched.mjs
 *
 * That is deliberately awkward. It should be.
 */
import { execSync } from 'node:child_process'

/** Everything the brand-facing app renders from. Touch none of it. */
const PROTECTED = [
  // The theme and the scales. The console gets its OWN; these stay as the client's.
  'src/app/globals.css',
  'src/components/ui2/',
  // shadcn as installed. The console may not restyle these out from under the client app.
  'src/components/ui/',
  // Brand-facing route trees.
  'src/app/auth/', 'src/app/billing/', 'src/app/campaigns/', 'src/app/cashback-pool/',
  'src/app/checkout/', 'src/app/creator-analytics/', 'src/app/creators/',
  'src/app/dashboard/', 'src/app/discover/', 'src/app/guide/', 'src/app/how/',
  'src/app/inflink/', 'src/app/invitations/', 'src/app/login/', 'src/app/modules/',
  'src/app/mor/', 'src/app/my-lists/', 'src/app/notifications/', 'src/app/pending-approval/',
  'src/app/pricing/', 'src/app/proposals/', 'src/app/settings/',
  'src/app/shared-influencers/', 'src/app/tv/', 'src/app/unauthorized/', 'src/app/welcome/',
  // Short public link routes: /c /e /l /p /r /s /v
  'src/app/c/', 'src/app/e/', 'src/app/l/', 'src/app/p/', 'src/app/r/', 'src/app/s/',
  'src/app/v/',
  // Brand-only components.
  'src/components/brand/',
]

/**
 * Shared on purpose, and the console still needs them. Listed so nobody "protects" them by
 * accident and so a reader knows the omission was considered rather than missed.
 *
 *   src/hooks/useAdminAccess.ts   who the viewer is and what they may do
 *   src/lib/destinations.ts       one name per destination
 *   src/services/**               the API layer. Presentation changes; data does not.
 *   src/utils/apiInterceptor.ts   auth on every request
 *   src/config/api.ts             where the API lives
 *
 * These may be EXTENDED by the rebuild. They may not be narrowed, and anything removed from
 * them has to be checked against the client app by hand.
 */

const range = process.argv[2]
const cmd = range
  ? `git diff --name-only ${range}`
  : 'git diff --name-only HEAD'

let changed
try {
  changed = execSync(cmd, { encoding: 'utf8' }).split('\n').map(s => s.trim()).filter(Boolean)
} catch (e) {
  console.error('Could not read the diff:', e.message)
  process.exit(2)
}

// Paths come back from the repo root; this script lives in frontend/.
const rel = changed
  .filter(p => p.startsWith('frontend/'))
  .map(p => p.slice('frontend/'.length))

const allowed = (process.env.ALLOW_CLIENT_CHANGES || '')
  .split(/[,\s]+/).map(s => s.trim()).filter(Boolean)

const hits = rel.filter(p =>
  PROTECTED.some(prefix => p === prefix || p.startsWith(prefix)) && !allowed.includes(p))

if (hits.length === 0) {
  console.log(`Client side untouched. ${rel.length} frontend file(s) changed, none protected.`)
  process.exit(0)
}

console.error('\nREFUSING: this change touches the client-facing app.\n')
for (const h of hits) console.error('  ' + h)
console.error(`\n${hits.length} protected file(s). The internal redesign must not modify these.`)
console.error('If the console needs a different button, it gets its own button in its own')
console.error('directory - it does not restyle the one our clients are using.')
console.error('\nIf this is a genuine shared fix, name the files in ALLOW_CLIENT_CHANGES.\n')
process.exit(1)
