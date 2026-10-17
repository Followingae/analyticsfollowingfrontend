'use client'

/**
 * The routine confirmation: one sentence, one outcome, two buttons.
 *
 * NN/g is blunt that overusing confirmation trains people to click yes without reading,
 * "which makes the dialog useless for the actions that matter". So this kind exists for
 * the small set of reversible actions that still benefit from a beat of attention, and
 * it stays deliberately thin: no losses, no typing, no preview. If a routine dialog is
 * growing a list, it is not routine.
 */

import * as React from 'react'

import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { ConfirmFooter } from './shared'
import type { RoutineSpec, BodyProps } from './types'

export function RoutineDialog({
  spec,
  pressed,
  onConfirm,
  onCancel,
  contentProps,
}: BodyProps<RoutineSpec>) {
  return (
    <DialogContent className="sm:max-w-md" {...contentProps}>
      <DialogHeader>
        <DialogTitle className="text-ds-heading">{spec.title}</DialogTitle>
        {typeof spec.body === 'string' ? (
          <DialogDescription className="text-ds-body">{spec.body}</DialogDescription>
        ) : null}
      </DialogHeader>

      {spec.body && typeof spec.body !== 'string' ? (
        <div className="text-ds-body">{spec.body}</div>
      ) : null}

      <DialogFooter className="sm:flex-col sm:items-stretch">
        <ConfirmFooter
          confirmLabel={spec.confirmLabel}
          cancelLabel={spec.cancelLabel}
          onConfirm={onConfirm}
          onCancel={onCancel}
          pressed={pressed}
        />
      </DialogFooter>
    </DialogContent>
  )
}
