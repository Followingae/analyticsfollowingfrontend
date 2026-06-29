"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { faCampaignApi, faMerchantApi } from "@/services/faAdminApi";

export function CreateMasterDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("barter");
  const [merchantId, setMerchantId] = useState("");
  const [target, setTarget] = useState("");
  const [merchants, setMerchants] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try { const m = await faMerchantApi.list(); setMerchants(m?.data || m || []); } catch { /* noop */ }
    })();
  }, [open]);

  const submit = async () => {
    if (!name.trim() || !merchantId) { toast.error("Name and merchant are required"); return; }
    try {
      setSaving(true);
      await faCampaignApi.createMaster({
        name: name.trim(), campaign_type: type, merchant_id: merchantId,
        target_influencer_count: target ? parseInt(target) : undefined,
      });
      toast.success("Master package created");
      setName(""); setMerchantId(""); setTarget("");
      onCreated(); onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers className="h-4 w-4" /> New master package</DialogTitle>
          <DialogDescription>An umbrella for a bought package. Brand-visible for reconciliation; never on the creator app.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Package name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Barter Package — Dec '25" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="barter">Barter</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="paid_deal">Paid deal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Package target (optional)</Label>
              <Input value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 55" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client / merchant</Label>
            <Select value={merchantId} onValueChange={setMerchantId}>
              <SelectTrigger><SelectValue placeholder="Select merchant…" /></SelectTrigger>
              <SelectContent>
                {merchants.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />} Create package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
