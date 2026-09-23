'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { updatePassword } from '@/lib/supabase/actions';
import { updatePasswordSchema } from '@/lib/supabase/auth-schemas';

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setServerError(null);
    setServerSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await updatePassword(data);
      if (!result.success) {
        setServerError(result.error || 'Failed to update password.');
        return;
      }

      setServerSuccess(result.message || 'Password updated successfully!');
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
        <h1 className="text-2xl font-bold text-ink tracking-tight">Set new password</h1>
        <p className="text-xs text-ink/50 mt-1.5">
          Enter your new password to regain access to your account
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
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-ink/70"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters with a number"
            {...register('password')}
            aria-invalid={!!errors.password}
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
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold uppercase tracking-wider text-ink/70"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat new password"
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            className={`w-full px-3.5 py-2.5 bg-paper border rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors ${
              errors.confirmPassword
                ? 'border-rust focus:border-rust'
                : 'border-line focus:border-forest'
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-rust font-medium mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 bg-forest text-white rounded-xl text-sm font-bold shadow-2xs hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-forest/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <span>Update Password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center">
        <Link href="/login" className="text-xs font-bold text-forest hover:underline">
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
