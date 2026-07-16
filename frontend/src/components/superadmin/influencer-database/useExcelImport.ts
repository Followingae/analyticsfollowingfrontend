"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import type {
  ExcelImportPreview,
  ExcelImportResult,
  ImportPreviewRow,
} from "@/types/influencerDatabase"

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/influencer-database`

export type ImportStep = "upload" | "review" | "result"

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.detail || body?.message || fallback
  } catch {
    return fallback
  }
}

/**
 * Upload → preview → review → commit. Nothing is written until commit(), so a bad file
 * can be inspected and thrown away instead of landing in the master database.
 */
export function useExcelImport(onImported?: () => void) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null)
  const [result, setResult] = useState<ExcelImportResult | null>(null)

  const selectFile = useCallback((selected: File) => {
    if (!selected.name.endsWith(".xlsx") && !selected.name.endsWith(".xls")) {
      toast.error("Please select an .xlsx or .xls file")
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB")
      return
    }
    setFile(selected)
    setPreview(null)
    setResult(null)
  }, [])

  const downloadTemplate = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE}/template/download`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error("Failed to download template")
      const blob = await res.blob()
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
  }, [])

  /** Parse + validate server-side. Writes nothing. */
  const runPreview = useCallback(async () => {
    if (!file) return
    setPreviewing(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const headers = getAuthHeaders()
      delete (headers as Record<string, string>)["Content-Type"]

      const res = await fetchWithAuth(`${BASE}/import/excel/preview`, {
        method: "POST",
        headers,
        body: form,
      })
      if (!res.ok) throw new Error(await readError(res, "Could not read that file"))

      const body = await res.json()
      const data: ExcelImportPreview = body.data
      if (!data.rows?.length) {
        toast.error("No rows with a username were found in that file")
        return
      }
      setPreview(data)
      setStep("review")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not read that file")
    } finally {
      setPreviewing(false)
    }
  }, [file])

  /** Write the reviewed rows — operator edits included. */
  const commit = useCallback(
    async (rows: ImportPreviewRow[]) => {
      setCommitting(true)
      try {
        const res = await fetchWithAuth(`${BASE}/import/excel/commit`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ rows: rows.filter((r) => !r.blocked) }),
        })
        if (!res.ok) throw new Error(await readError(res, "Import failed"))

        const body = await res.json()
        const data: ExcelImportResult = body.data
        setResult(data)
        setStep("result")

        if (data.imported > 0 || data.updated > 0) {
          toast.success(`Imported ${data.imported}, updated ${data.updated}`)
          onImported?.()
        } else {
          toast.error("Nothing was imported")
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Import failed")
      } finally {
        setCommitting(false)
      }
    },
    [onImported]
  )

  const reset = useCallback(() => {
    setStep("upload")
    setFile(null)
    setPreview(null)
    setResult(null)
  }, [])

  const backToUpload = useCallback(() => {
    setStep("upload")
    setPreview(null)
  }, [])

  return {
    step, file, preview, result, previewing, committing,
    selectFile, downloadTemplate, runPreview, commit, reset, backToUpload,
  }
}
