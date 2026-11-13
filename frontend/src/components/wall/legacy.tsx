'use client'

/**
 * The app-side screens: barter and paid campaigns on the mobile app, UGC, the queue, and
 * sourcing areas. Carried over from the 2026 wall unchanged in substance; they are the
 * screens that stall in different places and are chased by different people.
 */
import { CalendarClock, CheckCircle2, Clapperboard, Film, Gauge, Inbox, Search, Sparkles } from 'lucide-react'
import {
  BigWait, BrandMark, EasedProgress, Empty, Glass, GlassTitle, Headline, Legend, LIME, Pill,
  Ring, Stat, TILE, WorkBar, dayLabel, useEased, type Slide,
} from './parts'

export function AppSlide({ slide, paid }: { slide: Slide; paid: boolean }) {
  const t = slide.totals ?? {}
  const rows = slide.rows ?? []
  const measurable = (t.total_work ?? 0) > 0
  return (
    <div className="grid h-full grid-cols-12 gap-[1.6vw]">
      <div className="col-span-4 flex min-h-0 flex-col gap-[1.6vw]">
        <Headline
          eyebrow={<><Pill>Live now</Pill><Pill tone="quiet">{paid ? 'Paid' : 'Barter'}</Pill></>}
          title="Mobile app"
          meta={`${rows.length} campaign${rows.length === 1 ? '' : 's'} running · ${t.creators_active ?? 0} creators working on them`}
        />
        <div className="min-h-0 flex-1">
          <Glass>
            <GlassTitle icon={Gauge}>{measurable ? 'Content verified' : 'Waiting to start'}</GlassTitle>
            {measurable
              ? <Ring pct={t.pct ?? null} caption={`${t.verified ?? 0} of ${t.total_work ?? 0} deliverables`} />
              : <BigWait value={t.awaiting_brand ?? 0} caption="creators waiting on the brand before any content is owed" />}
          </Glass>
        </div>
        <Glass className="!h-auto">
          <div className="grid grid-cols-2 gap-[1vw]">
            <Stat caption="Brand to decide" value={t.awaiting_brand ?? 0} tone={t.awaiting_brand ? 'accent' : 'plain'} />
            <Stat caption="Applications" value={t.applications_pending ?? 0} />
            <Stat caption="Content to check" value={t.to_check ?? 0} />
            <Stat caption="Missed" value={t.missed ?? 0} tone={t.missed ? 'warn' : 'plain'} />
          </div>
        </Glass>
      </div>

      <div className="col-span-8 min-h-0">
        <Glass>
          <GlassTitle
            icon={Sparkles}
            right={<Legend items={[
              { dot: '', label: 'Verified', value: t.verified ?? 0 },
              { dot: 'bg-[#F5C451]', label: 'To check', value: t.to_check ?? 0 },
              { dot: 'bg-white/25', label: 'Owed', value: t.pending ?? 0 },
            ]} />}
          >
            {paid ? 'Paid campaigns' : 'Barter campaigns'}
          </GlassTitle>
          <div className="flex min-h-0 flex-1 flex-col content-start gap-[1vw] overflow-hidden">
            {rows.map((c: any) => (
              <div key={c.id} className={`flex min-h-0 max-h-[11vw] flex-1 flex-col justify-center px-[1.4vw] py-[1.25vw] ${TILE}`}>
                <div className="flex items-center gap-[0.9vw]">
                  <BrandMark src={c.brand_logo_url} name={c.brand_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.2vw] font-semibold leading-tight tracking-tight text-white">{c.name}</div>
                    <div className="truncate text-[0.78vw] text-white/60">{c.brand_name}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-[0.6vw]">
                    {c.awaiting_brand > 0 && <Pill>{c.awaiting_brand} for brand</Pill>}
                    {c.missed > 0 && <Pill tone="warn">{c.missed} missed</Pill>}
                    <span className="w-[4vw] text-right text-[1.8vw] font-semibold leading-none tabular-nums text-white">
                      {c.pct == null ? '—' : `${c.pct}%`}
                    </span>
                  </div>
                </div>
                <div className="mt-[0.75vw] flex items-center gap-[1vw]">
                  <WorkBar done={c.verified} checking={c.to_check} owed={c.pending} />
                  <span className="shrink-0 text-[0.78vw] tabular-nums text-white/60">
                    {c.verified}/{c.total_work} done · {c.creators_active} creators
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  )
}

export function UgcSlide({ slide }: { slide: Slide }) {
  const t = slide.totals ?? {}
  const funnel = [
    { stage: 'Proposed', v: t.proposed ?? 0 },
    { stage: 'Approved', v: t.approved ?? 0 },
    { stage: 'In production', v: t.in_production ?? 0 },
    { stage: 'Delivered', v: t.delivered ?? 0 },
  ]
  const grown = useEased(1)
  return (
    <div className="grid h-full grid-cols-12 gap-[1.6vw]">
      <div className="col-span-4 flex min-h-0 flex-col gap-[1.6vw]">
        <Headline eyebrow={<><Pill>Live now</Pill><Pill tone="quiet">Studio</Pill></>} title="UGC" meta="Concepts we write, shoot and hand over" />
        <div className="min-h-0 flex-1">
          <Glass>
            <GlassTitle icon={Film}>Approved work delivered</GlassTitle>
            <Ring pct={t.pct ?? null} caption={`${t.delivered ?? 0} of ${t.approved ?? 0} approved concepts`} />
          </Glass>
        </div>
        <Glass className="!h-auto">
          <div className="grid grid-cols-2 gap-[1vw]">
            <Stat caption="In production" value={t.in_production ?? 0} tone="accent" />
            <Stat caption="Videos delivered" value={t.delivered ?? 0} />
          </div>
        </Glass>
      </div>
      <div className="col-span-8 min-h-0">
        <Glass>
          <GlassTitle icon={Clapperboard}>Concept through to video</GlassTitle>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-[1.6vw] py-[0.5vw]">
            {funnel.map((f, i) => {
              const top = Math.max(1, funnel[0].v)
              const last = i === funnel.length - 1
              return (
                <div key={f.stage} className="flex min-h-0 max-h-[3.4vw] flex-1 items-center gap-[1.1vw]">
                  <span className="w-[9vw] shrink-0 text-[0.95vw] text-white/70">{f.stage}</span>
                  <div className="h-[2.6vw] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, (f.v / top) * 100) * grown}%`, background: last ? LIME : `rgba(255,255,255,${0.14 + i * 0.06})` }} />
                  </div>
                  <span className="w-[4vw] shrink-0 text-right text-[1.6vw] font-semibold leading-none tabular-nums" style={last ? { color: LIME } : { color: '#fff' }}>{f.v}</span>
                </div>
              )
            })}
          </div>
        </Glass>
      </div>
    </div>
  )
}

export function WaitingSlide({ slide }: { slide: Slide }) {
  const t = slide.totals ?? {}
  const rows = slide.rows ?? []
  return (
    <div className="grid h-full grid-cols-12 gap-[1.6vw]">
      <div className="col-span-6 flex min-h-0 flex-col gap-[1.6vw]">
        <Headline eyebrow={<><Pill>Right now</Pill><Pill tone="quiet">Everyone</Pill></>} title="Waiting on us" meta="Nothing here moves until somebody in this room touches it" />
        <div className="min-h-0 flex-1">
          <Glass>
            <GlassTitle icon={Inbox}>The queue</GlassTitle>
            <div className="grid flex-1 grid-cols-3 gap-[1.1vw]">
              <Stat size="xl" caption="Applications to review" value={t.applications ?? 0} tone={t.applications ? 'accent' : 'plain'} />
              <Stat size="xl" caption="Waiting on the brand" value={t.brand_approvals ?? 0} />
              <Stat size="xl" caption="Content to check" value={t.content_to_check ?? 0} />
              <Stat size="xl" caption="Due today" value={t.due_today ?? 0} />
              <Stat size="xl" caption="Due tomorrow" value={t.due_tomorrow ?? 0} />
              <Stat size="xl" caption="Missed" value={t.missed ?? 0} tone={t.missed ? 'warn' : 'plain'} />
            </div>
          </Glass>
        </div>
      </div>
      <div className="col-span-6 min-h-0">
        <Glass>
          <GlassTitle icon={CalendarClock} right={<span className="text-[1.3vw] font-semibold leading-none tabular-nums text-white">{rows.length}</span>}>
            Due today and tomorrow
          </GlassTitle>
          {rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-[0.7vw]">
              <CheckCircle2 className="h-[3vw] w-[3vw]" style={{ color: LIME }} />
              <span className="text-[2.2vw] font-semibold leading-none tracking-tight text-white">All clear</span>
              <span className="text-[0.9vw] text-white/60">Nothing due today or tomorrow</span>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-[0.9vw] overflow-hidden">
              {rows.map((d: any) => (
                <div key={d.id} className={`flex min-h-0 max-h-[8vw] flex-1 items-center gap-[0.85vw] px-[1.2vw] py-[1vw] ${TILE}`}>
                  <BrandMark src={d.brand_logo_url} name={d.campaign_name} size="2.2vw" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.02vw] font-semibold leading-tight text-white">{d.creator ? `@${d.creator}` : 'Unassigned'}</div>
                    <div className="truncate text-[0.75vw] text-white/60">{d.campaign_name ?? '—'}{d.deliverable_type ? ` · ${d.deliverable_type}` : ''}</div>
                  </div>
                  {d.missed ? <Pill tone="warn">Missed</Pill> : dayLabel(d.due_at) === 'Today' ? <Pill>Today</Pill> : <Pill tone="quiet">{dayLabel(d.due_at)}</Pill>}
                </div>
              ))}
            </div>
          )}
        </Glass>
      </div>
    </div>
  )
}

export function SourcingSlide({ slide }: { slide: Slide }) {
  const rows = slide.rows ?? []
  return (
    <div className="grid h-full grid-cols-12 gap-[1.6vw]">
      <div className="col-span-4 flex min-h-0 flex-col justify-start gap-[1.2vw]">
        <Headline eyebrow={<><Pill>Right now</Pill><Pill tone="quiet">Talent</Pill></>} title="Sourcing" meta={`${rows.length} area${rows.length === 1 ? '' : 's'} open`} />
      </div>
      <div className="col-span-8 min-h-0">
        <Glass>
          <GlassTitle icon={Search}>Areas open</GlassTitle>
          {rows.length === 0 ? <Empty>No areas open</Empty> : (
            <div className="grid flex-1 grid-cols-2 content-start gap-[1.1vw]">
              {rows.map((r: any) => {
                const pct = r.target > 0 ? Math.min(100, Math.round((r.found / r.target) * 100)) : null
                return (
                  <div key={r.id} className={`flex min-h-0 max-h-[11vw] flex-1 flex-col justify-center px-[1.4vw] py-[1.25vw] ${TILE}`}>
                    <div className="flex items-baseline gap-[0.6vw]">
                      <span className="truncate text-[1.15vw] font-semibold leading-tight tracking-tight text-white">{r.title}</span>
                      <span className="ml-auto shrink-0 text-[0.9vw] tabular-nums text-white/70">{r.found}/{r.target || '—'}</span>
                    </div>
                    <div className="mt-[0.4vw] truncate text-[0.76vw] text-white/60">{r.client_name ?? '—'}{(r.round_no ?? 1) > 1 ? ` · Round ${r.round_no}` : ''}</div>
                    <EasedProgress value={pct ?? 0} className="mt-[0.8vw] h-[0.45vw] bg-white/[0.10] [&>div]:bg-[#D3FF02]" />
                  </div>
                )
              })}
            </div>
          )}
        </Glass>
      </div>
    </div>
  )
}
