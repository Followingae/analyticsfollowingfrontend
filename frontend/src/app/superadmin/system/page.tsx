"use client"

/**
 * System — the front door to the plumbing.
 *
 * A hub is the name of a place, not a dashboard, so this is a list of the jobs you can do
 * here and nothing else. It used to be a grid of cards, each with a large icon in a tinted
 * rounded tile picked from a raw Tailwind palette step (cyan-100, emerald-900/40) that the
 * theme does not know about — colour as decoration, on the one screen where colour has
 * nothing to say. The tiles and the cards are gone; the destination's name and the line
 * under it carry it, separated by a hairline the way any list of the same thing is.
 */

import Link from "next/link"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { PageHead } from "@/components/console/primitives"
import { ChevronRight, Monitor, Workflow } from "lucide-react"

export const dynamic = 'force-dynamic'

const systemSections = [
  // Currency card removed: the page called a removed currencyService (crashed on
  // mount) and per-team currency is obsolete under the AED-everywhere model.
  {
    title: "Job queue",
    description: "Post analytics jobs that have been processing or queued for too long, and worker health.",
    href: "/superadmin/system/jobs",
    icon: Workflow,
  },
  {
    title: "Office screens",
    description: "The TV wall and any other screen we hang: what it shows, how often it refreshes.",
    href: "/superadmin/system/displays",
    icon: Monitor,
  },
]

export default function SuperadminSystemPage() {
  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <PageHead
          title="System"
          sub="The platform's own plumbing: what the workers are doing, and what the office screens are showing."
        />

        <div className="divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.07] dark:border-white/[0.07]">
          {systemSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group -mx-ds-2 flex items-center gap-ds-3 rounded-ds-lg px-ds-2 py-ds-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-ds-label">{section.title}</p>
                  <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">{section.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            )
          })}
        </div>
      </div>
    </SuperadminLayout>
  )
}
