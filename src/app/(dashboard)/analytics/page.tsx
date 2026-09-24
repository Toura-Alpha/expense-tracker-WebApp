'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  PieChart,
  Plus,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { useData } from '@/lib/db/useRxData';
import { formatCurrency, getCategoryIcon, getCurrencySymbol } from '@/lib/formatters';

export default function AnalyticsPage() {
  const {
    transactions,
    categories,
    currency,
    isLoading,
    error,
    openAddModal,
    seedSampleData,
  } = useData();

  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
  const [timePeriod, setTimePeriod] = useState<'all' | 'this_month' | 'last_90_days' | 'this_year'>('all');
  const [breakdownType, setBreakdownType] = useState<'expense' | 'income'>('expense');

  // Filter transactions matching active breakdownType and timePeriod
  const filteredBreakdownTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (breakdownType === 'expense' && t.amount >= 0) return false;
      if (breakdownType === 'income' && t.amount <= 0) return false;
      if (timePeriod === 'all') return true;
      const txDate = new Date(t.date);
      const now = new Date();
      if (timePeriod === 'this_month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (timePeriod === 'last_90_days') {
        const ninetyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        return txDate >= ninetyDaysAgo;
      }
      if (timePeriod === 'this_year') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, breakdownType, timePeriod]);

  // Compute category breakdown ranked by amount
  const { categoryRankedList, totalBreakdownAmount } = useMemo(() => {
    const spendByCat: Record<string, number> = {};
    let total = 0;

    for (const tx of filteredBreakdownTransactions) {
      const absAmount = Math.abs(tx.amount);
      total += absAmount;
      const catId = tx.category_id || 'uncategorized';
      spendByCat[catId] = (spendByCat[catId] || 0) + absAmount;
    }

    const list = Object.entries(spendByCat)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId) || {
          id: catId,
          name: 'Uncategorized',
          icon: 'Tag',
          color: '#6B7280',
          is_income: false,
          _deleted: false,
          user_id: 'default',
          updated_at: '',
        };
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return {
          category: cat,
          amount,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      categoryRankedList: list,
      totalBreakdownAmount: total,
    };
  }, [filteredBreakdownTransactions, categories]);

  // Compute 6-month historical trend
  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString(undefined, { month: 'short' }),
        income: 0,
        expense: 0,
      });
    }

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();

      const targetMonth = months.find((m) => m.year === txYear && m.month === txMonth);
      if (targetMonth) {
        if (tx.amount > 0) {
          targetMonth.income += tx.amount;
        } else {
          targetMonth.expense += Math.abs(tx.amount);
        }
      }
    }

    return months;
  }, [transactions]);

  // Calculate SVG trend line coordinates
  const svgMetrics = useMemo(() => {
    const width = 600;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 35, left: 50 };

    const maxVal = Math.max(
      ...trendData.map((d) => Math.max(d.income, d.expense)),
      100
    );

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const getX = (index: number) =>
      padding.left + (index / (trendData.length - 1 || 1)) * chartWidth;

    const getY = (val: number) =>
      padding.top + chartHeight - (val / maxVal) * chartHeight;

    const incomePoints = trendData.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ');
    const expensePoints = trendData.map((d, i) => `${getX(i)},${getY(d.expense)}`).join(' ');

    return {
      width,
      height,
      padding,
      maxVal,
      getX,
      getY,
      incomePoints,
      expensePoints,
    };
  }, [trendData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-surface border border-line rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-surface border border-line rounded-2xl" />
          <div className="h-64 bg-surface border border-line rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div className="p-6 bg-surface border border-rust/30 rounded-2xl space-y-3 text-center">
          <AlertCircle className="w-8 h-8 text-rust mx-auto" />
          <h2 className="text-base font-bold text-ink">Failed to compile analytics</h2>
          <p className="text-xs text-ink/70">{error.message}</p>
        </div>
      </div>
    );
  }

  // Explicit empty state for new users
  if (transactions.length === 0 || filteredBreakdownTransactions.length === 0) {
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Analytics & Trends</h1>
          <p className="text-xs text-ink/50">
            Real-time visual spending breakdown and month-over-month trajectory
          </p>
        </div>

        {/* Required explicit empty state with CTA button */}
        <div className="p-12 bg-surface border border-dashed border-line rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xs">
          <div className="w-14 h-14 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
            <PieChart className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">
              Add your first transaction to see trends here
            </h2>
            <p className="text-xs text-ink/60 mt-1.5 max-w-xs mx-auto">
              Once you record transactions, this dashboard displays ranked category allocations and historical spending curves.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => openAddModal()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-bold hover:bg-forest/90 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
            <button
              onClick={seedSampleData}
              className="px-5 py-2.5 bg-paper border border-line rounded-xl text-xs font-semibold text-ink/70 hover:text-ink transition-colors cursor-pointer"
            >
              Load Demo Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header Navigation */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Analytics & Trends</h1>
            <p className="text-xs text-ink/50">
              Spending distribution ranked by category and 6-month historical curve
            </p>
          </div>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest text-white rounded-xl text-xs font-bold hover:bg-forest/90 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>

        {/* Period Picker */}
        <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-line/60 overflow-x-auto">
          <Calendar className="w-3.5 h-3.5 text-ink/40 shrink-0 mr-1" />
          {[
            { id: 'all', label: 'All Time' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_90_days', label: 'Last 90 Days' },
            { id: 'this_year', label: 'This Year' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTimePeriod(item.id as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                timePeriod === item.id
                  ? 'bg-forest text-white shadow-2xs font-bold'
                  : 'bg-surface border border-line text-ink/70 hover:text-ink hover:bg-paper'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-surface border border-line rounded-2xl shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
            Total Recorded {breakdownType === 'expense' ? 'Outflows' : 'Inflows'}
          </p>
          <p
            className={`text-2xl font-bold tabular mt-1 ${
              breakdownType === 'expense' ? 'text-rust' : 'text-forest'
            }`}
          >
            {formatCurrency(totalBreakdownAmount, currency)}
          </p>
          <p className="text-[11px] text-ink/50 mt-1">
            Across {filteredBreakdownTransactions.length} total{' '}
            {breakdownType === 'expense' ? 'expense' : 'income'} items
          </p>
        </div>

        <div className="p-5 bg-surface border border-line rounded-2xl shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
            Top Outflow Category
          </p>
          <p className="text-2xl font-bold text-ink truncate mt-1">
            {categoryRankedList[0]?.category.name || 'None'}
          </p>
          <p className="text-[11px] text-ink/50 mt-1">
            {categoryRankedList[0]
              ? `${categoryRankedList[0].percentage.toFixed(1)}% of total outflows`
              : 'N/A'}
          </p>
        </div>

        <div className="p-5 bg-surface border border-line rounded-2xl shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
            Active Categories
          </p>
          <p className="text-2xl font-bold text-forest tabular mt-1">
            {categoryRankedList.length}
          </p>
          <p className="text-[11px] text-ink/50 mt-1">
            Categories with recorded spending
          </p>
        </div>
      </div>

      {/* Month-over-Month Trend Line (Pure SVG Line Chart with Tooltips) */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight">
              Month-over-Month Trajectory
            </h2>
            <p className="text-xs text-ink/50">
              6-month historical income versus spending progression
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-forest rounded-full" />
              <span className="text-ink/70">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-rust rounded-full" />
              <span className="text-ink/70">Expenses</span>
            </div>
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="relative w-full overflow-hidden pt-2">
          <svg
            viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
            className="w-full h-56 text-ink/40 overflow-visible"
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y =
                svgMetrics.padding.top +
                (svgMetrics.height -
                  svgMetrics.padding.top -
                  svgMetrics.padding.bottom) *
                  (1 - ratio);
              const labelVal = Math.round(svgMetrics.maxVal * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={svgMetrics.padding.left}
                    y1={y}
                    x2={svgMetrics.width - svgMetrics.padding.right}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={0.15}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={svgMetrics.padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-current font-mono"
                  >
                    {getCurrencySymbol(currency)}{labelVal}
                  </text>
                </g>
              );
            })}

            {/* Income Trend Line (Green) */}
            <polyline
              fill="none"
              stroke="#2F5D50"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgMetrics.incomePoints}
            />

            {/* Expense Trend Line (Rust) */}
            <polyline
              fill="none"
              stroke="#B4472C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgMetrics.expensePoints}
            />

            {/* Data points & Interactive Hover/Focus Triggers */}
            {trendData.map((d, i) => {
              const x = svgMetrics.getX(i);
              const incomeY = svgMetrics.getY(d.income);
              const expenseY = svgMetrics.getY(d.expense);
              const isHovered = activeTooltipIndex === i;

              return (
                <g key={d.label}>
                  {/* Month Label */}
                  <text
                    x={x}
                    y={svgMetrics.height - 10}
                    textAnchor="middle"
                    className="text-[11px] font-semibold fill-ink/60"
                  >
                    {d.label}
                  </text>

                  {/* Income point */}
                  <circle
                    cx={x}
                    cy={incomeY}
                    r={isHovered ? 5 : 3.5}
                    fill="#2F5D50"
                    className="transition-all"
                  />

                  {/* Expense point */}
                  <circle
                    cx={x}
                    cy={expenseY}
                    r={isHovered ? 5 : 3.5}
                    fill="#B4472C"
                    className="transition-all"
                  />

                  {/* Vertical hover indicator line */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={svgMetrics.padding.top}
                      x2={x}
                      y2={svgMetrics.height - svgMetrics.padding.bottom}
                      stroke="#1B1F23"
                      strokeOpacity={0.25}
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Transparent hover/touch capture rect */}
                  <rect
                    x={x - 30}
                    y={svgMetrics.padding.top}
                    width={60}
                    height={svgMetrics.height - svgMetrics.padding.top - svgMetrics.padding.bottom}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveTooltipIndex(i)}
                    onMouseLeave={() => setActiveTooltipIndex(null)}
                    onTouchStart={() => setActiveTooltipIndex(i)}
                    onClick={() => setActiveTooltipIndex(activeTooltipIndex === i ? null : i)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Dynamic Floating Tooltip */}
          {activeTooltipIndex !== null && trendData[activeTooltipIndex] && (
            <div className="mt-3 p-3 bg-paper border border-line rounded-xl flex items-center justify-between text-xs max-w-sm mx-auto shadow-2xs">
              <span className="font-bold text-ink">
                {trendData[activeTooltipIndex].label} Summary:
              </span>
              <div className="flex items-center gap-4">
                <span className="text-forest font-bold tabular">
                  +{formatCurrency(trendData[activeTooltipIndex].income, currency)}
                </span>
                <span className="text-rust font-bold tabular">
                  -{formatCurrency(trendData[activeTooltipIndex].expense, currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Category Breakdown (Simple horizontal bar list ranked by spend, NOT a pie chart) */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight">
              Category Breakdown ({breakdownType === 'expense' ? 'Outflows' : 'Inflows'})
            </h2>
            <p className="text-xs text-ink/50">
              Ranked list by volume with exact valuations. Click any row to view ledger entries.
            </p>
          </div>

          {/* Breakdown Type Toggle */}
          <div className="flex border border-line rounded-lg p-0.5 bg-paper shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBreakdownType('expense')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                breakdownType === 'expense'
                  ? 'bg-surface text-rust shadow-2xs'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => setBreakdownType('income')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                breakdownType === 'income'
                  ? 'bg-surface text-forest shadow-2xs'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {categoryRankedList.map(({ category, amount, percentage }) => {
            const Icon = getCategoryIcon(category.icon);
            return (
              <Link
                key={category.id}
                href="/transactions"
                className="block space-y-1.5 group p-2 -mx-2 rounded-xl hover:bg-paper/60 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: category.color ? `${category.color}15` : '#2F5D5015',
                        color: category.color || '#2F5D50',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-ink group-hover:text-forest transition-colors truncate">
                      {category.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 tabular shrink-0 pl-2">
                    <span
                      className={`font-bold ${
                        breakdownType === 'expense' ? 'text-rust' : 'text-forest'
                      }`}
                    >
                      {formatCurrency(amount, currency)}
                    </span>
                    <span className="text-xs text-ink/50 font-medium w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Proportional horizontal bar */}
                <div className="h-2 w-full bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(percentage, 1)}%`,
                      backgroundColor:
                        category.color || (breakdownType === 'expense' ? '#B4472C' : '#2F5D50'),
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
