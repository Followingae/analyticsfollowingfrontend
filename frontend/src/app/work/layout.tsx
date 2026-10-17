import type { Metadata } from "next"
import { ConfirmProvider } from "@/components/console/confirm"

/**
 * The /work tree's layout, and the confirmation host for it.
 *
 * WHY THIS FILE EXISTS AT ALL. Most of `/work/*` is rewritten to `/superadmin/*` by
 * `next.config.ts`, so those routes get the superadmin layout. But a list of segments is
 * deliberately EXCLUDED from that rewrite and served from `src/app/work/**` directly:
 * areas, brands, chasing, coverage, creators, enrolments, goals, guide, inbox, manual, money,
 * payables, payouts, pipeline, sourcing, team, today. Those had no layout above them except
 * the root one, which is how the money screens ended up with no confirmation host.
 *
 * WHY THE PROVIDER IS HERE. `useConfirm()` fails closed with no provider above it, which is
 * correct: a money action that silently proceeds because a provider was missing is the bug
 * you find after the transfer. The sharp edge is that the page shells mount the provider
 * themselves, so a page that CALLS the hook and then RENDERS the shell sits above its own
 * provider. The hook fails closed and the dialog never opens: you press "Release AED 31,500"
 * and nothing happens, with no error.
 *
 * `/work/payables` and `/work/payouts` are both in the excluded list above. Both move money.
 *
 * A route layout is above every page in its tree by construction, so a page's internal shape
 * stops mattering and the failure cannot come back. The shells keep their own providers for
 * screens outside these trees; nesting is harmless, the innermost context wins.
 */
export const metadata: Metadata = {
  title: {
    default: "Work | Following",
    template: "%s | Following",
  },
  robots: { index: false, follow: false },
}

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>
}
