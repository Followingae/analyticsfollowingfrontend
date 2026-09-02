/**
 * Screen 5 — Campaign workspace, brand view.
 *
 * The internal deliverable ladder has eight rungs (services/ladderApi.ts). Four of them
 * are ours, not the brand's: rate_agreed, contracted and paid are money and paperwork
 * between us and the creator, and enrolled is a queue state. Showing a brand eight rungs
 * would be showing them our operations and, in three of those rungs, our money.
 *
 * So the brand sees four, written from their side: Briefed, Submitted, Approved, Live.
 * That reduction is also what makes rule 3 structural on this screen — the rungs that
 * carry a cost are not in the `WorkStep` union, so there is no cell to leak one into.
 *
 * Submissions are user-uploaded photographs and video stills, which is why every one is
 * rendered through `CreatorPhoto`: text goes under the image on a solid surface, never
 * over it. That component takes no children, so a caption cannot end up on the picture.
 */
"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { toast } from "sonner"
import { ArrowLeft, Check, ClipboardList, ExternalLink, MessageSquareWarning } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui2/empty"

import {
  runApi,
  DELIVERABLE_LABELS,
  WORK_STEPS,
  type WorkItem,
  type WorkStep,
  type Workspace,
} from "@/services/runApi"
import { StateView, FailedState, LoadingState, useAsync } from "@/components/run/async-state"
import { CreatorPhoto } from "@/components/run/creator-photo"
import { Money, Num } from "@/components/run/value"
import { PAGE_SHELL, PAGE_STACK } from "@/components/run/scale"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function dueTone(item: WorkItem): { label: string; className: string } | null {
  if (!item.due_at) return null
  if (item.step === "approved" || item.step === "live") return null
  const due = new Date(item.due_at).getTime()
  const days = Math.ceil((due - Date.now()) / 86_400_000)
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: "text-destructive" }
  if (days <= 2) return { label: `Due in ${days}d`, className: "text-amber-600" }
  return { label: `Due ${formatDate(item.due_at)}`, className: "text-muted-foreground" }
}

