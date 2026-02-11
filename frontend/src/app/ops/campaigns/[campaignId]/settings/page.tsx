/**
 * Operations OS - Campaign Settings (Internal Only)
 * Configure visibility rules, approval requirements, and templates
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedOperationsRoute from '@/components/operations/ProtectedOperationsRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Settings,
  Lock,
  Eye,
  Shield,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Save,
  RefreshCw,
  ChevronRight,
  UserCheck,
  Mail,
  Globe,
  Palette,
  Zap,
  Bell,
  Calendar,
  Plus,
  Trash,
  Edit,
  Copy
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
    client_users: [
      {
        id: '1',
        email: 'client@brand.com',
        name: 'Brand Manager',
        can_approve: true,
        can_comment: true
      }
    ]
  });

  const [loading, setLoading] = useState(true);
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
      // Load settings from API
      // For now, using defaults
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save settings via API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      toast.success('Settings saved successfully');
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

  if (!userAccess.permissions.view_internal_notes) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Settings is available for internal users only
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <ProtectedOperationsRoute requiredPermission="view_settings">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button
              onClick={() => router.push(`/ops/campaigns/${campaignId}`)}
              className="hover:underline"
            >
              {currentCampaign?.campaign_name}
            </button>
            <ChevronRight className="h-4 w-4" />
            <span>Settings</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Campaign Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure visibility rules and approval requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Internal Only
          </Badge>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Client Visibility Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Client Visibility Rules</CardTitle>
          </div>
          <CardDescription>
            Control what clients can see and do in the Operations OS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              {
                key: 'client_can_view_internal_notes',
                label: 'View Internal Notes',
                description: 'Allow clients to see internal notes and comments'
              },
              {
                key: 'client_can_view_checklists',
                label: 'View Production Checklists',
                description: 'Show production checklists and shoot day details'
              },
              {
                key: 'client_can_view_banking',
                label: 'View Banking Details',
                description: 'Display creator banking information (highly sensitive)'
              },
              {
                key: 'client_can_view_reliability_score',
                label: 'View Reliability Scores',
                description: 'Show creator reliability and performance metrics'
              },
              {
                key: 'client_can_export_data',
                label: 'Export Data',
                description: 'Allow clients to export campaign data to CSV'
              },
              {
                key: 'show_creator_contact_info',
                label: 'Show Creator Contact Info',
                description: 'Display creator email and phone numbers'
              }
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{setting.label}</Label>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Switch
                  checked={settings.visibility[setting.key as keyof typeof settings.visibility]}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({
                      ...prev,
                      visibility: {
                        ...prev.visibility,
                        [setting.key]: checked
                      }
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approval Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Approval Requirements</CardTitle>
          </div>
          <CardDescription>
            Configure when and how approvals are required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Concept Approval Required</Label>
                <p className="text-sm text-muted-foreground">
                  Require client approval before moving to production
                </p>
              </div>
              <Switch
                checked={settings.approvals.concept_approval_required}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({
                    ...prev,
                    approvals: {
                      ...prev.approvals,
                      concept_approval_required: checked
                    }
                  }));
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Approve After Days</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve concepts after specified days
                </p>
              </div>
              <Input
                type="number"
                min="0"
                max="30"
                value={settings.approvals.auto_approve_after_days}
                onChange={(e) => {
                  setSettings(prev => ({
                    ...prev,
                    approvals: {
                      ...prev.approvals,
                      auto_approve_after_days: parseInt(e.target.value)
                    }
                  }));
                }}
                className="w-20"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Approval for Posting</Label>
                <p className="text-sm text-muted-foreground">
                  Client must approve before content is posted
                </p>
              </div>
              <Switch
                checked={settings.approvals.require_client_approval_for_posting}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({
                    ...prev,
                    approvals: {
                      ...prev.approvals,
                      require_client_approval_for_posting: checked
                    }
                  }));
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Internal Bypass</Label>
                <p className="text-sm text-muted-foreground">
                  Internal admins can bypass approval requirements
                </p>
              </div>
              <Switch
                checked={settings.approvals.allow_internal_bypass}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({
                    ...prev,
                    approvals: {
                      ...prev.approvals,
                      allow_internal_bypass: checked
                    }
                  }));
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Default Templates</CardTitle>
          </div>
          <CardDescription>
            Set default values for new deliverables and concepts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Default Deliverable Type</Label>
            <Select
              value={settings.templates.default_deliverable_type}
              onValueChange={(v) => {
                setSettings(prev => ({
                  ...prev,
                  templates: {
                    ...prev.templates,
                    default_deliverable_type: v
                  }
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

          <div>
            <Label>Default Assignment Scope</Label>
            <Select
              value={settings.templates.default_assignment_scope}
              onValueChange={(v) => {
                setSettings(prev => ({
                  ...prev,
                  templates: {
                    ...prev.templates,
                    default_assignment_scope: v
                  }
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

          <div>
            <Label>Default Concept Template</Label>
            <Textarea
              value={settings.templates.default_concept_template}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  templates: {
                    ...prev.templates,
                    default_concept_template: e.target.value
                  }
                }));
              }}
              placeholder="Enter default concept template..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure when to send notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              key: 'notify_on_approval_needed',
              label: 'Approval Needed',
              description: 'Notify when concepts need approval'
            },
            {
              key: 'notify_on_status_change',
              label: 'Status Changes',
              description: 'Notify on deliverable status updates'
            },
            {
              key: 'notify_on_overdue',
              label: 'Overdue Items',
              description: 'Alert when deliverables are overdue'
            },
            {
              key: 'daily_summary',
              label: 'Daily Summary',
              description: 'Send daily campaign summary email'
            }
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{setting.label}</Label>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={settings.notifications[setting.key as keyof typeof settings.notifications]}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      [setting.key]: checked
                    }
                  }));
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Client Access Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Client Access Management</CardTitle>
          </div>
          <CardDescription>
            Manage which client users can access and approve content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Client User */}
            <div className="flex items-center gap-2">
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
                Add User
              </Button>
            </div>

            {/* Client Users Table */}
            {settings.client_users.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Can Approve</TableHead>
                      <TableHead>Can Comment</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.client_users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          <Switch
                            checked={user.can_approve}
                            onCheckedChange={() =>
                              handleTogglePermission(user.id, 'can_approve')
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.can_comment}
                            onCheckedChange={() =>
                              handleTogglePermission(user.id, 'can_comment')
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveClientUser(user.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <p className="font-medium">Reset All Settings</p>
                <p className="text-sm text-muted-foreground">
                  Reset all settings to default values
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Reset Settings
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <p className="font-medium">Archive Campaign</p>
                <p className="text-sm text-muted-foreground">
                  Archive this campaign and all its data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Archive Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </ProtectedOperationsRoute>
  );
}