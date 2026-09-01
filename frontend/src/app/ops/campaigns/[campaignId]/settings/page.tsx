/**
 * Operations — campaign settings. Internal only.
 *
 * Density tier: WORKING, at form width. This was six stacked cards, each with its own icon,
 * title, description and 24px of padding, so a page of switches read as six unrelated
 * objects. A setting is not an object you can click, move or delete, so the cards come off
 * and the sections are separated by space and one hairline under each heading. The controls
 * are unchanged, down to the last switch.
 *
 * The one place that keeps a real border is the danger zone, because destroying something is
 * worth an edge.
 *
 * Honesty: a failed settings read used to fire a toast and then render the hardcoded
 * defaults as though they were this campaign's saved settings, which is the worst version of
 * the fabricated-fact problem on this screen: an operator could have looked at "clients
 * cannot see banking details", believed it, and been wrong. A failed read now says so and
 * refuses to draw the form.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedOperationsRoute from '@/components/operations/ProtectedOperationsRoute';
import { operationsApi } from '@/services/operationsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Page, Sections, Group, PageHead, SectionHead,
  State, Failed, Empty, Waiting, Note,
} from '@/components/campaigns/surface';
import {
  Lock,
  Save,
  RefreshCw,
  ChevronRight,
  Mail,
  Plus,
  Trash,
} from 'lucide-react';
import { useOperations } from '@/contexts/OperationsContext';
import { toast } from 'sonner';

interface CampaignSettings {
  visibility: {
    client_can_view_internal_notes: boolean;
    client_can_view_checklists: boolean;
    client_can_view_banking: boolean;
    client_can_view_reliability_score: boolean;
    client_can_export_data: boolean;
    show_creator_contact_info: boolean;
  };
  approvals: {
    concept_approval_required: boolean;
    auto_approve_after_days: number;
    require_client_approval_for_posting: boolean;
    allow_internal_bypass: boolean;
  };
  templates: {
    default_deliverable_type: string;
    default_concept_template: string;
    default_assignment_scope: string;
  };
  notifications: {
    notify_on_approval_needed: boolean;
    notify_on_status_change: boolean;
    notify_on_overdue: boolean;
    daily_summary: boolean;
  };
  client_users: Array<{
    id: string;
    email: string;
    name: string;
    can_approve: boolean;
    can_comment: boolean;
  }>;
}

/** A switch and the sentence that explains it. 8px label to help text, 16px between rows. */
function SwitchRow({
  label, description, checked, onChange,
}: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-ds-5 border-b border-border/70 py-ds-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-ds-1">
        <Label className="text-ds-label">{label}</Label>
        <p className="max-w-prose text-ds-caption text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-ds-1 shrink-0" />
    </div>
  );
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const { currentCampaign, selectCampaign, userAccess } = useOperations();

  const [settings, setSettings] = useState<CampaignSettings>({
    visibility: {
      client_can_view_internal_notes: false,
      client_can_view_checklists: false,
      client_can_view_banking: false,
      client_can_view_reliability_score: false,
      client_can_export_data: false,
      show_creator_contact_info: true
    },
    approvals: {
      concept_approval_required: true,
      auto_approve_after_days: 3,
      require_client_approval_for_posting: false,
      allow_internal_bypass: true
    },
    templates: {
      default_deliverable_type: 'video',
      default_concept_template: '',
      default_assignment_scope: 'reel'
    },
    notifications: {
      notify_on_approval_needed: true,
      notify_on_status_change: true,
      notify_on_overdue: true,
      daily_summary: false
    },
    client_users: []
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');

  useEffect(() => {
    // Check access - settings is internal only
    if (!userAccess.permissions.view_internal_notes) {
      toast.error('Access denied: Settings is internal only');
      router.push(`/ops/campaigns/${campaignId}`);
      return;
    }

    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
    loadSettings();
  }, [campaignId, userAccess]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await operationsApi.getCampaignSettings(campaignId);
      const saved = res?.data ?? res;
      // Merge persisted settings over defaults so new keys keep sane defaults.
      if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
        setSettings(prev => ({
          ...prev,
          ...saved,
          visibility: { ...prev.visibility, ...(saved.visibility || {}) },
          approvals: { ...prev.approvals, ...(saved.approvals || {}) },
          templates: { ...prev.templates, ...(saved.templates || {}) },
          notifications: { ...prev.notifications, ...(saved.notifications || {}) },
          client_users: Array.isArray(saved.client_users) ? saved.client_users : prev.client_users,
        }));
      }
      setLoadError(null);
    } catch (error: any) {
      /* Not a toast and then the defaults. A form drawn from defaults after a failed read
         claims these ARE the campaign's settings, and saving would then write them. */
      setLoadError(error?.message || 'The saved settings could not be read.');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await operationsApi.updateCampaignSettings(campaignId, settings);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddClientUser = () => {
    if (!newClientEmail) {
      toast.error('Please enter an email');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      email: newClientEmail,
      name: newClientEmail.split('@')[0],
      can_approve: true,
      can_comment: true
    };

    setSettings(prev => ({
      ...prev,
      client_users: [...prev.client_users, newUser]
    }));
    setNewClientEmail('');
    toast.success('Client user added');
  };

  const handleRemoveClientUser = (userId: string) => {
    setSettings(prev => ({
      ...prev,
      client_users: prev.client_users.filter(u => u.id !== userId)
    }));
    toast.success('Client user removed');
  };

  const handleTogglePermission = (userId: string, permission: 'can_approve' | 'can_comment') => {
    setSettings(prev => ({
      ...prev,
      client_users: prev.client_users.map(u =>
        u.id === userId ? { ...u, [permission]: !u[permission] } : u
      )
    }));
  };

  const handleResetSettings = async () => {
    setSaving(true);
    try {
      // Persist an empty object — loadSettings merges over defaults, so this
      // is a true reset to defaults, not a delete.
      await operationsApi.updateCampaignSettings(campaignId, {});
      toast.success('Settings reset to defaults');
      await loadSettings();
    } catch {
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveCampaign = async () => {
    setSaving(true);
    try {
      await operationsApi.updateCampaignStatus(campaignId, 'archived');
      toast.success('Campaign archived');
      router.push('/ops/campaigns');
    } catch {
      toast.error('Failed to archive campaign');
      setSaving(false);
    }
  };

  if (!userAccess.permissions.view_internal_notes) {
    return (
      <Page width="form">
        <Sections>
          <PageHead
            title="Settings are internal only"
            sub="This screen decides what a client can see, so only the team can open it."
          />
        </Sections>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page width="form">
        <Sections>
          <PageHead title="Campaign settings" sub="What the client sees, and what needs approving." />
          <Waiting lines={6} />
        </Sections>
      </Page>
    );
  }

  const setVisibility = (key: keyof CampaignSettings['visibility'], checked: boolean) =>
    setSettings(prev => ({ ...prev, visibility: { ...prev.visibility, [key]: checked } }));
  const setNotification = (key: keyof CampaignSettings['notifications'], checked: boolean) =>
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: checked } }));

  return (
    <ProtectedOperationsRoute requiredPermission="view_settings">
      <Page width="form">
        <Sections>
          <PageHead
            back={
              <button
                onClick={() => router.push(`/ops/campaigns/${campaignId}`)}
                className="flex w-fit items-center gap-ds-1 text-ds-caption text-muted-foreground hover:text-foreground"
              >
                {currentCampaign?.campaign_name || 'Campaign'}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
            title="Campaign settings"
            sub="What the client can see, what has to be approved, and who gets told."
            action={
              <>
                <State tone="neutral">
                  <Lock className="mr-ds-1 h-3 w-3" />
                  Internal only
                </State>
                <Button onClick={handleSaveSettings} disabled={saving || !!loadError}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save changes
                    </>
                  )}
                </Button>
              </>
            }
          />

          {loadError ? (
            <Failed
              what="The saved settings did not load"
              detail={`${loadError} The form is not shown, because the values below would be defaults rather than this campaign's real settings, and saving them would overwrite it.`}
              onRetry={loadSettings}
            />
          ) : (
            <>
              <Group>
                <SectionHead
                  title="What the client can see"
                  sub="Everything here is off unless you turn it on."
                />
                <div className="flex flex-col">
                  {([
                    {
                      key: 'client_can_view_internal_notes',
                      label: 'Internal notes',
                      description: 'Let the client read internal notes and comments.'
                    },
                    {
                      key: 'client_can_view_checklists',
                      label: 'Production checklists',
                      description: 'Show production checklists and shoot day details.'
                    },
                    {
                      key: 'client_can_view_banking',
                      label: 'Banking details',
                      description: 'Show creator banking information. Highly sensitive.'
                    },
                    {
                      key: 'client_can_view_reliability_score',
                      label: 'Reliability scores',
                      description: 'Show creator reliability and performance scores.'
                    },
                    {
                      key: 'client_can_export_data',
                      label: 'Export data',
                      description: 'Let the client export campaign data to CSV.'
                    },
                    {
                      key: 'show_creator_contact_info',
                      label: 'Creator contact details',
                      description: 'Show creator email addresses and phone numbers.'
                    }
                  ] as const).map(setting => (
                    <SwitchRow
                      key={setting.key}
                      label={setting.label}
                      description={setting.description}
                      checked={settings.visibility[setting.key]}
                      onChange={(checked) => setVisibility(setting.key, checked)}
                    />
                  ))}
                </div>
              </Group>

              <Group>
                <SectionHead title="Approvals" sub="When work has to wait for a yes." />
                <div className="flex flex-col">
                  <SwitchRow
                    label="Concept approval required"
                    description="The client approves a concept before it goes into production."
                    checked={settings.approvals.concept_approval_required}
                    onChange={(checked) => setSettings(prev => ({
                      ...prev,
                      approvals: { ...prev.approvals, concept_approval_required: checked }
                    }))}
                  />

                  <div className="flex items-start justify-between gap-ds-5 border-b border-border/70 py-ds-3">
                    <div className="flex min-w-0 flex-col gap-ds-1">
                      <Label className="text-ds-label">Auto approve after</Label>
                      <p className="max-w-prose text-ds-caption text-muted-foreground">
                        Days a concept can sit with the client before it approves itself. Zero
                        means never.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-ds-2">
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={settings.approvals.auto_approve_after_days}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          setSettings(prev => ({
                            ...prev,
                            approvals: {
                              ...prev.approvals,
                              // `parseInt('')` is NaN, which used to be written straight into
                              // the saved settings.
                              auto_approve_after_days: Number.isFinite(parsed) ? parsed : 0,
                            }
                          }));
                        }}
                        className="w-20"
                      />
                      <span className="text-ds-caption text-muted-foreground">days</span>
                    </div>
                  </div>

                  <SwitchRow
                    label="Approval required before posting"
                    description="The client signs off content before it goes live."
                    checked={settings.approvals.require_client_approval_for_posting}
                    onChange={(checked) => setSettings(prev => ({
                      ...prev,
                      approvals: { ...prev.approvals, require_client_approval_for_posting: checked }
                    }))}
                  />

                  <SwitchRow
                    label="Internal bypass"
                    description="Admins can move work past an approval that has not happened."
                    checked={settings.approvals.allow_internal_bypass}
                    onChange={(checked) => setSettings(prev => ({
                      ...prev,
                      approvals: { ...prev.approvals, allow_internal_bypass: checked }
                    }))}
                  />
                </div>
              </Group>

              <Group>
                <SectionHead
                  title="Defaults"
                  sub="What a new deliverable or concept starts out as."
                />
                <div className="flex flex-col gap-ds-3">
                  <div className="flex flex-col gap-ds-2">
                    <Label>Deliverable type</Label>
                    <Select
                      value={settings.templates.default_deliverable_type}
                      onValueChange={(v: string) => {
                        setSettings(prev => ({
                          ...prev,
                          templates: { ...prev.templates, default_deliverable_type: v }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="reel">Reel</SelectItem>
                        <SelectItem value="story_set">Story Set</SelectItem>
                        <SelectItem value="photo_set">Photo Set</SelectItem>
                        <SelectItem value="event_content">Event Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-ds-2">
                    <Label>Assignment scope</Label>
                    <Select
                      value={settings.templates.default_assignment_scope}
                      onValueChange={(v: string) => {
                        setSettings(prev => ({
                          ...prev,
                          templates: { ...prev.templates, default_assignment_scope: v }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reel">1 Reel</SelectItem>
                        <SelectItem value="reel_stories">1 Reel + 3 Stories</SelectItem>
                        <SelectItem value="multiple_reels">Multiple Reels</SelectItem>
                        <SelectItem value="custom">Custom Scope</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-ds-2">
                    <Label>Concept template</Label>
                    <Textarea
                      value={settings.templates.default_concept_template}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          templates: { ...prev.templates, default_concept_template: e.target.value }
                        }));
                      }}
                      placeholder="The starting point for every new concept on this campaign..."
                      rows={4}
                    />
                  </div>
                </div>
              </Group>

              <Group>
                <SectionHead title="Notifications" sub="What is worth telling someone about." />
                <div className="flex flex-col">
                  {([
                    {
                      key: 'notify_on_approval_needed',
                      label: 'Approval needed',
                      description: 'Tell people when a concept is waiting on a decision.'
                    },
                    {
                      key: 'notify_on_status_change',
                      label: 'Status changes',
                      description: 'Tell people when a deliverable moves.'
                    },
                    {
                      key: 'notify_on_overdue',
                      label: 'Overdue items',
                      description: 'Tell people when a deliverable passes its deadline.'
                    },
                    {
                      key: 'daily_summary',
                      label: 'Daily summary',
                      description: 'One email a day with where the campaign stands.'
                    }
                  ] as const).map(setting => (
                    <SwitchRow
                      key={setting.key}
                      label={setting.label}
                      description={setting.description}
                      checked={settings.notifications[setting.key]}
                      onChange={(checked) => setNotification(setting.key, checked)}
                    />
                  ))}
                </div>
              </Group>

              <Group>
                <SectionHead
                  title="Client access"
                  sub="Who on the client side can open this campaign, and what they can do."
                />
                <div className="flex flex-col gap-ds-3">
                  <div className="flex items-center gap-ds-2">
                    <Input
                      placeholder="Enter client email..."
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddClientUser();
                        }
                      }}
                    />
                    <Button onClick={handleAddClientUser}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add user
                    </Button>
                  </div>

                  {settings.client_users.length === 0 ? (
                    <Empty>No client user has been given access to this campaign yet.</Empty>
                  ) : (
                    <div className="flex flex-col">
                      {settings.client_users.map(user => (
                        <div
                          key={user.id}
                          className="flex flex-wrap items-center gap-ds-3 border-b border-border/70 py-ds-3 last:border-b-0"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-ds-2">
                            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="truncate text-ds-label">{user.email}</p>
                              <p className="truncate text-ds-caption text-muted-foreground">{user.name}</p>
                            </div>
                          </div>
                          <label className="flex items-center gap-ds-2 text-ds-caption text-muted-foreground">
                            <Switch
                              checked={user.can_approve}
                              onCheckedChange={() => handleTogglePermission(user.id, 'can_approve')}
                            />
                            Approve
                          </label>
                          <label className="flex items-center gap-ds-2 text-ds-caption text-muted-foreground">
                            <Switch
                              checked={user.can_comment}
                              onCheckedChange={() => handleTogglePermission(user.id, 'can_comment')}
                            />
                            Comment
                          </label>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Remove ${user.email}`}
                            onClick={() => handleRemoveClientUser(user.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Note>
                    A user added here is saved with the rest of the settings. Nothing is sent
                    to them until you save.
                  </Note>
                </div>
              </Group>

              {/* The one card left on the page. Destroying something is worth an edge. */}
              <Group>
                <SectionHead title="Careful" sub="These two cannot be undone from here." />
                <div className="flex flex-col gap-ds-3 rounded-ds-surface border border-destructive/30 p-ds-4">
                  <div className="flex flex-wrap items-center justify-between gap-ds-3">
                    <div className="flex min-w-0 flex-col gap-ds-1">
                      <p className="text-ds-label">Reset all settings</p>
                      <p className="max-w-prose text-ds-caption text-muted-foreground">
                        Everything on this page goes back to its default.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={saving}>
                          Reset settings
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Visibility, approvals, templates, notifications and client users
                            all return to their default values. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleResetSettings}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-ds-3 border-t border-destructive/20 pt-ds-3">
                    <div className="flex min-w-0 flex-col gap-ds-1">
                      <p className="text-ds-label">Archive campaign</p>
                      <p className="max-w-prose text-ds-caption text-muted-foreground">
                        The campaign leaves the active dashboards. Its data stays.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={saving}>
                          Archive campaign
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Archive this campaign?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The campaign moves to archived status and disappears from active
                            dashboards. You can restore it later by changing its status.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleArchiveCampaign}>Archive</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Group>
            </>
          )}
        </Sections>
      </Page>
    </ProtectedOperationsRoute>
  );
}
