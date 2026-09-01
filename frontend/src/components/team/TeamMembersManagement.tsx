"use client"

import { useState, useEffect } from 'react'
import { Users, UserPlus, Mail, Trash2, Crown, Clock, CheckCircle, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { teamApiService, TeamContext, TeamMember, TeamInvitation } from '@/services/teamApi'

interface TeamMembersManagementProps {
  teamContext?: TeamContext | null
  className?: string
}

export function TeamMembersManagement({ 
  teamContext: propTeamContext, 
  className = "" 
}: TeamMembersManagementProps) {
  const [teamContext, setTeamContext] = useState<TeamContext | null>(propTeamContext || null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Invite form state
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  // The accept link, shown only when the email could not be delivered.
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  // Confirmation states
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{id: string, name: string} | null>(null)
  const [cancelInviteConfirm, setCancelInviteConfirm] = useState(false)
  const [inviteToCancel, setInviteToCancel] = useState<{id: string, email: string} | null>(null)

  // Who this user is on the team, and how many seats the plan has. Read from the backend
  // rather than inferred: the stored context reports everybody as a 'member', so an owner
  // opening this panel never saw the invite button that the whole panel exists for.
  const [seats, setSeats] = useState<{
    user_role: string
    subscription_tier: string
    active_members: number
    max_members: number
    pending_invitations: number
    available_slots: number
  } | null>(null)

  const isOwner = seats ? seats.user_role === 'owner' : teamContext?.user_role === 'owner'
  const seatsFull = !!seats && seats.available_slots <= 0

  useEffect(() => {
    if (propTeamContext) {
      setTeamContext(propTeamContext)
    } else {
      // Load team context if not provided
      const storedContext = teamApiService.getStoredTeamContext()
      if (storedContext) {
        setTeamContext(storedContext)
      }
    }

    teamApiService.getSeatContext().then((res) => {
      if (res.success && res.data) setSeats(res.data)
    })

    fetchTeamData()

    // Listen for team context updates
    const handleTeamContextUpdate = (event: CustomEvent<TeamContext>) => {
      setTeamContext(event.detail)
    }

    window.addEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    return () => {
      window.removeEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    }
  }, [propTeamContext])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Always ask for the invitations. Gating this on isOwner raced the role lookup, so
      // an owner's pending invitations were fetched only if the role happened to arrive
      // first; a non-owner simply gets a failed result here, which is ignored below.
      const [membersResult, invitationsResult] = await Promise.all([
        teamApiService.getTeamMembers(),
        teamApiService.getTeamInvitations('pending')
      ])

      if (membersResult.success) {
        setMembers(membersResult.data || [])
      } else {
        setError(membersResult.error || 'Failed to load team members')
      }

      if (invitationsResult.success) {
        setInvitations(invitationsResult.data || [])
      }

    } catch (error) {

      setError('Failed to load team information')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Email address is required')
      return
    }

    setInviteLoading(true)
    setInviteError(null)

    try {
      const result = await teamApiService.inviteTeamMember(
        inviteEmail.trim(),
        'member',
        inviteMessage.trim() || undefined
      )

      if (result.success) {
        // The seat exists whether or not the email left. If it did not, hold the dialog
        // open with the link, because a silent failure here is a seat nobody ever fills.
        if (result.data && result.data.email_sent === false) {
          setInviteLink(result.data.invitation_url || null)
          setInviteError(result.data.email_error || 'The invitation was created, but the email did not send.')
          await fetchTeamData()
          return
        }

        setInviteEmail('')
        setInviteMessage('')
        setInviteLink(null)
        setShowInviteDialog(false)
        await fetchTeamData() // Refresh data
      } else {
        setInviteError(result.error || 'Failed to send invitation')
      }
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    setMemberToRemove({ id: userId, name: userName })
    setRemoveMemberConfirm(true)
  }

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      const result = await teamApiService.removeTeamMember(memberToRemove.id)
      if (result.success) {
        await fetchTeamData() // Refresh data
        setRemoveMemberConfirm(false)
        setMemberToRemove(null)
      } else {
        alert('Failed to remove member: ' + result.error)
      }
    } catch (error: any) {
      alert('Failed to remove member: ' + error.message)
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    setInviteToCancel({ id: invitationId, email })
    setCancelInviteConfirm(true)
  }

  const confirmCancelInvitation = async () => {
    if (!inviteToCancel) return

    try {
      const result = await teamApiService.cancelTeamInvitation(inviteToCancel.id)
      if (result.success) {
        await fetchTeamData() // Refresh data
        setCancelInviteConfirm(false)
        setInviteToCancel(null)
      } else {
        alert('Failed to cancel invitation: ' + result.error)
      }
    } catch (error: any) {
      alert('Failed to cancel invitation: ' + error.message)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading team members...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Team Members ({members.length})</span>
          </div>
          {isOwner && (
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team. They'll receive an email with instructions.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      disabled={inviteLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Personal Message (Optional)</label>
                    <Textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Join our marketing team to collaborate on analytics projects..."
                      rows={3}
                      disabled={inviteLoading}
                    />
                  </div>
                  
                  {inviteError && (
                    <Alert>
                      <AlertDescription>{inviteError}</AlertDescription>
                    </Alert>
                  )}

                  {inviteLink && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Send them this link</label>
                      <Input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInviteDialog(false)}
                    disabled={inviteLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInviteMember}
                    disabled={inviteLoading || !inviteEmail.trim()}
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Members */}
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.user_name || member.user_email}
                    </span>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                      {member.role === 'owner' ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          Member
                        </>
                      )}
                    </Badge>
                    <Badge 
                      variant={member.status === 'active' ? 'outline' : 'destructive'} 
                      className="text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {member.user_email} • Joined {formatDate(member.joined_at)}
                  </div>
                </div>
              </div>
              
              {isOwner && member.role === 'member' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.user_id, member.user_name || member.user_email)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Pending Invitations ({invitations.length})
              </h4>
              
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border border-dashed rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{invitation.email}</span>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Invited by {invitation.invited_by_email} • 
                        Expires {formatDate(invitation.expires_at)}
                      </div>
                      {invitation.personal_message && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          "{invitation.personal_message}"
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Team Capacity Info. The cap comes from the plan, not from a hardcoded 5:
            a Standard team has two seats and was being told it had five. */}
        {(seats || teamContext) && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Seats used:</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {seats
                    ? `${seats.active_members + seats.pending_invitations}/${seats.max_members} seats`
                    : `${members.length + invitations.length} seats`}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {(seats?.subscription_tier || teamContext?.subscription_tier)} plan
                </Badge>
              </div>
            </div>
            {isOwner && seatsFull && (
              <div className="text-xs text-muted-foreground">
                Every seat on this plan is taken. Cancel a pending invitation to free one,
                or upgrade the plan to add more people.
              </div>
            )}
          </>
        )}

        {/* Non-owner message */}
        {!isOwner && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              Only team owners can invite or remove members
            </div>
          </div>
        )}
      </CardContent>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removeMemberConfirm} onOpenChange={setRemoveMemberConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.name} from the team?
              They will lose access to all team features and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRemoveMemberConfirm(false)
                setMemberToRemove(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Confirmation Dialog */}
      <AlertDialog open={cancelInviteConfirm} onOpenChange={setCancelInviteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to {inviteToCancel?.email}?
              They will not be able to join the team using this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCancelInviteConfirm(false)
                setInviteToCancel(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export default TeamMembersManagement