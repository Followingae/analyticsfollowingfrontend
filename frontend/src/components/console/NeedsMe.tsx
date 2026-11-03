"use client"

/**
 * Needs you: everything across every live brief that is waiting on the viewer, one row per
 * action. "Price · 8", whose faces, which briefs, and a button that goes and does it. Expand a
 * row for every creator in it.
 *
 * Renders nothing when nothing needs you, and nothing when the read fails: silence is never
 * dressed up as "all clear".
 */
import * as React from "react"
import { useCallback, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { Face, FaceStack, LIME, actionHref, pileHref, usePoll } from "@/components/jobs/jobParts"
import { cn } from "@/lib/utils"
import { jobsApi, type NeedsMeData, type NeedsMeGroup, type NeedsMeItem } from "@/services/jobsApi"

export function NeedsMe({ className }: { className?: string }) {
  const [d, setD] = useState<NeedsMeData | null>(null)
  const load = useCallback(async () => {
    try { setD((await jobsApi.needsMe()).data) } catch { /* keep the last good read */ }
  }, [])
  usePoll(load, 15000)

  if (!d || d.total === 0 || d.groups.length === 0) return null

  return (
    <section className={cn("flex min-w-0 flex-col gap-2 rounded-3xl border bg-background p-3 sm:p-4", className)}>
      <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-1">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          Needs you
          <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums", LIME)}>{d.total}</span>
        </h2>
        <Link href="/work/jobs" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          All jobs<ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex flex-col">
        {d.groups.map(g => <GroupRow key={g.action} g={g} />)}
      </div>
    </section>
  )
}

/** "Brand · Job" for the first two briefs in a pile, and how many more. */
function jobsLine(items: NeedsMeItem[]) {
  const seen = new Map<string, string>()
  for (const it of items) if (!seen.has(it.job_id)) seen.set(it.job_id, it.brand ? `${it.brand} · ${it.job}` : it.job)
  const names = [...seen.values()]
  return names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`
}

function GroupRow({ g }: { g: NeedsMeGroup }) {
  const [open, setOpen] = useState(false)
  const first = g.items[0]
  // Every item in one brief: the pile link can point at that brief's roster as a whole.
  const oneJob = g.items.every(it => it.job_id === first.job_id)
  const href = oneJob ? pileHref(g.action, g.items, first.job_id) : actionHref(first, first.job_id)

  return (
    <div className="rounded-2xl transition-colors hover:bg-muted/40">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-2 py-2.5 sm:flex-nowrap">
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
                className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none">
          <span className="flex min-w-0 shrink-0 items-baseline gap-2 sm:w-56">
            <span className="truncate text-sm font-medium">{g.action}</span>
            <span className="text-sm tabular-nums text-muted-foreground">{g.items.length}</span>
          </span>
          <FaceStack people={g.items} max={4} size={26} />
          <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:block">{jobsLine(g.items)}</span>
          <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform sm:ml-0", open && "rotate-180")} />
        </button>
        <Link href={href}
              className="inline-flex h-8 shrink-0 items-center rounded-full border border-foreground/15 px-3.5 text-xs font-medium transition-colors hover:border-foreground/40 hover:bg-background max-sm:ml-auto">
          Do it
        </Link>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <ul className="flex flex-col gap-0.5 pb-2 pl-2 pr-2 sm:pl-4">
              {g.items.map(it => (
                <li key={`${it.job_id}-${it.username}`}>
                  <Link href={actionHref(it, it.job_id)}
                        className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-background">
                    <Face src={it.avatar} name={it.username} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">@{it.username}</span>
                      <span className="block truncate text-xs text-muted-foreground">{it.brand ? `${it.brand} · ` : ""}{it.job}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