function WorkCard({
  item,
  onApprove,
  onRequestChange,
}: {
  item: WorkItem
  onApprove: (item: WorkItem) => void
  onRequestChange: (item: WorkItem) => void
}) {
  const due = dueTone(item)
  const waitingOnBrand = item.step === "submitted"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {/*
        The submission. Caption and meta render BELOW the image on bg-card — this
        component accepts no children, so nothing can be laid over the photograph.
      */}
      <CreatorPhoto
        src={item.submission_url}
        alt={`Submission from @${item.username}`}
        aspect="portrait"
        caption={`@${item.username}`}
        meta={
          <>
            {item.quantity}× {DELIVERABLE_LABELS[item.deliverable] ?? item.deliverable}
            {item.submitted_at && ` · submitted ${formatDate(item.submitted_at)}`}
          </>
        }
      />

      <div className="flex flex-col gap-3 px-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {due ? (
            <span className={cn("text-ds-caption", due.className)}>{due.label}</span>
          ) : (
            <span className="text-ds-caption text-muted-foreground">
              {item.step === "live" && item.posted_at
                ? `Live since ${formatDate(item.posted_at)}`
                : ""}
            </span>
          )}
          <Money fils={item.price_fils} className="text-ds-caption text-muted-foreground" />
        </div>

        {item.change_reason && (
          <p className="text-ds-body-sm text-muted-foreground border-s-2 border-amber-500/40 ps-3">
            You asked for a change: {item.change_reason}
          </p>
        )}

        {waitingOnBrand && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="rounded-ds-control" onClick={() => onApprove(item)}>
              <Check /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-ds-control"
              onClick={() => onRequestChange(item)}
            >
              <MessageSquareWarning /> Request a change
            </Button>
          </div>
        )}

        {item.step === "live" && item.posted_url && (
          <Button asChild size="sm" variant="outline" className="rounded-ds-control w-fit">
            <a href={item.posted_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> See the post
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function Column({
  step,
  items,
  onApprove,
  onRequestChange,
}: {
  step: (typeof WORK_STEPS)[number]
  items: WorkItem[]
  onApprove: (item: WorkItem) => void
  onRequestChange: (item: WorkItem) => void
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 border-b pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-ds-label">{step.label}</h2>
          <Badge variant="secondary" className="rounded-ds-control tabular-nums font-normal">
            {items.length}
          </Badge>
        </div>
        <p className="text-ds-caption text-muted-foreground">{step.blurb}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-ds-caption text-muted-foreground py-6 text-center">Nothing here.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {items.map((item) => (
            <WorkCard
              key={item.id}
              item={item}
              onApprove={onApprove}
              onRequestChange={onRequestChange}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function WorkspaceScreen({ briefId, campaignId }: { briefId: string; campaignId: string }) {
  const [changeFor, setChangeFor] = React.useState<WorkItem | null>(null)
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const { state, reload } = useAsync(
    () => runApi.getWorkspace(campaignId),
    [campaignId],
    (data) => data.workspace.items.length === 0
  )

  const approve = async (item: WorkItem) => {
    try {
      await runApi.approve(campaignId, item.id)
      toast.success(`Approved @${item.username}`)
      reload()
    } catch (error) {
      toast.error("We could not approve that", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  const submitChange = async () => {
    if (!changeFor || !reason.trim()) return
    setBusy(true)
    try {
      await runApi.requestChange(campaignId, changeFor.id, reason.trim())
      toast.success("Sent back", { description: "The creator has your reason." })
      setChangeFor(null)
      setReason("")
      reload()
    } catch (error) {
      toast.error("We could not send that back", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setBusy(false)
    }
  }

  const byStep = (workspace: Workspace, step: WorkStep) =>
    workspace.items.filter((item) => item.step === step)

  return (
    <div className={PAGE_SHELL}>
      <div className={PAGE_STACK}>
        <Button asChild variant="ghost" size="sm" className="rounded-ds-control -ms-2 w-fit">
          <Link href={`/run/${briefId}`}>
            <ArrowLeft /> Back to the brief
          </Link>
        </Button>

        <StateView
          state={state}
          loading={() => <LoadingState label="Loading the campaign" />}
          failed={(error) => (
            <FailedState error={error} onRetry={reload} what="load this campaign" />
          )}
          empty={() => (
            <Empty className="border-border rounded-ds-surface border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>Nothing to show yet</EmptyTitle>
                <EmptyDescription>
                  The creators are briefed. Their work appears here as they submit it.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          ready={({ workspace }) => {
            const waiting = byStep(workspace, "submitted").length
            return (
              <>
                <header className="flex flex-col gap-2">
                  <h1 className="text-ds-title">{workspace.name}</h1>
                  <p className="text-ds-body text-muted-foreground">
                    <Num value={workspace.items.length} /> pieces of work.{" "}
                    {waiting > 0
                      ? `${waiting} waiting on you.`
                      : "Nothing is waiting on you right now."}
                  </p>
                </header>

                {/* Mobile: four stacked sections. Desktop: four real columns. */}
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
                  {WORK_STEPS.map((step) => (
                    <Column
                      key={step.key}
                      step={step}
                      items={byStep(workspace, step.key)}
                      onApprove={approve}
                      onRequestChange={(item) => {
                        setChangeFor(item)
                        setReason("")
                      }}
                    />
                  ))}
                </div>
              </>
            )
          }}
        />
      </div>

      {/* A change request without a reason is not a change request. */}
      <Dialog open={Boolean(changeFor)} onOpenChange={(open) => !open && setChangeFor(null)}>
        <DialogContent className="rounded-ds-overlay">
          <DialogHeader>
            <DialogTitle>What needs to change?</DialogTitle>
            <DialogDescription>
              @{changeFor?.username} sees this word for word, so be specific. They cannot
              act on "not quite right".
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            autoFocus
            placeholder="The logo is cut off in the first three seconds. Can you reframe it?"
            className="rounded-ds-field"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setChangeFor(null)} className="rounded-ds-control">
              Cancel
            </Button>
            <Button
              onClick={submitChange}
              disabled={busy || reason.trim().length === 0}
              className="rounded-ds-control"
            >
              Send it back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WorkspaceInner() {
  const params = useParams<{ briefId: string }>()
  const search = useSearchParams()
  const campaignId = search.get("campaign") ?? ""
  if (!campaignId) {
    return (
      <div className={PAGE_SHELL}>
        <FailedState
          error="No campaign was named in the link."
          what="open this campaign"
        />
      </div>
    )
  }
  return <WorkspaceScreen briefId={params.briefId} campaignId={campaignId} />
}

export default function RunWorkspacePage() {
  return (
    <AuthGuard>
      <BrandUserInterface>
        <React.Suspense fallback={<LoadingState />}>
          <WorkspaceInner />
        </React.Suspense>
      </BrandUserInterface>
    </AuthGuard>
  )
}
