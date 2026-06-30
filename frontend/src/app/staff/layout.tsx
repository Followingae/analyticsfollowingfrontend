"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Briefcase } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffApi, type StaffMe } from "@/services/staffApi";

const ROLE_LABEL: Record<string, string> = {
  talent_manager: "Talent Manager",
  account_manager: "Account Manager",
  cofounder: "Cofounder",
  ceo: "CEO",
};

function StaffShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useEnhancedAuth();
  const [me, setMe] = useState<StaffMe | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const m = await staffApi.me();
        if (!m.staff_role) { router.replace("/dashboard"); return; }
        setMe(m);
      } catch {
        router.replace("/dashboard");
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!me) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button type="button" onClick={() => router.push("/staff")} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold">Following · Staff</div>
              <div className="text-[11px] text-muted-foreground">{user?.full_name || user?.email}</div>
            </div>
          </button>
          <div className="flex items-center gap-3">
            {me.staff_role && <Badge variant="secondary">{ROLE_LABEL[me.staff_role] || me.staff_role}</Badge>}
            <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true}>
      <StaffShell>{children}</StaffShell>
    </AuthGuard>
  );
}
