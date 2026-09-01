"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService, UserManagement } from "@/services/superadminApi"
import {
  UserPlus,
  Search,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Ban,
  Unlock,
  MoreHorizontal,
} from "lucide-react"

import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FieldStrip, PageHead } from "@/components/console/primitives"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const dynamic = 'force-dynamic'

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<UserManagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  
  // Dialogs
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null)
  // Suspending cuts a paying client out of the platform on the spot. It was one item in a
  // dropdown, one click, no confirmation, directly beside "Edit User" in the same menu.
  const [suspending, setSuspending] = useState<UserManagement | null>(null)

  const router = useRouter()

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: any = {}
      if (statusFilter !== "all") filters.status_filter = statusFilter
      if (typeFilter !== "all") filters.role_filter = typeFilter
      if (searchQuery.trim()) filters.search = searchQuery.trim()
      
      const result = await superadminApiService.getUsers({ ...filters, limit: 100 })
      if (result.success && result.data) {
        setUsers(result.data.users || [])
      } else {
        throw new Error(result.error || 'The request did not complete')
      }
    } catch (err: any) {
      /**
       * `error` was set here and then never read anywhere in the render.
       *
       * A failed load emptied nothing and rendered nothing about the failure, so the table
       * fell through to its own empty state: "No users found. Try adjusting your search or
       * filter criteria." An outage therefore presented as a filter that matched nobody, and
       * the suggested fix was to change a filter that was working fine. The list is cleared
       * and the failure is shown instead.
       */
      setUsers([])
      setError(err?.response?.data?.detail || err?.message || "The request did not complete")
      toast.error("Could not load the users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [searchQuery, statusFilter, typeFilter, planFilter])

  // Re-fetch when user navigates back to this page
  useEffect(() => {
    const handleFocus = () => { loadUsers() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [searchQuery, statusFilter, typeFilter, planFilter])

  const handleExport = () => {
    if (users.length === 0) {
      toast.info('Nothing to export')
      return
    }
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['Name', 'Email', 'Role', 'Team', 'Status', 'Credits', 'Created', 'Updated'].join(','),
      ...users.map(u => [
        esc(u.full_name), esc(u.email), esc(u.role),
        esc(u.teams?.[0]?.name || 'Individual'), esc(u.status),
        // `?? 0` wrote a zero balance into the export for any row whose credits block was
        // missing, which is worse in a spreadsheet than on screen: it gets summed. Absent
        // exports as an empty cell; a real zero still exports as 0.
        esc(u.credits?.balance), esc(u.created_at), esc(u.updated_at),
      ].join(',')),
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${users.length} users`)
  }

  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'deactivated', reason?: string) => {
    try {
      const result = await superadminApiService.updateUserStatus(userId, status)
      if (result.success) {
        await loadUsers()
        toast.success(`User status updated to ${status}`)
        setIsUserDetailsOpen(false)
      } else {
        toast.error(result.error || 'Failed to update user status')
      }
    } catch (error) {
      toast.error('Network error while updating user status')
    }
  }

  const handleUpdateUserPlan = async (userId: string, plan: string) => {
    try {
      const result = await superadminApiService.updateUser(userId, { subscription_tier: plan })
      if (result.success) {
        await loadUsers()
        toast.success(`User plan updated to ${plan}`)
        setIsUserDetailsOpen(false)
      } else {
        toast.error(result.error || 'Failed to update user plan')
      }
    } catch (error) {
      toast.error('Network error while updating user plan')
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default'
      case 'suspended': return 'destructive'
      case 'pending': return 'secondary'
      case 'deactivated': return 'outline'
      default: return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: any) => {
    // This returned the string '0' for null, undefined, '' and NaN alike, so every caller
    // that forgot to check first printed a measured zero over a value we never had. The
    // callers below do check; the helper no longer relies on them remembering.
    if (num === undefined || num === null || num === '' || typeof num !== 'number' || isNaN(num)) {
      return '—'
    }
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading && users.length === 0) {
    return (
      /* The skeleton stood the table inside a card the loaded screen no longer draws, and
         was built from hand-rolled `bg-muted animate-pulse` divs rather than the Skeleton
         component. It now matches the shape of what actually arrives. */
      <SuperadminLayout>
        <div className="space-y-ds-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-ds-2">
              <Skeleton className="h-9 w-64 rounded-ds-lg" />
              <Skeleton className="h-4 w-72 rounded-ds-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-ds-md" />
              <Skeleton className="h-9 w-44 rounded-ds-md" />
            </div>
          </div>
          <div className="flex flex-wrap gap-ds-2">
            <Skeleton className="h-9 w-[250px] rounded-ds-md" />
            <Skeleton className="h-9 w-[140px] rounded-ds-md" />
            <Skeleton className="h-9 w-[140px] rounded-ds-md" />
            <Skeleton className="h-9 w-[140px] rounded-ds-md" />
          </div>
          <div className="space-y-ds-3">
            <Skeleton className="h-5 w-36 rounded-ds-sm" />
            <div className="space-y-ds-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-ds-sm" />
              ))}
            </div>
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">

              {/* Header. Same title, same line under it, same two buttons - it just uses
                  the console's shared page head, so this screen's title is the size every
                  other console title is instead of a fourth guess at it. */}
              <PageHead
                title="User Management"
                sub="Create, manage, and monitor platform users"
                action={
                  <>
                    <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => router.push('/superadmin/users/create')}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Brand Account
                    </Button>
                  </>
                }
              />

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-ds-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-ds-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-[250px] pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>

              {/* The table sat inside a Card, which drew a rounded edge around a grid that
                  already has rules of its own: a box around a box. The card comes off; the
                  heading and the row rule carry the same structure with two fewer edges. */}
              <section className="space-y-ds-3">
                <div className="space-y-ds-1">
                  <h2 className="text-ds-subheading">Platform users</h2>
                  <p className="text-ds-body-sm text-muted-foreground">
                    {/* "0 total users" over a failed read described the platform as empty. */}
                    {error
                      ? "The list did not load, so this is not a count."
                      : `${users.length} account${users.length === 1 ? "" : "s"} matching these filters.`}
                  </p>
                </div>
                <div>
                  <div className="overflow-x-auto">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="group transition-colors duration-150 hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{user.full_name || 'Unnamed'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {user.teams?.[0]?.name || 'Individual'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(user.status)} className="capitalize text-xs">
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-sm">
                            {/* `|| 0` made a row whose credits block did not come back
                                indistinguishable from a row with an empty wallet. */}
                            {user.credits?.balance == null ? '—' : formatNumber(user.credits.balance)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.updated_at ? formatDate(user.updated_at) : '--'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 data-[state=open]:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user)
                                  setIsUserDetailsOpen(true)
                                }}>
                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  router.push(`/superadmin/users/${user.id}`)
                                }}>
                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                {/* Superadmins can't be suspended/deactivated. */}
                                {user.role !== 'super_admin' && (
                                  <DropdownMenuItem
                                    className={user.status === 'active' ? 'text-destructive focus:text-destructive' : ''}
                                    onClick={() => {
                                      // Re-activating is harmless and stays immediate.
                                      // Suspending is the one that locks somebody out.
                                      if (user.status === 'active') setSuspending(user)
                                      else handleUpdateUserStatus(user.id, 'active')
                                    }}
                                  >
                                    {user.status === 'active' ? (
                                      <>
                                        <Ban className="h-3.5 w-3.5 mr-2" />
                                        Suspend User
                                      </>
                                    ) : (
                                      <>
                                        <Unlock className="h-3.5 w-3.5 mr-2" />
                                        Activate User
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  </div>
                  {error && !loading && (
                    <div className="border-t py-ds-6 text-center">
                      <p className="text-ds-subheading">Could not load the users</p>
                      <p className="mt-ds-2 text-ds-body text-muted-foreground">
                        No account has gone anywhere. The list did not come back, so nothing
                        here reflects who is on the platform. Changing a filter will not help.
                      </p>
                      <p className="mt-ds-2 text-ds-caption text-muted-foreground">{error}</p>
                      <Button variant="outline" size="sm" className="mt-ds-3" onClick={loadUsers}>
                        <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
                      </Button>
                    </div>
                  )}
                  {!error && users.length === 0 && !loading && (
                    <p className="border-t py-ds-6 text-center text-ds-body text-muted-foreground">
                      No account matches these filters.
                    </p>
                  )}
                </div>
              </section>

      {/* The confirmation names the person and their email, because two rows in this table
          can carry the same display name and suspending the wrong one locks out a client. */}
      <AlertDialog open={!!suspending} onOpenChange={(o: boolean) => !o && setSuspending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Suspend {suspending?.full_name || suspending?.email}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{suspending?.email}</strong> is signed out and cannot log back in until
              somebody activates the account again. Their credits, team and unlocked creators
              are all kept. You can undo this from the same menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Leave them active</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const u = suspending
              setSuspending(null)
              if (u) handleUpdateUserStatus(u.id, 'suspended')
            }}>
              Suspend the account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedUser?.full_name || 'User details'}</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-ds-4">
              {/* Six facts about one person, each of which had its own border and padding,
                  inside a dialog that already has an edge and a title. Fourteen edges to
                  read six short values, none of which was a different subject from any
                  other. They are a labelled field strip now - the console's standard way of
                  putting a record's facts under its name - so the eye runs along one row
                  instead of stepping in and out of six frames.

                  Credits read `?? balance || 0`, so a user record that came back without a
                  credits block showed a balance of zero: an account with money in it and an
                  account we failed to read looked identical. Absent is an em dash; a real
                  zero still reads 0. */}
              <FieldStrip
                fields={[
                  { label: 'Role', value: <span className="capitalize">{selectedUser.role}</span> },
                  { label: 'Status', value: (
                    <Badge variant={getStatusVariant(selectedUser.status)} className="capitalize">
                      {selectedUser.status}
                    </Badge>
                  ) },
                  { label: 'Credits balance', value: (
                    <span className="tabular-nums">
                      {selectedUser.credits?.balance == null ? '—' : formatNumber(selectedUser.credits.balance)}
                    </span>
                  ) },
                  { label: 'Credits spent', value: (
                    <span className="tabular-nums">
                      {selectedUser.credits?.spent == null ? '—' : formatNumber(selectedUser.credits.spent)}
                    </span>
                  ) },
                  { label: 'Created', value: selectedUser.created_at ? formatDate(selectedUser.created_at) : '--' },
                  { label: 'Last updated', value: selectedUser.updated_at ? formatDate(selectedUser.updated_at) : '--' },
                ]}
              />
              {selectedUser.teams?.length > 0 && (
                /* The one hairline in the dialog, and it earns it: teams are a different
                   subject from the account's own facts. */
                <div className="border-t border-black/[0.06] pt-ds-3 dark:border-white/[0.07]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-ds-2">Teams</p>
                  <div className="flex flex-wrap gap-ds-2">
                    {selectedUser.teams.map((t, i) => (
                      <Badge key={i} variant="secondary">{t.name} · {t.role}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button size="sm" onClick={() => { setIsUserDetailsOpen(false); router.push(`/superadmin/users/${selectedUser.id}`) }}>
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </SuperadminLayout>
  )
}