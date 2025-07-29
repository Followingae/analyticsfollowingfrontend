'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { RegisterForm } from '@/components/register-form'
import { toast } from 'sonner'
import Image from "next/image"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
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
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[65%_35%] bg-white">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image 
              src="/followinglogo.svg" 
              alt="Following Logo" 
              width={120} 
              height={40}
              className="object-contain"
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
      <div className="bg-white relative hidden lg:block p-6">
        <img
          src="/smile-for-the-camera-2025-04-06-07-25-08-utc.jpg"
          alt="Analytics Following - Professional Instagram Analytics"
          className="absolute inset-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)] object-cover dark:brightness-[0.2] dark:grayscale rounded-lg"
        />
        <div className="absolute inset-6 bg-black/40 rounded-lg" />
        <div className="absolute inset-6 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <Image 
                src="/Following Logo Dark Mode.svg" 
                alt="Following Logo" 
                width={200} 
                height={60}
                className="object-contain"
              />
            </div>
            <p className="text-lg opacity-90">
              Professional Instagram Analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}