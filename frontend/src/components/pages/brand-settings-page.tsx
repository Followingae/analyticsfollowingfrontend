"use client"

import * as React from "react"
import { useState } from "react"
import { 
  Settings, 
  Upload, 
  Save,
  Eye,
  Palette,
  Mail,
  Globe,
  Phone,
  MapPin,
  Building,
  User,
  Camera,
  X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface BrandSettings {
  brandName: string
  brandDescription: string
  brandLogo: string | null
  primaryColor: string
  secondaryColor: string
  contactEmail: string
  website: string
  phone: string
  address: string
  industry: string
  socialHandles: {
    instagram: string
    twitter: string
    linkedin: string
    facebook: string
  }
  campaignDefaults: {
    includeWatermark: boolean
    defaultFooter: string
    autoIncludeLogo: boolean
  }
}

const defaultSettings: BrandSettings = {
  brandName: "Acme Brand",
  brandDescription: "A leading fashion and lifestyle brand creating amazing experiences for our customers.",
  brandLogo: "/brand-logos/acme-logo.png",
  primaryColor: "#3B82F6",
  secondaryColor: "#1E293B",
  contactEmail: "marketing@acmebrand.com",
  website: "https://acmebrand.com",
  phone: "+1 (555) 123-4567",
  address: "123 Fashion Ave, New York, NY 10001",
  industry: "Fashion & Lifestyle",
  socialHandles: {
    instagram: "@acmebrand",
    twitter: "@acmebrand",
    linkedin: "acme-brand",
    facebook: "acmebrand"
  },
  campaignDefaults: {
    includeWatermark: true,
    defaultFooter: "Powered by Acme Brand | #AcmeBrand",
    autoIncludeLogo: true
  }
}

export default function BrandSettingsPage() {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const handleInputChange = (field: keyof BrandSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSocialHandleChange = (platform: keyof BrandSettings['socialHandles'], value: string) => {
    setSettings(prev => ({
      ...prev,
      socialHandles: {
        ...prev.socialHandles,
        [platform]: value
      }
    }))
  }

  const handleCampaignDefaultChange = (field: keyof BrandSettings['campaignDefaults'], value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      campaignDefaults: {
        ...prev.campaignDefaults,
        [field]: value
      }
    }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real app, you'd upload this to a server
      const url = URL.createObjectURL(file)
      setSettings(prev => ({ ...prev, brandLogo: url }))
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Show success message
  }

  const removelogo = () => {
    setSettings(prev => ({ ...prev, brandLogo: null }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Settings</h1>
          <p className="text-muted-foreground">Customize your brand identity and campaign defaults</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {previewMode && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Preview Mode</h3>
              <div className="flex items-center justify-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                {settings.brandLogo && (
                  <img src={settings.brandLogo} alt="Brand Logo" className="h-12 w-auto" />
                )}
                <div style={{ color: settings.primaryColor }}>
                  <h2 className="text-2xl font-bold">{settings.brandName}</h2>
                  <p className="text-sm" style={{ color: settings.secondaryColor }}>
                    {settings.brandDescription}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="brand" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brand">Brand Identity</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-6">
          {/* Brand Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Brand Identity
              </CardTitle>
              <CardDescription>
                Configure your brand name, description, and visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={settings.brandName}
                  onChange={(e) => handleInputChange('brandName', e.target.value)}
                  placeholder="Enter your brand name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandDescription">Brand Description</Label>
                <Textarea
                  id="brandDescription"
                  value={settings.brandDescription}
                  onChange={(e) => handleInputChange('brandDescription', e.target.value)}
                  placeholder="Describe your brand..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>Brand Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.brandLogo ? (
                    <div className="relative">
                      <img 
                        src={settings.brandLogo} 
                        alt="Brand Logo" 
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removelogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="logoUpload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </div>
                    </Label>
                    <Input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 2MB. Recommended: 200x200px
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      placeholder="#1E293B"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={settings.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fashion & Lifestyle">Fashion & Lifestyle</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                    <SelectItem value="Beauty & Cosmetics">Beauty & Cosmetics</SelectItem>
                    <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                    <SelectItem value="Travel & Tourism">Travel & Tourism</SelectItem>
                    <SelectItem value="Automotive">Automotive</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Add your contact details for campaign communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="marketing@yourcompany.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={settings.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Business St, City, State 12345"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Handles
              </CardTitle>
              <CardDescription>
                Connect your social media accounts for campaign attribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={settings.socialHandles.instagram}
                  onChange={(e) => handleSocialHandleChange('instagram', e.target.value)}
                  placeholder="@yourbrand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  value={settings.socialHandles.twitter}
                  onChange={(e) => handleSocialHandleChange('twitter', e.target.value)}
                  placeholder="@yourbrand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={settings.socialHandles.linkedin}
                  onChange={(e) => handleSocialHandleChange('linkedin', e.target.value)}
                  placeholder="your-brand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={settings.socialHandles.facebook}
                  onChange={(e) => handleSocialHandleChange('facebook', e.target.value)}
                  placeholder="yourbrand"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Campaign Defaults
              </CardTitle>
              <CardDescription>
                Set default settings for campaign exports and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-include Logo</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically include your brand logo in campaign exports
                  </p>
                </div>
                <Switch
                  checked={settings.campaignDefaults.autoIncludeLogo}
                  onCheckedChange={(checked) => handleCampaignDefaultChange('autoIncludeLogo', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Watermark</Label>
                  <p className="text-sm text-muted-foreground">
                    Add a watermark to exported campaign reports
                  </p>
                </div>
                <Switch
                  checked={settings.campaignDefaults.includeWatermark}
                  onCheckedChange={(checked) => handleCampaignDefaultChange('includeWatermark', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultFooter">Default Footer Text</Label>
                <Textarea
                  id="defaultFooter"
                  value={settings.campaignDefaults.defaultFooter}
                  onChange={(e) => handleCampaignDefaultChange('defaultFooter', e.target.value)}
                  placeholder="Add a default footer for your campaign exports..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  This text will appear at the bottom of your campaign export documents
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}