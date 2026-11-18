'use client'

/**
 * Put a merchant on the platform.
 *
 * RFM Loyalty tells us a merchant is signed up. Somebody here types in the business, the
 * person, and the logo creators will see, and presses one button. The platform creates the
 * account, its team and wallet, and emails a welcome carrying a set-password link. There is
 * no second step and nothing to come back to.
 *
 * The logo is required because the first thing this merchant does is build a campaign, and
 * a campaign card with a blank where the logo goes is what creators would be pushed.
 *
 * After it works the dialog stays open and says so calmly. The set-password link is shown
 * for support only: the merchant has it in their inbox, and this copy exists for the call
 * where they say they never got it.
 */

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, ImageIcon, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { faMerchantApi } from '@/services/faAdminApi'
import {
  MERCHANT_CATEGORIES, categoryFromBusinessType, merchantAdminApi,
  type OnboardMerchantResult,
} from '@/services/merchantAdminApi'
import { cn } from '@/lib/utils'

/** What a partner lead can hand the form. Every field optional: a merchant who is not a
 *  lead opens the same dialog empty. */
export interface OnboardPrefill {
  partner_lead_id?: string
  business_name?: string | null
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  business_type?: string | null
}

interface Form {
  email: string
  business_name: string
  category: string
  logo_url: string
  cover_image_url: string
  contact_name: string
  phone: string
  address: string
}

const EMPTY: Form = {
  email: '', business_name: '', category: '', logo_url: '', cover_image_url: '',
  contact_name: '', phone: '', address: '',
}

