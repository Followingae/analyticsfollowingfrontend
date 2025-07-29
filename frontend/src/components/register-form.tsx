import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import Link from "next/link"

interface RegisterFormProps extends React.ComponentProps<"form"> {
  isLoading?: boolean
}

export function RegisterForm({
  className,
  isLoading = false,
  ...props
}: RegisterFormProps) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your details to create your Analytics Following account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="fullName">Full Name</Label>
          <Input 
            id="fullName" 
            name="fullName"
            type="text" 
            placeholder="Enter your full name" 
            disabled={isLoading}
            required 
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email"
            type="email" 
            placeholder="name@example.com" 
            disabled={isLoading}
            required 
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            name="password"
            type="password" 
            placeholder="Create a password (min. 6 characters)"
            disabled={isLoading}
            required 
            minLength={6}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            name="confirmPassword"
            type="password" 
            placeholder="Confirm your password"
            disabled={isLoading}
            required 
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Account
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </form>
  )
}