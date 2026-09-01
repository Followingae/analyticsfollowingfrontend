"use client";

/**
 * A staff member's home: what is waiting on them, and the brands they look after.
 *
 * WORKING tier. 40px between subjects, 16px between siblings, and no box around a number.
 *
 * The honesty fix here was not cosmetic. Both fetches ended in `.catch(() => [])`, so a 500
 * on either one rendered as "You're all caught up" and "No brands assigned yet", the two
 * most reassuring sentences on the screen, produced by the server being down. Failures are
 * now held separately from emptiness and said out loud, with the retry.
 *
 * The staff shell is its own chrome rather than `.console-shell`, so the console's scoped
 * `--tone-*` tokens do not exist on this page. It uses the brand primitives, which take
 * their status colour from the global semantic tokens instead.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Users2, ChevronRight, CheckCircle2, PencilRuler, Building2, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { staffApi, type StaffTask, type StaffClient } from "@/services/staffApi";
import {
  Figure, ListRow, LoadFailed, Loading, Nothing, Stat, StatBand,
} from "@/components/brand/primitives";

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

/** The small square that says which kind of task a row is. Colour always has a word by it. */
function TaskMark({ kind }: { kind: "curate" | "upload" | "approval" }) {
  const skin =
    kind === "curate" ? "bg-info/12 text-info"
    : kind === "upload" ? "bg-primary/10 text-primary"
    : "bg-warning/15 text-warning";
  const Icon = kind === "curate" ? PencilRuler : kind === "upload" ? Megaphone : CheckCircle2;
  return (
    <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-ds-md ${skin}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

export default function StaffHome() {
  const router = useRouter();
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [clients, setClients] = useState<StaffClient[]>([]);
  const [loading, setLoading] = useState(true);
  // Two calls, two failures. Folding them together would let one working half be reported
  // as broken, and one broken half be reported as empty.
  const [tasksFailed, setTasksFailed] = useState(false);
  const [clientsFailed, setClientsFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setTasksFailed(false);
    setClientsFailed(false);
    const [t, c] = await Promise.all([
      staffApi.myTasks().then(
        (r) => ({ ok: true as const, tasks: r.tasks || [] }),
        () => ({ ok: false as const, tasks: [] as StaffTask[] }),
      ),
      staffApi.myClients().then(
        (r) => ({ ok: true as const, clients: r || [] }),
        () => ({ ok: false as const, clients: [] as StaffClient[] }),
      ),
    ]);
    setTasks(t.tasks);
    setTasksFailed(!t.ok);
    setClients(c.clients);
    setClientsFailed(!c.ok);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeCampaigns = clients.reduce((n, c) => n + (c.active_campaigns || 0), 0);
  const openProposals = clients.reduce((n, c) => n + (c.open_proposals || 0), 0);

  return (
    <div data-density="working" className="flex flex-col gap-ds-5">
      {/* Four readings, grouped by the space around them. Eight borders and four icon tiles
          came off: they were decoration around numbers the reader is meant to compare. */}
      <StatBand cols={4}>
        <Stat
          label="Tasks awaiting you"
          value={tasks.length}
          tone={tasks.length > 0 ? "warn" : "neutral"}
          loading={loading}
          error={tasksFailed}
        />
        <Stat
          label={`Brand${clients.length === 1 ? "" : "s"} you manage`}
          value={clients.length}
          loading={loading}
          error={clientsFailed}
        />
        <Stat
          label="Active campaigns"
          value={activeCampaigns}
          loading={loading}
          error={clientsFailed}
        />
        <Stat
          label="Proposals in flight"
          value={openProposals}
          loading={loading}
          error={clientsFailed}
        />
      </StatBand>

      {/* Your tasks */}
      <section className="flex flex-col gap-ds-3">
        <div className="flex items-center gap-ds-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-ds-heading">Your tasks</h2>
          {!loading && !tasksFailed && tasks.length > 0 && <Badge>{tasks.length}</Badge>}
        </div>

        {loading ? (
          <Loading rows={3} />
        ) : tasksFailed ? (
          <LoadFailed
            what="Your tasks"
            detail="We could not reach the task list, so this is not a clear inbox. Try again in a moment."
            onRetry={() => void load()}
          />
        ) : tasks.length === 0 ? (
          <Nothing>You are all caught up. Nothing needs your action right now.</Nothing>
        ) : (
          <div className="flex flex-col">
            {tasks.map((t, i) => {
              const isUpload = t.task_type === "upload_content";
              const kind = t.task_type === "curate" ? "curate" : isUpload ? "upload" : "approval";
              const go = () => router.push(
                isUpload ? `/campaigns/${t.campaign_id}/posts` : `/superadmin/proposals/${t.proposal_id}/approval`
              );
              return (
                <ListRow key={`${t.proposal_id ?? t.campaign_id ?? i}-${t.task_type}`} onClick={go}>
                  <TaskMark kind={kind as "curate" | "upload" | "approval"} />
                  <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                    <span className="truncate text-ds-label">{t.campaign_name || t.title || "Proposal"}</span>
                    <span className="truncate text-ds-caption text-muted-foreground">
                      {kind === "curate" ? "Curation" : isUpload ? "Content upload" : "Approval"} · {t.label}
                    </span>
                  </div>
                  {isUpload
                    ? <Badge variant="secondary" className="shrink-0">{t.creator_count} to upload</Badge>
                    : <Badge variant="outline" className="shrink-0 capitalize">{(t.status || "").replace(/_/g, " ")}</Badge>}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </ListRow>
              );
            })}
          </div>
        )}
      </section>

      {/* Your brands */}
      <section className="flex flex-col gap-ds-3">
        <div className="flex items-center gap-ds-2">
          <Users2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-ds-heading">Your brands</h2>
          {!loading && !clientsFailed && clients.length > 0 && (
            <Badge variant="secondary">{clients.length}</Badge>
          )}
        </div>

        {loading ? (
          <Loading rows={2} />
        ) : clientsFailed ? (
          <LoadFailed
            what="Your brands"
            detail="We could not reach your client list. You may well have brands assigned; we just cannot read them right now."
            onRetry={() => void load()}
          />
        ) : clients.length === 0 ? (
          <Nothing>No brands assigned yet. A superadmin grants you access to specific clients.</Nothing>
        ) : (
          /* A brand IS a real object you open, so it keeps its card. The card keeps the
             24px it ships with, and the inner rule between the name and the three figures
             is gone: space says the same thing without a second edge. */
          <div className="grid grid-cols-1 gap-ds-3 md:grid-cols-2">
            {clients.map((c) => (
              <Card
                key={c.team_id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/staff/clients/${c.team_id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/staff/clients/${c.team_id}`); }
                }}
                className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <CardContent className="flex flex-col gap-ds-4 p-6">
                  <div className="flex items-center gap-ds-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-ds-lg bg-muted">
                      {c.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : <Building2 className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                      <span className="truncate text-ds-label">{c.name}</span>
                      <span className="text-ds-caption text-muted-foreground">Updated {relTime(c.last_activity)}</span>
                    </div>
                    {(c.open_proposals || 0) > 0 && (
                      <Badge variant="secondary" className="shrink-0">
                        {c.open_proposals} proposal{c.open_proposals === 1 ? "" : "s"}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </div>

                  <dl className="grid grid-cols-3 gap-ds-3">
                    {([
                      ["Active", c.active_campaigns],
                      ["Campaigns", c.campaigns],
                      ["Proposals", c.open_proposals],
                    ] as const).map(([label, n]) => (
                      <div key={label} className="flex flex-col gap-ds-1">
                        <dd className="text-ds-heading leading-none tabular-nums">
                          <Figure value={n ?? 0} />
                        </dd>
                        <dt className="text-ds-overline uppercase text-muted-foreground">{label}</dt>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
