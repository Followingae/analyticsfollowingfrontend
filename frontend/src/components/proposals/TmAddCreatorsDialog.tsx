"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, UserPlus, Check, Minus, Plus, Users, ListPlus, X, Globe, ArrowUpDown, Tag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { proposalApprovalApi } from "@/services/proposalApprovalApi";
import { imdListsApi, type ImdListSummary } from "@/services/imdListsApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { API_CONFIG } from "@/config/api";
import { fetchWithAuth } from "@/utils/apiInterceptor";

const DELIVERABLES = ["post", "story", "reel", "carousel", "video", "bundle", "monthly"] as const;
const PAGE_SIZE = 40;
const ANY_COUNTRY = "__any__";

interface Creator {
  id: string; username: string; full_name?: string; profile_image_url?: string; profile_pic_url?: string;
  followers_count?: number; engagement_rate?: number; tier?: string; country?: string | null;
  /** Whether we hold a sell price for them at all. Decided on the server, because a talent
   *  manager never sees the sell side and could not work it out from the row. */
  sellable?: boolean;
}
type Selected = Record<string, { creator: Creator; deliverables: Record<string, number> }>;

/** "3 have no sell price yet (@a, @b) · 1 already on this proposal" — reasons, not a count. */
function summariseSkips(skipped: { username?: string | null; reason: string }[]) {
  const by = new Map<string, string[]>();
  for (const s of skipped) {
    const list = by.get(s.reason) || [];
    if (s.username) list.push("@" + s.username);
    by.set(s.reason, list);
  }
  return [...by.entries()]
    .map(([reason, names]) => {
      const n = skipped.filter((s) => s.reason === reason).length;
      const who = names.length ? ` (${names.slice(0, 4).join(", ")}${names.length > 4 ? "…" : ""})` : "";
      return reason === "no sell price"
        ? `${n} ${n === 1 ? "has" : "have"} no sell price yet${who}`
        : `${n} ${reason}${who}`;
    })
    .join(" · ");
}

/**
 * Price them here, now.
 *
 * Hitting an unpriced creator in the picker is the moment somebody knows what they should
 * cost — and, if that somebody is a founder, the moment they are allowed to say so. Sending
 * them to the database screen and back is how a creator stays unpriced for a month, so the
 * price is set on the spot and the row goes live underneath them.
 *
 * Only the sell side is asked for, because only the sell side blocks a quote. The cost is
 * talent's to record, and offering it here would invite it to be guessed.
 */
