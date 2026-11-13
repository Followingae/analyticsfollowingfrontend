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
import { ExternalLink, Tv } from "lucide-react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { usePoll } from "@/components/jobs/jobParts"
import { PREVIEWS } from "@/components/wall/previews"

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/displays`

export default function OfficeWallPage() {
  const [screens, setScreens] = useState<any[]>([])
  const load = useCallback(async () => {
    try {
      const r = await fetchWithAuth(BASE)
      if (r.ok) setScreens(((await r.json()).data?.items ?? []).filter((s: any) => !s.revoked_at))
    } catch { /* keep what we have */ }
  }, [])
  usePoll(load, 60000)
  const first = screens[0]

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

        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold">What each thing the team does looks like on the wall</h2>
            <p className="mt-1 text-xs text-muted-foreground">Preview opens the wall in a new tab and plays that one moment with made-up names. Nothing is written anywhere and the office screens do not see it.</p>
            <div className="mt-4 divide-y">
              {PREVIEWS.map(p => (
                <div key={p.key} className="grid items-center gap-3 py-2.5 sm:grid-cols-[1.2fr_1.3fr_1.3fr_auto]">
                  <div className="text-sm font-medium">{p.does}</div>
                  <div className="text-xs text-muted-foreground">{p.where}</div>
                  <div className="text-xs text-muted-foreground">{p.tv}</div>
                  <Button asChild variant="outline" size="sm" disabled={!first}>
                    <a href={first ? `${first.path}?preview=${p.key}` : "#"} target="_blank" rel="noreferrer"><Tv className="mr-1.5 h-4 w-4" />Preview</a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  )
}
