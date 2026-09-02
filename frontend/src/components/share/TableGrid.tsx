'use client'

/**
 * The table a share can be.
 *
 * "Send them the creator addresses" is a table whose columns the operator names, which is the
 * one shape that does not need rebuilding the week the request is phone numbers instead. That
 * only holds if naming columns and filling rows is a task somebody can actually do, so this is
 * a grid: columns you add, name and remove, rows you add and remove, and a paste that takes a
 * block straight out of a spreadsheet and grows the grid to fit it.
 *
 * The grid is always rectangular by construction. The old composer took two free-text boxes and
 * then refused the send with "row 4 has 2 cells but there are 3 columns", which is a validation
 * message doing the work a grid should have done in the first place.
 *
 * Density: this runs at the compact tier, tighter than the rest of the composer. Rows of data
 * are meant to be scanned against each other, and the comfortable tier the surrounding form
 * uses would put more space between two addresses than between a field and its label.
 */
import { useCallback, useRef } from 'react'
import { Columns3, Plus, Rows3, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

export type Grid = { columns: string[]; rows: string[][] }

/** Three columns and three empty rows, so the first thing on screen is already a table. */
export const emptyGrid = (): Grid => ({
  columns: ['Creator', 'Address', 'Phone'],
  rows: [['', '', ''], ['', '', ''], ['', '', '']],
})

/** A row of empty cells matching the current column count. */
const blankRow = (n: number) => Array.from({ length: n }, () => '')

/**
 * What actually goes to the API.
 *
 * Rows that are entirely blank are dropped rather than sent, because three empty rows are the
 * grid's starting shape and not something anybody typed. Columns keep their order and their
 * names; a column left unnamed is dropped with the cells under it, since a nameless column is
 * a column the client cannot read.
 */
export function harvest(grid: Grid): Grid {
  const keep = grid.columns
    .map((c, i) => ({ name: c.trim(), i }))
    .filter(c => c.name.length > 0)
  const rows = grid.rows
    .map(r => keep.map(c => (r[c.i] ?? '').trim()))
    .filter(r => r.some(cell => cell.length > 0))
  return { columns: keep.map(c => c.name), rows }
}

/** A spreadsheet block is tab separated. A block out of a CSV file is not, so both are read. */
function parseBlock(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '').split('\n')
  const sep = text.includes('\t') ? '\t' : ','
  return lines.map(l => l.split(sep).map(c => c.trim()))
}