function PriceInline({ creator, onPriced }: { creator: Creator; onPriced: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({});

  const save = async () => {
    const sell_pricing: Record<string, number> = {};
    for (const [k, v] of Object.entries(prices)) {
      const n = Number(v);
      if (v !== "" && Number.isFinite(n) && n > 0) sell_pricing[k] = n;
    }
    if (!Object.keys(sell_pricing).length) { toast.error("Type at least one price"); return; }
    setSaving(true);
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/influencers/${creator.id}/pricing`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sell_pricing }) },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.detail || "Could not save the price");
      toast.success(j.message || `@${creator.username} priced`);
      setOpen(false);
      onPriced();
    } catch (e) {
      toast.error((e as Error).message || "Could not save the price");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 shrink-0 gap-1 text-xs">
          <Tag className="h-3 w-3" />Price them
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-sm font-medium">What do we charge for @{creator.username}?</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          In AED. Fill only the ones we sell, the rest can wait.
        </p>
        <div className="mt-3 space-y-2">
          {(["reel", "post", "story"] as const).map((d) => (
            <div key={d} className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-xs capitalize">{d}</Label>
              <Input
                inputMode="decimal"
                value={prices[d] ?? ""}
                placeholder="0"
                onChange={(e) => setPrices((p) => ({ ...p, [d]: e.target.value.replace(/[^\d.]/g, "") }))}
                className="h-8 text-right tabular-nums"
              />
            </div>
          ))}
        </div>
        <Button onClick={save} disabled={saving} size="sm" className="mt-3 w-full gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save and make them selectable
        </Button>
      </PopoverContent>
    </Popover>
  );
}

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
  // Only a founder may say what we charge. Everyone else sees the badge and knows to ask.
  const { canSeeMargin: isLeadership } = useAdminAccess();
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
    // Nobody can be quoted without a sell price, so taking them would only produce a row
    // the builder has to delete again — and, until now, a toast blaming a duplicate.
    if (c.sellable === false) {
      toast.error(`@${c.username} has no sell price yet`, {
        description: isLeadership
          ? "Use “Price them” on their row to set one."
          : "Ask a founder to price them and they become selectable.",
      });
      return;
    }
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
      const pickable = results.filter((c) => c.sellable !== false);
      const allOn = pickable.every((c) => next[c.id]);
      if (allOn) pickable.forEach((c) => delete next[c.id]);
      else pickable.forEach((c) => { if (!next[c.id]) next[c.id] = { creator: c, deliverables: { reel: 1 } }; });
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
      // What the server actually did, and its reasons. This used to subtract the count and
      // call the difference "already on this proposal" — which sent somebody hunting for a
      // creator who was not on it at all. The real answer is usually "no sell price yet".
      const added = res?.data?.added ?? 0;
      const skipped: { username?: string | null; reason: string }[] = res?.data?.skipped ?? [];
      toast.success(`Added ${added} creator${added === 1 ? "" : "s"}`, {
        description: skipped.length ? summariseSkips(skipped) : undefined,
      });
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
      const added = res?.data?.added ?? 0;
      const detail: { username?: string | null; reason: string }[] = res?.data?.skipped_detail ?? [];
      // Anyone this client has already turned down is held back by the server. Adding a
      // whole area already excludes the ones dropped on that area, so this only fires for a
      // creator they rejected on a DIFFERENT area of theirs. Rare, and exactly the case
      // nobody would remember, so it is named rather than folded into a count.
      const rejected = res?.data?.client_rejected ?? [];
      const heldNote = rejected.length
        ? `${rejected.length} left out, this client turned them down before: `
          + rejected.slice(0, 3).map((r) => `@${r.username}`).join(", ")
          + (rejected.length > 3 ? ` and ${rejected.length - 3} more` : "")
        : "";
      toast.success(`Added ${added} creator${added === 1 ? "" : "s"}`, {
        description: [detail.length ? summariseSkips(detail) : "", heldNote]
          .filter(Boolean).join(" · ") || undefined,
      });
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
            Active creators only, and anyone already on this proposal is hidden. A creator with
            no sell price yet is shown, and a founder can price them from their row.
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
                  <div key={c.id} className={`rounded-xl border p-3 transition-colors ${sel ? "border-primary/40 bg-primary/5" : ""} ${c.sellable === false ? "opacity-70" : ""}`}>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggle(c)}
                        disabled={c.sellable === false}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${sel ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"} ${c.sellable === false ? "cursor-not-allowed opacity-40" : ""}`}
                      >
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
                      {c.sellable === false && (
                        <>
                          <Badge variant="outline" className="shrink-0 border-amber-400 text-amber-700 dark:text-amber-400">
                            No sell price
                          </Badge>
                          {isLeadership && (
                            <PriceInline
                              creator={c}
                              onPriced={() => {
                                // The row becomes usable where it stands, and ticks itself:
                                // pricing somebody in the picker means you want them.
                                setResults((prev) => prev.map((r) =>
                                  r.id === c.id ? { ...r, sellable: true } : r));
                                setSelected((prev) => prev[c.id] ? prev : ({
                                  ...prev, [c.id]: { creator: { ...c, sellable: true }, deliverables: { reel: 1 } },
                                }));
                              }}
                            />
                          )}
                        </>
                      )}
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
