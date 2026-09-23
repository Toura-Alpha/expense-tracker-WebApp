'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/db';
import { syncEngine } from '@/lib/db/sync';
import { syncEventBus } from '@/lib/db/events';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { TransactionDocType } from '@/lib/db/schemas';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export type CreateTransactionInput = Omit<
  TransactionDocType,
  'id' | 'updated_at' | '_deleted' | 'deleted_at'
> & {
  id?: string;
  user_id?: string;
  updated_at?: string;
  deleted_at?: string | null;
  _deleted?: boolean;
};

export function useOfflineMutation() {
  const { isOnline } = useNetworkStatus();
  const [internalStatus, setInternalStatus] = useState<SyncStatus>(() => syncEngine.getStatus().status);
  const [error, setError] = useState<Error | null>(null);

  // Listen to global sync engine status events
  useEffect(() => {
    const unsubscribe = syncEventBus.onStatus((event) => {
      setInternalStatus(event.status);
      if (event.error) {
        setError(event.error);
      }
    });

    return unsubscribe;
  }, []);

  // Compute effective sync status: offline overrides any active/synced state when disconnected
  const syncStatus: SyncStatus = !isOnline ? 'offline' : internalStatus;

  /**
   * Helper to trigger sync if online, or mark offline if disconnected
   */
  const queueSync = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    setInternalStatus('syncing');
    setError(null);

    try {
      const success = await syncEngine.triggerSync();
      if (success) {
        setInternalStatus('synced');
      } else {
        const current = syncEngine.getStatus();
        setInternalStatus(current.status);
        if (current.error) setError(current.error);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setInternalStatus('error');
    }
  }, []);

  /**
   * Optimistically inserts a transaction into RxDB and queues for sync
   */
  const insert = useCallback(
    async (input: CreateTransactionInput): Promise<TransactionDocType> => {
      const db = await getDatabase();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      // Initialize syncEngine if not yet initialized
      await syncEngine.initialize(db);

      const now = new Date().toISOString();
      const doc: TransactionDocType = {
        id:
          input.id ||
          (typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`),
        user_id: input.user_id || 'anonymous_user',
        category_id: input.category_id ?? null,
        amount: typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount,
        currency: input.currency || 'USD',
        merchant_name: input.merchant_name ?? null,
        note: input.note ?? null,
        date: input.date || now,
        is_recurring: Boolean(input.is_recurring),
        receipt_url: input.receipt_url ?? null,
        updated_at: input.updated_at || now,
        deleted_at: null,
        _deleted: false,
      };

      // 1. Immediate optimistic local write to RxDB (Dexie / IndexedDB)
      const insertedDoc = await db.transactions.insert(doc);

      // 2. Queue for replication / background sync
      queueSync();

      return insertedDoc.toJSON() as TransactionDocType;
    },
    [queueSync]
  );

  /**
   * Optimistically updates a transaction in RxDB and queues for sync
   */
  const update = useCallback(
    async (
      id: string,
      patch: Partial<Omit<TransactionDocType, 'id' | '_deleted'>>
    ): Promise<TransactionDocType | null> => {
      const db = await getDatabase();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      await syncEngine.initialize(db);

      const doc = await db.transactions.findOne(id).exec();
      if (!doc) {
        throw new Error(`Transaction with id ${id} not found locally`);
      }

      const updated = await doc.patch({
        ...patch,
        updated_at: new Date().toISOString(),
      });

      queueSync();

      return updated.toJSON() as TransactionDocType;
    },
    [queueSync]
  );

  /**
   * Optimistically soft-deletes a transaction in RxDB and queues for sync
   */
  const remove = useCallback(
    async (id: string): Promise<void> => {
      const db = await getDatabase();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      await syncEngine.initialize(db);

      const doc = await db.transactions.findOne(id).exec();
      const now = new Date().toISOString();

      if (doc) {
        // Soft delete locally mapping to _deleted: true and deleted_at
        await doc.patch({
          _deleted: true,
          deleted_at: now,
          updated_at: now,
        });
      }

      queueSync();
    },
    [queueSync]
  );

  return {
    syncStatus,
    isOnline,
    error,
    insert,
    update,
    remove,
    // Aliases for convenience
    createTransaction: insert,
    updateTransaction: update,
    deleteTransaction: remove,
    triggerSync: queueSync,
  };
}
