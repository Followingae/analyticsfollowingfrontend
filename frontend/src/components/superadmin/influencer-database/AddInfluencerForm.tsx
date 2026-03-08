"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { superadminApiService } from "@/services/superadminApi"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Instagram, Info } from "lucide-react"

export function AddInfluencerForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const trimmed = username.trim().replace(/^@/, "")
    if (!trimmed) {
      toast.error("Enter a username")
      return
    }
    try {
      setAdding(true)
      const result = await superadminApiService.addInfluencerToDatabase(trimmed, {
        status: "active",
      })

      if (result.success) {
        toast.success(`@${trimmed} added — analytics will process in the background`)
        router.push("/superadmin/influencers")
      } else {
        toast.error(result.error || "Failed to add influencer")
      }
    } catch {
      toast.error("Failed to add influencer")
    } finally {
      setAdding(false)
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
              <p className="text-sm font-medium">Instagram Username</p>
              <p className="text-xs text-muted-foreground">
                Analytics, categories, and all profile data populate automatically.
              </p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              className="pl-8"
              autoFocus
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>Set pricing, tags, tier, and notes from the database after adding. Categories are auto-detected by AI analysis.</p>
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
