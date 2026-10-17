# Role guides

One guide per internal role, in business steps. These are the source of truth for the
printable handouts and they share their words with the in-product playbook at
`frontend/src/components/console/rolePlaybooks.ts`, which is what `/work/guide` renders.

Change a guide here, then regenerate the PDFs:

    node scripts/make-role-guides.mjs "docs/role-guides" "frontend/public/guides"

and rename the output to the URL-safe names the playbook links to
(`talent-manager.pdf`, `account-manager.pdf`, `business-development.pdf`,
`co-founder.pdf`, `founder-ceo.pdf`).

If you change how the work runs, change both: the guide a person prints and the playbook they
read on the screen. A guide that disagrees with the product is worse than no guide, because
people stop checking it and start asking each other again.
