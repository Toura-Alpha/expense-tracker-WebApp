import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication';
import type { RxCollection, RxReplicationWriteToMasterRow } from 'rxdb';
import type { SupabaseClient } from '@supabase/supabase-js';
import { syncEventBus } from './events';

export interface ReplicationCheckpoint {
  updated_at: string;
  id: string;
}

export type TableName = 'transactions' | 'categories' | 'budgets' | 'recurring_rules';

/**
 * Maps a row from Supabase into an RxDB document, mapping `deleted_at` to `_deleted`.
 */
export function mapSupabaseRowToRxDoc<T extends { id: string; updated_at: string }>(
  row: Record<string, any>
): T & { _deleted: boolean } {
  const isDeleted = Boolean(row.deleted_at);
  const doc: any = {
    ...row,
    _deleted: isDeleted,
  };

  // Ensure numeric precision is kept as JavaScript number
  if ('amount' in row && typeof row.amount === 'string') {
    doc.amount = parseFloat(row.amount);
  }
  if ('monthly_limit' in row && typeof row.monthly_limit === 'string') {
    doc.monthly_limit = parseFloat(row.monthly_limit);
  }

  return doc;
}

/**
 * Maps an RxDB document to a Supabase table row, mapping `_deleted` to `deleted_at`.
 */
export function mapRxDocToSupabaseRow(doc: Record<string, any>): Record<string, any> {
  const { _deleted, ...row } = doc;
  return {
    ...row,
    deleted_at: _deleted ? row.deleted_at || new Date().toISOString() : null,
  };
}

/**
 * Creates an RxDB replication pipeline for a collection against Supabase.
 */
export function setupCollectionReplication<T extends { id: string; updated_at: string }>(
  collection: RxCollection<T>,
  supabase: SupabaseClient,
  options?: {
    live?: boolean;
    retryTime?: number;
    pullBatchSize?: number;
    pushBatchSize?: number;
  }
): RxReplicationState<T, ReplicationCheckpoint> {
  const tableName = collection.name as TableName;

  const replicationState = replicateRxCollection<T, ReplicationCheckpoint>({
    collection,
    replicationIdentifier: `supabase-sync-${tableName}-v1`,
    live: options?.live ?? true,
    retryTime: options?.retryTime ?? 5000,
    pull: {
      batchSize: options?.pullBatchSize ?? 50,
      async handler(lastCheckpoint, batchSize) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return { documents: [], checkpoint: lastCheckpoint };
        }

        try {
          let query = supabase
            .from(tableName)
            .select('*')
            .order('updated_at', { ascending: true })
            .order('id', { ascending: true })
            .limit(batchSize);

          if (lastCheckpoint?.updated_at) {
            query = query.gt('updated_at', lastCheckpoint.updated_at);
          }

          const { data, error } = await query;

          if (error) {
            console.warn(`[Replication Pull Error: ${tableName}]`, error.message);
            throw error;
          }

          if (!data || data.length === 0) {
            return {
              documents: [],
              checkpoint: lastCheckpoint,
            };
          }

          // Process each pulled document and detect conflict with unsynced local doc
          for (const serverRow of data) {
            const localDoc = await collection.findOne(serverRow.id).exec();
            if (localDoc) {
              const localData: any = localDoc.toJSON();
              const serverTime = new Date(serverRow.updated_at).getTime();
              const localTime = new Date(localData.updated_at).getTime();

              // When server's updated_at is newer than unsynced local change, server version wins
              if (serverTime > localTime) {
                syncEventBus.emitConflict({
                  collectionName: tableName,
                  id: serverRow.id,
                  message:
                    tableName === 'transactions'
                      ? 'This transaction was updated on another device.'
                      : `This ${tableName.replace(/s$/, '')} was updated on another device.`,
                  serverUpdatedAt: serverRow.updated_at,
                  localUpdatedAt: localData.updated_at,
                  timestamp: Date.now(),
                });
              }
            }
          }

          const documents = data.map((row) => mapSupabaseRowToRxDoc<T>(row));
          const lastDoc = documents[documents.length - 1];

          return {
            documents,
            checkpoint: {
              updated_at: lastDoc.updated_at,
              id: lastDoc.id,
            },
          };
        } catch (err) {
          console.warn(`[Sync Pull Handler] ${tableName} error:`, err);
          throw err;
        }
      },
    },
    push: {
      batchSize: options?.pushBatchSize ?? 50,
      async handler(changeRows: RxReplicationWriteToMasterRow<T>[]) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return [];
        }

        const conflicts: any[] = [];

        for (const changeRow of changeRows) {
          const newDoc: any = changeRow.newDocumentState;

          try {
            // Check master state for Last-Write-Wins conflict resolution
            const { data: serverDoc, error: fetchError } = await supabase
              .from(tableName)
              .select('*')
              .eq('id', newDoc.id)
              .maybeSingle();

            if (!fetchError && serverDoc) {
              const serverTime = new Date(serverDoc.updated_at).getTime();
              const localTime = new Date(newDoc.updated_at).getTime();

              if (serverTime > localTime) {
                // Server wins!
                syncEventBus.emitConflict({
                  collectionName: tableName,
                  id: newDoc.id,
                  message:
                    tableName === 'transactions'
                      ? 'This transaction was updated on another device.'
                      : `This ${tableName.replace(/s$/, '')} was updated on another device.`,
                  serverUpdatedAt: serverDoc.updated_at,
                  localUpdatedAt: newDoc.updated_at,
                  timestamp: Date.now(),
                });

                conflicts.push(mapSupabaseRowToRxDoc(serverDoc));
                continue;
              }
            }

            // Local wins or new item: push to Supabase
            const payload = mapRxDocToSupabaseRow(newDoc);
            const { error: upsertError } = await supabase.from(tableName).upsert(payload);

            if (upsertError) {
              console.warn(`[Sync Push Handler] Upsert error for ${tableName}:`, upsertError.message);
              throw upsertError;
            }
          } catch (err) {
            console.warn(`[Sync Push] Error pushing row to ${tableName}:`, err);
            throw err;
          }
        }

        return conflicts;
      },
    },
  });

  return replicationState;
}
