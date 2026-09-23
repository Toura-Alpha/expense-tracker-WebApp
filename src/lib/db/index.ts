import { createRxDatabase, type RxDatabase, type RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import {
  transactionSchema,
  categorySchema,
  budgetSchema,
  recurringRuleSchema,
  type TransactionDocType,
  type CategoryDocType,
  type BudgetDocType,
  type RecurringRuleDocType,
} from './schemas';
import { createLastWriteWinsConflictHandler } from './conflict';

export type TransactionCollection = RxCollection<TransactionDocType>;
export type CategoryCollection = RxCollection<CategoryDocType>;
export type BudgetCollection = RxCollection<BudgetDocType>;
export type RecurringRuleCollection = RxCollection<RecurringRuleDocType>;

export type DatabaseCollections = {
  transactions: TransactionCollection;
  categories: CategoryCollection;
  budgets: BudgetCollection;
  recurring_rules: RecurringRuleCollection;
};

export type AppRxDatabase = RxDatabase<DatabaseCollections>;

let dbPromise: Promise<AppRxDatabase> | null = null;

export async function getDatabase(dbName = 'expense_tracker_db_v2'): Promise<AppRxDatabase | null> {
  // Support both browser environment and Node environments that supply indexedDB (e.g. fake-indexeddb)
  if (typeof window === 'undefined' && typeof globalThis.indexedDB === 'undefined') {
    return null;
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await createRxDatabase<DatabaseCollections>({
        name: dbName,
        storage: getRxStorageDexie(),
        ignoreDuplicate: process.env.NODE_ENV !== 'production',
      });

      await db.addCollections({
        transactions: {
          schema: transactionSchema,
          conflictHandler: createLastWriteWinsConflictHandler<TransactionDocType>('transactions'),
        },
        categories: {
          schema: categorySchema,
          conflictHandler: createLastWriteWinsConflictHandler<CategoryDocType>('categories'),
        },
        budgets: {
          schema: budgetSchema,
          conflictHandler: createLastWriteWinsConflictHandler<BudgetDocType>('budgets'),
        },
        recurring_rules: {
          schema: recurringRuleSchema,
          conflictHandler: createLastWriteWinsConflictHandler<RecurringRuleDocType>('recurring_rules'),
        },
      });

      return db;
    })();
  }

  return dbPromise;
}

export async function closeDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.close();
    dbPromise = null;
  }
}
