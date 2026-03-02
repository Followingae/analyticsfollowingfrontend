"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import { superadminApiService } from "@/services/superadminApi"
import type { BulkImportResult } from "@/types/influencerDatabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, FileText, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function BulkImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rawText, setRawText] = useState("")
  const [parsedUsernames, setParsedUsernames] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const parseUsernames = useCallback((text: string) => {
    const names = text
      .split(/[\n,;]+/)
      .map((u) => u.trim().replace(/^@/, ""))
      .filter((u) => u.length > 0)
    // Deduplicate
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

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

  // Flatten result arrays for the details table
  const resultDetails = result
    ? [
        ...result.added.map((r) => ({ username: r.username, status: "added" as const, reason: null })),
        ...result.skipped.map((r) => ({ username: r.username, status: "skipped" as const, reason: r.reason })),
        ...result.failed.map((r) => ({ username: r.username, status: "failed" as const, reason: r.reason })),
      ]
    : []

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Paste Usernames</CardTitle>
          <CardDescription>Enter one username per line, or separate with commas</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={"username1\nusername2\nusername3"}
            value={rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Or Upload CSV</CardTitle>
          <CardDescription>Drag and drop a CSV/TXT file with one username per line</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop a CSV or TXT file here, or click to browse
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

      {parsedUsernames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Preview ({parsedUsernames.length} usernames)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Username</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedUsernames.slice(0, 50).map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-sm">@{u}</TableCell>
                    </TableRow>
                  ))}
                  {parsedUsernames.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        ... and {parsedUsernames.length - 50} more
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-xl font-bold text-green-600">{result.added.length}</div>
                <p className="text-xs text-muted-foreground">Added</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <AlertCircle className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                <div className="text-xl font-bold text-yellow-600">{result.skipped.length}</div>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
                <div className="text-xl font-bold text-red-600">{result.failed.length}</div>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
            {resultDetails.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultDetails.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">@{r.username}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "added"
                                ? "default"
                                : r.status === "skipped"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.reason || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
        Import {parsedUsernames.length} Influencer{parsedUsernames.length !== 1 ? "s" : ""}
      </Button>
    </div>
  )
}
