"use client"

/**
 * A proposal, from the client's side.
 *
 * While it is open with them this is the plan builder: a wall of the creators our talent
 * team shortlisted, our recommendation with its reasons, and a budget that fills rather
 * than merely fits. Once it is confirmed or closed there is nothing left to build, so it
 * becomes the record of what was agreed.
 */
import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Calendar, Users, Check, Construction, ArrowLeft } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/contexts/NotificationContext"
import { cdnAvatar } from "@/lib/avatar"
import { brandProposalViewApi, type BrandProposalView } from "@/services/adminProposalMasterApi"
import { PlanBuilder } from "@/components/proposals/plan/PlanBuilder"
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge"
import { getStockImage } from "@/components/proposals/proposal-utils"

const OPEN_STATUSES = ["sent", "in_review", "more_requested"]

function ProposalPage() {
  const proposalId = useParams<{ proposalId: string }>().proposalId
  const router = useRouter()
  const { markReadByReference } = useNotifications()
  const [data, setData] = useState<BrandProposalView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await brandProposalViewApi.getDetail(proposalId)
      setData(res)
      markReadByReference("proposal", proposalId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this proposal")
    } finally {
      setLoading(false)
    }
  }, [proposalId])   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (proposalId) load() }, [proposalId, load])

  if (loading) {
    return (
      <BrandUserInterface>
        <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-[22px]" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_356px]">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-4">
              {Array.from({ length: 6 }).map((_, n) => <Skeleton key={n} className="aspect-[3/4] rounded-[20px]" />)}
            </div>
            <Skeleton className="h-64 rounded-[20px]" />
          </div>
        </div>
      </BrandUserInterface>
    )
  }

  if (error || !data) {
    return (
      <BrandUserInterface>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <p className="text-destructive">{error || "Proposal not found"}</p>
          <Button variant="outline" onClick={load}>Try again</Button>
        </div>
      </BrandUserInterface>
    )
  }

  /* The team is mid-edit. The API serves no creators at all in this state, so this screen
     is what there is — not a cover over data that was sent anyway. */
  if (data.proposal?.work_in_progress) {
    return (
      <BrandUserInterface>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md space-y-5 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-amber-500/10">
              <Construction className="size-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">We&apos;re still working on this</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {data.proposal.work_in_progress_note
                || "Our team is putting the finishing touches to this proposal. We'll let you know the moment it's ready."}
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={load}>Check again</Button>
              <Button variant="ghost" onClick={() => router.push("/proposals")}>All proposals</Button>
            </div>
          </div>
        </div>
      </BrandUserInterface>
    )
  }

  const p = data.proposal
  const open = OPEN_STATUSES.includes(p.status)
  const days = p.deadline_at
    ? Math.max(0, Math.ceil((new Date(p.deadline_at).getTime() - Date.now()) / 86_400_000))
    : null

  return (
    <BrandUserInterface>
      <div className="mx-auto max-w-[1440px] px-6 pt-6">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={p.cover_image_url || getStockImage(p.id)}
            alt=""
            className="h-44 w-full object-cover md:h-48"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">{p.campaign_name}</p>
            <h1 className="text-2xl font-bold leading-[1.1] tracking-tight text-white md:text-3xl">{p.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <ProposalStatusBadge status={p.status} />
              {days !== null && open && (
                <Badge variant="outline" className="border-white/20 bg-white/10 text-xs text-white backdrop-blur-sm">
                  <Calendar className="mr-1 size-3" />{days > 0 ? `${days} days to respond` : "Past deadline"}
                </Badge>
              )}
              <Badge variant="outline" className="border-white/20 bg-white/10 text-xs text-white backdrop-blur-sm">
                <Users className="mr-1 size-3" />{data.summary?.total_influencers ?? data.influencers.length} creators
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <PlanBuilder proposalId={proposalId} data={data} onReload={load} />
      ) : (
        /* Settled. What stands is the roster they agreed — per-creator prices come off. */
        <div className="mx-auto max-w-[1440px] px-6 py-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="size-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {p.status === "approved"
                ? "This campaign is confirmed"
                : p.status === "client_confirmed"
                  ? "Thank you, that's confirmed"
                  : "Sent back to the team"}
            </h2>
            {(p as { agreed_total_aed?: number }).agreed_total_aed != null && (
              <p className="text-muted-foreground">
                Agreed total AED {Number((p as { agreed_total_aed?: number }).agreed_total_aed).toLocaleString("en-US")}
              </p>
            )}
            {p.status === "client_confirmed" && (
              <p className="text-sm text-muted-foreground">
                Our team is setting your campaign up now and will be in touch shortly.
              </p>
            )}
          </div>
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {data.influencers.filter(c => c.selected_by_user).map(c => (
              <div key={c.id} className="relative overflow-hidden rounded-2xl border">
                <img src={cdnAvatar(c.profile_image_url || undefined)} alt="" className="aspect-[3/3.6] w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 text-[11.5px] font-bold text-white">
                  {c.full_name || c.username}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => router.push("/proposals")}>
              <ArrowLeft className="mr-2 size-4" />All proposals
            </Button>
          </div>
        </div>
      )}
    </BrandUserInterface>
  )
}

export default function Page() {
  return (
    <AuthGuard requireAuth>
      <ProposalPage />
    </AuthGuard>
  )
}
