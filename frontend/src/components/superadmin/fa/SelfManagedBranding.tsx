"use client"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { ImageIcon, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { faMerchantApi } from "@/services/faAdminApi"

/**
 * Branding uploader for self-managed (team-managed) FA campaigns.
 *
 * A merchant campaign inherits its logo from the merchant record, but a team-managed
 * campaign may have no merchant — so the operator sets the logo + landing cover here.
 * Uploads to the public CDN bucket via the existing /merchants/logo endpoint and hands
 * back the CDN URLs, which the create payload persists to campaigns.brand_logo_url /
 * hero_image_url. Shown for every FA campaign type in self-managed mode.
 */
export function SelfManagedBranding({
  brandLogoUrl, heroImageUrl, onBrandLogoChange, onHeroImageChange,
}: {
  brandLogoUrl: string
  heroImageUrl: string
  onBrandLogoChange: (url: string) => void
  onHeroImageChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState<"logo" | "hero" | null>(null)

  const upload = async (file: File, kind: "logo" | "hero") => {
    if (!file) return
    setUploading(kind)
    try {
      const res = await faMerchantApi.uploadLogo(file)
      const url = res?.data?.url || res?.url
      if (!url) throw new Error("Upload returned no URL")
      if (kind === "logo") onBrandLogoChange(url)
      else onHeroImageChange(url)
      toast.success(kind === "logo" ? "Logo uploaded" : "Cover image uploaded")
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload image")
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-dashed p-4">
      <p className="text-sm text-muted-foreground">
        Team-managed — add the branding creators will see. Optional; falls back to the merchant logo when a merchant is selected.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Brand Logo"
          url={brandLogoUrl}
          uploading={uploading === "logo"}
          onPick={(f) => upload(f, "logo")}
          onClear={() => onBrandLogoChange("")}
        />
        <Field
          label="Landing Cover"
          url={heroImageUrl}
          uploading={uploading === "hero"}
          onPick={(f) => upload(f, "hero")}
          onClear={() => onHeroImageChange("")}
        />
      </div>
    </div>
  )
}

function Field({
  label, url, uploading, onPick, onClear,
}: {
  label: string
  url: string
  uploading: boolean
  onPick: (file: File) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {url ? (
        <div className="relative w-full h-28 rounded-md border overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 rounded-full bg-background/80 p-1 hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-28 rounded-md border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Click to upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = "" }}
          />
        </label>
      )}
    </div>
  )
}
