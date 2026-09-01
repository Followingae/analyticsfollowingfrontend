"use client";

/**
 * Staff — the internal team, and what each of them can reach.
 *
 * A card per person put an edge around every row of a list whose rows are all the same kind
 * of thing, and the avatar tile was a tinted box holding a shield icon that said nothing the
 * word "Staff" above it did not. Rows now, separated by a hairline.
 *
 * The load used to end `.catch(() => setStaff([]))`, so a refused or broken read rendered as
 * "No staff yet. Create one from Users." — an instruction to create accounts that already
 * exist, on a screen that had simply failed to ask. A failure says so, and offers a retry.
 */

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck, Building2 } from "lucide-react";
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout";
import { PageHead } from "@/components/console/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffAdminApi, type StaffMember } from "@/services/staffApi";
import { StaffAccessDialog } from "@/components/superadmin/StaffAccessDialog";

const ROLE_LABEL: Record<string, string> = {
  talent_manager: "Talent Manager", account_manager: "Account Manager",
  business_development: "Business Development", cofounder: "Cofounder", ceo: "CEO",
};

export default function SuperadminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);
  const [manageId, setManageId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    staffAdminApi.list()
      .then((rows) => { setStaff(rows); setFailure(null); })
      .catch((e: unknown) => {
        setStaff([]);
        setFailure(e instanceof Error && e.message ? e.message : "The request did not complete");
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <PageHead
          title="Staff"
          sub="The internal team. Control which modules each member can open, and which clients they can see."
        />

        {loading ? (
          <div className="flex justify-center py-ds-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : failure ? (
          /* An error is not an empty list. Saying "no staff yet" here would send someone
             off to create accounts that already exist. */
          <div className="py-ds-6 text-center">
            <p className="text-ds-subheading">Could not load the staff list</p>
            <p className="mt-ds-2 text-ds-body text-muted-foreground">
              Nobody is missing, we just could not read the list. Nothing here is a count of zero.
            </p>
            <p className="mt-ds-2 text-ds-caption text-muted-foreground">{failure}</p>
            <Button variant="outline" size="sm" className="mt-ds-3" onClick={load}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : staff.length === 0 ? (
          <p className="py-ds-6 text-center text-ds-body text-muted-foreground">
            No staff accounts yet. Create one from Users, New user, Staff.
          </p>
        ) : (
          <div className="divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.07] dark:border-white/[0.07]">
            {staff.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-ds-3 py-ds-3">
                <div className="min-w-0">
                  <p className="truncate text-ds-label">{s.full_name || s.email}</p>
                  <p className="mt-ds-1 truncate text-ds-caption text-muted-foreground">{s.email}</p>
                </div>
                <div className="flex items-center gap-ds-2">
                  <Badge variant="secondary">{ROLE_LABEL[s.staff_role] || s.staff_role}</Badge>
                  {/* A row that came back without its client count said "0 clients", which
                      on this screen reads as "this person has been given nothing" — the
                      exact thing you would come here to fix. Absent means the badge is
                      simply not drawn; a real zero still says 0 clients. */}
                  {typeof s.client_count === "number" && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Building2 className="h-3 w-3" />
                      {s.client_count} client{s.client_count === 1 ? "" : "s"}
                    </Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setManageId(s.id)} className="gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Manage access
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <StaffAccessDialog staffId={manageId} open={!!manageId} onOpenChange={(o) => { if (!o) setManageId(null); }} onSaved={load} />
      </div>
    </SuperadminLayout>
  );
}