const fromPrefill = (p?: OnboardPrefill | null): Form => ({
  ...EMPTY,
  email: p?.email?.trim() || '',
  business_name: p?.business_name?.trim() || '',
  contact_name: p?.contact_name?.trim() || '',
  phone: p?.phone?.trim() || '',
  category: categoryFromBusinessType(p?.business_type),
})

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function OnboardMerchantDialog({
  open, onOpenChange, prefill, onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefill?: OnboardPrefill | null
  /** Fires once the account exists. The caller updates its own row or list. */
  onCreated?: (result: OnboardMerchantResult, form: { email: string; business_name: string }) => void
}) {
  const [form, setForm] = useState<Form>(() => fromPrefill(prefill))
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null)
  const [done, setDone] = useState<OnboardMerchantResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* A fresh open is a fresh form. Reset on open, not on close, so the confirmation is still
     readable while the dialog animates away. */
  useEffect(() => {
    if (open) {
      setForm(fromPrefill(prefill))
      setDone(null)
      setError(null)
      setBusy(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill?.partner_lead_id, prefill?.email])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }))

  const missing = useMemo(() => {
    const m: string[] = []
    if (!form.email.trim()) m.push('an email')
    else if (!EMAIL_OK.test(form.email.trim())) m.push('a valid email')
    if (!form.business_name.trim()) m.push('the business name')
    if (!form.category) m.push('a category')
    if (!form.logo_url) m.push('a logo')
    return m
  }, [form])

  const upload = async (file: File, kind: 'logo' | 'cover') => {
    setUploading(kind)
    try {
      const res = await faMerchantApi.uploadLogo(file)
      const url: string | undefined = res?.data?.url || res?.url
      if (!url) throw new Error('The upload returned no address for the image')
      set(kind === 'logo' ? 'logo_url' : 'cover_image_url', url)
    } catch (e) {
      toast.error((e as Error).message || 'The image did not upload')
    } finally {
      setUploading(null)
    }
  }

  const submit = async () => {
    if (missing.length) {
      setError(`Still needed: ${missing.join(', ')}.`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const r = await merchantAdminApi.onboard({
        email: form.email.trim().toLowerCase(),
        business_name: form.business_name.trim(),
        category: form.category,
        logo_url: form.logo_url,
        cover_image_url: form.cover_image_url || undefined,
        contact_name: form.contact_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        partner_lead_id: prefill?.partner_lead_id || undefined,
        send_email: true,
      })
      setDone(r)
      onCreated?.(r, { email: form.email.trim().toLowerCase(), business_name: form.business_name.trim() })
    } catch (e) {
      const err = e as Error & { status?: number }
      setError(err.status === 409
        ? `${form.email.trim()} already belongs to an account that is not a merchant. Use a different address, or ask a founder to move the account.`
        : err.status === 404
          ? 'Onboarding is not switched on yet on the server. Nothing was created.'
          : err.message || 'The account was not created.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!busy) onOpenChange(o) }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[600px]">
        {done ? (
          <Confirmation result={done} form={form} onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Onboard a merchant</DialogTitle>
              <DialogDescription>
                Creates the account and emails a welcome with a set-password link. The merchant
                builds their own campaign from there.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business name" required>
                  <Input value={form.business_name} onChange={e => set('business_name', e.target.value)}
                         placeholder="The name creators will see" autoFocus />
                </Field>
                <Field label="Category" required>
                  <Select value={form.category} onValueChange={(v: string) => set('category', v)}>
                    <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
                    <SelectContent>
                      {MERCHANT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Login email" required hint="The welcome goes here. This becomes their login.">
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                       placeholder="owner@business.ae" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <ImagePicker
                  label="Logo"
                  required
                  hint="Square works best"
                  url={form.logo_url}
                  uploading={uploading === 'logo'}
                  onPick={f => upload(f, 'logo')}
                  onClear={() => set('logo_url', '')}
                  fit="contain"
                />
                <ImagePicker
                  label="Cover photo"
                  hint="Optional. Sits behind the campaign card."
                  url={form.cover_image_url}
                  uploading={uploading === 'cover'}
                  onPick={f => upload(f, 'cover')}
                  onClear={() => set('cover_image_url', '')}
                  fit="cover"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact name">
                  <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                         placeholder="Who we speak to" />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={e => set('phone', e.target.value)}
                         placeholder="+971 50 000 0000" inputMode="tel" />
                </Field>
              </div>

              <Field label="Address" hint="Where creators go. Shown on the campaign as the visit line.">
                <Input value={form.address} onChange={e => set('address', e.target.value)}
                       placeholder="Shop 4, Al Wasl Road, Jumeirah, Dubai" />
              </Field>

              {error && (
                <p className="rounded-ds-lg bg-[var(--tone-bad-wash)] px-3 py-2 text-[13px] text-[var(--tone-bad-ink)]">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={busy || uploading !== null} onClick={submit}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
                Create account and send welcome
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** It worked. Say what happened, show the link for the support call, and stop. */
function Confirmation({ result, form, onClose }: {
  result: OnboardMerchantResult
  form: Form
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.set_password_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy. Select the link and copy it by hand.')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]">
            <Check className="size-3.5" aria-hidden />
          </span>
          {form.business_name} is on the platform
        </DialogTitle>
        <DialogDescription>
          {result.created
            ? result.email_sent
              ? `The welcome has gone to ${form.email}. They set a password from it and can sign in straight away.`
              : `The account exists, but the welcome email did not go. Send them the link below, or use Resend welcome from the merchants list.`
            : `${form.email} already had a merchant account. Nothing was duplicated.`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 py-2">
        <Label className="text-[12.5px] text-muted-foreground">Set-password link, for support only</Label>
        <div className="flex items-center gap-2">
          <Input readOnly value={result.set_password_url} className="font-mono text-[12px]"
                 onFocus={e => e.currentTarget.select()} />
          <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={copy}>
            {copied ? <Check className="mr-1.5 size-3.5" aria-hidden /> : <Copy className="mr-1.5 size-3.5" aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          The merchant already has this in their inbox. Give it out only to the person whose email it went to.
        </p>
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </>
  )
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">
        {label}
        {required && <span className="ml-1 text-muted-foreground" aria-hidden>*</span>}
      </Label>
      {children}
      {hint && <p className="text-[12px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** One image slot: a drop target when empty, the picture with a clear button once filled. */
function ImagePicker({ label, required, hint, url, uploading, onPick, onClear, fit }: {
  label: string
  required?: boolean
  hint?: string
  url: string
  uploading: boolean
  onPick: (f: File) => void
  onClear: () => void
  fit: 'contain' | 'cover'
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      {url ? (
        <div className="relative h-28 w-full overflow-hidden rounded-ds-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className={cn('h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain p-2')} />
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="absolute right-1.5 top-1.5 rounded-full bg-background/85 p-1 shadow-sm hover:bg-background"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : (
        <label className={cn(
          'flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-ds-lg border border-dashed transition-colors hover:bg-muted/50',
          uploading && 'cursor-wait',
        )}>
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <>
              <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
              <span className="mt-1 text-[12px] text-muted-foreground">Choose an image</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = '' }}
          />
        </label>
      )}
    </Field>
  )
}
