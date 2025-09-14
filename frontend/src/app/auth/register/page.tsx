'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { toast } from 'sonner'
import { SignUpPage } from '@/components/sign-up'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useEnhancedAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    
    try {
      const success = await register(email, password, fullName)
      if (success) {
        router.push('/dashboard')
      }
    } catch (error) {

    } finally {
      setIsLoading(false)
    }
  }


  const handleSignInRedirect = () => {
    router.push('/auth/login')
  }

  return (
    <SignUpPage
      title={
        <span className="font-light text-foreground tracking-tighter">
          Join{' '}
          <span className="font-semibold">
            Analytics Following
          </span>
        </span>
      }
      description="Create your account and unlock AI-powered analytics, discovery, and growth acceleration tools"
      testimonials={[
        {
          avatarSrc: "/followinglogo.svg",
          name: "Analytics Following",
          handle: "Professional Instagram Analytics", 
          text: "Unlock the power of professional Instagram analytics and grow your presence with AI-driven insights."
        }
      ]}
      onSignUp={handleSubmit}
      onSignInRedirect={handleSignInRedirect}
    />
  )
}