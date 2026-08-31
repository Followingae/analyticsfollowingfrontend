# `ui2` — the second component set

## What this is

A small, new set of shadcn/ui components that this project never had, plus the
type scale and radius scale they are built on. It sits **beside**
`src/components/ui/`, not on top of it.

```
import { DataTable } from "@/components/ui2/data-table"   // new set
import { Button }    from "@/components/ui/button"        // existing set
```

The directory name is the whole point: the import path tells you which set you
are getting, at the call site, without opening anything. `ui2` was chosen over
names like `ds/`, `core/` or `v2/` because it is impossible to misread — there
is no plausible reason to think `@/components/ui2/item` is the same thing as
`@/components/ui/item`, whereas `@/components/core/item` reads like a category
and invites exactly that confusion.

## Why it exists beside the old one

Because this is a live production app, and the old set is load-bearing.

51 files import `Button`, 47 import `Card`, 46 import `Badge` — across
proposals, campaigns, loyalty, creator analytics and billing. The client-facing
proposal view at `/p/{token}` imports seven of them. "Fix the base components
and 244 files improve for free" is also "break the base components and 244
files break for free", and there is no staging environment where that would
surface before a client saw it.

So:

> **`src/components/ui/` is frozen. Do not edit any file in it.**

Not to add a variant, not to fix a radius, not to tidy a class list. If
something in the old set is wrong, the fix is a new component here that new
screens adopt — never an edit there.

## When to use which

| Situation | Use |
| --- | --- |
| Editing an existing screen | `ui/` — whatever it already imports. Leave it. |
| Building a new screen | `ui2/` for anything this set provides; `ui/` for the rest. |
| A component exists in both | `ui2/` on new screens, `ui/` on old ones. Never mix the two in one component. |
| Migrating an old screen | A deliberate, separately reviewed change. Not something to do in passing. |

`ui2` components **compose** the frozen primitives (`Button`, `Popover`,
`Command`, `Table`, `Select`, `Separator`, `Label`) rather than duplicating
them. Using a frozen component is fine; editing one is not. This keeps the set
to twelve files instead of thirty, and means a `ui2` screen still looks like the
rest of the app.

## What is in here

| File | Exports | Notes |
| --- | --- | --- |
| `tokens.css` | — | The type + radius scales. Imported once from `src/app/globals.css`. |
| `button-group.tsx` | `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText` | |
| `combobox.tsx` | `Combobox` | shadcn ships this as a Popover + Command *recipe*, not a file. This is that recipe, parameterised, so every combobox in the app behaves the same. |
| `data-table.tsx` | `DataTable`, `DataTableColumnHeader`, `DataTablePagination`, `DataTableViewOptions` | Generic over row type. Sorting, filtering, column visibility, pagination. Same caveat as combobox: shadcn ships a recipe, not a component. |
| `empty.tsx` | `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent` | Not the same thing as the old `ui/empty-state.tsx`, which is a fixed-shape card with a hardcoded icon fan. |
| `field.tsx` | `Field`, `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldLabel`, `FieldTitle`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldSeparator` | Layout for form rows. Composes with, and does not replace, `ui/form.tsx` (react-hook-form). |
| `input-group.tsx` | `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupInput`, `InputGroupTextarea`, `InputGroupText` | Prefixes, suffixes, inline buttons on an input. |
| `input-otp.tsx` | `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator` | Requires the `input-otp` package. |
| `item.tsx` | `Item`, `ItemGroup`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemHeader`, `ItemFooter`, `ItemSeparator` | The list-row primitive. Most of the app's bespoke "row with an avatar, two lines and a button" divs are this. |
| `navigation-menu.tsx` | `NavigationMenu` + parts, `navigationMenuTriggerStyle` | |
| `pagination.tsx` | `Pagination` + parts | For link-based paging. `DataTablePagination` is for tables. |
| `spinner.tsx` | `Spinner` | |

## The scales

Both live in `tokens.css` and are namespaced `ds-`, so they add utilities and
override none. `text-sm` and `rounded-lg` behave exactly as they did.

**Type — nine steps, named for role, not size.** Each step carries its own
line-height, tracking and weight, so one class is a complete typographic
decision rather than the first of three.

`text-ds-display` · `text-ds-title` · `text-ds-heading` · `text-ds-subheading` ·
`text-ds-body` · `text-ds-body-sm` · `text-ds-label` · `text-ds-caption` ·
`text-ds-overline`

**Radius — derived from the theme's `--radius`,** so changing the theme still
moves the whole set. Reach for the semantic aliases first:

`rounded-ds-control` (buttons) · `rounded-ds-field` (inputs) ·
`rounded-ds-surface` (cards) · `rounded-ds-overlay` (dialogs, popovers)

with `rounded-ds-none|xs|sm|md|lg|xl|2xl|full` underneath when you genuinely
need a size rather than a role.

**These scales are not retrofitted to existing pages.** They are defined so new
work has something to reach for. Rewriting a live page's type to use them is a
separate, deliberate change.

## Rules for adding to this set

1. Ship components **as shadcn ships them**. No wrappers, no invented variants.
   If you need different behaviour, that is a new component with its own name.
2. Never edit `src/components/ui/`.
3. New sizes go through the scales in `tokens.css`, not into a class list as a
   literal.
4. `motion/react`, never `framer-motion`.
