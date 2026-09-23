'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Check, Circle } from 'lucide-react';
import { signUp } from '@/lib/supabase/actions';
import { registerSchema } from '@/lib/supabase/auth-schemas';

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const currentPassword = useWatch({
    control,
    name: 'password',
    defaultValue: '',
  });
  const hasMinLength = (currentPassword?.length || 0) >= 8;
  const hasNumber = /[0-9]/.test(currentPassword || '');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setServerSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await signUp(data);

      if (!result.success) {
        setServerError(result.error || 'Failed to create account.');
        return;
      }

      setServerSuccess(result.message || 'Account created successfully!');

      // Redirect shortly to dashboard
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-8 shadow-xs">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Create your account</h1>
        <p className="text-xs text-ink/50 mt-1.5">
          Establish your private offline-first ledger
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

      {serverSuccess && (
        <div
          role="alert"
          className="mb-6 p-3.5 bg-forest/10 border border-forest/30 rounded-xl text-forest text-xs flex items-start gap-2.5 font-medium leading-relaxed"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverSuccess}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
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
            aria-describedby={errors.email ? 'reg-email-error' : undefined}
            className={`w-full px-3.5 py-2.5 bg-paper border rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors ${
              errors.email
                ? 'border-rust focus:border-rust'
                : 'border-line focus:border-forest'
            }`}
          />
          {errors.email && (
            <p id="reg-email-error" className="text-xs text-rust font-medium mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-ink/70"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters with a number"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby="password-rules"
            className={`w-full px-3.5 py-2.5 bg-paper border rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors ${
              errors.password
                ? 'border-rust focus:border-rust'
                : 'border-line focus:border-forest'
            }`}
          />
          {errors.password && (
            <p className="text-xs text-rust font-medium mt-1">
              {errors.password.message}
            </p>
          )}

          {/* Password strength checklist */}
          <div id="password-rules" className="pt-2 space-y-1.5 text-xs text-ink/60">
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <Check className="w-3.5 h-3.5 text-forest shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-ink/30 shrink-0" />
              )}
              <span className={hasMinLength ? 'text-forest font-semibold' : ''}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasNumber ? (
                <Check className="w-3.5 h-3.5 text-forest shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-ink/30 shrink-0" />
              )}
              <span className={hasNumber ? 'text-forest font-semibold' : ''}>
                Contains at least one number (0-9)
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold uppercase tracking-wider text-ink/70"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
            className={`w-full px-3.5 py-2.5 bg-paper border rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors ${
              errors.confirmPassword
                ? 'border-rust focus:border-rust'
                : 'border-line focus:border-forest'
            }`}
          />
          {errors.confirmPassword && (
            <p id="confirm-error" className="text-xs text-rust font-medium mt-1">
              {errors.confirmPassword.message}
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
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center">
        <p className="text-xs text-ink/50">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-forest hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
