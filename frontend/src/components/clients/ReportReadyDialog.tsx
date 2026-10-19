"use client";

/**
 * "Your report is ready" — the fourth client email.
 *
 * Same shape as the other three: pick, read it, send it. Nothing leaves until a person
 * presses send.
 *
 * ⚠️ IT ONLY OFFERS CAMPAIGNS WITH SOMETHING RELEASED. A campaign appears here when a
 * superadmin has released at least one measured post to the client, because that is the
 * moment they have something to read. The backend refuses to send otherwise, so this list
 * and that refusal agree rather than one of them being a suggestion.
 *
 * There is almost nothing to edit, deliberately. The figures are the email and they come
 * from the same report the client opens; typing over them would let the inbox and the page
 * disagree, which is the one thing a results email cannot do.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Loader2, Mail, RefreshCw, Send } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { clientApi } from "@/services/clientManagementApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportableCampaign {
  campaign_id: string;
  campaign_name: string;
  hero_image_url: string | null;
  totals: {
    posts: number | null;
    creators: number | null;
    plays: number | null;
    engagement: number | null;
    engagement_rate_by_plays: number | null;
    engagement_rate_by_followers: number | null;
  };
}

const compact = (n?: number | null) => {
  if (n === null || n === undefined) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`.replace(".0M", "M");
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
};

export function ReportReadyDialog({
  teamId, open, onOpenChange, defaultEmail, defaultName,
}: {
  teamId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [campaigns, setCampaigns] = useState<ReportableCampaign[]>([]);
  const [chosen, setChosen] = useState<ReportableCampaign | null>(null);
  const [recipientName, setRecipientName] = useState(defaultName || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [cc, setCc] = useState("");
  const [html, setHtml] = useState("");
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || !teamId) return;
    (async () => {
      try {
        const res = await clientApi.reportableCampaigns(teamId);
        const list: ReportableCampaign[] = res?.data?.campaigns || [];
        setCampaigns(list);
        setChosen(list[0] || null);
      } catch (e: unknown) {
        toast.error((e as { message?: string })?.message || "Could not load campaigns");
      }
    })();
  }, [open, teamId]);

  useEffect(() => {
    if (!chosen) return;
    setSubject(`Your report is ready | ${chosen.campaign_name}`);
  }, [chosen]);

  const refreshPreview = useCallback(async () => {
    if (!teamId || !chosen) { setHtml(""); return; }
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await clientApi.previewReportReady(teamId, {
        campaign_id: chosen.campaign_id,
        recipient_name: recipientName || undefined,
        subject: subject || undefined,
        note: note || undefined,
        to: email || undefined,
      });
      setHtml(res?.data?.html || "");
      setPending(res?.data?.pending_posting ?? 0);
      if (res?.data?.to && !email) setEmail(res.data.to);
    } catch (e: unknown) {
      setLoadErr((e as { message?: string })?.message || "Failed to render preview");
    } finally {
      setLoading(false);
    }
  }, [teamId, chosen, recipientName, subject, note, email]);

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
      const res = await clientApi.sendReportReady(teamId, {
        campaign_id: chosen.campaign_id,
        recipient_name: recipientName || undefined,
        subject: subject || undefined,
        note: note || undefined,
        to: email || undefined,
        cc: cc.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success(res?.message || `Report email sent to ${email}`);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Your report is ready
          </DialogTitle>
          <DialogDescription>
            The figures come from the report they open, so the inbox and the page cannot
            disagree. Only released posts are counted.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[72vh] grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Which campaign</Label>
              {campaigns.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-[11px] text-muted-foreground">
                  Nothing has been released to this client yet. Release the measured posts on
                  a campaign and it will appear here.
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
                        <p className="truncate text-[13px] font-medium">{c.campaign_name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {[
                            c.totals.posts ? `${c.totals.posts} posts` : null,
                            compact(c.totals.plays) ? `${compact(c.totals.plays)} views` : null,
                            c.totals.creators ? `${c.totals.creators} creators` : null,
                          ].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {pending > 0 && (
              <Badge variant="secondary" className="rounded-full font-normal">
                {pending === 1 ? "1 creator" : `${pending} creators`} still to post
              </Badge>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Their name</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                       placeholder="First name" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="name@company.com" className="h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Anything to add (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)}
                     placeholder="One line, in your own words" className="h-9" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">CC (comma separated)</Label>
              <Input value={cc} onChange={(e) => setCc(e.target.value)} className="h-9" />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleSend} disabled={sending || !chosen || !email} className="gap-1.5">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                         : <Send className="h-3.5 w-3.5" />}
                Send it
              </Button>
              <Button variant="outline" onClick={refreshPreview} disabled={loading} className="gap-1.5">
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* What they will actually receive. */}
          <div className="min-h-[320px] overflow-y-auto border-l bg-muted/20">
            {loadErr ? (
              <p className="p-6 text-[12.5px] text-destructive">{loadErr}</p>
            ) : html ? (
              <iframe title="Report email preview" srcDoc={html}
                      className="h-[72vh] w-full border-0 bg-white" />
            ) : (
              <div className="flex h-[320px] items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Building it</>
                         : <><Mail className="h-4 w-4" /> Pick a campaign</>}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
