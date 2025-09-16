'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { toast } from 'sonner'
import { SignInPage } from '@/components/sign-in'
import Image from 'next/image'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useEnhancedAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    
    try {
      const success = await login(email, password)
      
      if (success) {
        router.push('/dashboard')
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }


  const handleResetPassword = () => {
    toast.info('Password reset functionality coming soon!')
  }

  const handleCreateAccount = () => {
    router.push('/auth/register')
  }

  return (
    <SignInPage
      title={
        <span className="font-light text-foreground tracking-tighter">
          Welcome
        </span>
      }
      description="Influencer marketing, from discovery to results"
      testimonials={[
        {
          avatarSrc: "/followinglogo.svg",
          name: "Analytics Following",
          handle: "Professional Instagram Analytics",
          text: "Transform your Instagram strategy with AI-powered insights and comprehensive analytics tools."
        }
      ]}
      isLoading={isLoading}
      onSignIn={handleSubmit}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  )
}