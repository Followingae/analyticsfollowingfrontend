import type { Metadata } from "next"

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

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
