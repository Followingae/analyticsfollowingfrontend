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
      const res = await notificationApiService.getNotifications({ unread_only: true, page_size: 8 });
      const unread = (res.data || []).filter((n) => !n.is_read);
      if (unread.length === 0) return;
      setShownThisLoad(true);
      setItems(unread);
      setOpen(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, user?.email, onAuthPage]);

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

      <Dialog open={open} onOpenChange={setOpen}>
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
                <button key={n.id} type="button" onClick={() => openItem(n)}
                  className="group flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{n.title}</div>
                    {n.message && <div className="line-clamp-2 text-xs text-muted-foreground">{n.message}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 self-center">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); markRead(n.id); } }}
                      title="Mark as read"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {n.action_url && <ArrowRight className="h-4 w-4 text-muted-foreground/50" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Later</Button>
            <Button size="sm" onClick={markAll} disabled={busy} className="gap-1.5">
              <Check className="h-4 w-4" /> Mark all as read
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
