'use client'

/**
 * The outbound confirmation: a drawer, not a dialog, and on purpose.
 *
 * A send needs the real artefact and every recipient on one surface. Atlassian's modal
 * page rules that out of a modal in three separate sentences: avoid large tables, avoid
 * horizontal scrolling, minimise vertical scrolling, and never open a dialog from a
 * dialog. A rendered email plus nineteen named people is past that line, so outbound
 * gets a right-side Sheet that can scroll, with the send fixed in the footer.
 *
 * What it always states, because each line is a bill we have already paid: the channel,
 * the sender literally (marketing WhatsApp only ever leaves +971502694890), the artefact
 * as the recipient will see it and not a summary of it, every recipient by name, and the
 * fact that nothing can be recalled once it starts.
 */

import * as React from 'react'
import { MailIcon, MessageCircleIcon, BellIcon, LinkIcon } from 'lucide-react'

import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

import { ConfirmFooter, RecipientChips, WarnStrip } from './shared'
import type { OutboundSpec, BodyProps } from './types'

const CHANNEL: Record<OutboundSpec['channel'], { label: string; Icon: typeof MailIcon }> = {
  email: { label: 'Email', Icon: MailIcon },
  whatsapp: { label: 'WhatsApp', Icon: MessageCircleIcon },
  push: { label: 'Push notification', Icon: BellIcon },
  link: { label: 'Share link', Icon: LinkIcon },
}

export function OutboundSheet({
  spec,
  pressed,
  onConfirm,
  onCancel,
  contentProps,
}: BodyProps<OutboundSpec>) {
  const { label, Icon } = CHANNEL[spec.channel]

  return (
    <SheetContent
      side="right"
      className="w-full gap-0 p-0 sm:max-w-xl"
      {...contentProps}
    >
      <SheetHeader className="p-5 pr-12">
        <div className="flex items-center gap-2 text-ds-caption text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
          <span>{label}</span>
        </div>
        <SheetTitle className="text-ds-heading">{spec.title}</SheetTitle>
        {spec.subtitle ? (
          <SheetDescription className="text-ds-body">{spec.subtitle}</SheetDescription>
        ) : null}
      </SheetHeader>

      <Separator />

      {/* The one scrolling region. The footer below it never moves. */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {spec.from ? (
          <div>
            <p className="text-ds-label text-muted-foreground">From</p>
            <p className="text-ds-body" dir="ltr">
              {spec.from}
            </p>
            {spec.fromNote ? (
              <p className="text-ds-caption text-muted-foreground">{spec.fromNote}</p>
            ) : null}
          </div>
        ) : null}

        {spec.warn ? <WarnStrip>{spec.warn}</WarnStrip> : null}

        <div className="space-y-2">
          <p className="text-ds-label text-muted-foreground">
            {spec.channel === 'link' ? 'What they will be able to open' : 'What they will read'}
          </p>
          {/* The artefact, in a tinted bubble so it reads as the message and not as
              console chrome describing the message. */}
          <div
            className="overflow-hidden rounded-ds-lg px-4 py-3 text-ds-body"
            style={{ background: 'var(--tone-info-wash)', color: 'var(--tone-info-ink)' }}
          >
            {spec.preview}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-ds-label text-muted-foreground">Recipients</p>
            <p className="text-ds-caption text-muted-foreground tabular-nums">
              {spec.recipients.length}
            </p>
          </div>
          <RecipientChips recipients={spec.recipients} />
        </div>
      </div>

      <Separator />

      <SheetFooter className="p-5">
        <ConfirmFooter
          confirmLabel={spec.confirmLabel ?? `Send to ${spec.recipients.length}`}
          cancelLabel={spec.cancelLabel}
          onConfirm={onConfirm}
          onCancel={onCancel}
          pressed={pressed}
          aside={spec.consequence}
        />
      </SheetFooter>
    </SheetContent>
  )
}
