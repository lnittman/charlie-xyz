'use client';

import * as Clerk from '@clerk/elements/common';
import * as SignUp from '@clerk/elements/sign-up';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { RadarText } from '@/components/shared/radar-text';

export function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const handleComplete = () => {
      router.push('/dashboard');
    };

    document.addEventListener('clerk:sign-up:complete', handleComplete);

    return () => {
      document.removeEventListener('clerk:sign-up:complete', handleComplete);
    };
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SignUp.Root routing="path" path="/signup">
        <SignUp.Step name="start">
          <div className="space-y-6">
            <RadarText className="mb-4" />

            <Clerk.GlobalError className="block text-sm text-destructive text-center" />

            {/* OAuth Providers */}
            <div className="space-y-3">
              <Clerk.Connection
                name="apple"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background border border-border hover:border-foreground/20 hover:bg-accent/50 transition-all duration-300 text-sm rounded-md h-11 font-medium"
              >
                <Clerk.Icon className="w-5 h-5 dark:invert" />
                Continue with Apple
              </Clerk.Connection>

              <Clerk.Connection
                name="google"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background border border-border hover:border-foreground/20 hover:bg-accent/50 transition-all duration-300 text-sm rounded-md h-11 font-medium"
              >
                <Clerk.Icon className="w-5 h-5" />
                Continue with Google
              </Clerk.Connection>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <div className="space-y-4">
              <Clerk.Field name="emailAddress" className="space-y-2">
                <Clerk.Label className="text-sm text-foreground">
                  Email address
                </Clerk.Label>
                <Clerk.Input
                  type="email"
                  className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 transition-colors"
                  placeholder="name@example.com"
                  style={{ fontSize: '16px' }}
                />
                <Clerk.FieldError className="text-sm text-destructive" />
              </Clerk.Field>

              <Clerk.Field name="password" className="space-y-2">
                <Clerk.Label className="text-sm text-foreground">
                  Password
                </Clerk.Label>
                <div className="relative">
                  <Clerk.Input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full h-11 rounded-md border border-border bg-background px-3 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlash className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Clerk.FieldError className="text-sm text-destructive" />
              </Clerk.Field>

              <Clerk.Field name="confirmPassword" className="space-y-2">
                <Clerk.Label className="text-sm text-foreground">
                  Confirm password
                </Clerk.Label>
                <div className="relative">
                  <Clerk.Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full h-11 rounded-md border border-border bg-background px-3 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeSlash className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Clerk.FieldError className="text-sm text-destructive" />
              </Clerk.Field>
            </div>

            {/* CAPTCHA for bot protection */}
            <SignUp.Captcha className="empty:hidden" />

            <SignUp.Action
              submit
              className="group w-full h-11 rounded-md bg-foreground px-4 text-sm font-medium text-background ring-offset-background transition-all hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight weight="duotone" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </SignUp.Action>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="font-medium text-foreground underline-offset-4 hover:underline transition-all"
              >
                Sign in
              </Link>
            </p>
          </div>
        </SignUp.Step>

        <SignUp.Step name="verifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Verify your email
              </h1>
              <p className="text-sm text-muted-foreground">
                We sent a verification code to your email
              </p>
            </div>

            <SignUp.Strategy name="email_code">
              <Clerk.Field name="code" className="space-y-2">
                <Clerk.Label className="text-sm text-foreground">
                  Verification code
                </Clerk.Label>
                <Clerk.Input
                  type="text"
                  className="w-full h-11 rounded-md border border-border bg-background px-3 text-center text-sm ring-offset-background placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 transition-colors tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  style={{ fontSize: '16px' }}
                />
                <Clerk.FieldError className="text-sm text-destructive text-center" />
              </Clerk.Field>

              <SignUp.Action
                submit
                className="w-full h-11 rounded-md bg-foreground px-4 text-sm font-medium text-background ring-offset-background transition-all hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-[0.98] mt-4"
              >
                Verify email
              </SignUp.Action>

              <SignUp.Action
                resend
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Didn't receive a code? Resend
              </SignUp.Action>
            </SignUp.Strategy>
          </motion.div>
        </SignUp.Step>
      </SignUp.Root>
    </motion.div>
  );
}
