'use client'
import { tokenManager } from '@/utils/tokenManager'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { toast } from "sonner"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { FieldStrip, PageHead, Panel } from "@/components/console/primitives"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  ArrowLeft,
  Save,
  User,
  CreditCard,
  Shield,
  Coins,
  Users,
  Mail,
  Trash2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  History,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react"

interface UserDetails {
  id: string
  email: string
  full_name: string
  company?: string
  job_title?: string
  phone_number?: string
  role: string
  status: string
  subscription_tier: string
  subscription_expires_at?: string
  credits: number
  credits_used_this_month: number
  current_balance: number
  package_id?: string
  team_id?: string
  team_name?: string
  team_role?: string
  monthly_profile_limit: number
  email_verified: boolean
  two_factor_enabled: boolean
  last_sign_in_at: string
  login_count: number
  created_at: string
}

interface CreditTxn {
  id: string
  transaction_type: string
  amount: number
  balance_after: number
  description?: string
  created_at: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.following.ae'

export default function UserEditPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [transactions, setTransactions] = useState<CreditTxn[]>([])
  /**
   * "User Not Found. The requested user could not be found."
   *
   * That was the screen for every outcome except a successful read. `loadUserData` caught the
   * throw, toasted, and left `user` null; a `success: false` response did not even toast. So a
   * 500, a dropped connection and an expired session all rendered as a statement that this
   * account does not exist — on the screen an operator opens when a client says they cannot
   * log in. Deleted and unreachable now read differently, and the error carries what went
   * wrong plus a way to ask again.
   */
  const [failure, setFailure] = useState<{ missing: boolean; detail: string } | null>(null)
  // The transaction fetch swallowed every non-2xx into `console.error`, so a failed read of
  // the credit history rendered as no history: the section is simply not drawn when the list
  // is empty, and empty was also what a failure produced.
  const [txnFailed, setTxnFailed] = useState(false)

  // Form states
  const [basicInfo, setBasicInfo] = useState({
    email: '',
    full_name: '',
    company: '',
    job_title: '',
    phone_number: ''
  })

  const [accountControl, setAccountControl] = useState({
    role: '',
    status: '',
    subscription_tier: '',
    subscription_expires_at: ''
  })

  const [creditsAdjustment, setCreditsAdjustment] = useState({
    amount: 0,
    reason: '',
    action: 'add' as 'add' | 'remove'
  })

  const [teamSettings, setTeamSettings] = useState({
    team_name: '',
    team_role: '',
    monthly_profile_limit: 0,
  })

  const [securityOverrides, setSecurityOverrides] = useState({
    email_verified: false,
    two_factor_enabled: false
  })

  // Load user data
  const loadUserData = async () => {
    try {
      setLoading(true)

      const userResult = await superadminApiService.getUserDetails(userId)
      if (!userResult.success || !userResult.data) {
        const detail = userResult.error || 'The request did not complete'
        setUser(null)
        // Only an explicit "not found" is allowed to say the account does not exist.
        setFailure({ missing: /not found|404/i.test(detail), detail })
        return
      }
      {
        const userData = userResult.data
        setUser(userData)
        setFailure(null)

        setBasicInfo({
          email: userData.email || '',
          full_name: userData.full_name || '',
          company: userData.company || '',
          job_title: userData.job_title || '',
          phone_number: userData.phone_number || ''
        })

        setAccountControl({
          role: userData.role || '',
          status: userData.status || '',
          subscription_tier: userData.subscription_tier || '',
          subscription_expires_at: userData.subscription_expires_at || ''
        })

        setTeamSettings({
          team_name: userData.team_name || '',
          team_role: userData.team_role || '',
          monthly_profile_limit: userData.monthly_profile_limit ?? 0,
        })

        setSecurityOverrides({
          email_verified: userData.email_verified || false,
          two_factor_enabled: userData.two_factor_enabled || false
        })
      }

    } catch (error) {
      setUser(null)
      setFailure({ missing: false, detail: error instanceof Error && error.message ? error.message : 'The request did not complete' })
      toast.error('Could not load this account')
    } finally {
      setLoading(false)
    }
  }

