'use client'

import {
  Users,
  Mail,
  MessageCircle,
  ArrowRight,
  Building2,
  Zap,
  CheckCircle,
  Target
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { motion } from "motion/react"
import { proposalMotion } from "./proposal-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface FeatureLockedCardProps {
  feature: string
  title?: string
  description?: string
  actionText?: string
  onContactSupport?: () => void
}

export function FeatureLockedCard({
  feature,
  title = 'Agency Services Required',
  description = 'Partner with Following as your dedicated influencer marketing agency.',
  actionText = 'Enroll Your Brand',
  onContactSupport
}: FeatureLockedCardProps) {

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport()
    } else {
      // Default action: open email client for agency enrollment
      window.location.href = 'mailto:partnerships@following.ae?subject=Brand Agency Enrollment - Influencer Campaign Management'
    }
  }

  const getFeatureLogo = () => {
    return (
      <div className="flex items-center justify-center mb-2">
        {/* Light mode: dark logo, Dark mode: light logo */}
        <img
          src="/followinglogo.svg"
          alt="Following"
          className="h-8 w-auto dark:hidden"
        />
        <img
          src="/Following Logo Dark Mode.svg"
          alt="Following"
          className="h-8 w-auto hidden dark:block"
        />
      </div>
    )
  }

  const getFeatureDetails = (featureName: string) => {
    switch (featureName.toLowerCase()) {
      case 'proposals':
        return {
          title: 'Enterprise campaign management',
          description: 'Available exclusively to full-service agency clients.',
          benefits: [
            'Dedicated account management team',
            'Custom influencer sourcing & vetting',
            'End-to-end campaign execution',
            'Performance tracking & optimization',
            'Content approval workflows',
            'Guaranteed campaign deliverables'
          ]
        }
      default:
        return {
          title: 'Agency Partnership Required',
          description: 'This feature is part of our full-service agency offering.',
          benefits: ['Professional campaign management', 'Dedicated support team']
        }
    }
  }

  const featureInfo = getFeatureDetails(feature)

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          variants={proposalMotion.staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center mb-8"
        >
          <motion.div variants={proposalMotion.staggerItem} className="flex items-center justify-center mb-6">
            {getFeatureLogo()}
          </motion.div>
          <motion.h1 variants={proposalMotion.staggerItem} className="text-2xl font-semibold text-foreground mb-3">
            {featureInfo.title}
          </motion.h1>
          {featureInfo.description && (
            <p className="text-muted-foreground text-base leading-relaxed">
              {featureInfo.description}
            </p>
          )}
        </motion.div>

        {/* Benefits */}
        <Card className="mb-8 text-center">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              What&apos;s included
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.ul
              variants={proposalMotion.staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {featureInfo.benefits.map((benefit, index) => (
                <motion.li key={index} variants={proposalMotion.staggerItem} className="flex items-start justify-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed text-left">{benefit}</span>
                </motion.li>
              ))}
            </motion.ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            onClick={handleContactSupport}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            <Target className="h-5 w-5 mr-2" />
            {actionText}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Join 200+ brands who trust Following for their influencer marketing campaigns.
            <br />
            Professional campaign management with guaranteed results.
          </p>
        </div>
      </div>
    </div>
  )
}