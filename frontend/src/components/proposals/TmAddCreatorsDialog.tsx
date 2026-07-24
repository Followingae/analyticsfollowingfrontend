"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, UserPlus, Check, Minus, Plus, Users, ListPlus, X, Globe, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { proposalApprovalApi } from "@/services/proposalApprovalApi";
import { imdListsApi, type ImdListSummary } from "@/services/imdListsApi";

const DELIVERABLES = ["post", "story", "reel", "carousel", "video", "bundle", "monthly"] as const;
const PAGE_SIZE = 40;
const ANY_COUNTRY = "__any__";

interface Creator {
  id: string; username: string; full_name?: string; profile_image_url?: string; profile_pic_url?: string;
  followers_count?: number; engagement_rate?: number; tier?: string; country?: string | null;
}
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
  const [country, setCountry] = useState<string>(ANY_COUNTRY);
  const [countries, setCountries] = useState<{ country: string; n: number }[]>([]);
  const [results, setResults] = useState<Creator[]>([]);
  const [total, setTotal] = useState(0);
  // Matches hidden because they are already on this proposal. Without this a search for
  // someone already added returns an empty list that reads as "we don't have them".
  const [alreadyAdded, setAlreadyAdded] = useState(0);
  const [sort, setSort] = useState<string>("created_at:desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Selected>({});
  const [lists, setLists] = useState<ImdListSummary[]>([]);
  const [addingList, setAddingList] = useState(false);

  // Creators already on the proposal are excluded at the SOURCE (exclude_proposal_id), not
  // filtered out of the page here — filtering client-side silently shrinks a page and makes
  // the count meaningless.
  const fetchPage = useCallback(async (p: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const [sortBy, sortOrder] = sort.split(":") as [string, "asc" | "desc"];
      const res = await proposalApprovalApi.searchMasterDb({
        query: search || undefined,
        page: p,
        pageSize: PAGE_SIZE,
        countries: country !== ANY_COUNTRY ? [country] : undefined,
        excludeProposalId: proposalId,
        sortBy,
        sortOrder,
      });
      const list: Creator[] = res?.data?.influencers ?? [];
      setTotal(res?.data?.total_count ?? list.length);
      setAlreadyAdded(res?.data?.already_added_count ?? 0);
      setResults((prev) => (append ? [...prev, ...list] : list));
      setPage(p);
    } catch (e) {
      toast.error((e as Error).message || "Search failed");
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, [search, country, proposalId, sort]);

  useEffect(() => {
    if (!open) return;
    setSelected({}); setSearch(""); setCountry(ANY_COUNTRY); setResults([]); setPage(1);
    setSort("created_at:desc");
    fetchPage(1, false);
    proposalApprovalApi.getCountries()
      .then((r) => setCountries(r?.data?.countries ?? []))
      .catch(() => setCountries([]));
    imdListsApi.list().then((r) => setLists(r?.data?.lists ?? [])).catch(() => setLists([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchPage(1, false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, country, sort]);

  const toggle = (c: Creator) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[c.id]) delete next[c.id];
      else next[c.id] = { creator: c, deliverables: { reel: 1 } }; // default one reel
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = { ...prev };
      const allOn = results.every((c) => next[c.id]);
      if (allOn) results.forEach((c) => delete next[c.id]);
      else results.forEach((c) => { if (!next[c.id]) next[c.id] = { creator: c, deliverables: { reel: 1 } }; });
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
  const hasMore = results.length < total;

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
      // Report what the backend ACTUALLY added. It silently skips anyone already on the
      // proposal, and this used to fall back to influencer_ids.length — so adding 10 where
      // 7 were already there cheerfully claimed "10 added".
      const added = res?.data?.added;
      const skipped = typeof added === "number" ? influencer_ids.length - added : 0;
      toast.success(
        typeof added === "number"
          ? `Added ${added} creator${added === 1 ? "" : "s"}${skipped > 0 ? ` — ${skipped} already on this proposal` : ""}`
          : `Added ${influencer_ids.length} creator(s)`,
      );
      onAdded?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const addWholeList = async (listId: string) => {
    try {
      setAddingList(true);
      const res = await imdListsApi.addToProposal(listId, proposalId);
      const { added = 0, skipped = 0 } = res?.data ?? {};
      toast.success(`Added ${added} creator${added === 1 ? "" : "s"}${skipped > 0 ? ` — ${skipped} already on this proposal` : ""}`);
      onAdded?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to add list");
    } finally {
      setAddingList(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Add creators from the master database</DialogTitle>
          <DialogDescription>
            Only priced (active) creators appear. Anyone already on this proposal is hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by username or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="sm:w-52">
                <Globe className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Any country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_COUNTRY}>Any country</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.country} value={c.country}>{c.country} ({c.n})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* The roster was always served newest-first, but with no control there was
                no way to say so or to change it. Values must stay inside the server's
                sort whitelist. */}
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="sm:w-48" aria-label="Sort creators">
                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:desc">Newest added</SelectItem>
                <SelectItem value="created_at:asc">Oldest added</SelectItem>
                <SelectItem value="updated_at:desc">Recently updated</SelectItem>
                <SelectItem value="followers_count:desc">Most followers</SelectItem>
                <SelectItem value="followers_count:asc">Fewest followers</SelectItem>
                <SelectItem value="engagement_rate:desc">Highest engagement</SelectItem>
                <SelectItem value="username:asc">Username A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lists.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Or add a saved list:</span>
              {lists.map((l) => (
                <Button key={l.id} size="sm" variant="outline" disabled={addingList} onClick={() => addWholeList(l.id)} className="h-7 gap-1 text-xs">
                  <ListPlus className="h-3 w-3" />{l.name}
                  <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">{l.items_count}</Badge>
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="max-h-[46vh] space-y-1.5 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {/* An exact match that is already on the proposal used to return this same
                  blank "no creators match", which reads as a broken search rather than
                  "you already have them". Say which it is. */}
              {alreadyAdded > 0 ? (
                <>
                  <Check className="mx-auto mb-2 h-5 w-5 text-primary" />
                  {alreadyAdded === 1
                    ? "That creator is already on this proposal."
                    : `All ${alreadyAdded} matching creators are already on this proposal.`}
                </>
              ) : search || country !== ANY_COUNTRY ? (
                "No creators match these filters."
              ) : (
                "Every active creator is already on this proposal."
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 pb-1">
                <button type="button" onClick={selectAllVisible} className="text-xs font-medium text-primary hover:underline">
                  {results.every((c) => selected[c.id]) ? "Clear these" : `Select these ${results.length}`}
                </button>
                <span className="text-xs text-muted-foreground">
                  Showing {results.length} of {total}
                  {alreadyAdded > 0 && ` · ${alreadyAdded} already added`}
                </span>
              </div>

              {results.map((c) => {
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
                      {c.country && <Badge variant="secondary" className="shrink-0">{c.country}</Badge>}
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

              {/* The roster used to be reachable only by typing a search — 30 rows, no way
                  to see the rest. */}
              {hasMore && (
                <Button variant="outline" className="w-full" disabled={loadingMore} onClick={() => fetchPage(page + 1, true)}>
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : `Load ${Math.min(PAGE_SIZE, total - results.length)} more`}
                </Button>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 border-t p-4 sm:flex-row">
          <div className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
            {count > 0 && (
              <button type="button" onClick={() => setSelected({})} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20">
                {count} selected <X className="h-3 w-3" />
              </button>
            )}
            {count === 0 && <span className="text-xs">Nothing selected</span>}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={add} disabled={saving || count === 0} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add {count > 0 ? count : ""} creator{count === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
