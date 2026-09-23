import {
  createRxDatabase,
  addRxPlugin,
  type RxDatabase,
  type RxCollection,
} from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import {
  transactionSchema,
  categorySchema,
  budgetSchema,
  recurringRuleSchema,
  type TransactionDocType,
  type CategoryDocType,
  type BudgetDocType,
  type RecurringRuleDocType,
} from "./schemas";
import { createLastWriteWinsConflictHandler } from "./conflict";

// Enable dev mode plugin in non-production for rich diagnostics
if (process.env.NODE_ENV !== "production") {
  try {
    addRxPlugin(RxDBDevModePlugin);
  } catch {
    // Plugin might already be added
  }
}

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

const globalForRxDB = globalThis as unknown as {
  rxdbPromise?: Promise<AppRxDatabase>;
};

export async function getDatabase(
  dbName = "expense_tracker_db_v2",
): Promise<AppRxDatabase | null> {
  // Support both browser environment and Node environments that supply indexedDB (e.g. fake-indexeddb)
  if (
    typeof window === "undefined" &&
    typeof globalThis.indexedDB === "undefined"
  ) {
    return null;
  }

  if (!globalForRxDB.rxdbPromise) {
    globalForRxDB.rxdbPromise = (async () => {
      const storage =
        process.env.NODE_ENV !== "production"
          ? wrappedValidateAjvStorage({ storage: getRxStorageDexie() })
          : getRxStorageDexie();

      const db = await createRxDatabase<DatabaseCollections>({
        name: dbName,
        storage,
        ignoreDuplicate: true,
      });

      if (!db.transactions) {
        await db.addCollections({
          transactions: {
            schema: transactionSchema,
            conflictHandler:
              createLastWriteWinsConflictHandler<TransactionDocType>(
                "transactions",
              ),
          },
          categories: {
            schema: categorySchema,
            conflictHandler:
              createLastWriteWinsConflictHandler<CategoryDocType>("categories"),
          },
          budgets: {
            schema: budgetSchema,
            conflictHandler:
              createLastWriteWinsConflictHandler<BudgetDocType>("budgets"),
          },
          recurring_rules: {
            schema: recurringRuleSchema,
            conflictHandler:
              createLastWriteWinsConflictHandler<RecurringRuleDocType>(
                "recurring_rules",
              ),
          },
        });
      }

      return db;
    })().catch((err) => {
      globalForRxDB.rxdbPromise = undefined;
      throw err;
    });
  }

  return globalForRxDB.rxdbPromise;
}

export async function closeDatabase(): Promise<void> {
  if (globalForRxDB.rxdbPromise) {
    const db = await globalForRxDB.rxdbPromise;
    await db.close();
    globalForRxDB.rxdbPromise = undefined;
  }
}
