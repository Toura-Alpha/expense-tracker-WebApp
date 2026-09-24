'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  Receipt,
  Calendar,
  X,
  ChevronDown,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import { useData } from '@/lib/db/useRxData';
import { formatCurrency, formatDayLabel, getCategoryIcon } from '@/lib/formatters';
import type { TransactionDocType } from '@/lib/db/schemas';

const PAGE_SIZE = 25;

export default function TransactionsPage() {
  const {
    transactions,
    categories,
    currency,
    isLoading,
    error,
    openAddModal,
    openEditModal,
    deleteTransaction,
    seedSampleData,
  } = useData();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_30_days' | 'this_year'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  // Undo delete state
  const [pendingDeleteTx, setPendingDeleteTx] = useState<TransactionDocType | null>(null);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInitiateDelete = (tx: TransactionDocType) => {
    if (pendingDeleteTx) {
      deleteTransaction(pendingDeleteTx.id);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    }

    setPendingDeleteTx(tx);
    deleteTimerRef.current = setTimeout(() => {
      deleteTransaction(tx.id);
      setPendingDeleteTx(null);
    }, 4000);
  };

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setPendingDeleteTx(null);
  };

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // CSV Export handler
  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Merchant/Title', 'Category', 'Amount', 'Currency', 'Type', 'Note'];
    const rows = filteredTransactions.map((tx) => {
      const cat = categories.find((c) => c.id === tx.category_id);
      return [
        tx.date ? tx.date.split('T')[0] : '',
        `"${(tx.merchant_name || '').replace(/"/g, '""')}"`,
        `"${(cat?.name || 'Uncategorized').replace(/"/g, '""')}"`,
        tx.amount,
        tx.currency,
        tx.amount < 0 ? 'Expense' : 'Income',
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort transactions
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((tx) => {
      // Exclude pending delete transaction
      if (pendingDeleteTx && tx.id === pendingDeleteTx.id) return false;
      // 1. Search query (merchant or note)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const merchantMatch = tx.merchant_name?.toLowerCase().includes(query);
        const noteMatch = tx.note?.toLowerCase().includes(query);
        if (!merchantMatch && !noteMatch) return false;
      }

      // 2. Type filter
      if (typeFilter === 'expense' && tx.amount >= 0) return false;
      if (typeFilter === 'income' && tx.amount <= 0) return false;

      // 3. Category multi-select filter
      if (selectedCategoryIds.length > 0) {
        if (!tx.category_id || !selectedCategoryIds.includes(tx.category_id)) {
          return false;
        }
      }

      // 4. Date range filter
      if (dateRange !== 'all') {
        const txDate = new Date(tx.date);
        const now = new Date();
        if (dateRange === 'this_month') {
          if (
            txDate.getMonth() !== now.getMonth() ||
            txDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (dateRange === 'last_30_days') {
          const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
          if (txDate < thirtyDaysAgo) return false;
        } else if (dateRange === 'this_year') {
          if (txDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return Math.abs(b.amount) - Math.abs(a.amount);
      if (sortBy === 'amount_asc') return Math.abs(a.amount) - Math.abs(b.amount);
      return 0;
    });
  }, [transactions, searchQuery, typeFilter, selectedCategoryIds, dateRange, sortBy, pendingDeleteTx]);

  // Group by day for the hairline-divided list with sticky date label
  const groupedTransactions = useMemo(() => {
    const paginated = filteredTransactions.slice(0, visibleCount);
    const groups: { dateKey: string; label: string; items: TransactionDocType[] }[] = [];

    for (const tx of paginated) {
      const dateKey = tx.date ? tx.date.split('T')[0] : 'undated';
      let existing = groups.find((g) => g.dateKey === dateKey);
      if (!existing) {
        existing = {
          dateKey,
          label: formatDayLabel(tx.date),
          items: [],
        };
        groups.push(existing);
      }
      existing.items.push(tx);
    }

    return groups;
  }, [filteredTransactions, visibleCount]);

  const toggleCategorySelection = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryIds([]);
    setDateRange('all');
    setTypeFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategoryIds.length > 0 ||
    dateRange !== 'all' ||
    typeFilter !== 'all';

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-[640px] mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-surface border border-line rounded w-48" />
        <div className="h-12 bg-surface border border-line rounded-xl w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-surface border border-line rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 lg:p-8 max-w-[640px] mx-auto">
        <div className="p-6 bg-surface border border-rust/30 rounded-2xl space-y-3 text-center">
          <AlertCircle className="w-8 h-8 text-rust mx-auto" />
          <h2 className="text-base font-bold text-ink">Unable to query local transactions</h2>
          <p className="text-xs text-ink/70">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-full">
      {/* Maximum 640px reading width as required */}
      <div className="max-w-[640px] mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Ledger</h1>
            <p className="text-xs text-ink/50">
              {filteredTransactions.length}{' '}
              {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCSV}
              disabled={filteredTransactions.length === 0}
              title="Export filtered transactions as CSV"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-paper border border-line rounded-xl text-xs font-semibold text-ink/70 hover:text-ink hover:border-forest transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest text-white rounded-xl text-xs font-bold hover:bg-forest/90 transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-forest"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-2xs space-y-3">
          {/* Search input and type toggle */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant or notes..."
                className="w-full pl-9 pr-8 py-2 bg-paper border border-line rounded-lg text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-2.5 text-ink/40 hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="flex border border-line rounded-lg p-0.5 bg-paper shrink-0">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('expense')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'expense'
                    ? 'bg-surface text-rust shadow-2xs'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                Expenses
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('income')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'income'
                    ? 'bg-surface text-forest shadow-2xs'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Date range & Category toggle controls */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <Calendar className="w-3.5 h-3.5 text-ink/40 shrink-0 mr-1" />
              {[
                { id: 'all', label: 'All Time' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_30_days', label: '30 Days' },
                { id: 'this_year', label: 'This Year' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDateRange(item.id as any)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                    dateRange === item.id
                      ? 'bg-forest/15 text-forest font-bold'
                      : 'text-ink/60 hover:text-ink hover:bg-paper'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-ink/40" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort transactions"
                  className="bg-transparent text-xs font-semibold text-ink/70 hover:text-ink cursor-pointer focus:outline-none"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="amount_desc">Highest Amount</option>
                  <option value="amount_asc">Lowest Amount</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategoryIds.length > 0 || showCategoryFilter
                    ? 'bg-forest/10 text-forest'
                    : 'text-ink/60 hover:text-ink hover:bg-paper'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Categories</span>
                {selectedCategoryIds.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-forest text-white text-[10px] flex items-center justify-center font-bold">
                    {selectedCategoryIds.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showCategoryFilter ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-rust hover:underline font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Category multi-select filter tags */}
          {showCategoryFilter && (
            <div className="pt-2 border-t border-line/60 flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategorySelection(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-forest text-white border-forest'
                        : 'bg-paper text-ink/70 border-line hover:border-ink/30'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isSelected ? '#ffffff' : cat.color || '#2F5D50' }}
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 bg-surface border border-line rounded-2xl text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                {hasActiveFilters ? 'No transactions match filters' : 'No transactions recorded'}
              </h2>
              <p className="text-xs text-ink/60 mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Try clearing or widening your search query, date range, or category filters.'
                  : 'Get started by creating your first entry or loading realistic sample data.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-paper border border-line text-xs font-bold rounded-lg hover:bg-line/50 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openAddModal()}
                    className="px-4 py-2 bg-forest text-white text-xs font-bold rounded-lg hover:bg-forest/90 transition-colors cursor-pointer"
                  >
                    Add Transaction
                  </button>
                  <button
                    onClick={seedSampleData}
                    className="px-4 py-2 bg-paper border border-line text-xs font-semibold text-ink/70 hover:text-ink transition-colors cursor-pointer"
                  >
                    Load Sample Data
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Hairline-divided list grouped by day with sticky date labels */
          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs">
            {groupedTransactions.map((group) => (
              <div key={group.dateKey} className="group-day">
                {/* Sticky Date Label */}
                <div className="sticky top-16 lg:top-20 z-10 px-4 py-2 bg-paper/95 backdrop-blur-xs border-b border-line text-xs font-bold text-ink/60 uppercase tracking-wider flex items-center justify-between">
                  <span>{group.label}</span>
                  <span className="text-[11px] font-medium text-ink/40 lowercase">
                    {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Hairline-divided transaction rows */}
                <div>
                  {group.items.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.category_id);
                    const Icon = getCategoryIcon(cat?.icon);
                    const isExpense = tx.amount < 0;

                    return (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        category={cat}
                        Icon={Icon}
                        isExpense={isExpense}
                        currency={currency}
                        onEdit={() => openEditModal(tx)}
                        onDelete={() => handleInitiateDelete(tx)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pagination Load More Button */}
            {filteredTransactions.length > visibleCount && (
              <div className="p-4 border-t border-line text-center bg-paper/30">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-4 py-2 bg-surface border border-line rounded-lg text-xs font-bold text-ink/80 hover:text-ink hover:border-forest transition-colors cursor-pointer"
                >
                  Load More ({filteredTransactions.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating Undo Toast Notification */}
        {pendingDeleteTx && (
          <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-surface border border-line text-ink rounded-xl shadow-xl flex items-center gap-4 text-xs font-semibold animate-fade-in">
            <span>Transaction deleted</span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="px-3 py-1 bg-forest text-white rounded-lg text-xs font-bold hover:bg-forest/90 transition-colors cursor-pointer"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Single transaction row with mobile swipe-to-delete and desktop hover-delete
interface TransactionRowProps {
  transaction: TransactionDocType;
  category: any;
  Icon: React.ComponentType<{ className?: string }>;
  isExpense: boolean;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}

function TransactionRow({
  transaction,
  category,
  Icon,
  isExpense,
  currency,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="relative border-b border-line overflow-hidden group bg-surface select-none">
      {/* Background red delete container visible during mobile swipe */}
      <div
        className="absolute inset-y-0 right-0 w-24 bg-rust text-white flex items-center justify-center font-bold text-xs cursor-pointer z-0"
        onClick={handleDelete}
      >
        <Trash2 className="w-4 h-4" />
        <span className="ml-1">Delete</span>
      </div>

      {/* Swipeable foreground row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -96, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            setSwipeOffset(-96);
          } else {
            setSwipeOffset(0);
          }
        }}
        animate={{ x: swipeOffset }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={onEdit}
        className="relative z-10 px-4 py-3.5 bg-surface hover:bg-paper/60 transition-colors flex items-center justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-forest"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
          {/* Category Icon and Color Badge */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
            style={{
              backgroundColor: category?.color ? `${category.color}15` : '#2F5D5015',
              color: category?.color || '#2F5D50',
            }}
          >
            <Icon className="w-4 h-4" />
          </div>

          {/* Merchant Name & Note */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink truncate group-hover:text-forest transition-colors">
              {transaction.merchant_name || category?.name || 'Untitled Transaction'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-ink/50 truncate mt-0.5">
              {transaction.merchant_name ? (
                <>
                  <span>{category?.name || 'Uncategorized'}</span>
                  {transaction.note && (
                    <>
                      <span>&middot;</span>
                      <span className="truncate">{transaction.note}</span>
                    </>
                  )}
                </>
              ) : (
                <span className="truncate">{transaction.note || 'Recorded entry'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Amount & Desktop Hover Delete */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-sm font-bold tabular ${
              isExpense ? 'text-rust' : 'text-forest'
            }`}
          >
            {formatCurrency(transaction.amount, currency, true)}
          </span>

          {/* Desktop Hover Delete Button */}
          <button
            onClick={handleDelete}
            aria-label="Delete transaction"
            title="Delete transaction"
            className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 p-1.5 text-ink/40 hover:text-rust hover:bg-paper rounded-lg transition-all cursor-pointer focus:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
