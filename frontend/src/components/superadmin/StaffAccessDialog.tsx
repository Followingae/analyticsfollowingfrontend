"use client";

/**
 * What one member of staff can reach, and what they can do there.
 *
 * WHAT THIS REPLACED. Ten checkboxes, one per module, in a console that had grown to
 * twenty-six areas. Whether somebody could CHANGE a campaign or DELETE one was not part of
 * the grant at all — it was decided elsewhere, by role — so the honest answer to "what can
 * Aqsa do?" was "open these screens, and then it depends". Thirteen screens had no checkbox
 * of their own and were reachable by anyone holding a loosely related key.
 *
 * THE SHAPE NOW. One row per module, three levels, and the two things people actually want:
 * a preset that is safe without reading anything, and the ability to change one row of it
 * afterwards without the preset silently reasserting itself.
 *
 *   View   read it
 *   Edit   read it and do the everyday work
 *   Delete read it, work on it, and delete — offered only where a module can delete anything
 *
 * Absence is the fourth state and it is the default. A module nobody switched on simply is
 * not in the grant, so reading this screen top to bottom answers "what CAN they do".
 *
 * THREE THINGS THE SCREEN HAS TO BE HONEST ABOUT, and the reason it shows more than a
 * checkbox grid:
 *
 *  1. INHERITANCE IS REAL. Rosters follow Creators; Chasing follows Campaigns. Somebody
 *     given Campaigns at Edit has Chasing at Edit whether or not they touched that row, so
 *     the row SAYS so rather than sitting there looking switched off. A screen that hides
 *     that is a screen that makes a superadmin think they have taken something away.
 *
 *  2. "WRITE" MEANS DIFFERENT THINGS. Write on Chasing is recording a chase; write on
 *     Payments is booking what we owe somebody. The consequence is written next to the
 *     control, in words, rather than left to whoever recognises the module name.
 *
 *  3. SOME OF THESE ARE MONEY. Marked, and said plainly, because the mistake this screen
 *     makes possible is not clicking the wrong box — it is clicking the right box without
 *     realising what it opens.
 *
 * The catalogue and the presets are SERVED, not hard-coded here, so this screen cannot fall
 * behind the console the way the old one did.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Loader2, ShieldCheck, Save, Building2, AlertTriangle, Sparkles, Link2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  staffAdminApi, type StaffDetail, type AccessCatalogue, type AccessMap, type AccessLevel,
} from "@/services/staffApi";
import { clientApi } from "@/services/clientManagementApi";
import { useAdminAccess } from "@/hooks/useAdminAccess";

/** Only the fields this screen reads. The clients endpoint has spelled the display name
 *  three different ways over time, so all three are tried rather than assumed. */
type ClientRow = { id: string; company_name?: string; name?: string; owner_name?: string };

const RANK: Record<string, number> = { view: 1, write: 2, full: 3 };

/** One module's control: off / view / edit / delete. A segmented row rather than three
 *  checkboxes, because the levels are exclusive and checkboxes imply they are not. */
