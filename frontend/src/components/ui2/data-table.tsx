"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
  SettingsIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/* --------------------------------------------------------------------------
   Column header — click to sort, menu to hide.
   Wire it up on a column with:
     header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />
   -------------------------------------------------------------------------- */

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>
  title: string
  className?: string
}) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn("text-ds-label", className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 rounded-ds-control data-[state=open]:bg-accent"
          >
            <span className="text-ds-label">{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="ml-2 size-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="ml-2 size-4" />
            ) : (
              <ChevronsUpDownIcon className="ml-2 size-4 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUpIcon className="text-muted-foreground/70" />
                Ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDownIcon className="text-muted-foreground/70" />
                Descending
              </DropdownMenuItem>
            </>
          )}
          {column.getCanSort() && column.getCanHide() && (
            <DropdownMenuSeparator />
          )}
          {column.getCanHide() && (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOffIcon className="text-muted-foreground/70" />
              Hide
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Column visibility toggle
   -------------------------------------------------------------------------- */

function DataTableViewOptions<TData>({
  table,
}: {
  table: TanstackTable<TData>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-9 rounded-ds-control"
        >
          <SettingsIcon />
          <span className="hidden lg:inline">Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(checked: boolean) =>
                column.toggleVisibility(!!checked)
              }
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* --------------------------------------------------------------------------
   Pagination bar
   -------------------------------------------------------------------------- */

function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: {
  table: TanstackTable<TData>
  pageSizeOptions?: number[]
}) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const totalCount = table.getFilteredRowModel().rows.length

  return (
    <div className="flex items-center justify-between gap-4 px-2">
      <div className="text-muted-foreground hidden flex-1 text-ds-body-sm lg:block">
        {selectedCount > 0
          ? selectedCount + " of " + totalCount + " rows selected."
          : totalCount + " rows."}
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-ds-label">Rows per page</p>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value: string) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="w-[72px] rounded-ds-control">
              <SelectValue
                placeholder={String(table.getState().pagination.pageSize)}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[110px] items-center justify-center text-ds-label">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 rounded-ds-control lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">First page</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-ds-control"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-ds-control"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 rounded-ds-control lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Last page</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   DataTable
   -------------------------------------------------------------------------- */

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Column id to wire the search box to. Omit to hide the search box. */
  filterColumn?: string
  filterPlaceholder?: string
  /** Hide the built-in pagination bar (e.g. when paging on the server). */
  hidePagination?: boolean
  /** Extra controls rendered in the toolbar, left of the column toggle. */
  toolbar?: React.ReactNode
  emptyState?: React.ReactNode
  className?: string
}

function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Search...",
  hidePagination = false,
  toolbar,
  emptyState = "No results.",
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const filterValue = filterColumn
    ? ((table.getColumn(filterColumn)?.getFilterValue() as string) ?? "")
    : ""

  return (
    <div
      data-slot="data-table"
      className={cn("flex w-full flex-col gap-4", className)}
    >
      {(filterColumn || toolbar) && (
        <div className="flex items-center gap-2">
          {filterColumn && (
            <Input
              value={filterValue}
              onChange={(event) =>
                table.getColumn(filterColumn)?.setFilterValue(event.target.value)
              }
              placeholder={filterPlaceholder}
              className="h-9 max-w-sm rounded-ds-field"
            />
          )}
          {toolbar}
          <DataTableViewOptions table={table} />
        </div>
      )}
      <div className="overflow-hidden rounded-ds-surface border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!hidePagination && <DataTablePagination table={table} />}
    </div>
  )
}

export {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  type DataTableProps,
}
