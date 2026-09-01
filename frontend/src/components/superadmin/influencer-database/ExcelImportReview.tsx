"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertTriangle, ArrowLeft, BadgeCheck, ChevronDown, ChevronRight, Coins,
  Loader2, RefreshCw, SkipForward, Upload, XCircle,
} from "lucide-react"
import type {
  ExistingRowMode, ImportPreviewRow, ImportPreviewSummary,
} from "@/types/influencerDatabase"
import { Aed } from "@/components/console/primitives"
import { useAdminAccess } from "@/hooks/useAdminAccess"

// Reel first — it is the rate quoted in the overwhelming majority of deals, so it gets
// dedicated columns. The rest live behind the per-row expander.
const PRIMARY = "reel" as const
const SECONDARY = ["post", "story", "carousel", "video", "bundle", "monthly"] as const

/** A figure in dirhams, through the primitive that carries the glyph. The old helper
 *  built its own string around a raw U+20C3, which no system font has a glyph for: outside
 *  the one element that loads the Dirham face it came out as an empty box. */
function Dh({ n }: { n: number | null | undefined }) {
  if (n == null) return <span className="text-muted-foreground">–</span>
  return <Aed>{Number(n).toLocaleString("en-AE", { maximumFractionDigits: 2 })}</Aed>
}

const fmtNum = (n: number | null | undefined) =>
  n == null ? "–" : Number(n).toLocaleString("en-AE")

/** Margin on what we charge: (sell - cost) / sell. Null unless both sides are known. */
function marginPct(cost: number | null | undefined, sell: number | null | undefined): number | null {
  if (cost == null || sell == null || sell <= 0) return null
  return ((sell - cost) / sell) * 100
}

/**
 * The margin on a row, for the people allowed to know it.
 *
 * Margin is leadership only. Everyone else gets nothing here rather than a blank badge: cost
 * and sell are both on screen because the operator is typing them straight off their own
 * spreadsheet, but what we make on the difference is not theirs to read. Gated on the
 * resolved scope, never on an is-admin test, so the co-founder keeps it.
 */
function MarginBadge({ cost, sell }: { cost?: number | null; sell?: number | null }) {
  const { canSeeMargin } = useAdminAccess()
  const m = marginPct(cost, sell)
  if (!canSeeMargin) return null
  if (m == null) {
    return <span className="text-ds-caption text-muted-foreground">–</span>
  }
  const tone =
    m < 0
      ? { skin: "border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]", word: "at a loss" }
      : m < 15
        ? { skin: "border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]", word: "thin" }
        : { skin: "border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]", word: "healthy" }
  return (
    <Badge variant="outline" className={`font-semibold tabular-nums ${tone.skin}`} title={tone.word}>
      {m >= 0 ? "+" : ""}{m.toFixed(1)}%
    </Badge>
  )
}

function PriceInput({
  value, onChange, placeholder, invalid,
}: {
  value: number | null | undefined
  onChange: (v: number | null) => void
  placeholder?: string
  invalid?: boolean
}) {
  return (
    <Input
      type="number"
      min={0}
      step={50}
      inputMode="decimal"
      className={`h-9 w-28 tabular-nums ${invalid ? "border-destructive focus-visible:ring-destructive" : ""}`}
      placeholder={placeholder ?? "0"}
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value
        onChange(raw === "" ? null : Number(raw))
      }}
    />
  )
}

interface Props {
  rows: ImportPreviewRow[]
  summary: ImportPreviewSummary
  unknownColumns: string[]
  fileName: string
  committing: boolean
  existingMode: ExistingRowMode
  previewing: boolean
  onExistingModeChange: (mode: ExistingRowMode) => void
  onCommit: (rows: ImportPreviewRow[]) => void
  onBack: () => void
}

