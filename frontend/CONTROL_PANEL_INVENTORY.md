# Following Control Panel — Complete Feature Inventory

Scope: every route under `src/app/work/**` and `src/app/superadmin/**`.

This is the zero-feature-loss contract for a redesign. Labels are copied verbatim from the
source. Where a label is computed at runtime, the source expression is given.

`next.config.ts` rewrites `/work/:path*` → `/superadmin/:path*` for anything not in a
hardcoded allowlist, so most `/work` URLs are served by files under `src/app/superadmin`.
Both spellings are given per route.

---

# 0. Shell, navigation and permission model

## 0.1 Permission primitives — `src/hooks/useAdminAccess.ts`

| Flag | True for |
|---|---|
| `isSuperAdmin` | `role === 'super_admin'` or `role === 'superadmin'` |
| `isStaff` | `role === 'user'` carrying a `staff_role` |
| `isFullAccessStaff` | `staff_role === 'ceo'` or `staff_role === 'cofounder'` |
| `canDestroy` | `isSuperAdmin` or `role === 'admin'` or `isFullAccessStaff` |
| `canExport` | same set as `canDestroy` (this is "leadership") |
| `canSeeSell` | `canExport` + `account_manager` + `business_development` |
| `canSeeCost` | `canExport` + `talent_manager` |
| `canSeeMargin` | `canExport` only |
| `can(module)` | `!loading && (isSuperAdmin || modules === null || modules.includes(m))` |
| `loading` | true until `/api/v1/auth/me` answers; `can()` answers **no** while loading |

Data sources: `GET /api/v1/auth/me` (role, `admin_modules`, `staff_role`), then a background
refine from `GET /api/v1/staff/me` (6s abort) which is authoritative when it answers.
`modules === null` means unrestricted.

## 0.2 Admin modules — `ADMIN_MODULES`

| key | label |
|---|---|
| `dashboard` | Dashboard |
| `operations` | Operations |
| `clients` | Clients |
| `users` | Users & Admins |
| `campaigns` | Campaigns |
| `proposals` | Proposals |
| `influencers` | Influencer Database |
| `fa` | Following App |
| `system` | System |
| `billing` | Billing |

## 0.3 Staff-role default modules — `STAFF_ROLE_DEFAULTS`

Client-side fallback mirroring the backend `STAFF_ROLE_DEFAULT_MODULES`; used when
`/staff/me` fails.

| staff_role | modules |
|---|---|
| `talent_manager` | `proposals`, `influencers`, `campaigns`, `fa` |
| `account_manager` | `clients`, `campaigns`, `proposals`, `fa` |
| `business_development` | `clients`, `proposals` |
| `cofounder` | `null` = full access |
| `ceo` | `null` = full access |

## 0.4 Route → module gate — `src/lib/routeModules.ts` (`ROUTE_MODULES`)

Enforced by `ModuleRouteGuard` inside `SuperadminLayout`. Matched on the first path segment
after `/work` or `/superadmin`, so both spellings gate identically. A screen absent from this
table is open to everyone internal.

| screen segment | module(s) required (any one is enough) |
|---|---|
| `areas` | `influencers` **or** `clients` |
| `operations` | `operations` |
| `clients` | `clients` |
| `brands` | `clients` |
| `staff` | `users` |
| `users` | `users` |
| `campaigns` | `campaigns` |
| `chasing` | `campaigns` **or** `influencers` |
| `report-campaigns` | `campaigns` |
| `proposals` | `proposals` |
| `influencers` | `influencers` |
| `coverage` | `influencers` |
| `sourcing` | `influencers` |
| `payables` | `influencers` |
| `goals` | `influencers` |
| `team` | `[]` — open to all internal |
| `team-console` | `[]` — open to all internal |
| `fa` | `fa` |
| `notifications` | `system` |
| `whatsapp` | `system` |
| `system` | `system` |
| `approvals` | `campaigns` |
| `billing` | `billing` |

Deliberately absent (open to every internal user): `guide`, `manual`, `inbox`, `today`,
`enrolments`, `share`, `money`, `creators`.

`/ops` maps to the `operations` screen via `screenOf()`.

## 0.5 `MODULE_HOME` — where a refused viewer is sent

Always the `/work` spelling.

| module | home |
|---|---|
| `operations` | `/ops/campaigns` |
| `clients` | `/work/clients` |
| `users` | `/work/users` |
| `campaigns` | `/work/campaigns` |
| `proposals` | `/work/proposals` |
| `influencers` | `/work/influencers` |
| `fa` | `/work/fa` |
| `system` | `/work/system` |
| `areas` | `/work/areas` |
| `billing` | `/work/billing` |

Fallback when the viewer holds no module with a home: `/work/today`. While refused, the page
body reads `Redirecting…`.

## 0.6 Sidebar — `src/components/admin/SuperAdminSidebar.tsx`

Header: shield tile, `Following`, and beneath it the viewer's `staff_role` with underscores
replaced by spaces, or `Control panel` when there is none. The header links to `/work/today`.

Badge counts come from one call, `GET /api/v1/admin/today/badges`, keyed by menu key. Zeros
are never returned, so a badge is absent when the work is done.

While `accessLoading` is true, the Work and Running-the-company groups render empty.

### Group `Overview` — every role, ungated

| label | url | icon |
|---|---|---|
| `Today` | `/work/today` | ListChecks |
| `Waiting on me` | `/work/inbox` | Inbox |
| `The manual` | `/work/guide` | BookOpen |

### Group `Work` — one branch per role

Branch selection: `talentOnly = !isSuperAdmin && staffRole === 'talent_manager'`,
`bizdevOnly = !isSuperAdmin && staffRole === 'business_development'`,
`accountOnly = !isSuperAdmin && staffRole === 'account_manager'`,
`leadership = isSuperAdmin || isFullAccessStaff`. Leadership and superadmin render the same
menu.

**talent_manager**

| label | url | badge key |
|---|---|---|
| `Creators & rates` | `/work/influencers` | — |
| `Creators needing a price` | `/work/influencers/review` | `needs-price` |
| `Brand rosters` | `/work/areas` | — |
| `Where we're thin` | `/work/coverage` | — |
| `Campaigns` | `/work/campaigns` | — |
| `Creators to chase` | `/work/chasing` | `chasing` |
| `Enrolments` | `/work/enrolments` | `enrolments` |
| `Creator payments` | `/work/payables` | `payables` |
| `My target` | `/work/goals` | — |

**business_development**

| label | url | badge key |
|---|---|---|
| `Brands` | `/work/brands` | `brands` |
| `Quotes` | `/work/proposals` | `proposals` |
| `Share Center` | `/work/share` | — |
| `Sample packs` | `/work/areas?kind=sample` | — |

**account_manager**

| label | url | badge key |
|---|---|---|
| `My clients` | `/work/clients` | — |
| `Quotes` | `/work/proposals` | — |
| `Share Center` | `/work/share` | — |
| `Campaigns` | `/work/campaigns` | — |
| `Late & chasing` | `/work/chasing` | `chasing` |
| `Brand rosters` | `/work/areas` | — |
| `App creators` | `/work/fa/members` | — |

**leadership / superadmin** (identical menus)

| label | url | shown when | badge key |
|---|---|---|---|
| `Clients` | `/work/clients` | `can('clients') \|\| can('proposals')` | — |
| `Share Center` | `/work/share` | `can('clients')` | — |
| `Campaigns` | `/work/campaigns` | `can('campaigns') \|\| can('operations') \|\| can('fa')` | — |
| `Creators` | `/work/creators` | `can('influencers') \|\| can('fa')` | — |
| `Enrolments` | `/work/enrolments` | `can('influencers') \|\| can('proposals')` | `enrolments` |
| `Where we're thin` | `/work/coverage` | `can('influencers')` | — |
| `Money` | `/work/money` | `can('billing') \|\| can('influencers')` | — |
| `Sign-offs` | `/work/approvals` | `leadership` | `signoffs` |

### Group `Running the company` — `leadership` only, hidden while `accessLoading`

| label | url |
|---|---|
| `Daily targets` | `/work/goals` |
| `My team` | `/work/team` |
| `Office screens` | `/work/system/displays` |

### Group `Settings`

| label | url | shown when |
|---|---|---|
| `Users` | `/work/users` | `can('users')` |
| `Staff` | `/work/staff` | `can('users')` |
| `Merchants` | `/work/fa/merchants` | `can('fa') && (isSuperAdmin \|\| !accountOnly)` |
| `App activity` | `/work/fa/activity` | same |
| `Creator reliability` | `/work/fa/reliability` | same |
| `Ad banners` | `/work/fa/ad-banners` | same |
| `App notifications` | `/work/fa/notifications` | same |
| `Email alerts` | `/work/notifications` | `can('system')` |
| `WhatsApp` | `/work/whatsapp` | `can('system')` |
| `System` | `/work/system` | `can('system')` |

Active-item resolution: the longest nav URL (query stripped) that prefix-matches the current
path.

Footer: `NavUser` with the viewer's display name, email and avatar.

## 0.7 Site header — `src/components/site-header.tsx`

Present on every console page via `SuperadminLayout` / `SuperAdminInterface`.

| Element | Detail |
|---|---|
| Breadcrumb | Built by `getRouteTrail(pathname)` from `src/lib/routeRegistry.ts`; UUID / long-numeric segments render as `Details` |
| Search button | aria-label `Open command palette`, label `Search`, opens ⌘K |
| Notifications | bell with unread count |
| Theme | `ModeToggle` |
| Overflow | aria-label `More`, label `More`; contains a balloons animation trigger |
| Sign out | aria-label `Sign out`, label `Sign out`; AlertDialog titled `Sign out?` with `Cancel` |

### Route titles registry — `ROUTE_TITLES` (operator half)

`/work/today` Today · `/work/brands` Brands · `/work/coverage` Coverage · `/work/goals` Goals ·
`/work/payables` Creator payments · `/work/team` Creator team · `/superadmin` Dashboard ·
`/superadmin/operations` Operations · `/superadmin/clients` Clients · `/superadmin/users` Users ·
`/superadmin/users/create` Create User · `/superadmin/campaigns` Campaigns ·
`/superadmin/campaigns/create` Create Campaign · `/superadmin/proposals` Proposals ·
`/superadmin/proposals/create` Create Proposal · `/superadmin/influencers` Influencer Database ·
`/superadmin/influencers/analyzed` Analyzed Creators · `/superadmin/influencers/add` Add / Import ·
`/superadmin/fa` Following App · `/superadmin/fa/activity` Activity · `/superadmin/fa/members` Members ·
`/superadmin/fa/merchants` Merchants · `/superadmin/fa/campaigns` FA Campaigns ·
`/superadmin/fa/deliverables` Deliverables · `/superadmin/fa/withdrawals` Withdrawals ·
`/superadmin/fa/wallets` Creator Wallets · `/superadmin/fa/receipt-claims` Receipt Claims ·
`/superadmin/fa/ad-banners` Ad Banners · `/superadmin/billing` Billing · `/superadmin/system` System ·
`/ops` Operations

## 0.8 Command palette — `src/components/GlobalCommandPalette.tsx`

Mounted inside `SuperadminLayout`. Every entry carries the same `module` gate as its route.

Operator navigation entries: `Dashboard` /work/today · `Operations` /work/operations ·
`Clients` /work/clients · `Users` /work/users · `Campaigns` /work/campaigns ·
`Proposals` /work/proposals · `Share Center` /work/share ·
`Influencer Database` /work/influencers · `Analyzed Creators` /work/influencers/analyzed ·
`FA Overview` /work/fa · `FA Activity` /work/fa/activity · `FA Members` /work/fa/members ·
`FA Campaigns` /work/fa/campaigns · `Receipt Claims` /work/fa/receipt-claims ·
`Billing` /work/billing · `System` /work/system

Operator task entries: `Today` · `Creators needing a price` /work/influencers/review ·
`Brand rosters` /work/areas · `Office screens` /work/system/displays ·
`Approvals` /work/approvals · `Add / import creators` /work/influencers/add ·
`Who has gone quiet` /work/brands · `My team` /work/team · `Daily targets` /work/goals ·
`Creators to chase` /work/chasing · `The team manual` /work/manual ·
`Report campaigns` /work/report-campaigns · `Operations queues` /work/operations ·
`Staff access` /work/staff · `Content review` /work/fa/deliverables ·
`Withdrawals` /work/fa/withdrawals · `Creator wallets` /work/fa/wallets ·
`Creator reliability` /work/fa/reliability · `Merchants` /work/fa/merchants ·
`Ad banners` /work/fa/ad-banners · `App notifications` /work/fa/notifications ·
`Email alerts` /work/notifications · `WhatsApp` /work/whatsapp · `Job queue` /work/system/jobs ·
`Analyzed creators` /work/influencers/analyzed · `Where we're thin` /work/coverage ·
`Creator payments` /work/payables · `Production` /ops/campaigns · `Show me how` /how

Create entries: `Create User` /work/users/create · `Create Campaign` /work/campaigns/create ·
`Create FA Campaign` /work/fa/campaigns/new

## 0.9 Shared hub headers

Hub headers are inserted at the top of existing screens; each screen keeps its own body.

### `ClientsHubHeader` — `src/components/console/ClientsHubHeader.tsx`

Title `Clients`. Sub: "Who we sell to, and what we have quoted them. Clients are on the books,
brands are the earlier conversations, and proposals are the quotes sitting with them."

| tab label | href | module |
|---|---|---|
| `Clients` | `/work/clients` | `clients` |
| `Brands` | `/work/brands` | `clients` |
| `Proposals` | `/work/proposals` | `proposals` |

Optional stat row (`showStats`, used on the Clients tab only). Each stat renders only when its
endpoint answered — never a zero standing in for an absence.

| stat label | hint |
|---|---|
| `Clients on the books` | `Companies with an account and a name on it` |
| `Gone quiet` | `A week or more of silence, and {n} past a fortnight` / `Something has moved with everyone this week` |
| `Quotes out with a client` | `Sent and waiting on their answer` |

Endpoints: `/api/v1/admin/clients?limit=1` (needs `clients`),
`/api/v1/admin/brands/heartbeat` (needs `clients`), `/api/v1/admin/proposals/stats`
(needs `proposals`). Each settled independently.

### `CampaignsHubHeader` — `src/components/console/CampaignsHubHeader.tsx`

Title `Campaigns`. Sub: "Everything we are delivering."

| tab label | href | module |
|---|---|---|
| `All campaigns` | `/work/campaigns` | `campaigns` |
| `App campaigns` | `/work/fa/campaigns` | `fa` |
| `Production` | `/ops/campaigns` | `operations` |
| `Reports` | `/work/report-campaigns` | `campaigns` |

On `/work/campaigns` and `/superadmin/campaigns` only, a panel `Where the work is` /
"Start to paid. Open a stage to work on it." with seven clickable stages. A stage the viewer
cannot open is disabled; a stage whose count did not come back shows `—`.

| stage label | hint | destination | module |
|---|---|---|---|
| `Opportunity` | `Talking, nothing started` | `/work/brands` | `clients` |
| `Sourcing` | `Finding the creators` | `/work/areas` | `influencers` |
| `Proposal` | `With the client` | `/work/proposals` | `proposals` |
| `Paperwork` | `Agreement and advance` | `/work/brands` | `clients` |
| `Live` | `Being delivered now` | `/ops/campaigns` | `operations` |
| `Report` | `Measured and shared` | `/work/report-campaigns` | `campaigns` |
| `Unpaid` | `Invoiced, not settled` | `/work/brands` | `clients` |

The `Unpaid` figure is omitted entirely for a viewer whose heartbeat payload carries no
`unpaid_invoices` field.

### `CreatorsHubHeader` — `src/components/console/CreatorsHubHeader.tsx`

Title `Creators`. Sub: "Everyone we can book: who we hold rates for, who still needs a price,
where we are thin, and who actually delivers."

| tab label | href | module | count |
|---|---|---|---|
| `Database` | `/work/influencers` | `influencers` | — |
| `Creators needing a price` | `/work/influencers/review` | `influencers` | review-queue count |
| `Analyzed creators` | `/work/influencers/analyzed` | `influencers` | — |
| `Brand rosters` | `/work/areas` | `influencers` | — |
| `Where we're thin` | `/work/coverage` | `influencers` | — |
| `On the app` | `/work/fa/members` | `fa` | — |
| `Who actually delivers` | `/work/fa/reliability` | `fa` | — |

Primary action `Add or import creators` → `/work/influencers/add`, shown when
`!loading && !bare && can('influencers')`. A `bare` variant drops the title bar and the button,
keeping only the tab row (used on `/work/areas`).

### `MoneyHubHeader` — `src/components/console/MoneyHubHeader.tsx`

Title `Money`, sub "What comes in, and what goes out." (both overridable per screen).

| tab label | href | module | extra gate |
|---|---|---|---|
| `Client credits` | `/work/billing` | `billing` | — |
| `Creator payments` | `/work/payables` | `influencers` | `canSeeCost` |
| `Creator app balances` | `/work/fa/wallets` | `fa` | `canSeeCost` |

`canSeeCost` is deliberately stricter than the module gate: an account manager or business
developer must never learn creator cost, and the server refuses them regardless.

---

# 1. `/work/today` — Today

- **Route:** `/work/today` (also `/superadmin/today`, which is a `redirect('/work/today')` stub)
- **File:** `src/app/work/today/page.tsx`
- **Gate:** none beyond the console `AuthGuard` — every internal role
- **Title:** `Good morning` / `Good afternoon` / `Good evening` + `, {first name}` (hour-based)
- **Sub:** today's date as `Monday, 6 September`
- **Data:** `GET /api/v1/admin/today`

## Header actions

| Control | Label / aria | Notes |
|---|---|---|
| Round button | `Search` | Dispatches a synthetic ⌘K keydown to open the command palette |
| Round button | `Refresh` | Re-fetches `/admin/today` |
| Primary button | role-dependent, see below | `data-tour="today-add"` |

Role primary (`PRIMARY` map, keyed on the `role`/`scope` the endpoint returns):

| role | label | href |
|---|---|---|
| `leadership` | `Sign-offs` | `/work/approvals` |
| `talent` | `Add a creator` | `/work/influencers?new=1` |
| `account` | `Open the client list` | `/work/clients` |
| `business_development` | `Log a brand` | `/work/brands?new=1` |

## Stat band

Up to four server-driven stats (`data.headline`), each with `label`, `value`, `hint`, `tone`
and optional `href` (click navigates). A stat whose value is `null` renders `—`, never `AED 0`.
`format === 'aed'` shortens: `1.23M`, `45K`, else exact.

## Table — `Waiting on you`

Heading carries the row count. `DataTable` with sortable headers, `hidePagination`, empty
state `Nothing is waiting on you.`

| column id | header | shown when | content |
|---|---|---|---|
| `what` | `What` | always | title, linked when `href` |
| `where` | `Where` | any row has `where` | muted text |
| `progress` | `Found` | any row has `of` | `MiniBar value/of`, tone `info` |
| `why` | `Why it is stopped` | always | stage badge (tone-coloured) + reason |
| `waiting` | `Waiting` | always | age dot: `new` or `{n}d`; tone bad ≥7d or urgency high, warn ≥3d, else good; title `Waiting {n} days` / `Arrived today` |
| `open` | *(blank)* | always | detail popover + round open button |

Row actions:

| Control | Label / aria | Behaviour |
|---|---|---|
| Popover trigger | title + aria `Where this sits` | Draws a `StageBar` for the row's flow and any extra `{label, href}` action buttons |
| Round button | `Open {title}` | `router.push(row.href)` |

Flow stage bars (`FLOWS`):

| flow | stages |
|---|---|
| `areas` | `Released`, `Stocked`, `Cleared`, `Sent`, `Picked` |
| `brands` | `Logged`, `Sourcing`, `Quoted`, `Live` |
| `proposals` | `Drafted`, `Approved inside`, `Sent`, `Answered` |
| `ladder` | `Booked`, `Rate agreed`, `Briefed`, `Content in`, `Posted`, `Paid` |

