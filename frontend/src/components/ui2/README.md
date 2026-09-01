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

That reasoning was sound about the risk and wrong about the remedy, and the
original rule has been narrowed:

> **`src/components/ui/` is closed to API changes and open to visual ones.**

The distinction is the whole rule, so it is worth being exact about.

A **visual default** is a class in a class list that a caller can already
override: a radius, a shadow, a font weight, a padding value, a type size.
Changing one cannot break a screen. The worst case is that a screen looks
different, on every screen at once, which is the point. Nothing throws,
nothing goes undefined, no prop stops working, and any call site that had an
opinion still wins because every one of these components ends in
`cn(defaults, className)`.

An **API change** is anything a caller can see from the outside: a prop, a
variant name, an exported symbol, the DOM structure, the element type, a
`data-` attribute, or a default that changes behaviour rather than
appearance. Those are what "break the base components and 244 files break for
free" actually describes, and they stay forbidden here.

Freezing both together bought nothing. The small wrongness in the old set, a
24px title on a card and a button rounded two steps tighter than the surface
it sits on, could only be worked around one call site at a time, and it was:
223 cards now override their own padding, 166 of 351 card
titles set their own size, and the client-facing proposal view passes
`rounded-xl` on every button on the page. Every one of those is a screen
paying, in a diff, for a decision that belonged in one file.

**One caveat that is easy to get wrong.** Inside anything that takes a
`className`, use stock Tailwind, not the `ds-` scale. `tailwind-merge` has no
idea that `p-ds-4` is a padding utility, so a caller passing `p-4` ends up
with both classes and the browser picks. `twMerge('p-ds-4','p-4')` returns
`"p-ds-4 p-4"`; `twMerge('p-6','p-4')` returns `"p-4"`. Use the `ds-` scale in
page and layout code, where nothing merges over the top.

## When to use which

| Situation | Use |
| --- | --- |
| Editing an existing screen | `ui/` — whatever it already imports. Leave it. |
| Building a new screen | `ui2/` for anything this set provides; `ui/` for the rest. |
| A component exists in both | `ui2/` on new screens, `ui/` on old ones. Never mix the two in one component. |
| Migrating an old screen | A deliberate, separately reviewed change. Not something to do in passing. |
| A default in `ui/` is wrong | Fix it there, if it is a visual default. One file, every screen. |

`ui2` components **compose** the base primitives (`Button`, `Popover`,
`Command`, `Table`, `Select`, `Separator`, `Label`) rather than duplicating
them. Composing a base component is always right; forking one is not. This keeps the set
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

**Type: six steps, named for role, not size.** Each step carries its own
line-height, tracking and weight, so one class is a complete typographic
decision rather than the first of three.

`text-ds-title` · `text-ds-heading` · `text-ds-body` · `text-ds-label` ·
`text-ds-caption` · `text-ds-overline`

It was nine. Two names a pixel apart are two ways to spell one decision, and
the second one only exists because someone could not find the first. Three
older names still work and always will, so nothing had to be rewritten:
`text-ds-display` is `text-ds-title`, `text-ds-subheading` is
`text-ds-heading`, `text-ds-body-sm` is `text-ds-caption`. They are a
migration path, not a vocabulary.

**Radius — derived from the theme's `--radius`,** so changing the theme still
moves the whole set. Reach for the semantic aliases first:

`rounded-ds-control` (buttons) · `rounded-ds-field` (inputs) ·
`rounded-ds-surface` (cards) · `rounded-ds-overlay` (dialogs, popovers)

with `rounded-ds-none|xs|sm|md|lg|xl|2xl|full` underneath when you genuinely
need a size rather than a role.

**Spacing — six steps, named for the relationship they express.** Usable
anywhere Tailwind takes a spacing value: `gap-ds-4`, `p-ds-3`, `mt-ds-5`,
`space-y-ds-2`.

| Step | Size | Means |
| --- | --- | --- |
| `ds-1` | 4px | Glued — an icon to its label. |
| `ds-2` | 8px | Paired — a figure and the caption naming it. |
| `ds-3` | 16px | Grouped — rows in one list, fields in one set. |
| `ds-4` | 24px | Separated — one stat from the next. |
| `ds-5` | 40px | Sectioned — a genuinely different subject. |
| `ds-6` | 64px | Banded — page-level bands. |

Six, not nine, because two adjacent steps have to be *visibly* different or
the reader cannot use the gap to tell grouping from separation. On internal
screens whitespace is the grouping mechanism: stepping up this scale is
almost always better than drawing a border, because a border is an extra
edge the eye must cross to reach the number inside it.

**The type and spacing scales are not retrofitted to existing pages.** They are defined so new
work has something to reach for. Rewriting a live page's type to use them is a
separate, deliberate change.

## Rules for adding to this set

1. Ship components **as shadcn ships them**. No wrappers, no invented variants.
   If you need different behaviour, that is a new component with its own name.
2. In `src/components/ui/`, change visual defaults freely and APIs never. See
   "Why it exists beside the old one" above for where the line falls.
3. New sizes go through the scales in `tokens.css`, not into a class list as a
   literal.
4. `motion/react`, never `framer-motion`.
