import { getDatabase } from '@/lib/db';
import type { TransactionDocType } from '@/lib/db/schemas';

export async function addTransaction(transaction: TransactionDocType) {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database is not initialized or running in server environment');
  }
  return db.transactions.insert(transaction);
}

export async function getAllTransactions(): Promise<TransactionDocType[]> {
  const db = await getDatabase();
  if (!db) return [];
  const docs = await db.transactions.find().exec();
  return docs.map((doc) => doc.toJSON());
}
