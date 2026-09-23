import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const client = createServerClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );

  const isConfigured = supabaseUrl && !supabaseUrl.includes('placeholder');
  const demoCookie = cookieStore.get('expense_demo_user')?.value;

  // Fallback testing support for sandbox environment when Supabase keys are not yet configured
  if (!isConfigured && demoCookie) {
    try {
      const demoUser = JSON.parse(demoCookie);
      client.auth.getUser = (async () => {
        return {
          data: { user: demoUser },
          error: null,
        };
      }) as typeof client.auth.getUser;
    } catch {
      // Ignore invalid demo cookie
    }
  }

  return client;
}
