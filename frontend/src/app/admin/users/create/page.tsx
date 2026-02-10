'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, UserPlus, Mail, Lock, User, Building,
  CreditCard, AlertCircle, Loader2, Info, Phone, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/AuthGuard';
import { superadminService } from '@/utils/superadminApi';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface CreateUserForm {
  email: string;
  password: string;
  full_name: string;
  company?: string;
  job_title?: string;
  phone_number?: string;
  industry?: string;
  company_size?: 'solo' | 'small' | 'growing' | 'large';
  use_case?: string;
  marketing_budget?: string;
  role: 'user' | 'standard' | 'premium';  // Updated to match billing tiers
  initial_credits: number;
}

function CreateUserContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CORRECT TIER CREDITS - MUST MATCH BACKEND
  const TIER_CREDITS = {
    user: 125,        // Free: 5 profiles × 25 credits
    standard: 12500,  // Standard: 500 profiles × 25 credits
    premium: 50000    // Premium: 2000 profiles × 25 credits
  };

  const getTierCredits = (role: string): number => {
    return TIER_CREDITS[role as keyof typeof TIER_CREDITS] || 125;
  };

  const [form, setForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    full_name: '',
    company: '',
    job_title: '',
    phone_number: '',
    industry: '',
    company_size: undefined,
    use_case: '',
    marketing_budget: '',
    role: 'user',
    initial_credits: 125  // Default free tier credits
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password }));
    setPasswordVisible(true);
    toast.success('Password generated successfully');
  };

  const getAuthToken = () => {
    const authTokens = localStorage.getItem('auth_tokens');
    if (authTokens && authTokens !== 'null' && authTokens !== 'undefined') {
      try {
        const parsed = JSON.parse(authTokens);
        const token = parsed.access_token || parsed.access;
        if (token) return token;
      } catch (e) {
        console.error('Failed to parse auth_tokens');
      }
    }
    const directToken = localStorage.getItem('access_token');
    if (!directToken || directToken === 'null' || directToken === 'undefined') {
      throw new Error('No valid authentication token found');
    }
    return directToken;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.email || !form.password || !form.full_name) {
      setError('Email, password, and full name are required');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }


    setLoading(true);

    try {
      const token = getAuthToken();

      // Step 1: Create the user account using the CORRECT working endpoint
      const userPayload = {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,  // "user", "standard", or "premium"
        company: form.company || undefined,
        job_title: form.job_title || undefined,
        phone_number: form.phone_number || undefined,
        industry: form.industry || undefined,
        company_size: form.company_size || undefined,
        use_case: form.use_case || undefined,
        marketing_budget: form.marketing_budget || undefined
      };

      const userResponse = await fetch(`${API_BASE}/api/v1/auth/admin/create-managed-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userPayload)
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.detail || 'Failed to create user');
      }

      const userData = await userResponse.json();
      const userId = userData.user?.id || userData.user?.user_id || userData.id;

      // DEBUG: Log response to verify credits
      console.log('User Creation Response:', userData);
      console.log('Credits from billing_info:', userData.billing_info?.credits_allocated);
      console.log('Credits from user:', userData.user?.initial_credits);
      console.log('Tier:', userData.user?.role);

      // Extract billing info from response
      const billingInfo = userData.billing_info || {};
      const nextBillingDate = billingInfo.billing_cycle_end ||
                              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // CORRECT way to get credits from response
      const creditsAllocated = billingInfo.credits_allocated || userData.user?.initial_credits || form.initial_credits;

      // Show detailed success message with CORRECT credits
      const tierName = form.role === 'user' ? 'Free' :
                      form.role === 'standard' ? 'Standard' : 'Premium';

      toast.success(`User created successfully! Email: ${form.email}, Tier: ${tierName} (${creditsAllocated.toLocaleString()} credits), Next billing: ${new Date(nextBillingDate).toLocaleDateString()}`);

      router.push('/admin/users');

    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>

        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-muted-foreground">Create a new user account with admin-managed billing</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>User account details and credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Password *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? 'Hide' : 'Show'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password will be sent to the user via email. Consider generating a secure password.
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Business details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Company Name
                </Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="ACME Corporation"
                  value={form.company}
                  onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Job Title
                </Label>
                <Input
                  id="job_title"
                  type="text"
                  placeholder="Marketing Manager"
                  value={form.job_title}
                  onChange={(e) => setForm(prev => ({ ...prev, job_title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+1234567890"
                  value={form.phone_number}
                  onChange={(e) => setForm(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={form.industry}
                  onValueChange={(value) => setForm(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger id="industry">
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

              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Select
                  value={form.company_size}
                  onValueChange={(value: 'solo' | 'small' | 'growing' | 'large') => setForm(prev => ({ ...prev, company_size: value }))}
                >
                  <SelectTrigger id="company_size">
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

              <div className="space-y-2">
                <Label htmlFor="marketing_budget">Marketing Budget</Label>
                <Select
                  value={form.marketing_budget}
                  onValueChange={(value) => setForm(prev => ({ ...prev, marketing_budget: value }))}
                >
                  <SelectTrigger id="marketing_budget">
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

        {/* Role & Credit Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Role & Credit Settings</CardTitle>
            <CardDescription>Configure user role and initial credits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subscription Tier *</Label>
              <RadioGroup
                value={form.role}
                onValueChange={(value: any) => {
                  const credits = getTierCredits(value);
                  setForm(prev => ({
                    ...prev,
                    role: value,
                    initial_credits: credits
                  }));
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-start space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="user" id="user" />
                    <div className="flex-1">
                      <Label htmlFor="user" className="font-medium cursor-pointer">
                        Free Tier
                      </Label>
                      <p className="text-xs text-muted-foreground">125 credits/month • 5 profile unlocks • Basic features</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="standard" id="standard" />
                    <div className="flex-1">
                      <Label htmlFor="standard" className="font-medium cursor-pointer">
                        Standard Tier
                      </Label>
                      <p className="text-xs text-muted-foreground">12,500 credits/month • 500 profile unlocks • 200 email unlocks</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="premium" id="premium" />
                    <div className="flex-1">
                      <Label htmlFor="premium" className="font-medium cursor-pointer">
                        Premium Tier
                      </Label>
                      <p className="text-xs text-muted-foreground">50,000 credits/month • 2000 profile unlocks • 800 email unlocks</p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Alert className="">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong className="text-sm">Billing Information</strong>
                <p className="text-xs mt-1 text-muted-foreground">
                  • <strong>Billing Type:</strong> Admin-Managed (You control their subscription)
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Billing Cycle:</strong> 30 days from creation date
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Next Invoice:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  <strong>Note:</strong> Credits will refresh automatically every 30 days based on the selected tier.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="initial_credits" className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Initial Credits (Based on Tier)
              </Label>
              <Input
                id="initial_credits"
                type="number"
                min="0"
                max="100000"
                value={form.initial_credits}
                onChange={(e) => setForm(prev => ({ ...prev, initial_credits: parseInt(e.target.value) || 0 }))}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Credits are automatically set based on the selected tier. Free: 125, Standard: 12,500, Premium: 50,000
              </p>
            </div>
          </CardContent>
        </Card>


        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateUserPage() {
  return (
    <AuthGuard requiredRole="admin">
      <CreateUserContent />
    </AuthGuard>
  );
}