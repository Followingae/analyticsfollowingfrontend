"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Zap, ArrowRight, X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { formatCredits } from "@/utils/creditUtils"

interface InsufficientCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  creditsRequired?: number
  creditsAvailable?: number
  creditsNeeded?: number
  actionName?: string
  message?: string
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  creditsRequired = 0,
  creditsAvailable = 0,
  creditsNeeded = 0,
  actionName = "this action",
  message
}: InsufficientCreditsModalProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleUpgrade = async () => {
    setIsNavigating(true)
    router.push("/billing")
    // Keep modal open briefly to show loading state
    setTimeout(() => {
      onClose()
      setIsNavigating(false)
    }, 500)
  }

  const handleViewBilling = () => {
    router.push("/billing")
    onClose()
  }

  // Calculate percentage of credits available
  const availablePercentage = creditsRequired > 0 
    ? Math.round((creditsAvailable / creditsRequired) * 100)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle>Insufficient Credits</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {message || `You don't have enough credits to perform ${actionName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Credit Status */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Credits Required</span>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {formatCredits(creditsRequired)} credits
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Credits Available</span>
                <Badge variant="outline" className="bg-muted/50 text-gray-700 border-border">
                  {formatCredits(creditsAvailable)} credits
                </Badge>
              </div>

              {creditsNeeded > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Credits Needed</span>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {formatCredits(creditsNeeded)} credits
                  </Badge>
                </div>
              )}

              {/* Visual progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Available</span>
                  <span>{availablePercentage}% of required</span>
                </div>
                <Progress value={availablePercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Credit Packages */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Credit Packages</h4>
            <div className="grid gap-2">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-sm">1,000 Credits</div>
                  <div className="text-xs text-muted-foreground">Basic package</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">AED 180</div>
                  <div className="text-xs text-green-600">Covers this action</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-sm">5,000 Credits</div>
                  <div className="text-xs text-muted-foreground">Popular choice</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">AED 730</div>
                  <div className="text-xs text-blue-600">Best value</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleUpgrade} 
              className="w-full"
              disabled={isNavigating}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isNavigating ? "Opening Billing..." : "Purchase Credits"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleViewBilling}
              className="w-full"
            >
              View Billing & Usage
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-muted-foreground">
            Credits are used to access premium analytics features.
            <br />
            Your monthly allowance resets on the 1st of each month.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}