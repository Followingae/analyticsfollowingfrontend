"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, Plus, RefreshCw, Loader2 } from "lucide-react"
import { CreateShareDialog } from "@/components/superadmin/influencer-database/CreateShareDialog"
import { SharesTable } from "@/components/superadmin/influencer-database/SharesTable"
import type { InfluencerAccessShare } from "@/types/influencerDatabase"

export default function SharingManagementPage() {
  const [shares, setShares] = useState<InfluencerAccessShare[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const loadShares = useCallback(async () => {
    try {
      setLoading(true)
      const result = await superadminApiService.getInfluencerShares()
      if (result.success && result.data) {
        setShares(result.data?.shares || result.data as InfluencerAccessShare[] || [])
      }
    } catch {
      toast.error("Failed to load shares")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadShares()
  }, [loadShares])

  const handleRevoke = async (id: string) => {
    try {
      const result = await superadminApiService.revokeInfluencerShare(id)
      if (result.success) {
        toast.success("Share revoked")
        loadShares()
      } else {
        toast.error(result.error || "Failed to revoke share")
      }
    } catch {
      toast.error("Failed to revoke share")
    }
  }

  const handleExtend = async (id: string) => {
    // Extend by 90 days from now
    const newExpiry = new Date()
    newExpiry.setDate(newExpiry.getDate() + 90)
    try {
      const result = await superadminApiService.extendInfluencerShare(id, newExpiry.toISOString())
      if (result.success) {
        toast.success("Share extended by 90 days")
        loadShares()
      } else {
        toast.error(result.error || "Failed to extend share")
      }
    } catch {
      toast.error("Failed to extend share")
    }
  }

  const handleEdit = (id: string) => {
    toast.info("Edit dialog coming soon for share: " + id)
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Share2 className="h-8 w-8" />
              Sharing Management
            </h1>
            <p className="text-muted-foreground">
              Manage shared influencer access with users and teams
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadShares} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Share
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Shares ({shares.length})</CardTitle>
            <CardDescription>All influencer data shares with external users</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Share2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No shares created yet</p>
                <p className="text-sm mt-1">Create a share to give users access to influencer data</p>
              </div>
            ) : (
              <SharesTable
                shares={shares}
                onEdit={handleEdit}
                onRevoke={handleRevoke}
                onExtend={handleExtend}
              />
            )}
          </CardContent>
        </Card>

        <CreateShareDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={loadShares}
        />
      </div>
    </SuperadminLayout>
  )
}
