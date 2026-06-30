"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, ShieldCheck, Building2 } from "lucide-react";
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffAdminApi, type StaffMember } from "@/services/staffApi";
import { StaffAccessDialog } from "@/components/superadmin/StaffAccessDialog";

const ROLE_LABEL: Record<string, string> = {
  talent_manager: "Talent Manager", account_manager: "Account Manager", cofounder: "Cofounder", ceo: "CEO",
};

export default function SuperadminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageId, setManageId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    staffAdminApi.list().then(setStaff).catch(() => setStaff([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6" /> Staff</h1>
            <p className="text-sm text-muted-foreground">Internal team — control each member&apos;s modules and client access.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : staff.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
            No staff yet. Create one from Users → New user → Staff.
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {staff.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{s.full_name || s.email}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{ROLE_LABEL[s.staff_role] || s.staff_role}</Badge>
                    <Badge variant="outline" className="gap-1 text-xs"><Building2 className="h-3 w-3" />{s.client_count} client{s.client_count === 1 ? "" : "s"}</Badge>
                    <Button size="sm" variant="outline" onClick={() => setManageId(s.id)} className="gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Manage access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <StaffAccessDialog staffId={manageId} open={!!manageId} onOpenChange={(o) => { if (!o) setManageId(null); }} onSaved={load} />
      </div>
    </SuperadminLayout>
  );
}
