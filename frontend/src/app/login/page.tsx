import { redirect } from "next/navigation"

// One canonical login: /auth/login (richer SignInPage incl. Instagram OAuth).
// This route survives only as a bookmark redirect.
export default function LegacyLoginRedirect() {
  redirect("/auth/login")
}
