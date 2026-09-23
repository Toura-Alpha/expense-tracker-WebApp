'use client';

import React from 'react';
import { DataProvider } from '@/lib/db/useRxData';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './BottomNav';
import { TransactionModal } from './TransactionModal';

interface DashboardShellProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  return (
    <DataProvider>
      <div className="flex h-screen w-full bg-paper text-ink font-sans overflow-hidden">
        {/* Persistent left sidebar on desktop (>=1024px) */}
        <Sidebar userEmail={userEmail} />

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header with SyncStatus and New Entry button */}
          <Header />

          {/* Main scrollable content (pb-20 on mobile to leave space for BottomNav) */}
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 relative focus:outline-none">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav bar (<1024px) */}
        <BottomNav />

        {/* Global Add/Edit Transaction modal or sheet */}
        <TransactionModal />
      </div>
    </DataProvider>
  );
}
