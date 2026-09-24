import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const metadata: Metadata = {
  title: {
    template: '%s — Expense Tracker',
    default: 'Dashboard — Expense Tracker',
  },
  description: 'Offline-first personal expense tracking and financial management.',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session verification for every route under (dashboard)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardShell userEmail={user.email}>{children}</DashboardShell>;
}