  // Load transaction history
  const loadTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/billing/transactions?user_id=${userId}&page_size=10`, {
        headers: {
          'Authorization': `Bearer ${(tokenManager.getTokenSync() || localStorage.getItem('access_token')) || ''}`,
          'Content-Type': 'application/json',
        }
      })
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setTxnFailed(false)
      } else {
        setTransactions([])
        setTxnFailed(true)
      }
    } catch (error) {
      setTransactions([])
      setTxnFailed(true)
    }
  }

  useEffect(() => {
    if (userId) {
      loadUserData()
      loadTransactions()
    }
  }, [userId])

  // Save basic information
  const saveBasicInfo = async () => {
    try {
      setSaving(true)
      const result = await superadminApiService.updateUser(userId, basicInfo)
      if (result.success) {
        // Name what actually changed. The API used to echo back every field you sent as
        // "updated" even when it had dropped some of them, so an ignored field looked
        // exactly like a saved one. Now it reports both — say so rather than claiming a
        // blanket success.
        const applied: string[] = result.data?.updated_fields ?? []
        const ignored: string[] = result.data?.ignored_fields ?? []
        if (ignored.length > 0) {
          toast.warning(
            applied.length > 0
              ? `Saved ${applied.join(', ')}. Not saved: ${ignored.join(', ')}.`
              : `Nothing was saved. This form cannot change: ${ignored.join(', ')}.`,
          )
        } else {
          toast.success('Basic information updated successfully')
        }
        loadUserData()
      } else {
        toast.error(result.error || 'Failed to update basic information')
      }
    } catch (error) {
      toast.error('Failed to update basic information')
    } finally {
      setSaving(false)
    }
  }

  // Set a password directly. Separate from saveBasicInfo because it does not touch the
  // users table at all — the password lives in Supabase Auth.
  const savePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    try {
      setSavingPassword(true)
      const result = await superadminApiService.resetUserPassword(userId, newPassword)
      if (result.success) {
        toast.success('Password set. Give it to the client — they are not emailed automatically.')
        setNewPassword('')
      } else {
        toast.error(result.error || 'Failed to set password')
      }
    } catch (error) {
      toast.error('Failed to set password')
    } finally {
      setSavingPassword(false)
    }
  }

  // Save account control
  const saveAccountControl = async () => {
    try {
      setSaving(true)
      const result = await superadminApiService.updateUser(userId, accountControl)
      if (result.success) {
        toast.success('Account settings updated successfully')
        loadUserData()
      } else {
        toast.error(result.error || 'Failed to update account settings')
      }
    } catch (error) {
      toast.error('Failed to update account settings')
    } finally {
      setSaving(false)
    }
  }

  // Adjust credits - uses separate add/remove endpoints
  const adjustCredits = async () => {
    try {
      setSaving(true)

      let result
      if (creditsAdjustment.action === 'add') {
        result = await superadminApiService.adjustUserCredits(userId, {
          amount: creditsAdjustment.amount,
          reason: creditsAdjustment.reason
        })
      } else {
        // Call the dedicated remove endpoint with positive amount
        const res = await fetch(`${API_BASE}/api/v1/admin/credits/remove`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(tokenManager.getTokenSync() || localStorage.getItem('access_token')) || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            credits: creditsAdjustment.amount,
            reason: creditsAdjustment.reason
          })
        })
        const data = await res.json()
        result = { success: res.ok, data, error: data?.detail }
      }

      if (result.success) {
        toast.success(`Credits ${creditsAdjustment.action === 'add' ? 'added' : 'removed'} successfully`)
        setCreditsAdjustment({ amount: 0, reason: '', action: 'add' })
        loadUserData()
        loadTransactions()
      } else {
        toast.error(result.error || 'Failed to adjust credits')
      }
    } catch (error) {
      toast.error('Failed to adjust credits')
    } finally {
      setSaving(false)
    }
  }

  // verifyEmail / reset2FA removed - backend endpoints not implemented

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch (error) {
      console.error('Date format error:', error)
      return '-'
    }
  }

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-ds-5">
          <Skeleton className="h-9 w-64 rounded-ds-lg" />
          <div className="grid gap-ds-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[260px] rounded-ds-2xl" />)}
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  if (!user) {
    return (
      <SuperadminLayout>
        <div className="space-y-ds-5">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground"
                  onClick={() => router.push('/superadmin/users')}>
            <ArrowLeft className="h-4 w-4" /> Users
          </Button>
          <div className="py-ds-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            {failure?.missing ? (
              <>
                <p className="mt-ds-3 text-ds-subheading">No account with this id</p>
                <p className="mt-ds-2 text-ds-body text-muted-foreground">
                  The server looked and found nothing. Either the account was deleted, or the
                  link you followed carries an id that never existed.
                </p>
              </>
            ) : (
              <>
                <p className="mt-ds-3 text-ds-subheading">Could not load this account</p>
                <p className="mt-ds-2 text-ds-body text-muted-foreground">
                  This does not mean the account is gone. The request failed, so nothing about
                  it is known from here.
                </p>
              </>
            )}
            {failure?.detail && (
              <p className="mt-ds-2 text-ds-caption text-muted-foreground">{failure.detail}</p>
            )}
            <div className="mt-ds-3 flex justify-center gap-ds-2">
              {!failure?.missing && (
                <Button variant="outline" size="sm" onClick={() => { loadUserData(); loadTransactions() }}>
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
                </Button>
              )}
              <Button size="sm" onClick={() => router.push('/superadmin/users')}>
                Back to the user list
              </Button>
            </div>
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">

        {/* Header */}
        <div className="space-y-ds-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/superadmin/users" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Users
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit User</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* The tinted circle holding a person icon beside a name told you the row was
              about a person, which the name already did. The console page head instead, so
              this title weighs what every other title weighs. */}
          <PageHead
            title={user.full_name || user.email}
            sub={user.full_name ? user.email : undefined}
            action={
              <>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                  {user.status}
                </Badge>
                <Badge variant="outline">{user.role}</Badge>
              </>
            }
          />
        </div>

        <div className="grid gap-ds-4 lg:grid-cols-2">

          {/* Basic Information */}
          <Panel title="Basic information" description="Profile and contact details. The email is their login.">
              <div className="space-y-ds-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is their login. Changing it updates the sign-in address immediately —
                    tell them, or they will try the old one.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={basicInfo.full_name}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={basicInfo.company}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={basicInfo.job_title}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, job_title: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={basicInfo.phone_number}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>

              <Button onClick={saveBasicInfo} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Basic Information
              </Button>
              </div>
            </Panel>

          {/* Password — lives in Supabase Auth, not the users table, which is why it is its
              own card with its own save rather than part of Basic Information. */}
          <Panel title="Password" description="Sets the password immediately. No email is sent, so you have to pass it to them yourself.">
              <div className="space-y-ds-3">
              <div className="space-y-2">
                <Label htmlFor="new_password">New password</Label>
                <div className="flex gap-2">
                  <Input
                    id="new_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    type="button" variant="outline" size="icon"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={savePassword} disabled={savingPassword || newPassword.length < 8}>
                <KeyRound className="h-4 w-4 mr-2" />
                {savingPassword ? 'Setting…' : 'Set password'}
              </Button>
              </div>
            </Panel>

          {/* Account Control */}
          <Panel title="Account control" description="Role, status and subscription.">
              <div className="space-y-ds-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={accountControl.role} onValueChange={(value) => setAccountControl(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand_free">Brand Free</SelectItem>
                      <SelectItem value="brand_standard">Brand Standard</SelectItem>
                      <SelectItem value="brand_premium">Brand Premium</SelectItem>
                      <SelectItem value="brand_enterprise">Brand Enterprise</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={accountControl.status} onValueChange={(value) => setAccountControl(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subscription_tier">Subscription Tier</Label>
                  <Select value={accountControl.subscription_tier} onValueChange={(value) => setAccountControl(prev => ({ ...prev, subscription_tier: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_expires_at">Subscription Expires</Label>
                  <Input
                    id="subscription_expires_at"
                    type="date"
                    value={accountControl.subscription_expires_at}
                    onChange={(e) => setAccountControl(prev => ({ ...prev, subscription_expires_at: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={saveAccountControl} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Account Settings
              </Button>
              </div>
            </Panel>

          {/* Credits Management */}
          <Panel title="Credits" description="Add or remove credits, and read the last ten movements on this wallet.">
              <div className="space-y-ds-3">
              {/* `|| 0` made a wallet we failed to read look like a wallet with nothing in
                  it, which is the one distinction someone opens this panel to check. */}
              <FieldStrip
                fields={[
                  { label: 'Balance', value: (
                    <span className="tabular-nums">
                      {user.current_balance == null ? '—' : user.current_balance.toLocaleString()}
                    </span>
                  ) },
                  { label: 'Used this month', value: (
                    <span className="tabular-nums">
                      {user.credits_used_this_month == null ? '—' : user.credits_used_this_month.toLocaleString()}
                    </span>
                  ) },
                ]}
              />

              <Separator />

              <div className="space-y-4">
                <h4 className="text-ds-label">Adjust the balance</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select value={creditsAdjustment.action} onValueChange={(value: 'add' | 'remove') => setCreditsAdjustment(prev => ({ ...prev, action: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add credits</SelectItem>
                        <SelectItem value="remove">Remove credits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="1"
                      value={creditsAdjustment.amount || ''}
                      onChange={(e) => setCreditsAdjustment(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Why the balance is changing. This is written to the ledger."
                    value={creditsAdjustment.reason}
                    onChange={(e) => setCreditsAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={adjustCredits}
                  disabled={saving || creditsAdjustment.amount <= 0 || !creditsAdjustment.reason.trim()}
                  variant={creditsAdjustment.action === 'remove' ? 'destructive' : 'default'}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  {creditsAdjustment.action === 'add' ? 'Add' : 'Remove'} credits
                </Button>
              </div>

              {/* Transaction History */}
              {/* The section was gated on `transactions.length > 0`, and a failed fetch also
                  produced an empty array — so a wallet whose history could not be read looked
                  exactly like a wallet that has never moved. A failure says so instead. */}
              {txnFailed && (
                <>
                  <Separator />
                  <p className="text-ds-body-sm text-muted-foreground">
                    The credit history did not load. This is not a wallet with no movements on it.
                  </p>
                </>
              )}
              {!txnFailed && transactions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-ds-2">
                    <h4 className="flex items-center gap-2 text-ds-label">
                      <History className="h-4 w-4" />
                      Recent movements
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {transactions.map((txn) => (
                        <div key={txn.id} className="flex items-center justify-between py-ds-2 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            {txn.amount > 0 ? (
                              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[var(--tone-good-ink)]" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 shrink-0 text-[var(--tone-bad-ink)]" />
                            )}
                            <div className="min-w-0">
                              <span className="truncate block">{txn.description || txn.transaction_type}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(txn.created_at)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className={`font-medium tabular-nums ${txn.amount > 0 ? 'text-[var(--tone-good-ink)]' : 'text-[var(--tone-bad-ink)]'}`}>
                              {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString()}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              bal: {txn.balance_after == null ? '—' : txn.balance_after.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              </div>
            </Panel>

          {/* Team Management */}
          <Panel title="Team" description="Which team this account sits in, and its monthly profile limit.">
              <div className="space-y-ds-3">
              <div className="grid gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Name:</span>
                  <span className="font-medium">{user.team_name || 'No team'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Role:</span>
                  <span className="font-medium">{user.team_role || 'Individual'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profile Limit:</span>
                  <span className="font-medium tabular-nums">{user.monthly_profile_limit == null ? '—' : user.monthly_profile_limit.toLocaleString()}</span>
                </div>
              </div>
              </div>
            </Panel>

          {/* Security Override */}
          <Panel title="Security and sign-in" description="Verification state and sign-in history. Read-only here.">
              <div className="space-y-ds-3">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Verified</Label>
                    <p className="text-sm text-muted-foreground">User email verification status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.email_verified ? 'default' : 'destructive'}>
                      {user.email_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">2FA security status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.two_factor_enabled ? 'default' : 'secondary'}>
                      {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Sign In:</span>
                    <span>{formatDate(user.last_sign_in_at)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Login Count:</span>
                    <span className="tabular-nums">{user.login_count == null ? '—' : user.login_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account Created:</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
              </div>
            </Panel>

        </div>

        {/*
          Delete account: a control that has never done anything.

          The red "Delete Account" button inside this dialog carries no onClick and no
          handler exists anywhere in the file, so pressing it closed nothing, called nothing
          and deleted nothing. An operator who used it would reasonably believe the account
          was gone, and would say so to the client. There is no delete endpoint wired here to
          call, so this is NOT quietly implemented: the control is disabled and says plainly
          that deletion is not available from this screen, and what to do instead. Suspending
          from the user list is the reversible action that actually works today.
        */}
        <div className="space-y-ds-2 border-t border-black/[0.06] pt-ds-4 dark:border-white/[0.07]">
          <p className="flex items-center gap-ds-2 text-ds-label text-destructive">
            <AlertTriangle className="h-4 w-4" /> Deleting an account
          </p>
          <p className="max-w-2xl text-ds-body-sm text-muted-foreground">
            Accounts cannot be deleted from here. This screen has never been able to delete
            one: the button that used to sit here was not connected to anything, so pressing
            it looked like it worked and did nothing at all. To cut someone&apos;s access,
            suspend them from the user list, which is reversible and takes effect at once. A
            permanent deletion has to be done by an engineer, because it touches billing
            records and the audit trail.
          </p>
          <Button variant="destructive" disabled className="mt-ds-1">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete account (not available here)
          </Button>
        </div>

      </div>
    </SuperadminLayout>
  )
}
