"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PartyPopper, Megaphone, FileCheck2, Sparkles, Bell, Check, ArrowRight } from "lucide-react";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Balloons } from "@/components/ui/balloons";
import { notificationApiService, type ServerNotification } from "@/services/notificationApi";

// Balloons are reserved for a brand-new proposal ONLY — not every celebratory-ish
// event (they were firing on almost every popup). A new proposal is the one moment
// worth the confetti.
const CELEBRATORY = (n: ServerNotification): boolean =>
  (n.notification_type || "").toLowerCase() === "proposal_received";

// Show-once persistence — once the user dismisses ("Later") a set of unread
// notifications, we remember their ids so the modal does NOT re-nag on every
// subsequent page load. They remain fully reachable via the bell / mark-read.
const DISMISS_KEY = "whatsnew_dismissed_ids";

// Dismissing by id is not enough on its own for anyone who receives a lot of these.
// Internal staff get dozens a day, so there was almost always one unread id nobody had
// seen yet, and the modal opened on practically every reload — which reads as a popup
// that will not stay closed. A closed modal now stays closed for the rest of the day
// whatever else arrives. The bell still carries everything, unread and counted.
const QUIET_KEY = "whatsnew_quiet_until";
const QUIET_HOURS = 12;

// ⚠️ SOME NEWS OUTRANKS THE QUIET PERIOD. The 12-hour hush exists because staff receive
// dozens of notifications a day and the modal was opening on practically every reload.
// But it is a blunt instrument: it also swallowed the handful of things a person actually
// logs in hoping to see, because something unrelated had been dismissed that morning.
// A client's results arriving is the clearest case, and it happens about once per
// campaign, so it cannot become a nag. Per-id dismissal still applies: saying "Later" to
// THIS still means later.
const ALWAYS_SHOW = new Set(["campaign_report_ready", "proposal_received"]);

const outranksQuiet = (items: ServerNotification[]): boolean =>
  items.some((n) => ALWAYS_SHOW.has((n.notification_type || "").toLowerCase()));

// ⚠️ A FRESH LOGIN IS THE MOMENT SOMEBODY IS ASKING "what's new". Both suppressions here
// exist to stop the modal nagging across RELOADS, and neither should outlive the session
// that earned them: "Later" means later, and the next time you sign in IS later. Without
// this, one person opening the account once - to test it, or to glance at something else -
// silently spends the popup for everybody who signs in afterwards.
//
// `users.last_login` is the signal, because it changes on a real sign-in and not on a
// refresh. Comparing it to what we last saw tells a new session from a new page load.
const LOGIN_KEY = "whatsnew_login_seen";

// ⚠️ CLIENTS ONLY, and not out of favouritism. `last_login` is read back from the users
// row for a brand, but several internal paths build a response without one and synthesise
// `now()`, so for staff it can change on every call - which would turn "a fresh login
// clears the hush" into "every page load clears the hush", the exact nag the hush exists
// to stop. Staff reload this app all day; a client signs in occasionally and is the one
// this popup is for. If the synthesised values are ever cleaned up, widen it.
const isStaff = (role?: string | null): boolean =>
  ["super_admin", "superadmin", "admin"].includes((role || "").toLowerCase());

function clearSuppressionsOnNewLogin(lastLogin?: string | null, role?: string | null): void {
  if (typeof window === "undefined" || !lastLogin || isStaff(role)) return;
  try {
    if (window.localStorage.getItem(LOGIN_KEY) === lastLogin) return;
    window.localStorage.setItem(LOGIN_KEY, lastLogin);
    window.localStorage.removeItem(QUIET_KEY);
    window.localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* localStorage unavailable — the modal simply behaves as it did before */
  }
}

function inQuietPeriod(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const until = Number(window.localStorage.getItem(QUIET_KEY) || 0);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function startQuietPeriod() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUIET_KEY, String(Date.now() + QUIET_HOURS * 3600_000));
  } catch {
    /* localStorage unavailable — non-fatal */
  }
}

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function addDismissed(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const merged = Array.from(new Set([...getDismissed(), ...ids]));
    // Keep the list bounded so it can't grow forever.
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify(merged.slice(-200)));
  } catch {
    /* localStorage unavailable — non-fatal */
  }
}

