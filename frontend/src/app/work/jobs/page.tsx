"use client"

/**
 * Jobs: every live brand brief on one screen. A card per brief: whose it is, where its
 * creators sit across Find to Paid, how many need you, and what is running on it right now.
 * Briefs that need you come first. A card opens the Job.
 */
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { FileText, Megaphone } from "lucide-react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import {
  Chip, InfoTip, LiveLine, LoadFailed, Spinner, StageRail, WHO_SHORT, dueChip, usePoll,
} from "@/components/jobs/jobParts"
import { jobsApi, type JobSummary, type Who } from "@/services/jobsApi"

const OTHERS: Who[] = ["client", "creator", "scout", "founder", "talent"]

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobSummary[] | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      setJobs((await jobsApi.list()).data.jobs)
      setFailed(false)
    } catch {
      // Keep what we last showed; only say so when there was never anything to show.
      setFailed(true)
    }
  }, [])
  usePoll(load, 15000)

  const [mine, rest] = useMemo(() => {
    const all = jobs || []
    return [all.filter(j => j.needs_me > 0), all.filter(j => j.needs_me === 0)]
  }, [jobs])
  const needTotal = mine.reduce((n, j) => n + j.needs_me, 0)

  return (
    <SuperadminLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-24">
        <header className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-ds-title">Jobs</h1>
            <InfoTip>Every live brief, from the first creator found to the last one paid. Briefs that need you come first.</InfoTip>
          </div>
          {needTotal > 0 && <Chip tone="lime" className="h-7 px-3 text-sm">{needTotal} need you</Chip>}
        </header>

        {!jobs ? (failed ? <LoadFailed onRetry={load} /> : <Spinner />) : (
          <>
            {mine.length > 0 && (
              <Section label="Needs you" count={mine.length}>
                {mine.map((j, i) => <JobCard key={j.id} j={j} i={i} />)}
              </Section>
            )}
            {rest.length > 0 && (
              <Section label={mine.length ? "Moving without you" : "Live"} count={rest.length}>
                {rest.map((j, i) => <JobCard key={j.id} j={j} i={i} />)}
              </Section>
            )}
          </>
        )}
      </div>
    </SuperadminLayout>
  )
}

function Section({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        {label}<span className="tabular-nums text-muted-foreground/70">{count}</span>
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div>
    </section>
  )
}

function JobCard({ j, i }: { j: JobSummary; i: number }) {
  const due = dueChip(j.due_at)
  const waiting = OTHERS
    .map(w => ({ w, n: j.waiting_on[w] || 0 }))
    .filter(x => x.n > 0 && !(x.w === "founder" || x.w === "talent"))
    .slice(0, 2)
  const proposal = j.proposals[0]
  const moreProposals = j.proposals.length - 1

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex min-w-0 flex-col gap-4 rounded-3xl border bg-background p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-[0_12px_28px_-18px_rgba(16,20,12,0.25)] sm:p-5"
    >
      {/* The whole card opens the Job; the small links inside sit above this layer. */}
      <Link href={`/work/jobs/${j.id}`} aria-label={`Open ${j.brand ? `${j.brand} ` : ""}${j.name}`}
            className="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />

      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          {j.brand && <p className="truncate text-xs text-muted-foreground">{j.brand}</p>}
          <h2 className="truncate text-base font-semibold leading-snug tracking-[-0.01em]">{j.name}</h2>
        </div>
        {j.needs_me > 0 && <Chip tone="lime">{j.needs_me} need you</Chip>}
      </div>

      <StageRail stages={j.stages} />

      {(j.live.length > 0 || proposal || j.campaign || waiting.length > 0 || due) && (
        <div className="flex min-w-0 flex-col gap-3">
          <LiveLine lines={j.live} className="pointer-events-none" />
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {proposal && (
              <SmallLink href={`/work/proposals/${proposal.id}`} icon={FileText}>
                {moreProposals > 0 ? `Proposals · ${j.proposals.length}` : "Proposal"}
              </SmallLink>
            )}
            {j.campaign && <SmallLink href={`/work/campaigns/${j.campaign.id}`} icon={Megaphone}>Campaign</SmallLink>}
            <span className="flex-1" />
            {waiting.map(x => <Chip key={x.w}>{WHO_SHORT[x.w]} {x.n}</Chip>)}
            {due && <Chip tone={due.late ? "warn" : "outline"}>{due.text}</Chip>}
          </div>
        </div>
      )}
    </motion.article>
  )
}

function SmallLink({ href, icon: Icon, children }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Link href={href}
          className="relative z-10 inline-flex h-6 items-center gap-1 rounded-full border bg-background px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
      <Icon className="h-3 w-3" />{children}
    </Link>
  )
}
