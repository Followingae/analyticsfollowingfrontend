'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  User,
  Shield,
  DollarSign,
  Database,
  Plus,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { superadminService } from '@/utils/superadminApi';

// Types
interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
  subscription_tier?: string;
  subscription_plan?: string; // Legacy field
  credits: number;
  credits_balance?: number; // Legacy field
  created_at: string;
  updated_at?: string;
  last_login?: string | null;
  supabase_user_id?: string;
  stripe_customer_id?: string;
  billing_status?: string;
  preferences?: {
    deleted_at?: string;
    deleted_by?: string;
    previous_status?: string;
    restored_at?: string;
    restored_by?: string;
    [key: string]: any;
  };
}

interface EditableUserFields {
  full_name: string;
  role: string;
  status: string;
  subscription_tier: string;
}

interface EditUserModalProps {
  userId: string;
  user?: User | null;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

export default function EditUserModal({ userId, user: initialUser, onClose, onSuccess }: EditUserModalProps) {
  const [loading, setLoading] = useState(!initialUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User data
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);

  // Form data
  const [formData, setFormData] = useState<EditableUserFields>({
    full_name: '',
    role: '',
    status: '',
    subscription_tier: ''
  });

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  // Credit management
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditOperation, setCreditOperation] = useState<'add' | 'remove'>('add');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  // Fetch user details if not provided
  useEffect(() => {
    if (!initialUser) {
      fetchUserDetails();
    } else {
      initializeFormData(initialUser);
    }
  }, [userId, initialUser]);

  // Check for changes
  useEffect(() => {
    if (originalUser) {
      const changed = Object.keys(formData).some(key => {
        const formValue = formData[key as keyof EditableUserFields];
        const originalValue = originalUser[key as keyof User] || '';
        return formValue !== originalValue;
      });
      setHasChanges(changed);
    }
  }, [formData, originalUser]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // Try to fetch individual user details
      // If endpoint doesn't exist, use the passed data
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        // If GET endpoint doesn't exist, we need the user data from parent
        throw new Error('User data not available');
      }

