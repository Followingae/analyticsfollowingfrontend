"use client"

/**
 * Pair a TV from a phone. The TV shows a six-digit code (and a QR that lands here with the
 * code filled in). Pick the display and the version, confirm, and the TV moves to its
 * screen within seconds. Staff can pair team screens; a money screen needs leadership.
 */
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Tv } from "lucide-react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/displays`
const VERSIONS = [
  { key: "v1", name: "The wall", blurb: "Live feed, campaigns turning, whose move, clients, this week." },
  { key: "v2", name: "Slides", blurb: "One number a slide, big type, your photographs." },
]

export default function PairTvPage() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [tv, setTv] = useState<any | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displays, setDisplays] = useState<any[]>([])
  const [displayId, setDisplayId] = useState<string>("")
  const [variant, setVariant] = useState("v1")
  const [name, setName] = useState("")
  const [done, setDone] = useState<any | null>(null)
  const [busy, setBusy] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const code = digits.join("")

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("code")
    if (q && /^\d{6}$/.test(q)) setDigits(q.split(""))
    fetchWithAuth(BASE).then(async r => {
      if (!r.ok) return
      const items = ((await r.json()).data?.items ?? []).filter((d: any) => !d.revoked_at)
      setDisplays(items)
      const team = items.find((d: any) => d.scope === "team") ?? items[0]
      if (team) setDisplayId(team.id)
    }).catch(() => { /* leave the list empty */ })
  }, [])

  const look = useCallback(async (c: string) => {
    setChecking(true); setError(null); setTv(null)
    try {
      const r = await fetchWithAuth(`${BASE}/tv/code/${c}`)
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setError(j.detail || "No TV is showing that code."); return }
      setTv(j.data)
    } catch { setError("Could not reach the server.") }
    finally { setChecking(false) }
  }, [])
  useEffect(() => { if (/^\d{6}$/.test(code)) look(code) }, [code, look])

  const type = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "")
    if (!clean) { setDigits(d => { const n = [...d]; n[i] = ""; return n }); return }
    setDigits(d => { const n = [...d]; clean.split("").slice(0, 6 - i).forEach((ch, k) => { n[i + k] = ch }); return n })
    refs.current[Math.min(5, i + clean.length)]?.focus()
  }
  const key = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const pair = async () => {
    setBusy(true); setError(null)
    try {
      const r = await fetchWithAuth(`${BASE}/tv/pair`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, display_id: displayId, variant, name: name.trim() || undefined }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setError(j.detail || "Could not pair."); return }
      setDone(j.data)
    } catch { setError("Could not reach the server.") }
    finally { setBusy(false) }
  }

  const display = displays.find(d => d.id === displayId)

  return (
    <SuperadminLayout>
      <div className="mx-auto max-w-xl px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Pair a TV</h1>
        <p className="mt-1 text-sm text-muted-foreground">Open <span className="font-medium text-foreground">following.ae/tv</span> on the TV. Type the six digits it shows.</p>

        {done ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#D3FF02" }}><Check className="h-7 w-7" /></div>
              <div className="mt-4 text-lg font-semibold">The TV is moving to {done.display_label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{VERSIONS.find(v => v.key === done.variant)?.name}{done.name ? ` · ${done.name}` : ""}. It takes a few seconds. Press OK on the remote once for full screen.</div>
              <Button className="mt-6" variant="outline" onClick={() => { setDone(null); setTv(null); setDigits(Array(6).fill("")); refs.current[0]?.focus() }}>Pair another</Button>
              <Button className="mt-2" variant="ghost" asChild><a href="/work/tv">All screens</a></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mt-8 flex justify-between gap-2">
              {digits.map((d, i) => (
                <input key={i} ref={el => { refs.current[i] = el }} inputMode="numeric" autoComplete="one-time-code" value={d}
                  onChange={e => type(i, e.target.value)} onKeyDown={e => key(i, e)} onFocus={e => e.target.select()}
                  className="h-16 w-full rounded-xl border bg-background text-center text-3xl font-semibold tabular-nums outline-none focus:ring-2 focus:ring-foreground/20"
                  style={{ borderColor: tv ? "#15181A" : undefined }} />
              ))}
            </div>
            <div className="mt-3 min-h-5 text-sm">
              {checking && <span className="text-muted-foreground">Looking for the TV…</span>}
              {error && <span className="text-destructive">{error}</span>}
              {tv && !error && <span className="inline-flex items-center gap-1.5 text-foreground"><Tv className="h-4 w-4" /> TV found{tv.name ? `: ${tv.name}` : ""}. Choose what it shows.</span>}
            </div>

            {tv && (
              <Card className="mt-6">
                <CardContent className="p-5">
                  <div className="text-sm font-semibold">Version</div>
                  <div className="mt-2 grid gap-2">
                    {VERSIONS.map(v => (
                      <button key={v.key} type="button" onClick={() => setVariant(v.key)}
                        className="flex items-start gap-3 rounded-xl border p-3 text-left transition"
                        style={{ borderColor: variant === v.key ? "#15181A" : undefined, background: variant === v.key ? "#F7F8F4" : undefined }}>
                        <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border" style={{ background: variant === v.key ? "#15181A" : "transparent", borderColor: "#15181A" }} />
                        <div><div className="text-sm font-medium">{v.name}</div><div className="text-xs text-muted-foreground">{v.blurb}</div></div>
                      </button>
                    ))}
                  </div>

                  {displays.length > 1 && (
                    <>
                      <div className="mt-5 text-sm font-semibold">Display</div>
                      <select value={displayId} onChange={e => setDisplayId(e.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm">
                        {displays.map(d => <option key={d.id} value={d.id}>{d.label}{d.scope === "leadership" ? " (money, leadership only)" : ""}</option>)}
                      </select>
                    </>
                  )}

                  <div className="mt-5 text-sm font-semibold">Name this TV <span className="font-normal text-muted-foreground">(optional)</span></div>
                  <Input className="mt-2" placeholder="Talent room, Reception…" value={name} onChange={e => setName(e.target.value)} />

                  <Button className="mt-6 w-full" size="lg" disabled={busy || !displayId} onClick={pair}>
                    {busy ? "Pairing…" : `Show ${VERSIONS.find(v => v.key === variant)?.name}${display && displays.length > 1 ? ` · ${display.label}` : ""} on this TV`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </SuperadminLayout>
  )
}
