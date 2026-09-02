"use client"

/**
 * Open the commercial gate by hand.
 *
 * Normally a client sees the full roster only once the agreement is signed and the advance
 * is paid — that is what turns a proposal into work. But some brands are genuinely
 * onboarded and simply slow with paperwork, and holding the roster back from them loses the
 * campaign rather than protecting it.
 *
 * This waives the requirement without faking it. No signature is invented and no invoice is
 * marked paid: the money side still shows exactly what is outstanding, and the proposal
 * carries who opened the gate, when, and why. On by default, always — the override is the
 * exception and it should look like one.
 */
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

export function GateOverrideCard({
  proposalId, override, overrideBy, overrideReason, onChanged,
}: {
  proposalId: string
  override: boolean
  overrideBy?: string | null
  overrideReason?: string | null
  onChanged?: () => void
}) {
  const [on, setOn] = useState(override)
  const [reason, setReason] = useState(overrideReason || "")
  const [busy, setBusy] = useState(false)

  const save = async (next: boolean) => {
    if (next && reason.trim().length < 8) {
      toast.error("Say why. It is recorded on the proposal.")
      return
    }
    setBusy(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/clients/proposals/${proposalId}/gate-override`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ override: next, reason: reason.trim() }) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Failed")
      const data = (await res.json()).data
      setOn(next)
      toast.success(next
        ? (data?.promoted
            ? "Gate opened, the proposal is now in the client's app"
            : "Gate opened, the client can select without the paperwork")
        : "Gate closed, the agreement and advance are required again")
      onChanged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the gate")
      setOn(!next)
    } finally { setBusy(false) }
  }

  return (
    <Card className={on ? "border-amber-500/40" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {on ? <ShieldAlert className="size-4 text-amber-600" />
                  : <ShieldCheck className="size-4 text-muted-foreground" />}
              Paperwork requirement
              {on && (
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
                  Waived
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {on
                ? "This client can select creators without a signed agreement or a paid advance. Nothing is marked as signed or paid. The money side still shows what is outstanding."
                : "The client sees the full roster only once the agreement is signed and the advance is paid. Waive it for a brand that is onboarded but slow with paperwork."}
            </CardDescription>
          </div>
          <Switch checked={on} disabled={busy}
                  onCheckedChange={v => { setOn(v); if (!v) save(false) }} />
        </div>
      </CardHeader>

      {(on || reason) && (
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Why this client is exempt
            </label>
            <Textarea
              className="mt-1.5"
              rows={2}
              value={reason}
              disabled={busy || (on && override)}
              placeholder="e.g. Onboarded in March, PO raised, legal signing next week"
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {on && override && overrideBy && (
            <p className="text-xs text-muted-foreground">
              Waived by {overrideBy}. Turn the switch off to require the paperwork again.
            </p>
          )}

          {on && !override && (
            <Button size="sm" disabled={busy} onClick={() => save(true)}>
              {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Open the gate for this client
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
