'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { signIn } from '@/lib/supabase/actions';
import { loginSchema } from '@/lib/supabase/auth-schemas';

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn(data);

      if (!result.success) {
        setServerError(
          result.error || 'Unable to sign in. Please check your credentials.'
        );
        return;
      }

      // Successful login -> navigate to intended destination
      router.push(redirectTo);
      router.refresh();
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-8 shadow-xs">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Welcome back</h1>
        <p className="text-xs text-ink/50 mt-1.5">
          Sign in to access your ledger and synchronize your finances
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-6 p-3.5 bg-rust/10 border border-rust/30 rounded-xl text-rust text-xs flex items-start gap-2.5 font-medium leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-ink/70"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full px-3.5 py-2.5 bg-paper border rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors ${
              errors.email
                ? 'border-rust focus:border-rust'
                : 'border-line focus:border-forest'
            }`}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-rust font-medium mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-forest hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`w-full px-3.5 py-2.5 bg-paper border rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors ${
              errors.password
                ? 'border-rust focus:border-rust'
                : 'border-line focus:border-forest'
            }`}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-rust font-medium mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 bg-forest text-white rounded-xl text-sm font-bold shadow-2xs hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-forest/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center">
        <p className="text-xs text-ink/50">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-forest hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface border border-line rounded-2xl p-8 shadow-xs flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
