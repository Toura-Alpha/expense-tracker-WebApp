'use server';

import { cookies } from 'next/headers';
import { createClient } from './server';
import {
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from './rate-limit';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from './auth-schemas';

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}

// -----------------------------------------------------------------------------
// Server Actions
// -----------------------------------------------------------------------------

export async function signIn(formData: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  // 1. Zod input validation
  const validation = loginSchema.safeParse(formData);
  if (!validation.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  // 2. Rate limiting check (5 attempts / 15 minutes)
  const rateLimit = checkRateLimit(email);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many failed login attempts. Please try again in ${rateLimit.retryAfterMinutes || 15} minutes.`,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isConfigured = supabaseUrl && !supabaseUrl.includes('placeholder');

  try {
    const supabase = await createClient();

    if (isConfigured) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        recordFailedAttempt(email);

        // Friendly error mapping — never leak internals
        const rawMessage = error.message.toLowerCase();
        let friendlyError = 'Incorrect email or password.';
        if (rawMessage.includes('email not confirmed')) {
          friendlyError = 'Please verify your email address before logging in.';
        } else if (rawMessage.includes('rate limit')) {
          friendlyError = 'Too many attempts. Please try again later.';
        }

        return {
          success: false,
          error: friendlyError,
        };
      }

      recordSuccessfulAttempt(email);
      return { success: true };
    } else {
      // Sandbox fallback: allow sign in and establish secure demo cookie
      const cookieStore = await cookies();
      cookieStore.set(
        'expense_demo_user',
        JSON.stringify({
          id: 'demo-user-id',
          email,
          user_metadata: { name: email.split('@')[0] },
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }
      );

      recordSuccessfulAttempt(email);
      return { success: true };
    }
  } catch {
    recordFailedAttempt(email);
    return {
      success: false,
      error: 'Unable to sign in at this moment. Please try again later.',
    };
  }
}

export async function signUp(formData: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  // Server-side Zod validation
  const validation = registerSchema.safeParse(formData);
  if (!validation.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isConfigured = supabaseUrl && !supabaseUrl.includes('placeholder');

  try {
    const supabase = await createClient();

    if (isConfigured) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        const raw = error.message.toLowerCase();
        let friendlyError = 'Unable to create account. Please try again.';
        if (raw.includes('already registered') || raw.includes('unique')) {
          friendlyError = 'An account with this email address already exists.';
        } else if (raw.includes('weak') || raw.includes('password')) {
          friendlyError = 'Password does not meet security requirements.';
        }

        return {
          success: false,
          error: friendlyError,
        };
      }

      return {
        success: true,
        message: 'Account created! Please check your email to confirm your account.',
      };
    } else {
      // Sandbox fallback
      const cookieStore = await cookies();
      cookieStore.set(
        'expense_demo_user',
        JSON.stringify({
          id: 'demo-user-id',
          email,
          user_metadata: { name: email.split('@')[0] },
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        }
      );

      return {
        success: true,
        message: 'Account created successfully! Redirecting to dashboard...',
      };
    }
  } catch {
    return {
      success: false,
      error: 'Failed to create account. Please try again later.',
    };
  }
}

export async function signOut(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    cookieStore.delete('expense_demo_user');

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to sign out.' };
  }
}

export async function resetPassword(formData: {
  email: string;
}): Promise<ActionResult> {
  const validation = forgotPasswordSchema.safeParse(formData);
  if (!validation.success) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email } = validation.data;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isConfigured = supabaseUrl && !supabaseUrl.includes('placeholder');

  try {
    if (isConfigured) {
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/callback?next=/reset-password`,
      });
    }

    // Always return success to prevent email enumeration attacks
    return {
      success: true,
      message: 'If an account exists for this email, password reset instructions have been sent.',
    };
  } catch {
    return {
      success: true,
      message: 'If an account exists for this email, password reset instructions have been sent.',
    };
  }
}

export async function updatePassword(formData: {
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const validation = updatePasswordSchema.safeParse(formData);
  if (!validation.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { password } = validation.data;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isConfigured = supabaseUrl && !supabaseUrl.includes('placeholder');

  try {
    if (isConfigured) {
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return {
          success: false,
          error: 'Unable to update password. Please request a new reset link.',
        };
      }
    }

    return {
      success: true,
      message: 'Password updated successfully. You can now log in.',
    };
  } catch {
    return {
      success: false,
      error: 'Failed to update password. Please try again.',
    };
  }
}
