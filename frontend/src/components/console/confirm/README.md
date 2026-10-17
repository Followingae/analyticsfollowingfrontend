# Confirmations

One component family for every consequential action in the console. It replaces twelve
`window.confirm` call sites and is the intended path for the ~145 actions the dialog
inventory classified.

The rule behind all of it: **a dialog is for a consequence, a toast is for a receipt.**
The dialog stops the operator before the thing happens and names what will happen. The
toast afterwards says, in one line and in the past tense, what actually did. A toast never
asks, and it is never the only record.

## Mounting

```tsx
// src/app/work/layout.tsx (or wherever the console shell lives)
import { ConfirmProvider } from '@/components/console/confirm'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>
}
```

One provider per console shell. Used without one, `useConfirm` does not throw: it logs a
warning and fails closed, resolving `true` only for `kind: 'routine'` and `false` for
anything that sends, spends or destroys.

## Using it

```tsx
const confirm = useConfirm()

async function onDrop() {
  const ok = await confirm({ kind: 'destructive', /* ... */ })
  if (!ok) return
  await api.drop(rowId)          // your own spinner, your own toast
  toast.success('Aisha dropped from Barakat Ramadan.')
}
```

`confirm()` resolves `false` on Cancel, Escape, the header close button and an outside
click. It resolves as soon as the operator commits; the surface then holds its pressed
label for a beat and unmounts. Loading after that point is the caller's, not ours: show
your own spinner on the row or the page.

Two confirmations asked for at once queue rather than stack. Never a dialog from a dialog.

## Choosing a kind

| Kind | For | Surface | Types by default |
|---|---|---|---|
| `outbound` | A message, document or link leaves the building. Email, WhatsApp, push, share link. | Right-side Sheet | No |
| `money` | An amount is committed, approved, released, paid, or a price is locked. | Dialog | Yes at AED 25,000 and up |
| `destructive` | Deleted, retracted, revoked, closed, voided, or done on a client's behalf. | Dialog | Only when you pass `typeToConfirm` |
| `routine` | Safe and reversible, but worth a beat. | Dialog, small | No |

Anything genuinely routine and reversible should get **no dialog at all**: edit inline and
show the saved state on the field. Overused confirmation trains people to click through it,
which is exactly what makes it useless on the actions that matter.

Type-to-confirm is reserved: ask for it when the action **cannot be undone AND** it either
reaches outside the company or moves money. Everywhere else it becomes muscle memory and
stops meaning anything.

Content that needs a real table (a payout run of forty creators) is a **page with a sticky
commit bar**, not a dialog and not a sheet.

## `routine`

```tsx
await confirm({
  kind: 'routine',
  title: 'Reopen the sourcing round',
  body: 'The area goes back to open and the client link starts working again.',
  confirmLabel: 'Reopen the round',
})
```

The confirm label is a verb phrase that matches the title, never Yes. Primary sits to the
right of Cancel, and it is not autofocused: there is no default yes to press through.

## `destructive`

```tsx
await confirm({
  kind: 'destructive',
  title: 'Delete the Barakat Ramadan proposal',
  body: 'Imagine Marketing can no longer open the share link.',
  losses: [
    { label: 'The roster of 11 creators and their frozen prices', detail: 'Gone, including the discount.' },
    { label: 'The client share link stops resolving', warn: true },
    { label: 'The campaign created from it is kept, just unlinked', kept: true },
  ],
  typeToConfirm: 'Barakat Ramadan',
  confirmLabel: 'Delete the proposal',
})
```

`losses` renders as three readings: a red cross for gone, amber for changed in a way worth
knowing, a green check for preserved. State what survives, in that voice. The primary
carries the destructive colour; while the typed string does not match, the footer says what
is missing rather than greying out silently.

## `money`

```tsx
await confirm({
  kind: 'money',
  title: 'Mark the payout run executed',
  subtitle: 'The bank has already moved, so this cannot be taken back.',
  amountAed: 184500,
  amountNote: '11 creators, 4 countries, 2 payout methods',
  recipients: [
    { name: 'Aisha Al Mansoori', detail: 'Bank transfer, UAE', amountAed: 24000 },
    { name: 'Noor Haddad', detail: 'Bank transfer, KSA', amountAed: 18500, warn: 'Passport not on file' },
  ],
  confirmLabel: 'Mark the run executed',
})
```

The amount is restated large, in tabular figures, with a literal `AED ` prefix, thousands
separated and no decimals. Recipients are listed, not counted: five rows, then one
disclosure that opens the rest. At AED 25,000 and above the operator types the figure, and
the dialog says in one sentence why it is asking. Pass `typeToConfirmAmount` explicitly to
force it on below the threshold or off above it.

## `outbound`

```tsx
await confirm({
  kind: 'outbound',
  title: 'Send the Ramadan broadcast',
  subtitle: 'Approved template, variables filled in.',
  channel: 'whatsapp',
  from: '+971502694890',
  fromNote: 'Marketing only ever leaves this number. The OTP number is never used for marketing.',
  preview: <p>Hi Aisha, the Barakat Ramadan brief is live. Open the app to accept by Thursday.</p>,
  recipients: contacts.map((c) => ({ name: c.name, detail: c.phone })),
  warn: 'Opted-out contacts, 42, are already excluded from this count.',
  consequence: 'There is no way to recall this once it starts.',
  confirmLabel: 'Send to 1,308',
})
```

Outbound is a **right-side Sheet, not a dialog**, because a rendered message plus a
recipient list is past what a modal should hold. It states the channel, the sender
literally, the artefact as the recipient will see it (an `<iframe srcDoc={html}>` from the
same `/preview` endpoint the send will use, a filled-in message, the document itself, never
a summary and never the `{{1}}` skeleton), every recipient as a chip, any precondition as
an amber strip, and the consequence sentence beside the send button.

When a send cannot go out at all, for example a Twilio template that is not approved, do
not open this and let the operator press it: block the action upstream and say why on the
page.

## House notes

- No em dashes, in code or copy. A middle dot or a comma.
- Money and counts carry `tabular-nums`.
- Tone comes from the console tokens only: `--tone-good-*`, `--tone-warn-*`, `--tone-bad-*`,
  `--console-lime`. No hex literals.
- Failures belong on the surface that failed, inside the dialog or on the page with
  `role="alert"`, never in a toast that disappears while the operator is still reading.
