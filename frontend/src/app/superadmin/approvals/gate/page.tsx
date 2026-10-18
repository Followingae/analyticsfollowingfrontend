'use client'

/**
 * The approval gate: on or off, and who acts freely.
 *
 * THIS IS THE MOST CONSEQUENTIAL SWITCH IN THE PLATFORM, so the screen says what will
 * happen in plain words before it is thrown rather than afterwards. Turning it on stops
 * every member of staff, except the co-founder, from doing anything that moves money,
 * reaches a client, or deletes something, until you answer.
 *
 * The matrix underneath is the part that keeps the business moving. A role with `internal`
 * keeps its own lane: talent records costs and builds rosters, business development creates
 * brands and leads, account management writes briefs. Take `internal` away from somebody and
 * they cannot do their job at all without you, which is a thing you should be able to see
 * yourself choosing rather than discover on Monday.
 */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Save, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { CARD, PageHead } from '@/components/console/primitives'
import { SectionHead } from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  CLASS_LABEL, ROLE_LABEL, pendingActionsApi,
  type ActionClass, type GateSettings,
} from '@/services/pendingActionsApi'
import { cn } from '@/lib/utils'

const ROLES = ['cofounder', 'ceo', 'talent_manager', 'account_manager', 'business_development']
const CLASSES: ActionClass[] = ['internal', 'money', 'client', 'delete', 'access']

export default function GatePage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout><Gate /></SuperadminLayout>
    </AuthGuard>
  )
}

function Gate() {
  const confirm = useConfirm()
  const [s, setS] = useState<GateSettings | null>(null)
  const [allow, setAllow] = useState<Record<string, ActionClass[]>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pendingActionsApi.settings()
      setS(res.data)
      setAllow(res.data.allowances || {})
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read the gate')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleGate = async (on: boolean) => {
    const ok = await confirm(on ? {
      kind: 'destructive',
      title: 'Turn the approval gate ON?',
      body: (
        <>
          From the moment you save, every member of staff except the co-founder is stopped
          whenever they try to move money, send something to a client, change who can do
          what, or delete anything. Their work is held in a queue until you answer it.
        </>
      ),
      losses: [
        { label: 'Nothing they do is lost. It waits and runs when you approve it', kept: true },
        { label: 'They cannot complete those actions without you', warn: true },
        { label: 'If you are away, that work stops', warn: true },
      ],
      confirmLabel: 'Turn it on',
    } : {
      kind: 'routine',
      title: 'Turn the approval gate OFF?',
      body: <>Staff go back to acting within their own permissions. Anything already in the queue stays there.</>,
      confirmLabel: 'Turn it off',
    })
    if (!ok) return
    setBusy(true)
    try {
      await pendingActionsApi.saveSettings({ enabled: on })
      toast.success(on ? 'The gate is on' : 'The gate is off')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not change it')
    } finally { setBusy(false) }
  }

  const save = async () => {
    setBusy(true)
    try {
      await pendingActionsApi.saveSettings({ allowances: allow })
      toast.success('Saved')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save')
    } finally { setBusy(false) }
  }

  const flip = (role: string, c: ActionClass) =>
    setAllow(prev => {
      const have = prev[role] || []
      return { ...prev, [role]: have.includes(c) ? have.filter(x => x !== c) : [...have, c] }
    })

  if (loading) {
    return <div className="flex items-center gap-2 py-10 text-ds-caption">
      <Loader2 className="h-4 w-4 animate-spin" /> Reading the gate
    </div>
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="The approval gate"
        sub="What staff can do on their own, and what waits for you."
      />

      <div className={cn(CARD, 'bg-card p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-ds-label font-semibold">
              <ShieldCheck className="h-4 w-4" />
              {s?.enabled ? 'The gate is ON' : 'The gate is OFF'}
            </p>
            <p className="reading-width text-ds-caption leading-relaxed text-muted-foreground">
              {s?.enabled
                ? 'Staff actions that move money, reach a client, change access or delete something are being held for you.'
                : 'Everyone is acting within their own permissions. Nothing is being held.'}
            </p>
          </div>
          <Switch checked={!!s?.enabled} disabled={busy}
                  onCheckedChange={(v: boolean) => toggleGate(v)}
                  aria-label="Turn the approval gate on" />
        </div>
      </div>

      <section className="space-y-3">
        <SectionHead
          title="Who acts without asking"
          note="A tick means that person does not need you for that kind of action."
        />

        <div className={cn(CARD, 'overflow-hidden bg-card')}>
          <table className="w-full text-ds-caption">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left font-semibold">Role</th>
                {CLASSES.map(c => (
                  <th key={c} className="px-3 py-2.5 text-center font-semibold">
                    {CLASS_LABEL[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map(role => (
                <tr key={role} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{ROLE_LABEL[role] || role}</td>
                  {CLASSES.map(c => {
                    const on = (allow[role] || []).includes(c)
                    return (
                      <td key={c} className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => flip(role, c)}
                          className={cn(
                            'h-6 w-10 rounded-full border transition-colors',
                            on ? 'border-transparent bg-foreground' : 'bg-muted',
                          )}
                        >
                          <span className={cn(
                            'block h-4 w-4 rounded-full bg-background transition-transform',
                            on ? 'translate-x-5' : 'translate-x-1',
                          )} />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="flex items-start gap-2 text-ds-caption text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong className="font-semibold text-foreground">Internal is their own lane.</strong>{' '}
            Talent records costs and builds rosters, business development creates brands and
            leads, account management writes briefs. Take it away and they cannot work at all
            without you.
          </span>
        </p>

        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                : <Save className="mr-1.5 h-3.5 w-3.5" />}
          Save who acts freely
        </Button>
      </section>

      <section className="space-y-3">
        <SectionHead
          title="How a request is sorted"
          note="First match wins. A DELETE is caught on the method before any of this is read."
        />
        <div className={cn(CARD, 'overflow-hidden bg-card')}>
          <table className="w-full text-ds-caption">
            <tbody>
              {(s?.rules || []).filter(r => r.enabled).map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">
                    {r.pattern}
                  </td>
                  <td className="px-3 py-2">{r.label}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {CLASS_LABEL[r.action_class]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