export function ExcelImportReview({
  rows: initialRows, summary, unknownColumns, fileName, committing,
  existingMode, previewing, onExistingModeChange, onCommit, onBack,
}: Props) {
  // Which sides of the money this operator may read. Same rule as the database table.
  const { canSeeCost, canSeeSell, canSeeMargin } = useAdminAccess()
  const [rows, setRows] = useState<ImportPreviewRow[]>(initialRows)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [onlyProblems, setOnlyProblems] = useState(false)

  // Switching skip/update re-previews server-side, so the rows prop changes underneath.
  // Without this the table keeps rendering the previous mode's labels and the operator
  // commits against something other than what they are looking at.
  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const setPrice = (rowNumber: number, key: string, v: number | null) => {
    setRows((prev) =>
      prev.map((r) => (r.row_number === rowNumber ? { ...r, [key]: v } : r))
    )
  }

  const toggle = (rowNumber: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(rowNumber)) next.delete(rowNumber)
      else next.add(rowNumber)
      return next
    })
  }

  // Totals reflect every priced deliverable, not just reel, so the blended margin is honest.
  const totals = useMemo(() => {
    let cost = 0
    let sell = 0
    let priced = 0
    for (const r of rows) {
      if (r.blocked) continue
      let rowHasSell = false
      for (const d of [PRIMARY, ...SECONDARY]) {
        const c = r[`cost_${d}_aed` as keyof ImportPreviewRow] as number | null
        const s = r[`sell_${d}_aed` as keyof ImportPreviewRow] as number | null
        if (s != null) { sell += s; rowHasSell = true }
        if (c != null) cost += c
      }
      if (rowHasSell) priced += 1
    }
    return { cost, sell, priced, margin: sell > 0 ? ((sell - cost) / sell) * 100 : null }
  }, [rows])

  const liveUnpriced = useMemo(
    () =>
      rows.filter(
        (r) =>
          !r.blocked &&
          ![PRIMARY, ...SECONDARY].some(
            (d) => (r[`sell_${d}_aed` as keyof ImportPreviewRow] as number | null) != null
          )
      ).length,
    [rows]
  )

  const importable = rows.filter((r) => !r.blocked)
  const visible = onlyProblems
    ? rows.filter((r) => r.blocked || r.issues.length > 0)
    : rows

  // What the button will actually write. In skip mode the already-present rows travel with
  // the request but are left alone, so promising to "import 200 creators" when 160 of them
  // will be untouched would be a lie told at the last possible moment.
  const willWrite = existingMode === "skip"
    ? importable.filter((r) => r.action !== "skip").length
    : importable.length

  return (
    <div className="space-y-4">
      {/* Summary bar — what is about to happen, before anything is written */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Review before importing</p>
              <p className="text-xs text-muted-foreground">
                Nothing is saved yet. Edit any price below, then import.
                <span className="ml-1 font-mono">{fileName}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onBack} disabled={committing}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Choose another file
              </Button>
              <Button
                size="sm"
                onClick={() => onCommit(rows)}
                disabled={committing || previewing || willWrite === 0}
              >
                {committing ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                )}
                {existingMode === "skip"
                  ? `Import ${willWrite} new creator${willWrite === 1 ? "" : "s"}`
                  : `Import ${willWrite} creator${willWrite === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Existing creators: skip or overwrite. Placed above the counts because it
              changes what every number below means. */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {summary.will_create + summary.will_update + summary.will_skip > 0 &&
                   (summary.will_update + summary.will_skip) > 0
                    ? `${summary.will_update + summary.will_skip} creator${
                        summary.will_update + summary.will_skip === 1 ? " is" : "s are"
                      } already in the database`
                    : "No creators in this file are already in the database"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {existingMode === "skip"
                    ? "Their stored pricing, tags and notes stay exactly as they are."
                    : "Their stored pricing, tags and notes will be overwritten by this file. This cannot be undone."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-md border bg-background p-1">
                <Button
                  size="sm"
                  variant={existingMode === "skip" ? "default" : "ghost"}
                  className="h-7 text-xs"
                  disabled={previewing || committing}
                  onClick={() => onExistingModeChange("skip")}
                >
                  <SkipForward className="mr-1.5 h-3.5 w-3.5" />
                  Skip existing
                </Button>
                <Button
                  size="sm"
                  variant={existingMode === "update" ? "default" : "ghost"}
                  className="h-7 text-xs"
                  disabled={previewing || committing}
                  onClick={() => onExistingModeChange("update")}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Update existing
                </Button>
              </div>
            </div>
            {existingMode === "update" && summary.will_update > 0 && (
              <Alert variant="destructive" className="mt-3 py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {summary.will_update} existing record{summary.will_update === 1 ? "" : "s"} will be
                  overwritten from this file, including any price that was negotiated after the
                  sheet was exported. There is no undo.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator className="my-4" />

          {/* Six counts, six boxes, six borders. They are all the same kind of thing laid
              out in a row, which is already everything a border was saying, so the boxes
              come off and the gap goes up a step instead. Cost, sell and margin appear only
              for the scope allowed to read them. */}
          <div className="flex flex-wrap gap-x-ds-5 gap-y-ds-3">
            <div>
              <p className="flex items-center gap-ds-1 text-ds-caption text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--tone-good-dot)]" aria-hidden />
                New
              </p>
              <div className="mt-ds-1 text-ds-heading tabular-nums">{summary.will_create}</div>
            </div>
            {existingMode === "skip" ? (
              <div>
                <p className="text-ds-caption text-muted-foreground">Left untouched</p>
                <div className="mt-ds-1 text-ds-heading tabular-nums">{summary.will_skip}</div>
              </div>
            ) : (
              <div>
                <p className="flex items-center gap-ds-1 text-ds-caption text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--tone-warn-dot)]" aria-hidden />
                  Overwritten
                </p>
                <div className="mt-ds-1 text-ds-heading tabular-nums">{summary.will_update}</div>
              </div>
            )}
            {canSeeCost && (
              <div>
                <p className="text-ds-caption text-muted-foreground">What it all costs</p>
                <div className="mt-ds-1 text-ds-heading tabular-nums"><Dh n={totals.cost} /></div>
              </div>
            )}
            {canSeeSell && (
              <div>
                <p className="text-ds-caption text-muted-foreground">What it all sells for</p>
                <div className="mt-ds-1 text-ds-heading tabular-nums"><Dh n={totals.sell} /></div>
              </div>
            )}
            {canSeeMargin && (
              <div>
                <p className="text-ds-caption text-muted-foreground">Blended margin</p>
                <div
                  className={`mt-ds-1 text-ds-heading tabular-nums ${
                    totals.margin == null
                      ? "text-muted-foreground"
                      : totals.margin < 0
                        ? "text-[var(--tone-bad-ink)]"
                        : totals.margin < 15
                          ? "text-[var(--tone-warn-ink)]"
                          : "text-[var(--tone-good-ink)]"
                  }`}
                >
                  {totals.margin == null
                    ? "–"
                    : `${totals.margin >= 0 ? "+" : ""}${totals.margin.toFixed(1)}%`}
                  {totals.margin != null && (
                    <span className="ml-1 text-ds-caption font-normal">
                      {totals.margin < 0 ? "at a loss" : totals.margin < 15 ? "thin" : "healthy"}
                    </span>
                  )}
                </div>
              </div>
            )}
            {summary.blocked > 0 && (
              <div>
                <p className="flex items-center gap-ds-1 text-ds-caption text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--tone-bad-dot)]" aria-hidden />
                  Blocked
                </p>
                <div className="mt-ds-1 text-ds-heading tabular-nums text-[var(--tone-bad-ink)]">
                  {summary.blocked}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {unknownColumns.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Ignored {unknownColumns.length} unrecognised column
            {unknownColumns.length === 1 ? "" : "s"}: {unknownColumns.map((c) => `"${c}"`).join(", ")}.
            Nothing in {unknownColumns.length === 1 ? "it" : "them"} will be imported.
          </AlertDescription>
        </Alert>
      )}

      {liveUnpriced > 0 && (
        <Alert>
          <Coins className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <span className="font-medium">{liveUnpriced} creator{liveUnpriced === 1 ? "" : "s"} have no sell price.</span>{" "}
            {liveUnpriced === 1 ? "It" : "They"} will import as <Badge variant="outline" className="mx-0.5 text-[10px]">inactive</Badge>
            and stay out of the proposal creator picker until priced. Set a sell price below to make
            {liveUnpriced === 1 ? " it" : " them"} selectable.
          </AlertDescription>
        </Alert>
      )}

      {summary.blocked > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {summary.blocked} row{summary.blocked === 1 ? "" : "s"} cannot be imported and will be skipped.
            Fix the file and re-upload if {summary.blocked === 1 ? "it matters" : "they matter"}.
          </AlertDescription>
        </Alert>
      )}

      {/* The deck */}
      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {visible.length} of {rows.length} row{rows.length === 1 ? "" : "s"}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setOnlyProblems((v) => !v)}>
              {onlyProblems ? "Show all" : "Show only problems"}
            </Button>
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Creator</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Reel cost</TableHead>
                    <TableHead className="text-right">Reel sell</TableHead>
                    <TableHead className="text-center">Margin</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => {
                    const isOpen = expanded.has(r.row_number)
                    const otherPriced = SECONDARY.filter(
                      (d) =>
                        r[`cost_${d}_aed` as keyof ImportPreviewRow] != null ||
                        r[`sell_${d}_aed` as keyof ImportPreviewRow] != null
                    )
                    const errs = r.issues.filter((i) => i.level === "error")
                    const warns = r.issues.filter((i) => i.level === "warning")
                    return (
                      <Fragment key={r.row_number}>
                        <TableRow className={r.blocked ? "bg-destructive/5 opacity-70" : undefined}>
                          <TableCell className="pr-0">
                            <button
                              className="rounded p-1 hover:bg-muted"
                              onClick={() => toggle(r.row_number)}
                              aria-label={isOpen ? "Collapse" : "Expand other deliverables"}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>
                          </TableCell>

                          {/* Identity — enough context to actually verify who this is */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={r.known_profile?.profile_image_url ?? undefined} alt={r.username ?? ""} />
                                <AvatarFallback className="text-[10px]">
                                  {(r.username ?? "?").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 font-medium">
                                  <span className="truncate">@{r.username ?? "–"}</span>
                                  {r.known_profile?.is_verified && (
                                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--tone-info-dot)]" />
                                  )}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {r.known_profile?.full_name ?? (
                                    <span className="italic">not in analytics yet</span>
                                  )}
                                  {r.known_profile?.followers_count != null && (
                                    <> · {fmtNum(r.known_profile.followers_count)} followers</>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              {r.action === "create" ? (
                                <Badge variant="outline" className="border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]">
                                  New
                                </Badge>
                              ) : r.action === "skip" ? (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Skipped
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]">
                                  Update
                                </Badge>
                              )}
                              {r.tier && (
                                <span className="text-[10px] uppercase text-muted-foreground">{r.tier}</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <PriceInput
                              value={r.cost_reel_aed}
                              invalid={(r.cost_reel_aed ?? 0) < 0}
                              onChange={(v) => setPrice(r.row_number, "cost_reel_aed", v)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <PriceInput
                              value={r.sell_reel_aed}
                              invalid={(r.sell_reel_aed ?? 0) < 0}
                              onChange={(v) => setPrice(r.row_number, "sell_reel_aed", v)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <MarginBadge cost={r.cost_reel_aed} sell={r.sell_reel_aed} />
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1">
                              {errs.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="cursor-help gap-1">
                                      <XCircle className="h-3 w-3" />
                                      {errs.length}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    {errs.map((e, i) => <div key={i}>{e.message}</div>)}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {warns.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className="cursor-help gap-1 border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]"
                                    >
                                      <AlertTriangle className="h-3 w-3" />
                                      {warns.length}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    {warns.map((w, i) => <div key={i}>{w.message}</div>)}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {otherPriced.length > 0 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  +{otherPriced.length} priced
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Other deliverables — only when you actually need them */}
                        {isOpen && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell />
                            <TableCell colSpan={6} className="pb-4">
                              <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="mb-3 text-xs font-medium text-muted-foreground">
                                  Other deliverables, blank if not booked
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                  {SECONDARY.map((d) => {
                                    const c = r[`cost_${d}_aed` as keyof ImportPreviewRow] as number | null
                                    const s = r[`sell_${d}_aed` as keyof ImportPreviewRow] as number | null
                                    return (
                                      <div key={d} className="rounded-md border bg-background p-2.5">
                                        <div className="mb-2 flex items-center justify-between">
                                          <span className="text-xs font-medium capitalize">{d}</span>
                                          <MarginBadge cost={c} sell={s} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1">
                                            <label className="mb-1 block text-[10px] text-muted-foreground">Cost</label>
                                            <PriceInput
                                              value={c}
                                              onChange={(v) => setPrice(r.row_number, `cost_${d}_aed`, v)}
                                            />
                                          </div>
                                          <div className="flex-1">
                                            <label className="mb-1 block text-[10px] text-muted-foreground">Sell</label>
                                            <PriceInput
                                              value={s}
                                              onChange={(v) => setPrice(r.row_number, `sell_${d}_aed`, v)}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                {(r.categories?.length > 0 || r.internal_notes) && (
                                  <div className="mt-3 space-y-1 border-t pt-3 text-xs text-muted-foreground">
                                    {r.categories?.length > 0 && (
                                      <p><span className="font-medium">Categories:</span> {r.categories.join(", ")}</p>
                                    )}
                                    {r.internal_notes && (
                                      <p><span className="font-medium">Notes:</span> {r.internal_notes}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                  {visible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Nothing to show.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  )
}
