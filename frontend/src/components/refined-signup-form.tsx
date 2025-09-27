"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, AlertCircle, User, Building2, Mail, Lock, CheckCircle } from "lucide-react";
import { useTheme } from 'next-themes';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Form data interface matching backend requirements
interface SelfSignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  company_name: string; // REQUIRED
  subscription_tier: 'free' | 'standard' | 'premium';
  terms_accepted: boolean;
  privacy_accepted: boolean;
  marketing_consent: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

const subscriptionTiers = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    features: ['5 profile unlocks/month', 'Basic analytics', 'Community support'],
    price: 'Free',
    popular: false
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'For growing businesses',
    features: ['500 profile unlocks/month', 'Advanced analytics', 'Email support'],
    price: '$29/month',
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For enterprise teams',
    features: ['2000 profile unlocks/month', 'Premium analytics', 'Priority support'],
    price: '$99/month',
    popular: false
  }
];

interface RefinedSignupFormProps {
  logoSrc?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignInRedirect?: () => void;
}

export const RefinedSignupForm: React.FC<RefinedSignupFormProps> = ({
  logoSrc: providedLogoSrc,
  title = "Create your account",
  description = "Join thousands of brands using Following for Instagram analytics",
  onSignUp,
  onSignInRedirect,
}) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const [formData, setFormData] = useState<SelfSignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    company_name: '',
    subscription_tier: 'free',
    terms_accepted: false,
    privacy_accepted: false,
    marketing_consent: false,
  });

  // Password strength validation
  const validatePasswordStrength = (password: string) => {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    const score = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChar, hasMinLength].filter(Boolean).length;

    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  };

  // Real-time validation
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Valid email required';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      case 'full_name':
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'company_name':
        if (!value) return 'Company name is required';
        if (value.length < 2) return 'Company name must be at least 2 characters';
        return '';
      case 'terms_accepted':
        if (!value) return 'Must accept terms and conditions';
        return '';
      case 'privacy_accepted':
        if (!value) return 'Must accept privacy policy';
        return '';
      default:
        return '';
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));

    // Update password strength
    if (field === 'password') {
      setPasswordStrength(validatePasswordStrength(value));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: ValidationErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof SelfSignupForm]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      onSignUp?.(e);
    }
  };

  const logoSrc = providedLogoSrc || (theme === 'dark' ? "/Following Logo Dark Mode.svg" : "/followinglogo.svg");

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="animate-element animate-delay-50 mb-6">
          <img src={logoSrc} className="h-6 w-auto object-contain opacity-60" alt="Following Logo" />
        </div>
        <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight text-foreground">
          {title}
        </h1>
        <p className="animate-element animate-delay-200 text-muted-foreground mt-2">
          {description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="animate-element animate-delay-300 space-y-4">
          <div>
            <Label htmlFor="full_name" className="text-sm font-medium text-foreground">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className={cn(
                  "pl-10 transition-all duration-200",
                  errors.full_name && "border-red-500 focus:border-red-500"
                )}
                required
              />
            </div>
            {errors.full_name && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.full_name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className={cn(
                  "pl-10 transition-all duration-200",
                  errors.email && "border-red-500 focus:border-red-500"
                )}
                required
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Company Information */}
        <div className="animate-element animate-delay-400">
          <Label htmlFor="company_name" className="text-sm font-medium text-foreground">
            Company Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="company_name"
              type="text"
              placeholder="Enter your company name"
              value={formData.company_name}
              onChange={(e) => updateFormData('company_name', e.target.value)}
              className={cn(
                "pl-10 transition-all duration-200",
                errors.company_name && "border-red-500 focus:border-red-500"
              )}
              required
            />
          </div>
          {errors.company_name && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.company_name}
            </p>
          )}
        </div>

        {/* Password Fields */}
        <div className="animate-element animate-delay-500 space-y-4">
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                className={cn(
                  "pl-10 pr-10 transition-all duration-200",
                  errors.password && "border-red-500 focus:border-red-500"
                )}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-1 bg-gray-200 rounded">
                    <div
                      className={cn("h-full rounded transition-all duration-300", getPasswordStrengthColor())}
                      style={{
                        width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'
                      }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs font-medium capitalize",
                    passwordStrength === 'weak' && "text-red-500",
                    passwordStrength === 'medium' && "text-yellow-500",
                    passwordStrength === 'strong' && "text-green-500"
                  )}>
                    {passwordStrength}
                  </span>
                </div>
              </div>
            )}

            {errors.password && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                className={cn(
                  "pl-10 pr-10 transition-all duration-200",
                  errors.confirmPassword && "border-red-500 focus:border-red-500",
                  formData.confirmPassword && formData.password === formData.confirmPassword && "border-green-500"
                )}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                )}
              </button>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Subscription Selection */}
        <div className="animate-element animate-delay-600">
          <Label className="text-sm font-medium text-foreground mb-4 block">
            Choose Your Plan
          </Label>
          <RadioGroup
            value={formData.subscription_tier}
            onValueChange={(value) => updateFormData('subscription_tier', value)}
            className="space-y-3"
          >
            {subscriptionTiers.map((tier) => (
              <label
                key={tier.id}
                className={cn(
                  "relative flex cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:bg-muted/50",
                  formData.subscription_tier === tier.id && "border-primary bg-primary/5 ring-2 ring-primary/20",
                  tier.popular && "border-primary"
                )}
              >
                <div className="flex items-start space-x-3 w-full">
                  <RadioGroupItem value={tier.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {tier.name}
                        {tier.popular && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-foreground">{tier.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-3 w-3 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Legal Agreements */}
        <div className="animate-element animate-delay-700 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms_accepted"
              checked={formData.terms_accepted}
              onCheckedChange={(checked) => updateFormData('terms_accepted', checked)}
              className={cn(
                "mt-1",
                errors.terms_accepted && "border-red-500"
              )}
            />
            <div className="text-sm">
              <Label htmlFor="terms_accepted" className="text-foreground cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline font-medium">
                  Terms of Service
                </a>{' '}
                <span className="text-red-500">*</span>
              </Label>
              {errors.terms_accepted && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.terms_accepted}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy_accepted"
              checked={formData.privacy_accepted}
              onCheckedChange={(checked) => updateFormData('privacy_accepted', checked)}
              className={cn(
                "mt-1",
                errors.privacy_accepted && "border-red-500"
              )}
            />
            <div className="text-sm">
              <Label htmlFor="privacy_accepted" className="text-foreground cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </a>{' '}
                <span className="text-red-500">*</span>
              </Label>
              {errors.privacy_accepted && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.privacy_accepted}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="marketing_consent"
              checked={formData.marketing_consent}
              onCheckedChange={(checked) => updateFormData('marketing_consent', checked)}
            />
            <Label htmlFor="marketing_consent" className="text-sm text-foreground cursor-pointer">
              I'd like to receive marketing updates and product news (optional)
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="animate-element animate-delay-800 w-full h-12 text-base font-medium transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Sign In Link */}
        <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSignInRedirect}
            className="text-primary hover:underline font-medium transition-colors"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
};