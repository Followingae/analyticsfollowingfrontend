"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { staffAdminApi, ALL_MODULES, type StaffDetail } from "@/services/staffApi";
import { clientApi } from "@/services/clientManagementApi";

const MODULE_LABEL: Record<string, string> = {
  dashboard: "Dashboard", operations: "Operations", clients: "Clients", users: "Users",
  campaigns: "Campaigns", proposals: "Proposals", influencers: "Influencer DB", fa: "Following App",
  system: "System", billing: "Billing",
};

export function StaffAccessDialog({ staffId, open, onOpenChange, onSaved }: {
  staffId: string | null; open: boolean; onOpenChange: (v: boolean) => void; onSaved?: () => void;
}) {
  const [detail, setDetail] = useState<StaffDetail | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [useDefaults, setUseDefaults] = useState(true);
  const [grantedTeams, setGrantedTeams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !staffId) return;
    (async () => {
      try {
        setLoading(true);
        const [d, cl] = await Promise.all([
          staffAdminApi.get(staffId),
          clientApi.list({ limit: 200 }).then((r: any) => r?.data || r?.clients || []),
        ]);
        setDetail(d);
        setClients((cl || []).map((c: any) => ({ id: c.id, name: c.company_name || c.name || c.owner_name || "Client" })));
        const override = Array.isArray(d.modules_override) ? d.modules_override : null;
        setUseDefaults(!override || override.length === 0);
        setModules(override && override.length ? override : d.default_modules);
        setGrantedTeams(new Set((d.clients || []).map((x) => x.team_id)));
      } catch (e: any) {
        toast.error(e?.message || "Failed to load staff");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, staffId]);

  const toggleModule = (m: string) =>
    setModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  const toggleTeam = (id: string) =>
    setGrantedTeams((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const save = async () => {
    if (!staffId) return;
    try {
      setSaving(true);
      await staffAdminApi.setModules(staffId, useDefaults ? null : modules);
      await staffAdminApi.setClients(staffId, Array.from(grantedTeams));
      toast.success("Staff access updated");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Staff access</DialogTitle>
          <DialogDescription>
            {detail ? <>{detail.full_name || detail.email} · <Badge variant="secondary" className="ml-1">{detail.staff_role}</Badge></> : "Control what this staff member can see and do."}
          </DialogDescription>
        </DialogHeader>

        {loading || !detail ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="grid max-h-[60vh] grid-cols-1 gap-5 overflow-y-auto md:grid-cols-2">
            {/* Modules */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Modules</Label>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Checkbox checked={useDefaults} onCheckedChange={(v) => { setUseDefaults(!!v); if (v) setModules(detail.default_modules); }} />
                  Use role defaults
                </label>
              </div>
              <div className="space-y-1.5 rounded-lg border p-3">
                {ALL_MODULES.map((m) => (
                  <label key={m} className={`flex items-center gap-2 text-sm ${useDefaults ? "opacity-60" : ""}`}>
                    <Checkbox checked={modules.includes(m)} disabled={useDefaults} onCheckedChange={() => toggleModule(m)} />
                    {MODULE_LABEL[m] || m}
                  </label>
                ))}
              </div>
            </div>

            {/* Clients */}
            <div className="space-y-2">
              <Label className="text-sm">Client access ({grantedTeams.size})</Label>
              <div className="max-h-[44vh] space-y-1.5 overflow-y-auto rounded-lg border p-3">
                {clients.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No clients found.</p>
                ) : clients.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={grantedTeams.has(c.id)} onCheckedChange={() => toggleTeam(c.id)} />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
