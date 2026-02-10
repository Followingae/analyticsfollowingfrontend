'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
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
  Minus,
  History,
  Trash2,
  RotateCcw,
  Mail,
  Phone,
  Calendar,
  Building,
  Globe,
  Key,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  UserCheck,
  UserX,
  Loader2,
  Upload,
  FileText,
  Image,
  Download,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { superadminService } from '@/utils/superadminApi';
import '@/utils/debugTokens'; // Load token debug utility
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

// Types
interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
  subscription_tier?: string;
  subscription_plan?: string;
  credits: number;
  credits_balance?: number;
  current_balance?: number; // Real balance from database
  created_at: string;
  updated_at?: string;
  last_login?: string | null;
  supabase_user_id?: string;
  stripe_customer_id?: string;
  billing_status?: string;
  billing_type?: string;
  phone?: string;
  phone_number?: string; // Alternative field name
  company?: string;
  job_title?: string;
  industry?: string;
  company_size?: 'solo' | 'small' | 'growing' | 'large';
  use_case?: string;
  marketing_budget?: string;
  company_logo_url?: string;
  document_count?: number;
  preferences?: {
    deleted_at?: string;
    deleted_by?: string;
    previous_status?: string;
    restored_at?: string;
    restored_by?: string;
    [key: string]: any;
  };

  // Billing fields
  next_billing_date?: string;
  days_until_billing?: number;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  is_self_paid?: boolean;
  is_admin_managed?: boolean;

  // Additional fields for detail view
  total_credits_used?: number;
  unlocked_profiles_count?: number;
  team_id?: string;
  team_name?: string;
  is_verified?: boolean;
  is_active?: boolean;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: 'add' | 'remove' | 'purchase' | 'usage';
  reason: string;
  created_at: string;
  balance_after: number;
  admin_id?: string;
  admin_email?: string;
  action_type?: string;
  description?: string;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  description?: string;
  uploaded_at: string;
  file_size?: number;
  mime_type?: string;
}