function iconFor(n: ServerNotification) {
  const hay = `${n.notification_type} ${n.title}`.toLowerCase();
  if (/campaign|live/.test(hay)) return Megaphone;
  if (/proposal/.test(hay)) return FileCheck2;
  if (/ugc|deliverable|ready|content/.test(hay)) return Sparkles;
  return Bell;
}

export function WhatsNewModal() {
  const { isAuthenticated, user, isLoading } = useEnhancedAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<ServerNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shownThisLoad, setShownThisLoad] = useState(false);
  const balloonsRef = useRef<{ launchAnimation: () => void } | null>(null);

  const onAuthPage = pathname?.startsWith("/auth/") || pathname === "/login";

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user || onAuthPage) return;
    // Show on each page load while there are unread notifications — it persists until the
    // user marks them read (or "Later"). A per-load guard avoids re-opening if the effect
    // re-runs within the same mounted session, without suppressing it across reloads.
    if (shownThisLoad) return;

    (async () => {
      // Before reading anything: a new sign-in wipes the hush and the "Later" list, so the
      // popup is owed to whoever just logged in rather than to whoever looked last.
      clearSuppressionsOnNewLogin(user?.last_login, user?.role);

      const res = await notificationApiService.getNotifications({ unread_only: true, page_size: 8 });
      const unread = (res.data || []).filter((n) => !n.is_read);
      if (unread.length === 0) return;
      // Only auto-open if there's at least one unread the user hasn't already
      // dismissed via "Later" — otherwise this becomes a per-load nag.
      const dismissed = getDismissed();
      const fresh = unread.filter((n) => !dismissed.has(n.id));
      if (fresh.length === 0) return;
      // Closed earlier today means closed, unless what arrived outranks the hush.
      if (inQuietPeriod() && !outranksQuiet(fresh)) return;
      setShownThisLoad(true);
      setItems(unread);
      setOpen(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, user?.email, user?.last_login, onAuthPage]);

  // Fire balloons shortly after the modal opens if any item is celebratory.
  useEffect(() => {
    if (open && items.some(CELEBRATORY)) {
      const t = setTimeout(() => balloonsRef.current?.launchAnimation?.(), 350);
      return () => clearTimeout(t);
    }
  }, [open, items]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await notificationApiService.markAsRead(id);
  };

  const openItem = async (n: ServerNotification) => {
    await markRead(n.id);
    startQuietPeriod();
    setOpen(false);
    if (n.action_url) router.push(n.action_url);
  };

  const markAll = async () => {
    setBusy(true);
    await notificationApiService.markAllAsRead();
    setBusy(false);
    setItems([]);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Balloons launcher (fixed, non-interactive overlay) */}
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <Balloons ref={balloonsRef as never} type="default" />
      </div>

      <Dialog
        open={open}
        onOpenChange={(next: boolean) => {
          // Any close (X / escape / outside-click) also counts as dismissal → no re-nag.
          if (!next) { addDismissed(items.map((n) => n.id)); startQuietPeriod(); }
          setOpen(next);
        }}
      >
        <DialogContent className="max-w-md overflow-hidden p-0">
          <div className="bg-gradient-to-br from-primary/10 via-background to-background px-6 pt-6 pb-4">
            <DialogHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
                <PartyPopper className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-xl">
                {items.some(CELEBRATORY) ? "Some good news 🎉" : "What's new"}
              </DialogTitle>
              <DialogDescription>
                You have {items.length} unread update{items.length === 1 ? "" : "s"}.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto px-6 pb-2">
            {items.map((n) => {
              const Icon = iconFor(n);
              return (
                // Flattened: the row is a plain container with TWO sibling buttons
                // (open + mark-read) — no button-inside-a-button (WCAG 4.1.2).
                <div key={n.id}
                  className="group flex w-full items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent">
                  <button type="button" onClick={() => openItem(n)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{n.title}</div>
                      {n.message && <div className="line-clamp-2 text-xs text-muted-foreground">{n.message}</div>}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 self-center">
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      aria-label="Mark as read"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    {n.action_url && <ArrowRight className="h-4 w-4 text-muted-foreground/50" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Persist dismissal so these don't re-open the modal on the next load.
                addDismissed(items.map((n) => n.id));
                startQuietPeriod();
                setOpen(false);
              }}
            >
              Later
            </Button>
            <Button size="sm" onClick={markAll} disabled={busy} className="gap-1.5">
              <Check className="h-4 w-4" /> Mark all as read
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