Beside the heading, when the endpoint returns a target: `Today's goal`, `{value} of {of}`, and
a progress `Ring`.

Empty branch (no rows): check icon, `Nothing is waiting on you`.

## Table — `Running without you`

Rendered only when non-empty. Heading carries the count; toggle button
`Show all {n}` / `Show less` appears above 5 rows (default 5 shown).

| column id | header | shown when |
|---|---|---|
| `what` | `What` | always |
| `progress` | `Done` | any row has `of` (MiniBar, tone `good`) |
| `why` | `Where it stands` | always |
| `owner` | `Who has it` | always |
| `open` | *(blank)* | always |

Empty state string: `Nothing is running.`

## Shortcuts row

Ghost buttons, filtered by `module` and by the viewer's `role` scope.

| label | href | module | scopes |
|---|---|---|---|
| `Brand rosters` | `/work/areas` | — | leadership, talent, business_development |
| `Needs a price` | `/work/influencers/review` | influencers | leadership, talent |
| `Proposals` | `/work/proposals` | proposals | all |
| `Campaigns` | `/work/campaigns` | campaigns | all |
| `Brands` | `/work/brands` | clients | all |
| `Sign-offs` | `/work/approvals` | — | leadership |
| `Creator payments` | `/work/payables` | influencers | leadership, talent |
| `Where we're thin` | `/work/coverage` | influencers | leadership, talent |
| `Office screens` | `/work/system/displays` | system | leadership |

No exports. No filters or search beyond the palette shortcut.

---

# 2. `/work/inbox` — Waiting on me

- **Route:** `/work/inbox`
- **File:** `src/app/work/inbox/page.tsx`
- **Gate:** none (deliberately ungated; the page shows only the queues the viewer can act on)
- **Title:** `Waiting on me`
- **Sub:** `Everything waiting on a decision from you. Longest wait first.`

## Header actions

| Control | Label |
|---|---|
| Outline button (toggle) | `Longest waiting first` ⇄ `Newest first` |
| Outline button | `Refresh` |

## Tabs (`Hub` tab row)

| label | href | module | extra gate | count |
|---|---|---|---|---|
| `All` | `/work/inbox` | — | — | — |
| `Content to check` | `/work/fa/deliverables?stage=proof_submitted` | `fa` | — | pending deliverables |
| `Cashback receipts` | `/work/fa/receipt-claims` | `fa` | `isSuperAdmin` | pending receipts |
| `Creator payouts` | `/work/fa/withdrawals` | `fa` | `isSuperAdmin` | pending withdrawals |
| `New creators` | `/work/fa/members` | `fa` | `isSuperAdmin` | unapproved members |
| `Creators to price` | `/work/influencers/review` | `influencers` | — | review queue |
| `Brand rosters` | `/work/areas` | `influencers` | — | — |
| `Proposals` | `/work/proposals` | `proposals` | — | pending proposals |
| `Everything in flight` | `/work/operations` | `operations` | — | — |

## Stats

| label | value | hint |
|---|---|---|
| `Waiting on me` | total items | `across {n} of your {m} lists` |
| `Longest wait` | `today` or `{n}d` | `{group} · {item title}` |
| `Over three days` | count ≥3 days | — |

## Queue panels

Each is a `Panel` with a count badge and an `Open` button; first 8 rows, then a footer button
`{n} more waiting, open {group label lowercased}`. Empty panel body: `Nothing waiting here.`

| panel title | description | gate | rows link to |
|---|---|---|---|
| `Briefs to write` | `A client is logged but nobody can source for them yet. Open a round and say what to look for.` | items come from `/admin/today` `kind === 'brief'` (leadership only server-side) | `/work/areas` |
| `Content to check` | `A creator says the post is live. Nobody is paid until someone confirms it.` | `can('fa')` | `/work/fa/deliverables?stage=proof_submitted` |
| `Cashback receipts` | `A creator spent their own money at a venue and is waiting to be paid back.` | `isSuperAdmin` | `/work/fa/receipt-claims` |
| `Creator payouts` | `Money already earned, sitting in their app balance until someone sends the transfer.` | `isSuperAdmin` | `/work/fa/withdrawals` |
| `New creators` | `Signed up and waiting to be let in. Until then they cannot apply to anything.` | `isSuperAdmin` | `/work/fa/members` |
| `Creators to price` | `Found by the team. Invisible to clients and unusable in a proposal until priced.` | `can('influencers')` | `/work/influencers/review` |
| `Rosters to clear` | `Creators are stocked and cannot go to the client until they are cleared.` | `can('influencers')` | `/work/areas/{id}` |
| `Proposals to approve` | `Built internally and stopped: nothing reaches the client until it is approved.` | `can('proposals')` | `/work/proposals/{id}/approval` |

Row right-hand extras: amount (`AED n`), follower count, cleared count or creator count, plus a
wait badge (`today` / `{n}d`) and an arrow.

## Empty / no-queue states

- All queues empty: `You are clear` / `Nothing is waiting on a decision from you.` plus a note
  that the lists are shown above.
- Viewer holds no queue at all (business development): `Nothing is waiting on you` /
  `Nothing here needs a decision from you.` / `Your work starts on Today and with your brands.`
  with buttons `Today` → `/work/today` and `Brands` → `/work/brands`.

No table, no export. The page re-fetches on window focus.

---

# 3. `/work/guide` — The manual

- **Route:** `/work/guide` (also `/superadmin/guide`, a redirect stub)
- **File:** `src/app/work/guide/page.tsx`
- **Gate:** none — deliberately absent from `ROUTE_MODULES`
- **Title:** `The manual`
- **Sub:** `What every screen in here is for, grouped by whose day it belongs to. Read your own role, and open somebody else's when you are covering for them.`

## Controls

| Control | Label / placeholder |
|---|---|
| Search input | placeholder `Search the manual` — filters title, what, why and hidden aliases |
| Footer button | `The walkthrough deck` → `/work/manual` |
| Footer button | `Waiting on me` → `/work/inbox` |

Static block, shown only when the search is empty: heading `Two things first`, then the
cost-vs-sell rule and the quote-becomes-a-campaign rule. Footer section heading:
`If this is wrong`.

No-match state: `Nothing in the manual matches that. Try the name of the screen, or what you are trying to do.`

## Sections and entries (each entry is a link card: title, what, optional why)

| section | blurb | entries → href |
|---|---|---|
| `Everyone` | `Two screens that mean the same thing whoever you are.` | `Today` /work/today · `Waiting on me` /work/inbox |
| `Talent` | `Finding creators, pricing them, signing them and getting the work in.` | `Creators & rates` /work/influencers · `Creators needing a price` /work/influencers/review · `Brand rosters` /work/areas · `Where we're thin` /work/coverage · `Campaigns` /work/campaigns · `Creators to chase` /work/chasing · `Enrolments` /work/enrolments · `My target` /work/goals |
| `Business development` | `Getting brands in the door and turning interest into a signed quote.` | `Brands` /work/brands · `Quotes` /work/proposals · `Share Center` /work/share · `Sample packs` /work/areas?kind=sample |
| `Account management` | `Running the clients we already have, and the campaigns they are paying for.` | `My clients` /work/clients · `Quotes` /work/proposals · `Campaigns` /work/campaigns · `Late & chasing` /work/chasing · `App creators` /work/fa/members |
| `Leadership` | `Money, sign-offs and the shape of the company. Everything above, plus these.` | `Creator payments` /work/payables · `Enrolment payments` /work/enrolments/payments · `Money` /work/money · `Sign-offs` /work/approvals · `Daily targets` /work/goals · `My team` /work/team · `Users` /work/users · `Staff` /work/staff · `Office screens` /work/system/displays |
| `The creator app` | `Inflink: barter, cashback and paid deals that creators apply to themselves.` | `App campaigns` /work/fa/campaigns · `Merchants` /work/fa/merchants · `Creator reliability` /work/fa/reliability · `App activity` /work/fa/activity · `Ad banners` /work/fa/ad-banners · `App notifications` /work/fa/notifications |
| `System` | `Settings that change what the platform sends and how it behaves.` | `Email alerts` /work/notifications · `WhatsApp` /work/whatsapp · `System` /work/system |

No tables, no exports, no permission gating on the content itself.

---

# 4. `/work/manual` — the walkthrough deck

- **Route:** `/work/manual`
- **File:** `src/app/work/manual/page.tsx`
- **Gate:** `AuthGuard` only — no module gate, no console shell (full-bleed dark deck)
- **Title:** per-slide; the opening slide is a title card headed `The team manual`

## Controls

| Control | Label / aria | Behaviour |
|---|---|---|
| Close button | aria `Close the deck` | `/work/today` |
| Keyboard | — | `→` / `space` / `PageDown` next; `←` / `PageUp` back; `Home` first; `End` last |

## Slides in order

| id | kind | who / role | title |
|---|---|---|---|
| *(opening)* | title | — | title card, lede "One brand, end to end, from the first conversation to the money leaving for a creator. Ten stops…" |
| `logged` | stop | Aisha · Business development | `A brand says maybe` |
| `area` | stop | Hajar or Zain · Founder | `The founder opens the roster` |
| `stock` | stop | Aqsa · Talent | `Stocking the roster` |
| `price` | stop | Hajar or Zain · Founder | `Price them, and let them in` |
| `clear` | stop | Hajar or Zain · Founder | `Decide who the client may see` |
| `share` | stop | Aisha or Sana · Client-facing | `The client picks` |
| `proposal` | stop | Sana · Account management | `The proposal` |
| `confirm` | stop | Hajar or Zain · Founder | `They say yes` |
| `partial` | stop | Hajar or Zain · Founder | `They only took some of them` |
| `paper` | stop | Sana with a founder · Account management | `Agreement and invoice` |
| `ladder` | stop | Aqsa, with founder confirmations · Talent + Founder | `Delivering the campaign` |
| `pay` | stop | Hajar or Zain · Founder | `Money out` |
| `desks` | desks | — | `Where each of you starts the day` |
| `rules` | rules | — | `Six things you can count on` |

Each stop carries a lede, a `does` bullet list, a `where` row of deep links (`Brands`, `Packs`,
`Rosters`, `Waiting room`, `Add creators`, `Coverage`, `Proposals`, `Clients`, `Money`,
`Campaigns`, `Payables`), an optional `helps` list and a `handover` line.

The `desks` slide lists four desks: `Aisha` / Business development, `Aqsa` / Talent,
`Sana` / Account management, `Hajar & Zain` / Founders — each with what they see and what
they start on.

---

# 5. `/work/brands` — Brands

- **Route:** `/work/brands` (`/superadmin/brands` redirects here)
- **File:** `src/app/work/brands/page.tsx`
- **Gate:** module `clients`
- **Header:** `ClientsHubHeader` (title `Clients`), note
  `Silence is measured from activity in here. If you spoke to them, log it.`
- **Data:** `GET /api/v1/admin/brands/heartbeat`

## Actions

| Control | Label | Notes |
|---|---|---|
| Primary button | `Log a new brand` | Opens `NewOpportunityDialog`; also auto-opens on `?new=1` |
| Error retry | `Try again` | Shown instead of the table when the fetch fails, with the note that "This is not an all clear, and nothing below is known." |

## Stats (each click switches the table filter)

| label | tone | hint | switches to |
|---|---|---|---|
| `Gone quiet` | warn when > 0 | `A week or more` | `attention` |
| `At risk` | bad when > 0 | `Two weeks. Call them` | `attention` |
| `Waiting on us` | warn when > 0 | `Of {total} on the books` | `ours` |

## Panel `Brands` / `Longest silence first`

Filter `ToggleGroup` in the panel header, mirrored into the URL as `?tab=`:

| value | label | aria-label |
|---|---|---|
| `all` | `All` | `Every brand` |
| `attention` | `Needs chasing` | `Brands that need chasing` |
| `ours` | `Ours` | `Brands waiting on us` |

Table columns: `Brand` · `Silent` · `Whose move` · `Account manager` · `Open` · `Last word` ·
*(blank arrow column)*. No sorting controls, no pagination, no search.

- `Silent` = age dot + health label: `Healthy`, `Going quiet`, `At risk`, `No activity`;
  tooltip `{n} days since anything moved` / `never` / `today`.
- `Whose move` = badge `Ours` or `Theirs`.
- `Open` = joined chips: `{n} live`, `{n} roster(s)`, `{n} awaiting verdict`,
  `agreement out`, `{n} unpaid`.
- Row click → `/work/brands/{id}`.

Empty states: `Nobody needs chasing. Every brand is warm.` / `Nothing is waiting on us.` /
`No brands logged yet.` Failure state: `Could not load the client list.` + `Try again`.

## Dialog `New opportunity` — `src/components/superadmin/brands/NewOpportunityDialog.tsx`

| field | label | placeholder |
|---|---|---|
| name | `Brand` | `e.g. Barakat Fresh` |
| contact | `Contact` | `Their name or role` |
| email | `Email` | `name@brand.com` |
| source | `Where they came from` | chips `Referral`, `Inbound`, `Event`, `Outbound` |
| notes | `Notes` | `What they want, who introduced you, anything useful later` |

Buttons `Cancel` and save. Validation: `Give the brand a name`. Success toast `{name} logged`.

No exports on this page.

---

# 6. `/work/brands/{teamId}` — brand record

- **Route:** `/work/brands/{teamId}`
- **File:** `src/app/work/brands/[teamId]/page.tsx`
- **Gate:** module `clients`
- **Title:** the brand name
- **Data:** `GET /api/v1/admin/brands/{id}/browse`, `GET /api/v1/admin/brands/{id}/touches`

## Actions

| Control | Label | Gate |
|---|---|---|
| Back button | `All brands` | — |
| Primary | `I spoke to them` | — |
| Outline | `Open the sourcing area` | an open area exists |
| Outline | `Start sourcing` | no open area **and** `canDestroy` |
| Outline | `Open the brand roster` | no open area and not `canDestroy` |
| Outline | `Open client record` → `/work/clients/{teamId}` | — |

## FieldStrip

`Account manager` (or `Unassigned`) · `Live` (`{n} of {m}`) · `Rosters` (`{n} open` / `None open`) ·
`Quotes out` · `Unpaid` (`—` / count / `All settled`)

## Panels

| panel | description | rows | row click | gate |
|---|---|---|---|---|
| `Needs you` | — | overdue promised next-steps, overdue rosters, overdue invoices | roster → `/work/areas/{id}` (needs `influencers`); invoice → `/work/clients/{teamId}?tab=commercial` | rendered only when non-empty |
| `Conversations` | `What we owe them next` | last 8 touches: channel, date, who, note, next step | — | action button `Log a call` |
| `Campaigns` | — | name, status, type, post count, updated | `/work/campaigns/{id}/timeline` | click needs `can('campaigns')`; header link `All {n}` → `/work/clients/{teamId}?tab=campaigns` |
| `Rosters` | — | title (+ `· round n`), open/closed/archived, proposed of target, turned down, owner, due | `/work/areas/{id}` | click needs `can('influencers')`; header link `Open the grid` |
| `Quotes` | — | title, status, sell total, updated | `/work/proposals/{id}` | click needs `can('proposals')`; header link `All {n}` → `?tab=proposals` |
| `Invoices` | — | amount, status, due, paid, overdue; right badge `Paid` / `Open` | `/work/clients/{teamId}?tab=commercial` | — |

Panel empties: `Nothing running for them yet.` · `No roster yet.` · `No quotes sent.` ·
`Nothing invoiced yet.` Failure state: `Could not load this client.` + `Try again`.

## Dialog `You spoke to {brand}` — `LogTouchDialog.tsx`

| field | label | placeholder |
|---|---|---|
| channel | `How` | chips from `CHANNELS` (call / WhatsApp / email / meeting) |
| note | `What was said (optional)` | `e.g. budget confirmed for October, wants food creators first` |
| next step | `What happens next (optional)` | `e.g. send the shortlist` |
| next date | `By when` | date input |

Buttons `Cancel` and save. Success toast `Logged: {brand} counts as spoken to today`.

No exports.

---

# 7. `/work/chasing` — Creators to chase

- **Route:** `/work/chasing`
- **File:** `src/app/work/chasing/page.tsx`
- **Gate:** module `campaigns` **or** `influencers`
- **Title:** `Creators to chase`
- **Sub:** `Booked creators waiting on a rate, a guide or the content.` + `{n} past their date.` or `Nobody is late.`
- **Data:** `GET /api/v1/admin/today/chasing`

## Controls

`ToggleGroup` in the header, rendered only when at least one creator is late:

| value | label | aria-label |
|---|---|---|
| `late` | `Late ({n})` | `Only the late ones` |
| `all` | `Everyone ({n})` | `Everyone waiting` |

## Layout

- Section `Late` / `Past their content date, longest first` — shown only in the `all` view when
  late rows exist. Rows show the campaign name inline.
- Then one section per campaign: heading = campaign name, sub `{n} waiting` + `· {n} late`,
  and a round button `Open the {campaign} board` → `/work/campaigns/{id}/ladder`.
- Inside a campaign, rows are grouped under band labels — either `Late` or the row's
  `waiting_for` value.

Row content: avatar, `@username`, `{campaign · }{waiting_for} · {due label}`, age dot.
Due labels: `was due {n} days ago`, `due today`, `due in {n} days`,
`{n} days on this step`, `moved today`. Row click → `/work/campaigns/{campaign_id}/ladder`.

Empty state: `Nobody to chase` / `Every booked creator has a rate and has delivered on time.`

No table, no search, no pagination, no export.

---

# 8. `/work/coverage` — Where we're thin

- **Route:** `/work/coverage` (`/superadmin/coverage` redirects here)
- **File:** `src/app/work/coverage/page.tsx`
- **Gate:** module `influencers`
- **Header:** `CreatorsHubHeader` tabs, then `PageHead` title `Where we're thin`,
  sub `A creator counts only once we hold a rate. A name without one cannot be quoted.`
- **Data:** `GET /api/v1/admin/influencers/coverage`

## Stats

| label | hint | click target |
|---|---|---|
| `In the database` | `{n} categories · {m} markets` | `/work/influencers` |
| `Quotable today` | `{n}% have a sell price · {n} have a cost researched`, or `The share we can put in a proposal did not come back` | `/work/influencers?pricing=quotable` |
| `Rates going stale` | `Over six months old. Re-check before quoting`, or `{n} rates carry no capture date, so their age is unknown` (value then reads `Not recorded`) | `/work/influencers?stale_costs=true` |

## Panel `Research next` / `Thinnest first`