export function TableGrid({ grid, onChange }: { grid: Grid; onChange: (g: Grid) => void }) {
  const wrap = useRef<HTMLDivElement>(null)

  const setCell = (r: number, c: number, v: string) => {
    const rows = grid.rows.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? v : cell)) : row))
    onChange({ ...grid, rows })
  }

  const setColumn = (c: number, v: string) =>
    onChange({ ...grid, columns: grid.columns.map((name, i) => (i === c ? v : name)) })

  const addColumn = () =>
    onChange({
      columns: [...grid.columns, ''],
      rows: grid.rows.map(r => [...r, '']),
    })

  const removeColumn = (c: number) =>
    onChange({
      columns: grid.columns.filter((_, i) => i !== c),
      rows: grid.rows.map(r => r.filter((_, i) => i !== c)),
    })

  const addRow = useCallback(() => {
    onChange({ ...grid, rows: [...grid.rows, blankRow(grid.columns.length)] })
  }, [grid, onChange])

  const removeRow = (r: number) => onChange({ ...grid, rows: grid.rows.filter((_, i) => i !== r) })

  /** Row one becomes the column names. What a spreadsheet paste usually needs, one click. */
  const promoteHeader = () => {
    if (grid.rows.length === 0) return
    const [head, ...rest] = grid.rows
    onChange({
      columns: grid.columns.map((name, i) => (head[i]?.trim() ? head[i].trim() : name)),
      rows: rest.length ? rest : [blankRow(grid.columns.length)],
    })
  }

  /**
   * Paste a block from a spreadsheet and the grid grows to hold it, starting at the cell that
   * was focused. Anything wider or taller than what is there gains columns and rows rather than
   * being clipped, because silently dropping a client's addresses is the worst thing this
   * screen could do.
   */
  const paste = (r: number, c: number) => (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return
    e.preventDefault()

    const block = parseBlock(text)
    const width = Math.max(...block.map(b => b.length))
    const columns = [...grid.columns]
    while (columns.length < c + width) columns.push(`Column ${columns.length + 1}`)

    const rows = grid.rows.map(row => [...row, ...blankRow(columns.length - row.length)])
    while (rows.length < r + block.length) rows.push(blankRow(columns.length))
    block.forEach((line, i) => line.forEach((cell, j) => { rows[r + i][c + j] = cell }))

    onChange({ columns, rows })
  }

  /** Enter walks down a column, adding a row when it runs off the end. */
  const keys = (r: number, c: number) => (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (r === grid.rows.length - 1) addRow()
    requestAnimationFrame(() => {
      const next = wrap.current?.querySelector<HTMLInputElement>(`[data-cell="${r + 1}-${c}"]`)
      next?.focus()
    })
  }

  const cell =
    'h-9 border-transparent bg-transparent shadow-none focus-visible:bg-background text-sm'

  return (
    <div className="flex flex-col gap-ds-3">
      <div ref={wrap} className="overflow-x-auto rounded-ds-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              {grid.columns.map((name, c) => (
                <TableHead key={c} className="min-w-[180px] p-1">
                  <div className="flex items-center gap-1">
                    <Input
                      value={name}
                      onChange={e => setColumn(c, e.target.value)}
                      placeholder={`Column ${c + 1}`}
                      aria-label={`Name of column ${c + 1}`}
                      className={`${cell} font-medium text-foreground`}
                    />
                    {grid.columns.length > 1 && (
                      <Button
                        variant="ghost" size="icon" className="size-7 shrink-0"
                        onClick={() => removeColumn(c)}
                        title={`Remove the ${name.trim() || `column ${c + 1}`} column`}
                      >
                        <X className="size-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {grid.rows.map((row, r) => (
              <TableRow key={r} className="hover:bg-transparent">
                <TableCell className="p-1 text-center text-ds-caption tabular-nums text-muted-foreground">
                  {r + 1}
                </TableCell>
                {grid.columns.map((name, c) => (
                  <TableCell key={c} className="p-1">
                    <Input
                      data-cell={`${r}-${c}`}
                      value={row[c] ?? ''}
                      onChange={e => setCell(r, c, e.target.value)}
                      onPaste={paste(r, c)}
                      onKeyDown={keys(r, c)}
                      aria-label={`Row ${r + 1}, ${name.trim() || `column ${c + 1}`}`}
                      className={cell}
                    />
                  </TableCell>
                ))}
                <TableCell className="p-1">
                  {grid.rows.length > 1 && (
                    <Button
                      variant="ghost" size="icon" className="size-7"
                      onClick={() => removeRow(r)} title={`Remove row ${r + 1}`}
                    >
                      <X className="size-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-ds-2">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Rows3 className="mr-1.5 size-3.5" />Add a row
        </Button>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Columns3 className="mr-1.5 size-3.5" />Add a column
        </Button>
        {grid.rows.length > 1 && (
          <Button variant="ghost" size="sm" onClick={promoteHeader}>
            <Plus className="mr-1.5 size-3.5" />Use row 1 as the column names
          </Button>
        )}
        <p className="ml-auto text-ds-caption text-muted-foreground">
          Paste a block straight from a spreadsheet into any cell and the grid grows to fit it.
        </p>
      </div>
    </div>
  )
}

/** The table as the client will meet it: no inputs, no controls, just what lands. */
export function TablePreview({ grid }: { grid: Grid }) {
  const clean = harvest(grid)
  if (clean.columns.length === 0 || clean.rows.length === 0) {
    return (
      <p className="py-12 text-center text-ds-body text-muted-foreground">
        Name at least one column and fill one row, and it will show here exactly as they see it.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-ds-2">
      <div className="overflow-x-auto rounded-ds-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {clean.columns.map(c => <TableHead key={c}>{c}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clean.rows.map((r, i) => (
              <TableRow key={i}>
                {r.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-ds-caption text-muted-foreground">
        {clean.rows.length} {clean.rows.length === 1 ? 'row' : 'rows'}, {clean.columns.length}{' '}
        {clean.columns.length === 1 ? 'column' : 'columns'}. Blank rows are not sent.
      </p>
    </div>
  )
}
