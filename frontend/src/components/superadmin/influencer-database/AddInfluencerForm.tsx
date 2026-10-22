"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { superadminApiService } from "@/services/superadminApi"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Instagram, Info, Youtube } from "lucide-react"
import { TikTokGlyph } from "@/components/icons/PlatformIcon"

/**
 * Add one creator. Instagram is required and is their main account; TikTok and YouTube are
 * switched on only for a creator who is also booked there, and each then gets its own rates.
 */
export function AddInfluencerForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [onTiktok, setOnTiktok] = useState(false)
  const [tiktok, setTiktok] = useState("")
  const [onYoutube, setOnYoutube] = useState(false)
  const [youtube, setYoutube] = useState("")
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const trimmed = username.trim().replace(/^@/, "")
    if (!trimmed) {
      toast.error("Enter their Instagram username")
      return
    }
    if (onTiktok && !tiktok.trim()) return toast.error("Enter their TikTok, or switch TikTok off")
    if (onYoutube && !youtube.trim()) return toast.error("Enter their YouTube, or switch YouTube off")
    try {
      setAdding(true)
      const result = await superadminApiService.addInfluencerToDatabase(trimmed, {
        status: "active",
        ...(onTiktok ? { tiktok_username: tiktok.trim() } : {}),
        ...(onYoutube ? { youtube_handle: youtube.trim() } : {}),
      })

      if (result.success) {
        toast.success(`@${trimmed} added - analytics will process in the background`)
        router.push("/superadmin/influencers")
      } else {
        toast.error(result.error || "Failed to add influencer")
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to add influencer")
    } finally {
      setAdding(false)
    }
  }

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
              <Instagram className="h-4 w-4 text-pink-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Instagram username</p>
              <p className="text-xs text-muted-foreground">
                Their main account. Analytics, categories, and profile data populate automatically.
              </p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={submitOnEnter}
              className="pl-8"
              autoFocus
            />
          </div>

          {/* The other platforms are opt-in per creator. Most are booked on Instagram only,
              so these stay closed until someone says otherwise. */}
          <div className="space-y-3 border-t pt-4">
            <label className="flex items-center gap-3">
              <TikTokGlyph className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">Also on TikTok</span>
              <Switch checked={onTiktok} onCheckedChange={setOnTiktok} />
            </label>
            {onTiktok && (
              <Input
                placeholder="TikTok username or link"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                onKeyDown={submitOnEnter}
              />
            )}
            <label className="flex items-center gap-3">
              <Youtube className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">Also on YouTube</span>
              <Switch checked={onYoutube} onCheckedChange={setOnYoutube} />
            </label>
            {onYoutube && (
              <Input
                placeholder="@handle or channel link"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                onKeyDown={submitOnEnter}
              />
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              Set rates for each platform, packages, tags, tier and notes from the database after adding.
              Categories are auto-detected by AI analysis.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/superadmin/influencers")}
        >
          Cancel
        </Button>
        <Button onClick={handleAdd} disabled={adding || !username.trim()} className="flex-1">
          {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add to Database
        </Button>
      </div>
    </div>
  )
}
