export interface ConflictEvent {
  collectionName: string;
  id: string;
  message: string;
  serverUpdatedAt?: string;
  localUpdatedAt?: string;
  timestamp: number;
}

export type SyncStatusState = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncStatusEvent {
  status: SyncStatusState;
  error?: Error | null;
  lastSyncedAt?: Date | null;
}

type ConflictListener = (event: ConflictEvent) => void;
type StatusListener = (event: SyncStatusEvent) => void;

class SyncEventBus {
  private conflictListeners: Set<ConflictListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  public emitConflict(event: ConflictEvent): void {
    for (const listener of this.conflictListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in conflict listener:', err);
      }
    }
  }

  public onConflict(listener: ConflictListener): () => void {
    this.conflictListeners.add(listener);
    return () => {
      this.conflictListeners.delete(listener);
    };
  }

  public emitStatus(event: SyncStatusEvent): void {
    for (const listener of this.statusListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    }
  }

  public onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
}

export const syncEventBus = new SyncEventBus();
