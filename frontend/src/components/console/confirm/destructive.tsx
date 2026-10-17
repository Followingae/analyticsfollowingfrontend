'use client'

/**
 * The destructive confirmation: what goes, what stays.
 *
 * The house rule the delete-proposal copy already got right is that a destructive dialog
 * is read for what SURVIVES as much as for what is lost ("any campaign created from it
 * is kept, just unlinked"). So losses are a list with three readings: a red cross for
 * gone, amber for changed in a way worth knowing, a green check for preserved. A person
 * who scans only the green lines still learns the right thing.
 *
 * Type-to-confirm is here but held back on purpose. NN/g: show the extra step only for
 * rare, serious cases, because "if it's used often, it becomes a habit and loses its
 * effect". The classification rule is cannot-be-undone AND (leaves the company OR moves
 * money).
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

import { ConfirmFooter, LossIcon, TypeToConfirm } from './shared'
import type { DestructiveSpec, BodyProps } from './types'

export function DestructiveDialog({
  spec,
  pressed,
  onConfirm,
  onCancel,
  contentProps,
}: BodyProps<DestructiveSpec>) {
  const [typed, setTyped] = React.useState('')
  const needsTyping = Boolean(spec.typeToConfirm)
  const matched = !needsTyping || typed.trim() === spec.typeToConfirm
  const losses = spec.losses ?? []

  return (
    <DialogContent className="sm:max-w-lg" {...contentProps}>
      <DialogHeader>
        <DialogTitle className="text-ds-heading">{spec.title}</DialogTitle>
        {typeof spec.body === 'string' ? (
          <DialogDescription className="text-ds-body">{spec.body}</DialogDescription>
        ) : null}
      </DialogHeader>

      {spec.body && typeof spec.body !== 'string' ? (
        <div className="text-ds-body">{spec.body}</div>
      ) : null}

      {losses.length > 0 ? (
        <ul className="space-y-2">
          {losses.map((loss, i) => (
            <li key={`${loss.label}-${i}`} className="flex items-start gap-2">
              <LossIcon kept={loss.kept} warn={loss.warn} />
              <div className="min-w-0">
                <p className="text-ds-body">{loss.label}</p>
                {loss.detail ? (
                  <p className="text-ds-caption text-muted-foreground">{loss.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {needsTyping ? (
        <>
          <Separator />
          <TypeToConfirm
            id="confirm-destructive-type"
            expect={spec.typeToConfirm as string}
            value={typed}
            onChange={setTyped}
            disabled={pressed}
            prompt={`Type ${spec.typeToConfirm} to confirm`}
            why="This one cannot be undone, so it asks you to write it out rather than click through it."
          />
        </>
      ) : null}

      <DialogFooter className="sm:flex-col sm:items-stretch">
        <ConfirmFooter
          confirmLabel={spec.confirmLabel}
          cancelLabel={spec.cancelLabel}
          onConfirm={onConfirm}
          onCancel={onCancel}
          pressed={pressed}
          destructive
          disabled={!matched}
          blockedReason={
            needsTyping && !matched
              ? `The button turns on once the box reads exactly ${spec.typeToConfirm}.`
              : undefined
          }
        />
      </DialogFooter>
    </DialogContent>
  )
}