interface UserActivity {
  id: string;
  action: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
}

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Check if we should start in edit mode from query params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const shouldStartInEditMode = searchParams.get('edit') === 'true';

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(shouldStartInEditMode); // Start in edit mode if query param is set

  // Form data - include company fields
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    status: '',
    subscription_tier: '',
    company: '',
    job_title: '',
    phone_number: '',
    industry: '',
    company_size: '',
    use_case: '',
    marketing_budget: ''
  });

  // Credit management
  const [creditOperation, setCreditOperation] = useState<'add' | 'remove'>('add');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Activity log
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Documents and logo state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Dialog states
  const [showDocumentUploadDialog, setShowDocumentUploadDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditDialogMode, setCreditDialogMode] = useState<'add' | 'remove'>('add');
  const [documentUploadForm, setDocumentUploadForm] = useState({
    file: null as File | null,
    documentType: 'other',
    description: ''
  });
  const [creditForm, setCreditForm] = useState({
    amount: '',
    reason: ''
  });

  // State for credits from working endpoint
  const [userCreditsData, setUserCreditsData] = useState<{
    current_balance: number;
    monthly_allowance: number;
    subscription_tier: string;
    billing_cycle_start?: string;
    billing_cycle_end?: string;
    next_reset_date?: string;
  } | null>(null);

  // Load user data
  useEffect(() => {
    // Debug: Check what tokens are available
    if (typeof window !== 'undefined') {
      console.log('🔍 Token Debug:', {
        access_token: !!localStorage.getItem('access_token'),
        auth_tokens: !!localStorage.getItem('auth_tokens'),
        access_token_value: localStorage.getItem('access_token')?.substring(0, 20) + '...',
        auth_tokens_parsed: (() => {
          try {
            const authTokens = localStorage.getItem('auth_tokens');
            if (authTokens) {
              const parsed = JSON.parse(authTokens);
              return {
                has_access_token: !!parsed.access_token,
                has_access: !!parsed.access,
                token_preview: (parsed.access_token || parsed.access || '').substring(0, 20) + '...'
              };
            }
            return null;
          } catch (e) {
            return 'parse error';
          }
        })()
      });
    }

    fetchUserData();
    if (userId) {
      fetchUserCredits();
    }
  }, [userId]);

  // Fetch credits when tab changes
  useEffect(() => {
    if (userId && (activeTab === 'overview' || activeTab === 'credits')) {
      fetchUserCredits();
    }
    if (activeTab === 'credits') {
      fetchCreditHistory();
    } else if (activeTab === 'activity') {
      fetchActivityLog();
    } else if (activeTab === 'details') {
      fetchDocuments();
    }
  }, [activeTab, userId]);

  // Check for changes
  useEffect(() => {
    if (originalUser) {
      const changed = Object.keys(formData).some(key => {
        const formValue = formData[key as keyof typeof formData];
        const originalValue = originalUser[key as keyof User] || '';
        return formValue !== originalValue;
      });
      setHasChanges(changed);
    }
  }, [formData, originalUser]);

  // USING WORKING ENDPOINT FOR CREDITS
  const fetchUserCredits = async () => {
    try {
      // Try multiple token sources - auth_tokens first, then access_token
      let token = null;

      // Check auth_tokens JSON first (newer format)
      const authTokens = localStorage.getItem('auth_tokens');
      if (authTokens && authTokens !== 'null' && authTokens !== 'undefined') {
        try {
          const parsed = JSON.parse(authTokens);
          token = parsed.access_token || parsed.access;
        } catch (e) {
          console.warn('Failed to parse auth_tokens:', e);
        }
      }

      // Fallback to direct access_token (older format)
      if (!token) {
        token = localStorage.getItem('access_token');
      }

      if (!token || token === 'null' || token === 'undefined' || token === '') {
        console.warn('No authentication token found, skipping credits fetch');
        // Don't redirect immediately - user might be logged in but token not loaded yet
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE}/api/v1/admin/simple/user/${userId}/credits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserCreditsData(data);
        console.log('Credits fetched successfully:', data);
      } else if (response.status === 401 || response.status === 403) {
        console.error('Authentication error:', response.status);
        toast.error('Session expired. Please log in again.');
        // Clear tokens and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_tokens');
        router.push('/auth/login');
      } else {
        console.error('Failed to fetch credits:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user from the users list endpoint with search
      const response = await superadminService.getUsers(1, 100);
      const userData = response.users?.find((u: User) => u.id === userId);

      if (!userData) {
        toast.error('User not found');
        router.push('/admin/users');
        return;
      }

      setUser(userData);
      setOriginalUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        role: userData.role || 'user',
        status: userData.status || 'active',
        subscription_tier: userData.subscription_tier || userData.subscription_plan || 'free',
        company: userData.company || '',
        job_title: userData.job_title || '',
        phone_number: userData.phone_number || userData.phone || '',
        industry: userData.industry || '',
        company_size: userData.company_size || '',
        use_case: userData.use_case || '',
        marketing_budget: userData.marketing_budget || ''
      });

      // Load additional data based on active tab
      if (activeTab === 'credits') {
        fetchCreditHistory();
        fetchUserCredits(); // Also fetch credits when on credits tab
      } else if (activeTab === 'activity') {
        fetchActivityLog();
      }
    } catch (err: any) {
      toast.error('Failed to load user data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditHistory = async () => {
    setLoadingCredits(true);
    try {
      const token = await getAuthToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      // Use the CORRECT endpoint with user_id query parameter
      const response = await fetch(`${API_BASE}/api/v1/credits/transactions?user_id=${userId}&page=1&page_size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform the backend data to match our interface
        const transactions = (data.transactions || data.items || data || []).map((tx: any) => ({
          id: tx.id || tx.transaction_id,
          amount: tx.amount || tx.credits || tx.credit_amount,
          type: tx.action_type === 'credit_add' ? 'add' :
                tx.action_type === 'credit_remove' ? 'remove' :
                tx.action_type === 'profile_unlock' ? 'usage' :
                tx.action_type === 'purchase' ? 'purchase' :
                tx.type || 'usage',
          reason: tx.reason || tx.description || tx.action_type || 'No reason provided',
          created_at: tx.created_at || tx.timestamp || tx.created,
          balance_after: tx.balance_after || tx.new_balance || tx.balance || 0,
          admin_email: tx.admin_email || tx.admin_username || tx.performed_by || 'System'
        }));
        setCreditHistory(transactions);
      } else {
        console.error('Failed to fetch credit history:', response.status);
        // Fallback to empty array instead of mock data
        setCreditHistory([]);
      }
    } catch (err) {
      console.error('Failed to load credit history:', err);
      setCreditHistory([]);
    } finally {
      setLoadingCredits(false);
    }
  };

  // Helper function to get auth token
  const getAuthToken = async () => {
    let token = null;
    const authTokens = localStorage.getItem('auth_tokens');
    if (authTokens && authTokens !== 'null') {
      try {
        const parsed = JSON.parse(authTokens);
        token = parsed.access_token || parsed.access;
      } catch (e) {
        console.warn('Failed to parse auth_tokens');
      }
    }
    if (!token) {
      token = localStorage.getItem('access_token');
    }
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  };

  const fetchActivityLog = async () => {
    setLoadingActivities(true);
    try {
      // Mock data for now - implement actual endpoint
      setActivities([
        {
          id: '1',
          action: 'Login',
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Chrome/120.0'
        }
      ]);
    } catch (err) {
      console.error('Failed to load activity log:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await superadminService.updateUser(userId, formData);
      toast.success('User updated successfully');

      // Update local state
      const updatedUser = { ...user!, ...formData };
      setUser(updatedUser);
      setOriginalUser(updatedUser);
      setHasChanges(false);
      setIsEditMode(false); // Exit edit mode after successful save
    } catch (err: any) {
      const errorMessage = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : err.response?.data?.detail?.msg || err.message || 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete User',
      description: `Are you sure you want to delete ${user?.email}? This is a soft delete and can be reversed.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await superadminService.deleteUser(userId);
      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (err: any) {
      const errorMessage = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : err.response?.data?.detail?.msg || err.message || 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  // Logo upload function
  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPEG, GIF, SVG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const token = await getAuthToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Logo uploaded successfully');
        // Update user with new logo URL
        if (user) {
          setUser({ ...user, company_logo_url: data.logo_url });
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upload logo');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Document upload function
  const handleDocumentUpload = async (file: File, documentType: string, description: string) => {
    if (!file) return;

    setUploadingDocument(true);
    try {
      const token = await getAuthToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('description', description);

      const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Document uploaded successfully');
        // Refresh documents list
        fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Document upload error:', err);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  // Fetch user documents
  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const token = await getAuthToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Delete document
  // Handle adding credits
  const handleAddCredits = async (amount: number, reason: string) => {
    try {
      await superadminService.addCredits(userId, amount, reason);
      toast.success(`Successfully added ${amount} credits`);
      // Update local user data if needed
      if (user) {
        setUser({ ...user, credits: (user.credits || 0) + amount });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add credits');
      throw err;
    }
  };

  // Handle removing credits
  const handleRemoveCredits = async (amount: number, reason: string) => {
    try {
      await superadminService.removeCredits(userId, amount, reason);
      toast.success(`Successfully removed ${amount} credits`);
      // Update local user data if needed
      if (user) {
        setUser({ ...user, credits: Math.max(0, (user.credits || 0) - amount) });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove credits');
      throw err;
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const confirmed = await confirm({
      title: 'Delete Document',
      description: 'Are you sure you want to delete this document?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      const token = await getAuthToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE}/api/v1/admin/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        fetchDocuments(); // Refresh the list
      } else {
        toast.error('Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document');
    }
  };

  const handleRestore = async () => {
    const confirmed = await confirm({
      title: 'Restore User',
      description: 'Are you sure you want to restore this user?',
      confirmText: 'Restore',
      cancelText: 'Cancel',
      variant: 'default'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to restore user');

      toast.success('User restored successfully');

      // Update local state
      setUser({ ...user!, status: 'active' });
      setFormData({ ...formData, status: 'active' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore user');
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

      // Clear form
      setCreditAmount('');
      setCreditReason('');

      // Refresh credit data from API for real-time update
      await fetchUserCredits();

      // Refresh credit history
      fetchCreditHistory();
    } catch (err: any) {
      const errorMessage = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : typeof err.response?.data?.detail === 'object' && err.response?.data?.detail?.length > 0
        ? err.response.data.detail[0]?.msg || 'Failed to update credits'
        : err.message || 'Failed to update credits';
      toast.error(errorMessage);
    }
  };

  // CORRECT TIER CREDITS MAPPING
  const TIER_CREDITS = {
    free: 125,        // 5 profiles × 25 credits
    standard: 12500,  // 500 profiles × 25 credits
    premium: 50000,   // 2000 profiles × 25 credits
    enterprise: 50000 // Same as premium
  };

  const getUserCredits = () => {
    // Use real-time data from working endpoint if available
    if (userCreditsData) {
      return userCreditsData.current_balance;
    }
    // Fallback to user data
    return user?.current_balance || user?.credits || user?.credits_balance || 0;
  };

  const getTierMonthlyCredits = () => {
    // Use real-time data from working endpoint if available
    if (userCreditsData) {
      return userCreditsData.monthly_allowance;
    }
    // Fallback to tier mapping
    const tier = (user?.subscription_tier || user?.subscription_plan || 'free').toLowerCase();
    const normalizedTier = tier === 'user' ? 'free' : tier;
    return TIER_CREDITS[normalizedTier as keyof typeof TIER_CREDITS] || 125;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>User not found</AlertTitle>
              <AlertDescription>The user you're looking for doesn't exist.</AlertDescription>
            </Alert>
            <Button className="mt-4 w-full" onClick={() => router.push('/admin/users')}>
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDeleted = user.status === 'deleted';

  return (
    <>
      <ConfirmDialog />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/admin/users')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEditMode ? 'Edit User' : 'User Details'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isEditMode
                      ? 'Modify user account, permissions, and billing'
                      : 'View user account, permissions, and billing'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Unsaved changes
                  </Badge>
                )}
                {isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          full_name: originalUser?.full_name || '',
                          role: originalUser?.role || 'user',
                          status: originalUser?.status || 'active',
                          subscription_tier: originalUser?.subscription_tier || originalUser?.subscription_plan || 'free'
                        });
                        setHasChanges(false);
                        setIsEditMode(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    variant="default"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Edit User
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          {/* User Header Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-2xl font-medium">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold">
                      {user.full_name || 'Unnamed User'}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      {/* Status Badge */}
                      {user.status === 'active' ? (
                        <Badge variant="default">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : user.status === 'deleted' ? (
                        <Badge variant="destructive">
                          <UserX className="h-3 w-3 mr-1" />
                          Deleted
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {user.status}
                        </Badge>
                      )}

                      {/* Role Badge */}
                      <Badge variant={
                        user.role === 'super_admin' || user.role === 'superadmin' ? 'destructive' :
                        user.role === 'admin' ? 'default' :
                        'outline'
                      }>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>

                      {/* Subscription Badge */}
                      <Badge variant="outline">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {user.subscription_tier || user.subscription_plan || 'Free'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {!isDeleted ? (
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={handleRestore}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore User
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {getUserCredits().toLocaleString()} / {getTierMonthlyCredits().toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Available / Monthly allowance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {user.total_credits_used?.toLocaleString() || '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">Total consumed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Unlocked Profiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {user.unlocked_profiles_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Profiles accessed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Account Age</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <p className="text-xs text-muted-foreground">Days since registration</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    View Sessions
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Impersonate
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input value={user.email} disabled className="bg-muted" />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(user.email, 'Email')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
                    </div>

                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter full name"
                        className="mt-1"
                        disabled={!isEditMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="Enter phone number"
                        className="mt-1"
                        disabled={!isEditMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Enter company name"
                        className="mt-1"
                        disabled={!isEditMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        placeholder="Enter job title"
                        className="mt-1"
                        disabled={!isEditMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => setFormData({ ...formData, industry: value })}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger id="industry" className="mt-1">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fashion & Beauty">Fashion & Beauty</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                          <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                          <SelectItem value="Travel & Tourism">Travel & Tourism</SelectItem>
                          <SelectItem value="Sports & Fitness">Sports & Fitness</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="company_size">Company Size</Label>
                      <Select
                        value={formData.company_size}
                        onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger id="company_size" className="mt-1">
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo (1 person)</SelectItem>
                          <SelectItem value="small">Small (2-10)</SelectItem>
                          <SelectItem value="growing">Growing (11-50)</SelectItem>
                          <SelectItem value="large">Large (50+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="marketing_budget">Marketing Budget</Label>
                      <Select
                        value={formData.marketing_budget}
                        onValueChange={(value) => setFormData({ ...formData, marketing_budget: value })}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger id="marketing_budget" className="mt-1">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$0-$1000">$0-$1,000</SelectItem>
                          <SelectItem value="$1000-$5000">$1,000-$5,000</SelectItem>
                          <SelectItem value="$5000-$10000">$5,000-$10,000</SelectItem>
                          <SelectItem value="$10000-$50000">$10,000-$50,000</SelectItem>
                          <SelectItem value="$50000+">$50,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Logo & Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo Section */}
                  <div className="space-y-3">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      {user.company_logo_url ? (
                        <div className="relative">
                          <img
                            src={user.company_logo_url}
                            alt="Company logo"
                            className="w-20 h-20 object-contain border rounded"
                          />
                          {isEditMode && (
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => {
                                // Remove logo functionality
                                setUser({ ...user, company_logo_url: undefined });
                                setFormData({ ...formData });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      {isEditMode && (
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="logo-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoUpload(file);
                            }}
                          />
                          <Label htmlFor="logo-upload">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={uploadingLogo}
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('logo-upload')?.click();
                              }}
                            >
                              {uploadingLogo ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Upload Logo
                            </Button>
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPEG, GIF, SVG or WebP. Max 5MB.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Documents ({documents.length})</Label>
                      {isEditMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDocumentUploadDialog(true)}
                          disabled={uploadingDocument}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      )}
                    </div>

                    {loadingDocuments ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{doc.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.document_type} - {doc.description || 'No description'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  // Download document
                                  window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/documents/${doc.id}/download`, '_blank');
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {isEditMode && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents uploaded</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>User ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input value={user.id} disabled className="bg-muted font-mono text-xs" />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(user.id, 'User ID')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Supabase ID</Label>
                      <Input
                        value={user.supabase_user_id || 'Not linked'}
                        disabled
                        className="bg-muted font-mono text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label>Created At</Label>
                      <Input
                        value={formatDateTime(user.created_at)}
                        disabled
                        className="bg-muted mt-1"
                      />
                    </div>

                    <div>
                      <Label>Last Login</Label>
                      <Input
                        value={formatDateTime(user.last_login)}
                        disabled
                        className="bg-muted mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role & Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="role">User Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      disabled={!isEditMode}
                    >
                      <SelectTrigger className="mt-1" disabled={!isEditMode}>
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

                  <div>
                    <Label htmlFor="status">Account Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      disabled={!isEditMode}
                    >
                      <SelectTrigger className="mt-1" disabled={!isEditMode}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.status === 'active' && 'User can log in and access all features'}
                      {formData.status === 'inactive' && 'User exists but cannot log in'}
                      {formData.status === 'suspended' && 'Account temporarily disabled'}
                    </p>
                  </div>

                  {(formData.role === 'admin' || formData.role === 'super_admin') && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Admin Privileges</AlertTitle>
                      <AlertDescription>
                        This role has elevated permissions and can access sensitive data.
                        Please ensure this is intentional.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subscription Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subscription_tier">Subscription Tier</Label>
                      <Select
                        value={formData.subscription_tier}
                        onValueChange={(value) => setFormData({ ...formData, subscription_tier: value })}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className="mt-1" disabled={!isEditMode}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free (125 credits/mo)</SelectItem>
                          <SelectItem value="standard">Standard (12,500 credits/mo)</SelectItem>
                          <SelectItem value="premium">Premium (50,000 credits/mo)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                        </SelectContent>
                      </Select>
                      <SubscriptionFeatures tier={formData.subscription_tier} />
                    </div>

                    {user.stripe_customer_id && (
                      <div>
                        <Label>Stripe Customer</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={user.stripe_customer_id}
                            disabled
                            className="bg-muted font-mono text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View in Stripe
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Billing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Billing Type</span>
                        <div className="flex items-center gap-2">
                          {user.is_self_paid || user.billing_type === 'online_payment' ? (
                            <>
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">Stripe (Auto-renewal)</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 text-green-600" />
                              <span className="text-sm">Admin-Managed</span>
                            </>
                          )}
                        </div>
                      </div>

                      {user.is_admin_managed && (
                        <>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">Next Billing Date</span>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                user.days_until_billing && user.days_until_billing <= 7 ? 'text-red-600' :
                                user.days_until_billing && user.days_until_billing <= 14 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {user.next_billing_date ?
                                  format(new Date(user.next_billing_date), 'MMM dd, yyyy') :
                                  format(new Date(new Date(user.created_at).getTime() + 30 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.days_until_billing ?
                                  `${user.days_until_billing} days remaining` :
                                  'Calculating...'}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">Billing Cycle</span>
                            <span className="text-sm">30 Days</span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">Credits Reset</span>
                            <span className="text-sm">On billing date</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Account Created</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>

                    {user.is_admin_managed && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          This is an admin-managed account. Credits will refresh automatically every 30 days based on the subscription tier.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Credit History */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingCredits ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : creditHistory.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Balance</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Admin</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {creditHistory.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="text-sm">
                                  {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={transaction.type === 'add' ? 'default' : 'destructive'}>
                                    {transaction.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {transaction.amount > 0 ? (
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                    {Math.abs(transaction.amount).toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono">
                                  {transaction.balance_after.toLocaleString()}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {transaction.reason}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {transaction.admin_email || 'System'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center py-8 text-muted-foreground">
                          No transaction history available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Current Balance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {getUserCredits().toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        of {getTierMonthlyCredits().toLocaleString()} monthly credits
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${Math.min(100, (getUserCredits() / getTierMonthlyCredits()) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {((getUserCredits() / getTierMonthlyCredits()) * 100).toFixed(1)}% remaining
                      </p>

                      {/* Billing info from API */}
                      {userCreditsData && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          {userCreditsData.billing_cycle_start && userCreditsData.billing_cycle_end && (
                            <div className="text-xs text-muted-foreground">
                              <strong>Billing Cycle:</strong><br/>
                              {new Date(userCreditsData.billing_cycle_start).toLocaleDateString()} - {new Date(userCreditsData.billing_cycle_end).toLocaleDateString()}
                            </div>
                          )}
                          {userCreditsData.next_reset_date && (
                            <div className="text-xs text-muted-foreground">
                              <strong>Credits Reset:</strong> {new Date(userCreditsData.next_reset_date).toLocaleDateString()}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            <strong>Tier:</strong> {userCreditsData.subscription_tier}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Credit Operations */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Adjust Credits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup value={creditOperation} onValueChange={(val) => setCreditOperation(val as 'add' | 'remove')}>
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

                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="Enter amount"
                          min="1"
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

                      <Button
                        className="w-full"
                        variant={creditOperation === 'add' ? 'default' : 'destructive'}
                        onClick={handleCreditOperation}
                      >
                        {creditOperation === 'add' ? 'Add Credits' : 'Remove Credits'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingActivities ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activities.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>User Agent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>
                              {formatDateTime(activity.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{activity.action}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {activity.ip_address || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {activity.user_agent || 'Unknown'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No activity recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Upload Dialog */}
      <Dialog open={showDocumentUploadDialog} onOpenChange={setShowDocumentUploadDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for this user. Choose the document type and add an optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-file">Document File</Label>
              <Input
                id="document-file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDocumentUploadForm(prev => ({ ...prev, file }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select
                value={documentUploadForm.documentType}
                onValueChange={(value) => setDocumentUploadForm(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger id="document-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="tax_document">Tax Document</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-description">Description (Optional)</Label>
              <Textarea
                id="document-description"
                placeholder="Enter document description..."
                value={documentUploadForm.description}
                onChange={(e) => setDocumentUploadForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDocumentUploadDialog(false);
                setDocumentUploadForm({ file: null, documentType: 'other', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (documentUploadForm.file) {
                  await handleDocumentUpload(
                    documentUploadForm.file,
                    documentUploadForm.documentType,
                    documentUploadForm.description
                  );
                  setShowDocumentUploadDialog(false);
                  setDocumentUploadForm({ file: null, documentType: 'other', description: '' });
                } else {
                  toast.error('Please select a file');
                }
              }}
              disabled={!documentUploadForm.file || uploadingDocument}
            >
              {uploadingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Management Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {creditDialogMode === 'add' ? 'Add Credits' : 'Remove Credits'}
            </DialogTitle>
            <DialogDescription>
              {creditDialogMode === 'add'
                ? `Add credits to ${user?.email}'s account.`
                : `Remove credits from ${user?.email}'s account. Current balance: ${getUserCredits().toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Amount</Label>
              <Input
                id="credit-amount"
                type="number"
                min="1"
                max={creditDialogMode === 'remove' ? getUserCredits() : 100000}
                placeholder="Enter amount..."
                value={creditForm.amount}
                onChange={(e) => setCreditForm(prev => ({ ...prev, amount: e.target.value }))}
              />
              {creditDialogMode === 'remove' && (
                <p className="text-xs text-muted-foreground">
                  Maximum: {getUserCredits().toLocaleString()} credits
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-reason">Reason</Label>
              <Textarea
                id="credit-reason"
                placeholder="Enter reason for this adjustment..."
                value={creditForm.reason}
                onChange={(e) => setCreditForm(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreditDialog(false);
                setCreditForm({ amount: '', reason: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              variant={creditDialogMode === 'remove' ? 'destructive' : 'default'}
              onClick={async () => {
                const amount = parseInt(creditForm.amount);
                if (!amount || amount <= 0) {
                  toast.error('Please enter a valid amount');
                  return;
                }
                if (!creditForm.reason.trim()) {
                  toast.error('Please enter a reason');
                  return;
                }

                try {
                  if (creditDialogMode === 'add') {
                    await handleAddCredits(amount, creditForm.reason);
                  } else {
                    await handleRemoveCredits(amount, creditForm.reason);
                  }
                  setShowCreditDialog(false);
                  setCreditForm({ amount: '', reason: '' });
                  // Refresh user data
                  fetchUserData();
                  fetchCreditHistory();
                } catch (error) {
                  console.error('Credit operation failed:', error);
                }
              }}
              disabled={!creditForm.amount || !creditForm.reason}
            >
              {creditDialogMode === 'add' ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credits
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 mr-2" />
                  Remove Credits
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <li key={idx} className={perm.startsWith('✗') ? 'text-destructive' : 'text-green-600 dark:text-green-400'}>
            {perm}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubscriptionFeatures({ tier }: { tier: string }) {
  // Normalize tier names
  const normalizedTier = tier === 'user' ? 'free' : tier.toLowerCase();

  const features: Record<string, any> = {
    free: {
      credits: 125,
      profiles: 5,
      emails: 0,
      posts: 0,
      team: 1,
      billingCycle: '30 days',
      discount: '0%'
    },
    standard: {
      credits: 12500,
      profiles: 500,
      emails: 200,
      posts: 125,
      team: 2,
      billingCycle: '30 days',
      discount: '0%'
    },
    premium: {
      credits: 50000,
      profiles: 2000,
      emails: 800,
      posts: 300,
      team: 5,
      billingCycle: '30 days',
      discount: '20%'
    },
    enterprise: {
      credits: 50000,
      profiles: 2000,
      emails: 800,
      posts: 300,
      team: 'Unlimited',
      billingCycle: '30 days',
      discount: 'Custom'
    }
  };

  const f = features[normalizedTier] || features.free;

  return (
    <div className="mt-2 p-3 bg-muted rounded-lg">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="col-span-2 mb-2">
          <span className="font-medium text-base">Monthly Credits:</span>{' '}
          <span className="text-lg font-bold text-primary">{f.credits.toLocaleString()}</span>
        </div>
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
        <div>
          <span className="font-medium">Billing Cycle:</span> {f.billingCycle}
        </div>
        <div>
          <span className="font-medium">Topup discount:</span> {f.discount}
        </div>
      </div>
    </div>
  );
}