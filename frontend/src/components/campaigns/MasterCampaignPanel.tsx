"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Users, CheckCircle2, FileCheck, ChevronRight, Loader2, Gift, BadgePercent, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Sub {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
  payout_aed: number | null;
  max_participants: number | null;
  brand_excluded: boolean;
  participants: number;
  approved: number;
  completed: number;
  deliverables_submitted: number;
  deliverables_verified: number;
}
interface Rollup {
  master: { id: string; name: string; campaign_type: string; brand_name: string; package_target: number | null; description: string | null };
  subs: Sub[];
  totals: { sub_count: number; participants: number; approved: number; completed: number; deliverables_submitted: number; deliverables_verified: number };
}

const TYPE_ICON: Record<string, typeof Gift> = { barter: Gift, cashback: BadgePercent, paid_deal: Banknote };

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

export function MasterCampaignPanel({ campaignId, isSuperadmin }: { campaignId: string; isSuperadmin?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<Rollup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { API_CONFIG } = await import("@/config/api");
        const { tokenManager } = await import("@/utils/tokenManager");
        const t = await tokenManager.getValidTokenWithRefresh();
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/rollup`, {
          headers: { Authorization: `Bearer ${t.token}` },
        });
        if (res.ok) setData((await res.json()).data);
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!data) return <div className="py-12 text-center text-muted-foreground">Couldn&apos;t load this package.</div>;

  const { totals, subs, master } = data;
  const target = master.package_target;

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" /> Master package — reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This is your package umbrella. The campaigns below run on the creator app; this view tracks total bought vs delivered.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Sub-campaigns" value={totals.sub_count} />
            <Stat label="Creators approved" value={totals.approved} sub={target ? `of ${target} target` : undefined} />
            <Stat label="Completed" value={totals.completed} />
            <Stat label="Deliverables verified" value={totals.deliverables_verified} sub={`${totals.deliverables_submitted} submitted`} />
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Campaigns in this package</h3>
        {subs.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
            No sub-campaigns linked yet.{isSuperadmin ? " Create FA campaigns and attach them to this master." : ""}
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {subs.map((s) => {
              const Icon = TYPE_ICON[s.campaign_type] || Layers;
              return (
                <button key={s.id} type="button" onClick={() => router.push(`/campaigns/${s.id}/posts`)}
                  className="group text-left">
                  <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-foreground/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{s.name}</span>
                          {s.brand_excluded && isSuperadmin && (
                            <Badge variant="outline" className="text-[9px]">agency-only</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span className="capitalize">{s.status}</span>
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{s.approved} approved</span>
                          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{s.completed} done</span>
                          <span className="inline-flex items-center gap-1"><FileCheck className="h-3 w-3" />{s.deliverables_verified} verified</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
