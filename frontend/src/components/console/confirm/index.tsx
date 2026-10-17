'use client'

/**
 * Confirmations, in one place.
 *
 * ── Why this exists ────────────────────────────────────────────────────────────────
 * Twelve consequential actions in this console asked for consent through the grey
 * browser box: rotating a merchant venue code, applying a proposal discount, resetting
 * every creator to standard rate, dropping a creator off a campaign. `window.confirm`
 * cannot render a recipient list, an amount, a preview or a type-to-confirm field, it is
 * unstyled, and it blocks the event loop while it waits. Nothing it shows is the thing
 * the operator needs to read.
 *
 * A `src/hooks/useConfirmDialog.tsx` was written for this and imported by nothing, which
 * is the usual fate of a confirm helper that leaves the caller to assemble the content.
 * This one is the opposite shape: the caller declares the CLASS of the action and the
 * facts, and the component decides the surface, the copy discipline, the focus order and
 * when to make someone type. One call site, one await, no local open state:
 *
 *     const confirm = useConfirm()
 *     if (!await confirm({ kind: 'money', title: 'Mark Aisha paid', amountAed: 4500 })) return
 *
 * ── The rule ───────────────────────────────────────────────────────────────────────
 * A dialog is for a consequence. A toast is for a receipt. The dialog stops the operator
 * before the thing happens and names what will happen; the toast afterwards says, in one
 * line and in the past tense, what actually did. Neither does the other's job, and a
 * toast is never the only record: anything that leaves the building, moves money, cannot
 * be undone or runs over many rows also writes a bell notification and an audit row,
 * because the question "who sent that?" arrives next week and a toast lived four seconds.
 *
 * NN/g's warning is the reason routine actions are a thin kind and most of the console
 * gets no dialog at all: overused confirmation trains people to click yes without
 * reading, "which makes the dialog useless for the actions that matter".
 *
 * Sources: NN/g, Confirmation dialogs (nngroup.com/articles/confirmation-dialog).
 * Atlassian, Modal dialog usage (atlassian.design/components/modal-dialog/usage).
 */

import * as React from 'react'

import { Dialog } from '@/components/ui/dialog'
import { Sheet } from '@/components/ui/sheet'

import { DestructiveDialog } from './destructive'
import { MoneyDialog } from './money'
import { OutboundSheet } from './outbound'
import { RoutineDialog } from './routine'
import type {
  ConfirmSpec,
  DestructiveSpec,
  MoneySpec,
  OutboundSpec,
  RoutineSpec,
} from './types'

export type {
  ConfirmLoss,
  ConfirmRecipient,
  ConfirmSpec,
  DestructiveSpec,
  MoneySpec,
  OutboundSpec,
  RoutineSpec,
} from './types'
export { TYPE_TO_CONFIRM_FROM_AED } from './money'
export { formatAed } from './shared'

type ConfirmFn = (spec: ConfirmSpec) => Promise<boolean>

const ConfirmContext = React.createContext<ConfirmFn | null>(null)

/** How long the pressed label stays on screen after the promise resolves. Long enough
 *  to be seen, short enough that it never reads as the dialog being stuck. */
const PRESSED_HOLD_MS = 180

