'use client';

import React, { useEffect } from 'react';
import { DataProvider, useData } from '@/lib/db/useRxData';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './BottomNav';
import { TransactionModal } from './TransactionModal';

interface DashboardShellProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

function GlobalKeyboardShortcuts() {
  const { openAddModal } = useData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openAddModal();
      } else if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openAddModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openAddModal]);

  return null;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  return (
    <DataProvider>
      <GlobalKeyboardShortcuts />
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
