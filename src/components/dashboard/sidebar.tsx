'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react';
import { signOut } from '@/lib/supabase/actions';

interface SidebarProps {
  userEmail?: string | null;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: ReceiptText },
    { label: 'Analytics', href: '/analytics', icon: PieChart },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName = userEmail ? userEmail.split('@')[0] : 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="hidden lg:flex w-64 border-r border-line bg-surface flex-col shrink-0 h-screen sticky top-0">
      <div className="p-8 flex-1 flex flex-col">
        {/* Brand identity */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-forest rounded-lg flex items-center justify-center text-white font-black text-xl shadow-xs">
            E
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight leading-none text-ink">
              expense-tracker
            </span>
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold text-ink mt-1">
              Secured Auth
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-3 px-3">
              Menu
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-forest/10 text-forest font-bold border-l-4 border-forest shadow-2xs'
                        : 'text-ink/60 hover:text-ink hover:bg-paper/50 font-medium'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-forest' : 'text-ink/50'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* User profile & Sign Out */}
      <div className="p-6 border-t border-line bg-paper/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <div className="w-8 h-8 rounded-full bg-forest/15 text-forest border border-forest/25 flex items-center justify-center font-bold text-[11px] shrink-0">
              {initials}
            </div>
            <div className="text-xs truncate">
              <p className="font-bold leading-none text-ink truncate capitalize">
                {displayName}
              </p>
              <p className="opacity-60 text-[10px] mt-1 text-ink truncate font-mono">
                {userEmail || 'Authenticated'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 text-ink/50 hover:text-rust hover:bg-surface rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isSigningOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-ink/60" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
