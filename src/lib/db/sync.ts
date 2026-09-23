import type { AppRxDatabase } from './index';
import type { RxCollection } from 'rxdb';
import { setupCollectionReplication, type ReplicationCheckpoint } from './replication';
import { syncEventBus, type SyncStatusState } from './events';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RxReplicationState } from 'rxdb/plugins/replication';
import type { Subscription } from 'rxjs';

export interface SyncEngineStatus {
  status: SyncStatusState;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: Error | null;
}

export class SyncEngine {
  private db: AppRxDatabase | null = null;
  private supabase: SupabaseClient | null = null;
  private replications: Map<string, RxReplicationState<any, ReplicationCheckpoint>> = new Map();
  private subscriptions: Subscription[] = [];
  private activeSyncCount = 0;
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private currentStatus: SyncStatusState = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
  private lastSyncedAt: Date | null = null;
  private lastError: Error | null = null;
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnlineState = true;
    this.updateStatus(this.activeSyncCount > 0 ? 'syncing' : 'synced');
    this.triggerSync().catch((err) => console.warn('[SyncEngine] triggerSync on online failed:', err));
  };

  private handleOffline = () => {
    this.isOnlineState = false;
    this.updateStatus('offline');
  };

  private updateStatus(status: SyncStatusState, error: Error | null = null) {
    this.currentStatus = status;
    if (error) this.lastError = error;
    if (status === 'synced') this.lastSyncedAt = new Date();

    syncEventBus.emitStatus({
      status,
      error: this.lastError,
      lastSyncedAt: this.lastSyncedAt,
    });
  }

  public async initialize(db: AppRxDatabase, supabaseClient?: SupabaseClient): Promise<void> {
    if (this.initialized && this.db === db) {
      return;
    }

    this.db = db;
    this.supabase = supabaseClient || createClient();

    // Clean up previous replication subscriptions if any
    this.destroyReplications();

    const collections: RxCollection<any>[] = [db.transactions, db.categories, db.budgets, db.recurring_rules];

    for (const collection of collections) {
      const rep = setupCollectionReplication(collection, this.supabase, {
        live: true,
        retryTime: 5000,
      });

      this.replications.set(collection.name, rep);

      // Listen to active state changes
      const activeSub = rep.active$.subscribe((isActive) => {
        if (!this.isOnlineState) {
          this.updateStatus('offline');
          return;
        }

        if (isActive) {
          this.activeSyncCount++;
          this.updateStatus('syncing');
        } else {
          this.activeSyncCount = Math.max(0, this.activeSyncCount - 1);
          if (this.activeSyncCount === 0 && this.currentStatus === 'syncing') {
            this.updateStatus('synced');
          }
        }
      });
      this.subscriptions.push(activeSub);

      // Listen to replication errors
      const errorSub = rep.error$.subscribe((err) => {
        console.warn(`[SyncEngine] Error in ${collection.name} replication:`, err);
        if (this.isOnlineState) {
          this.updateStatus('error', err instanceof Error ? err : new Error(String(err)));
        }
      });
      this.subscriptions.push(errorSub);
    }

    this.initialized = true;

    if (!this.isOnlineState) {
      this.updateStatus('offline');
    } else {
      this.updateStatus('synced');
    }
  }

  public async triggerSync(): Promise<boolean> {
    if (!this.isOnlineState) {
      this.updateStatus('offline');
      return false;
    }

    if (this.replications.size === 0) {
      return false;
    }

    this.updateStatus('syncing');

    try {
      for (const rep of this.replications.values()) {
        rep.reSync();
      }
      return true;
    } catch (err) {
      console.warn('[SyncEngine] triggerSync failed:', err);
      this.updateStatus('error', err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }

  public getStatus(): SyncEngineStatus {
    return {
      status: this.currentStatus,
      isOnline: this.isOnlineState,
      isSyncing: this.activeSyncCount > 0,
      lastSyncedAt: this.lastSyncedAt,
      error: this.lastError,
    };
  }

  public getReplication(collectionName: string) {
    return this.replications.get(collectionName);
  }

  public destroyReplications() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];

    for (const rep of this.replications.values()) {
      try {
        rep.cancel();
      } catch (err) {
        console.warn('[SyncEngine] Error cancelling replication:', err);
      }
    }
    this.replications.clear();
    this.initialized = false;
  }
}

export const syncEngine = new SyncEngine();
