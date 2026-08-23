"use client"

/**
 * Smart pick — the ask, then the faces.
 *
 * This stands between a client and "send me different people" when they have not actually
 * read the list. It is one question and six faces, because everything a client needs to
 * reconsider is a face and a number rather than a paragraph.
 *
 * Reading a creator here counts toward their coverage, so looking and qualifying are the
 * same act instead of two chores — and asking for more only unlocks once they have.
 */
import { useState } from "react"
import { Sparkles, Check, Plus, ArrowRight, X, Instagram, Users, Heart } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SiriOrb } from "@/components/siri-orb"
import { cn } from "@/lib/utils"
import { cdnAvatar } from "@/lib/avatar"
import type { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { creatorCost, whyFor } from "./optimiser"

const fmt = (n?: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`
const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  picks: BrandInfluencer[]
  pool: BrandInfluencer[]
  showPricing: boolean
  covered: boolean
  chosenIds: Set<string>
  onAdd: (c: BrandInfluencer) => void
  onRemove: (c: BrandInfluencer) => void
  onRead: (c: BrandInfluencer) => void
  onUseLineup: () => void
  onAskAnyway: () => void
}

export function SmartPickModal({
  open, onOpenChange, picks, pool, showPricing, covered,
  chosenIds, onAdd, onRemove, onRead, onUseLineup, onAskAnyway,
}: Props) {
  const [i, setI] = useState<number | null>(null)   // null = the ask, number = a face
  const [seenAll, setSeenAll] = useState(false)

  const close = () => { onOpenChange(false); setI(null) }
  const show = (n: number) => { setI(n); onRead(picks[n]) }
  const next = () => {
    const n = (i ?? 0) + 1
    if (n >= picks.length) { setSeenAll(true); setI(null); return }
    show(n)
  }

  const c = i == null ? null : picks[i]
  const why = c ? whyFor(c, pool) : null
  const inPlan = c ? chosenIds.has(c.id) : false
  const done = seenAll || covered

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => (v ? onOpenChange(v) : close())}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[880px] overflow-hidden p-0 sm:max-w-[880px]"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {c === null ? (
          /* ---------- the ask ---------- */
          <div className="grid animate-in fade-in duration-200 md:grid-cols-[300px_minmax(0,1fr)]">
            <div className="grid place-items-center border-b bg-gradient-to-br from-primary/15 to-transparent p-11 md:border-b-0 md:border-r">
              <SiriOrb size="190px" animationDuration={18} className="drop-shadow-2xl" />
            </div>
            <div className="p-9 md:p-11">
              <h2 className="text-[30px] font-extrabold leading-[1.1] tracking-[-0.035em]">
                {done ? "Shall we go with these?" : "Are you sure?"}
              </h2>
              <p className="mt-2.5 max-w-[38ch] text-[14.5px] leading-relaxed text-muted-foreground">
                {done
                  ? `That is all ${picks.length}, read. ${picks.filter(p => chosenIds.has(p.id)).length} now in your line-up.`
                  : "Our talent team built this list for your brief. These are the ones we would book."}
              </p>

              <div className="my-7 flex">
                {picks.map((p, n) => (
                  <button
                    key={p.id}
                    onClick={() => show(n)}
                    title={p.full_name || p.username}
                    className="-ml-3.5 rounded-full transition first:ml-0 hover:z-10 hover:-translate-y-1.5 hover:scale-105"
                  >
                    <img
                      src={cdnAvatar(p.profile_image_url || undefined)}
                      alt={`@${p.username}`}
                      className="size-[58px] rounded-full object-cover ring-[3px] ring-card"
                    />
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {done ? (
                  <Button size="lg" onClick={onUseLineup} className="gap-2">
                    <Check className="size-4" />Use this line-up
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => show(0)} className="gap-2">
                    <Sparkles className="size-4" />Show me them
                  </Button>
                )}
                <Button
                  variant="ghost"
                  disabled={!done}
                  title={done ? undefined : "Have a look at them first"}
                  onClick={onAskAnyway}
                >
                  {done ? "Still send me different creators" : "Send me different creators"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ---------- one creator at a time ---------- */
          <div key={c.id} className="grid animate-in fade-in duration-200 md:grid-cols-[320px_minmax(0,1fr)]">
            <div className="relative">
              <img
                src={cdnAvatar(c.profile_image_url || undefined)}
                alt=""
                className="h-full min-h-[240px] w-full object-cover md:min-h-[380px]"
              />
            </div>
            <div className="flex flex-col justify-center p-9 md:p-11">
              <span className="text-[11.5px] font-semibold text-muted-foreground">{i! + 1} / {picks.length}</span>
              <div className="mt-1.5 flex items-center gap-2.5">
                <h2 className="text-[27px] font-extrabold leading-[1.1] tracking-[-0.035em]">{c.full_name || c.username}</h2>
                {c.username && (
                  <a
                    href={`https://instagram.com/${c.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`@${c.username} on Instagram`}
                    className="grid size-8 shrink-0 place-items-center rounded-[9px] border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Instagram className="size-4" />
                  </a>
                )}
              </div>

              {why && (
                <span className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
                  <Sparkles className="size-3" />{why.title}
                </span>
              )}

              <div className="my-6 flex gap-7">
                <div>
                  <b className="block text-[21px] font-bold tracking-[-0.03em]">{fmt(c.followers_count)}</b>
                  <span className="text-[11px] text-muted-foreground">followers</span>
                </div>
                <div>
                  <b className="block text-[21px] font-bold tracking-[-0.03em]">
                    {(c.measured?.engagement_rate ?? c.engagement_rate ?? 0).toFixed(2)}%
                  </b>
                  <span className="text-[11px] text-muted-foreground">engagement</span>
                </div>
                {showPricing && creatorCost(c) > 0 && (
                  <div>
                    <b className="block text-[21px] font-bold tracking-[-0.03em]">{aed(creatorCost(c))}</b>
                    <span className="text-[11px] text-muted-foreground">all in</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {inPlan ? (
                  <Button size="lg" variant="outline" className="gap-2" onClick={() => onRemove(c)}>
                    <Check className="size-4" />In your line-up
                  </Button>
                ) : (
                  <Button size="lg" className="gap-2" onClick={() => { onAdd(c); setTimeout(next, 620) }}>
                    <Plus className="size-4" />Add
                  </Button>
                )}
                <Button variant="ghost" className="gap-2" onClick={next}>
                  {i! + 1 < picks.length ? "Next" : "Done"}<ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
