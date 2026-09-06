# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary buyer:** a marketing manager or brand strategist at a UAE brand or agency, 25 to 45,
who needs to pick Instagram creators for a campaign and justify the choice. They work in
fast-paced conditions, usually with a campaign already in motion.

**Secondary:** Following's own staff, who run the same platform internally under a separate
console (talent, business development, account management, leadership). Their surfaces are
Operate mode and are out of scope for the buying funnel.

## Jobs

1. Work out who to hire: search creators, read numbers that are actually measured, shortlist.
2. Get the campaign made: brief creators, take priced offers, award, and run it to delivery.
3. Pay everybody without forty supplier records: one invoice to Following, Following pays out.
4. Hand the whole thing over: Following's team sources, negotiates, runs and reports.

Those four jobs are the product's own names for itself: Find, Run, Merchant of Record, Manage.

## Positioning

The mechanism that is meaningfully different is **measurement honesty**. Engagement is computed
against views rather than followers, a failed scrape is reported as failed rather than shown as
a zero, and a section with no data is not rendered at all. Competitors show a number for
everything. This product would rather show nothing than a number it cannot stand behind.

The second difference is that the agency and the software are the same company, so a brand can
move from self-serve to fully managed without changing tool or exporting anything.

## Free plan

Free is deliberately **two things at once**, confirmed with the founder:

1. A trial that is meant to end. 125 credits and 5 creator unlocks a month is not a working
   allowance for a real brand, so a genuine buyer hits the wall almost immediately. That wall
   is the sales argument and the funnel should let it be felt rather than soften it.
2. A lead magnet. Capturing the account has value on its own, because Following's business
   development team sells into it afterwards. An abandoned payment that leaves no account
   behind is a lost lead, not just a lost sale.

Both readings point the same way: **the account is worth having even when the payment is not
completed**, which is why account creation stays ahead of the card.

## Constraints that future work must preserve

- **Never print a price the server did not name.** Prices come from the live pricing response
  and are rendered in the currency that response states. Merchant of Record and Manage are
  marked in the backend as placeholders that are not agreed prices, so they are quoted, never
  numbered.
- **Never print a limit the server does not enforce.** Allowances come from `PLAN_LIMITS`,
  which mirrors `app/core/plans.py`.
- **An unlock passes two gates**, and both go on a page or neither does: a monthly count cap,
  and 25 credits in the wallet. Buying credits moves the second gate and never the first.
- **Brands never see cost pricing.** Only sell pricing, enforced on the server.
- **Paying requires an account.** `POST /checkout/create-session` depends on an authenticated
  team owner. A card-before-account flow would need a new unauthenticated money path and
  webhook-driven account creation; the founder delegated this decision and it was resolved in
  favour of keeping the existing, working money path.
- **Seats cannot be bought.** `max_team_members` is a hard cap with no purchase path anywhere.
  State the seat count and route "we need more" at a person.

## Terminology

Credits, unlocks, plan, module, add-on, brief, deliverable, payout. A "module" is one of the
four jobs above. A "plan" is only ever how much of Find you get.

## Evidence and assets

Live Stripe pricing in AED with VAT and a 20% annual discount, verified against production.
No customer testimonials, logos, case studies or benchmark numbers are confirmed as usable, so
none may be invented for a marketing surface.

## Open decisions

- Which plan the business wants to recommend by default. Not yet answered; until it is, the
  funnel must not fabricate a "most popular" badge.
- Whether annual should be the default selection. It is a real revenue lever and also a larger
  default charge, so it stays opt-in until the founder decides.

## Inferred, not confirmed

- The reason a brand buys on the day they arrive is taken to be that Free's five unlocks a
  month are exhausted immediately at real volume. This was inferred from the plan limits and
  from the founder's answer that Free is a trial meant to end; the question that would have
  confirmed it directly was not understood and was not re-asked.
