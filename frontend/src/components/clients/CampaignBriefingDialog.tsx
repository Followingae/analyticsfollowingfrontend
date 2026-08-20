"use client";

/**
 * Campaign briefing email — "here's how to run what you have live".
 *
 * Mirrors ClientAccessDialog deliberately: same two-pane edit + live preview, same
 * manual send. Nothing on this platform emails a client automatically, and this is
 * no exception — a superadmin reads it and presses send.
 *
 * The body is assembled server-side from the client's ACTUAL live campaigns, so the
 * only real choice here is which campaigns to include. Deselect everything and there
 * is nothing to brief on, which the backend rejects rather than sending a hollow email.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, RefreshCw, Send, Loader2, UtensilsCrossed, Truck, Coins } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { clientApi } from "@/services/clientManagementApi";
import { toast } from "sonner";

interface BriefingCampaign {
  id: string;
  name: string;
  campaign_type: string;
  fulfilment_mode: string | null;
  venue_name: string | null;
  share_url: string;
}

const typeMeta = (c: BriefingCampaign) => {
  if (c.fulfilment_mode === "dine_in") return { icon: UtensilsCrossed, label: "In-person" };
  if (c.campaign_type === "cashback") return { icon: Coins, label: "Cashback" };
  return { icon: Truck, label: c.campaign_type === "paid_deal" ? "Paid" : "Delivery" };
};

export function CampaignBriefingDialog({
  teamId, open, onOpenChange, defaultEmail, defaultName,
}: {
  teamId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [campaigns, setCampaigns] = useState<BriefingCampaign[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState(defaultName || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [subject, setSubject] = useState("How to run your Following campaigns");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the client's live campaigns, all selected by default — the common case is
  // "brief them on everything they're running".
  useEffect(() => {
    if (!open || !teamId) return;
    (async () => {
      try {
        const res = await clientApi.briefingCampaigns(teamId);
        const list: BriefingCampaign[] = res?.data?.campaigns || [];
        setCampaigns(list);
        setSelected(list.map((c) => c.id));
      } catch (e: unknown) {
        toast.error((e as { message?: string })?.message || "Could not load campaigns");
      }
    })();
  }, [open, teamId]);

  const refreshPreview = useCallback(async () => {
    if (!teamId || selected.length === 0) { setHtml(""); return; }
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await clientApi.previewCampaignBriefing(teamId, {
        recipient_name: recipientName || undefined,
        email: email || undefined,
        subject: subject || undefined,
        campaign_ids: selected,
      });
      setHtml(res?.data?.html || "");
      if (res?.data?.to && !email) setEmail(res.data.to);
    } catch (e: unknown) {
      setLoadErr((e as { message?: string })?.message || "Failed to render preview");
    } finally {
      setLoading(false);
    }
  }, [teamId, selected, recipientName, email, subject]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { refreshPreview(); }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [open, refreshPreview]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSend = async () => {
    if (selected.length === 0) { toast.error("Pick at least one campaign"); return; }
    setSending(true);
    try {
      const res = await clientApi.sendCampaignBriefing(teamId, {
        recipient_name: recipientName || undefined,
        email: email || undefined,
        subject: subject || undefined,
        campaign_ids: selected,
        cc: cc.split(",").map((s) => s.trim()).filter(Boolean),
        bcc: bcc.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success(res?.message || `Briefing sent to ${email}`);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl sm:max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Campaign briefing email
          </DialogTitle>
          <DialogDescription>
            Explains approvals, visit logging, content review and their share links — built from the
            campaigns they actually have live. zain@following.ae is always CC&apos;d.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[72vh] grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          <div className="space-y-4 overflow-y-auto px-6 py-4">
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
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Campaigns to brief on</Label>
              {campaigns.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-[11px] text-muted-foreground">
                  This client has no live campaigns. There&apos;s nothing to brief on yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {campaigns.map((c) => {
                    const { icon: Icon, label } = typeMeta(c);
                    return (
                      <label key={c.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 hover:bg-muted/40">
                        <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggle(c.id)} className="mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Icon className="h-3 w-3" />{label}
                            {c.venue_name ? ` · ${c.venue_name}` : ""}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Only the sections that apply get written — a delivery-only client never sees the
                venue instructions.
              </p>
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
            <Button onClick={handleSend} disabled={sending || loading || selected.length === 0} className="w-full gap-2">
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
              <iframe title="Briefing preview" srcDoc={html} className="h-[calc(72vh-37px)] w-full bg-white" />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
