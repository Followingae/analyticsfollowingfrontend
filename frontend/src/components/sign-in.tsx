import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

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
  error?: string;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-all duration-150 focus-within:border-foreground/50 focus-within:bg-foreground/10 focus-within:ring-2 focus-within:ring-foreground/10">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "",
  testimonials = [],
  isLoading = false,
  error,
  onSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Fix hydration mismatch by ensuring theme is only used after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use fallback logo during SSR/hydration, then switch to theme-specific logo
  const logoSrc = mounted && theme === 'dark' ? "/Following Logo Dark Mode.svg" : "/followinglogo.svg";

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] relative">
      {/* Theme Toggle - Absolute positioned in top right */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 z-10 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </button>
      )}

      {/* Left column: sign-in form */}
      <section className="flex-[3] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* Logo aligned with left side */}
            <div className="mb-4">
              <img
                src={logoSrc}
                className="h-6 w-auto object-contain animate-element animate-delay-50"
                alt="Following Logo"
              />
            </div>
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            {description && <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>}

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label htmlFor="signin-email" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <GlassInputWrapper>
                  <input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoFocus
                    required
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-sm p-4 min-h-[44px] rounded-2xl focus:outline-none transition-colors duration-150"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label htmlFor="signin-password" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="signin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-sm p-4 pr-12 min-h-[44px] rounded-2xl focus:outline-none transition-colors duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-150" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-150" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-end text-sm">
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-muted-foreground transition-colors">Reset password</a>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-foreground min-h-[44px] py-4 font-medium text-background hover:bg-foreground/90 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                )}
                {isLoading ? "Signing in..." : "Sign In"}
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