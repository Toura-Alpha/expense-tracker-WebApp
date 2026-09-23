'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getDatabase, type AppRxDatabase } from '@/lib/db';
import { useOfflineMutation } from '@/features/transactions/hooks/useOfflineMutation';
import type { TransactionDocType, CategoryDocType, BudgetDocType } from '@/lib/db/schemas';
import { syncEngine } from '@/lib/db/sync';

export interface CategoryWithStats extends CategoryDocType {
  spent?: number;
  budgetLimit?: number;
}

interface DataContextType {
  transactions: TransactionDocType[];
  categories: CategoryDocType[];
  budgets: BudgetDocType[];
  currency: string;
  setCurrency: (c: string) => void;
  isLoading: boolean;
  error: Error | null;
  // Transaction mutations
  createTransaction: ReturnType<typeof useOfflineMutation>['createTransaction'];
  updateTransaction: ReturnType<typeof useOfflineMutation>['updateTransaction'];
  deleteTransaction: ReturnType<typeof useOfflineMutation>['deleteTransaction'];
  // Category mutations
  addCategory: (cat: Omit<CategoryDocType, 'id' | 'updated_at' | '_deleted' | 'deleted_at' | 'user_id'>) => Promise<CategoryDocType>;
  updateCategory: (id: string, patch: Partial<CategoryDocType>) => Promise<void>;
  archiveCategory: (id: string) => Promise<void>;
  // Budget mutations
  setCategoryBudget: (categoryId: string, monthlyLimit: number) => Promise<void>;
  // Seed sample data
  seedSampleData: () => Promise<void>;
  // Modal state
  isModalOpen: boolean;
  editingTransaction: TransactionDocType | null;
  openAddModal: (prefill?: Partial<TransactionDocType>) => void;
  openEditModal: (tx: TransactionDocType) => void;
  closeModal: () => void;
  prefillData: Partial<TransactionDocType> | null;
}

const DataContext = createContext<DataContextType | null>(null);

