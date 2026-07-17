"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

/**
 * "No brand account" toggle for superadmin-created FA campaigns.
 *
 * Some clients (e.g. Barakat) never touch the platform — our team creates and runs the
 * campaign end-to-end on their behalf. Such a campaign carries NO brand_user_id, which is
 * exactly what keeps it out of every brand view, and the SUPERADMIN approves/rejects
 * creators instead of a brand.
 *
 * The client still has a NAME — creators see it in the app. It is the login that does not
 * exist, not the client.
 */
export function SelfManagedToggle({
  selfManaged,
  onSelfManagedChange,
  clientName,
  onClientNameChange,
  merchantSelected,
  requiresMerchant = false,
}: {
  selfManaged: boolean
  onSelfManagedChange: (v: boolean) => void
  clientName?: string
  onClientNameChange?: (v: string) => void
  merchantSelected: boolean
  /** Cashback is merchant-based (QR scans happen AT a merchant), so it always needs one. */
  requiresMerchant?: boolean
}) {
  const needsClientName = selfManaged && !merchantSelected && !!onClientNameChange

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="self-managed" className="cursor-pointer">
            No brand account — we manage this
          </Label>
          <p className="text-xs text-muted-foreground">
            For clients who don&apos;t use the platform. The campaign stays hidden from every
            brand view, and our team approves creators instead of the brand.
          </p>
        </div>
        <Switch id="self-managed" checked={selfManaged} onCheckedChange={onSelfManagedChange} />
      </div>

      {selfManaged && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your team approves and rejects every applicant — there is no 72-hour
            auto-approval on a self-managed campaign, so applications wait until someone
            decides.
            {requiresMerchant && " A merchant is still required: cashback is claimed by scanning a receipt at one."}
          </AlertDescription>
        </Alert>
      )}

      {needsClientName && (
        <div className="space-y-1.5">
          <Label>Client Name *</Label>
          <Input
            value={clientName ?? ""}
            onChange={(e) => onClientNameChange?.(e.target.value)}
            placeholder="e.g. Barakat"
          />
          <p className="text-xs text-muted-foreground">
            Creators see this name in the app.
          </p>
        </div>
      )}
    </div>
  )
}
