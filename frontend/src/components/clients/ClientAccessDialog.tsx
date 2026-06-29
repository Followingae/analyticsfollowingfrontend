"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Mail, RefreshCw, Send, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { clientApi, type AccountEmailFields } from "@/services/clientManagementApi";

interface Props {
  teamId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const EMPTY: AccountEmailFields = {
  recipient_name: "", email: "", password: "", login_url: "platform.following.ae",
  cta_label: "Open the platform", show_security_note: true, subject: "Your Following account is live",
};

export function ClientAccessDialog({ teamId, open, onOpenChange }: Props) {
  const [fields, setFields] = useState<AccountEmailFields>(EMPTY);
  const [cc, setCc] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof AccountEmailFields>(k: K, v: AccountEmailFields[K]) =>
    setFields((f) => ({ ...f, [k]: v }));

  const refreshPreview = useCallback(async (overrides: Partial<AccountEmailFields>) => {
    try {
      setLoading(true);
      const res = await clientApi.previewAccountEmail(teamId, overrides);
      setHtml(res.data.html);
      return res.data;
    } catch (e: any) {
      toast.error(e?.message || "Failed to render preview");
      return null;
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Initial load when opened
  useEffect(() => {
    if (!open) return;
    (async () => {
      const data = await refreshPreview({});
      if (data) {
        setFields(data.fields);
        setCc((data.default_cc || []).join(", "));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teamId]);

  // Debounced live preview as fields change
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { refreshPreview(fields); }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.recipient_name, fields.email, fields.password, fields.login_url, fields.cta_label, fields.show_security_note]);

  const handleReset = async () => {
    try {
      setResetting(true);
      const res = await clientApi.resetPassword(teamId);
      set("password", res.data.password);
      toast.success("Password reset — new password filled in below");
    } catch (e: any) {
      toast.error(e?.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  const handleSend = async () => {
    if (!fields.password || fields.password.includes("•")) {
      toast.error("Set or reset the password first so the email shows real credentials");
      return;
    }
    try {
      setSending(true);
      const ccList = cc.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await clientApi.sendAccountEmail(teamId, { ...fields, cc: ccList });
      toast.success(res.message || "Email sent");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(fields.password).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Account access &amp; onboarding email
          </DialogTitle>
          <DialogDescription>
            Review and edit the copy, set the password, then send the &ldquo;account created&rdquo; email.
            zain@following.ae is always CC&apos;d.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[72vh] grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          {/* Editor */}
          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Recipient name</Label>
                <Input value={fields.recipient_name} onChange={(e) => set("recipient_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recipient email</Label>
                <Input value={fields.email} onChange={(e) => set("email", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input value={fields.subject} onChange={(e) => set("subject", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Password (shown in the email)</Label>
              <div className="flex items-center gap-2">
                <Input value={fields.password} onChange={(e) => set("password", e.target.value)} className="font-mono" />
                <Button type="button" variant="outline" size="icon" onClick={copyPassword} title="Copy">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={resetting} className="shrink-0 gap-1.5">
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Reset
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                &ldquo;Reset&rdquo; sets a new login password for the client and fills it here. Editing this field alone does <b>not</b> change their password.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Login URL</Label>
                <Input value={fields.login_url} onChange={(e) => set("login_url", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Button label</Label>
                <Input value={fields.cta_label} onChange={(e) => set("cta_label", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">CC (comma separated)</Label>
              <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="zain@following.ae, ..." />
              <p className="text-[11px] text-muted-foreground">zain@following.ae is enforced server-side even if removed here.</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Security note</Label>
                <p className="text-[11px] text-muted-foreground">Show the &ldquo;keep these details private&rdquo; footer note.</p>
              </div>
              <Switch checked={fields.show_security_note} onCheckedChange={(v) => set("show_security_note", v)} />
            </div>

            <Separator />
            <Button onClick={handleSend} disabled={sending || loading} className="w-full gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to {fields.email || "client"}
            </Button>
          </div>

          {/* Live preview */}
          <div className="relative border-l bg-muted/30">
            <div className="flex items-center justify-between border-b bg-background/60 px-4 py-2 text-xs text-muted-foreground">
              <span>Live preview</span>
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            </div>
            <iframe
              title="Email preview"
              srcDoc={html}
              className="h-[calc(72vh-37px)] w-full bg-white"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
