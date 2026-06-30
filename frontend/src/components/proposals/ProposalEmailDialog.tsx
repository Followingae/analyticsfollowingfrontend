"use client";

import { useEffect, useState } from "react";
import { Loader2, Send, Mail } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_CONFIG } from "@/config/api";
import { fetchWithAuth } from "@/utils/apiInterceptor";

async function post(path: string, body: unknown) {
  const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || `Failed (${res.status})`);
  return json;
}

export function ProposalEmailDialog({ proposalId, open, onOpenChange }: {
  proposalId: string | null; open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [html, setHtml] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [cc, setCc] = useState("");
  const [mandatoryCc, setMandatoryCc] = useState<string[]>([]);

  const render = async (overrides: Record<string, unknown> = {}) => {
    if (!proposalId) return;
    const r = await post(`/api/v1/admin/proposals/${proposalId}/proposal-email/preview`, overrides);
    const d = r.data;
    setHtml(d.html);
    if (overrides.to === undefined) setTo(d.to || "");
    if (overrides.recipient_name === undefined) setRecipientName(d.fields?.recipient_name || "");
    if (overrides.subject === undefined) setSubject(d.fields?.subject || "");
    if (overrides.review_url === undefined) setReviewUrl(d.fields?.review_url || "");
    setMandatoryCc(d.default_cc || []);
    if (overrides.recipient_name === undefined && !cc) {
      setCc((d.suggested_cc || []).join(", "));
    }
  };

  useEffect(() => {
    if (!open || !proposalId) return;
    setLoading(true);
    render().catch((e) => toast.error(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, proposalId]);

  // Debounced re-render when editable copy fields change
  useEffect(() => {
    if (!open || !proposalId || loading) return;
    const t = setTimeout(() => {
      render({ recipient_name: recipientName, subject, review_url: reviewUrl }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientName, reviewUrl]);

  const ccList = () => cc.split(",").map((s) => s.trim()).filter(Boolean);

  const send = async () => {
    if (!proposalId) return;
    if (!to.trim()) { toast.error("Recipient email is required"); return; }
    try {
      setSending(true);
      const r = await post(`/api/v1/admin/proposals/${proposalId}/proposal-email/send`, {
        to, recipient_name: recipientName, subject, review_url: reviewUrl, cc: ccList(),
      });
      toast.success(r.message || "Proposal email sent");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Send proposal email</DialogTitle>
          <DialogDescription>Manually email the client that their proposal is ready. zain@following.ae is always CC&apos;d.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
            <div className="space-y-3 md:col-span-2">
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="client@brand.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CC (comma-separated)</Label>
                <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="account.manager@following.ae" />
                {mandatoryCc.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">Always CC&apos;d: {mandatoryCc.join(", ")}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recipient name</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Review link (CTA)</Label>
                <Input value={reviewUrl} onChange={(e) => setReviewUrl(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label className="text-xs">Live preview</Label>
              <iframe title="Email preview" srcDoc={html}
                className="h-[640px] w-full rounded-lg border bg-white" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
          <Button onClick={send} disabled={sending || loading} className="gap-1.5">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
