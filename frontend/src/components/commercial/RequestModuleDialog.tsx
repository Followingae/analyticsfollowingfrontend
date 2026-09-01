'use client'

/**
 * The note to the account manager.
 *
 * Opened by two different accounts for two different reasons, and it must not
 * pretend to be the same thing:
 *
 *   managed     They are never shown a price and never a card form. This IS
 *               their buy button. The note is the whole transaction.
 *   self-serve  Only reached while the add-on has no Stripe price object yet
 *               (see MODULE_STRIPE_PRICE_IDS). They have been shown the price;
 *               this dialog tells them, in plain words, that the module is
 *               switched on and appears on the next invoice.
 *
 * It sends nothing to Stripe and changes no subscription. It composes an email.
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Mail } from 'lucide-react'
import { MODULES } from '@/config/modules'
import { formatModulePrice, type ModuleAddonKey, type ModuleKey } from '@/config/planPricing'

export const ACCOUNT_MANAGER_EMAIL = 'support@following.ae'

interface RequestModuleDialogProps {
  module: ModuleKey
  open: boolean
  onOpenChange: (open: boolean) => void
  managed: boolean
  /** Shown in the note so the account manager knows who is asking. */
  accountEmail?: string
  /** Optional context, e.g. "shortlist: Ramadan launch (14 creators)". */
  context?: string
}

export function RequestModuleDialog({
  module,
  open,
  onOpenChange,
  managed,
  accountEmail,
  context,
}: RequestModuleDialogProps) {
  const def = MODULES[module]
  // Only an add-on carries a price; Find is included and Manage is quoted.
  const addonPrice =
    def.availability === 'addon' ? formatModulePrice(module as ModuleAddonKey) : null

  const defaultNote = [
    `I'd like to add ${def.name} to our account.`,
    context ? `\nContext: ${context}` : '',
  ]
    .join('')
    .trim()

  const [note, setNote] = useState(defaultNote)

  const send = () => {
    const subject = `${def.name} | ${managed ? 'request' : 'add to account'}${
      accountEmail ? ` | ${accountEmail}` : ''
    }`
    const body = [note, '', accountEmail ? `Account: ${accountEmail}` : ''].join('\n')
    window.location.href = `mailto:${ACCOUNT_MANAGER_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {managed ? `Ask your account manager for ${def.name}` : `Add ${def.name}`}
          </DialogTitle>
          <DialogDescription>
            {managed ? (
              <>
                Your account is billed by us directly, so nothing is charged here. This sends a
                note to your account manager, who adds {def.name} and puts it on your next
                invoice.
              </>
            ) : addonPrice ? (
              <>
                {def.name} is {addonPrice}. Sending this switches it on and it
                appears on your next invoice - you are not charged now, and no card is taken on
                this screen.
              </>
            ) : (
              <>
                Managed is quoted against the work, so it starts with a conversation rather than
                a price.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="module-request-note">Your note</Label>
          <Textarea
            id="module-request-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={send} disabled={!note.trim()}>
            <Mail className="h-4 w-4 mr-2" />
            Send to your account manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
