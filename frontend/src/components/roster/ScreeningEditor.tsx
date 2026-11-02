"use client"

/**
 * What the WhatsApp agent screens for on THIS open call: where creators must be, the visit
 * slots they pick from, the team's own questions, and a follower floor. Set once per
 * campaign by a superadmin; the agent asks for each and screens against it.
 */
import * as React from "react"
import { CalendarClock, Flag, MapPin, MessageCircleQuestion, Plus, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { Screening } from "@/services/openCallsApi"

export const EMPTY_SCREENING: Screening = { city: "", where: "anywhere", slots: [], questions: [], min_followers: null,
                                            ask_nationality: false, nationality_targets: [] }

const WHERE: { id: Screening["where"]; label: string }[] = [
  { id: "based", label: "Based there" },
  { id: "based_or_visit", label: "Based there, or can visit" },
  { id: "anywhere", label: "Anywhere" },
]

const newId = (p: string) => p + Math.random().toString(36).slice(2, 7)

function Block({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-ds-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-lg bg-[var(--tone-neutral-wash)]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-ds-2">
        <p className="text-sm font-medium">{title}</p>
        {children}
      </div>
    </div>
  )
}

export function ScreeningEditor({ value, onChange }: { value: Screening; onChange: (s: Screening) => void }) {
  const s = value
  const set = (p: Partial<Screening>) => onChange({ ...s, ...p })

  return (
    <div className="flex flex-col gap-ds-4 rounded-ds-lg border p-ds-3">
      <Block icon={MapPin} title="Where creators must be">
        <div className="flex flex-wrap gap-1.5">
          {WHERE.map(w => (
            <button key={w.id} type="button" onClick={() => set({ where: w.id })}
                    className={`rounded-ds-full border px-3 py-1.5 text-xs transition ${s.where === w.id
                      ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40"}`}>
              {w.label}
            </button>
          ))}
        </div>
        {s.where !== "anywhere" && (
          <Input value={s.city || ""} onChange={e => set({ city: e.target.value })} placeholder="City, e.g. Abu Dhabi"
                 className="max-w-xs" />
        )}
      </Block>

      <Block icon={CalendarClock} title="Visit slots">
        {s.slots.map((sl, i) => (
          <div key={sl.id} className="grid grid-cols-[auto_1fr_96px_auto] items-center gap-ds-2">
            <span className="w-5 text-center text-xs font-semibold text-muted-foreground">{"ABCDEFGHJKLMNPQRSTUV"[i]}</span>
            <Input value={sl.label} placeholder="Sat 8 Nov, 16:00, Abu Dhabi branch"
                   onChange={e => set({ slots: s.slots.map(x => x.id === sl.id ? { ...x, label: e.target.value } : x) })} />
            <Input inputMode="numeric" value={sl.capacity ?? ""} placeholder="Places"
                   onChange={e => set({ slots: s.slots.map(x => x.id === sl.id ? { ...x, capacity: Number(e.target.value.replace(/\D/g, "")) || null } : x) })} />
            <Button size="icon" variant="ghost" onClick={() => set({ slots: s.slots.filter(x => x.id !== sl.id) })}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" className="self-start gap-1.5"
                onClick={() => set({ slots: [...s.slots, { id: newId("s"), label: "", capacity: null }] })}>
          <Plus className="h-3.5 w-3.5" />Add a slot
        </Button>
      </Block>

      <Block icon={MessageCircleQuestion} title="Your questions">
        {s.questions.map(q => (
          <div key={q.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-ds-2">
            <Input value={q.q} placeholder="Can you bring a friend?"
                   onChange={e => set({ questions: s.questions.map(x => x.id === q.id ? { ...x, q: e.target.value } : x) })} />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Switch checked={q.must} onCheckedChange={(v: boolean) => set({ questions: s.questions.map(x => x.id === q.id ? { ...x, must: v } : x) })} />
              Must be yes
            </label>
            <Button size="icon" variant="ghost" onClick={() => set({ questions: s.questions.filter(x => x.id !== q.id) })}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" className="self-start gap-1.5"
                onClick={() => set({ questions: [...s.questions, { id: newId("q"), q: "", must: false }] })}>
          <Plus className="h-3.5 w-3.5" />Add a question
        </Button>
      </Block>

      <Block icon={Flag} title="Nationality">
        <label className="flex items-center justify-between gap-ds-3 text-sm">
          Ask every creator their nationality
          <Switch checked={!!s.ask_nationality} onCheckedChange={(v: boolean) => set({ ask_nationality: v })} />
        </label>
        {s.ask_nationality && (
          <>
            <p className="text-xs text-muted-foreground">
              Asked of everyone, the same way. Nobody is turned away for it in the chat: it is saved on the
              creator, and you filter on it at review.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Arab", "European", "GCC", "Emirati"].map(t => {
                const on = (s.nationality_targets || []).includes(t)
                return (
                  <button key={t} type="button"
                          onClick={() => set({ nationality_targets: on ? (s.nationality_targets || []).filter(x => x !== t)
                                                                         : [...(s.nationality_targets || []), t] })}
                          className={`rounded-ds-full border px-3 py-1.5 text-xs transition ${on
                            ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40"}`}>
                    {t}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </Block>

      <Block icon={Users} title="At least this many followers">
        <Input inputMode="numeric" className="max-w-[160px]" placeholder="Optional"
               value={s.min_followers ?? ""} onChange={e => set({ min_followers: Number(e.target.value.replace(/\D/g, "")) || null })} />
      </Block>
    </div>
  )
}
