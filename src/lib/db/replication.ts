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
import { toValidUUID, DEFAULT_DEMO_USER_ID, isValidUUID } from '@/lib/utils';

export function mapRxDocToSupabaseRow(doc: Record<string, any>): Record<string, any> {
  const { _deleted, ...row } = doc;
  const payload: Record<string, any> = {
    ...row,
    deleted_at: _deleted ? row.deleted_at || new Date().toISOString() : null,
  };

  if (payload.id) payload.id = toValidUUID(payload.id);
  if (payload.user_id) payload.user_id = toValidUUID(payload.user_id);
  if (payload.category_id) payload.category_id = toValidUUID(payload.category_id);
  if (payload.template_transaction_id) payload.template_transaction_id = toValidUUID(payload.template_transaction_id);

  return payload;
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
            console.warn(`[Replication Pull Warning: ${tableName}]`, error.message);
            // Handle JWT time skew (PGRST303) or auth/RLS pauses gracefully without crashing RxDB
            if (error.code === 'PGRST303' || error.code === 'PGRST301' || error.code === '42501') {
              return {
                documents: [],
                checkpoint: lastCheckpoint,
              };
            }
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
        } catch (err: any) {
          if (err?.code === 'PGRST303' || err?.code === 'PGRST301' || err?.code === '42501') {
            return { documents: [], checkpoint: lastCheckpoint };
          }
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
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id;

        // If no authenticated user session exists, skip pushing to remote Supabase to prevent RLS violations
        if (!currentUserId) {
          return [];
        }

        for (const changeRow of changeRows) {
          const newDoc: any = changeRow.newDocumentState;
          const targetId = toValidUUID(newDoc.id);

          try {
            // Check master state for Last-Write-Wins conflict resolution
            const { data: serverDoc, error: fetchError } = await supabase
              .from(tableName)
              .select('*')
              .eq('id', targetId)
              .maybeSingle();

            if (!fetchError && serverDoc) {
              const serverTime = new Date(serverDoc.updated_at).getTime();
              const localTime = new Date(newDoc.updated_at).getTime();

              if (serverTime > localTime) {
                // Server wins!
                syncEventBus.emitConflict({
                  collectionName: tableName,
                  id: targetId,
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
            payload.user_id = currentUserId; // Always bind payload to active authenticated user's ID for RLS!

            const { error: upsertError } = await supabase.from(tableName).upsert(payload);

            if (upsertError) {
              console.warn(`[Sync Push Handler] Upsert error for ${tableName}:`, upsertError.message);
              if (upsertError.code === '42501' || upsertError.code === 'PGRST303') {
                continue;
              }
              throw upsertError;
            }
          } catch (err: any) {
            if (err?.code === '42501' || err?.code === 'PGRST303') {
              console.warn(`[Sync Push] Auth/RLS error ignored for ${tableName}:`, err.message);
              continue;
            }
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
