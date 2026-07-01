"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus, Check, Minus, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { proposalApprovalApi } from "@/services/proposalApprovalApi";

const DELIVERABLES = ["post", "story", "reel", "carousel", "video", "bundle", "monthly"] as const;

interface Creator { id: string; username: string; full_name?: string; profile_image_url?: string; profile_pic_url?: string; followers_count?: number; engagement_rate?: number; tier?: string }
type Selected = Record<string, { creator: Creator; deliverables: Record<string, number> }>;

function fmt(n?: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function TmAddCreatorsDialog({ proposalId, open, onOpenChange, onAdded }: {
  proposalId: string; open: boolean; onOpenChange: (v: boolean) => void; onAdded?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Selected>({});

  const runSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await proposalApprovalApi.searchMasterDb(q);
      const list: Creator[] = res?.data?.influencers ?? res?.data ?? res?.influencers ?? [];
      setResults(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error((e as Error).message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setSelected({}); setSearch("");
    runSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggle = (c: Creator) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[c.id]) delete next[c.id];
      else next[c.id] = { creator: c, deliverables: { reel: 1 } }; // default one reel
      return next;
    });
  };

  const setQty = (id: string, type: string, delta: number) => {
    setSelected((prev) => {
      const entry = prev[id]; if (!entry) return prev;
      const cur = entry.deliverables[type] || 0;
      const q = Math.max(0, cur + delta);
      const d = { ...entry.deliverables };
      if (q === 0) delete d[type]; else d[type] = q;
      return { ...prev, [id]: { ...entry, deliverables: d } };
    });
  };

  const count = Object.keys(selected).length;

  const add = async () => {
    if (count === 0) return;
    try {
      setSaving(true);
      const influencer_ids = Object.keys(selected);
      const deliverable_assignments = influencer_ids
        .map((id) => ({
          influencer_db_id: id,
          deliverables: Object.entries(selected[id].deliverables).map(([type, quantity]) => ({ type, quantity })),
        }))
        .filter((a) => a.deliverables.length > 0);
      const res = await proposalApprovalApi.addFromDb(proposalId, { influencer_ids, deliverable_assignments });
      toast.success(`Added ${res?.data?.added ?? influencer_ids.length} creator(s)`);
      onAdded?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Add creators from the master database</DialogTitle>
          <DialogDescription>Search the roster, select creators, and assign deliverables. Only priced (active) creators appear.</DialogDescription>
        </DialogHeader>

        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by username or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="max-h-[46vh] space-y-1.5 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No creators found.</p>
          ) : results.map((c) => {
            const sel = selected[c.id];
            return (
              <div key={c.id} className={`rounded-xl border p-3 transition-colors ${sel ? "border-primary/40 bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toggle(c)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${sel ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                    {sel && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <Avatar className="h-9 w-9"><AvatarImage src={c.profile_image_url || c.profile_pic_url} /><AvatarFallback>{(c.username || "?")[0]?.toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">@{c.username}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.full_name}</div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <div>{fmt(c.followers_count)} followers</div>
                    {c.engagement_rate != null && <div>{Number(c.engagement_rate).toFixed(1)}% eng</div>}
                  </div>
                  {c.tier && <Badge variant="outline" className="shrink-0 capitalize">{c.tier}</Badge>}
                </div>

                {sel && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                    {DELIVERABLES.map((d) => {
                      const q = sel.deliverables[d] || 0;
                      return q > 0 ? (
                        <div key={d} className="flex items-center gap-1 rounded-lg bg-primary/10 px-1.5 py-1 text-xs">
                          <span className="capitalize font-medium">{d}</span>
                          <button type="button" onClick={() => setQty(c.id, d, -1)} className="rounded p-0.5 hover:bg-background"><Minus className="h-3 w-3" /></button>
                          <span className="w-4 text-center tabular-nums">{q}</span>
                          <button type="button" onClick={() => setQty(c.id, d, 1)} className="rounded p-0.5 hover:bg-background"><Plus className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <button key={d} type="button" onClick={() => setQty(c.id, d, 1)} className="rounded-lg border border-dashed px-2 py-1 text-xs capitalize text-muted-foreground hover:border-primary hover:text-foreground">
                          + {d}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t p-4">
          <div className="mr-auto text-sm text-muted-foreground">{count} selected</div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={add} disabled={saving || count === 0} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add {count > 0 ? count : ""} creator{count === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
