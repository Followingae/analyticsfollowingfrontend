"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Coins, Users, SkipForward } from "lucide-react"
import { superadminApiService } from "@/services/superadminApi"
import { BulkPricingDialog } from "./BulkPricingDialog"

interface PostImportPricingStepProps {
  importedIds: string[]
  importedUsernames: string[]
  onComplete: () => void
  onSkip: () => void
}

export function PostImportPricingStep({
  importedIds,
  importedUsernames,
  onComplete,
  onSkip,
}: PostImportPricingStepProps) {
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false)
  const [pricingApplied, setPricingApplied] = useState(false)

  const handlePricingSubmit = async (updates: any[]) => {
    try {
      await superadminApiService.bulkUpdateInfluencerPricing(updates)
      setPricingApplied(true)
      toast.success(`Pricing updated for ${importedIds.length} creators`)
    } catch {
      toast.error("Failed to update pricing")
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mx-auto mb-3">
          {pricingApplied ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Coins className="h-5 w-5 text-green-600" />
          )}
        </div>
        <h3 className="text-base font-semibold">
          {pricingApplied
            ? "Pricing applied successfully"
            : `${importedIds.length} creator${importedIds.length !== 1 ? "s" : ""} imported successfully`}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {pricingApplied
            ? "All imported creators now have pricing set."
            : "Set pricing now or do it later from the database."}
        </p>
      </div>

      {/* Apply pricing button */}
      {!pricingApplied && (
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => setPricingDialogOpen(true)}
        >
          <Coins className="h-4 w-4" />
          Apply Pricing to All {importedIds.length} Creators
        </Button>
      )}

      {/* Creator list */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-medium">Imported Creators</p>
            <Badge variant="secondary" className="text-xs tabular-nums ml-auto">
              {importedUsernames.length}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {importedUsernames.map((username) => (
              <Badge
                key={username}
                variant={pricingApplied ? "default" : "outline"}
                className="text-xs font-mono gap-1"
              >
                {pricingApplied && <CheckCircle className="h-2.5 w-2.5" />}
                @{username}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={onComplete}>
          Done
        </Button>
        {!pricingApplied && (
          <Button variant="ghost" className="gap-1.5" onClick={onSkip}>
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </Button>
        )}
      </div>

      {/* Bulk pricing dialog */}
      <BulkPricingDialog
        open={pricingDialogOpen}
        onOpenChange={setPricingDialogOpen}
        selectedIds={importedIds}
        onSubmit={handlePricingSubmit}
      />
    </div>
  )
}
