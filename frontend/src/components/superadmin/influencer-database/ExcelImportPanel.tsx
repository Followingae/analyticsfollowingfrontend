"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Info,
  X,
  DollarSign,
} from "lucide-react"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import type { ExcelImportResult } from "@/types/influencerDatabase"
import { PostImportPricingStep } from "./PostImportPricingStep"

export function ExcelImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ExcelImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

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

  const handleFileSelect = (selected: File) => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult(null)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const headers = getAuthHeaders()
      delete (headers as Record<string, string>)["Content-Type"]

      setProgress(30)

      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/influencer-database/import/excel`,
        { method: "POST", headers, body: formData }
      )

      setProgress(80)

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || "Import failed")
      }

      const data = await response.json()
      setProgress(100)
      setResult(data.data)
      setStep(2)

      if (data.data.imported > 0 || data.data.updated > 0) {
        toast.success(`Imported ${data.data.imported}, updated ${data.data.updated} influencers`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed"
      toast.error(message)
    } finally {
      setImporting(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setResult(null)
    setProgress(0)
    setStep(1)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
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

      {/* Step 1: Upload */}
      {step === 1 && (
        <>
          {/* Template download */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Excel Template</p>
                  <p className="text-xs text-muted-foreground">
                    Only username is required. Analytics populate automatically. Set pricing in the app after import.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleDownloadTemplate}>
                  <Download className="h-3.5 w-3.5" />
                  Download .xlsx
                </Button>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 space-y-0.5">
                <p><span className="font-medium">Required:</span> username (column A)</p>
                <p><span className="font-medium">Optional:</span> status, tier, categories, tags, internal notes</p>
              </div>
            </CardContent>
          </Card>

          {/* File upload */}
          <Card>
            <CardContent className="pt-5">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : file
                      ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                      : "border-muted-foreground/20 hover:border-primary/50"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {(file.size / 1024).toFixed(0)} KB
                    </Badge>
                    <button
                      className="ml-1 p-0.5 rounded-full hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Drop an .xlsx file here, or click to browse
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {importing && (
            <Card>
              <CardContent className="pt-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Importing...
                    </span>
                    <span className="text-muted-foreground tabular-nums">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action */}
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {file ? `Import ${file.name}` : "Select a file to import"}
          </Button>
        </>
      )}

      {/* Step 2: Results */}
      {step === 2 && result && (
        <>
          <Card>
            <CardContent className="pt-5 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <div className="text-xl font-bold text-green-600 tabular-nums">{result.imported}</div>
                  <p className="text-[11px] text-muted-foreground">Imported</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <RefreshCw className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                  <div className="text-xl font-bold text-blue-600 tabular-nums">{result.updated}</div>
                  <p className="text-[11px] text-muted-foreground">Updated</p>
                </div>
                {result.analytics_queued > 0 && (
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <Loader2 className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                    <div className="text-xl font-bold text-purple-600 tabular-nums">{result.analytics_queued}</div>
                    <p className="text-[11px] text-muted-foreground">Analytics Queued</p>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-600" />
                    <div className="text-xl font-bold text-red-600 tabular-nums">{result.errors.length}</div>
                    <p className="text-[11px] text-muted-foreground">Errors</p>
                  </div>
                )}
              </div>

              {/* Analytics notice */}
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

              {/* Error details */}
              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50 text-sm">
                      <span className="text-xs text-muted-foreground">Row {e.row}</span>
                      <span className="text-xs text-destructive max-w-[300px] truncate">{e.error}</span>
                    </div>
                  ))}
                  {result.errors.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      ...and {result.errors.length - 20} more errors
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            {result.imported > 0 && (
              <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
                <DollarSign className="h-4 w-4" />
                Set Pricing
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={resetForm}>
              Import Another File
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <PostImportPricingStep
          importedIds={result?.imported_ids || []}
          importedUsernames={result?.imported_usernames || []}
          onComplete={resetForm}
          onSkip={resetForm}
        />
      )}
    </div>
  )
}
