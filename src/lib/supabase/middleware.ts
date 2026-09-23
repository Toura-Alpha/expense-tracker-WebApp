import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isConfigured = supabaseUrl && !supabaseUrl.includes('placeholder');
  let user = null;

  if (isConfigured) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } else {
    // Sandbox fallback: check for demo session cookie
    const demoCookie = request.cookies.get('expense_demo_user')?.value;
    if (demoCookie) {
      try {
        user = JSON.parse(demoCookie);
      } catch {
        user = null;
      }
    }
  }

  const pathname = request.nextUrl.pathname;

  // Protected routes: dashboard and sub-modules
  const isProtectedRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/settings');

  // If unauthenticated user accesses protected dashboard routes, redirect to /login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated user navigates to auth pages, redirect to dashboard
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
