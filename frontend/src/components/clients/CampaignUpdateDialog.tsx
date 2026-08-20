"use client";

/**
 * Campaign update email — "there is movement on your campaign".
 *
 * The third client email, and the only one that has anything to do with work in progress.
 * Same shape as the other two on purpose: edit on the left, live preview on the right,
 * nothing leaves until a person presses send.
 *
 * Deliberately thin. The headline and what has moved since they last heard from us, then a
 * door back to the campaign page — where the picture is live and complete. An email that
 * reproduces the whole campaign is out of date the moment it lands, and it teaches the
 * client to stop opening the platform.
 *
 * The headline is prefilled from the campaign's actual state rather than typed, so the
 * sentence in their inbox is the same sentence on their page.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, RefreshCw, Send, Loader2, Sparkles, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { clientApi } from "@/services/clientManagementApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UpdatableCampaign {
  campaign_id: string;
  campaign_name: string;
  hero_image_url: string | null;
  headline: string;
  sub: string;
  highlights: string[];
  has_news: boolean;
  last_update_email_at: string | null;
  creators: number;
  live: number;
}

const since = (iso: string | null) => {
  if (!iso) return "Never told";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days < 1 ? "Told today" : days === 1 ? "Told yesterday" : `Told ${days}d ago`;
};

export function CampaignUpdateDialog({
  teamId, open, onOpenChange, defaultEmail, defaultName,
}: {
  teamId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [campaigns, setCampaigns] = useState<UpdatableCampaign[]>([]);
  const [chosen, setChosen] = useState<UpdatableCampaign | null>(null);
  const [recipientName, setRecipientName] = useState(defaultName || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [subject, setSubject] = useState("");
  const [headline, setHeadline] = useState("");
  const [sub, setSub] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || !teamId) return;
    (async () => {
      try {
        const res = await clientApi.updatableCampaigns(teamId);
        const list: UpdatableCampaign[] = res?.data?.campaigns || [];
        setCampaigns(list);
        // The one with news, if there is one — that is why somebody opened this.
        const first = list.find((c) => c.has_news) || list[0] || null;
        setChosen(first);
      } catch (e: unknown) {
        toast.error((e as { message?: string })?.message || "Could not load campaigns");
      }
    })();
  }, [open, teamId]);

  // Picking a campaign re-fills the wording from what is actually true of it.
  useEffect(() => {
    if (!chosen) return;
    setHeadline(chosen.headline);
    setSub(chosen.sub);
    setSubject(`Your campaign has an update — ${chosen.campaign_name}`);
  }, [chosen]);

  const refreshPreview = useCallback(async () => {
    if (!teamId || !chosen) { setHtml(""); return; }
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await clientApi.previewCampaignUpdate(teamId, {
        campaign_id: chosen.campaign_id,
        recipient_name: recipientName || undefined,
        headline: headline || undefined,
        sub: sub || undefined,
        subject: subject || undefined,
        to: email || undefined,
      });
      setHtml(res?.data?.html || "");
      if (res?.data?.to && !email) setEmail(res.data.to);
    } catch (e: unknown) {
      setLoadErr((e as { message?: string })?.message || "Failed to render preview");
    } finally {
      setLoading(false);
    }
  }, [teamId, chosen, recipientName, headline, sub, subject, email]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { refreshPreview(); }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [open, refreshPreview]);

  const handleSend = async () => {
    if (!chosen) { toast.error("Pick a campaign"); return; }
    setSending(true);
    try {
      const res = await clientApi.sendCampaignUpdate(teamId, {
        campaign_id: chosen.campaign_id,
        recipient_name: recipientName || undefined,
        headline: headline || undefined,
        sub: sub || undefined,
        subject: subject || undefined,
        to: email || undefined,
        cc: cc.split(",").map((s) => s.trim()).filter(Boolean),
        bcc: bcc.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success(res?.message || `Update sent to ${email}`);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl p-0 sm:max-w-5xl overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Campaign update email
          </DialogTitle>
          <DialogDescription>
            Tells them their campaign has moved and sends them to it. Built from the campaign&apos;s
            real state — nothing here goes out on a timer.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[72vh] grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Which campaign</Label>
              {campaigns.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-[11px] text-muted-foreground">
                  This client has no managed campaigns yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {campaigns.map((c) => (
                    <button
                      key={c.campaign_id}
                      type="button"
                      onClick={() => setChosen(c)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/40",
                        chosen?.campaign_id === c.campaign_id && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.campaign_name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{c.headline} · {c.sub}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{since(c.last_update_email_at)}</p>
                      </div>
                      {c.has_news && (
                        <Badge variant="secondary" className="shrink-0 gap-1 rounded-full text-[10.5px]">
                          <Sparkles className="h-3 w-3" />New
                        </Badge>
                      )}
                      {chosen?.campaign_id === c.campaign_id && (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!!chosen?.highlights?.length && (
              <div className="rounded-lg bg-muted/50 p-3">
                <Label className="text-xs">What moved since they last heard</Label>
                <ul className="mt-1.5 space-y-1 text-[12.5px] text-muted-foreground">
                  {chosen.highlights.map((h, i) => <li key={i}>• {h}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Recipient name</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recipient email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Headline</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">
                Prefilled from the campaign so the email and the page say the same thing.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Under the headline</Label>
              <Input value={sub} onChange={(e) => setSub(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">CC (comma separated)</Label>
              <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="ops@client.com, ..." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">BCC (comma separated)</Label>
              <Input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="zain@following.ae, ..." />
              <p className="text-[11px] text-muted-foreground">A blind copy, for the person who needs to see it without the client knowing they are on it.</p>
            </div>

            <Separator />
            <Button onClick={handleSend} disabled={sending || loading || !chosen} className="w-full gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to {email || "client"}
            </Button>
          </div>

          <div className="relative border-l bg-muted/30">
            <div className="flex items-center justify-between border-b bg-background/60 px-4 py-2 text-xs text-muted-foreground">
              <span>Live preview</span>
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            </div>
            {loadErr ? (
              <div className="p-6 text-sm text-muted-foreground">{loadErr}</div>
            ) : (
              <iframe title="Update preview" srcDoc={html} className="h-[calc(72vh-37px)] w-full bg-white" />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
