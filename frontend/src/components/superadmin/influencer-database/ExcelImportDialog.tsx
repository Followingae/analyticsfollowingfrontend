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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

interface ImportResult {
  imported: number
  updated: number
  errors: Array<{ row: number; error: string }>
  total_processed: number
}

export function ExcelImportDialog({ open, onOpenChange, onImportComplete }: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
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
    } catch (err) {
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
      delete (headers as any)["Content-Type"] // Let browser set multipart boundary

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

      if (data.data.imported > 0 || data.data.updated > 0) {
        toast.success(`Imported ${data.data.imported}, updated ${data.data.updated} influencers`)
        onImportComplete()
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed")
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Influencers from Excel</DialogTitle>
          <DialogDescription>
            Upload an .xlsx file to bulk import or update influencers in the master database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <Button variant="link" className="p-0 h-auto" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download template (.xlsx)
          </Button>

          {/* File Drop Zone */}
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

          {/* Import Results */}
          {result && (
            <div className="space-y-2">
              <Alert variant={result.errors.length > 0 ? "destructive" : "default"}>
                {result.errors.length > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>Import Complete</AlertTitle>
                <AlertDescription>
                  <div className="flex gap-4 mt-1">
                    <Badge variant="default">{result.imported} imported</Badge>
                    <Badge variant="secondary">{result.updated} updated</Badge>
                    {result.errors.length > 0 && (
                      <Badge variant="destructive">{result.errors.length} errors</Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
