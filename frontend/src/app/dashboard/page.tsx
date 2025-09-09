import { UnifiedApp } from "@/components/UnifiedApp"
import { AuthGuard } from "@/components/AuthGuard"

export default function Page() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedApp />
    </AuthGuard>
  )
}
