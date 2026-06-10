import { redirect } from "next/navigation"

// User management has one canonical home: /superadmin/users.
export default function LegacyAdminUsersRedirect() {
  redirect("/superadmin/users")
}
