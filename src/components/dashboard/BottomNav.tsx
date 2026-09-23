'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  PieChart,
  Settings,
} from 'lucide-react';
import { useData } from '@/lib/db/useRxData';

export function BottomNav() {
  const pathname = usePathname();
  const { openAddModal } = useData();

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line px-2 py-1.5 flex items-center justify-around shadow-lg"
    >
      {/* 1. Dashboard */}
      <Link
        href="/dashboard"
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
          pathname === '/dashboard' ? 'text-forest' : 'text-ink/50 hover:text-ink'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Dashboard</span>
      </Link>

      {/* 2. Transactions */}
      <Link
        href="/transactions"
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
          pathname === '/transactions' ? 'text-forest' : 'text-ink/50 hover:text-ink'
        }`}
      >
        <ReceiptText className="w-5 h-5" />
        <span>Ledger</span>
      </Link>

      {/* 3. Distinct Raised Add Action Button */}
      <div className="relative -mt-6 flex flex-col items-center">
        <button
          onClick={() => openAddModal()}
          aria-label="Add new transaction"
          className="w-12 h-12 rounded-full bg-forest text-white shadow-md flex items-center justify-center hover:bg-forest/90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-forest cursor-pointer border-2 border-surface"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
        <span className="text-[10px] font-bold text-forest mt-0.5">Add</span>
      </div>

      {/* 4. Analytics */}
      <Link
        href="/analytics"
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
          pathname === '/analytics' ? 'text-forest' : 'text-ink/50 hover:text-ink'
        }`}
      >
        <PieChart className="w-5 h-5" />
        <span>Analytics</span>
      </Link>

      {/* 5. Settings */}
      <Link
        href="/settings"
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
          pathname === '/settings' ? 'text-forest' : 'text-ink/50 hover:text-ink'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </Link>
    </nav>
  );
}
