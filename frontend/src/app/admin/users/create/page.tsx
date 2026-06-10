import { redirect } from "next/navigation"

// One create-user form: /superadmin/users/create (Brand/Admin toggle + modules).
export default function LegacyAdminCreateUserRedirect() {
  redirect("/superadmin/users/create")
}