function LevelPicker({
  value, canDelete, disabled, onChange,
}: {
  value: AccessLevel | null;
  canDelete: boolean;
  disabled?: boolean;
  onChange: (v: AccessLevel | null) => void;
}) {
  const options: { key: AccessLevel | null; label: string }[] = [
    { key: null, label: "No access" },
    { key: "view", label: "View" },
    { key: "write", label: "Edit" },
    ...(canDelete ? [{ key: "full" as AccessLevel, label: "Delete" }] : []),
  ];
  return (
    <div className={cn("inline-flex rounded-ds-lg border border-black/[0.08] p-0.5 dark:border-white/[0.10]",
                       disabled && "pointer-events-none opacity-50")}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button
            key={String(o.key)}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "rounded-[7px] px-2.5 py-1 text-[12px] font-medium transition",
              on
                ? o.key === "full"
                  // Delete is the only level drawn in a warning colour. It is the only one
                  // that cannot be undone.
                  ? "bg-rose-600 text-white"
                  : "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function StaffAccessDialog({ staffId, open, onOpenChange, onSaved }: {
  staffId: string | null; open: boolean; onOpenChange: (v: boolean) => void; onSaved?: () => void;
}) {
  const [detail, setDetail] = useState<StaffDetail | null>(null);
  const [cat, setCat] = useState<AccessCatalogue | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [clientQuery, setClientQuery] = useState("");

  const [access, setAccess] = useState<AccessMap>({});
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [grantedTeams, setGrantedTeams] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Setting access is superadmin-only at the endpoint, and a founder holding `staff` reaches
  // this screen at VIEW. Drawing live controls for them would be a full set of buttons that
  // 403 on save, so the screen is read-only instead and says why.
  const { isSuperAdmin } = useAdminAccess();
  const readOnly = !isSuperAdmin;

  useEffect(() => {
    if (!open || !staffId) return;
    (async () => {
      try {
        setLoading(true); setFailure(null);
        const [d, c, cl] = await Promise.all([
          staffAdminApi.get(staffId),
          staffAdminApi.catalogue(),
          clientApi.list({ limit: 200, scope: "all" })
            .then((r: { data?: unknown[]; clients?: unknown[] }) =>
              r?.data || r?.clients || []).catch(() => []),
        ]);
        setDetail(d); setCat(c);
        setClients((cl as ClientRow[] || []).map((x) => ({
          id: x.id, name: x.company_name || x.name || x.owner_name || "Client",
        })));
        // Start from what is actually set. Falling back to the role preset shows a superadmin
        // what this person effectively has, which is the truthful starting point for editing.
        setAccess(d.access ?? d.role_preset ?? {});
        setPresetKey(d.preset_key ?? null);
        setGrantedTeams(new Set((d.clients || []).map((x) => x.team_id)));
      } catch (e: unknown) {
        setFailure(e instanceof Error ? e.message : "The request did not complete");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, staffId]);

  /** What this grant actually resolves to once inheritance is applied. Mirrors
   *  app/core/console_modules.py::resolve_access — the server decides, this only explains. */
  const effective = useMemo(() => {
    if (!cat) return {} as AccessMap;
    const out: AccessMap = { ...access };
    for (let pass = 0; pass < 2; pass++) {
      for (const m of cat.modules) {
        if (access[m.key] || !m.inherits_from) continue;
        const parent = out[m.inherits_from];
        if (!parent) continue;
        const capped: AccessLevel =
          m.inherit_ceiling && RANK[parent] > RANK[m.inherit_ceiling]
            ? m.inherit_ceiling
            : parent;
        if ((RANK[capped] ?? 0) > (RANK[out[m.key]] ?? 0)) out[m.key] = capped;
      }
    }
    return out;
  }, [access, cat]);

  const setLevel = (key: string, level: AccessLevel | null) => {
    setAccess((prev) => {
      const next = { ...prev };
      if (level) next[key] = level; else delete next[key];
      return next;
    });
    // The moment somebody changes one row, this is no longer that preset. Saying so is what
    // stops the next person assuming "Talent manager" still means the standard thing.
    setPresetKey("custom");
  };

  const applyPreset = (key: string) => {
    const p = cat?.presets.find((x) => x.key === key);
    if (!p) return;
    setAccess({ ...p.access });
    setPresetKey(key);
    toast.success(`${p.label} applied. Change anything you like before saving.`);
  };

  const save = async () => {
    if (!staffId) return;
    try {
      setSaving(true);
      await staffAdminApi.setAccess(staffId, Object.keys(access).length ? access : null, presetKey);
      await staffAdminApi.setClients(staffId, Array.from(grantedTeams));
      toast.success("Access updated");
      onSaved?.();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    if (!cat) return [];
    return cat.groups
      .map((g) => ({ group: g, modules: cat.modules.filter((m) => m.group === g) }))
      .filter((g) => g.modules.length > 0);
  }, [cat]);

  const shownClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    return q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
  }, [clients, clientQuery]);

  const granted = Object.keys(effective).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-black/[0.06] px-6 py-5 dark:border-white/[0.07]">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Access
          </DialogTitle>
          <DialogDescription>
            {detail
              ? <>{detail.full_name || detail.email}
                  <Badge variant="secondary" className="ml-2">{detail.staff_role}</Badge>
                  {granted > 0 && (
                    <span className="ml-2 text-muted-foreground">
                      · can reach {granted} area{granted === 1 ? "" : "s"}
                    </span>
                  )}
                </>
              : "What this person can reach, and what they can do there."}
          </DialogDescription>
        </DialogHeader>

        {readOnly && !loading && (
          <p className="border-b border-black/[0.06] bg-muted/40 px-6 py-2.5 text-[12.5px]
                        text-muted-foreground dark:border-white/[0.07]">
            You can read this, but only a superadmin can change what somebody can reach.
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : failure ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px]">Could not load this person&apos;s access</p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Nothing has been changed. {failure}
            </p>
          </div>
        ) : !detail || !cat ? null : (
          <div className="max-h-[64vh] space-y-8 overflow-y-auto px-6 py-5">
            {/* ── Presets ─────────────────────────────────────────────────────────────── */}
            <section className="space-y-2.5">
              <Label className="flex items-center gap-1.5 text-[13.5px]">
                <Sparkles className="h-3.5 w-3.5" /> Start from a preset
              </Label>
              <div className="flex flex-wrap gap-2">
                {cat.presets.map((p) => (
                  <button
                    key={p.key} type="button" disabled={readOnly}
                    onClick={() => applyPreset(p.key)}
                    title={p.hint}
                    className={cn(
                      "rounded-ds-lg border px-3 py-1.5 text-[13px] transition",
                      presetKey === p.key
                        ? "border-foreground bg-foreground text-background"
                        : "border-black/[0.08] hover:bg-muted dark:border-white/[0.10]",
                      readOnly && "pointer-events-none opacity-50",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                {presetKey === "custom"
                  ? "Hand-picked. Applying a preset replaces everything below."
                  : cat.presets.find((p) => p.key === presetKey)?.hint
                    ?? "Presets never include delete, and never include Staff accounts."}
              </p>
            </section>

            {/* ── The matrix ──────────────────────────────────────────────────────────── */}
            {grouped.map(({ group, modules }) => (
              <section key={group} className="space-y-1">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em]
                               text-muted-foreground">
                  {group}
                </h3>
                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {modules.map((m) => {
                    const explicit = access[m.key] ?? null;
                    const eff = effective[m.key] ?? null;
                    const inherited = !explicit && !!eff;
                    return (
                      <div key={m.key}
                           className="grid grid-cols-1 items-start gap-x-6 gap-y-2 py-3
                                      sm:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="min-w-0 space-y-0.5">
                          <p className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-medium">
                            {m.label}
                            {m.sensitive && (
                              <span title="Money, or something that cannot be undone">
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                              </span>
                            )}
                            {inherited && (
                              <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
                                <Link2 className="h-2.5 w-2.5" />
                                from {cat.modules.find((x) => x.key === m.inherits_from)?.label}
                              </Badge>
                            )}
                          </p>
                          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                            {m.hint}
                          </p>
                          {/* What "Edit" actually lets them do here, said next to the control
                              rather than left to whoever recognises the module name. */}
                          {(eff === "write" || eff === "full") && (
                            <p className="text-[12.5px] leading-relaxed text-muted-foreground/80">
                              Can: {m.write_means}
                            </p>
                          )}
                          {eff === "full" && m.full_means && (
                            <p className="text-[12.5px] leading-relaxed text-rose-700 dark:text-rose-400">
                              And: {m.full_means}
                            </p>
                          )}
                        </div>
                        <div className="justify-self-start sm:justify-self-end">
                          <LevelPicker
                            value={eff}
                            canDelete={m.can_delete}
                            disabled={readOnly}
                            onChange={(v) => setLevel(m.key, v)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* ── Which clients ───────────────────────────────────────────────────────── */}
            <section className="space-y-2.5">
              <Label className="flex items-center gap-1.5 text-[13.5px]">
                <Building2 className="h-3.5 w-3.5" /> Clients ({grantedTeams.size})
              </Label>
              <p className="text-[12.5px] text-muted-foreground">
                Separate from the areas above. Access to Campaigns lets them open the screen;
                this decides whose campaigns are on it.
              </p>
              <Input
                value={clientQuery} onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Search clients" className="h-9 text-[13.5px]"
              />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-ds-lg border
                              border-black/[0.06] p-3 dark:border-white/[0.07]">
                {shownClients.length === 0 ? (
                  <p className="py-2 text-center text-[12.5px] text-muted-foreground">
                    {clients.length === 0 ? "No clients found." : "Nothing matches that."}
                  </p>
                ) : shownClients.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1
                                               text-[13.5px] hover:bg-muted/60">
                    <Checkbox
                      checked={grantedTeams.has(c.id)} disabled={readOnly}
                      onCheckedChange={() => setGrantedTeams((prev) => {
                        const n = new Set(prev);
                        if (n.has(c.id)) n.delete(c.id); else n.add(c.id);
                        return n;
                      })}
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        )}

        <DialogFooter className="border-t border-black/[0.06] px-6 py-4 dark:border-white/[0.07]">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button onClick={save} disabled={saving || loading || !!failure} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
