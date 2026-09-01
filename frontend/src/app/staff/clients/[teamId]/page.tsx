"use client";

/**
 * One brand, as the staff member who looks after it sees it.
 *
 * WORKING tier. 40px between subjects, 16px between siblings, and the two lists are lists:
 * a shared hairline down the side rather than a border drawn around every row. Rows as
 * cards fitted four where eight belong, and told the reader each row was a separate object.
 *
 * Status colour comes from the global semantic tokens rather than the six hand-picked
 * Tailwind palettes it used before, so "approved" here is the same green as approved
 * anywhere else, and the word is always beside the colour.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Megaphone, FileText, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { staffApi, type StaffBrandDetail } from "@/services/staffApi";
import { ListRow, LoadFailed, Loading, Nothing } from "@/components/brand/primitives";

/** One decision about what a status means, in the tokens the rest of the app uses. */
function statusTone(s: string): string {
  const v = (s || "").toLowerCase();
  if (/(active|approved|internally_approved|sent|live)/.test(v)) return "bg-success/12 text-success border-success/25";
  if (/(reject|cancel|archiv)/.test(v)) return "bg-danger/12 text-danger border-danger/25";
  if (/(draft|building|pending|review|more_requested)/.test(v)) return "bg-warning/15 text-warning border-warning/25";
  return "bg-muted text-muted-foreground border-transparent";
}

export default function StaffClientDetail() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = params.teamId;
  const [data, setData] = useState<StaffBrandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await staffApi.clientDetail(teamId));
    } catch (e) {
      setData(null);
      setError((e as Error).message || null);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { void load(); }, [load]);

  const back = (
    <Button variant="ghost" size="sm" onClick={() => router.push("/staff")}
            className="-ml-2 gap-ds-2 self-start">
      <ArrowLeft className="h-4 w-4" /> Your brands
    </Button>
  );

  if (loading) {
    return (
      <div data-density="working" className="flex flex-col gap-ds-4">
        {back}
        <Loading rows={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div data-density="working" className="flex flex-col gap-ds-4">
        {back}
        <LoadFailed what="This brand" detail={error} onRetry={() => void load()} />
      </div>
    );
  }

  const { brand, campaigns, proposals } = data;
  const activeCount = campaigns.filter((c) => (c.status || "").toLowerCase() === "active").length;

  return (
    <div data-density="working" className="flex flex-col gap-ds-5">
      {back}

      <header className="flex items-center gap-ds-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-ds-xl bg-muted">
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt="" className="h-full w-full object-cover" />
          ) : <Building2 className="h-7 w-7 text-muted-foreground" />}
        </div>
        <div className="flex min-w-0 flex-col gap-ds-2">
          <h1 className="truncate text-ds-title text-foreground">{brand.name}</h1>
          <p className="text-ds-caption text-muted-foreground">
            {activeCount} active · {campaigns.length} campaigns · {proposals.length} proposals
          </p>
        </div>
      </header>

      {/* Proposals */}
      <section className="flex flex-col gap-ds-3">
        <div className="flex items-center gap-ds-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-ds-heading">Proposals</h2>
          {proposals.length > 0 && <Badge variant="secondary">{proposals.length}</Badge>}
        </div>
        {proposals.length === 0 ? (
          <Nothing>No proposals yet.</Nothing>
        ) : (
          <div className="flex flex-col">
            {proposals.map((p) => (
              <ListRow key={p.id}
                       onClick={() => router.push(`/superadmin/proposals/${p.id}/approval`)}>
                <FileText className="h-4 w-4 flex-none text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-ds-label">{p.name || "Proposal"}</span>
                <Badge variant="outline" className={`shrink-0 capitalize ${statusTone(p.status)}`}>
                  {(p.status || "").replace(/_/g, " ")}
                </Badge>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </ListRow>
            ))}
          </div>
        )}
      </section>

      {/* Campaigns */}
      <section className="flex flex-col gap-ds-3">
        <div className="flex items-center gap-ds-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-ds-heading">Campaigns</h2>
          {campaigns.length > 0 && <Badge variant="secondary">{campaigns.length}</Badge>}
        </div>
        {campaigns.length === 0 ? (
          <Nothing>No campaigns yet.</Nothing>
        ) : (
          <div className="flex flex-col">
            {campaigns.map((c) => {
              const href = c.campaign_type === "ugc" ? `/campaigns/${c.id}/ugc` : `/campaigns/${c.id}`;
              return (
                <ListRow key={c.id} onClick={() => router.push(href)}>
                  <Megaphone className="h-4 w-4 flex-none text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                    <span className="truncate text-ds-label">{c.name}</span>
                    {c.campaign_type && (
                      <span className="text-ds-caption capitalize text-muted-foreground">
                        {c.campaign_type.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className={`shrink-0 capitalize ${statusTone(c.status)}`}>
                    {(c.status || "").replace(/_/g, " ")}
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </ListRow>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
