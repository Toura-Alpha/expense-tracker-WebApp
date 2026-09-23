import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-paper text-ink flex flex-col justify-between items-center px-4 py-12 selection:bg-forest/15 selection:text-forest">
      {/* Brand Header */}
      <div className="w-full max-w-[420px] flex flex-col items-center text-center mb-6">
        <Link href="/login" className="inline-flex items-center gap-3 mb-4 group">
          <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:bg-forest/90 transition-colors">
            E
          </div>
          <div className="text-left">
            <span className="font-bold text-base tracking-tight leading-none text-ink block">
              expense-tracker
            </span>
            <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mt-0.5 block">
              Offline-First Ledger
            </span>
          </div>
        </Link>
      </div>

      {/* Main Form Content */}
      <div className="w-full max-w-[420px] my-auto">
        {children}
      </div>

      {/* Trust & Security Footer */}
      <div className="w-full max-w-[420px] text-center pt-8 text-xs text-ink/40 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-forest/70" />
        <span>Secured with Supabase Row-Level Security & AES Encryption</span>
      </div>
    </div>
  );
}
