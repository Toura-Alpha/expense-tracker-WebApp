'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { resetPassword } from '@/lib/supabase/actions';
import { forgotPasswordSchema } from '@/lib/supabase/auth-schemas';

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    setServerSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await resetPassword(data);
      if (result.success) {
        setServerSuccess(
          result.message || 'If an account exists, a reset link has been dispatched.'
        );
      } else {
        setServerError(result.error || 'Failed to process password reset.');
      }
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-8 shadow-xs">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Reset password</h1>
        <p className="text-xs text-ink/50 mt-1.5">
          Enter your email to receive recovery instructions
        </p>
      </div>

      {serverSuccess ? (
        <div className="space-y-6">
          <div className="p-4 bg-forest/10 border border-forest/30 rounded-xl text-forest text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-forest mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Recovery link sent</p>
              <p className="text-forest/80 leading-relaxed">{serverSuccess}</p>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full py-2.5 px-4 bg-paper border border-line hover:border-forest rounded-xl text-xs font-bold text-ink transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <div
              role="alert"
              className="p-3.5 bg-rust/10 border border-rust/30 rounded-xl text-rust text-xs flex items-start gap-2.5 font-medium leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              Account Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'fp-email-error' : undefined}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-paper border rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors ${
                  errors.email
                    ? 'border-rust focus:border-rust'
                    : 'border-line focus:border-forest'
                }`}
              />
              <Mail className="w-4 h-4 text-ink/40 absolute left-3.5 top-3" />
            </div>
            {errors.email && (
              <p id="fp-email-error" className="text-xs text-rust font-medium mt-1">
                {errors.email.message}
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
                <span>Sending link...</span>
              </>
            ) : (
              <span>Send Recovery Link</span>
            )}
          </button>

          <div className="pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
