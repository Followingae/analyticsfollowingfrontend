import { redirect } from "next/navigation"

// One canonical login: /auth/login (the SignInPage: email and password, plus Google).
// There has never been Instagram OAuth on this page; that lives in the creator app only.
// This route survives only as a bookmark redirect.
export default function LegacyLoginRedirect() {
  redirect("/auth/login")
}
