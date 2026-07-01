"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Inbox, Users2, ChevronRight, CheckCircle2, PencilRuler, Building2, Megaphone, FileText, ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { staffApi, type StaffTask, type StaffClient } from "@/services/staffApi";

function relTime(iso?: string | null): string {
  if (!iso) return "no activity yet";
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function StatTile({ icon: Icon, label, value, tone = "default" }: { icon: any; label: string; value: number; tone?: "default" | "amber" | "purple" }) {
  const toneCls = tone === "amber" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
    : tone === "purple" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffHome() {
  const router = useRouter();
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [clients, setClients] = useState<StaffClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, c] = await Promise.all([
          staffApi.myTasks().catch(() => ({ tasks: [], count: 0 })),
          staffApi.myClients().catch(() => []),
        ]);
        setTasks(t.tasks || []);
        setClients(c || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const activeCampaigns = clients.reduce((n, c) => n + (c.active_campaigns || 0), 0);
  const openProposals = clients.reduce((n, c) => n + (c.open_proposals || 0), 0);

  return (
    <div className="space-y-8">
      {/* Summary strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={ListTodo} label="Tasks awaiting you" value={tasks.length} tone="amber" />
        <StatTile icon={Building2} label={`Brand${clients.length === 1 ? "" : "s"} you manage`} value={clients.length} />
        <StatTile icon={Megaphone} label="Active campaigns" value={activeCampaigns} />
        <StatTile icon={FileText} label="Proposals in flight" value={openProposals} tone="purple" />
      </section>

      {/* Inbox */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your tasks</h2>
          {tasks.length > 0 && <Badge>{tasks.length}</Badge>}
        </div>
        {tasks.length === 0 ? (
          <Card><CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> You&apos;re all caught up — nothing needs your action right now.
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <button key={`${t.proposal_id}-${t.task_type}`} type="button"
                onClick={() => router.push(`/superadmin/proposals/${t.proposal_id}/approval`)}
                className="group w-full text-left">
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.task_type === "curate" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                      {t.task_type === "curate"
                        ? <PencilRuler className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        : <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{t.campaign_name || t.title || "Proposal"}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.task_type === "curate" ? "Curation" : "Approval"} · {t.label}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{t.status.replace(/_/g, " ")}</Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Brands */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your brands</h2>
          {clients.length > 0 && <Badge variant="secondary">{clients.length}</Badge>}
        </div>
        {clients.length === 0 ? (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">
            No brands assigned yet. A superadmin grants you access to specific clients.
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {clients.map((c) => (
              <button key={c.team_id} type="button"
                onClick={() => router.push(`/staff/clients/${c.team_id}`)}
                className="group text-left">
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                        {c.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : <Building2 className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">Updated {relTime(c.last_activity)}</div>
                      </div>
                      {(c.open_proposals || 0) > 0 && (
                        <Badge className="shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {c.open_proposals} proposal{c.open_proposals === 1 ? "" : "s"}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
                      <div>
                        <div className="text-lg font-semibold leading-none">{c.active_campaigns ?? 0}</div>
                        <div className="text-[11px] text-muted-foreground">Active</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold leading-none">{c.campaigns}</div>
                        <div className="text-[11px] text-muted-foreground">Campaigns</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold leading-none">{c.open_proposals ?? 0}</div>
                        <div className="text-[11px] text-muted-foreground">Proposals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
