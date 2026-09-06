# Following Control Panel — Product Understanding

> Phase 1a, the holistic study. Written before any redesign, and everything downstream is
> checked against it. Facts here are read from the code, not assumed; where something is an
> inference it says so.

---

## 1. What this is

Following is a Dubai influencer marketing agency that also sells its own software. The
Control Panel is the internal console the agency runs itself on. The same platform, under a
different shell, is what brand customers log into.

That dual nature is the single most important thing to hold in mind while redesigning:

- **`/work/*` and `/superadmin/*`** are the internal console. Staff only.
- **`/dashboard`, `/discover`, `/creators`, `/campaigns`, `/proposals`, `/billing`** are the
  brand-facing product.
- **`platform.following.ae/e/{token}`, `/p/{token}`** are unauthenticated pages a creator or
  a client opens from a link.

A single wrong assumption about which audience a screen serves produces a leak. The hardest
rule in the codebase exists because of it: **brands never see cost pricing**, only sell
pricing, and it is enforced on the server rather than by hiding a column.

---

## 2. The business the console runs

Following makes money four ways, and the product names them as four modules:

| Module | What the agency does | How it is charged |
|---|---|---|
| **Find** | Creator database and analytics | Subscription: Free, Standard, Premium |
| **Run** | Briefs, priced offers, delivery management | AED 1,200 a month on top of a plan |
| **Merchant of Record** | One invoice to the client, Following pays each creator | Quoted per campaign |
| **Manage** | Full service: the agency sources, negotiates and runs it | Quoted per client |

There is a second, separate business running through the same console: the **creator app**
(Inflink), where creators apply to barter, cashback and paid-deal campaigns themselves. It
has its own campaign types, its own participants, its own reliability scoring and its own
payouts. It shares the console but almost none of the agency lifecycle below.

---

## 3. The lifecycle, end to end

This is the spine. Every internal role sits somewhere on it.

```
  BRAND IN           QUOTE              CONFIRM            COST              ENROLMENT
  ────────           ─────              ───────            ────              ─────────
  brand added   →    roster built  →    client picks  →    real cost    →    link raised
  to the book        and priced         and locks          settled           and signed
                                        it                 per creator
                                                                                  │
                                                                                  ▼
  PAY                APPROVE            DELIVER            CAMPAIGN          PAYEE
  ───                ───────            ───────            ────────          ─────
  payment       ←    payable       ←    content       ←    campaign     ←    bank details
  marked paid        approved           approved           opens             confirmed
```

**Where the money facts live.** A quote carries a *sell* price snapshot per creator. The
campaign carries the *cost* actually negotiated (`campaign_creators.agreed_rate_cents`). The
gap between them is the margin, and it is the reason the cost scope exists at all.

**The join between quote and campaign.** Confirming a proposal stops at
`status='client_confirmed'` and opens no campaign, deliberately, so a human can settle costs
first. Half a confirmed roster can therefore have no campaign row and no enrolment link yet.
Any dashboard that counts "live campaigns" will disagree with one that counts "confirmed
creators", and both are right.

---

## 4. The modules and how they connect

| Module | Feeds | Is fed by |
|---|---|---|
| Brands / Clients | Quotes, Campaigns | Business development |
| Creators (master database) | Quotes, Rosters, Enrolments | Talent; the analytics pipeline |
| Rosters (`imd_lists`) | Quotes | Client sourcing requests |
| Quotes / Proposals | Campaigns | Brands + Creators |
| Campaigns | Deliverables, Payables | A confirmed quote |
| Enrolments | Payables, Inflink accounts | A settled cost |
| Payables (`creator_payables`) | Finance | Enrolment instalments; manual bookings |
| Approvals | Payables, releases | Anything leadership-gated |
| Coverage | Talent's sourcing priorities | Gaps between demand and the database |
| Creator app (FA) | Its own payouts and reliability | Creators applying in the app |

**Two feeds that surprise people, and matter for dashboards:**