Rows: `{category} · {market}`, meta `{costed} quotable of {held} held`, arrow.
Click → `/work/influencers?categories={cat}&countries={market}` (empty values become the
server's `no_value` sentinel).
Empties: `The gap list did not come back.` / `Every cell has quotable creators.`

## Panel `Category against market`

Description: `Ranked strongest first. Darker is stronger, and the pale cells are the backlog.`

Heat table. Row header = category; second column `Strength` = MiniBar of costed vs held; then
one column per market. Each cell shows the quotable count (or `—`) and, when applicable,
`{n} stale`. Cell click → the same filtered database URL. Hover caption underneath:
`{category} · {market}: {costed} quotable of {held} held, {n} rates going stale`, otherwise
`Shaded by who we could quote, not by how many names we hold.`

## Panel `Data to tidy` / `Each one blocks a filter`

| row title | meta | right badge | click target |
|---|---|---|---|
| `{n} creators have no category` (or `How many creators have no category did not come back`) | `They appear in no cell above` | `Fix` / `Clear` / `Unknown` | `/work/influencers?categories={no_value}` |
| `{n} creators have no market` | `Market is the first thing a client asks about` | `Fix` / `Clear` / `Unknown` | `/work/influencers?countries={no_value}` |
| `{n} rates are over six months old` (or the no-capture-date variant) | `Worth re-checking before quoting` | `Refresh` / `Clear` / `Not recorded` / `Unknown` | `/work/influencers?stale_costs=true` or `?pricing=costed` |
| `{n} creators are live but have no sell price` (only when non-zero) | `The proposal picker refuses them` | `Price` | `/work/influencers?status=active&pricing=unquotable` |

No export, no search, no pagination.

---

# 9. `/work/goals` — Targets

- **Route:** `/work/goals` (`/superadmin/goals` redirects here)
- **File:** `src/app/work/goals/page.tsx`
- **Gate:** module `influencers`
- **Title:** `Targets`
- **Sub:** `The daily number comes from how many rosters are open, so nobody is chasing an arbitrary one.`
- **Data:** `GET /api/v1/admin/goals/today`, `/team`, `/rules`; `PUT /api/v1/admin/goals/rules`

## Stats (only when the viewer has a rule)

| label | hint | click target |
|---|---|---|
| `Today's target` | `{n} roster(s) open, plus the baseline` | `/work/areas` |
| `Added today` | pace label: `Done for today`, `On track`, `Slightly behind`, `Behind`, `No target` | — |
| `This month` | `Only complete records count` / `All records count` | — |

## Panel `Last 14 days` / `Creators added, against the daily target`

Area chart (`Creators added`) with a dashed reference line labelled `Target {n}`. Below it a
progress bar with `{done} of {target} today` and the pace badge.
Empty: `Nobody has added a creator in the last fortnight.`
Failure banner: `Today's figures did not load.` + `Try again`.

## Panel `Sourcing rules` / `Applies to every talent manager this month`

**Gate: `isSuperAdmin || isFullAccessStaff`.** Absent for everyone else.

| control | title | sub |
|---|---|---|
| −/+ stepper | `Per open roster, per day` | `Until that roster closes` |
| −/+ stepper | `When nothing is open` | `Creators to add to the database each day` |
| Switch | `Only count complete records` | `Cost, category and market: stops bare handles counting` |

Footer line `{n} roster(s) open today, target {n} creators.` and button `Save rules`
(toast `Rules saved`).

## Panel `The team this month`

Table: `Person` · `Role` · `Added` · `With a cost` (MiniBar) · `Open` · `Overdue`.
Sorted by overdue rounds, then added. Empty: `Nobody has a staff role yet.`

No export, no filters.

---

# 10. `/work/team` — My team

- **Route:** `/work/team` (`/superadmin/team-console` redirects here)
- **File:** `src/app/work/team/page.tsx`
- **Gate:** **none** — `ROUTE_MODULES` maps `team` and `team-console` to `[]`
- **Title:** `My team`
- **Sub:** `Nobody else sees this page. An alert here needs a pattern, not one slow afternoon.`
- **Data:** `GET /api/v1/admin/team-console`

## Panels and stats

| block | title / description | contents |
|---|---|---|
| Critical panel | `Needs you now` | alerts with `level === 'critical'`, rendered only when present |
| Stat | `Waiting on you` | hint `Oldest {n} days` / `Nothing waiting`; click → `/work/influencers/review` |
| Stat | `Overdue` | hint `{client}, {owner}` when one, `Of {n} open`, or `All {n} on time`; click → the single overdue area or `/work/areas` |
| Stat | `Added this week` | `Across the whole team` |
| Panel | `Alerts` | all alerts, tone by level, click through where a href exists |
| Panel | `Your people` | avatar, email, `{staff role} · {n} this month`, roster count, badge `{n} overdue` / `Quiet week` / `Moving`. Empty: `Nobody has a staff role yet.` |
| Panel | `Rosters open now` / `Overdue first` | title, `{client or "No client linked"} · {owner} · round n · {n} awaiting your review · {n} turned down`, MiniBar, late dot or due-date badge. Click → `/work/areas/{id}`. Empty: `No brand is being sourced for right now.` |
| Panel | `Who has been reading the database` / `Last seven days` | email, `{n} records over {n} views`, `{n} exports attempted`, `last {n} days`, records dot. Rendered only when non-empty |

Failure state: `Could not load the console.` + `Try again`, with the note that no queue, area
or alert below is known.

No table sorting, no export, no search.

---

# 11. `/work/areas` — Rosters (brand rosters and sample packs)

- **Route:** `/work/areas`
- **File:** `src/app/work/areas/page.tsx`
- **Gate:** module `influencers` **or** `clients`
- **Header:** `CreatorsHubHeader` in `bare` mode (tab row only), shown when `can('influencers')`
- **Title:** `Rosters`
- **Sub:** `One roster per brand, plus the packs anyone can send a prospect.`
- **Data:** `imdListsApi.list()`; brands for the picker from `clientApi.list({ scope: 'all' })`

## Actions

| Control | Label | Gate |
|---|---|---|
| Outline button | `New pack` | `can('influencers')` |
| Primary button | `Start sourcing` (`data-tour="start-sourcing"`) | `canDestroy` |
| ToggleGroup | `Brands ({n})` (aria `Brand rosters`) / `Packs ({n})` (aria `Sample packs`) | — |
| Inline chip | `· show every brand` | shown when `?team=` scopes the list |
| Retry | `Try again` | on load failure |

Kind switching writes `?kind=sample` or `?team=…&brand=…` back to the URL.

## Dialog `New sample pack`

Description: `A standing set anyone can send a prospect — name it for what someone would ask for.`

| field | label | placeholder |
|---|---|---|
| name | `Name *` | `e.g. Fitness UAE` |
| description | `Description` | `Optional — who this pack is for` |

Buttons `Cancel` / `Create`. Validation `Give the pack a name`. On success navigates to the new
pack.

## Dialog `Start sourcing for a brand`

Description: `This is what tells the talent team to begin. Write what we are looking for — it
goes out with the alert, so they know before they open anything.`

| field | label | notes |
|---|---|---|
| brand | `Brand *` | select `Pick the brand`, or a locked chip with a `Different brand` link when arriving from a brand page |
| due | `Wanted by` | date input |
| brief | — | the full `BriefFields` form (below) |

Buttons `Cancel` / `Release to the team`. Success toast `{brand} released — {name} is open`,
then navigates to the roster.

## Table

| column | content |
|---|---|
| `Roster` | name, `Round {n}` badge, `Closed` badge (lock), `Live link` badge, then the brief one-liner or the description |
| `Brand` | client tab only |
| `Found` | MiniBar of `items_count` against `target_count` |
| `Cleared` | cleared count, plus `{n} out` when creators were turned down |
| `Waiting on you` | awaiting-count dot, tooltip `{n} stocked and not yet cleared or struck` |
| `Wanted by` | late dot `{n}d` (tooltip `{n} days past the date`) or the date |
| `Owner` | owner email local-part |
| *(blank)* | trash icon, gated `canDestroy && can('influencers')` |

No sorting, no pagination, no search on this screen.

Empty states: `No packs yet` / `No roster for {brand} yet` / `No brand has been released yet`,
each with a role-appropriate explanation. Failure: `Rosters did not load` + `Try again`.

## AlertDialog `Delete "{name}"?`

Body explains the area and its client picks go away, the `{n} creator(s)` stay in the master
database, and any proposal they are on is unaffected. Buttons `Cancel` / `Delete area`.

## `BriefFields` — `src/components/console/BriefFields.tsx`

Shared by `Start sourcing` and the roster's own brief editor.

**Group `What the client wants`** — hint `Who we are going out to find, and for whom.`

| field | label | placeholder |
|---|---|---|
| target_count | `How many` | `8` |
| market | `Market` | `UAE` |
| categories | `Categories` | `food, lifestyle` |
| followers_min | `Followers from` | `20000` |
| followers_max | `to` | `100000` |
| audience | `Audience the brand wants reached` | `mothers 25 to 40 in Dubai` |

**Group `What we are offering`** — hint `What a creator is being asked to say yes to.`

- Compensation chips: `cash`, `barter`, `both`
- `The client's budget (AED)` — placeholder `50000`
- `Which kind` — select `For this campaign` / `Every month`
- `What they get` — repeatable barter items: name (`Dinner for two`), `Value AED`, remove;
  button `Add an item`; running total `Worth AED {n} to each creator`
- `How they get it` — select `We send it to them` / `They visit`

**Group `What we need back`** — hint `What a creator is quoting against, and what we do with it afterwards.`

- `Platforms` chips, then per-platform format chips each with a quantity input
  (aria `How many {platform} {format}`)
- `Usage rights` — select placeholder `Pick one`; options `Organic only, they post it`,
  `We may run it as an ad`, `Full buyout`
- `For how long (days)` — shown when usage rights is not organic; placeholder `30`
- `Goes live from` / `to` — date inputs
- Checkbox `These dates cannot move`
- `Brands to avoid` — placeholder `McDonalds, KFC`
- `Exclusivity (days)` — placeholder `30`
- `Anything else` — placeholder `Optional. Context the fields above cannot carry.`

Live preview block: `They will read` + the generated brief line, or
`Nothing yet. Released like this, the alert says there is no brief.`, plus
`Not said: {missing fields}.`

---

# 12. `/work/areas/{areaId}` — roster detail

- **Route:** `/work/areas/{areaId}`
- **File:** `src/app/work/areas/[areaId]/page.tsx`
- **Gate:** module `influencers` **or** `clients`. Local flags: `canStock = can('influencers')`,
  plus `canDestroy` and `canExport`
- **Title:** the roster name, with `Round {n}` and `Closed` badges

Back link: `All packs` (sample) / `All rosters for {brand}` / `All rosters`.

## FieldStrip

`Found` · `Cleared` · `Waiting on you` · `Picked` · `Turned down` · `Wanted by` (`{n} days late`
or the date). Beneath it a provenance line: `Logged by {x} · released by {y} · with {z}`, and
`Link open until {date}` when a share link exists.

## Header actions

| Control | Label | Gate |
|---|---|---|
| Outline button | `Copy the link` | a live share link exists |
| Menu trigger | aria `More on this roster` | — |
| Menu item | `Add by handle` | `canStock && !locked` |
| Menu item | `Share this roster` / `Share (clear someone first)` (disabled when nothing is cleared) | `canDestroy && !listLink` |
| Menu item | `Turn the link off` | `canDestroy && listLink` |
| Menu item | `Close round {n}` / `Open round {n+1}` | `canDestroy` |
| Menu item | **`Download a spreadsheet`** (CSV export) | **`canExport`** — disabled when the roster is empty |
| Primary button | `Add creators` | `canStock && !locked` |

Locked banner: `Round {n} is closed.` plus `Nothing here changes and the client link no longer
takes answers. Closed by {x}. Open the next round to keep going.`

`Turn the link off` first asks, via `window.confirm`:
`Turn off the link? Anyone holding it stops seeing the list.`
`Close round` confirms: `Close this round? Nothing in it changes again, and the client link
stops taking answers.`

## Section `The brief`

Button `Edit` or `Write the brief` (gate `canDestroy`) opens dialog **`The brief`**
(description: "What the team is looking for, what we are offering and what we need back.
Everyone working this roster reads it, so say the parts you know."), body = `BriefFields`,
buttons `Cancel` / `Save the brief`.

## Bulk selection bar (appears when rows are ticked, `canStock && !locked`)

Reads `{n} selected` and `Cleared creators are the only ones a share link shows.`

| Control | Label | Gate |
|---|---|---|
| Ghost | `Cancel` | — |
| Outline | `Client turned down` | — |
| Outline | `Take off the table` | `canDestroy` |
| Primary | `Clear to share` | `canDestroy` |

## Table

Banded with group labels `Waiting on you`, `Cleared to share`, `Ruled out`.

| column | content |
|---|---|
| *(checkbox)* | aria `Select @{username}`; only when `canStock && !locked` |
| `Creator` | avatar, `@username`, full name |
| `Followers` | shortened (`1.2M` / `45.0K`) |
| `Engagement` | `{n}%`, or a `none` chip titled `Never analysed, so a share link shows no numbers` |
| `Country` | value or `–` |
| `Tier` | value or `–` |
| `State` | badge `Turned down in round {n}` (+ reason), `Struck` (title = reason), `Client picked`, `Cleared`, or `Internal` |
| *(actions)* | see below |

Row actions:

| Control | Label | Notes |
|---|---|---|
| Button | `Share` / `Copy` | creates or copies a public creator-analytics link; title shows `Public link · {n} views` |
| Ghost button | `Put back` | dropped rows only, `canStock && !locked` |
| Icon button | aria `Remove @{username}` | `canStock && !locked` |

No sorting, no pagination, no search on the table itself.

Empty: `Nobody on this roster yet` / `Add from the database, or by handle.`
Failure: `This roster did not load` + `Try again`.

## Dialogs

**`The client turned down {n} creator(s)`** — body explains they stay on the roster with the
reason so round `{n+1}` is built knowing. Field label `What did they say` (textarea,
placeholder `e.g. too small for the launch, worked with a competitor last month, tone is wrong
for us`), helper `Required. A drop with no reason tells the next round nothing.`
Buttons `Cancel` / `Record it`.

**`Take {n} off the table`** — body explains they keep their research and this only stops them
being shown to this brand. Field `Why` (placeholder `e.g. competitor conflict, rate above
budget, client passed last time`). Buttons `Cancel` / `Take off the table`.

**`Add creators`** — description `Anyone already on this roster is hidden.` Controls: search
input `Search by username or name…`, country select (`Any country` + `{country} ({n})`),
select-all toggle `Select these {n}` / `Clear these`, counter `Showing {n} of {total}`,
`Load {n} more`, footer `{n} selected` with `Cancel` / `Add {n}`.

**`Share this roster`** — description: "Anyone with the link sees the cleared creators. No
login, and never a cost price. A creator with no sell price is left off a link that shows
prices." Fields: `Open for` (number 1–365) `days`; `What they see` with two choice cards
`Creators and prices` and `Creators only`. Buttons `Cancel` / `Create link and copy`.

**`Add by handle`** (`AddCreatorsDialog`) — fields `Instagram handles` (textarea, placeholder
`@sarah.eats / @dubaifoodie / @mamaofthree`), `Category`, `Market`, `Note (optional)`
(placeholder `e.g. met at MEFCC, open to barter`). Buttons `Cancel` / add.
Toast `{n} added to the waiting room`.

---

# 13. `/work/enrolments` — Enrolments

- **Route:** `/work/enrolments`
- **File:** `src/app/work/enrolments/page.tsx`
- **Gate:** no `ROUTE_MODULES` entry; the approve action is gated on `can('proposals')`
- **Title:** `Enrolments`
- **Sub:** `Once a brand confirms a creator, this is the paperwork: the agreement they sign, the details they give us, and where their money and their product go.`

## Header controls

| Control | Label / placeholder | Notes |
|---|---|---|
| Search input | `Creator, brand, owner` | filters handle, name, brand, campaign, talent owner |
| Outline link | `Payments` | → `/work/enrolments/payments` |
| Outline button | **`Export`** | XLSX roster via `enrolmentApi.rosterXlsx()` |

## Tabs

| label | contents | badge |
|---|---|---|
| `Waiting on us` | two sections, see below | pending approvals + payees waiting |
| `With the creator` | `status === 'live'` | count |
| `Signed` | completed | count |
| `Cancelled` | retracted / rejected / expired | — |

`Waiting on us` sections:
- `Links to approve` — "A talent manager made these. They do not work until somebody approves
  them, so a link sitting here is a creator not being signed."
- `Payees to confirm` — "These creators are signed and their bank details are in. Somebody has
  to check the holder name and last four digits with them directly before anything pays out."

`Signed` intro: `These creators signed the agreement and gave us their details.`
`Cancelled` intro: `Retracted, rejected or expired. Nothing was signed through any of these.`

## Table

Columns: `Creator` · `Campaign` · `Deliverables` · `Fee` · `Owner` · `Where it is` · `Made` ·
`—` (actions). Empty body: `Nothing here.` No sorting or pagination.

`Where it is` values (`progressOf`): `Reported, killed`, `Retracted`, `Rejected`,
`Needs approval`, `Signed, payee to confirm`, `Complete`, `Signed, finishing`, `Started`,
`Opened`, `Sent, not opened`.

Row actions:

| Control | Label / title | Gate |
|---|---|---|
| Icon button | title `Copy the link` | `status === 'live'` |
| Button | `Approve` | `status === 'pending_approval'` **and** `can('proposals')` |
| Icon button | title `Retract` | status live or pending_approval |
| Icon button | title `Open` | always → `/work/enrolments/{id}` |

Approve toast: `Live. {owner} has been emailed the link.`

## AlertDialog `Retract this link?`

Body: "{handle} will see a dead link if they open it again. Anything they already signed is
kept and marked terminated… The talent owner and leadership are emailed."
Field: free text `Why, in a few words (goes to the team, not the creator)`.
Buttons `Keep it` / `Retract`.

---

# 14. `/work/enrolments/{id}` — enrolment record

- **Route:** `/work/enrolments/{id}`
- **File:** `src/app/work/enrolments/[id]/page.tsx`
- **Gate:** none in the route table; the payee-confirm and PDF endpoints enforce server-side
- **Title:** the creator handle; sub line `{campaign} for {brand} · {deliverables} · AED {fee}`,
  plus a status badge

## Actions

| Control | Label | Gate |
|---|---|---|
| Back button | `All enrolments` | — |
| Outline | `Copy link` | `status === 'live'` |
| Outline | **`Agreement`** | PDF download; shown once `signed_at` exists |
| Outline | **`Record pack`** | PDF download; shown once `signed_at` exists |

## Payee confirmation block

Rendered when `bank_status === 'pending'` and a `bank_last4` exists.
Heading `Confirm the payee before anything pays out`, with the instruction to call the creator
and type back what they say rather than copying it off the screen.

| field | label | placeholder |
|---|---|---|
| holder | `Holder name, as they said it` | `Full name on the account` |
| last4 | `Last 4 of the IBAN` | `0000` |

Button `Confirm payee` (disabled until holder ≥2 chars and exactly 4 digits).
Success toast `Payee confirmed. Payouts can be raised.`

## Cards

| card | fields |
|---|---|
| `Who they are` | `Full name`, `Instagram`, `Email`, `Email confirmed`, `Mobile`, `Date of birth` |
| `What they signed` | `Signed`, `Signed by`, `Drawn signature` (`Yes, on the PDF` / `Typed name only`), `Agreement version`, `IP address`, `Document hash` |
| `Where money lands` | `Holder`, `IBAN` (`ending {last4}`), `Country`, `SWIFT`, `Status` (`Confirmed by a person` / `Awaiting confirmation`), `Confirmed`; footnote "The full IBAN is never shown on a screen and is not returned to the browser at all." |
| `Where product goes` | `Address`, `City`, `Country`, `Phone` |
| `What happened, in order` | ordered event list (kind, actor, timestamp); empty `Nothing yet.` |

---

# 15. `/work/enrolments/payments` — Payments

- **Route:** `/work/enrolments/payments`
- **File:** `src/app/work/enrolments/payments/page.tsx`
- **Gate:** server-side leadership only; a refusal renders the returned message in place of the
  screen
- **Title:** `Payments`
- **Sub:** `Everyone who has signed an agreement, and whether their money has gone out. Only creators who have signed appear here.`

## Header

| Control | Label |
|---|---|
| Figure | `Still owed` |
| Figure | `Paid out` |
| Outline button | **`Payout file`** — XLSX via `enrolmentApi.payoutXlsx()`; the only place the full IBAN appears, and pulling it is logged against every creator in it |
| Tabs | `Owed ({n})` / `Paid ({n})` |
| Search | placeholder `Creator or campaign` |

## Per-creator card

Header: creator name (link to `/work/enrolments/{link_id}`), `@handle`, external-link icon,
then `{campaign} · {brand} · signed {date}` and a badge
`Payee confirmed · ends {last4}` or `Payee not confirmed yet`.

Figures: `Fee`, and `Outstanding` or `Overpaid by`.

Instalment rows: `{pct}% {label}` or `Instalment {seq}`, then either
`AED {n} sent {date} · ref {reference} · marked by {who}` or
`AED {n} due · adjusted from AED {m}`.

| Control | Label | State |
|---|---|---|
| Outline | `Approve` | unapproved instalment |
| Primary | `Mark paid` | approved instalment; **disabled until the payee is confirmed**, title `Confirm the bank details with the creator first.` |
| Ghost | `Undo` | paid instalment; toast `Put back to owed. The creator was already told, so tell them yourself too.` |

Empty: `Nobody is waiting on money.` / `Nothing has been paid yet.`

## Dialog `Mark this payment sent`

Description: `{pct}% {label} for {creator}, to the account ending {last4}.`
Shows `Amount` with the note that the amount is the booking in the payment book and must be
changed there first. Field `Transfer reference (optional)` placeholder `e.g. FT26090612345`.
Warning that this emails the creator and can be undone but they will already have read it.
Buttons `Cancel` / `Mark paid`.

---

# 16. `/work/payables` — Creator payments

- **Route:** `/work/payables` (`/superadmin/payables` redirects here)
- **File:** `src/app/work/payables/page.tsx`
- **Gate:** module `influencers`; the Money-hub tab additionally requires `canSeeCost`.
  `canPay = isSuperAdmin || isFullAccessStaff`
- **Header:** `MoneyHubHeader` with title `Creator payments`,
  sub `Recording a payment is not paying it. A founder marks it paid.`
- **Data:** `GET/POST /api/v1/admin/payables`, `POST /api/v1/admin/payables/{id}/status`

## Header actions

| Control | Label | Notes |
|---|---|---|
| Outline | **`Export`** | client-side CSV `creator-payments-YYYY-MM-DD.csv`; disabled when the list is empty. Columns: `Title`, `Creator`, `For`, `Campaign`, `Agreed AED`, `Rate we hold AED`, `Status`, `Due`, `Paid` |
| Primary | `Record a payment` | opens the dialog |

## Stats (each acts as the status filter)

| label | hint (when not the active filter) | filter |
|---|---|---|
| `Owed` | `Recorded, not yet approved` | `owed` |
| `Approved` | `Cleared, not yet sent` | `approved` |
| `Paid` | `Out of the account` | `paid` |

Caption beneath: `Showing everything` / `what is owed` / `what is approved` /
`what has been paid`, plus `· {n} past its due date`, plus a `Show everything` ghost button
when a filter is active.

## Table

Columns: `Payment` · `Creator` · `Agreed` · `Due` · `Status` · *(actions)*.
Sorted client-side: owed, then approved, then the rest; within a status by due date.
No pagination, no search.

- `Payment` = title, then `{what_for} · {campaign}` where the campaign is a button to
  `/work/campaigns/{id}/timeline`.
- `Creator` = `@handle` button to `/creator-analytics/{handle}`.
- `Agreed` = amount, plus a chip `+{n} vs our rate` / `{n} vs our rate` when the agreed amount
  differs from the catalogue cost (title `We hold AED {n} for this creator`).
- `Due` = `{n}d late`, `Due today`, `Due tomorrow`, the date, or `Paid {date}`.
- `Status` = badge `owed` / `approved` / `paid` / `cancelled`.

Row actions:

| Control | Label | Gate |
|---|---|---|
| Outline | `Approve` | `status === 'owed'` — any viewer with the module |
| Primary | `Mark paid` | `status === 'approved'` **and** `canPay` |
| Text | `With a founder` | `status === 'approved'` and not `canPay` |

Empty: `Nothing here yet.` Failure: `Could not load creator payments.` + `Try again`, with the
warning that this is not an empty book.

## Dialog `Record a payment`

Description: `What we agreed for this piece of work. It can differ from the rate we hold.`

| field | label | placeholder |
|---|---|---|
| title | `Title` | `e.g. Boom Challenge, reel fee` |
| creator_username | `Creator` | `@handle` |
| agreed_amount_aed | `Amount agreed (AED)` | number |
| what_for | `What for` | `1 reel + 3 stories` |
| due_date | `Due` | date |
| notes | `Notes` | `Anything worth remembering. Not bank details` |

Buttons `Cancel` / `Record it`. Validation: `Give the payment a title`, `Enter the amount agreed`.

---

# 17. `/work/creators` and `/work/money` — hub routers

Neither is a screen; both hand the viewer to the first destination their role can open.

| Route | File | Behaviour |
|---|---|---|
| `/work/creators` | `src/app/work/creators/page.tsx` | Redirects to `/work/influencers` when `can('influencers')`, otherwise `/work/fa/members`. Renders a skeleton while deciding |
| `/work/money` | `src/app/work/money/page.tsx` | Redirects to the first `useMoneyTabs()` entry. When the viewer may open none, renders `PageHead` title `Money`, sub `What comes in, and what goes out.` and the sentence "Nothing here for your role. Revenue is for the people who handle billing, and what we pay creators is kept to leadership and talent." |
| `/work` | `src/app/work/page.tsx` | `redirect('/work/today')` |

---

# 18. `/work/influencers` — Influencer Database

- **Route:** `/work/influencers` (file lives at `/superadmin/influencers`)
- **Files:** `src/app/superadmin/influencers/page.tsx` →
  `src/components/superadmin/influencer-database/InfluencerDatabasePage.tsx`
  (+ `DatabaseHeader`, `DatabaseToolbar`, `FilterBar`, `BulkActionsBar`, `InfluencerTableView`,
  `InfluencerCardView`, `InfluencerDetailSheet`, `ColumnVisibilityToggle`)
- **Gate:** module `influencers`
- **Header:** `CreatorsHubHeader` (full, with the `Add or import creators` button)

## Header row — `DatabaseHeader`

| Element | Label | Gate |
|---|---|---|
| Count line | `{n} creators we hold rates for.` / `Counting the creators we hold.` | — |
| Outline button | `Re-analyse {n}` | enabled only when `isSuperAdmin` **and** rows are selected. Tooltip when disabled: `Only a superadmin can start analytics for a creator` or `Tick the creators you want re-analysed`; otherwise `Re-run analytics for {n} selected creator(s)` |
| Outline button | `Import a spreadsheet` | opens `ExcelImportDialog` |
| Primary button | `Add a creator` (`data-tour="add-creators"`) | → `/work/influencers/add` |

## Live analytics strip

Shown while jobs are running: heading `Analysing {n} creator(s)`, then per job
`@{username}`, the progress message and percentage, plus:

| Control | Label | Gate |
|---|---|---|
| Text button | `Start again` | `isSuperAdmin` (tooltip otherwise `Only a superadmin can start analytics for a creator`) |
| Text button | `Stop` | — |

## Toolbar — `DatabaseToolbar`

| Control | Label / options |
|---|---|
| Search | placeholder `Search creators` (300 ms debounce, URL-synced) |
| Sort select | aria `Sort creators`; `Newest added`, `Oldest added`, `Recently updated`, `Least recently updated`, `Most followers`, `Fewest followers`, `Highest engagement`, `Username A–Z` |
| View toggle | table icon / card-grid icon |
| Column toggle | `ColumnVisibilityToggle` over `COLUMN_DEFINITIONS` |

## Filters — `FilterBar`

| Control | Label | Options |
|---|---|---|
| Multi-select | `Category` | `Fashion`, `Beauty`, `Lifestyle`, `Food`, `Travel`, `Fitness`, `Tech`, `Gaming`, `Business`, `Entertainment`, `Education`, `Automotive`, `Luxury`, `Family`, `Other` |
| Multi-select | `Tier` | `Standard`, `Premium`, `Exclusive` |
| Multi-select | `Country` | from data as `{country} ({n})`; the control is hidden entirely when no creator has a country |
| Multi-select | `Status` | `Active`, `Inactive`, `Blacklisted`, `Pending` |
| Popover | `Engagement` | heading `Engagement Rate (%)`, inputs `Min` and `Max` |
| Toggle button | `Verified` | on/off |
| Toggle button | `Has Pricing` | on/off |
| Ghost button | `Clear` | shown when any filter is active |

URL parameters read and written: `search`, `sort_by`, `sort_order`, `page`, `page_size`,
`categories`, `countries`, `has_pricing`, `pricing` (`costed` / `quotable` / `unquotable` /
`none`), `stale_costs`, `status`.

## Bulk actions bar — appears when rows are selected

Reads `{n} selected`.

| Control | Label | Gate |
|---|---|---|
| Ghost | `Add to proposal` | — |
| Ghost | `Add to list` | — |
| Ghost | **`Export`** | **`canExport`** |
| Ghost | `Tag` | — |
| Ghost | `Set their rates` | — |

## Table — `InfluencerTableView`

Columns from `COLUMN_DEFINITIONS` (toggleable; money columns further filtered by
`useMoneyColumns()` against the viewer's scope):

| key | header | default visible | sortable (sort key) |
|---|---|---|---|
| `select` | *(blank)* | yes | no |
| `profile` | `Profile` | yes | yes (`username`) |
| `followers` | `Followers` | yes | yes (`followers_count`) |
| `engagement` | `Engagement` | yes | yes (`engagement_rate`) |
| `categories` | `Categories` | yes | no |
| `tier` | `Tier` | yes | yes (`tier`) |
| `country` | `Country` | yes | no |
| `ig_reel_cost` | `Reel Cost` | yes | no |
| `ig_reel_sell` | `Reel Sell` | yes | no |
| `ig_post_cost` | `Post Cost` | no | no |
| `ig_post_sell` | `Post Sell` | no | no |
| `ig_story_cost` | `Story Cost` | no | no |
| `video_cost` | `Video Cost` | no | no |
| `video_sell` | `Video Sell` | no | no |
| `margin` | `Margin %` | no | no |
| `status` | `Status` | yes | yes (`status`) |
| `verified` | `Verified` | no | no |
| `added` | `Added` | no | yes (`created_at`) |
| `last_refresh` | `Last Refresh` | no | no |
| `analytics_status` | `Analytics` | yes | no |
| `actions` | `Actions` | yes | no |

Inline editing is available on editable cells (`InlineEditCell`), saving through
`updateInfluencerMetadata` with toast `Updated`.

Pagination: `Showing {a}–{b} of {total}`, `Previous`, `Page {x} of {y}`, `Next`.

Row menu:

| item | behaviour |
|---|---|
| `Open their analytics` | `/creator-analytics/{username}` |
| `Edit their record` | opens the detail sheet |
| `Remove` (destructive) | opens the confirm dialog |

**AlertDialog `Remove @{username}?`** — body: "They come off the database, with the rates and
notes we hold on them. Rosters and proposals they are already on are unaffected."
Buttons `Cancel` / `Remove`.

Failure state instead of the table: `The creator database did not load.` + `Try again`, with
the note that nothing is being shown because nothing is known.

## Detail sheet — `InfluencerDetailSheet`

Tabs: `Overview` · `Analytics` · `Rates` (only when rates are visible to the viewer) ·
`Posts` · `Sharing`.

## Dialogs

**`Export Influencers`** — **`canExport` only** (the bulk button is hidden otherwise).

| group | label | options |
|---|---|---|
| radio | `Format` | `CSV`, `JSON` |
| checkboxes | `Fields to Include` | `Profile Info`, `Analytics`, `Cost Pricing`, `Sell Pricing`, `Margins`, `AI Analysis`, `Internal Notes`, `Tags` |
| radio | `Scope` | `All ({n} influencers)`, `Current Filtered View`, `Selected ({n} influencers)` (disabled with no selection) |

Buttons `Cancel` / `Export` (`Exporting...` while running).

**Bulk pricing dialog** — per-deliverable inputs (placeholder `Leave blank`) grouped by
cost/sell heading; button `Apply to all of them`.

**`Manage Tags for {n} Influencers`** — `Action` (add / remove), `Tags` input
(placeholder `Type a tag...`), `Quick add` suggestions. Toast `Tags added successfully`.

**`Add to list`** — pick an existing list, or create one with `List name`
(placeholder `e.g. KSA food creators`) and a `Back` button. Toasts
`Added {n} to "{list}", {m} already in it`.

**`Add to a proposal`** — searchable proposal picker (`Search proposals…`), then a second
screen for creators previously turned down, with an override reason field
(placeholder `e.g. the brief widened to nano creators after this feedback, so the size
objection no longer applies`).

**Excel import** — `ExcelImportDialog` / `ExcelImportPanel` / `ExcelImportReview` /
`PostImportPricingStep`.

## Deliverable price fields (`DELIVERABLE_TYPES` / money columns)

`IG Post`, `IG Story`, `IG Reel`, `IG Carousel`, `Video`, `Bundle`, `Monthly` — each with a
`cost_*_aed_cents` and `sell_*_aed_cents` column.

---

# 19. `/work/influencers/review` — Creators needing a price

- **Route:** `/work/influencers/review`
- **File:** `src/app/superadmin/influencers/review/page.tsx`
- **Gate:** module `influencers`; the sell lane additionally needs the endpoint scope
  `leadership` (`canSell`)
- **Header:** `CreatorsHubHeader`, then title `Creators needing a price`
- **Sub:** `We cannot quote these creators yet. First someone adds what the creator charges us, then a founder sets our price and adds them to the database. Analytics only start at that point, so nothing here has cost us anything.`

## Controls

| Control | Label | Notes |
|---|---|---|
| View toggle (`data-tour="waiting-view"`) | `Grid` / `One at a time` | card grid vs card stack |
| Primary button | `Add creators` | opens `AddCreatorsDialog` |
| Tabs (`data-tour="waiting-lanes"`) | `Needs a cost ({n})` / `Needs a sell price ({n})` | — |

Lane caption: `Nobody has recorded what these creators charge us. Ring them, then put the rate
in here.` / `The cost is in. Set what we charge the client and add them to the database.`

Card-stack extras: `Back`, `{n} of {m}`, `Skip for now`,
`Bring back the {n} you skipped`, and the hint
`Arrow keys move through the stack, Enter opens the pricing box.`
Keys: `←` back, `→` next, `Enter` act.

## Per-creator actions

| Control | Label | Lane |
|---|---|---|
| Primary | `Add their cost` | `needs_cost` |
| Primary | `Set sell price & approve` | `needs_sell` — a non-leadership viewer instead gets the toast `A founder sets the sell price. Your part is done` |
| Outline | *(×) reject* | both |

Card content: avatar, `@username`, follower count, engagement, origin badge
(`added by {x}` / `from an import` / `older record`), category and country badges, either
`No cost recorded` or `They charge us` with per-deliverable rates
(`reel`, `post`, `story`, `carousel`), who captured the cost and when,
`Found for {brand}` plus the brief line, and the quoted note.

Empty: `Nothing waiting here` / `Every creator here has a cost recorded.` /
`Every creator with a cost has been priced and added to the database.`

## Dialogs

**`What does @{username} charge us?`** — description: "The rate they quoted you, in AED. Fill in
what you have. You can add the rest later. This does not add them to the database, a founder
sets our price next." Fields: one number input per deliverable (`reel`, `post`, `story`,
`carousel`, placeholder `—`), plus `Anything worth knowing (optional)`
(placeholder `e.g. rate holds until end of month, wants product too`).
Buttons `Cancel` / `Save cost`. Validation `Enter at least one rate`.

**`Price @{username}`** — description: "What we charge a client. Approving adds this creator to
the master database, and from that moment they can go on a proposal." Per deliverable: the
label, `costs AED {n}`, an input placeholder `our price`, and a live margin `%`. Shows
`Talent noted: "{note}"`. Buttons `Cancel` / `Approve`. Validation `Set at least one sell price`.

**`Turn down @{username}?`** — description: "They stay in the database with every rate already
researched. Nothing is lost, and they can be approved later for a different brand."
Field `Reason (optional)` (placeholder `e.g. audience mostly outside the GCC`).
Buttons `Cancel` / `Turn down`.

**`Add creators`** — as described under `/work/areas/{id}`.

No table, no export, no pagination.

---

# 20. `/work/influencers/analyzed` — Analyzed Creators

- **Route:** `/work/influencers/analyzed`
- **File:** `src/app/superadmin/influencers/analyzed/page.tsx`
- **Gate:** module `influencers`
- **Title:** `Analyzed Creators`
- **Sub:** `Instagram creators run through Creator Analytics. Separate from the curated Master Database.`
- **Data:** `GET /api/v1/admin/influencers/analyzed?page&page_size&search`

| element | detail |
|---|---|
| Stats | `Analyzed creators` (hint `Run through Creator Analytics`), `Verified on this page`, `Showing` (hint `of {total}`) |
| Search | placeholder `Search by username or name…`, 350 ms debounce |
| Grid | card per creator → `/creator-analytics/{username}`; avatar, `@username`, verified tick, full name, content-type badge, followers, engagement |
| Pagination | `Load more` (page size 24), label `Loading…` while running |
| Empty | `No analyzed creator matches "{q}".` / `No creator has been run through Creator Analytics yet.` |
| Failure | `Could not load the analyzed creators` + `Try again`; stats read `—` |

No export, no filters beyond search.

---

# 21. `/work/influencers/add` — Add to the master database

- **Route:** `/work/influencers/add`
- **File:** `src/app/superadmin/influencers/add/page.tsx`
- **Gate:** module `influencers`
- **Title:** `Add to the master database`
- **Sub:** `Add one creator at a time, paste a list of handles, or import a spreadsheet.`
- Back link `Master database` → `/superadmin/influencers`

| tab | label | body |
|---|---|---|
| `single` | `One creator` | `AddInfluencerForm` |
| `bulk` | `Paste a list` | `BulkImportForm` |
| `excel` | `Import a spreadsheet` | `ExcelImportPanel` |

Bulk imports offer skip-vs-update on existing rows and default to skip.

---

# 22. `/work/proposals` — Proposals

- **Route:** `/work/proposals`
- **File:** `src/app/superadmin/proposals/page.tsx`
- **Gate:** module `proposals`. `showMargin` is set from the endpoint scope
  (`scope === 'leadership'`); `isSuperAdmin` unlocks one extra menu item
- **Header:** `ClientsHubHeader`, note
  `Every quote we have written for a brand: what is still a draft, what is out with them, and what came back approved.`

## Actions

| Control | Label |
|---|---|
| Primary button | `Create a proposal` → `/superadmin/proposals/create` |

## Stats

| card | value | subtitle | gate |
|---|---|---|---|
| `Total` | total proposals | `proposals` | — |
| `Active` | active proposals | `waiting on the client` | — |
| `Approved` | approved proposals | `{n}% rate` | — |
| `Margin` | `AED {n}` | `avg {n}%` | **leadership scope only** |

## Filters

Status select: `All statuses`, `Draft`, `Building`, `Internal review`, `Changes requested`,
`Internally approved`, `Sent`, `In review`, `More requested`, `Approved`, `Rejected`.
No text search, no pagination.

## Table

| column | notes |
|---|---|
| `Title` | link to the proposal; campaign name beneath |
| `Brand` | user email |
| `Status` | `ProposalStatusBadge` |
| `Creators` | `{selected}/{total}` |
| `Sell` | `AED {n}` |
| `Margin` | **shown only when `showMargin`** |
| `Deadline` | formatted date |
| `Actions` | row menu |

Empty: `No proposals found` / `Create a proposal to get started` with a
`Create a proposal` button.

## Row menu

| item | gate |
|---|---|
| `View details` → `/superadmin/proposals/{id}` | — |
| `Approval steps` → `/superadmin/proposals/{id}/approval` | — |
| `Send to client` | status `internally_approved` or `more_requested` |
| `Send directly to client` | **`isSuperAdmin`** and status in draft / building / internal_changes_requested / pending_internal_review |
| `Send proposal email` | opens `ProposalEmailDialog` |
| `Delete proposal` | native confirm: `Delete proposal "{title}"? This removes its creators, approvals and share links. Any campaign created from it is kept (just unlinked). This cannot be undone.` |

No export on this screen.

---

# 23. `/work/proposals/create` — Create / Edit / Add More

- **Route:** `/work/proposals/create`, with modes `?edit={id}` and `?addMore={id}`
- **File:** `src/app/superadmin/proposals/create/page.tsx`
  (+ `builder/ProposalDetailsCard.tsx`, `builder/CreatorSourcePicker.tsx`,
  `builder/RosterPanel.tsx`, `builder/types.ts`)
- **Gate:** module `proposals`. The builder handles **sell prices only** — no `cost_*` field is
  ever read or rendered here

| mode | title | description |
|---|---|---|
| create | `Create Proposal` | `Build a new campaign proposal for a brand` |
| edit | `Edit Proposal` | `Update proposal details and influencers` |
| add more | `Add More Influencers` | `Add more influencers to fulfill the brand's request` |

Back button `Back` → the proposal, or the list.

## Card `Proposal Details` / `Core information about the proposal`

| field | label | notes |
|---|---|---|
| campaign type | `Campaign Type *` | four tiles with hint text; locked in edit mode. Non-`influencer` types add the note that creators must already be FA-app members and to use the `FA Members` tab |
| brand user | `Brand User *` | select, placeholder `Select brand user...` / `Loading users...` |
| title | `Title *` | placeholder `Q2 Campaign Proposal` |
| campaign name | `Campaign Name *` | placeholder `Summer 2026 Launch` |
| budget | `Total Budget (AED)` | placeholder `e.g. 50000` |
| payment | `PaymentStructure` | `How this is paid for`, `Starts`, `Every month, we charge` (placeholder `12000`), `For how many months`, `Committed for`, `Creators a month`, milestone rows with `e.g. Advance` / `e.g. Month start` and a `days` field, add/remove buttons, `committed` badge |
| description | `Description` | placeholder `Brief description of the campaign...` |
| notes | `Admin Notes for Brand` | placeholder `Notes visible to the brand...` |
| deadline | `Deadline` | date picker, placeholder `Select deadline` |
| cover | `Cover Image` | `Upload` / `Uploading...` / `Stock photos`; when set: `Upload New`, `Stock`, remove. Stock picker heading `Choose a stock image`. Cropper dialog `Crop Cover Image`, hint `Drag to select the banner area. The image will be cropped to a 16:5 wide banner.` |
| visibility | `Visibility Settings` | checkboxes derived from the keys `show_sell_pricing`, `show_analytics`, `show_engagement`, `show_audience`, `show_content_analysis`, each rendered with `show_` stripped |

## Section `Add Influencers (optional)` / `Select Additional Influencers`

Sub in create mode: "Optional - you can leave this empty and assign a talent manager to add
creators in the approval workflow. Add here only if you want to pre-fill the list."
Sub in add-more mode: `Search master DB, pick FA members, or add by Instagram handle`.

`CreatorSourcePicker` tabs and controls:

| tab | controls |
|---|---|
| Master DB | search `Search username or name...`, `Category` select, `Tier` select, results grid, add-selected button |
| FA Members | search `Search FA members by name or @username...`, search button, per-row add |
| By handle | input `Enter Instagram handle (e.g. @huda)` + add button. Unknown handles are created in the master database as `status: active` |

`RosterPanel`: per-creator deliverable chips (`Post`, `Story`, `Reel`, `Carousel`, `Video`,
`Bundle`, `Monthly`) with quantity steppers, an apply-to-all control per deliverable type
(toast `{Label} added to {n} creator(s)` / `{Label} removed from {n} creator(s)`), reorder
up/down, remove, and open-analytics.

## Footer

Reads `{n} creator(s) in the roster`.

| mode | buttons |
|---|---|
| create | `Save as Draft`, and a second button that creates and opens the approval workflow |
| edit | `Save Changes` / `Saving...` |
| add more | `Add {n} Influencer(s)` / `Adding...` |

Validation toasts: `Select a brand user`, `Title is required`, `Campaign name is required`,
`Add at least one influencer`.

No table, no export.

---

# 24. `/work/proposals/{id}` — proposal detail

- **Route:** `/work/proposals/{id}`
- **File:** `src/app/superadmin/proposals/[id]/page.tsx`
- **Gate:** module `proposals`. `showSell` / `showCost` come from the endpoint's field policy —
  cost and margin columns are absent for anyone outside leadership
- **Title:** the proposal title; sub lines `Campaign: {name}` and `Brand: {email}`

## Header actions

| Control | Label | Gate |
|---|---|---|
| Ghost | `Back` | — |
| Badge | `ProposalStatusBadge` | — |
| Primary | `Approval workflow` | — |
| Outline | `Edit` | `canEdit` → `/superadmin/proposals/create?edit={id}` |
| Outline | `Send to client` / `Sending...` | `canSend` |

## Cards, in order

| card | title / description | contents |
|---|---|---|
| Header card | — | optional cover image, title, campaign, brand, description |
| `Status Timeline` | — | status history |
| `Financial Summary` | — | totals |
| `ConfirmationPanel` | `Confirm for the client` — "They said yes by email or on a call? Lock their selection and the campaign opens…" | button → `/superadmin/proposals/{id}/confirm`. Once locked it becomes `Confirmed` with `Agreed total` and `Costs settled` figures |
| `SettleAndOpen` | `The client has confirmed` — `{n} creator(s) are booked. No campaign is open…` | per-creator table `Creator` / `We charge` / `We pay` (input, placeholder `not agreed`) / `Margin`, a `Campaign margin` figure, a save button and an open-campaign button (disabled until `can_open_campaign`) |
| `ReopenProposal` | `Confirmed in part` — `{n} creator(s) are confirmed` | `Their budget` figure and a button opening dialog **`Re-open this proposal`** with `What are you sending back to them? (optional)` (placeholder `e.g. Here are the rest of the shortlist plus four new names in your budget.`), `Cancel` / submit |
| `AddOnUptake` | `{modifier label}` + a price badge | per-creator `Confirmed` badges and a confirm/remove dialog with `Why? (optional, kept on the record)` (placeholder `e.g. agreed with Sara on the call, 26 Aug`) |
| `SellingMode` | `How the client picks` | budget mode vs tier mode; when tiers: `How many of each, per month` inputs, per-creator `Count as {tier}` / `By followers` select, `picked` badges |
| `Influencers` | `{n} influencer(s) in this proposal` + `· {n} confirmed and cannot be removed` | the table below |
| `Brand Response` | `Feedback and notes from the brand` | `Brand Notes`, `Request More Notes`, or `No brand feedback yet.`; when status is `more_requested`, button `Add More Influencers` → `/superadmin/proposals/create?addMore={id}` |

## Influencers table

| column | gate |
|---|---|
| *(select checkbox)* | — |
| `Influencer` | — |
| `Followers` | — |
| `Engagement` | — |
| `Tier` | — |
| `Sell Price` | `showSell` |
| `Cost Price` | **`showCost`** |
| `Margin` | **`showCost`** |
| `Selected` | badge, or `Not Selected` |
| `Admin Notes` | — |
| *(row menu)* | — |

Header button `Remove {n}` (destructive) appears only when rows are ticked.

Row menu items: `Recommend to client` (or, when already recommended, an edit entry plus
`Remove the recommendation`) and a destructive remove.

**Dialog `Recommend @{username} to this client`** — field
`Why, in one line (optional)` (placeholder `Their audience is your exact shopper`).
Buttons `Cancel` / save. Toast `@{username} is now recommended to the client`.

**Bulk remove dialog** — lists the ticked creators; buttons `Cancel` / `Remove {n}`.

No export on this screen.

---

# 25. `/work/proposals/{id}/approval` — approval workspace

- **Route:** `/work/proposals/{id}/approval`
- **File:** `src/app/superadmin/proposals/[id]/approval/page.tsx`
- **Gate:** module `proposals`; almost every control is additionally gated on
  `viewer.is_operator`. Budget figures are gated on `budgetVisible`
- **Title:** the campaign name or proposal title, with a status badge, the current approval
  step, and an internal-round marker

Back: an icon button to `/superadmin/proposals`.

## Left column

**`SellingMode`** (operators) — see §24.

**Off-standard banner** — `Off standard rates`, `{n} of {m} creators`,
`averaging {n}% below the standard price`.

**Card `Influencers`** / `{n} added` (+ `· per-influencer pricing only` when budget is hidden).

Operator controls in the card header:

| Control | Label | Confirm text |
|---|---|---|
| Destructive | `Remove {n}` | `Remove {n} creator(s) from the proposal?` followed by the handles |
| Input + button | discount % (placeholder `10`) then `Apply to {n}` / `Apply to all` | `Take {n}% off the {n} creator(s) you ticked` or `ALL {n} creators on this proposal?` plus `Cost prices and the master database are untouched.` |
| Ghost | `Standard rates` | `Put every creator back to their standard rate?` |
| Outline | `Add creators` | opens `TmAddCreatorsDialog` |

Table columns: *(select)* · `Creator` · `Followers` · `Rate (AED)` · `Internal`
(**operators only**) · `Review` (**operators only**).
`Internal` badges: `Approved`, `Flagged` (title = flag note), `Pending`.
`Review` icon buttons with titles `Approve`, `Flag`, `Remove from proposal`
(confirm `Remove @{username} from the proposal?`).

**Card `Add creator (talent manager)`** / `Adds to the master database and attaches to this
proposal.` — button `Add creators from database`, the note that a creator missing from the
database must be added with cost prices from the Influencer Database and that a superadmin sets
sell pricing before they become selectable, then `Submit for internal approval` (disabled with
an empty roster).

## Right column (all `viewer.is_operator`)

| card | title / description | controls |
|---|---|---|
| `Operator` | — | label `Send for influencer adding → talent manager`, select `Pick talent manager`, button `Assign`. Shown for status draft / building / internal_changes_requested |
| `Approve internally` | `Skip the maker → approver chain and mark it internally approved now. You can approve with no creators yet and share commercial-first (agreement + advance invoice); curate creators later.` | button `Mark internally approved`. Shown for draft / building / pending_internal_review / internal_changes_requested |
| Park card | `Park this proposal` or `Client sees "we're still working on this"` | when parked: shows `They see: "{note}"` and button `Lift, let the client see it again`. When not: `Message to the client (optional)` (placeholder `e.g. Adding a few more creators, back to you Tuesday`) and button `Park it`. Shown for status sent / in_review / more_requested |
| `Client share link` | `Internally approved. Share with the client - they see samples + a sign/pay gate.` or, at `sent`, `Commercials cleared. The link no longer shows creators…` | Two tiles. `Sales link` — "5 creators shown, the rest locked until the agreement is signed and the advance is paid. Needs paperwork attached first." button `Generate sales link` / `Regenerate`. `Quotation link` — "Full roster and pricing straight away, no paperwork needed. The prospect picks deliverables and confirms. Expires in 30 days." button `Generate quote link` / `Regenerate`. Generated URL block tagged `Quotation` / `Sales` with `Copied to clipboard.` Destructive ghost `Revoke all links for this proposal` |
| `Approval chain` | `Maker (talent manager) → these approvers → client send.` | per-step role select (`Role` placeholder, options from `APPROVER_ROLES`), move up, move down, delete; `Step` adds a `cofounder` step; a save button; the rendered chain marks the active step with a `current` badge |
| `Approver - step {n}` | — | `Approval note (optional)` textarea + approve button; `Send-back reason (required)` textarea + send-back button (disabled while empty) |
| `History` | — | audit list |
| `Client commercial - agreement & invoice` | "Upload + send the agreement and create the advance invoice here. The client signs & pays on the share link; the full influencer list unlocks only once the agreement is **signed** and the advance invoice is **paid**." | `ClientCommercialTab` plus `GateOverrideCard` — title `Paperwork requirement`, reason field (placeholder `e.g. Onboarded in March, PO raised, legal signing next week`) and a save button. Shown for internally_approved / sent when a `team_id` exists |

Error banner renders any failed action message inline. No export.

---

# 26. `/work/proposals/{id}/confirm` — Confirm for the client

- **Route:** `/work/proposals/{id}/confirm`
- **File:** `src/app/superadmin/proposals/[id]/confirm/page.tsx`
- **Gate:** module `proposals` **plus** endpoint scope `leadership`. Any other scope gets the
  screen replaced entirely by the title `Confirm for the client` and the sentence
  "Confirming a deal settles what we pay each creator, so it sits with the founders. Ask them
  to lock this one." — because every row here is a cost and a margin
- **Title:** `Confirm for the client`; sub `{campaign or title} · {client email}. Locking this
  opens the campaign exactly as their own confirmation would.`

Back link `Back to the proposal`.

## Left column — `Who they confirmed`

Sub: `{n} of {m} selected · {n} costs entered`.
Buttons `Select all` and `Clear`.
Per creator: a tick, the creator, and a confirmed-cost input whose placeholder is the quoted
cost.

## Right column (sticky)

| control | label | notes |
|---|---|---|
| Tiles | `How did they confirm?` | one tile per channel in `VIA` |
| Textarea | `What did they say?` | placeholder `"Approved, go ahead with all four for September."`; helper `Pasting the line from their email is what makes this answerable months later.` |
| Tier block | `Their retainer` | `{picked}/{allowed}` with a badge per tier `{label} {picked}/{allowed}` — only in tier mode |
| Checkbox | `They already have the brief` | sub "Books them straight in as briefed, so the board starts where the work really is instead of at the beginning." Reveals `Content due back (optional)` date input |
| Checkbox | `We send product to these creators` | sub "Turns on packed → sent → received, per creator. The client watches the same thing on their campaign page." |
| Totals | `They pay` / `We pay` / `Margin` (+ %) | negative margin shows `This selection costs more than it earns.` |
| Primary | `Lock it in` | disabled with no selection; footnote `Opens the campaign and books {n} creator(s).` |

Validation toasts: `Choose the creators they confirmed`;
`That is not a full selection: {picked} of {allowed} places filled`.

No table, no export.

---

# 27. `/work/campaigns` — Campaigns

- **Route:** `/work/campaigns`
- **File:** `src/app/superadmin/campaigns/page.tsx`
- **Gate:** module `campaigns`
- **Header:** `CampaignsHubHeader` (with the `Where the work is` pipeline strip)

## Actions and filters

| Control | Label / options |
|---|---|
| Primary button | `New campaign` → `/superadmin/campaigns/create` |
| Search | placeholder `Search by campaign or client` |
| Status select | `Any status`, `Active`, `Completed`, `Paused`, `Draft` |
| Type select | `Any type`, `Influencer`, `UGC`, `Cashback`, `Paid Deal`, `Barter` |
| Retry | `Try again` on failure |

## Stats

`Live now` · `Ending this week` · `Campaigns here`.

## Panel `Campaigns` / `Open one for its timeline`

Rows carry a type badge and a status badge, plus two actions:

| Control | Label | Destination |
|---|---|---|
| Outline | `Delivery board` | `/work/campaigns/{id}/ladder` |
| Ghost | `Posts`, or `Videos` for a UGC campaign | `/campaigns/{id}/posts` or `/ugc` |

Row click → `/work/campaigns/{id}/timeline`.

Failure state: `Could not load the campaign list.` + `Try again`, with the note that nothing
here is known. No pagination, no export.

---

# 28. `/work/campaigns/create` — Create a campaign

- **Route:** `/work/campaigns/create`
- **File:** `src/app/superadmin/campaigns/create/page.tsx`
- **Gate:** module `campaigns`
- **Title:** `Create a campaign`
- **Sub:** `Runs without the client approving a creator list.`

| panel | description | fields |
|---|---|---|
| `Client` | `Which brand this campaign is for` | select, placeholder `Choose a client...` |
| `Campaign type` | `What kind of work this is` | `Influencer` / `UGC` |
| `Details` | `Name, dates and budget` | `Campaign name` (placeholder `e.g., Ramadan 2026 Campaign`), `Client name` (placeholder `Auto-filled from client`), `Description` (placeholder `Campaign description...`), `Budget` (placeholder `Optional`), start date, end date, `Logo` (max 2MB) |
| `Instagram posts` | — | button `Add a post` opening a dialog titled `Add a post` with `Instagram link` (placeholder `https://www.instagram.com/p/...`) and button `Add it`; the queued list has a remove icon per row |

Footer: `Cancel` → `/superadmin/campaigns`, and the create button.

Validation toasts: `Campaign name is required`, `Select a client`, `Brand name is required`,
`End date must be after start date`, `That is not an Instagram post link`, `Already on the list`.
Success `Campaign created`; partial failures raise `Campaign created but logo upload failed`
and `Failed to queue post: {url}`.

---

# 29. `/work/campaigns/{id}` — root redirect

- **File:** `src/app/superadmin/campaigns/[campaignId]/page.tsx`
- Redirects to `/work/campaigns/{id}/timeline`. Renders nothing.

---

# 30. `/work/campaigns/{id}/timeline`

- **Route:** `/work/campaigns/{id}/timeline`
- **File:** `src/app/superadmin/campaigns/[campaignId]/timeline/page.tsx`
- **Gate:** module `campaigns`. The `Payments` panel is behind `showMoney`
- **Title:** the campaign name, preceded by badges for the client (linking to the client
  record), the status and the campaign type

Header action: `Delivery board` → `/work/campaigns/{id}/ladder`.

## Stats

`Creators confirmed` · `Content delivered` · `Posts tracked`.

## Panels

**`What has happened`** — the campaign event trail.

**`Sourcing`** / `How this roster was found` — rounds with `Round {n}` and `Open` / `Closed`
badges.

**`Products`** — hidden entirely for dine-in campaigns.
- When product shipping is on: description `Every creator has their product.` /
  `{n} sent, {n} received of {n}.` / `{n} packed and waiting on a courier.` /
  `Nothing packed yet.` Three figures `Packed`, `Sent`, `Received` each `{n} / {total}`.
  Buttons `Mark everyone packed` (toast `Everyone marked packed`) and
  `Send them out, one by one` → the ladder. Footnote
  `The client sees this on their own campaign page.`
- When unanswered: the question `Does this campaign send product to the creators?` with
  `If it does, we track it per creator: packed, sent, received.` and buttons `Yes` / `No`
  (toasts `Product tracking on` / `No product on this campaign`).

**`Payments`** — description `No payment plan on this deal. Add the invoices as they go out.` /
`Next: {label} · AED {n}` / `Everything on this plan is paid.`
Header button `Add a payment` (disabled without a linked proposal).
Table columns `Payment`, `Due`, `Amount`, plus per-row `Sent` / `Not sent` badges and actions
to attach an invoice and to mark the payment.

**`Roster`** — description `The {n} the client locked.` with a link
`All {n} we pitched →` to the proposal, or `Everyone on this campaign`.
Header button `Enrol everyone priced` / `Creating…`, shown when someone has a confirmed rate
and no enrolment; toasts the summary and, when applicable, `Waiting on a cost` with the names.
Table columns: `Creator` · `Followers` · `Cost` · `Sell` · `Product` · `Where they are` ·
`Paperwork`. Product badges: `Received`, `On its way`, `Packed`, `Not packed`. A creator with
no cost shows `Set cost first`.

## Dialogs

**`Add a payment`** — fields `What is it for` (placeholder `Second instalment`),
`Amount (AED)` (placeholder `0`), `Due` (date). Buttons `Cancel` / save.

**`Attach the invoice`** — fields `Invoice number` (placeholder `INV-1042`) and
`Link to the file` (placeholder `https://…`). Buttons `Cancel` / save.

Failure state: an error line with `Try again`. No export.

---

# 31. `/work/campaigns/{id}/ladder` — Delivery

- **Route:** `/work/campaigns/{id}/ladder`
- **File:** `src/app/superadmin/campaigns/[campaignId]/ladder/page.tsx`
- **Gate:** module `campaigns`; `canSeeCost` controls every rate on the board and
  `canDestroy` controls rate confirmation, payment and removal
- **Title:** `Delivery`

## Stages (`STAGES` in `src/services/ladderApi.ts`)

| key | label | who |
|---|---|---|
| `enrolled` | `Enrolled` | Talent |
| `rate_agreed` | `Rate agreed` | Founder |
| `contracted` | `Agreement on file` | Talent |
| `briefed` | `Guide sent` | Talent |
| `content_in` | `Content in` | The creator |
| `content_approved` | `Content approved` | Accounts |
| `posted` | `Posted` | Accounts |
| `paid` | `Paid` | Founder |

Plus a `dropped` bucket.

## Board-level actions

Product controls mirroring the timeline: `Mark everyone packed` (toast
`Everyone marked packed and ready to dispatch`), dispatch controls, and the same
`Does this campaign send product to the creators?` question with `Yes` / `No`
(`This campaign sends nothing`).

Rates on a card are rendered only when `canSeeCost`. Without it the card says `Confirmed` or
`Waiting on a founder` instead of a figure.

## Per-creator sheet

Title `@{username}` with the stage badge. Blocks appear by stage:

| block | label | fields / buttons | gate |
|---|---|---|---|
| Rate | `Rate` / `What did you agree with them?` | `Amount in AED`, note textarea `Anything worth remembering: what it covers, who agreed it`, save (toast `Rate confirmed`) | — |
| Confirm rate | — | a confirm button at `enrolled` with an agreed rate | **`canDestroy`** |
| Agreement | `Signed agreement` | file upload (`PDF, Word or a photo of the signed page. Up to 15MB.`) or `Link to the signed file` + save (toast `Agreement on file` / `On file`) | — |
| Brief | `Shooting guide` (`Link to the guide (optional)`) and `Content due back` (date) | save (toast `Guide sent`) | — |
| Content | `Content that arrived` (`Link to the content`) | save (toast `Content in`); a link `Open the content →` | — |
| Approval | — | approve button (toast `Approved to post`) | — |
| Post | `It is live` (`Link to the post`) | save (toast `Marked live`) | — |
| Payment | `Payment` (`Reference (optional)`) | mark-paid button (toast `Marked paid`) | **`canDestroy`** |
| Delivery | `Delivery` (`Courier reference (optional)`) | mark dispatched (`Marked dispatched`) and mark received (`Marked received`) | — |
| Drop | — | reason textarea `Why? It stays on their record` and a remove button (toasts `Taken off the campaign` / `Taken back`) | — |

Empty sheet body: `Nothing recorded yet.` Failure: `Could not load the board.` + `Try again`.
No export.

---

# 32. `/work/clients` — Clients

- **Route:** `/work/clients`
- **File:** `src/app/superadmin/clients/page.tsx`
- **Gate:** module `clients`
- **Header:** `ClientsHubHeader` with `showStats` (the three headline figures)

## Filters and controls

| Control | Label / options |
|---|---|
| Search | placeholder `Search clients` |
| Industry select | `Any industry`, `Food & Beverage`, `Fashion`, `Technology`, `Entertainment`, `Beauty`, `Sports`, `Real Estate`, `Automotive`, `Travel`, `Finance` |
| View ToggleGroup | table icon (aria `As a table`) / grid icon (aria `As cards`) |
| Retry | `Try again` |

## Table

| column |
|---|
| `Client` |
| `Industry` |
| `Live` |
| `Budget` |
| `Unpaid` (destructive badge when > 0) |
| `Quotes out` (secondary badge when > 0) |

Card view repeats the same facts as `Live`, `Campaigns`, `Budget`.
No pagination controls, no export on this screen.

---

# 33. `/work/clients/{teamId}` — client record

- **Route:** `/work/clients/{teamId}`
- **File:** `src/app/superadmin/clients/[teamId]/page.tsx`
- **Gate:** module `clients`
- **Title:** the company name (or the client name)

## Header actions

| Control | Label | Notes |
|---|---|---|
| Back icon | — | → `/work/clients` |
| Logo control | title `Upload / replace logo` | — |
| Outline | `Access` | opens `ClientAccessDialog` |
| Outline + menu | `Email them` | menu items `Send a briefing` (CampaignBriefingDialog) and `Send an update` |
| Retry | `Try again` | on load failure |

## FieldStrip

`Plan` · `Industry` · `Campaigns` · `Account manager` (inline select, `Unassigned` plus the
staff list; saving reassigns the account manager)

## Stats

`Budget` · `Spent` · `Live campaigns` · `Outstanding`

## Tabs

| value | label |
|---|---|
| `scope` | `What we agreed` |
| `work` | `Work` |
| `quotes` | `Quotes` |
| `money` | `Money` |
| `setup` | `Setup` |

### Tab `What we agreed`

Controls: `{n} project(s)` caption, year select (`Every year`, `2026`, `2025`), and
**`Download the scope`** — an XLSX export via `clientApi.downloadScope`.
Beneath, five year-scoped figures (they follow the year filter, and render nothing rather than
a confident zero when the endpoint omits the summary).

Table columns: `Project Name` · `Type` · `Status` · `Budget` · `Payment` · `Creators` ·
`Posts` · `Carry Fwd` · `Report` · `Client Feedback` · *(actions)*.

- `Payment` is an inline select: `Unpaid`, `Partial`, `Paid`.
- `Report` is an inline select: `Not Sent`, `Sent`, `Received`.
- `Carry Fwd` shows a `{n} fwd` badge.
- Actions column holds a **download report** icon button (title `Download report`,
  `clientApi.downloadCampaignReport`).

Status badges elsewhere on the page: `Paid`, `Partial`, `Unpaid`, `Received`, `Sent`,
`Not Sent`.

### Tab `Work`

- Heading `Campaigns`, card per campaign with buttons `Open` → `/campaigns/{id}` and
  `Commercial` (opens the commercial dialog).
- Heading `Barter and events` + a count badge. Table: `Date` · `Event` · `Category` · `Type` ·
  `Status` · `Barter` · `Inventory` · `Allocated`.
- Heading `UGC`, with a card `Concepts` and a table `#` · `Concept` · `Campaign` · `Product` ·
  `Status` · `Feedback`.

### Tab `Quotes`

Heading `Quotes` with an outline button to `/work/proposals/create`.
Table: `Campaign` · `Status` · `Influencers` · `Value` · `Approval` (a per-row ghost button to
`/work/proposals/{id}/approval`). Row click opens the proposal.

### Tab `Money`

Panel `Budget` / `Committed against spent`.
Panel `Payment` / `Where each campaign stands` with rows `Paid`, `Partial`, `Unpaid`.

### Tab `Setup`

Heading `Activity`; empty state `Nothing has happened on this client yet.`

## Dialogs

**`Commercial - {campaign name}`** — the client commercial workspace for one campaign.
**`ClientAccessDialog`** — who can reach this client.
**`CampaignBriefingDialog`** / update dialog — the two `Email them` entries, prefilled with the
owner email and first name.

---

# 34. `/work/users` — User Management

- **Route:** `/work/users`
- **File:** `src/app/superadmin/users/page.tsx`
- **Gate:** module `users`
- **Title:** `User Management`
- **Sub:** `Create, manage, and monitor platform users`

## Controls

| Control | Label / options |
|---|---|
| Outline | refresh |
| Primary | create user → `/superadmin/users/create` |
| Search | placeholder `Search users...` |
| Status select | `All Status`, `Active`, `Suspended`, `Pending`, `Deactivated` |
| Type select | `All Types`, `Regular`, `Admin`, `Superadmin` |
| Plan select | `All Plans`, `Free`, `Premium`, `Enterprise` |
| Outline | **`Export`** — client-side CSV `users-YYYY-MM-DD.csv`; toast `Nothing to export` when the list is empty, else `Exported {n} users` |

## Table `Platform users`

Columns: `User` · `Role` · `Team` · `Status` · `Credits` · `Last Updated` · `Actions`.
No sorting controls, no pagination. Retry button beneath on failure.

Row menu:

| item | gate |
|---|---|
| `View Details` | opens the details dialog |
| `Edit User` | → `/superadmin/users/{id}` |
| `Suspend User` | shown when `role !== 'super_admin'` and the user is active; goes through the AlertDialog below |
| `Activate User` | shown when `role !== 'super_admin'` and the user is not active; immediate |

**AlertDialog** for suspension: cancel action is labelled `Leave them active`.

**Details dialog** — title = the user's full name (or `User details`), description = the email,
badges for status and role, team chips as `{team} · {role}`, and a button linking to
`/superadmin/users/{id}`.

Status and plan changes toast `User status updated to {status}` and `User plan updated to {plan}`.

---

# 35. `/work/users/create`

- **Route:** `/work/users/create`
- **File:** `src/app/superadmin/users/create/page.tsx`
- **Gate:** module `users`
- Back button `Users`

Segmented control in the page head: `Brand` · `Staff` · `Admin`, which sets the title and sub:

| account type | title | sub |
|---|---|---|
| `brand` | `New brand account` | `A client account, with its subscription, its credits and the team the platform needs to attach them to.` |
| `staff` | `New staff member` | `Someone on our own team: talent manager, account manager, business development, cofounder or CEO.` |
| `admin` | `New admin` | `An admin who can only open the modules you tick below. Everything else stays hidden from them.` |

## Panels

| panel | description | fields |
|---|---|---|
| `Required information` | `The details this account cannot be created without.` | Email (`brand@company.com`), Password (`SecurePass123!`), Full name (`John Doe`), Company (`Marketing Agency LLC`), Phone (`+1-555-0123`) |
| `Credits and monthly limits` | `Filled in from the tier you pick. Change them here if this account is an exception.` | credit and limit inputs |
| `Admin modules` | `Tick the areas this admin can open. Everything else stays hidden from them.` | one checkbox per `ADMIN_MODULES` entry — **admin account type only** |
| `Staff role` | `What this person does here. It decides what they can open and what they can approve.` | select: `Talent Manager`, `Account Manager`, `Business Development`, `Cofounder`, `CEO` — **staff account type only** |
| `Subscription tier` | `Picking a plan fills in the credits and limits below.` | select `free` / `standard` / `premium` |
| `Team` | `A team is always created, because the platform needs one for credits and access to work. Name it here.` | team name (placeholder = the company, else `{name}'s Team`) |
| `What you are about to create` | `Check this before you press create.` | summary |

Footer: `Cancel` → `/superadmin/users`, and the create button.

Success view: panel `Account created` with copy buttons for the email (toast `Email copied`)
and the password (toast `Password copied`), plus onward navigation buttons.

---

# 36. `/work/users/{userId}` — Edit User

- **Route:** `/work/users/{userId}`
- **File:** `src/app/superadmin/users/[userId]/page.tsx`
- **Gate:** module `users`
- **Title:** the user's full name (or email); sub = the email; badges for status and role

Header buttons: back to the user list, a refresh button, and a button back to
`/superadmin/users`.

## Panels

| panel | description | fields / buttons |
|---|---|---|
| `Basic information` | `Profile and contact details. The email is their login.` | `Email`, `Full Name`, `Company`, `Job Title`, `Phone Number` + save |
| `Password` | `Sets the password immediately. No email is sent, so you have to pass it to them yourself.` | `New password` (placeholder `At least 8 characters`), show/hide toggle, save (disabled under 8 chars). Toast `Password set. Give it to the client. They are not emailed automatically.` |
| `Account control` | `Role, status and subscription.` | `Role`: `Brand Free`, `Brand Standard`, `Brand Premium`, `Brand Enterprise`, `Admin`, `Super Admin`. `Status`: `Active`, `Suspended`, `Deactivated`, `Pending`. `Subscription Tier`: `free`, `standard`, `premium`, `enterprise`. `Subscription Expires` date. Save button |
| `Credits` | `Add or remove credits, and read the last ten movements on this wallet.` | `Action` (`Add credits` / `Remove credits`), `Amount`, `Reason` (placeholder `Why the balance is changing. This is written to the ledger.`), apply button, and the recent-transactions list |
| `Team` | `Which team this account sits in, and its monthly profile limit.` | read/write team fields |
| `Security and sign-in` | `Verification state and sign-in history. Read-only here.` | `Email Verified`, `Two-Factor Authentication` badges |
| Deletion block | — | heading `Deleting an account`, a paragraph explaining accounts cannot be deleted from here and to suspend from the user list instead, and a permanently **disabled** button `Delete account (not available here)` |

No table, no export.

---

# 37. `/work/staff` — Staff

- **Route:** `/work/staff`
- **File:** `src/app/superadmin/staff/page.tsx`
- **Gate:** module `users`
- **Title:** `Staff`
- **Sub:** `The internal team. Control which modules each member can open, and which clients they can see.`

Rows show the member with a role badge from `ROLE_LABEL`: `Talent Manager`, `Account Manager`,
`Business Development`, `Cofounder`, `CEO`. Each row carries a `Manage` button.
Failure state has a `Try again` button.

**Dialog `Staff access`** (`src/components/superadmin/StaffAccessDialog.tsx`) — sections
`Modules` (checkbox per admin module) and `Client access ({n})` (per-client grants; empty state
`No clients found.`). Buttons `Cancel` and save.

No export.

---

# 38. `/work/approvals` — Approvals (Sign-offs)

- **Route:** `/work/approvals`
- **File:** `src/app/superadmin/approvals/page.tsx`
- **Gate:** module `campaigns`; the sidebar entry is `leadership` only
- **Title:** `Approvals`
- **Sub:** `Decisions we have asked a founder for. Each one goes out as a link they can answer from their phone without logging in, so this is where you see whether they have.`

| Control | Label |
|---|---|
| Outline | `Try again` (on failure, re-loads) |
| Tabs | `Waiting ({n})` / `Answered ({n})` |

Rows carry an action badge from `ACTION_LABEL` plus status badges, inside a `Panel`.
Empty state rendered via `Empty`.

No table columns, no export, no search.

---

# 39. `/work/operations` — Operations

- **Route:** `/work/operations` (also reachable at `/ops`, which maps to the same module)
- **File:** `src/app/superadmin/operations/page.tsx`
- **Gate:** module `operations`
- **Title:** `Operations`
- **Sub:** `Everything in flight, and everything waiting on us. Approve or turn down an item without leaving this screen.`

Header button `Refresh`.

## Panel `Waiting on us`

Header carries a total badge. Tab row, each tab with a count badge — `—` when that queue's
fetch failed, never `0`:

| tab | label |
|---|---|
| `deliverables` | `Deliverables` |
| `receipts` | `Receipts` |
| `withdrawals` | `Withdrawals` |
| `members` | `Member reviews` |

Per row: an approve button and a turn-down button. Receipts show a linked-cashback badge;
withdrawals show the amount.
Queue failure: `Try again`. Queue empty: `Nothing waiting: every one of the {label} has been
dealt with.`

**Dialog `Turn down: {label}`** — free-text `Reason (optional)`;
buttons `Cancel` / `Turn it down`.

## Panel `Campaigns in flight`

Rows carry a type badge and a status badge. Failure: `Try again`.
Empty: `Nothing is running right now.`

No export.

---

# 40. `/work/share` — Share Center

- **Route:** `/work/share`
- **File:** `src/app/superadmin/share/page.tsx`
- **Gate:** module `clients`
- **Title:** `Share Center`
- **Sub:** `Anything a client needs that is not a proposal, an invoice or a campaign. The list leads on whether they have opened it, because sending is the half we already know about.`

## Controls

| Control | Label |
|---|---|
| Primary | `Share something` (opens the composer) |
| Client select | `Every client` plus one entry per team |
| Retry | `Try again` |

## Panel `Shared with clients` / `Who has it, and whether they have opened it`

Rows: kind icon + title, then the client name, a campaign or proposal badge, the date and who
created it. Right-hand badge `Opened by {n}` or `Not opened`. Archived rows are dimmed.
Row action: an icon button titled `Withdraw`, confirmed with
`Withdraw "{title}"? {client} will no longer see it.`

Empty: `Nothing has been shared yet.` / `Nothing shared with this client yet.`

## Composer — `src/components/share/ShareComposer.tsx`

Full-page, heading `Share something`, with `Cancel` and a send button.

Kind tiles:

| kind | label | blurb |
|---|---|---|
| `note` | `A note` | `A message they read on their home page.` |
| `table` | `A table` | `Columns you name. Addresses, phone numbers, sizes.` |
| `file` | `A file` | `Stored privately, opened through a link that expires.` |

| field | label | notes |
|---|---|---|
| title | `Title` | placeholder `e.g. Creator addresses for this week's shipment`; helper `The one line they see before they open it.` |
| table | `The table` | column builder — table kind only |
| file | `File` | dropzone `Drop a file here, or choose one`, `Up to 25MB`, with a remove button — file kind only |
| body | `Message` (note kind) or `Anything to say about it (optional)` | textarea, 14 rows for a note, 4 otherwise |

Delivery lane, headed `Who gets it`:

| field | label | options |
|---|---|---|
| client | `Client` | placeholder `Who is this for?` |
| about | `About (optional)` | placeholder `Not about anything specific` / `Choose a client first`; options `Not about anything specific` plus `{group}: {label}` |

No export.

---

# 41. `/work/report-campaigns` — report campaigns

- **Route:** `/work/report-campaigns`
- **File:** `src/app/superadmin/report-campaigns/page.tsx`
- **Gate:** module `campaigns`
- **Header:** `CampaignsHubHeader`, action button `New report campaign`

## Dialog `New report campaign`

| field | label | placeholder |
|---|---|---|
| name | `Campaign name` | `e.g. Lago Wafers: Summer Launch` |
| brand | `Brand` | `e.g. Lago` |
| description | `Notes (optional)` | `Anything the client should read at the top of the report.` |

Buttons `Cancel` / create. Toast `Report campaign created. Add the post links next.`

## Row actions

| Control | Label | Destination / behaviour |
|---|---|---|
| Secondary | `View report` | `/superadmin/report-campaigns/{id}` |
| Outline | `Add posts` | `/campaigns/{id}/posts` |
| Ghost | `Preview` (title `Open the client-facing report`) | `/r/{share_token}`, new tab; only when a token exists |
| Primary/secondary | `Create share link` / `Copy link` / `Copied` | mints or copies the public link |
| Ghost | `Revoke` | opens the AlertDialog |

**AlertDialog `Revoke this report link?`** — buttons per the dialog; toast
`Link revoked. Anyone holding it now sees nothing.`

Failure and empty states each carry a retry or a `New report campaign` button.

---

# 42. `/work/report-campaigns/{id}` — report detail

- **Route:** `/work/report-campaigns/{id}`
- **File:** `src/app/superadmin/report-campaigns/[id]/page.tsx`
- **Gate:** module `campaigns`
- **Title:** the campaign name; sub = the brand name
- Back link `Report campaigns`

| Control | Label | Notes |
|---|---|---|
| Ghost | `Refresh` | — |
| Outline | `Add posts` | `/campaigns/{id}/posts` |
| Ghost | `Client view` | `/r/{token}`, new tab; token only |
| Primary/secondary | `Create share link` / `Copy link` / `Copied` | — |
| Ghost | `Revoke` | opens `Revoke this report link?` |

## Stats

`Posts` · `Creators` · `Engagement` · `Video plays` (sub `Instagram play count, not reach`) ·
`Engagement rate (of followers)` (sub `Engagement ÷ combined follower count`) ·
`Engagement rate (of plays)` (sub `Engagement ÷ video plays`).

## Sections

`What ran` · `Creators` · `Posts`.

Empty: `No posts yet` / `Add the post and reel links this campaign produced and the report
builds itself.` with an `Add posts` button.

No export from this screen (the client-facing report lives at `/r/{token}`).

---

# 43. `/work/fa` — Following App hub

- **Route:** `/work/fa`
- **File:** `src/app/superadmin/fa/page.tsx`
- **Gate:** module `fa` (page also wrapped in `AuthGuard requireAdmin`)
- **Title:** `Following App`
- **Sub:** `The staff side of the creator app: who is waiting on a decision, what has just happened, and how big the platform is right now.`

## Section `Waiting on somebody`

| stat label | destination |
|---|---|
| `Proofs to verify` | `/superadmin/fa/deliverables?stage=proof_submitted` |
| `Withdrawals to approve` | `/superadmin/fa/withdrawals` |
| `Creators to decide on` | `/superadmin/fa/members?tab=pending` |
| `Signed up today` | `/superadmin/fa/members` |
| `Receipts to check` | `/superadmin/fa/receipt-claims` |

## Section `What just happened`

Feed preview with a `See everything` button → the activity screen.

## Section `How big the platform is`

| stat label | destination |
|---|---|
| `Creators signed up` | `/superadmin/fa/members` |
| `Waiting on a decision` | `/superadmin/fa/members?tab=pending` |
| `Merchants live` | `/superadmin/fa/merchants` |
| `Campaigns running` | `/superadmin/fa/campaigns` |
| `Deliverables outstanding` | `/superadmin/fa/deliverables` |
| `Withdrawals waiting` | `/superadmin/fa/withdrawals` |

A figure that did not come back renders `—`, never `0`. No export.

---

# 44. `/work/fa/activity` — Activity

- **Route:** `/work/fa/activity`
- **File:** `src/app/superadmin/fa/activity/page.tsx`
- **Gate:** module `fa`
- **Title:** `Activity`
- **Sub:** `Everything that has happened across the Following App, newest first. Click a line to go to the screen where you can act on it.`

| Control | Label |
|---|---|
| Outline | refresh |
| Filter tabs | `All`, `Signups`, `Applications`, `Approvals`, `Content`, `Proofs`, `Verified`, `Withdrawals`, `Receipts` |
| Outline | load-more button at the foot of the feed |

Feed rows carry a kind badge and a relative timestamp; clicking a line opens the screen that
owns it. No export.

---

# 45. `/work/fa/campaigns` — App campaigns

- **Route:** `/work/fa/campaigns`
- **File:** `src/app/superadmin/fa/campaigns/page.tsx`
- **Gate:** module `fa`; `Re-analyze suggested` additionally requires `isSuperAdmin`
- **Header:** `CampaignsHubHeader`

## Header actions

| Control | Label | Gate |
|---|---|---|
| Outline | `Re-analyze suggested` / `Starting…`, title `Re-run analytics for team-suggested creators stuck on 'Analyzing'` | **`isSuperAdmin`** — it bills Apify and takes shared slots; the server refuses otherwise |
| Outline | `New package` | opens `CreateMasterDialog` |
| Primary | `Create Campaign` | → `/superadmin/fa/campaigns/new` |

## Filters

Tabs `All` · `Cashback` · `Paid Deals` · `Barter`.
ToggleGroup `Active` / `Closed`.

## Row actions

| Control | Label | Notes |
|---|---|---|
| Outline | `Creators` (title `Creator funnel: who's enrolled, approved, submitted, verified`) | → `/superadmin/fa/campaigns/{id}` |
| Outline | `Share` | opens the share dialog |
| Outline | `Coupons` | opens `CouponManagerDialog` |
| Outline | `Package` | opens `MasterPackageDialog` |
| Outline | `Add creators` | active campaigns only |
| Ghost (destructive) | `Close` | active campaigns only |
| Ghost (destructive) | `Delete` (title `Take it off the creator app`) | — |

Rows also carry a campaign-type badge and a status badge; cover image and brand logo can be
replaced inline (toasts `Cover image updated`, `Brand logo updated`).

## Dialogs

**AlertDialog `Close "{name}"?`** — closing leaves it on the creator app greyed out and marked
complete.

**AlertDialog `Take "{name}" off the app?`** — archives and hides it.

**`Suggest creators - {name}`** — description explains the creators go for brand approval.
Field `Instagram handles (one per line or comma-separated)`, placeholder
`@hudabeauty / @negin_mirsalehi / @tamarakalinic`. Buttons `Cancel` and add.
Toast `Added {n} creator(s) for brand approval`; validation `Add at least one Instagram handle`.

**`Share "{name}"`** — shows the public URL with a copy button, a QR code, a
**`Download QR`** button (PNG, `campaign-{id}-qr.png`) and `Done`.

**`Codes`** (`CouponManagerDialog`) — generate by count (placeholder `20`) with an optional
prefix (placeholder `Prefix (optional), e.g. BRK`), or paste codes
(placeholder `Paste codes - one per line or comma-separated / THAIFIRE-A1B2 / THAIFIRE-C3D4`).

**`Master package`** (`MasterPackageDialog`) — description = the campaign name; controls
`Or attach to an existing master` (select, placeholder `Select master…` / `No masters yet`) and
a switch `Agency-only (exclude brand)`.

**`New master package`** (`CreateMasterDialog`) — description
`An umbrella for a bought package. Brand-visible for reconciliation; never on the creator app.`
Fields `Package name` (placeholder `e.g. Barter Package, Dec '25`), `Type`,
`Package target (optional)` (placeholder `e.g. 55`), `Client / merchant`
(placeholder `Select merchant…`). Buttons `Cancel` and save.

---

# 46. `/work/fa/campaigns/new` — campaign type picker

- **Route:** `/work/fa/campaigns/new`
- **File:** `src/app/superadmin/fa/campaigns/new/page.tsx`
- **Gate:** module `fa`
- **Title:** `Create a campaign`
- **Sub:** `Step 1 of 2. Pick what kind of deal this is; the details come next. The type decides how the creator gets paid, so it cannot be changed afterwards.`

| tile title | badge | description | destination |
|---|---|---|---|
| `Cashback` | `Driven by a QR receipt` | `Creators drive purchases at the client's venue. Buyers scan the QR on the receipt and the pool pays the creator's commission on its own.` | `/superadmin/fa/campaigns/create` |
| `Paid deal` | `One fixed fee` | `Creators do the agreed deliverables for a fixed AED fee each, paid out of the client's funded pool.` | `/superadmin/fa/campaigns/create-paid-deal` |
| `Barter` | `Product, not money` | `Creators get products or a service in exchange for the content. No cash changes hands.` | `/superadmin/fa/campaigns/create-barter` |

---

# 47. `/work/fa/campaigns/create` — New cashback campaign

- **Route:** `/work/fa/campaigns/create`
- **File:** `src/app/superadmin/fa/campaigns/create/page.tsx`
- **Gate:** module `fa`
- **Title:** `New cashback campaign`
- **Sub:** `Creators send people to the venue. A buyer scans the QR on their receipt and the pool pays the creator's cut on its own. Step 2 of 2.`

| step | title | description / fields |
|---|---|---|
| 1 | `Where it is redeemed` | merchant select; a merchant with no brand shows the badge `No brand linked` |
| 2 | `What funds it` | funding pool; an empty pool shows `Empty, needs a top-up` |
| 3 | `The campaign` | `The name creators see in the app, when it runs, and how many can join.` Fields: `Campaign name *` (placeholder `e.g. Summer Fashion Cashback`), `What are we promoting` (placeholder `A line or two creators will read in the app`), start date, end date, `How many creators at most` (placeholder `No cap`) |
| 4 | `The rate` | `What share of a receipt goes back to the creator.` Field `The rate everybody gets` |
| 5 | `What the creator posts` | `Pick the formats and how many of each.` |

Footer: a ghost back link and the create button.

Validation toasts: `Campaign name is required`, `Select a merchant`,
`This merchant has no brand linked. Edit it in /superadmin/fa/merchants and assign a brand
first.`, `Cashback % must be between 1 and 100`, `Pick at least one deliverable`.
Success `Cashback campaign created!`

---

# 48. `/work/fa/campaigns/create-paid-deal` — New paid deal

- **Route:** `/work/fa/campaigns/create-paid-deal`
- **File:** `src/app/superadmin/fa/campaigns/create-paid-deal/page.tsx`
- **Gate:** module `fa`
- **Title:** `New paid deal`
- **Sub:** `Every creator is paid the same fixed fee, out of the client's funded pool, once their deliverables are verified. Step 2 of 2.`

| section | description | fields |
|---|---|---|
| `Who it is for` | `The merchant is the place a creator actually walks into. If the client is not on the platform, run it team-managed and give it a name instead.` | merchant select (placeholder `Choose a merchant...` / `Choose a merchant (optional)...`), `Funding pool (optional)` (placeholder `Select pool...`) |
| `The campaign` | `The name creators see in the app, when it runs, and how many people can join.` | `Campaign name *` (placeholder `e.g., Summer Paid Collab 2026`), `What are we promoting`, `Start Date`, `End Date`, `How many creators at most` (placeholder `Leave empty for no cap`) |
| `What each creator is paid` | — | `Fee per creator (AED) *` (placeholder `e.g. 500`) |

Footer: `Cancel` → `/superadmin/fa/campaigns` and the create button (disabled until name,
merchant-or-client-name and a positive fee are set).

---

# 49. `/work/fa/campaigns/create-barter` — New barter campaign

- **Route:** `/work/fa/campaigns/create-barter`
- **File:** `src/app/superadmin/fa/campaigns/create-barter/page.tsx`
- **Gate:** module `fa`
- **Title:** `New barter campaign`
- **Sub:** `Creators get a product, a service or a discount code instead of a fee. Step 2 of 2.`

| section | fields |
|---|---|
| `Who it is for` | merchant select (same placeholders as the paid deal), team-managed client name |
| `The campaign` | `Campaign name *` (placeholder `e.g., Thai Fire Edit`), `What are we promoting`, `Start Date`, `End Date`, `How many creators at most` |
| `What the creator gets` | repeatable rows: `Item Name *` (placeholder `e.g., AED 200 coupon, Gift basket`), `Estimated Value (AED)`, `Description` (placeholder `Details about the item...`), a remove icon (disabled at one row), and button `Add another item` |

Footer: `Cancel` and the create button (disabled until a name, a merchant-or-client-name and at
least one named item exist).

---

# 50. `/work/fa/campaigns/{id}` — campaign funnel

- **Route:** `/work/fa/campaigns/{id}`
- **File:** `src/app/superadmin/fa/campaigns/[id]/page.tsx`
- **Gate:** module `fa`
- **Title:** the campaign name, with badges

Header button `All deliverables` → the deliverables queue for this campaign.

`AutoApproveCard` — title `Accepting applications automatically`, badges `Default` and
`Set for this campaign`; fields `Give the brand` (a preset window) and
`Or exactly, in hours`.

## Funnel strip (`BUCKETS`) — each is a filter

| key | label | tone |
|---|---|---|
| `applied` | `Applied` | neutral |
| `enrolled` | `Enrolled, content pending` | info |
| `content_review` | `Content review` | warn |
| `revision_requested` | `Edit requested` | warn |
| `content_approved` | `Approved, awaiting the post` | info |
| `proof_submitted` | `Proof submitted` | warn |
| `completed` | `Completed` | good |
| `rejected` | `Rejected` | bad |

A stage whose count did not come back renders `—`, never `0`.

## Creator list

Rows: avatar, `@handle` (linking to Instagram) or the full name, badges
`offline · team managed` and `team suggested`, the bucket badge, and deliverable chips using
`DELIVERABLE_CHIP_LABELS`: `pending`, `in review`, `edit requested`, `awaiting post`,
`proof in`, `verified`, `rejected`.

Empty: `No creator has joined this campaign yet.` or
`Nobody is at "{bucket label}" right now.`
Failure: the shared `Failed` block with a retry, never the empty state.

No export.

---

# 51. `/work/fa/deliverables` — Deliverables

- **Route:** `/work/fa/deliverables` (deep-linked as `?stage=proof_submitted` from several places)
- **File:** `src/app/superadmin/fa/deliverables/page.tsx`
- **Gate:** module `fa`
- **Title:** `Deliverables`
- **Sub:** `Every piece of content creators owe us, across every campaign: what is waiting on a review, what has been posted, and what still needs verifying before a payout is released.`

## Filters

Tabs (`FILTERS`): `Active`, `Content review`, `Edit requested`, `Approved · awaiting post`,
`Proof submitted`, `Verified`, `Rejected`, `Archive`, `All`.
Campaign select: `All campaigns` plus one entry per campaign.

## Row actions

| Control | Label | Notes |
|---|---|---|
| Ghost | view media | opens the media viewer dialog |
| Ghost | `Proof` | opens the proof link |
| Ghost | request-edit trigger | opens the AlertDialog below |
| Primary | approve content | — |
| Outline | `Reject` | — |
| Primary | confirm | verifies the proof |

**AlertDialog `Request an edit`** — textarea placeholder
`What needs changing? (optional)`.

**Media viewer dialog** — title shows the creator and deliverable; `←` / `→` navigation between
attachments; a raw-file tab is offered because Chrome downloads `.mov` rather than playing it.

Rows carry a campaign-type badge and a stage badge. No export.

---

# 52. `/work/fa/members` — Creators (app members)

- **Route:** `/work/fa/members` (deep-linked as `?tab=pending`)
- **File:** `src/app/superadmin/fa/members/page.tsx`
- **Gate:** module `fa`; approve/reject/delete and analytics are superadmin-guarded server-side
- **Title:** `Creators`
- **Sub:** `{n} creators have signed up to the Following App. Approving somebody lets them apply to campaigns.` (falls back to the same sentence without the count)

## Controls

| Control | Label / options |
|---|---|
| Search | placeholder `Search a name, a handle or a niche` |
| Sort select | placeholder `Sort by`; `Newest first`, `Most followers`, `Highest engagement` |
| Tabs (`MEMBER_TABS`) | `Waiting on us`, `Approved`, `Rejected`, `Never finished signing up` — each with a count; the initial tab honours `?tab=` |
| Clear search | `Clear` button in the empty state |
| Bulk bar | ghost clear-selection button and a bulk approve button |

## Per-member actions

| Control | Label | Notes |
|---|---|---|
| Primary | `Approve` | toast `{name} approved` |
| Outline | `Reject` | reveals a `Rejection reason (optional)...` textarea, then `Reject` / `Cancel` |
| Outline | `Analytics` | title `Run Creator Analytics on this member's Instagram`; toast `Analytics refreshed for {name}` |
| Outline | `Instagram` | opens the profile |
| Destructive | `Delete` | inline confirm `Delete them for good?` with `Yes, Delete` / `Cancel`; toast `{name} permanently deleted` |

Badges include verification (`Verified on Instagram`) and `Below our bar`.

Member detail **Sheet `Member detail`** opened from a per-row ghost button.

A failed roster fetch never renders the empty state — the screen says so instead.
No export.

---

# 53. `/work/fa/merchants` — Merchants

- **Route:** `/work/fa/merchants`
- **File:** `src/app/superadmin/fa/merchants/page.tsx`
- **Gate:** module `fa` (sidebar entry additionally hidden for a scoped account manager)
- **Title:** `Merchants`
- **Sub:** `The places a creator actually walks into. A merchant is where cashback gets redeemed and where a dine-in visit is confirmed, so its venue code lives here too.`

## Actions

| Control | Label |
|---|---|
| Primary | `Add a merchant` |
| Row icon | title `Copy the code` — toast `Venue code copied` |
| Row icon | title `Issue a new code (the old one stops working)` — confirm `Issue a new venue code for {name}? The current code stops working immediately.`, toast `New venue code: {code}` |
| Row outline | `Edit` |
| Row outline | `Delete` — confirm `Delete this merchant?` |

## Dialog `Add a merchant` / `Edit this merchant`

| field | label / placeholder |
|---|---|
| brand | select placeholder `Select the brand this merchant belongs to` |
| name | placeholder `Swiss Butter - Dubai Mall` |
| category | placeholder `F&B, Fitness, Beauty...` |
| logo | upload button; JPEG/PNG/WebP, max 5MB; toasts `Use JPEG, PNG, or WebP`, `Logo too large (max 5MB)`, `Logo uploaded` |
| address | placeholder `Dubai Mall, Dubai` |

Buttons `Cancel` / `Save` (save disabled until name, category and brand are set).
Rows show a category badge and, when unlinked, `No brand linked`.

No export.

---

# 54. `/work/fa/receipt-claims` — Receipt claims

- **Route:** `/work/fa/receipt-claims`
- **File:** `src/app/superadmin/fa/receipt-claims/page.tsx`
- **Gate:** module `fa`; the endpoints are superadmin-only
- **Title:** `Receipt claims`
- **Sub:** `Creators photograph a till receipt, the scanner reads the merchant, the amount and the date, and you decide. Approving one creates the deliverables and puts the cashback in their wallet.`

Tabs (`STATUS_TABS`): `Waiting on us` (`pending_review`), `Approved`, `Rejected` — the active
tab carries a count.

Empty copy per tab: `No receipt is waiting to be reviewed.` /
`No receipt has been approved yet.` / the rejected equivalent.

AI badge: `{n}% sure` (tone by score) or `Not scored`.

## Row actions

| Control | Label | Notes |
|---|---|---|
| Outline | `Reject` | reveals an inline input `Why, in a line the creator will read`, then `Confirm` / `Rejecting` and `Cancel` |
| Primary | `Approve` / `Approving` | toast `Approved. {n} deliverables created, AED {n} cashback now pending.` |

Receipt image opens in a dialog (accessible title `Receipt image`). No export.

---

# 55. `/work/fa/reliability` — Creator reliability

- **Route:** `/work/fa/reliability`
- **File:** `src/app/superadmin/fa/reliability/page.tsx`
- **Gate:** module `fa`
- **Title:** `Creator reliability`
- **Sub:** `App creators only, scored on whether they deliver and whether they deliver on time. The point of the board is to reach somebody before a deadline turns into a default.`

Stats: `Creators tracked`, `At risk`.
Tabs: `At risk · {n}` and `Everyone`.

Rows: avatar, handle, phone, a score badge, and `What is actually on their record` — defaults,
lates and the outstanding deliverables with their quantities and due clocks.

No export, no search.

---

# 56. `/work/fa/wallets` — Creator wallets

- **Route:** `/work/fa/wallets`
- **File:** `src/app/superadmin/fa/wallets/page.tsx`
- **Gate:** module `fa`; the Money-hub tab additionally requires `canSeeCost`
- **Title:** `Creator wallets`
- **Sub:** `What every creator is holding: available now, cashback still clearing, and what they have earned and taken out over their whole time with us. All figures in AED.`

Search: placeholder `Search a name or @username`, with a `Clear` button in the empty state.

Table `Every creator`:

| column |
|---|
| `Creator` |
| `Tier` |
| `Available` |
| `Cashback clearing` |
| `Withdrawing` |
| `Earned, all time` |
| `Withdrawn, all time` |

Pagination: `Previous` / `Next`. No export, no sorting controls.

---

# 57. `/work/fa/withdrawals` — Withdrawals

- **Route:** `/work/fa/withdrawals`
- **File:** `src/app/superadmin/fa/withdrawals/page.tsx`
- **Gate:** module `fa`; the endpoints are superadmin-only
- **Title:** `Withdrawals`
- **Sub:** `Creators asking for their balance in the bank. Approving one sends the transfer, so check the IBAN against the name before you do.`

Tabs: `Waiting on us` · `Paid` · `Failed`.

Row actions: an outline reject button and a primary approve button.
Toasts `Approved. The transfer goes out from here.` and
`Rejected. The money is back in the creator's wallet.`

**Dialog `Reject this withdrawal`** — textarea
`Why, in a line the creator will read (optional)`;
buttons `Cancel` / `Reject and return the money`.

No export.

---

# 58. `/work/fa/notifications` — App notifications

- **Route:** `/work/fa/notifications`
- **File:** `src/app/superadmin/fa/notifications/page.tsx`
- **Gate:** module `fa`
- **Title:** `Notifications`
- **Sub:** `{n} notifications sent so far. Send to everybody, to one tier, or to a single person.` (falls back without the count)

## Dialog `Send notification`

Description: `Broadcast to creators by audience, tier, status, or to a single member.`

| field | label | options / placeholder |
|---|---|---|
| audience | `Audience` | `All approved creators`, `By tier`, `By status`, `Single member` |
| tier | `Tier` | from `TIER_OPTIONS` |
| status | `Status` | from `STATUS_OPTIONS` |
| member | `Member ID` | placeholder `fa_member UUID...` |
| type | `Type` | notification types |
| title | `Title` | placeholder `Notification title` |
| message | `Message` | placeholder `Message body...` |
| actionable | `Actionable` | switch |
| action url | `Action URL` | placeholder `/campaigns/123 or https://...` |

Buttons `Cancel` and send. Validation: `Title is required`, `Message is required`,
`Member ID is required`. Success `Sent to {n} recipient(s)`.

## Stats

`Total sent` · `Unique recipients` · `Last 7 days`.

## Log table

Search placeholder `Search title, message, recipient...`; type select `All types` plus the
type list.

| column |
|---|
| `Recipient` |
| `Type` |
| `Title` |
| `Message` |
| `Read` (badge `Read` / `Unread`) |
| `Sent` |

Pagination via previous/next buttons. No export.

---

# 59. `/work/fa/ad-banners` — Ad banners

- **Route:** `/work/fa/ad-banners`
- **File:** `src/app/superadmin/fa/ad-banners/page.tsx`
- **Gate:** module `fa`
- **Title:** `Ad banners`
- **Sub:** `The promo cards in the creator app's home carousel. Only active banners are shown to creators, and the sort order is the order they scroll past.`

Header button `Add a banner`. Dialog title `Add a banner` / `Edit this banner`.

| field | label | notes |
|---|---|---|
| image | `Banner image *` | upload (JPEG/PNG/WebP, max 5MB) or the input `...or paste an image URL`; toasts `Use JPEG, PNG, or WebP`, `Image too large (max 5MB)`, `Image uploaded` |
| title | `Title` | placeholder `Internal label (not shown on the banner)` |
| link type | `Where it goes` | `In-app (route)` / `External (web URL)` |
| link | `Link` | placeholder `https://example.com/promo` or `/campaigns or /campaigns/123` |
| order | `Order in the carousel` | number |
| active | `Show it in the app` | switch, helper `Creators only see banners that are switched on` |

Buttons `Cancel` / `Save` (save disabled without an image).
Row: `#{sort_order}` badge, active badge, buttons `Edit` and `Delete`
(confirm `Delete this banner?`).

No export.

---

# 60. `/work/system` — System hub

- **Route:** `/work/system`
- **File:** `src/app/superadmin/system/page.tsx`
- **Gate:** module `system`
- **Title:** `System`
- **Sub:** `The platform's own plumbing: what the workers are doing, and what the office screens are showing.`

A plain hairline-separated list, no cards:

| entry | description | destination |
|---|---|---|
| `Job queue` | `Post analytics jobs that have been processing or queued for too long, and worker health.` | `/superadmin/system/jobs` |
| `Office screens` | `The TV wall and any other screen we hang: what it shows, how often it refreshes.` | `/superadmin/system/displays` |

A currency card previously here was removed (it called a deleted service and per-team currency
is obsolete under the AED-everywhere model).

---

# 61. `/work/system/jobs` — Job queue

- **Route:** `/work/system/jobs`
- **File:** `src/app/superadmin/system/jobs/page.tsx`
- **Gate:** module `system`; the cleanup action additionally requires `canDestroy`
- **Title:** `Job queue`
- **Sub:** `Post analytics jobs that have been processing or queued for too long. Failing them clears the queue, it does not produce the analytics.`

| Control | Label | Gate |
|---|---|---|
| Outline | `Refresh` | — |
| Destructive | `Fail {n} stuck job(s)` / `Failing them…` | **`canDestroy`**; disabled while loading, on failure, or with no stuck jobs |
| Retry | `Try again` | on failure |

Stats: `Stuck jobs` · `Processing` · `Queued`.

Panel `Stuck Jobs ({n})` — rows carry a status badge (`processing` / other) and a job-type
badge.

**AlertDialog** confirming the cleanup before failing the jobs.
Error toasts distinguish a 401/403 from a generic `Failed to cleanup jobs`.

No export.

---

# 62. `/work/system/displays` — Office screens

- **Route:** `/work/system/displays`
- **File:** `src/app/superadmin/system/displays/page.tsx`
- **Gate:** `can('system')` — the page renders `UnauthorizedAccess` itself when refused. The
  money scope on a screen additionally requires **`canExport`** (leadership)
- **Title:** `Office screens`
- **Sub:** `The wall in the office and anything else we hang. A screen link stays open until you turn it off: it runs unattended, and an expiry nobody watches is a blank wall on a Sunday. A screen that shows money is the exception, and is offered an end date.`

## Dialog `New screen`

| field | label | notes |
|---|---|---|
| label | `Name *` | placeholder `e.g. Office wall, main`; validation `Name the screen. Where it hangs is the useful name` |
| scope | `Show money` | switch, sub `Invoiced, collected and unpaid. Founders' screens only.` — **`canExport` only** |
| expiry | `Give the link an end date` | switch, sub "Anyone with this URL reads our revenue without logging in. You can extend it any time from the list, and turning this off keeps the link permanent." — shown only when `canExport` **and** the scope is leadership. Reveals a days input (1–730) and the line `days, runs until the end of {date}` |
| slides | `Slides` | chips; helper `Leave all off to show everything that has live work.` |

Slide options (`SLIDE_LABEL`): `App campaigns: barter`, `App campaigns: paid`,
`Managed campaigns`, `UGC`, `Waiting on us`, `Sourcing`.

Buttons `Cancel` and create.

## Per-screen row

Badges `Shows money` (leadership scope) and `Off`. Beneath, the slide list rendered through
`SLIDE_LABEL`, or `Everything with live work`.

| control | label | notes |
|---|---|---|
| Number input | `Refresh` … `s` | 15–3600; saves on blur, toast `Refresh saved` |
| Date input | `Until` | saves on blur; toasts `End date saved` / `End date cleared, the link is permanent again`; disabled when the screen is off |
| Outline | copy link | toast `Link copied, open it on the screen` |
| Outline | issue a new link | opens the rotate dialog |
| Ghost (destructive) | turn off | opens the revoke dialog |

**AlertDialog `Issue a new link for "{label}"?`** — the old URL stops working immediately;
toast `New link for "{label}" copied. The old one has stopped working. Open this one on the
screen.`

**AlertDialog `Turn off "{label}"?`** — toast `"{label}" turned off`.

Failure state: `Try again`. No export.

---

# 63. `/work/notifications` — Email alerts

- **Route:** `/work/notifications`
- **File:** `src/app/superadmin/notifications/page.tsx`
- **Gate:** module `system`
- **Title:** `Email alerts`
- **Sub:** `Control which platform events send email, how it arrives, and who receives it. An event either interrupts someone straight away, or waits and arrives as one line in the twice-daily digest. {n} of the {m} live events are in the digest, which is what stops a busy day turning into thirty emails.` (the trailing sentence is dropped when the read failed)
- **Header badge:** `{n} event(s) enabled`, or `count unknown`

Failure block: `Could not load the alert settings` with the note that every rule is still in
force and a `Try again` button.

## Digest panel

Title `Digest: 08:30 and 17:30, Dubai`. Body reports what is queued, or
`We could not read what is queued. This is not a count of zero. Try again.` /
`Checking what is queued…` / `Nothing queued. An empty digest is not sent.`
Button `Send me one now` / `Sending…`, toasts `Digest sent to zain@following.ae` or
`Nothing to send right now`.

## Event list

Search input placeholder `Search events…`; events grouped by domain heading.

Per event:

| control | label | notes |
|---|---|---|
| Switch | `Email` | on/off |
| Badges | — | includes `In-app only` |
| Recipients | — | role checkboxes, including `All superadmins`; each row shows a role badge |
| Input | `Extra email addresses` | placeholder `ops@brand.com, finance@brand.com` |
| Input | `Subject override (optional)` | placeholder `Leave blank to use the notification title` |
| Test | `you@following.ae` input + `Send test` button | validation `Enter a valid test email address`; toast `Test sent to {email}` |
| Button | `Save` | disabled until dirty; toast `Saved "{event label}"` |

Creators are never on these lists; every internal email passes through one hook, so switching
an event off here switches it off everywhere.

No export.

---

# 64. `/work/whatsapp` — WhatsApp marketing

- **Route:** `/work/whatsapp`
- **File:** `src/app/superadmin/whatsapp/page.tsx`
- **Gate:** module `system`
- **Title:** `WhatsApp marketing`
- **Sub:** `Broadcast to the influencers in our network: the app launch, campaigns and updates. Opt-outs are honoured automatically.`

Header refresh button. Tabs: `Broadcasts` · `Contacts` · `Templates`.

## Tab `Broadcasts`

Panel `New broadcast`:

| field | label | placeholder / options |
|---|---|---|
| name | `Name (internal)` | `App launch announcement` |
| template | `Template` | select placeholder `Choose an approved template` |
| variables | `{{n}} · {name}` per variable | placeholder `value or {{first_name}}` or the template's sample |
| audience | `Audience` | `All consented contacts`, `By tag`, `Test: specific numbers` |
| tags | — | placeholder `beauty, vip (comma separated)` |
| test phones | — | placeholder `+971501234567, +971502223333` |

Buttons: an estimate button, then the send button which opens **Dialog
`Send this broadcast?`** with `Cancel` and a confirm button.
Validation `Name and template are required`; toasts on estimate failure and send failure.

Panel `Recent broadcasts` table: `Name` · `Status` · `Sent` · `Delivered` · `Failed`.
Opening a broadcast shows an analytics dialog with a status select (`All statuses` plus each
status) and a table `Contact` · `Phone` · `Status` · `Error`.

## Tab `Contacts`

| control | label |
|---|---|
| Outline | **`Import CSV/Excel`** (`.csv,.xlsx,.xls`) — toast `Imported {n} new, updated {n}, skipped {n}` |
| Search | placeholder `Search name, phone, handle` |
| Switch | `Sendable only` |

Table: `Name` · `Phone` · `Handle` · `Tags` · `Status`.
A failed load never renders the "no contacts, import a CSV" empty state.

## Tab `Templates`

Buttons: a `sync` button and `Register template`.

**Dialog `Register a WhatsApp template`**:

| field | label | placeholder |
|---|---|---|
| name | `Name` | `App launch` |
| sid | `Twilio Content SID` | `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| category | `Category` | `Marketing`, `Utility`, `Authentication` |
| body | `Body preview (with {{1}} placeholders)` | `Hi {{1}}, the Following creator app is live! Download...` |
| variables | `Number of variables` | 0–10 |

Buttons `Cancel` / `Save`. Validation `Name and Content SID required`;
toast `Template registered`.

---

# 65. `/work/billing` — Client credits

- **Route:** `/work/billing`
- **Files:** `src/app/superadmin/billing/page.tsx` → `src/components/admin/SuperadminBilling.tsx`
- **Gate:** module `billing` (route guard) — the wrapper is the first tab of the Money hub
- **Header:** `MoneyHubHeader`, then `PageHead` title `Client credits`,
  sub `Every credit bought and spent, and who moved it.`

Header button: a refresh button. Failure block carries `Try again`.

Stats: `Credits bought` · `Transactions` · `Busiest month`.

Tabs: `Ledger` · `By month`.

## Tab `Ledger`

| control | label |
|---|---|
| Search | placeholder `Search by client or description` |
| Type select | `Any type` plus each transaction type |
| Outline | **`Export`** — CSV `credit-ledger-YYYY-MM-DD.csv`; disabled when the list is empty |

Table: `Date` · `Client` · `Type` · `What for` · `Credits` · `Balance after`.
Pagination via previous / next buttons. Empty state via `Empty`.

## Tab `By month`

Panel `Credits bought by month`, with a range select (`3 months`, `6 months`, `12 months`)
and **`Export`** — CSV `credits-by-month-YYYY-MM.csv`, disabled when the series is empty.
Empty: `Nothing was bought in this period.`

---

# 66. `/superadmin` — operator dashboard

- **Route:** `/superadmin` (there is no `/work` equivalent, and nothing links here)
- **Files:** `src/app/superadmin/page.tsx` → `src/components/admin/SuperAdminInterface.tsx` →
  `src/components/admin/SuperadminDashboard.tsx`
- **Gate:** `AuthGuard requiredRole="admin"`
- **Title:** `Dashboard`
- **Sub:** `Where the platform stands, and the four places you go most.`

| stat | hint |
|---|---|
| `Users in total` | — |
| `Active users` | `Signed in recently` |
| `Profiles analysed` | `{n} today`, or `Today's count did not come back` |

A refresh button sits above. No tables, no exports, no row actions.

`src/app/superadmin/layout.tsx` is a server component that only sets the browser metadata:
title template `%s | Superadmin | Following`, default `Superadmin | Following`,
description `Following control panel for clients, campaigns, and the Following App.`,
`robots: { index: false, follow: false }`.

---

# 67. Redirect-only routes

These files exist and serve a route, but render no UI of their own.

| Route | File | Redirects to |
|---|---|---|
| `/work` | `src/app/work/page.tsx` | `/work/today` |
| `/superadmin/today` | `src/app/superadmin/today/page.tsx` | `/work/today` |
| `/superadmin/brands` | `src/app/superadmin/brands/page.tsx` | `/work/brands` |
| `/superadmin/coverage` | `src/app/superadmin/coverage/page.tsx` | `/work/coverage` |
| `/superadmin/goals` | `src/app/superadmin/goals/page.tsx` | `/work/goals` |
| `/superadmin/guide` | `src/app/superadmin/guide/page.tsx` | `/work/guide` |
| `/superadmin/payables` | `src/app/superadmin/payables/page.tsx` | `/work/payables` |
| `/superadmin/team-console` | `src/app/superadmin/team-console/page.tsx` | `/work/team` |
| `/superadmin/campaigns/{id}` | `src/app/superadmin/campaigns/[campaignId]/page.tsx` | `/work/campaigns/{id}/timeline` |
| `/work/creators` | `src/app/work/creators/page.tsx` | `/work/influencers` or `/work/fa/members` |
| `/work/money` | `src/app/work/money/page.tsx` | the first Money-hub tab the viewer may open |

---

# 68. Every export, and where it lives

| Export | Format | Screen | Control | Gate |
|---|---|---|---|---|
| Roster spreadsheet | CSV | `/work/areas/{areaId}` | `⋯` menu → `Download a spreadsheet` | **`canExport`** |
| Influencer database | CSV or JSON | `/work/influencers` | bulk bar → `Export` → dialog `Export Influencers` | **`canExport`** |
| Platform users | CSV (`users-YYYY-MM-DD.csv`) | `/work/users` | `Export` | module `users` |
| Creator payments | CSV (`creator-payments-YYYY-MM-DD.csv`) | `/work/payables` | `Export` | module `influencers` (+ `canSeeCost` to reach the tab) |
| Credit ledger | CSV (`credit-ledger-YYYY-MM-DD.csv`) | `/work/billing` → Ledger | `Export` | module `billing` |
| Credits by month | CSV (`credits-by-month-YYYY-MM.csv`) | `/work/billing` → By month | `Export` | module `billing` |
| Enrolment roster | XLSX | `/work/enrolments` | `Export` | enrolments access |
| Payout file (full IBANs, access logged) | XLSX | `/work/enrolments/payments` | `Payout file` | leadership, enforced server-side |
| Client scope | XLSX | `/work/clients/{teamId}` → What we agreed | `Download the scope` | module `clients` |
| Campaign report | file download | `/work/clients/{teamId}` → What we agreed | per-row icon, title `Download report` | module `clients` |
| Enrolment agreement | PDF | `/work/enrolments/{id}` | `Agreement` | enrolments access |
| Enrolment record pack | PDF | `/work/enrolments/{id}` | `Record pack` | enrolments access |
| Campaign share QR | PNG (`campaign-{id}-qr.png`) | `/work/fa/campaigns` → Share dialog | `Download QR` | module `fa` |
| WhatsApp contacts | *(import, not export)* CSV/XLSX in | `/work/whatsapp` → Contacts | `Import CSV/Excel` | module `system` |
| Creator spreadsheet import | XLSX in | `/work/influencers`, `/work/influencers/add` | `Import a spreadsheet` | module `influencers` |

Bulk extraction is leadership-only by design: a file cannot enforce field visibility once it
has been emailed, so scoped staff work on screen and share with clients through a proposal.
`canExport` mirrors `app/core/field_policy.py`; the server refuses regardless, and the gate
only stops the console offering a button that would 403.

---

# 69. Routes that exist as files but are not linked from any sidebar

Every route below renders a real screen. None of them appears in `SuperAdminSidebar` for any
role; they are reached from a hub tab, a parent list, an in-page link, the command palette, or
a typed URL.

| Route | Reached from |
|---|---|
| `/superadmin` | **nothing** — fully orphaned; no nav entry, no palette entry, no in-app link |
| `/work/manual` | the guide page footer (`The walkthrough deck`) and the command palette |
| `/work/influencers/analyzed` | Creators hub tab `Analyzed creators`, palette |
| `/work/influencers/add` | Creators hub primary button, database header `Add a creator`, `Today` talent primary, palette |
| `/work/proposals` (for a talent manager) | Clients hub tab, Inbox tab, palette |
| `/work/proposals/create` | proposals list, client record `Quotes` tab, palette |
| `/work/proposals/{id}` | proposals list, brand record, client record |
| `/work/proposals/{id}/approval` | proposals list row menu, Inbox rows, client record |
| `/work/proposals/{id}/confirm` | the `Confirm for the client` card on the proposal |
| `/work/campaigns/create` | campaigns list `New campaign`, palette |
| `/work/campaigns/{id}` | typed / pasted links only (it redirects onward) |
| `/work/campaigns/{id}/timeline` | campaigns list row click, brand record, payables campaign chip |
| `/work/campaigns/{id}/ladder` | campaigns list `Delivery board`, timeline header, chasing rows |
| `/work/report-campaigns` | Campaigns hub tab `Reports`, palette |
| `/work/report-campaigns/{id}` | the report-campaigns list |
| `/work/operations` | Inbox tab `Everything in flight`, Campaigns pipeline stage `Live`, palette |
| `/work/billing` | Money hub tab `Client credits`, palette |
| `/work/fa` | palette (`FA Overview`); it is the FA hub for its own sub-screens |
| `/work/fa/campaigns` | Campaigns hub tab `App campaigns`, palette |
| `/work/fa/campaigns/new` | FA campaigns `Create Campaign`, palette |
| `/work/fa/campaigns/create` | the type picker |
| `/work/fa/campaigns/create-paid-deal` | the type picker |
| `/work/fa/campaigns/create-barter` | the type picker |
| `/work/fa/campaigns/{id}` | FA campaigns row button `Creators` |
| `/work/fa/deliverables` | Inbox tab `Content to check`, FA hub tile, palette |
| `/work/fa/withdrawals` | Inbox tab `Creator payouts`, FA hub tile, palette |
| `/work/fa/wallets` | Money hub tab `Creator app balances`, palette |
| `/work/fa/receipt-claims` | Inbox tab `Cashback receipts`, FA hub tile, palette |
| `/work/fa/members` | sidebar for account managers only; for every other role it comes from the Creators hub tab `On the app`, the FA hub, the Inbox, or the palette |
| `/work/system/jobs` | the System hub list, palette |
| `/work/users/create` | the users list, palette |
| `/work/users/{userId}` | the users list row menu and details dialog |
| `/work/clients/{teamId}` | the clients list, the brand record `Open client record` |
| `/work/brands/{teamId}` | the brands list |
| `/work/areas/{areaId}` | the rosters list, Inbox `Rosters to clear`, team console |
| `/work/enrolments/{id}` | the enrolments list and the payments board |
| `/work/enrolments/payments` | the enrolments header button `Payments`, the guide |
| `/work/approvals` | sidebar for leadership only; other roles reach it from `Today` shortcuts or the palette |
| `/work/team` | sidebar for leadership only; ungated, so any internal role can open it by URL |
| `/work/system/displays` | sidebar for leadership only; also `Today` shortcuts and the System hub |
| `/superadmin/today`, `/superadmin/brands`, `/superadmin/coverage`, `/superadmin/goals`, `/superadmin/guide`, `/superadmin/payables`, `/superadmin/team-console` | redirect stubs kept alive for links already sent in alerts and emails |

## Adjacent tree, outside this inventory's scope

`/ops`, `/ops/campaigns`, `/ops/campaigns/{campaignId}` and its `deliverables`, `settings`,
`workstreams` and `workstreams/{workstreamId}` children live under `src/app/ops/**`. They are
not part of `work/**` or `superadmin/**`, but the console links into them: the Campaigns hub
tab `Production`, the pipeline stage `Live`, the Inbox tab `Everything in flight`, the palette
entries `Production` and `Operations queues`, and `MODULE_HOME.operations`. They gate on the
`operations` module through `screenOf()`.
