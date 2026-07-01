"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Building2, Megaphone, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { staffApi, type StaffBrandDetail } from "@/services/staffApi";

function statusTone(s: string): string {
  const v = (s || "").toLowerCase();
  if (/(active|approved|internally_approved|sent|live)/.test(v)) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (/(reject|cancel|archiv)/.test(v)) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (/(draft|building|pending|review|more_requested)/.test(v)) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
}

export default function StaffClientDetail() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = params.teamId;
  const [data, setData] = useState<StaffBrandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setData(await staffApi.clientDetail(teamId));
      } catch (e) {
        setError((e as Error).message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [teamId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/staff")} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{error || "Not found"}</CardContent></Card>
      </div>
    );
  }

  const { brand, campaigns, proposals } = data;
  const activeCount = campaigns.filter((c) => (c.status || "").toLowerCase() === "active").length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/staff")} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Your brands</Button>

      {/* Brand header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-muted">
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt="" className="h-full w-full object-cover" />
          ) : <Building2 className="h-7 w-7 text-muted-foreground" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          <p className="text-sm text-muted-foreground">{activeCount} active · {campaigns.length} campaigns · {proposals.length} proposals</p>
        </div>
      </div>

      {/* Proposals */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Proposals</h2>
          {proposals.length > 0 && <Badge variant="secondary">{proposals.length}</Badge>}
        </div>
        {proposals.length === 0 ? (
          <Card><CardContent className="py-6 text-sm text-muted-foreground">No proposals yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {proposals.map((p) => (
              <button key={p.id} type="button" onClick={() => router.push(`/superadmin/proposals/${p.id}/approval`)} className="w-full text-left">
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30"><FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div>
                    <div className="min-w-0 flex-1"><div className="truncate font-medium">{p.name || "Proposal"}</div></div>
                    <Badge className={`shrink-0 capitalize ${statusTone(p.status)}`}>{(p.status || "").replace(/_/g, " ")}</Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Campaigns */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Campaigns</h2>
          {campaigns.length > 0 && <Badge variant="secondary">{campaigns.length}</Badge>}
        </div>
        {campaigns.length === 0 ? (
          <Card><CardContent className="py-6 text-sm text-muted-foreground">No campaigns yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {campaigns.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Megaphone className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.name}</div>
                    {c.campaign_type && <div className="text-xs capitalize text-muted-foreground">{c.campaign_type.replace(/_/g, " ")}</div>}
                  </div>
                  <Badge className={`shrink-0 capitalize ${statusTone(c.status)}`}>{(c.status || "").replace(/_/g, " ")}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
