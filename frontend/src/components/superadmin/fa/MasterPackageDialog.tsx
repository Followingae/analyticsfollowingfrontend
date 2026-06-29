"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2, Link2, Unlink, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { faCampaignApi } from "@/services/faAdminApi";
import { fetchWithAuth } from "@/utils/apiInterceptor";
import { API_CONFIG } from "@/config/api";

interface Props {
  campaign: { id: string; name: string; campaign_type: string } | null;
  onClose: () => void;
  onChanged: () => void;
}

export function MasterPackageDialog({ campaign, onClose, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<any>(null);
  const [masters, setMasters] = useState<any[]>([]);
  const [pick, setPick] = useState<string>("");

  useEffect(() => {
    if (!campaign) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaign.id}`);
        const d = (await res.json())?.data;
        setState(d);
        const m = await faCampaignApi.listMasters({ campaign_type: campaign.campaign_type });
        setMasters((m?.data || []).filter((x: any) => x.id !== campaign.id));
      } finally {
        setLoading(false);
      }
    })();
  }, [campaign]);

  const act = async (fn: () => Promise<any>, msg: string) => {
    try {
      setBusy(true);
      await fn();
      toast.success(msg);
      onChanged();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!campaign) return null;
  const isMaster = state?.is_master;
  const masterId = state?.master_campaign_id;

  return (
    <Dialog open={!!campaign} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers className="h-4 w-4" /> Master package</DialogTitle>
          <DialogDescription className="truncate">{campaign.name}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {isMaster ? (
              <div className="rounded-lg border bg-primary/5 p-3 text-sm">
                This is a <b>master package</b> with {state?.sub_count || 0} linked campaign(s).
                Create normal FA campaigns and attach them here. Masters never appear in the creator app.
              </div>
            ) : masterId ? (
              <div className="space-y-3">
                <div className="rounded-lg border p-3 text-sm">
                  Part of master: <b>{state?.master_name}</b>
                </div>
                <Button variant="outline" className="w-full gap-2" disabled={busy}
                  onClick={() => act(() => faCampaignApi.unlinkMaster(campaign.id), "Detached from master")}>
                  <Unlink className="h-4 w-4" /> Detach from master
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="outline" className="w-full gap-2" disabled={busy}
                  onClick={() => act(() => faCampaignApi.promoteToMaster(campaign.id), "Promoted to master package")}>
                  <Layers className="h-4 w-4" /> Promote to master package
                </Button>
                <div className="space-y-2">
                  <Label className="text-xs">Or attach to an existing master</Label>
                  <div className="flex gap-2">
                    <Select value={pick} onValueChange={setPick}>
                      <SelectTrigger><SelectValue placeholder={masters.length ? "Select master…" : "No masters yet"} /></SelectTrigger>
                      <SelectContent>
                        {masters.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name} ({m.sub_count})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="gap-1.5 shrink-0" disabled={!pick || busy}
                      onClick={() => act(() => faCampaignApi.linkMaster(campaign.id, pick), "Attached to master")}>
                      <Link2 className="h-4 w-4" /> Attach
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!isMaster && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <EyeOff className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm">Agency-only (exclude brand)</Label>
                    <p className="text-[11px] text-muted-foreground">Hide from the brand; no brand approval/notifications.</p>
                  </div>
                </div>
                <Switch checked={!!state?.brand_excluded} disabled={busy}
                  onCheckedChange={(v) => act(() => faCampaignApi.setBrandExcluded(campaign.id, v), v ? "Set to agency-only" : "Brand re-enabled")} />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
