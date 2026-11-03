import { redirect } from "next/navigation"

/**
 * /superadmin used to render the old founders' dashboard. Nothing in the console links here
 * any more: everyone internal lands on Today, and a URL that says "superadmin" is the wrong
 * front door for a talent manager. Anyone who types it, or follows an old bookmark, is sent
 * to Today. The dashboard components themselves are kept; only this entry point moved.
 */
export default function SuperadminRoot() {
  redirect("/work/today")
}
