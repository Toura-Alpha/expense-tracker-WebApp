import { defaultConflictHandler, type RxConflictHandler, type RxConflictHandlerInput, type WithDeleted } from 'rxdb';
import { syncEventBus } from './events';

/**
 * Last-write-wins conflict handler based on `updated_at`.
 * When master version is newer than or equal to local version, master wins and an event is emitted.
 */
export function createLastWriteWinsConflictHandler<T extends { id: string; updated_at: string; _deleted: boolean }>(
  collectionName: string
): RxConflictHandler<T> {
  return {
    isEqual: defaultConflictHandler.isEqual,
    async resolve(input: RxConflictHandlerInput<T>): Promise<WithDeleted<T>> {
      const master = input.realMasterState;
      const local = input.newDocumentState;

      const masterTime = new Date(master.updated_at || 0).getTime();
      const localTime = new Date(local.updated_at || 0).getTime();

      if (masterTime >= localTime) {
        // Server version wins
        syncEventBus.emitConflict({
          collectionName,
          id: master.id,
          message:
            collectionName === 'transactions'
              ? 'This transaction was updated on another device.'
              : `This ${collectionName.replace(/s$/, '')} was updated on another device.`,
          serverUpdatedAt: master.updated_at,
          localUpdatedAt: local.updated_at,
          timestamp: Date.now(),
        });
        return master;
      }

      // Local version has a strictly newer timestamp
      return local;
    },
  };
}