const DEFAULT_CATEGORIES: Array<Omit<CategoryDocType, 'id' | 'user_id' | 'updated_at' | '_deleted' | 'deleted_at'>> = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#B4472C', is_income: false },
  { name: 'Groceries', icon: 'ShoppingBag', color: '#D97706', is_income: false },
  { name: 'Transport', icon: 'Car', color: '#2563EB', is_income: false },
  { name: 'Housing & Rent', icon: 'Home', color: '#4B5563', is_income: false },
  { name: 'Utilities', icon: 'Zap', color: '#7C3AED', is_income: false },
  { name: 'Entertainment', icon: 'Film', color: '#DB2777', is_income: false },
  { name: 'Healthcare', icon: 'HeartPulse', color: '#DC2626', is_income: false },
  { name: 'Salary', icon: 'Briefcase', color: '#2F5D50', is_income: true },
  { name: 'Freelance & Invoices', icon: 'TrendingUp', color: '#059669', is_income: true },
  { name: 'Investments', icon: 'Coins', color: '#10B981', is_income: true },
  { name: 'Other Expenses', icon: 'Tag', color: '#6B7280', is_income: false },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AppRxDatabase | null>(null);
  const [transactions, setTransactions] = useState<TransactionDocType[]>([]);
  const [categories, setCategories] = useState<CategoryDocType[]>([]);
  const [budgets, setBudgets] = useState<BudgetDocType[]>([]);
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('expense_tracker_currency') || 'USD';
    }
    return 'USD';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDocType | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<TransactionDocType> | null>(null);

  const { createTransaction, updateTransaction, deleteTransaction } = useOfflineMutation();

  const setCurrency = useCallback((curr: string) => {
    setCurrencyState(curr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('expense_tracker_currency', curr);
    }
  }, []);

  // Initialize DB and subscribe to collections
  useEffect(() => {
    let isMounted = true;
    let txSub: any = null;
    let catSub: any = null;
    let budSub: any = null;

    async function init() {
      try {
        setIsLoading(true);
        const database = await getDatabase();
        if (!database || !isMounted) return;

        setDb(database);
        await syncEngine.initialize(database);

        // Check if categories collection needs initial default seeds
        const existingCats = await database.categories.find().exec();
        if (existingCats.length === 0) {
          const now = new Date().toISOString();
          for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
            const def = DEFAULT_CATEGORIES[i];
            const catId = `cat_default_${i + 1}`;
            await database.categories.insert({
              id: catId,
              user_id: 'default_user',
              name: def.name,
              icon: def.icon,
              color: def.color,
              is_income: def.is_income,
              updated_at: now,
              deleted_at: null,
              _deleted: false,
            });

            // Seed default budget for common expense categories
            if (def.name === 'Food & Dining') {
              await database.budgets.insert({
                id: `bgt_default_food`,
                user_id: 'default_user',
                category_id: catId,
                amount_limit: 450,
                period: 'monthly',
                start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                end_date: null,
                updated_at: now,
                deleted_at: null,
                _deleted: false,
              });
            } else if (def.name === 'Groceries') {
              await database.budgets.insert({
                id: `bgt_default_groc`,
                user_id: 'default_user',
                category_id: catId,
                amount_limit: 600,
                period: 'monthly',
                start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                end_date: null,
                updated_at: now,
                deleted_at: null,
                _deleted: false,
              });
            } else if (def.name === 'Transport') {
              await database.budgets.insert({
                id: `bgt_default_trans`,
                user_id: 'default_user',
                category_id: catId,
                amount_limit: 200,
                period: 'monthly',
                start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                end_date: null,
                updated_at: now,
                deleted_at: null,
                _deleted: false,
              });
            }
          }
        }

        // 1. Reactive subscription for Transactions
        txSub = database.transactions.find().$.subscribe((docs) => {
          if (!isMounted) return;
          const activeDocs = docs
            .map((d) => d.toJSON() as TransactionDocType)
            .filter((d) => !d._deleted && !d.deleted_at);
          // Sort by date descending
          activeDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(activeDocs);
        });

        // 2. Reactive subscription for Categories
        catSub = database.categories.find().$.subscribe((docs) => {
          if (!isMounted) return;
          const activeCats = docs
            .map((d) => d.toJSON() as CategoryDocType)
            .filter((d) => !d._deleted && !d.deleted_at);
          setCategories(activeCats);
        });

        // 3. Reactive subscription for Budgets
        budSub = database.budgets.find().$.subscribe((docs) => {
          if (!isMounted) return;
          const activeBuds = docs
            .map((d) => d.toJSON() as BudgetDocType)
            .filter((d) => !d._deleted && !d.deleted_at);
          setBudgets(activeBuds);
        });

        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to init RxDB context:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (txSub) txSub.unsubscribe();
      if (catSub) catSub.unsubscribe();
      if (budSub) budSub.unsubscribe();
    };
  }, []);

  // Category mutations
  const addCategory = useCallback(
    async (cat: Omit<CategoryDocType, 'id' | 'updated_at' | '_deleted' | 'deleted_at' | 'user_id'>) => {
      const database = db || (await getDatabase());
      if (!database) throw new Error('Database unavailable');

      const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const doc: CategoryDocType = {
        id,
        user_id: 'current_user',
        name: cat.name,
        icon: cat.icon || 'Tag',
        color: cat.color || '#2F5D50',
        is_income: Boolean(cat.is_income),
        updated_at: now,
        deleted_at: null,
        _deleted: false,
      };

      const inserted = await database.categories.insert(doc);
      syncEngine.triggerSync().catch(() => {});
      return inserted.toJSON() as CategoryDocType;
    },
    [db]
  );

  const updateCategory = useCallback(
    async (id: string, patch: Partial<CategoryDocType>) => {
      const database = db || (await getDatabase());
      if (!database) throw new Error('Database unavailable');

      const doc = await database.categories.findOne(id).exec();
      if (doc) {
        await doc.patch({
          ...patch,
          updated_at: new Date().toISOString(),
        });
        syncEngine.triggerSync().catch(() => {});
      }
    },
    [db]
  );

  const archiveCategory = useCallback(
    async (id: string) => {
      const database = db || (await getDatabase());
      if (!database) throw new Error('Database unavailable');

      const doc = await database.categories.findOne(id).exec();
      if (doc) {
        const now = new Date().toISOString();
        await doc.patch({
          _deleted: true,
          deleted_at: now,
          updated_at: now,
        });
        syncEngine.triggerSync().catch(() => {});
      }
    },
    [db]
  );

  // Budget mutations
  const setCategoryBudget = useCallback(
    async (categoryId: string, monthlyLimit: number) => {
      const database = db || (await getDatabase());
      if (!database) throw new Error('Database unavailable');

      const existing = await database.budgets
        .findOne({
          selector: { category_id: categoryId },
        })
        .exec();

      const now = new Date().toISOString();
      if (existing) {
        await existing.patch({
          amount_limit: monthlyLimit,
          _deleted: false,
          deleted_at: null,
          updated_at: now,
        });
      } else {
        await database.budgets.insert({
          id: `bgt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: 'current_user',
          category_id: categoryId,
          amount_limit: monthlyLimit,
          period: 'monthly',
          start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          end_date: null,
          updated_at: now,
          deleted_at: null,
          _deleted: false,
        });
      }
      syncEngine.triggerSync().catch(() => {});
    },
    [db]
  );

  // Seed sample transactions if user wants to populate realistic test data
  const seedSampleData = useCallback(async () => {
    const database = db || (await getDatabase());
    if (!database) throw new Error('Database unavailable');

    const foodCat = categories.find((c) => c.name.toLowerCase().includes('food'))?.id || null;
    const grocCat = categories.find((c) => c.name.toLowerCase().includes('grocer'))?.id || null;
    const transCat = categories.find((c) => c.name.toLowerCase().includes('transport'))?.id || null;
    const rentCat = categories.find((c) => c.name.toLowerCase().includes('housing') || c.name.toLowerCase().includes('rent'))?.id || null;
    const salaryCat = categories.find((c) => c.name.toLowerCase().includes('salary'))?.id || null;
    const invCat = categories.find((c) => c.name.toLowerCase().includes('freelance'))?.id || null;

    const sampleTxs = [
      {
        merchant_name: 'Tech Corp Payroll',
        amount: 4850.0,
        currency,
        category_id: salaryCat,
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        note: 'Bi-weekly direct deposit',
        is_recurring: true,
      },
      {
        merchant_name: 'Metro Transit Monthly Pass',
        amount: -85.0,
        currency,
        category_id: transCat,
        date: new Date(Date.now() - 1 * 86400000).toISOString(),
        note: 'Subway & bus card renewal',
        is_recurring: true,
      },
      {
        merchant_name: 'Trader Joe’s Market',
        amount: -124.6,
        currency,
        category_id: grocCat,
        date: new Date(Date.now() - 3 * 3600000).toISOString(),
        note: 'Weekly fresh produce & essentials',
        is_recurring: false,
      },
      {
        merchant_name: 'Blue Bottle Coffee',
        amount: -16.5,
        currency,
        category_id: foodCat,
        date: new Date(Date.now() - 5 * 3600000).toISOString(),
        note: 'Coffee & pastry meeting',
        is_recurring: false,
      },
      {
        merchant_name: 'City Lights Books & Cafe',
        amount: -42.2,
        currency,
        category_id: foodCat,
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        note: 'Paperback book and tea',
        is_recurring: false,
      },
      {
        merchant_name: 'Apartment Lease',
        amount: -1850.0,
        currency,
        category_id: rentCat,
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        note: 'Monthly rental fee',
        is_recurring: true,
      },
      {
        merchant_name: 'Design Client Retainer',
        amount: 1400.0,
        currency,
        category_id: invCat,
        date: new Date(Date.now() - 5 * 86400000).toISOString(),
        note: 'UI design consulting milestone',
        is_recurring: false,
      },
    ];

    for (const item of sampleTxs) {
      await createTransaction({
        ...item,
        is_recurring: Boolean(item.is_recurring),
      });
    }
  }, [db, categories, currency, createTransaction]);

  const openAddModal = useCallback((prefill?: Partial<TransactionDocType>) => {
    setEditingTransaction(null);
    setPrefillData(prefill || null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((tx: TransactionDocType) => {
    setEditingTransaction(tx);
    setPrefillData(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setPrefillData(null);
  }, []);

  const value = useMemo(
    () => ({
      transactions,
      categories,
      budgets,
      currency,
      setCurrency,
      isLoading,
      error,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      archiveCategory,
      setCategoryBudget,
      seedSampleData,
      isModalOpen,
      editingTransaction,
      openAddModal,
      openEditModal,
      closeModal,
      prefillData,
    }),
    [
      transactions,
      categories,
      budgets,
      currency,
      setCurrency,
      isLoading,
      error,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      archiveCategory,
      setCategoryBudget,
      seedSampleData,
      isModalOpen,
      editingTransaction,
      openAddModal,
      openEditModal,
      closeModal,
      prefillData,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider');
  }
  return ctx;
}
