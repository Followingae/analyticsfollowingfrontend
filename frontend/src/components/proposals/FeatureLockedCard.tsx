'use client'

import {
  Lock,
  Mail,
  MessageCircle,
  ArrowRight,
  Building2,
  Shield
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FeatureLockedCardProps {
  feature: string
  title?: string
  description?: string
  actionText?: string
  onContactSupport?: () => void
}

export function FeatureLockedCard({
  feature,
  title = 'Feature Locked',
  description = 'This feature requires agency access.',
  actionText = 'Contact Support for Agency Access',
  onContactSupport
}: FeatureLockedCardProps) {

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport()
    } else {
      // Default action: open email client
      window.location.href = 'mailto:support@following.ae?subject=Agency Access Request - Proposals Feature'
    }
  }

  const getFeatureIcon = (featureName: string) => {
    switch (featureName.toLowerCase()) {
      case 'proposals':
        return <Building2 className="h-12 w-12 text-muted-foreground/50" />
      default:
        return <Lock className="h-12 w-12 text-muted-foreground/50" />
    }
  }

  const getFeatureDetails = (featureName: string) => {
    switch (featureName.toLowerCase()) {
      case 'proposals':
        return {
          title: 'Proposals Feature Locked',
          description: 'Access marketing proposals and campaign collaboration tools designed for agency clients.',
          benefits: [
            'Receive and review marketing proposals',
            'Collaborate with Following Agency team',
            'Track campaign progress and deliverables',
            'Streamlined approval workflow'
          ]
        }
      default:
        return {
          title: 'Feature Locked',
          description: 'This feature requires special access.',
          benefits: ['Enhanced functionality', 'Professional tools']
        }
    }
  }

  const featureInfo = getFeatureDetails(feature)

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            {getFeatureIcon(feature)}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-2xl">{featureInfo.title}</CardTitle>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Agency Only
            </Badge>
          </div>

          <CardDescription className="text-base">
            {featureInfo.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Feature Benefits */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              What you'll get with agency access:
            </h4>
            <ul className="space-y-2">
              {featureInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Options */}
          <div className="space-y-3">
            <Button
              onClick={handleContactSupport}
              className="w-full"
              size="lg"
            >
              <Mail className="h-4 w-4 mr-2" />
              {actionText}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Need immediate assistance?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://wa.me/971505551234', '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp Support
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Agency features are designed for professional marketing campaigns and require special access.
              Our team will help you get set up quickly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}