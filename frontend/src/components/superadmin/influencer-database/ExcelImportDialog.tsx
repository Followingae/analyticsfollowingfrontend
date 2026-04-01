"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, RefreshCw, Info, Coins } from "lucide-react"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import type { ExcelImportResult } from "@/types/influencerDatabase"
import { PostImportPricingStep } from "./PostImportPricingStep"

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function ExcelImportDialog({ open, onOpenChange, onImportComplete }: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ExcelImportResult | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/influencer-database/template/download`,
        { headers: getAuthHeaders() }
      )
      if (!response.ok) throw new Error("Failed to download template")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "influencer_import_template.xlsx"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Template downloaded")
    } catch {
      toast.error("Failed to download template")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (!selected.name.endsWith(".xlsx") && !selected.name.endsWith(".xls")) {
        toast.error("Please select an .xlsx or .xls file")
        return
      }
      if (selected.size > 5 * 1024 * 1024) {
        toast.error("File size must be under 5MB")
        return
      }
      setFile(selected)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const headers = getAuthHeaders()
      delete (headers as Record<string, string>)["Content-Type"]

      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/influencer-database/import/excel`,
        { method: "POST", headers, body: formData }
      )

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || "Import failed")
      }

      const data = await response.json()
      setResult(data.data)
      setStep(2)

      if (data.data.imported > 0 || data.data.updated > 0) {
        toast.success(`Imported ${data.data.imported}, updated ${data.data.updated} influencers`)
        onImportComplete()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed"
      toast.error(message)
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setStep(1)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === 3 ? "sm:max-w-2xl" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle>Import Influencers from Excel</DialogTitle>
          <DialogDescription>
            Upload an .xlsx file to bulk import or update influencers in the master database.
          </DialogDescription>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[
              { num: 1, label: "Upload" },
              { num: 2, label: "Results" },
              { num: 3, label: "Pricing" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-border" />}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step === s.num
                        ? "bg-primary text-primary-foreground"
                        : step > s.num
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="h-3.5 w-3.5" /> : s.num}
                  </div>
                  <span className={`text-xs ${step === s.num ? "font-medium" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Upload */}
          {step === 1 && (
            <>
              <Button variant="link" className="p-0 h-auto" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download template (.xlsx)
              </Button>

              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="outline">{(file.size / 1024).toFixed(0)} KB</Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to select an .xlsx file</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 2: Results */}
          {step === 2 && result && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <CheckCircle className="h-4 w-4 mx-auto mb-0.5 text-green-600" />
                  <div className="text-lg font-bold text-green-600">{result.imported}</div>
                  <p className="text-[11px] text-muted-foreground">Imported</p>
                </div>
                <div className="text-center p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <RefreshCw className="h-4 w-4 mx-auto mb-0.5 text-blue-600" />
                  <div className="text-lg font-bold text-blue-600">{result.updated}</div>
                  <p className="text-[11px] text-muted-foreground">Updated</p>
                </div>
                {result.analytics_queued > 0 && (
                  <div className="text-center p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <Loader2 className="h-4 w-4 mx-auto mb-0.5 text-purple-600" />
                    <div className="text-lg font-bold text-purple-600">{result.analytics_queued}</div>
                    <p className="text-[11px] text-muted-foreground">Analytics Queued</p>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="text-center p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 mx-auto mb-0.5 text-red-600" />
                    <div className="text-lg font-bold text-red-600">{result.errors.length}</div>
                    <p className="text-[11px] text-muted-foreground">Errors</p>
                  </div>
                )}
              </div>

              {result.analytics_queued > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.analytics_queued} creator{result.analytics_queued !== 1 ? "s are" : " is"} being
                    analyzed in the background. Check the database page for real-time progress.
                  </AlertDescription>
                </Alert>
              )}

              {/* Analytics failures */}
              {result.analytics_failures?.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.analytics_failures.length} creator{result.analytics_failures.length !== 1 ? "s" : ""} failed analytics queueing:
                    {result.analytics_failures.slice(0, 5).map((f) => (
                      <span key={f.username} className="block ml-2">@{f.username}: {f.reason}</span>
                    ))}
                    {result.analytics_failures.length > 5 && (
                      <span className="block ml-2">...and {result.analytics_failures.length - 5} more</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Queue health indicator */}
              {result.queue_status && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      result.queue_status.utilization_percent < 70
                        ? "bg-green-500"
                        : result.queue_status.utilization_percent < 90
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  Queue: {result.queue_status.depth}/{result.queue_status.max_depth} ({result.queue_status.utilization_percent}% utilized)
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-xs space-y-1 p-2 bg-muted rounded">
                  {result.errors.slice(0, 10).map((e, i) => (
                    <div key={i} className="text-destructive">
                      Row {e.row}: {e.error}
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <div className="text-muted-foreground">...and {result.errors.length - 10} more</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <PostImportPricingStep
              importedIds={result?.imported_ids || []}
              importedUsernames={result?.imported_usernames || []}
              onComplete={handleClose}
              onSkip={handleClose}
            />
          )}
        </div>

        {/* Footer - hidden in step 3 */}
        {step !== 3 && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {result ? "Close" : "Cancel"}
            </Button>
            {step === 1 && (
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {file ? file.name : ""}
                  </>
                )}
              </Button>
            )}
            {step === 2 && result && result.imported > 0 && (
              <Button className="gap-2" onClick={() => setStep(3)}>
                <Coins className="h-4 w-4" />
                Set Pricing
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