      const userData = await response.json();
      setUser(userData);
      initializeFormData(userData);
    } catch (err: any) {
      setError('Please provide user data from the parent component');
    } finally {
      setLoading(false);
    }
  };

  const initializeFormData = (userData: User) => {
    setUser(userData);
    setOriginalUser(userData);

    setFormData({
      full_name: userData.full_name || '',
      role: userData.role || 'user',
      status: userData.status || 'active',
      subscription_tier: userData.subscription_tier || userData.subscription_plan || 'free'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errors = validateUserUpdate(formData);
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join(', '));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await superadminService.updateUser(userId, formData);

      setSuccess('User updated successfully!');
      toast.success('User updated successfully');

      // Call parent callback
      if (onSuccess) {
        onSuccess({ ...user, ...formData });
      }

      // Close after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalUser) {
      setFormData({
        full_name: originalUser.full_name || '',
        role: originalUser.role || 'user',
        status: originalUser.status || 'active',
        subscription_tier: originalUser.subscription_tier || originalUser.subscription_plan || 'free'
      });
    }
  };

  const handleCreditOperation = async () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!creditReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      if (creditOperation === 'add') {
        await superadminService.addCredits(userId, amount, creditReason);
        toast.success(`Added ${amount} credits successfully`);
      } else {
        await superadminService.removeCredits(userId, amount, creditReason);
        toast.success(`Removed ${amount} credits successfully`);
      }

      // Update local user data
      if (user) {
        const currentCredits = user.credits || user.credits_balance || 0;
        const newCredits = creditOperation === 'add'
          ? currentCredits + amount
          : Math.max(0, currentCredits - amount);
        setUser({ ...user, credits: newCredits, credits_balance: newCredits });
      }

      setShowCreditsModal(false);
      setCreditAmount('');
      setCreditReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update credits');
    }
  };

  const validateUserUpdate = (data: EditableUserFields) => {
    const errors: Record<string, string> = {};

    // Full name validation
    if (data.full_name && data.full_name.length > 100) {
      errors.full_name = 'Name must be less than 100 characters';
    }

    // Role validation
    const validRoles = ['user', 'standard', 'premium', 'admin', 'super_admin'];
    if (!validRoles.includes(data.role)) {
      errors.role = 'Invalid role selected';
    }

    // Status validation
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(data.status)) {
      errors.status = 'Invalid status selected';
    }

    // Subscription validation
    const validTiers = ['free', 'standard', 'premium', 'enterprise'];
    if (!validTiers.includes(data.subscription_tier)) {
      errors.subscription_tier = 'Invalid subscription tier';
    }

    return errors;
  };

  const getAuthToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('No valid authentication token found');
    }
    return token;
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getUserCredits = () => {
    return user?.credits || user?.credits_balance || 0;
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2">Loading user details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>User data not available</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit User</DialogTitle>
            <DialogDescription>
              Make changes to user account settings and permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">
                  <User className="h-4 w-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="permissions">
                  <Shield className="h-4 w-4 mr-2" />
                  Permissions
                </TabsTrigger>
                <TabsTrigger value="subscription">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Subscription
                </TabsTrigger>
                <TabsTrigger value="metadata">
                  <Database className="h-4 w-4 mr-2" />
                  Metadata
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Email - Read Only */}
                    <div>
                      <Label>Email Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={user.email}
                          disabled
                          className="bg-muted"
                        />
                        <Badge variant="secondary">Read Only</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed after registration
                      </p>
                    </div>

                    {/* Full Name - Editable */}
                    <div>
                      <Label htmlFor="full_name">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({
                          ...formData,
                          full_name: e.target.value
                        })}
                        placeholder="Enter user's full name"
                        maxLength={100}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Display name shown throughout the system
                      </p>
                    </div>

                    {/* User ID - Read Only */}
                    <div>
                      <Label>User ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={user.id}
                          disabled
                          className="bg-muted font-mono text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(user.id, 'User ID')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Created Date - Read Only */}
                    <div>
                      <Label>Account Created</Label>
                      <Input
                        value={formatDateTime(user.created_at)}
                        disabled
                        className="bg-muted mt-1"
                      />
                    </div>

                    {/* Last Activity - Read Only */}
                    <div>
                      <Label>Last Activity</Label>
                      <Input
                        value={formatDateTime(user.updated_at || user.last_login)}
                        disabled
                        className="bg-muted mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Role & Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Role - Editable */}
                    <div>
                      <Label htmlFor="role">
                        User Role <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          role: value
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User (Basic)</SelectItem>
                          <SelectItem value="standard">Standard User</SelectItem>
                          <SelectItem value="premium">Premium User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <RolePermissionsDisplay role={formData.role} />
                    </div>

                    {/* Status - Editable */}
                    <div>
                      <Label htmlFor="status">
                        Account Status <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          status: value
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <StatusExplanation status={formData.status} />
                    </div>

                    {/* Show warning for admin roles */}
                    {(formData.role === 'admin' || formData.role === 'super_admin') && (
                      <Alert className="bg-orange-50 border-orange-200">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertTitle>Admin Privileges</AlertTitle>
                        <AlertDescription>
                          This role has elevated permissions and can access sensitive data.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Subscription & Billing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Subscription Tier - Editable */}
                    <div>
                      <Label htmlFor="subscription_tier">
                        Subscription Tier <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.subscription_tier}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          subscription_tier: value
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free Plan</SelectItem>
                          <SelectItem value="standard">Standard ($199/mo)</SelectItem>
                          <SelectItem value="premium">Premium ($499/mo)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                        </SelectContent>
                      </Select>
                      <SubscriptionFeatures tier={formData.subscription_tier} />
                    </div>

                    {/* Credits - Read Only with Action */}
                    <div>
                      <Label>Credit Balance</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={`${getUserCredits().toLocaleString()} credits`}
                          disabled
                          className="bg-muted"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreditsModal(true)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Credits
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use the Manage Credits button to add or remove credits
                      </p>
                    </div>

                    {/* Billing Info */}
                    {user.billing_status && (
                      <div>
                        <Label>Billing Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={user.billing_status === 'active' ? 'default' : 'secondary'}>
                            {user.billing_status}
                          </Badge>
                          {user.stripe_customer_id && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View in Stripe
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Metadata Tab */}
              <TabsContent value="metadata" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preferences - Read Only */}
                    {user.preferences && Object.keys(user.preferences).length > 0 && (
                      <div>
                        <Label>User Preferences</Label>
                        <Textarea
                          value={JSON.stringify(user.preferences, null, 2)}
                          disabled
                          className="bg-muted font-mono text-xs h-32 mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          System-managed metadata and preferences
                        </p>
                      </div>
                    )}

                    {/* Deletion Info */}
                    {user.preferences?.deleted_at && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-900">Deletion Information</AlertTitle>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>Deleted at: {formatDateTime(user.preferences.deleted_at)}</p>
                          {user.preferences.deleted_by && (
                            <p>Deleted by: {user.preferences.deleted_by}</p>
                          )}
                          {user.preferences.previous_status && (
                            <p>Previous status: {user.preferences.previous_status}</p>
                          )}
                        </div>
                      </Alert>
                    )}

                    {/* Restoration Info */}
                    {user.preferences?.restored_at && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-900">Restoration Information</AlertTitle>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>Restored at: {formatDateTime(user.preferences.restored_at)}</p>
                          {user.preferences.restored_by && (
                            <p>Restored by: {user.preferences.restored_by}</p>
                          )}
                        </div>
                      </Alert>
                    )}

                    {/* Audit Trail */}
                    <div>
                      <Label>Audit Trail</Label>
                      <div className="space-y-2 mt-2 p-3 bg-muted rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium">Created:</span> {formatDateTime(user.created_at)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Last Updated:</span> {formatDateTime(user.updated_at)}
                        </div>
                        {user.supabase_user_id && (
                          <div className="text-sm">
                            <span className="font-medium">Supabase ID:</span>
                            <code className="ml-2 text-xs bg-background px-1 py-0.5 rounded">
                              {user.supabase_user_id}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">{success}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <DialogFooter className="mt-6">
              <div className="flex justify-between w-full">
                <div>
                  {hasChanges && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                    >
                      Reset Changes
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || !hasChanges}
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credits Management Modal */}
      {showCreditsModal && (
        <Dialog open={showCreditsModal} onOpenChange={setShowCreditsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Credits</DialogTitle>
              <DialogDescription>
                Current Balance: {getUserCredits().toLocaleString()} credits
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Operation</Label>
                <RadioGroup
                  value={creditOperation}
                  onValueChange={(val) => setCreditOperation(val as 'add' | 'remove')}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="add" />
                    <Label htmlFor="add" className="flex items-center cursor-pointer">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Credits
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remove" id="remove" />
                    <Label htmlFor="remove" className="flex items-center cursor-pointer">
                      <Minus className="h-4 w-4 mr-1" />
                      Remove Credits
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter credit amount"
                  min="1"
                  max="100000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Reason</Label>
                <Textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Provide a reason for this adjustment"
                  rows={3}
                  className="mt-1"
                />
              </div>

              {creditOperation === 'remove' && parseInt(creditAmount) > getUserCredits() && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    Warning: This will result in negative balance
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreditsModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant={creditOperation === 'add' ? 'default' : 'destructive'}
                onClick={handleCreditOperation}
              >
                {creditOperation === 'add' ? 'Add Credits' : 'Remove Credits'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Helper Components
function RolePermissionsDisplay({ role }: { role: string }) {
  const permissions: Record<string, string[]> = {
    user: [
      '✓ View own profile',
      '✓ Access basic features',
      '✗ No admin access'
    ],
    standard: [
      '✓ All user permissions',
      '✓ Standard tier features',
      '✓ Export capabilities'
    ],
    premium: [
      '✓ All standard permissions',
      '✓ Premium features',
      '✓ Priority support',
      '✓ Topup discounts (20%)'
    ],
    admin: [
      '✓ All premium permissions',
      '✓ User management',
      '✓ View system metrics',
      '✗ Cannot delete users'
    ],
    super_admin: [
      '✓ Full system access',
      '✓ User CRUD operations',
      '✓ Billing management',
      '✓ System configuration'
    ]
  };

  return (
    <div className="mt-2 p-3 bg-muted rounded-lg text-xs">
      <p className="font-semibold mb-1">Permissions:</p>
      <ul className="space-y-0.5">
        {permissions[role]?.map((perm, idx) => (
          <li key={idx} className={perm.startsWith('✗') ? 'text-destructive' : 'text-green-600'}>
            {perm}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusExplanation({ status }: { status: string }) {
  const explanations: Record<string, string> = {
    active: 'User can log in and access all features',
    inactive: 'User exists but cannot log in',
    suspended: 'Account temporarily disabled due to policy violation',
    deleted: 'Soft deleted - can be restored'
  };

  return (
    <p className="text-xs text-muted-foreground mt-1">
      {explanations[status] || 'Unknown status'}
    </p>
  );
}

function SubscriptionFeatures({ tier }: { tier: string }) {
  const features: Record<string, any> = {
    free: {
      profiles: 5,
      emails: 0,
      posts: 0,
      team: 1,
      discount: '0%'
    },
    standard: {
      profiles: 500,
      emails: 250,
      posts: 125,
      team: 2,
      discount: '0%'
    },
    premium: {
      profiles: 2000,
      emails: 800,
      posts: 300,
      team: 5,
      discount: '20%'
    },
    enterprise: {
      profiles: 'Unlimited',
      emails: 'Unlimited',
      posts: 'Unlimited',
      team: 'Unlimited',
      discount: 'Custom'
    }
  };

  const f = features[tier] || features.free;

  return (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="font-medium">Profiles/mo:</span> {f.profiles}
        </div>
        <div>
          <span className="font-medium">Emails/mo:</span> {f.emails}
        </div>
        <div>
          <span className="font-medium">Posts/mo:</span> {f.posts}
        </div>
        <div>
          <span className="font-medium">Team size:</span> {f.team}
        </div>
        <div className="col-span-2">
          <span className="font-medium">Topup discount:</span> {f.discount}
        </div>
      </div>
    </div>
  );
}