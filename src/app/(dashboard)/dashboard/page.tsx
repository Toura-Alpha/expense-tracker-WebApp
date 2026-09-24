'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertCircle,
  Database,
  CheckCircle2,
  ArrowRight,
  Receipt,
  PlusCircle,
} from 'lucide-react';
import { useData } from '@/lib/db/useRxData';
import { formatCurrency, getCategoryIcon } from '@/lib/formatters';

export default function DashboardPage() {
  const {
    transactions,
    categories,
    budgets,
    currency,
    isLoading,
    error,
    openAddModal,
    openEditModal,
    seedSampleData,
  } = useData();

  // Desktop pinned NLP input state
  const [nlpInput, setNlpInput] = useState('');
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [nlpError, setNlpError] = useState<string | null>(null);

  // Compute this month's calculations
  const {
    currentBalance,
    monthIncome,
    monthSpend,
    monthNet,
    incomeChangePct,
    spendChangePct,
    categoryBudgets,
    recentTransactions,
  } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let totalBalance = 0;
    let thisMonthIncome = 0;
    let thisMonthSpend = 0;

    const categorySpendMap: Record<string, number> = {};

    // Calculate last month figures for MoM comparisons
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonthMonth = lastMonthDate.getMonth();

    let lastMonthIncome = 0;
    let lastMonthSpend = 0;

    for (const tx of transactions) {
      totalBalance += tx.amount;

      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        if (tx.amount > 0) {
          thisMonthIncome += tx.amount;
        } else {
          const absAmount = Math.abs(tx.amount);
          thisMonthSpend += absAmount;
          if (tx.category_id) {
            categorySpendMap[tx.category_id] = (categorySpendMap[tx.category_id] || 0) + absAmount;
          }
        }
      } else if (txDate.getFullYear() === lastMonthYear && txDate.getMonth() === lastMonthMonth) {
        if (tx.amount > 0) {
          lastMonthIncome += tx.amount;
        } else {
          lastMonthSpend += Math.abs(tx.amount);
        }
      }
    }

    const incomeChangePct =
      lastMonthIncome > 0
        ? Math.round(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
        : null;
    const spendChangePct =
      lastMonthSpend > 0
        ? Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100)
        : null;

    // Build category budget progress bars
    const budgetsData = categories
      .filter((cat) => !cat.is_income)
      .map((cat) => {
        const budgetDoc = budgets.find((b) => b.category_id === cat.id);
        const limit = budgetDoc ? budgetDoc.monthly_limit : 0;
        const spent = categorySpendMap[cat.id] || 0;
        const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
        const isOver = limit > 0 && spent > limit;
        return {
          category: cat,
          limit,
          spent,
          percent,
          isOver,
        };
      })
      .filter((item) => item.limit > 0 || item.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    return {
      currentBalance: totalBalance,
      monthIncome: thisMonthIncome,
      monthSpend: thisMonthSpend,
      monthNet: thisMonthIncome - thisMonthSpend,
      incomeChangePct,
      spendChangePct,
      categoryBudgets: budgetsData,
      recentTransactions: transactions.slice(0, 5),
    };
  }, [transactions, categories, budgets]);

  // Handle Quick NLP submit pinned at top
  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim() || isParsingNlp) return;

    try {
      setIsParsingNlp(true);
      setNlpError(null);

      const res = await fetch('/api/parse-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: nlpInput }),
      });

      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || 'Unable to parse transaction');
      }

      const item = json.data;
      let matchedCatId = undefined;
      if (item.category) {
        const matched = categories.find((c) =>
          c.name.toLowerCase().includes(String(item.category).toLowerCase())
        );
        if (matched) matchedCatId = matched.id;
      }

      setNlpInput('');
      openAddModal({
        merchant_name: item.description,
        amount:
          item.type === 'expense'
            ? -Math.abs(Number(item.amount))
            : Math.abs(Number(item.amount)),
        category_id: matchedCatId,
        date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      });
    } catch (err: any) {
      setNlpError(err.message || 'Failed to parse text');
    } finally {
      setIsParsingNlp(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading dashboard data..."
        className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-pulse"
      >
        <div className="h-14 bg-surface border border-line rounded-xl w-full" />
        <div className="space-y-4">
          <div className="h-6 bg-surface border border-line rounded w-48" />
          <div className="h-16 bg-surface border border-line rounded w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-surface border border-line rounded-xl" />
          <div className="h-28 bg-surface border border-line rounded-xl" />
          <div className="h-28 bg-surface border border-line rounded-xl" />
        </div>
        <div className="h-48 bg-surface border border-line rounded-xl" />
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-surface border border-rust/30 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 text-rust">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-bold">Failed to load local database</h2>
          </div>
          <p className="text-sm text-ink/70">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rust text-white text-xs font-bold rounded-lg hover:bg-rust/90 transition-colors cursor-pointer"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  const isPositiveBalance = currentBalance >= 0;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Pinned Quick-Add Natural Language Input (Desktop pinned top) */}
      <div className="hidden lg:block bg-surface border border-line rounded-2xl p-4 shadow-2xs">
        <form onSubmit={handleNlpSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              placeholder='Natural language quick add: "Paid $65 for dinner at Mario’s yesterday" or "Client invoice payment $1,500"'
              className="w-full pl-10 pr-4 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest transition-colors"
            />
            <Sparkles className="absolute left-3.5 top-3 w-4 h-4 text-forest opacity-80" />
          </div>
          <button
            type="submit"
            disabled={isParsingNlp || !nlpInput.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-bold hover:bg-forest/90 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
          >
            {isParsingNlp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Parse & Add</span>
          </button>
        </form>
        {nlpError && (
          <p className="text-xs text-rust font-medium mt-2 pl-2">{nlpError}</p>
        )}
      </div>

      {/* Floating Action Button (FAB) for Mobile Quick Add */}
      <button
        onClick={() => openAddModal()}
        aria-label="Quick add transaction"
        className="lg:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-forest text-white rounded-full shadow-xl flex items-center justify-center hover:bg-forest/90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-forest cursor-pointer border-2 border-surface"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Hero Balance Section */}
      <section className="bg-surface border border-line rounded-2xl p-6 lg:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-1">
              Net Balance (All-Time)
            </p>
            {/* 40px type step with tabular numerals, text-forest if positive, text-rust if negative */}
            <h1
              className={`text-[40px] font-bold tracking-tight leading-none tabular ${
                isPositiveBalance ? 'text-forest' : 'text-rust'
              }`}
            >
              {formatCurrency(currentBalance, currency)}
            </h1>
            <p className="text-xs text-ink/40 mt-2 font-medium">
              Offline-first ledger &middot; Instant local verification
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-xl text-xs font-bold hover:bg-forest/90 transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-forest"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* This Month Spend vs Income Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-line">
          <div className="p-4 bg-paper rounded-xl border border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink/60">This Month Income</span>
              <ArrowUpRight className="w-4 h-4 text-forest" />
            </div>
            <p className="text-xl font-bold text-forest tabular mt-1.5">
              {formatCurrency(monthIncome, currency)}
            </p>
            {incomeChangePct !== null && (
              <p
                className={`text-[10px] font-semibold mt-1 ${
                  incomeChangePct >= 0 ? 'text-forest' : 'text-rust'
                }`}
              >
                {incomeChangePct >= 0 ? `↑ ${incomeChangePct}%` : `↓ ${Math.abs(incomeChangePct)}%`}{' '}
                vs last month
              </p>
            )}
          </div>

          <div className="p-4 bg-paper rounded-xl border border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink/60">This Month Spend</span>
              <ArrowDownRight className="w-4 h-4 text-rust" />
            </div>
            <p className="text-xl font-bold text-rust tabular mt-1.5">
              {formatCurrency(monthSpend, currency)}
            </p>
            {spendChangePct !== null && (
              <p
                className={`text-[10px] font-semibold mt-1 ${
                  spendChangePct <= 0 ? 'text-forest' : 'text-rust'
                }`}
              >
                {spendChangePct > 0 ? `↑ ${spendChangePct}%` : `↓ ${Math.abs(spendChangePct)}%`}{' '}
                vs last month
              </p>
            )}
          </div>

          <div className="p-4 bg-paper rounded-xl border border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink/60">Net Savings</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  monthNet >= 0 ? 'bg-forest/10 text-forest' : 'bg-rust/10 text-rust'
                }`}
              >
                {monthNet >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <p
              className={`text-xl font-bold tabular mt-1.5 ${
                monthNet >= 0 ? 'text-forest' : 'text-rust'
              }`}
            >
              {formatCurrency(monthNet, currency, true)}
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Budget Progress Bars & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Budget Progress Bars per category (Thin horizontal bar, not a card) */}
        <section className="lg:col-span-2 bg-surface border border-line rounded-2xl p-6 lg:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">Category Budgets</h2>
              <p className="text-xs text-ink/50">
                Monthly spending limits versus actual recorded expenses
              </p>
            </div>
            <Link
              href="/settings"
              className="text-xs font-bold text-forest hover:underline focus-visible:ring-2 focus-visible:ring-forest rounded"
            >
              Adjust Limits
            </Link>
          </div>

          {categoryBudgets.length === 0 ? (
            <div className="p-6 bg-paper border border-dashed border-line rounded-xl text-center space-y-3">
              <p className="text-xs text-ink/70 font-medium max-w-sm mx-auto">
                Set a monthly spending limit for any category and we&apos;ll track your progress here automatically.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest text-white rounded-lg text-xs font-bold hover:bg-forest/90 transition-colors shadow-2xs"
              >
                <span>Set My First Budget</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryBudgets.map(({ category, limit, spent, percent, isOver }) => {
                const Icon = getCategoryIcon(category.icon);
                return (
                  <div key={category.id} className="space-y-1.5">
                    {/* Category Label and Figures */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: category.color || '#2F5D50' }}
                        />
                        <span className="font-semibold text-ink truncate">{category.name}</span>
                      </div>
                      <div className="tabular text-xs shrink-0 pl-2">
                        <span className={`font-bold ${isOver ? 'text-rust' : 'text-ink'}`}>
                          {formatCurrency(spent, currency)}
                        </span>
                        {limit > 0 && (
                          <span className="text-ink/40 font-normal">
                            {' '}/ {formatCurrency(limit, currency)}
                          </span>
                        )}
                        {limit > 0 && (
                          <span
                            className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isOver
                                ? 'bg-rust/10 text-rust'
                                : 'bg-forest/10 text-forest'
                            }`}
                          >
                            {percent}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thin horizontal bar */}
                    <div className="h-1.5 w-full bg-line rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rust' : 'bg-forest'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {limit > 0 && (
                      <div className="flex justify-end text-[10px] text-ink/40 font-medium">
                        {isOver ? (
                          <span className="text-rust font-semibold">
                            Over limit by {formatCurrency(spent - limit, currency)}
                          </span>
                        ) : (
                          <span>
                            {formatCurrency(limit - spent, currency)} remaining
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Sidebar: Recent Activity or Empty State */}
        <section className="bg-surface border border-line rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-ink">Recent Activity</h2>
              <Link
                href="/transactions"
                className="text-xs font-bold text-forest hover:underline inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              /* Explicit Empty State for new users */
              <div className="p-6 bg-paper border border-dashed border-line rounded-xl text-center space-y-3 my-4">
                <div className="w-10 h-10 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">No transactions yet</p>
                  <p className="text-xs text-ink/60 mt-1">
                    Add your first expense or load sample data to see balance figures and budget tracking.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => openAddModal()}
                    className="w-full py-2 px-3 bg-forest text-white rounded-lg text-xs font-bold hover:bg-forest/90 transition-colors cursor-pointer"
                  >
                    Add First Transaction
                  </button>
                  <button
                    onClick={seedSampleData}
                    className="w-full py-2 px-3 bg-surface border border-line rounded-lg text-xs font-semibold text-ink/70 hover:text-ink transition-colors cursor-pointer"
                  >
                    Load Realistic Demo Data
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {recentTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const Icon = getCategoryIcon(cat?.icon);
                  const isExpense = tx.amount < 0;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => openEditModal(tx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openEditModal(tx);
                      }}
                      className="py-3 flex items-center justify-between group hover:bg-paper/50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-forest"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: cat?.color ? `${cat.color}20` : '#2F5D5015',
                            color: cat?.color || '#2F5D50',
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-ink truncate group-hover:text-forest transition-colors">
                            {tx.merchant_name || cat?.name || 'Transaction'}
                          </p>
                          <p className="text-[11px] text-ink/40 truncate">
                            {cat?.name || 'Uncategorized'} &middot; {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold tabular shrink-0 pl-2 ${
                          isExpense ? 'text-rust' : 'text-forest'
                        }`}
                      >
                        {formatCurrency(tx.amount, currency, true)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {recentTransactions.length > 0 && (
            <div className="pt-3 border-t border-line text-center">
              <Link
                href="/transactions"
                className="w-full py-2 bg-paper border border-line rounded-lg text-xs font-bold text-ink/70 hover:text-forest hover:border-forest transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