1. **An enrolment instalment IS a payable.** They are rows in `creator_payables` carrying
   `enrolment_link_id`. Finance and Enrolments are therefore two views of one table, and a
   redesign must not let them drift into two numbers.
2. **`sourcing_rounds` is dead.** Rosters (`imd_lists`) replaced it, but goals, the brand
   heartbeat and the TV wall still read the empty table. Any dashboard built on those
   numbers will read zero forever.

---

## 5. Roles, and exactly what the system enforces

There are **four money scopes**, resolved in `app/core/field_policy.py::resolve_scope`:

| Scope | Granted to |
|---|---|
| `leadership` | `role` in (`super_admin`, `superadmin`, `admin`), or `staff_role` in (`ceo`, `cofounder`) |
| `talent` | `staff_role` = `talent_manager` |
| `account` | `staff_role` = `account_manager` **or** `business_development` |
| `none` | everybody else |

**Business development and account management share one scope, deliberately.** The code
comment states the reason: both quote the same sell prices and neither is ever to learn cost.
They get different sidebars and different daily work, but identical money visibility. This is
a business decision and the redesign does not touch it.

**The co-founder is not a superadmin.** She is `role='user'` with `staff_role='cofounder'`,
and reaches leadership through `staff_role`, not `role`. Anything gated on
`require_superadmin` locks her out. Gates must be written on the scope, never the role.

### Leadership-only gates

Eighteen enforcement points across the API. These are the acts only leadership may perform:

- settling a creator's negotiated cost
- approving a payable
- marking a payable paid, behind a funded-balance guard that refuses to pay out what the
  client has not funded
- pulling the payout file, the only place the full IBAN appears
- the roster export, which carries signature and payee facts

Everything else is open to talent, account or both.

---

## 6. The handoff map

Read from the gates, not from an opinion about how an agency should work.

| Stage | Who can act | What unblocks the next person |
|---|---|---|
| Brand added and warmed | Business development | A brand worth quoting |
| Quote built, priced, shared | Bizdev or Account (`account` scope) | A client with something to say yes to |
| Client confirms and locks | The client, on `/p/{token}` | `locked_at` set on each creator |
| **Cost settled per creator** | **Leadership only** | `agreed_rate_cents` set, which is what makes a creator appear in Enrolments |
| Enrolment link raised and sent | Talent or leadership | A creator who can sign |
| Creator signs | The creator, on `/e/{token}` | Instalments created as payables |
| Payee confirmed by voice | Talent or leadership, never account | A payable that is allowed to pay out |
| **Payable approved** | **Leadership only** | A payment cleared to send |
| **Payment marked paid** | **Leadership only** | Creator emailed, Inflink history posted |
| Deliverables chased | Talent, and Account on their clients | Content the client can approve |

**The two structural bottlenecks are both leadership**, and both sit in the middle of
somebody else's job: talent cannot raise a link until a cost is settled, and cannot tell a
creator they have been paid until leadership marks it. Talent's dashboard should therefore
show what they are waiting on, and leadership's should show what is waiting on them. That is
the single most useful thing this overhaul can do.

---

## 7. Where superadmin sits

Superadmin is not a fifth department. It is leadership scope plus every module permission,
plus the operational surfaces nobody else needs: system configuration, staff and user
administration, notification and WhatsApp channels, office displays, and the creator app's
administration.

For the redesign: **superadmin's dashboard is a command centre, not a role dashboard.** It
rolls up the four role views and drills into any of them. It loses nothing it has today.

---

## 8. Per-role deep dives

> Phase 1b. Written once the feature inventory lands, so that "every page, action and
> permission" comes from the code rather than from memory. Each role's section covers: their
> day, their pages and permissions, what they wait on and who waits on them, what on-track
> means and which numbers prove it, and the pain visible in the current UI.
>
> A dashboard may not be designed for a role whose deep dive is not finished.

- [ ] Talent manager
- [ ] Business development
- [ ] Account management
- [ ] Leadership
- [ ] Superadmin
