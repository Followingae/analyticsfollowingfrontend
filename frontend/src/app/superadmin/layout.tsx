import type { Metadata } from "next"
import { ConfirmProvider } from "@/components/console/confirm"

// Production metadata for the entire Superadmin control panel. Server component
// (no "use client") so it can export metadata; it just sets the browser title +
// passes children through to the existing per-page shells.
export const metadata: Metadata = {
  title: {
    default: "Superadmin | Following",
    template: "%s | Superadmin | Following",
  },
  description: "Following control panel for clients, campaigns, and the Following App.",
  robots: { index: false, follow: false },
}

/**
 * The confirmation host lives HERE, above every page in the tree, and not only inside the
 * page shells.
 *
 * WHY. `useConfirm()` fails closed on anything consequential when there is no provider above
 * it, which is the right way round: a money action that silently proceeds because a provider
 * was missing is the bug you find after the transfer. But it has a sharp edge. The shells
 * (`SuperadminLayout`, `SuperAdminInterface`) mount the provider themselves, so a page
 * component that CALLS the hook and then RENDERS the shell is above its own provider. The
 * hook fails closed, and the money dialog never opens: you press "Release AED 31,500" and
 * nothing at all happens.
 *
 * Nine pages were shaped that way, including ones converted today. Fixing each by hoisting
 * its body into a child component works and is whack-a-mole across 82 pages, forever, with
 * silence as the failure mode.
 *
 * A route layout is above every page in its tree by construction, so the page's internal
 * shape stops mattering. The shells keep their own providers for screens outside these two
 * trees; nesting is harmless, the innermost context wins and the outer host simply never has
 * anything pending.
 */
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>
}
