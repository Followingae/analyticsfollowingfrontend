/**
 * The shape of a confirmation.
 *
 * One discriminated union, four kinds, and the kind is chosen by the class of action and
 * nothing else: outbound when something leaves the building, money when an amount is
 * committed, destructive when it cannot be undone, routine for the rest. The inventory
 * that classified all 145 console actions is in the research notes; README.md repeats the
 * rule so a caller does not have to go looking.
 *
 * These types live in their own module so the four bodies can import them without
 * importing the provider, and `index.tsx` re-exports them as the public API.
 */

import type * as React from 'react'

/** A person, creator or address an action reaches. Always listed, never only counted. */
export type ConfirmRecipient = {
  name: string
  detail?: string
  amountAed?: number
  warn?: string
}

/** One thing a destructive action takes away, or deliberately keeps. */
export type ConfirmLoss = {
  label: string
  detail?: string
  /** Renders as preserved, with a green check. "The campaign is kept, just unlinked." */
  kept?: boolean
  /** Renders amber: not lost, but it changes in a way worth reading. */
  warn?: boolean
}

export type RoutineSpec = {
  kind: 'routine'
  title: string
  body?: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
}

export type DestructiveSpec = {
  kind: 'destructive'
  title: string
  body?: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  losses?: ConfirmLoss[]
  /** The literal string the operator must type. Reserve it for the genuinely final. */
  typeToConfirm?: string
}

export type MoneySpec = {
  kind: 'money'
  title: string
  subtitle?: string
  amountAed: number
  amountNote?: string
  recipients?: ConfirmRecipient[]
  /** Defaults to true at AED 25,000 and above. */
  typeToConfirmAmount?: boolean
  confirmLabel?: string
  cancelLabel?: string
  body?: React.ReactNode
}

export type OutboundSpec = {
  kind: 'outbound'
  title: string
  subtitle?: string
  channel: 'whatsapp' | 'email' | 'push' | 'link'
  /** The sender, literally: an address, a number, a domain. */
  from?: string
  /** Why that sender matters. "Marketing never leaves this number." */
  fromNote?: string
  /** The artefact itself: an iframe of the email, the filled-in message, the document. */
  preview: React.ReactNode
  recipients: ConfirmRecipient[]
  /** What happens the moment it goes, in one sentence, beside the send button. */
  consequence?: string
  warn?: string
  confirmLabel?: string
  cancelLabel?: string
}

export type ConfirmSpec = RoutineSpec | DestructiveSpec | MoneySpec | OutboundSpec

/** What each body is handed. The provider owns open state, focus and the promise. */
export type BodyProps<S extends ConfirmSpec> = {
  spec: S
  /** True once the primary has been pressed: labels change, controls lock. */
  pressed: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Focus and labelling props the provider puts on the surface. */
  contentProps: {
    onOpenAutoFocus: (event: Event) => void
    tabIndex: number
    ref: React.Ref<HTMLDivElement>
  }
}
