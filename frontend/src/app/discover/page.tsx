"use client"

/**
 * /discover — the creator directory.
 *
 * This replaces a full-page "Coming soon" placeholder that sat over the best
 * creator database in the region. Nothing else on this route existed, so nothing
 * else on this route changes.
 *
 * WHAT IS RENDERED IS WHAT A DIRECTORY ROW HOLDS — handle, picture, followers,
 * country/city, category, an indicative engagement rate, verified/business flags.
 * There is no bio, no post grid, no audience breakdown and no price here, because
 * a directory row does not have them. Those arrive with the unlock.
 *
 * THREE STATES, NEVER TWO. Loading, empty and failed are distinct: a failed
 * request never draws an empty grid, and a count that did not answer renders as an
 * em dash rather than a zero, because a zero reads as a measurement.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { RotateCw, Search, SearchX, TriangleAlert, X } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui2/combobox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui2/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui2/input-group"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui2/pagination"
import { Spinner } from "@/components/ui2/spinner"
import { CreatorDirectoryCard } from "@/components/discover/CreatorDirectoryCard"
import { UnlockCreatorDialog } from "@/components/discover/UnlockCreatorDialog"
import {
  browseDirectory,
  countryLabel,
  fetchDirectoryFacets,
  FOLLOWER_BANDS,
  type DirectoryRow,
  type FollowerBand,
} from "@/services/discoveryDirectoryService"

const PAGE_SIZE = 24

const SORT_OPTIONS = [
  { value: "followers_desc", label: "Most followers" },
  { value: "followers_asc", label: "Fewest followers" },
  { value: "engagement_desc", label: "Highest engagement" },
  { value: "alphabetical", label: "A – Z" },
] as const

/** Debounce, so a typed handle is one request rather than one per keystroke. */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function DiscoverPage() {
  const router = useRouter()

  const [searchInput, setSearchInput] = React.useState("")
  const search = useDebounced(searchInput)
  const [category, setCategory] = React.useState("")
  const [country, setCountry] = React.useState("")
  const [band, setBand] = React.useState<FollowerBand>("all")
  const [sort, setSort] =
    React.useState<(typeof SORT_OPTIONS)[number]["value"]>("followers_desc")
  const [page, setPage] = React.useState(1)
  const [pendingUnlock, setPendingUnlock] = React.useState<DirectoryRow | null>(
    null
  )

  const bandRange = FOLLOWER_BANDS.find((b) => b.value === band)!

  // Any filter change starts again at page one; otherwise a narrowed result set
  // can leave you looking at a page that no longer exists.
  React.useEffect(() => {
    setPage(1)
  }, [search, category, country, band, sort])

  const directoryQuery = useQuery({
    queryKey: ["discovery-directory", search, category, country, band, sort, page],
    queryFn: () =>
      browseDirectory({
        search: search || undefined,
        category: category || undefined,
        country: country || undefined,
        min_followers: bandRange.min,
        max_followers: bandRange.max,
        sort,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
  })

  const facetsQuery = useQuery({
    queryKey: ["discovery-directory-facets"],
    queryFn: fetchDirectoryFacets,
    staleTime: 10 * 60_000,
    retry: 1,
  })

  const rows = directoryQuery.data?.rows ?? []
  const total = directoryQuery.data?.total ?? null
  const totalPages = directoryQuery.data?.total_pages ?? null

  // Categories and countries come from the facets endpoint where there is one, and
  // otherwise from whatever the current page actually contains. A facet with no
  // values does not render an empty dropdown — the filter is simply not there.
  const categoryOptions = React.useMemo(() => {
    const values = new Set<string>(facetsQuery.data?.categories ?? [])
    rows.forEach((row) => row.category && values.add(row.category))
    return Array.from(values)
      .sort()
      .map((value) => ({ value, label: value }))
  }, [facetsQuery.data, rows])

  const countryOptions = React.useMemo(() => {
    const values = new Set<string>(facetsQuery.data?.countries ?? [])
    rows.forEach((row) => row.country && values.add(row.country))
    return Array.from(values)
      .sort()
      .map((value) => ({ value, label: countryLabel(value) }))
  }, [facetsQuery.data, rows])

  const filtersApplied =
    !!search || !!category || !!country || band !== "all"

  const clearFilters = () => {
    setSearchInput("")
    setCategory("")
    setCountry("")
    setBand("all")
  }

  const openCreator = (row: DirectoryRow) => {
    if (row.is_unlocked) {
      router.push(`/creator-analytics/${row.username}`)
      return
    }
    setPendingUnlock(row)
  }

  const isFirstLoad = directoryQuery.isLoading && !directoryQuery.data
  const hasFailed = directoryQuery.isError

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <div className="flex flex-1 flex-col">
          <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-8 p-4 md:gap-10 md:p-8">
            {/* ---------------------------------------------------------- header */}
            <header className="flex flex-col gap-2">
              <h1 className="text-ds-title">Discover creators</h1>
              <p className="max-w-2xl text-ds-body text-muted-foreground">
                Search the directory, then unlock the ones worth a closer look.
              </p>
            </header>

            {/* --------------------------------------------------------- filters */}
            <section
              aria-label="Filters"
              className="flex flex-col gap-3 lg:flex-row lg:items-center"
            >
              <InputGroup className="lg:max-w-sm">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search by handle or name"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  aria-label="Search creators"
                />
                {searchInput && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      aria-label="Clear search"
                      onClick={() => setSearchInput("")}
                    >
                      <X />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>

              <div className="flex flex-wrap gap-3">
                {categoryOptions.length > 0 && (
                  <Combobox
                    options={categoryOptions}
                    value={category}
                    onValueChange={setCategory}
                    placeholder="Category"
                    searchPlaceholder="Find a category"
                    emptyText="No category matches."
                    className="w-full sm:w-[190px]"
                  />
                )}

                {/* Hidden entirely until directory rows carry a country. */}
                {countryOptions.length > 0 && (
                  <Combobox
                    options={countryOptions}
                    value={country}
                    onValueChange={setCountry}
                    placeholder="Country"
                    searchPlaceholder="Find a country"
                    emptyText="No country matches."
                    className="w-full sm:w-[190px]"
                  />
                )}

                <Combobox
                  options={FOLLOWER_BANDS.map((b) => ({
                    value: b.value,
                    label: b.label,
                  }))}
                  value={band}
                  onValueChange={(value) =>
                    setBand((value || "all") as FollowerBand)
                  }
                  placeholder="Audience size"
                  searchPlaceholder="Find a band"
                  emptyText="No band matches."
                  clearable={false}
                  className="w-full sm:w-[170px]"
                />

                <Combobox
                  options={SORT_OPTIONS.map((option) => ({ ...option }))}
                  value={sort}
                  onValueChange={(value) =>
                    setSort(
                      (value ||
                        "followers_desc") as (typeof SORT_OPTIONS)[number]["value"]
                    )
                  }
                  placeholder="Sort"
                  searchPlaceholder="Sort by"
                  emptyText="No sort matches."
                  clearable={false}
                  className="w-full sm:w-[190px]"
                />

                {filtersApplied && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="rounded-ds-control"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* The count is a fact or it is a dash. It is never 0 by default. */}
              <p
                className="text-ds-body-sm text-muted-foreground lg:ml-auto"
                aria-live="polite"
              >
                {hasFailed ? (
                  <span title="The directory did not answer">— creators</span>
                ) : isFirstLoad ? (
                  <Spinner className="size-4" />
                ) : total === null ? (
                  `${rows.length} shown`
                ) : (
                  `${total.toLocaleString()} creators`
                )}
              </p>
            </section>

            {/* ----------------------------------------------------------- body */}
            {hasFailed ? (
              /* FAILED — a different thing from empty, and it says so. */
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TriangleAlert />
                  </EmptyMedia>
                  <EmptyTitle>The directory did not answer</EmptyTitle>
                  <EmptyDescription>
                    {(directoryQuery.error as Error)?.message ||
                      "Something went wrong on our side."}{" "}
                    Nothing has been charged. Try again in a moment.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    className="rounded-ds-control"
                    onClick={() => directoryQuery.refetch()}
                  >
                    <RotateCw className="size-4" aria-hidden />
                    Try again
                  </Button>
                </EmptyContent>
              </Empty>
            ) : isFirstLoad ? (
              /* LOADING — the shape of the answer, not a spinner over nothing. */
              <div
                role="status"
                aria-label="Loading creators"
                className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6"
              >
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-ds-surface border bg-card"
                  >
                    <div className="aspect-square w-full animate-pulse bg-muted" />
                    <div className="flex flex-col gap-3 p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded-ds-xs bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded-ds-xs bg-muted" />
                      <div className="h-9 w-full animate-pulse rounded-ds-control bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              /* EMPTY — genuinely nothing matched, and we know that for a fact. */
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchX />
                  </EmptyMedia>
                  <EmptyTitle>
                    {filtersApplied
                      ? "No creator matches these filters"
                      : "The directory is empty"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {filtersApplied
                      ? "Widen the audience band or clear a filter."
                      : "No creators have been indexed yet. They will appear here as soon as they are."}
                  </EmptyDescription>
                </EmptyHeader>
                {filtersApplied && (
                  <EmptyContent>
                    <Button
                      variant="outline"
                      className="rounded-ds-control"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6"
                >
                  {rows.map((row) => (
                    <CreatorDirectoryCard
                      key={row.id}
                      row={row}
                      onOpen={openCreator}
                    />
                  ))}
                </motion.div>

                {(totalPages === null || totalPages > 1) && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          aria-disabled={page === 1}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : undefined
                          }
                          onClick={(event) => {
                            event.preventDefault()
                            setPage((current) => Math.max(1, current - 1))
                          }}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          aria-disabled={
                            totalPages !== null && page >= totalPages
                          }
                          className={
                            totalPages !== null && page >= totalPages
                              ? "pointer-events-none opacity-50"
                              : undefined
                          }
                          onClick={(event) => {
                            event.preventDefault()
                            if (totalPages !== null && page >= totalPages) return
                            if (rows.length < PAGE_SIZE) return
                            setPage((current) => current + 1)
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>

        <UnlockCreatorDialog
          row={pendingUnlock}
          onOpenChange={(open) => {
            if (!open) setPendingUnlock(null)
          }}
          onUnlocked={() => directoryQuery.refetch()}
        />
      </BrandUserInterface>
    </AuthGuard>
  )
}
