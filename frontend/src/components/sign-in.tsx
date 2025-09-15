import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  testimonials?: Testimonial[];
  isLoading?: boolean;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-foreground/50 focus-within:bg-foreground/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div 
    className={`animate-testimonial ${delay} flex items-center justify-center rounded-3xl border border-white/20 dark:border-white/15 p-6 w-48 h-24 shadow-lg`}
    style={{
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(12px) saturate(120%)',
      WebkitBackdropFilter: 'blur(12px) saturate(120%)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    }}
  >
    <img src={testimonial.avatarSrc} className="h-8 w-auto object-contain" alt="Following Logo" />
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  testimonials = [],
  isLoading = false,
  onSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-[3] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* Logo aligned with left side */}
            <div className="mb-4">
              <img 
                src="/followinglogo.svg" 
                className="h-6 w-auto object-contain animate-element animate-delay-50 opacity-60" 
                alt="Following Logo" 
              />
            </div>
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="Enter your email address" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-end text-sm">
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-muted-foreground transition-colors">Reset password</a>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-foreground py-4 font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                )}
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>


            <p className="animate-element animate-delay-700 text-center text-sm text-muted-foreground">
              New to our platform? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-foreground hover:underline transition-colors">Create Account</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: magnet lines animation + testimonials */}
      <section className="hidden md:block flex-[2] relative p-4">
        <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 overflow-hidden">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover rounded-3xl"
          >
            <source src="/abstract-green-gradient-glass-background-following-influencers-platform.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="absolute bottom-6 right-6">
          <div 
            className="animate-testimonial animate-delay-1000 flex items-center justify-center rounded-2xl border border-white/20 dark:border-white/15 px-4 py-2 shadow-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px) saturate(120%)',
              WebkitBackdropFilter: 'blur(12px) saturate(120%)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <p className="text-xs text-gray-700 dark:text-gray-300 opacity-70">
              Built with ❤️ in Dubai
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};  