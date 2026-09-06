# Following Control Panel — Audit

> Phase 1c. Produced by five parallel audits plus direct verification. Findings marked
> **verified** were confirmed by reading the code myself; the rest come from the audit agents
> and carry a file reference so they can be checked.
>
> This document reports. It proposes nothing that changes a permission, a scope or a business
> rule. Where something looks wrong but might be deliberate, it is written as a question.

---

## 1. The headline: there are four design systems, not one

**verified.** shadcn is the nominal design system. Three others sit beside it, each
re-implementing the same nine concepts.

| System | File | Files importing it |
|---|---|---|
| console | `src/components/console/primitives.tsx` | **70** |
| surface | `src/components/campaigns/surface.tsx` | 13 |
| brand | `src/components/brand/primitives.tsx` | 11 |
| shadcn | `src/components/ui/*` | varies |

The console system is the de facto standard for internal screens. The brief assumed the
problem was "we underuse shadcn". The real problem is that four vocabularies coexist, so a
developer picking a component picks a dialect.

### The same nine concepts, re-implemented

| Concept | Implementations | The one that should win |
|---|---|---|
| KPI tile | **6** | console `Stat` (71) for panels; new `KpiCard` for dashboards |
| Money | **8** | console `Aed` (70) |
| Empty state | 5 | console `Empty` (70) |
| Skeleton / loading | 5, plus 41 files using raw `animate-pulse` | shadcn `Skeleton` (70) |
| Toast | 4 | `sonner` `toast()` (**146 files**, already the standard) |
| Badge / status | 5 | shadcn `Badge` (228) + console tone tokens |
| Avatar | 4 | shadcn `Avatar` (60) |
| Card / panel | 5 | shadcn `Card` (174) + console `Panel` |
| Table | 3 | shadcn `Table` (32) |

---

## 2. Dead code inside the design system

**verified.** `src/components/ui` holds roughly **2,900 lines that nothing imports**, in the
folder every developer treats as the source of truth.

Zero importers: `ai-content-charts` (455), `ai-data-health` (356), `ai-status-indicator`
(350), `ai-verification-tool` (343), `avatar-upload` (239), `consolidated-processing-toast`
(189), `analytics-card` (39), `CurrencyDisplay`, `calendar-04`, `animated-cursor`,
`magnet-lines`, `raycast-animated-background`.

Genuine shadcn primitives installed and unused: `accordion`, `aspect-ratio`, `form`,
`radio-group`.

### The `form` finding, which was not in the brief

**`form.tsx` has zero importers.** Every form in the platform is hand-wired `useState` with
manual validation. That is the main reason `superadmin/proposals/create` is 836 lines,
`superadmin/users/create` 604 and `superadmin/fa/campaigns/create` 599. Adopting the shadcn
Form primitive is probably the single largest reduction in code and in inconsistency
available anywhere in this overhaul.

### One naming collision, and an honest correction

Two components are named `CurrencyDisplay`, in the same folder. The audit called this a live
money-display trap. **On checking, it is not:** `currency.tsx` takes `amount` (whole AED) and
`CurrencyDisplay.tsx` takes `amountCents`, so the differing prop names make TypeScript reject
a wrong import rather than silently render a hundredfold error. It is a reading trap and the
cents version is dead code, but no money is at risk today.

---

## 3. Navigation

**verified.** Groups are **Overview**, **Work**, **Running the company**, **Settings**.

| Role | Sidebar items |
|---|---|
| Business development | **7** |
| Account management | 10 |
| Talent manager | 17 |
| Leadership | 24 |
| Superadmin | 24 — **identical to leadership**, only the header subtitle differs |

### A sixth role state nobody planned for

Plain `role === 'admin'` falls into the leadership branch but `leadership` is false, so it
gets no Approvals and no company group, and Work is filtered by `admin_modules`. **A
module-scoped admin can end up with a one-item Work group.** Needs a decision: does admin get
a dashboard, or inherit one?

### Two questions, not fixes

1. **Business development has no Settings group at all.** Their module defaults are
   `["clients","proposals"]`, so every gate in the group fails and the group does not render.
2. **Account managers hold the `fa` permission but see none of it.** The guard is
   `can("fa") && (isSuperAdmin || !accountOnly)` — the permission is granted, then overridden
   by role. Deliberate, or a leftover?

Both may be intended. Neither is being changed.

### Naming is not a slang problem, it is a canonical-name problem

The same destination has different names depending on who is looking:

| Destination | Called | And also called |
|---|---|---|
| `/work/goals` | My target (talent) | Daily targets (leadership) |
| `/work/clients` | My clients (account) | Clients (leadership) |
| `/work/chasing` | Creators to chase (talent) | Late & chasing (account) |
| `/work/brands` | Brands (sidebar) | Who has gone quiet (command palette) |

The sidebar is sentence case except `Share Center`, which is Title Case and American. The
command palette is Title Case throughout. So the fix is one canonical name per destination,
used by the sidebar, the palette, the page title, tabs and notifications — not a rename pass.

---

## 4. Notifications: four systems, five ways of deciding who hears

This is the most serious area found.

| Path | Recipients decided by | Reaches the bell? |
|---|---|---|
| Team alerts (`team_alerts.notify`) | a `ROUTING` dict by `event_key` → `staff_role`, **plus every superadmin, always** | yes |
| `NotificationService.create` direct | one `user_id` passed by the caller | yes |
| Creator app (`fa_notify_superadmin`) | `users.role IN ('super_admin','superadmin','admin')` — **`staff_role` ignored** | yes |
| Enrolment | `resolve_audience()`, straight to email | **no — writes no row at all** |

### Three consequences

1. **The whole enrolment module is invisible in the console.** It writes no notification row,
   so a creator signing, a payee needing confirmation or a link going out never reaches the
   bell or any dashboard. It is email-only.
2. **The co-founder is excluded from every creator-app notification**, because that path
   resolves recipients by `role` and ignores `staff_role`. She is `role='user'` with
   `staff_role='cofounder'`. Same trap as the money gates, in a place nobody had checked.
3. **Proposal events notify exactly one person**, `created_by_admin_id`. If they are away, a
   client confirming, rejecting or asking for more reaches nobody. `quote_confirmed` also
   uses an uncatalogued event key, so it can never send an email.

And every superadmin is added to every team alert on top of the routing table, which is why
the bell is noise for a superadmin specifically.

**Proposal, not a change:** one recipient resolver, driven by scope and role the way
`field_policy` already does for money, so that who hears about something is decided in one
place. This alters behaviour, so it needs sign-off before it is built.

---

## 5. Open questions for the founder

1. Does plain `admin` get its own dashboard, or inherit leadership's?
2. Should business development have a Settings group?
3. Should account managers see the creator-app items their permission already grants?
4. May notification recipients move to a single scope-driven resolver?

---

## 6. Still open

- Feature inventory (the zero-feature-loss contract) — agent running
- Density ranking of the ten heaviest pages — agent running
- Chart inventory by file and type — agent running
