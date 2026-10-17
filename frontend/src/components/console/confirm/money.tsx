'use client'

/**
 * The money confirmation: the amount, restated, and the people it reaches.
 *
 * Every number on this screen was typed by someone two screens ago, so the dialog's job
 * is to hand it back in a form that is hard to misread: one large figure, tabular
 * figures so digits line up, an explicit AED prefix, no decimals, and the recipients
 * listed rather than counted. NN/g's banking example is the threshold rule we follow:
 * confirm hardest on amounts well above the ordinary one, which is why
 * `typeToConfirmAmount` turns itself on at AED 25,000 and the dialog says why it did.
 *
 * The big figure writes "AED " as a literal prefix rather than using the dirham glyph:
 * at this size the mark reads as decoration and the point here is the number.
 */

import * as React from 'react'

import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

import {
  ConfirmFooter,
  RecipientList,
  TypeToConfirm,
  amountDigits,
  formatAed,
  onlyDigits,
} from './shared'
import type { MoneySpec, BodyProps } from './types'

/** Above this, restating the amount by hand is the default rather than an option. */
export const TYPE_TO_CONFIRM_FROM_AED = 25000

export function MoneyDialog({
  spec,
  pressed,
  onConfirm,
  onCancel,
  contentProps,
}: BodyProps<MoneySpec>) {
  const [typed, setTyped] = React.useState('')

  const expect = amountDigits(spec.amountAed)
  const needsTyping =
    spec.typeToConfirmAmount ?? Math.abs(spec.amountAed) >= TYPE_TO_CONFIRM_FROM_AED
  const matched = !needsTyping || onlyDigits(typed) === expect
  const recipients = spec.recipients ?? []

  return (
    <DialogContent className="sm:max-w-lg" {...contentProps}>
      <DialogHeader>
        <DialogTitle className="text-ds-heading">{spec.title}</DialogTitle>
        {spec.subtitle ? (
          <DialogDescription className="text-ds-body">{spec.subtitle}</DialogDescription>
        ) : null}
      </DialogHeader>

      {/* The restated amount. One figure, large, and nothing beside it competing. */}
      <div>
        <p className="text-ds-title tabular-nums" dir="ltr">
          AED {formatAed(spec.amountAed)}
        </p>
        {spec.amountNote ? (
          <p className="text-ds-caption text-muted-foreground">{spec.amountNote}</p>
        ) : null}
      </div>

      {spec.body ? <div className="text-ds-body">{spec.body}</div> : null}

      {recipients.length > 0 ? (
        <RecipientList recipients={recipients} label="Who this reaches" />
      ) : null}

      {needsTyping ? (
        <>
          <Separator />
          <TypeToConfirm
            id="confirm-money-amount"
            expect={expect}
            value={typed}
            numeric
            onChange={setTyped}
            disabled={pressed}
            prompt={`Type the amount, ${formatAed(spec.amountAed)}`}
            why={
              spec.typeToConfirmAmount === undefined
                ? `Amounts from AED ${formatAed(TYPE_TO_CONFIRM_FROM_AED)} up ask you to write the figure out, so a number carried over from an earlier screen gets read once more before it is committed.`
                : 'Write the figure out so it is read once more before it is committed.'
            }
          />
        </>
      ) : null}

      <DialogFooter className="sm:flex-col sm:items-stretch">
        <ConfirmFooter
          confirmLabel={spec.confirmLabel ?? `Commit AED ${formatAed(spec.amountAed)}`}
          cancelLabel={spec.cancelLabel}
          onConfirm={onConfirm}
          onCancel={onCancel}
          pressed={pressed}
          disabled={!matched}
          blockedReason={
            needsTyping && !matched
              ? 'The button turns on once the typed figure matches the amount above.'
              : undefined
          }
        />
      </DialogFooter>
    </DialogContent>
  )
}
