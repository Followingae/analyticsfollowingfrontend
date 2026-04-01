"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import { superadminApiService } from "@/services/superadminApi"
import type { BulkImportResult } from "@/types/influencerDatabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Users,
  Coins,
} from "lucide-react"
import { PostImportPricingStep } from "./PostImportPricingStep"

export function BulkImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rawText, setRawText] = useState("")
  const [parsedUsernames, setParsedUsernames] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showPricingStep, setShowPricingStep] = useState(false)

  const parseUsernames = useCallback((text: string) => {
    const names = text
      .split(/[\n,;]+/)
      .map((u) => u.trim().replace(/^@/, ""))
      .filter((u) => u.length > 0)
    const unique = [...new Set(names)]
    setParsedUsernames(unique)
    return unique
  }, [])

  const handleTextChange = (text: string) => {
    setRawText(text)
    parseUsernames(text)
    setResult(null)
  }

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Please upload a CSV or TXT file")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setRawText(content)
      parseUsernames(content)
      setResult(null)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleImport = async () => {
    if (parsedUsernames.length === 0) {
      toast.error("No usernames to import")
      return
    }
    try {
      setImporting(true)
      setProgress(10)
      const res = await superadminApiService.bulkImportInfluencers(parsedUsernames)
      setProgress(100)
      if (res.success && res.data) {
        const data = res.data as BulkImportResult
        setResult(data)
        toast.success(`Import complete: ${data.added.length} added`)
      } else {
        toast.error(res.error || "Import failed")
      }
    } catch {
      toast.error("Import failed")
    } finally {
      setImporting(false)
    }
  }

  const resultDetails = result
    ? [
        ...result.added.map((r) => ({ username: r.username, status: "added" as const, reason: null })),
        ...result.skipped.map((r) => ({ username: r.username, status: "skipped" as const, reason: r.reason })),
        ...result.failed.map((r) => ({ username: r.username, status: "failed" as const, reason: r.reason })),
      ]
    : []

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Input */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Paste Usernames</p>
            <p className="text-xs text-muted-foreground mb-3">
              One per line, or separated by commas. Analytics will be queued automatically for each.
            </p>
            <Textarea
              placeholder={"username1\nusername2\nusername3"}
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or upload a file</span>
            </div>
          </div>

          {/* File drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Drop a CSV or TXT file, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedUsernames.length > 0 && !result && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">Preview</p>
              </div>
              <Badge variant="secondary" className="text-xs tabular-nums">
                {parsedUsernames.length} username{parsedUsernames.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {parsedUsernames.slice(0, 100).map((u) => (
                <Badge key={u} variant="outline" className="text-xs font-mono">
                  @{u}
                </Badge>
              ))}
              {parsedUsernames.length > 100 && (
                <Badge variant="secondary" className="text-xs">
                  +{parsedUsernames.length - 100} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Results */}
      {result && !showPricingStep && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="text-xl font-bold text-green-600 tabular-nums">{result.added.length}</div>
                <p className="text-[11px] text-muted-foreground">Added</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <AlertCircle className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
                <div className="text-xl font-bold text-yellow-600 tabular-nums">{result.skipped.length}</div>
                <p className="text-[11px] text-muted-foreground">Skipped</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <XCircle className="h-4 w-4 mx-auto mb-1 text-red-600" />
                <div className="text-xl font-bold text-red-600 tabular-nums">{result.failed.length}</div>
                <p className="text-[11px] text-muted-foreground">Failed</p>
              </div>
            </div>

            {/* Analytics notice */}
            {result.added.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {result.added.length} creator{result.added.length !== 1 ? "s are" : " is"} being
                  analyzed in the background. Check the database page for real-time progress.
                </AlertDescription>
              </Alert>
            )}

            {/* Detail list */}
            {resultDetails.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {resultDetails.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50 text-sm">
                    <span className="font-mono text-xs">@{r.username}</span>
                    <div className="flex items-center gap-2">
                      {r.reason && (
                        <span className="text-xs text-muted-foreground max-w-[200px] truncate">{r.reason}</span>
                      )}
                      <Badge
                        variant={r.status === "added" ? "default" : r.status === "skipped" ? "secondary" : "destructive"}
                        className="text-[10px] px-1.5"
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing step */}
      {result && showPricingStep && (
        <PostImportPricingStep
          importedIds={result.added.map((a) => a.id)}
          importedUsernames={result.added.map((a) => a.username)}
          onComplete={() => {
            setResult(null)
            setRawText("")
            setParsedUsernames([])
            setShowPricingStep(false)
          }}
          onSkip={() => {
            setResult(null)
            setRawText("")
            setParsedUsernames([])
            setShowPricingStep(false)
          }}
        />
      )}

      {/* Action */}
      {!result && (
        <Button
          onClick={handleImport}
          disabled={importing || parsedUsernames.length === 0}
          className="w-full"
          size="lg"
        >
          {importing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Import {parsedUsernames.length} Creator{parsedUsernames.length !== 1 ? "s" : ""}
        </Button>
      )}

      {result && !showPricingStep && (
        <div className="flex gap-3">
          {result.added.length > 0 && (
            <Button
              className="flex-1 gap-2"
              onClick={() => setShowPricingStep(true)}
            >
              <Coins className="h-4 w-4" />
              Set Pricing for {result.added.length} Imported Creator{result.added.length !== 1 ? "s" : ""}
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setResult(null)
              setRawText("")
              setParsedUsernames([])
            }}
          >
            Import More
          </Button>
        </div>
      )}
    </div>
  )
}
