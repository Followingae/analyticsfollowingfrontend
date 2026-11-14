"use client"

/**
 * The office wall.
 *
 * The wall shows what the product recorded and nothing else: no card is pushed by hand
 * (founder, 13 Nov 2026). This page opens the screens and shows, for every action the team
 * takes in the product, what the wall does with it. Each Preview plays that one moment on
 * the wall in a new tab with made-up names; nothing is written and the office TV never sees
 * it. Never money: the wall carries no amounts.
 */
import * as React from "react"
import { useCallback, useState } from "react"
import { ExternalLink, Smartphone, Tv } from "lucide-react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { usePoll } from "@/components/jobs/jobParts"
import { PREVIEWS } from "@/components/wall/previews"

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/displays`

const VERSION_NAME: Record<string, string> = { v1: "The wall", v2: "Slides" }

function ago(iso?: string | null) {
  if (!iso) return "never seen"
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 90) return "on now"
  if (s < 3600) return `seen ${Math.round(s / 60)} min ago`
  if (s < 86400) return `seen ${Math.round(s / 3600)} h ago`
  return `seen ${Math.round(s / 86400)} d ago`
}

/** The TVs in the office: what each shows, whether it is on, and the two things a phone can do to it. */
function Tvs({ tvs, reload }: { tvs: any[]; reload: () => void }) {
  const act = async (id: string, method: string, body?: any) => {
    await fetchWithAuth(`${BASE}/tv/${id}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    reload()
  }
  return (
    <Card className="mt-8">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">TVs</h2>
            <p className="mt-1 text-xs text-muted-foreground">On the TV, open <span className="font-medium text-foreground">following.ae/tv</span>. It shows a code; pair it from your phone. A paired TV remembers its screen through power off and on, and follows any change you make here within seconds.</p>
          </div>
          <Button asChild size="sm"><a href="/work/tv/pair"><Smartphone className="mr-1.5 h-4 w-4" />Pair a TV</a></Button>
        </div>
        {tvs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No TV is paired yet.</p>
        ) : (
          <div className="mt-4 divide-y">
            {tvs.map(t => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.online ? "#6BBF3A" : "#C9CBC4" }} title={t.online ? "on now" : "off"} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.name || "Unnamed TV"}{t.paired ? "" : " · waiting for a code"}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.paired ? `${VERSION_NAME[t.variant] ?? t.variant} · ${t.display_label}` : t.code ? `showing code ${t.code}` : "no code"} · {ago(t.last_seen_at)}
                  </div>
                </div>
                {t.paired && (
                  <>
                    <div className="flex overflow-hidden rounded-lg border text-xs">
                      {Object.entries(VERSION_NAME).map(([k, n]) => (
                        <button key={k} type="button" onClick={() => k !== t.variant && act(t.id, "PATCH", { variant: k })}
                          className="px-3 py-1.5" style={{ background: t.variant === k ? "#15181A" : "transparent", color: t.variant === k ? "#fff" : undefined }}>{n}</button>
                      ))}
                    </div>
                    {t.path && <Button asChild variant="ghost" size="sm"><a href={t.path} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a></Button>}
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Unpair this TV? It goes back to showing a code.")) act(t.id, "DELETE") }}>Unpair</Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function OfficeWallPage() {
  const [screens, setScreens] = useState<any[]>([])
  const [tvs, setTvs] = useState<any[]>([])
  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([fetchWithAuth(BASE), fetchWithAuth(`${BASE}/tv`)])
      if (a.ok) setScreens(((await a.json()).data?.items ?? []).filter((s: any) => !s.revoked_at))
      if (b.ok) setTvs((await b.json()).data?.items ?? [])
    } catch { /* keep what we have */ }
  }, [])
  usePoll(load, 15000)
  const first = screens[0]
  const [playing, setPlaying] = useState<string | null>(null)
  const playOnTv = async (id: string, key: string) => {
    setPlaying(`${id}:${key}`)
    try { await fetchWithAuth(`${BASE}/tv/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preview: key }) }) } catch { /* the button comes back */ }
    setTimeout(() => setPlaying(null), 9000)
  }

  return (
    <SuperadminLayout>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">The office wall</h1>
            <p className="mt-1 text-sm text-muted-foreground">Every screen reacts to what the team does in the product, on its own. Nothing is pushed by hand and it never shows money.</p>
          </div>
          <div className="flex items-center gap-2">
            {screens.map((s: any) => (
              <Button key={s.path} asChild variant="outline" size="sm">
                <a href={s.path} target="_blank" rel="noreferrer"><Tv className="mr-1.5 h-4 w-4" />{s.label}<ExternalLink className="ml-1.5 h-3 w-3 opacity-60" /></a>
              </Button>
            ))}
          </div>
        </div>

        <Tvs tvs={tvs} reload={load} />

        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold">What each thing the team does looks like on the wall</h2>
            <p className="mt-1 text-xs text-muted-foreground">Play on TV makes the paired TV play that one moment with made-up names, within about eight seconds. Nothing is written anywhere. The small button opens it in a tab instead.</p>
            <div className="mt-4 divide-y">
              {PREVIEWS.map(p => (
                <div key={p.key} className="grid items-center gap-3 py-2.5 sm:grid-cols-[1.2fr_1.3fr_1.3fr_auto]">
                  <div className="text-sm font-medium">{p.does}</div>
                  <div className="text-xs text-muted-foreground">{p.where}</div>
                  <div className="text-xs text-muted-foreground">{p.tv}</div>
                  <div className="flex items-center gap-1.5">
                    {tvs.filter(t => t.paired).map(t => (
                      <Button key={t.id} size="sm" onClick={() => playOnTv(t.id, p.key)} disabled={playing === `${t.id}:${p.key}`}>
                        <Tv className="mr-1.5 h-4 w-4" />{playing === `${t.id}:${p.key}` ? "Playing" : tvs.filter(x => x.paired).length > 1 ? (t.name || "TV") : "Play on TV"}
                      </Button>
                    ))}
                    <Button asChild variant="outline" size="sm" disabled={!first} title="Open on the wall, in a tab">
                      <a href={first ? `${first.path}?preview=${p.key}` : "#"} target="_blank" rel="noreferrer">v1</a>
                    </Button>
                    <Button asChild variant="outline" size="sm" disabled={!first} title="Open on the slides, in a tab">
                      <a href={first ? `${first.path}/v2?preview=${p.key}` : "#"} target="_blank" rel="noreferrer">v2</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  )
}
