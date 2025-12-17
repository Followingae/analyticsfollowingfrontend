'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Mail, Phone, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PendingApprovalPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
            <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-3xl">Account Pending Approval</CardTitle>
          <CardDescription className="text-base">
            Your enterprise account request has been received
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">What happens next?</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <div>
                  <p className="font-medium text-foreground">Account Review</p>
                  <p>Our team will review your enterprise account request within 24 hours</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <div>
                  <p className="font-medium text-foreground">Personalized Setup</p>
                  <p>A dedicated account manager will contact you to discuss your needs</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <div>
                  <p className="font-medium text-foreground">Account Activation</p>
                  <p>Once approved, you'll receive login credentials and onboarding materials</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Need immediate assistance?</h4>
            <div className="flex flex-col sm:flex-row gap-3 text-sm">
              <Button variant="outline" className="flex-1" asChild>
                <a href="mailto:enterprise@following.ae" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  enterprise@following.ae
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href="tel:+971501234567" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +971 50 123 4567
                </a>
              </Button>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}