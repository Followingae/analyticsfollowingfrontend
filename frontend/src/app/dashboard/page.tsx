import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { BrandDashboardContent } from "@/components/brand/BrandDashboardContent"
import { AuthGuard } from "@/components/AuthGuard"

export default function Page() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <BrandDashboardContent />
      </BrandUserInterface>
    </AuthGuard>
  )
}
