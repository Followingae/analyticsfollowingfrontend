"use client"

/**
 * Column 1, Brief and fit: the open call creators read, the goal for this round, who fits
 * (the criteria, editable in place, and how many in our WhatsApp network match), and whether
 * found creators are DMed on their own or wait for a person.
 */
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Loader2, RotateCcw, Target } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { OpenCall } from "@/services/openCallsApi"
import { scoutApi, type ScoutCampaign, type ScoutCriteria, type ScoutGoal, type ScoutRosterPlan } from "@/services/scoutApi"
import { OpenCallCard } from "./OpenCallCard"
import { Bar, ChipGroup, Face, FollowerRange, criteriaSentence, langName } from "./outreachParts"
import { compact } from "./WorkerPill"

export type RosterGoal = { goal: ScoutGoal | null; need: number | null; suggested_target: number | null; funnel: Record<string, number> }

function Block({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </div>
  )
}

function Goal({ listId, campaign, roster, canEdit, onChanged }: {
  listId: string; campaign: ScoutCampaign | undefined; roster: RosterGoal | null; canEdit: boolean; onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const g = roster?.goal && roster.goal.status !== "done" ? roster.goal : null
  const lastDone = roster?.goal && roster.goal.status === "done" ? roster.goal : null
  const relevant = campaign?.funnel.relevant ?? roster?.funnel.relevant ?? 0
  const target = g?.target || 0
  const start = async () => {
    setBusy(true)
    try {
      const r = await scoutApi.createGoal({ scope: "roster", list_id: listId })
      toast.success(`Scout is on it: ${r.data.target} relevant applicants`)
      onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Block title="This round">
      <div className="flex items-end justify-between gap-3">
        <p className="whitespace-nowrap">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">{relevant.toLocaleString()}</span>
          {target ? <span className="text-lg tabular-nums text-muted-foreground"> / {target.toLocaleString()}</span> : null}
        </p>
        <p className="text-right text-xs text-muted-foreground">relevant applicants{g ? ` · round ${g.round_no}` : ""}</p>
      </div>
      {target ? <Bar value={relevant} target={target} className="h-1.5" /> : null}
      {canEdit && !g && (
        <Button size="sm" className="gap-1.5 self-start rounded-full bg-[#d3ff02] text-[#111] hover:bg-[#c4ef00]" disabled={busy} onClick={start}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : lastDone ? <RotateCcw className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
          {lastDone ? "Run another round" : `Find ${roster?.suggested_target ? roster.suggested_target.toLocaleString() + " " : ""}relevant applicants`}
        </Button>
      )}
      {!canEdit && !g && <p className="text-xs text-muted-foreground">No round running. A founder starts one.</p>}
    </Block>
  )
}

function WhoFits({ listId, plan, canEdit, onSaved }: { listId: string; plan: ScoutRosterPlan; canEdit: boolean; onSaved: () => void }) {
  const [c, setC] = useState<ScoutCriteria>(plan.criteria)
  const [saving, setSaving] = useState(false)
  const dirty = useRef(false)
  const seq = useRef(0)
  useEffect(() => { if (!dirty.current) setC(plan.criteria) }, [plan.criteria])
  useEffect(() => {
    if (!dirty.current) return
    const my = ++seq.current
    setSaving(true)
    const t = setTimeout(async () => {
      try {
        await scoutApi.setCriteria(listId, c)
        if (my === seq.current) { dirty.current = false; onSaved() }
      } catch (e) { toast.error((e as Error).message) } finally { if (my === seq.current) setSaving(false) }
    }, 500)
    return () => clearTimeout(t)
  }, [c, listId, onSaved])
  const edit = (p: Partial<ScoutCriteria>) => { dirty.current = true; setC(prev => ({ ...prev, ...p })) }
  const o = plan.criteria_options
  const { matching, already_alerted, sample } = plan.contacts
  const noCeiling = !c.max_followers

  return (
    <Block title="Who fits" aside={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}>
      <p className="text-sm">{criteriaSentence(c)}</p>
      {noCeiling ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          No ceiling: an account of any size can be messaged. {canEdit ? "Set a maximum below." : "Ask a founder to set a maximum."}
        </p>
      ) : plan.criteria_default_ceiling ? (
        <p className="text-xs text-muted-foreground">Barter default: up to {compact(c.max_followers)} followers until someone sets their own.</p>
      ) : null}
      {canEdit && (
        <div className="flex flex-col gap-2 rounded-xl bg-muted/30 p-3">
          <FollowerRange c={c} onChange={edit} />
          <ChipGroup label="City" options={o.cities} value={c.cities} onChange={v => edit({ cities: v })} format={s => s.split(",")[0]} />
          <ChipGroup label="Category" options={o.categories} value={c.categories} onChange={v => edit({ categories: v })} capitalize />
          <ChipGroup label="Language" options={o.languages} value={c.languages} onChange={v => edit({ languages: v })} format={langName} />
        </div>
      )}
      <div className="flex items-center gap-3">
        {sample.length > 0 && (
          <div className="flex -space-x-2">
            {sample.slice(0, 5).map(s => <Face key={s.username} c={s} size={28} ring />)}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{matching.toLocaleString()}</span> in our WhatsApp network fit
          {already_alerted > 0 && <>, <span className="tabular-nums">{already_alerted.toLocaleString()}</span> already alerted</>}
        </p>
      </div>
    </Block>
  )
}

function DmMode({ listId, plan, canEdit, onChanged }: { listId: string; plan: ScoutRosterPlan; canEdit: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const flip = async (v: boolean) => {
    setBusy(true)
    try { await scoutApi.setAutoDm(listId, v); onChanged() }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Block title="New creators the search finds" aside={canEdit ? <Switch checked={plan.auto_dm} disabled={busy} onCheckedChange={flip} aria-label="DM found creators automatically" /> : null}>
      <p className="text-sm">{plan.auto_dm ? "Are DMed on their own, at the bot's pace." : "Wait in Reach until a person approves each one."}</p>
    </Block>
  )
}

export function BoardBrief({ listId, campaign, plan, roster, oc, ocLoaded, canEdit, isSuperadmin, onChanged }: {
  listId: string; campaign: ScoutCampaign | undefined; plan: ScoutRosterPlan | null; roster: RosterGoal | null
  oc: OpenCall | null; ocLoaded: boolean; canEdit: boolean; isSuperadmin: boolean; onChanged: () => void
}) {
  return (
    <>
      <OpenCallCard listId={listId} brand={campaign?.brand} oc={oc} loaded={ocLoaded} isSuperadmin={isSuperadmin} isFounder={canEdit} onChanged={onChanged} />
      <Goal listId={listId} campaign={campaign} roster={roster} canEdit={canEdit} onChanged={onChanged} />
      {plan ? (
        <>
          <WhoFits listId={listId} plan={plan} canEdit={canEdit} onSaved={onChanged} />
          <DmMode listId={listId} plan={plan} canEdit={canEdit} onChanged={onChanged} />
        </>
      ) : (
        <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      )}
    </>
  )
}
