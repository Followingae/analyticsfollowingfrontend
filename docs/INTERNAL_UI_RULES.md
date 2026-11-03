# Internal UI rules (founder brief, 2026-11-03)

"HEAVILY dumb-ified. Simple easy buttons. Less things per screen. Less text-heavy components.
This does not mean we remove a single thing. Connecting, wiring, cleaning, optimizing."
Applies to EVERY internal screen (/work, /superadmin, /ops, /staff), for the whole team.

## The test for every screen
Someone opens it cold. In 3 seconds they must know: what this is, what needs them, and which
button to press. If they can't, the screen fails.

## Rules
1. **One header line.** Title + at most one short sub (max ~8 words). No paragraphs under titles.
2. **One primary action per screen, one per row.** The brand lime pill with ink text is the
   primary. Everything else is outline/ghost or lives in a "…" menu (DropdownMenu).
3. **Every row says its next step** as a short status ("Needs a rate", "Ready", "Waiting on client")
   plus the ONE button that moves it forward. If the next step belongs to someone else, say who
   ("Waiting on a founder"), no button.
4. **Explanations go behind ⓘ.** Any helper sentence longer than ~8 words becomes a Tooltip on an
   info icon, or is deleted if it repeats what the UI already shows. Never delete a capability.
5. **Secondary actions in "…".** Share, remove, export, copy link, edit details, view history.
6. **Fewer columns.** Show ~5 columns on a table. Extra detail goes in a row expand or a side Sheet.
7. **Filters, not scrolling.** Any list over ~15 rows gets: search box, 1-3 filter chips/selects,
   sort. Counts on tabs/chips. Default to the view the viewer can act on.
8. **No dead ends.** Every status links to where it is worked. After an action, say where the item
   went ("Moved to Ready") and offer the link. Every list item links to its detail.
9. **No empty placeholders.** No data, no section (except a single short line when a filter hides
   everything, with a Clear button).
10. **Words.** Plain English, verbs on buttons ("Add to proposal", not "Proceed"). No em dashes
    in UI copy. No internal jargon (round, cleared, struck) in labels; use what it means.
11. **Visual.** White-led, shadcn as installed, OKLCH tokens, lime only as a surface never as text.
    Consistent spacing; group by whitespace, not borders on everything. No new colours.
12. **Links stay in /work.** Never link to /superadmin/... when a /work route exists.
13. **Never expose cost to non-cost viewers.** Keep existing gates (`canSeeCost`, `canSeeMargin`,
    scrubbed fields) exactly as they are.

## Process for an agent cleaning an area
- Read every page in the area first. List each screen's capabilities so none are lost.
- Change in place. Reuse `components/console/primitives.tsx`, `Hub.tsx`, shadcn `ui/*`.
  Do NOT edit shared files (`Hub.tsx`, `primitives.tsx`, hub headers, `SuperAdminSidebar.tsx`,
  `next.config.ts`, `destinations.ts`) unless your brief says you own them.
- Type-check: `npx tsc --noEmit -p .` from `frontend/`; your touched files must have 0 errors
  (repo baseline has unrelated errors).
- Report: per screen, what changed, and confirm nothing was removed.
