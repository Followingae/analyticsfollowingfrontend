"use client"

/**
 * The left half of the builder's workbench: where creators come FROM.
 *
 * Three sources, unchanged: the master database, FA app members, and a raw
 * Instagram handle. Every control that existed before this file did still
 * exists here — the tabs, the search box, the category and tier filters, the
 * six result columns, the per-row checkbox, row-click to select, the skeleton
 * and empty states, "Add Selected" with its count, the FA search button, the
 * per-member "View analytics" and "Add", and the add-by-handle field with its
 * "we will create it" note.
 *
 * Sell prices only. There is no cost figure on this screen and none may be
 * added.
 */

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Search, Loader2, Users, X } from "lucide-react"
import {
  CATEGORY_OPTIONS, TIER_OPTIONS,
  followersLabel, engagementLabel,
  type MasterInfluencer,
} from "./types"

export type PickerTab = "master" | "fa" | "handle"

const TABS = [
  { key: "master", label: "Master DB" },
  { key: "fa", label: "FA Members" },
  { key: "handle", label: "Add by Handle" },
] as const

interface Props {
  pickerTab: PickerTab
  onPickerTab: (t: PickerTab) => void

  /* master DB */
  search: string
  onSearch: (v: string) => void
  categoryFilter: string
  onCategoryFilter: (v: string) => void
  tierFilter: string
  onTierFilter: (v: string) => void
  masterResults: MasterInfluencer[]
  searching: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onAddSelected: () => void

  /* FA members */
  faSearch: string
  onFaSearch: (v: string) => void
  faResults: any[]
  faSearching: boolean
  onSearchFaMembers: () => void
  onAddFaMember: (member: any) => void

  /* add by handle */
  newHandle: string
  onNewHandle: (v: string) => void
  addingHandle: boolean
  onAddHandle: () => void

  /* shared */
  addedInfluencers: MasterInfluencer[]
  onOpenAnalytics: (username: string) => void
}

export function CreatorSourcePicker(p: Props) {
  const addedIds = new Set(p.addedInfluencers.map((i) => i.id))
  const addedUsernames = new Set(
    p.addedInfluencers.map((i) => i.username?.toLowerCase()).filter(Boolean)
  )
  const filtersActive = p.categoryFilter !== "all" || p.tierFilter !== "all" || p.search !== ""

  return (
    <div className="space-y-4">
      {/* Source tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-muted/40 p-1 w-fit">
          {TABS.map((t) => {
            const active = p.pickerTab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => p.onPickerTab(t.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {p.pickerTab === "master" && !p.searching && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {p.masterResults.length === 0
              ? "No matches"
              : `${p.masterResults.length} match${p.masterResults.length === 1 ? "" : "es"}`}
          </p>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* FA members                                                        */}
      {/* ---------------------------------------------------------------- */}
      {p.pickerTab === "fa" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search FA members by name or @username..."
                value={p.faSearch}
                onChange={(e) => p.onFaSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") p.onSearchFaMembers() }}
              />
            </div>
            <Button onClick={p.onSearchFaMembers} disabled={p.faSearching} variant="secondary">
              {p.faSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          <div className="border rounded-lg max-h-[480px] overflow-auto">
            {p.faResults.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-6 w-6 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {p.faSearching ? "Searching…" : "No FA members yet. Try a search."}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {p.faResults.map((m) => {
                  const already = addedUsernames.has(m.instagram_username?.toLowerCase())
                  return (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/40">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {(m.instagram_username?.[0] ?? m.full_name?.[0] ?? "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight min-w-0">
                          <p className="font-medium text-sm truncate">
                            @{m.instagram_username ?? "-"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {m.full_name && <span className="truncate">{m.full_name}</span>}
                            {m.tier && (
                              <Badge variant="outline" className="text-[10px] uppercase">{m.tier}</Badge>
                            )}
                            <span className="tabular-nums">
                              {followersLabel(m.followers_count)} followers
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.instagram_username && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => p.onOpenAnalytics(m.instagram_username)}
                          >
                            View analytics
                          </Button>
                        )}
                        <Button size="sm" disabled={already} onClick={() => p.onAddFaMember(m)}>
                          {already ? "Added" : "Add"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Add by handle                                                     */}
      {/* ---------------------------------------------------------------- */}
      {p.pickerTab === "handle" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Instagram handle (e.g. @huda)"
              value={p.newHandle}
              onChange={(e) => p.onNewHandle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") p.onAddHandle() }}
            />
            <Button onClick={p.onAddHandle} disabled={p.addingHandle || !p.newHandle.trim()}>
              {p.addingHandle
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Plus className="h-4 w-4 mr-2" />Add</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            If this handle isn&apos;t in the master database yet, it will be created automatically.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Master DB                                                         */}
      {/* ---------------------------------------------------------------- */}
      {p.pickerTab === "master" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search username or name..."
                value={p.search}
                onChange={(e) => p.onSearch(e.target.value)}
              />
            </div>
            <Select value={p.categoryFilter} onValueChange={p.onCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={p.tierFilter} onValueChange={p.onTierFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "all" ? "All Tiers" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  p.onSearch("")
                  p.onCategoryFilter("all")
                  p.onTierFilter("all")
                }}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            )}
          </div>

          {/* Results table */}
          <div className="border rounded-lg max-h-[480px] overflow-auto overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead className="min-w-[180px]">Influencer</TableHead>
                  <TableHead className="text-right">Followers</TableHead>
                  <TableHead className="text-right">Eng %</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Categories</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.searching ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                          <div className="space-y-1">
                            <div className="h-3.5 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right"><div className="h-4 w-12 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                      <TableCell className="text-right"><div className="h-4 w-10 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-5 w-14 bg-muted animate-pulse rounded-full" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : p.masterResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Search className="h-6 w-6 mx-auto text-muted-foreground/60 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No influencers found. Try a different search.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  p.masterResults.map((inf) => {
                    const alreadyAdded = addedIds.has(inf.id)
                    return (
                      <TableRow
                        key={inf.id}
                        className={`transition-colors duration-150 ${
                          alreadyAdded ? "opacity-50" : "hover:bg-muted/50 cursor-pointer"
                        }`}
                        onClick={!alreadyAdded ? () => p.onToggleSelect(inf.id) : undefined}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            disabled={alreadyAdded}
                            checked={p.selectedIds.has(inf.id)}
                            onCheckedChange={() => p.onToggleSelect(inf.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={inf.profile_image_url} />
                              <AvatarFallback className="text-xs">
                                {(inf.username?.[0] ?? "?").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="leading-tight min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-sm truncate">@{inf.username}</p>
                                {alreadyAdded && (
                                  <Badge variant="secondary" className="text-[10px] shrink-0">
                                    In roster
                                  </Badge>
                                )}
                              </div>
                              {inf.full_name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {inf.full_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">
                          {followersLabel(inf.followers_count)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {engagementLabel(inf.engagement_rate)}
                        </TableCell>
                        <TableCell>
                          {inf.tier && (
                            <Badge variant="outline" className="capitalize text-xs">
                              {inf.tier}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(inf.categories ?? []).slice(0, 3).map((c) => (
                              <Badge key={c} variant="secondary" className="text-xs">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <Button onClick={p.onAddSelected} disabled={p.selectedIds.size === 0} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Selected
            {p.selectedIds.size > 0 && (
              <span className="ml-1 tabular-nums">({p.selectedIds.size})</span>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