type Pending = {
  /** Monotonic, so each decision's body is a fresh mount with empty fields. */
  id: number
  spec: ConfirmSpec
  resolve: (value: boolean) => void
  /** The element that opened it, so focus goes back where it came from. */
  opener: HTMLElement | null
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  /**
   * A queue rather than a single slot. Two confirmations can be asked for in one tick
   * (a bulk handler looping, a keyboard shortcut landing on a row that was already
   * acting) and Atlassian is explicit that a dialog must never open on top of a dialog.
   * So they wait their turn instead of stacking.
   */
  const [queue, setQueue] = React.useState<Pending[]>([])
  const [pressed, setPressed] = React.useState(false)

  const head = queue[0] ?? null
  const settlingRef = React.useRef(false)
  const surfaceRef = React.useRef<HTMLDivElement | null>(null)
  const holdRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextIdRef = React.useRef(0)

  React.useEffect(() => {
    return () => {
      if (holdRef.current) clearTimeout(holdRef.current)
    }
  }, [])

  // A new head means a new decision: the guard from the previous one must not survive.
  React.useEffect(() => {
    if (head) settlingRef.current = false
  }, [head])

  const confirm = React.useCallback<ConfirmFn>((spec) => {
    const opener =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null
    const id = ++nextIdRef.current
    return new Promise<boolean>((resolve) => {
      setQueue((q) => [...q, { id, spec, resolve, opener }])
    })
  }, [])

  const close = React.useCallback((pending: Pending) => {
    setQueue((q) => q.slice(1))
    setPressed(false)
    settlingRef.current = false
    // After the surface unmounts, not before, or Radix moves focus again on the way out.
    requestAnimationFrame(() => {
      if (pending.opener && document.contains(pending.opener)) pending.opener.focus?.()
    })
  }, [])

  /** Escape, outside click, the header close button, the cancel button: all the same no. */
  const onCancel = React.useCallback(() => {
    if (!head || settlingRef.current) return
    settlingRef.current = true
    head.resolve(false)
    close(head)
  }, [head, close])

  const onConfirm = React.useCallback(() => {
    if (!head || settlingRef.current) return
    settlingRef.current = true
    setPressed(true)
    // The caller starts work immediately; the pressed label just outlives the click so a
    // second press has something to land on other than a live button.
    head.resolve(true)
    holdRef.current = setTimeout(() => close(head), PRESSED_HOLD_MS)
  }, [head, close])

  /**
   * No default yes. Radix would otherwise focus the first tabbable thing in the content,
   * which on a short dialog can be the primary button, and a person pressing Enter out of
   * habit would commit without reading. Focus goes to the surface itself, so Escape and
   * Tab both work and nothing is pre-armed.
   */
  const contentProps = React.useMemo(
    () => ({
      ref: surfaceRef,
      tabIndex: -1,
      onOpenAutoFocus: (event: Event) => {
        event.preventDefault()
        surfaceRef.current?.focus()
      },
    }),
    [],
  )

  const body = (() => {
    if (!head) return null
    const common = { pressed, onConfirm, onCancel, contentProps }
    switch (head.spec.kind) {
      case 'routine':
        return <RoutineDialog spec={head.spec} {...common} />
      case 'destructive':
        return <DestructiveDialog spec={head.spec} {...common} />
      case 'money':
        return <MoneyDialog spec={head.spec} {...common} />
      case 'outbound':
        return <OutboundSheet spec={head.spec} {...common} />
    }
  })()

  const isOutbound = head?.spec.kind === 'outbound'
  const onOpenChange = (open: boolean) => {
    if (!open) onCancel()
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* Keyed on the request id so each decision gets a fresh body: a typed amount
          from the last one must never be sitting in the next one's field. */}
      {isOutbound && head ? (
        <Sheet open onOpenChange={onOpenChange} key={head.id}>
          {body}
        </Sheet>
      ) : head ? (
        <Dialog open onOpenChange={onOpenChange} key={head.id}>
          {body}
        </Dialog>
      ) : null}
    </ConfirmContext.Provider>
  )
}

/**
 * The hook. Returns an async function; await it and read the boolean.
 *
 * Used outside a provider it does not throw, because a missing provider on one route
 * must not take the screen down. It fails CLOSED: a routine confirmation resolves true,
 * since a routine action is reversible and the dialog was courtesy rather than a gate,
 * and everything consequential resolves false and is logged. A send that silently does
 * not happen is recoverable; one that happens without consent is not.
 */
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext)
  return React.useMemo<ConfirmFn>(() => {
    if (ctx) return ctx
    return (spec: ConfirmSpec) => {
      const ok = spec.kind === 'routine'
      console.warn(
        `[confirm] useConfirm() was called with no <ConfirmProvider> above it, so "${spec.title}" ` +
          `resolved ${ok} without asking anyone. ` +
          (ok
            ? 'Routine actions pass through.'
            : 'Consequential kinds fail closed. Mount ConfirmProvider in the console layout.'),
      )
      return Promise.resolve(ok)
    }
  }, [ctx])
}
