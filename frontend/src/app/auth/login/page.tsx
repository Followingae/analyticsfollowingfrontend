'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { toast } from 'sonner'
import { SignInPage } from '@/components/sign-in'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useEnhancedAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const success = await login(email, password)

      if (success) {
        router.push('/dashboard')
      }
      // Error toast is already shown by AuthContext.login()
    } catch (error: any) {
      setError(error?.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    // Get email from the form if available
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
    const email = emailInput?.value?.trim()

    if (!email) {
      toast.error('Please enter your email address first')
      return
    }

    try {
      const { authService } = await import('@/services/authService')
      const result = await authService.forgotPassword(email)
      if (result.success) {
        toast.success('Password reset link sent! Check your email.')
      } else {
        toast.error(result.error || 'Failed to send reset email')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  const handleCreateAccount = () => {
    router.push('/auth/register')
  }

  return (
    <SignInPage
      title={
        <span className="font-light text-foreground tracking-tighter">
          Sign In
        </span>
      }
      description="Access your influencer discovery and campaign tools"
      isLoading={isLoading}
      error={error}
      onSignIn={handleSubmit}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  )
}