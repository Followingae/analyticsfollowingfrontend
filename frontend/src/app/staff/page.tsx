"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Inbox, Users2, ChevronRight, CheckCircle2, PencilRuler, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { staffApi, type StaffTask, type StaffClient } from "@/services/staffApi";

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

  return (
    <div className="space-y-8">
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

      {/* Clients */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your clients</h2>
          {clients.length > 0 && <Badge variant="secondary">{clients.length}</Badge>}
        </div>
        {clients.length === 0 ? (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">
            No clients assigned yet. A superadmin grants you access to specific clients.
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <button key={c.team_id} type="button"
                onClick={() => router.push(`/superadmin/clients/${c.team_id}`)}
                className="group text-left">
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {c.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : <Building2 className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.campaigns} campaign{c.campaigns === 1 ? "" : "s"}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
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
